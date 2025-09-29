// This is a fallback API endpoint for when Socket.IO doesn't work
// It provides basic polling functionality for Vercel deployment

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Poll = require('../server/models/Poll');

const app = express();

// Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    if (origin.includes('.vercel.app') || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

// In-memory storage for Vercel (since we can't use persistent connections)
let currentPoll = null;
let pollAnswers = new Map(); // studentId -> answer
let connectedStudents = new Set();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sonyshaik027:S0ny027%40@cluster0.zitqgzq.mongodb.net/livepolling?retryWrites=true&w=majority&appName=Cluster0', {
    serverSelectionTimeoutMS: 20000 
})
.then(() => {
    console.log('MongoDB connected for API fallback');
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
});

// API Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Polling System API Fallback is running',
        currentPoll: currentPoll,
        connectedStudents: Array.from(connectedStudents),
        totalAnswers: pollAnswers.size
    });
});

// Get current poll
app.get('/api/current-poll', (req, res) => {
    res.json(currentPoll);
});

// Create a new poll (teacher)
app.post('/api/poll/create', async (req, res) => {
    try {
        const { question, options, pollTime } = req.body;
        
        // Clear previous answers
        pollAnswers.clear();
        
        currentPoll = {
            question,
            options: options.map(opt => ({ text: opt.text, votes: 0 })),
            pollTime: pollTime || 60,
            createdAt: new Date(),
            id: Date.now().toString()
        };

        // Save to database
        try {
            await Poll.create({
                question: currentPoll.question,
                options: currentPoll.options,
            });
        } catch (e) {
            console.error('Failed to save poll to DB:', e);
        }

        res.json({ success: true, poll: currentPoll });
    } catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Failed to create poll' });
    }
});

// Submit answer (student)
app.post('/api/poll/answer', (req, res) => {
    try {
        const { answer, studentId } = req.body;
        
        if (!currentPoll) {
            return res.status(400).json({ error: 'No active poll' });
        }
        
        if (pollAnswers.has(studentId)) {
            return res.status(400).json({ error: 'Already answered' });
        }
        
        // Record the answer
        pollAnswers.set(studentId, answer);
        
        // Update poll results
        if (currentPoll.options[answer]) {
            currentPoll.options[answer].votes++;
        }
        
        res.json({ 
            success: true, 
            poll: currentPoll,
            totalAnswers: pollAnswers.size
        });
    } catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({ error: 'Failed to submit answer' });
    }
});

// Student join
app.post('/api/student/join', (req, res) => {
    const { name, studentId } = req.body;
    connectedStudents.add(studentId);
    res.json({ success: true, studentId, name });
});

// Student leave
app.post('/api/student/leave', (req, res) => {
    const { studentId } = req.body;
    connectedStudents.delete(studentId);
    pollAnswers.delete(studentId);
    res.json({ success: true });
});

// Get poll results
app.get('/api/poll/results', (req, res) => {
    res.json({
        poll: currentPoll,
        totalAnswers: pollAnswers.size,
        connectedStudents: Array.from(connectedStudents)
    });
});

// Get all polls (history)
app.get('/api/polls', async (req, res) => {
    try {
        const polls = await Poll.find().sort({ createdAt: -1 });
        res.json(polls);
    } catch (error) {
        console.error('Error fetching polls:', error);
        res.status(500).json({ error: 'Failed to fetch polls' });
    }
});

module.exports = app;
