// In-memory storage for current poll
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
        if (req.method === 'POST') {
            const { answer, studentId } = req.body;
            
            if (currentPoll && !answeredStudents.has(studentId)) {
                answeredStudents.add(studentId);
                currentPoll.options[answer].votes++;
                
                res.status(200).json({ success: true, poll: currentPoll });
            } else {
                res.status(400).json({ success: false, message: 'Poll not found or already answered' });
            }
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in poll-answer API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
