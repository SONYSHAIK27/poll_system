const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const Poll = require('./models/Poll');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Root API route (optional health check)
app.get('/', (req, res) => {
    res.send('Polling System Backend is running.');
});

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://sonyshaik027:S0ny027%40@cluster0.zitqgzq.mongodb.net/livepolling?retryWrites=true&w=majority&appName=Cluster0', {
    serverSelectionTimeoutMS: 20000 
})
.then(() => {
    console.log('MongoDB connected');

    let currentPoll = null;
    let currentPollDoc = null; // MongoDB document for the current poll
    let answeredStudents = new Set();
    let allStudents = new Set();
    let pollTimer = null;
    const studentIdToName = new Map();

    // History API: list polls
    app.get('/api/polls', async (req, res) => {
      try {
        const polls = await Poll.find({}).sort({ createdAt: -1 }).lean();
        res.json(polls);
      } catch (e) {
        console.error('Failed to fetch polls', e);
        res.status(500).json({ error: 'Failed to fetch polls' });
      }
    });

    // Start listening for Socket.IO connections ONLY AFTER the database is ready
    io.on('connection', (socket) => {
        console.log('A new client connected:', socket.id);
        allStudents.add(socket.id);

        // Send current students list to the newly connected client (e.g., teacher)
        socket.emit('students:list', Array.from(studentIdToName, ([id, name]) => ({ id, name })));

        // Allow clients to request the latest list on demand
        socket.on('students:get', () => {
          socket.emit('students:list', Array.from(studentIdToName, ([id, name]) => ({ id, name })));
        });

        // Chat: relay messages and simple bot reply
        socket.on('chat:message', (message) => {
          io.emit('chat:message', message);
          const text = (message.text || '').toLowerCase();
          let reply = null;
          if (text.includes('hello') || text.includes('hi')) {
            reply = { sender: 'Helper Bot', text: 'Hi! How can I help you today?' };
          } else if (text.includes('result') || text.includes('score')) {
            reply = { sender: 'Helper Bot', text: 'Results update in real-time after you submit.' };
          } else if (text.includes('time') || text.includes('timer')) {
            reply = { sender: 'Helper Bot', text: 'The poll timer is set by the teacher for each question.' };
          } else if (text.includes('help')) {
            reply = { sender: 'Helper Bot', text: 'You can ask a question here, or submit your answer on the left.' };
          } else {
            reply = { sender: 'Helper Bot', text: "Got it. I've forwarded your message to everyone." };
          }
          setTimeout(() => io.emit('chat:message', reply), 400);
        });

        // Receive student names when they join
        socket.on('student:join', ({ name }) => {
          studentIdToName.set(socket.id, name || 'Student');
          io.emit('students:list', Array.from(studentIdToName, ([id, name]) => ({ id, name })));
        });

        // Allow teacher to remove a student
        socket.on('student:kick', (studentId) => {
          const target = io.sockets.sockets.get(studentId);
          if (target) {
            target.emit('student:kicked');
            target.disconnect(true);
          }
        });
    
        // When a teacher asks a new question
        socket.on('poll:create', async (pollData) => {
            answeredStudents.clear();
            const pollTime = Number(pollData.pollTime) || 60;
            currentPoll = {
                question: pollData.question,
                options: pollData.options.map(opt => ({ text: opt.text, votes: 0 })),
                totalStudents: allStudents.size,
                pollTime,
            };

            try {
              // Persist to DB
              currentPollDoc = await Poll.create({
                question: currentPoll.question,
                options: currentPoll.options,
              });
            } catch (e) {
              console.error('Failed to save poll', e);
            }
            
            io.emit('poll:question', currentPoll);

            // Start the timer for the poll based on teacher selection
            clearTimeout(pollTimer);
            pollTimer = setTimeout(async () => {
                io.emit('question:timerExpired', currentPoll);
                console.log('Poll timer expired. Results sent.');
            }, pollTime * 1000);
        });
    
        // When a student submits an answer
        socket.on('poll:answer', async (answerData) => {
            if (currentPoll && !answeredStudents.has(socket.id)) {
                answeredStudents.add(socket.id);
                const answeredOption = currentPoll.options.find(opt => opt.text === answerData.answer);
                if (answeredOption) {
                    answeredOption.votes++;
                    // Persist vote increment in DB as well
                    try {
                      if (currentPollDoc) {
                        const idx = currentPoll.options.findIndex(opt => opt.text === answerData.answer);
                        const path = `options.${idx}.votes`;
                        await Poll.updateOne({ _id: currentPollDoc._id }, { $inc: { [path]: 1 } });
                      }
                    } catch (e) {
                      console.error('Failed to update poll vote', e);
                    }
                }
                
                io.emit('poll:update', currentPoll);
                
                // If all students have answered, stop the timer and show results
                if (answeredStudents.size === allStudents.size) {
                    clearTimeout(pollTimer);
                    io.emit('question:timerExpired', currentPoll);
                }
            }
        });
    
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            allStudents.delete(socket.id);
            answeredStudents.delete(socket.id);
            studentIdToName.delete(socket.id);
            io.emit('students:list', Array.from(studentIdToName, ([id, name]) => ({ id, name })));
        });
    });

    // Start the Express server
    server.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
})
.catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
});