// Import the shared state from current-poll API
// Note: In a real deployment, these would be in a shared database or Redis cache

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
            
            // For now, we'll need to get the current poll from the main server
            // This is a simplified version - in production you'd use a shared database
            try {
                const pollResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:5000'}/api/current-poll`);
                const currentPoll = await pollResponse.json();
                
                if (currentPoll && currentPoll.options && currentPoll.options[answer]) {
                    // Update the poll with the new answer
                    currentPoll.options[answer].votes++;
                    
                    res.status(200).json({ success: true, poll: currentPoll });
                } else {
                    res.status(400).json({ success: false, message: 'Poll not found or invalid answer' });
                }
            } catch (fetchError) {
                console.error('Error fetching current poll:', fetchError);
                res.status(500).json({ success: false, message: 'Error processing answer' });
            }
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in poll-answer API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
