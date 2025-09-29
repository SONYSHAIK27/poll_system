import { 
    getCurrentPoll, 
    setCurrentPoll, 
    getAnsweredStudents, 
    addAnsweredStudent 
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
        if (req.method === 'POST') {
            const { answer, studentId } = req.body;
            
            const currentPoll = getCurrentPoll();
            
            if (currentPoll && currentPoll.options && currentPoll.options[answer] && !getAnsweredStudents().has(studentId)) {
                // Add student to answered set
                addAnsweredStudent(studentId);
                
                // Update the poll with the new answer
                currentPoll.options[answer].votes++;
                setCurrentPoll(currentPoll);
                
                res.status(200).json({ success: true, poll: currentPoll });
            } else if (getAnsweredStudents().has(studentId)) {
                res.status(400).json({ success: false, message: 'Student has already answered this poll' });
            } else {
                res.status(400).json({ success: false, message: 'Poll not found or invalid answer' });
            }
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in poll-answer API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
