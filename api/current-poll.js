// In-memory storage for current poll (for Vercel API compatibility)
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
            // Get current poll
            res.status(200).json(currentPoll);
        } else if (req.method === 'POST') {
            // Create a new poll
            const { question, options, pollTime } = req.body;
            
            // Clear previous poll data
            answeredStudents.clear();
            
            currentPoll = {
                question,
                options: options.map(opt => ({ text: opt.text, votes: 0 })),
                totalStudents: allStudents.size,
                pollTime: pollTime || 60,
                createdAt: new Date().toISOString()
            };

            // Clear any existing timer
            if (pollTimer) {
                clearTimeout(pollTimer);
            }

            // Set timer for poll expiration
            if (pollTime && pollTime > 0) {
                pollTimer = setTimeout(() => {
                    console.log('Poll timer expired via API');
                    // Timer expired - poll remains active but can be manually closed
                }, pollTime * 1000);
            }

            res.status(200).json({ success: true, poll: currentPoll });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in current-poll API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
