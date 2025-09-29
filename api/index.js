const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const Poll = require('../server/models/Poll');

const app = express();

// Configure CORS for Vercel deployment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow any Vercel deployment
    if (origin.includes('.vercel.app') || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Allow the current domain
    if (origin === process.env.VERCEL_URL || origin === `https://${process.env.VERCEL_URL}`) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all origins for now
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

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

    // AI Response Generation Function
    function generateAIResponse(message, sender) {
        const lowerMessage = message.toLowerCase();
        
        // Greeting responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return `Hello ${sender}! I'm your AI assistant for the live polling system. How can I help you today?`;
        }
        
        // Help requests
        if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
            return `I can help you with various things related to the polling system:
            
• Ask questions about how to use the system
• Get help with poll creation and management
• Learn about features and functionality
• Troubleshoot any issues you might be having

What specific help do you need?`;
        }
        
        // Poll-related questions
        if (lowerMessage.includes('poll') || lowerMessage.includes('question') || lowerMessage.includes('vote')) {
            return `Here's how the polling system works:

**For Teachers:**
• Create polls with multiple choice questions
• Set time limits for polls
• View live results as students vote
• Manage student participants

**For Students:**
• Join polls using your name
• Answer questions by selecting options
• View live results after voting
• Chat with the AI assistant (that's me!)

Is there something specific about polls you'd like to know more about?`;
        }
        
        // Technical support
        if (lowerMessage.includes('error') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
            return `I'm here to help with technical issues! Here are some common solutions:

• **Connection problems**: Try refreshing the page
• **Can't see polls**: Make sure you're connected to the same session
• **Voting issues**: Check if the poll is still active
• **Chat problems**: Ensure your internet connection is stable

Can you describe the specific issue you're experiencing?`;
        }
        
        // Feature questions
        if (lowerMessage.includes('feature') || lowerMessage.includes('what can') || lowerMessage.includes('capabilities')) {
            return `The live polling system includes these features:

🎯 **Real-time Polling**: Create and participate in live polls
📊 **Live Results**: See results update in real-time
👥 **Student Management**: Teachers can manage participants
💬 **AI Assistant**: Get help and ask questions (that's me!)
📈 **Poll History**: View past polls and results
⏱️ **Timer Support**: Set time limits for polls

What feature would you like to learn more about?`;
        }
        
        // Thank you responses
        if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
            return `You're welcome! I'm always here to help. Feel free to ask me anything about the polling system or if you need assistance with anything else!`;
        }
        
        // Time-related questions
        if (lowerMessage.includes('time') || lowerMessage.includes('timer') || lowerMessage.includes('duration')) {
            return `The polling system supports customizable timers:

⏱️ **Timer Features:**
• Teachers can set poll duration (default: 60 seconds)
• Automatic poll closure when time expires
• Real-time countdown display
• Results are shown immediately after timer expires

**How to set timers:**
• When creating a poll, specify the duration in seconds
• The system will automatically close the poll when time runs out
• All participants will see the final results

Need help with anything else about timers or polls?`;
        }
        
        // Default response for unrecognized messages
        return `I understand you're asking about "${message}". I'm an AI assistant designed to help with the live polling system. 

I can help you with:
• How to use the polling features
• Troubleshooting issues
• Understanding system capabilities
• General questions about the platform

Could you rephrase your question or ask about something specific I can help with?`;
    }

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

    // Create HTTP server and Socket.IO instance
    const server = http.createServer(app);
    const io = socketIo(server, {
        cors: corsOptions,
        allowEIO3: true,
        transports: ['polling', 'websocket']
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

    // Handle chat messages
    socket.on('chat:message', (message) => {
        console.log('Chat message received:', message);
        // Broadcast the message to all connected clients
        io.emit('chat:message', message);
    });

        // Handle AI chat requests
        socket.on('ai:chat', async (data) => {
            try {
                const { message, sender } = data;
                console.log('AI chat request:', message);
                
                // Generate AI response based on the message
                const aiResponse = generateAIResponse(message, sender);
                
                // Send AI response back to the sender
                socket.emit('ai:response', {
                    sender: 'AI Assistant',
                    text: aiResponse,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error processing AI chat:', error);
                socket.emit('ai:response', {
                    sender: 'AI Assistant',
                    text: 'Sorry, I encountered an error. Please try again.',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Handle request for student list
        socket.on('students:get', () => {
            const studentList = Array.from(studentIdToName.entries()).map(([id, name]) => ({ id, name }));
            socket.emit('students:list', studentList);
        });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        allStudents.delete(socket.id);
        studentIdToName.delete(socket.id);
        answeredStudents.delete(socket.id);
    });
    });

    // Export the app for Vercel
    module.exports = app;
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
});
