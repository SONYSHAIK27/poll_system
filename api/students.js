// In-memory storage for students
let allStudents = new Set();
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
            // Get all students
            const studentList = Array.from(studentIdToName.entries()).map(([id, name]) => ({ id, name }));
            res.status(200).json(studentList);
        } else if (req.method === 'POST') {
            // Add a new student
            const { name, studentId } = req.body;
            
            if (name && studentId) {
                allStudents.add(studentId);
                studentIdToName.set(studentId, name);
                
                res.status(200).json({ success: true, studentId, name });
            } else {
                res.status(400).json({ error: 'Name and studentId are required' });
            }
        } else if (req.method === 'DELETE') {
            // Remove a student
            const { studentId } = req.body;
            
            if (studentId) {
                allStudents.delete(studentId);
                studentIdToName.delete(studentId);
                
                res.status(200).json({ success: true, message: 'Student removed' });
            } else {
                res.status(400).json({ error: 'studentId is required' });
            }
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in students API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
