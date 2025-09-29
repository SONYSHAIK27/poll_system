// Polling service for production (Vercel-compatible)
class PollingService {
    constructor() {
        this.baseUrl = window.location.origin;
        this.pollInterval = null;
        this.currentPoll = null;
        this.listeners = new Map();
        this.isPolling = false;
    }

    // Start polling for updates
    startPolling(interval = 2000) {
        if (this.isPolling) return;
        
        this.isPolling = true;
        this.pollInterval = setInterval(async () => {
            try {
                await this.checkForUpdates();
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, interval);
        
        console.log('🔄 Started polling for updates');
    }

    // Stop polling
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.isPolling = false;
        console.log('⏹️ Stopped polling');
    }

    // Check for poll updates
    async checkForUpdates() {
        try {
            const response = await fetch(`${this.baseUrl}/api/current-poll`);
            if (response.ok) {
                const poll = await response.json();
                if (poll && JSON.stringify(poll) !== JSON.stringify(this.currentPoll)) {
                    this.currentPoll = poll;
                    this.emit('poll:update', poll);
                }
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }

    // Get current poll
    async getCurrentPoll() {
        try {
            const response = await fetch(`${this.baseUrl}/api/current-poll`);
            if (response.ok) {
                const poll = await response.json();
                this.currentPoll = poll;
                return poll;
            }
        } catch (error) {
            console.error('Error getting current poll:', error);
        }
        return null;
    }

    // Create a new poll
    async createPoll(pollData) {
        try {
            const response = await fetch(`${this.baseUrl}/api/current-poll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pollData),
            });
            
            if (response.ok) {
                const result = await response.json();
                this.currentPoll = result.poll;
                this.emit('poll:created', result.poll);
                return result;
            }
        } catch (error) {
            console.error('Error creating poll:', error);
        }
        return null;
    }

    // Submit an answer
    async submitAnswer(answer, studentId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/poll-answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ answer, studentId }),
            });
            
            if (response.ok) {
                const result = await response.json();
                this.currentPoll = result.poll;
                this.emit('poll:answer', result);
                return result;
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
        return null;
    }

    // Join as student
    async joinStudent(name, studentId) {
        try {
            // Store student ID in session storage
            sessionStorage.setItem('studentId', studentId);
            sessionStorage.setItem('studentName', name);
            
            const response = await fetch(`${this.baseUrl}/api/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, studentId }),
            });
            
            if (response.ok) {
                const result = await response.json();
                // Emit the event that components expect
                this.emit('student:joined', result);
                return result;
            }
        } catch (error) {
            console.error('Error joining as student:', error);
        }
        return null;
    }

    // Get students list
    async getStudents() {
        try {
            const response = await fetch(`${this.baseUrl}/api/students`);
            if (response.ok) {
                const students = await response.json();
                this.emit('students:list', students);
                return students;
            }
        } catch (error) {
            console.error('Error getting students:', error);
        }
        return [];
    }

    // Remove a student
    async removeStudent(studentId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/students`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ studentId }),
            });
            
            if (response.ok) {
                const result = await response.json();
                this.emit('student:removed', { studentId });
                return result;
            }
        } catch (error) {
            console.error('Error removing student:', error);
        }
        return null;
    }

    // Socket.IO compatible methods
    emit(event, data) {
        console.log(`📤 Emitting event: ${event}`, data);
        
        // Handle specific events
        if (event === 'student:join') {
            // For student:join, we need to handle it synchronously for the UI
            const studentId = this.generateStudentId();
            sessionStorage.setItem('studentId', studentId);
            sessionStorage.setItem('studentName', data.name);
            
            // Emit the joined event immediately using the event system
            if (this.listeners.has('student:joined')) {
                this.listeners.get('student:joined').forEach(callback => {
                    try {
                        callback({ studentId, name: data.name });
                    } catch (error) {
                        console.error('Error in student:joined callback:', error);
                    }
                });
            }
            
            // Also call the async method in background
            this.joinStudent(data.name, studentId);
        } else if (event === 'teacher:join') {
            this.getStudents();
        } else if (event === 'poll:create') {
            this.createPoll(data);
        } else if (event === 'poll:answer') {
            this.submitAnswer(data.answer, this.getCurrentStudentId());
        } else if (event === 'student:kick') {
            this.removeStudent(data);
        } else if (event === 'students:get') {
            this.getStudents();
        } else if (event === 'chat:message') {
            // Handle chat messages if needed
            console.log('Chat message:', data);
        } else if (event === 'ai:chat') {
            // Handle AI chat if needed
            console.log('AI chat:', data);
        } else if (event === 'poll:question') {
            // Handle new poll question
            this.emit('poll:update', data);
        } else if (event === 'question:timerExpired') {
            // Handle timer expiration
            this.emit('poll:update', this.currentPoll);
        } else if (event === 'student:kicked') {
            // Handle student being kicked
            console.log('Student kicked:', data);
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Helper methods
    generateStudentId() {
        return 'student_' + Math.random().toString(36).substr(2, 9);
    }

    getCurrentStudentId() {
        return sessionStorage.getItem('studentId') || this.generateStudentId();
    }

    // Disconnect (cleanup)
    disconnect() {
        this.stopPolling();
        this.listeners.clear();
        this.currentPoll = null;
        console.log('🔌 Polling service disconnected');
    }
}

export default PollingService;
