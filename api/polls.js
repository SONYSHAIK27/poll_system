import mongoose from 'mongoose';
import Poll from '../server/models/Poll.js';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sonyshaik027:S0ny027%40@cluster0.zitqgzq.mongodb.net/livepolling?retryWrites=true&w=majority&appName=Cluster0', {
    serverSelectionTimeoutMS: 20000 
});

import { 
    getCurrentPoll, 
    setCurrentPoll, 
    clearAnsweredStudents, 
    getAllStudents 
} from './shared-state.js';

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
            clearAnsweredStudents();
            
            const pollData = {
                question,
                options: options.map(opt => ({ text: opt.text, votes: 0 })),
                totalStudents: getAllStudents().size,
                pollTime: pollTime || 60,
            };

            // Save to database
            const pollDoc = await Poll.create({
                question: pollData.question,
                options: pollData.options,
            });

            pollData._id = pollDoc._id;
            setCurrentPoll(pollData);

            res.status(200).json({ success: true, poll: pollData });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in polls API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
