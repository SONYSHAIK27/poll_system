const mongoose = require('mongoose');
const Poll = require('../server/models/Poll');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sonyshaik027:S0ny027%40@cluster0.zitqgzq.mongodb.net/livepolling?retryWrites=true&w=majority&appName=Cluster0', {
    serverSelectionTimeoutMS: 20000 
});

// In-memory storage for current poll (since serverless functions are stateless)
// In production, you might want to use Redis or another persistent store
let currentPoll = null;
let answeredStudents = new Set();
let allStudents = new Set();
let pollTimer = null;
const studentIdToName = new Map();

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'GET') {
            // Get all polls
            const polls = await Poll.find().sort({ createdAt: -1 });
            res.status(200).json(polls);
        } else if (req.method === 'POST') {
            // Create a new poll
            const { question, options, pollTime } = req.body;
            
            // Clear previous poll data
            answeredStudents.clear();
            
            const pollData = {
                question,
                options: options.map(opt => ({ text: opt.text, votes: 0 })),
                totalStudents: allStudents.size,
                pollTime: pollTime || 60,
            };

            // Save to database
            const pollDoc = await Poll.create({
                question: pollData.question,
                options: pollData.options,
            });

            currentPoll = pollData;
            currentPoll._id = pollDoc._id;

            res.status(200).json({ success: true, poll: currentPoll });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in polls API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
