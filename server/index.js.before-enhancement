const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const Poll = require('./models/Poll');

const app = express();
const server = http.createServer(app);

// Configure CORS for Vercel deployment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);
    
    // Allow all vercel.app domains
    if (origin.includes('vercel.app')) return callback(null, true);
    
    return callback(null, true); // Allow all for now
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

const io = socketIo(server, {
  cors: corsOptions,
  allowEIO3: true,
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 5000;
app.use(cors(corsOptions));
app.use(express.json());

// Root API route (optional health check)
app.get('/', (req, res) => {
    res.send('Polling System Backend is running.');
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sonyshaik027:S0ny027%40@cluster0.zitqgzq.mongodb.net/livepolling?retryWrites=true&w=majority&appName=Cluster0', {
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
            const polls = await Poll.find().sort({ createdAt: -1 });
            res.json(polls);
        } catch (error) {
            console.error('Error fetching polls:', error);
            res.status(500).json({ error: 'Failed to fetch polls' });
        }
    });

    // API endpoint to get current poll
    app.get('/api/current-poll', (req, res) => {
        res.json(currentPoll);
    });

    // API endpoint to submit answer
    app.post('/api/poll/answer', (req, res) => {
        const { answer, studentId } = req.body;
        if (currentPoll && !answeredStudents.has(studentId)) {
            answeredStudents.add(studentId);
            currentPoll.options[answer].votes++;
            
            // Update the database
            if (currentPollDoc) {
                currentPollDoc.options[answer].votes++;
                currentPollDoc.save();
            }
            
            res.json({ success: true, poll: currentPoll });
        } else {
            res.json({ success: false, message: 'Poll not found or already answered' });
        }
    });

    io.on('connection', (socket) => {
        console.log('A new client connected:', socket.id);

        // When a student joins
        socket.on('student:join', ({ name }) => {
            allStudents.add(socket.id);
            studentIdToName.set(socket.id, name);
            console.log(`Student ${name} joined with ID: ${socket.id}`);
            
            // Notify teacher about the new student
            socket.broadcast.emit('student:joined', {
                id: socket.id,
                name: name
            });
        });

        // When a teacher joins
        socket.on('teacher:join', () => {
            console.log('Teacher joined with ID:', socket.id);
            
            // Send current student list to teacher
            socket.emit('students:list', Array.from(studentIdToName.entries()).map(([id, name]) => ({ id, name })));
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
        socket.on('poll:answer', ({ answer }) => {
            if (currentPoll && !answeredStudents.has(socket.id)) {
                answeredStudents.add(socket.id);
                currentPoll.options[answer].votes++;
                
                // Update the database
                if (currentPollDoc) {
                    currentPollDoc.options[answer].votes++;
                    currentPollDoc.save();
                }
                
                // Broadcast updated results to all clients
                io.emit('poll:update', currentPoll);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            allStudents.delete(socket.id);
            studentIdToName.delete(socket.id);
            answeredStudents.delete(socket.id);
        });
    });

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
});

module.exports = app;

