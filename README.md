# Live Polling System

A real-time interactive polling system built with React and Node.js, designed for educational environments where teachers can create polls and students can participate in real-time.

##  Features

### For Teachers
- **Create Polls**: Design custom questions with multiple choice options
- **Timer Control**: Set poll duration (60, 120, or 180 seconds)
- **Real-time Results**: View live voting results as students submit answers
- **Student Management**: Monitor connected students and remove disruptive participants
- **Poll History**: Access historical poll data and results
- **Chat System**: Communicate with students through integrated chat
- **Correct Answer Marking**: Mark which options are correct for educational purposes

### For Students
- **Join Sessions**: Enter with a custom name to participate
- **Real-time Voting**: Submit answers and see live results
- **Interactive Interface**: Clean, intuitive poll interface with timer
- **Chat Participation**: Ask questions and communicate with teacher/peers
- **Live Updates**: See results update in real-time as classmates vote

### Technical Features
- **Real-time Communication**: WebSocket-based live updates using Socket.IO
- **Database Persistence**: MongoDB integration for poll history
- **Responsive Design**: Modern UI that works on desktop and mobile
- **Session Management**: Persistent student sessions with name storage
- **Auto-timer**: Automatic poll expiration and result display
- **Helper Bot**: AI-powered chat assistance for common questions

##  Technology Stack

### Frontend
- **React 19.1.1** - Modern React with hooks
- **React Router DOM 7.9.3** - Client-side routing
- **Socket.IO Client 4.8.1** - Real-time communication
- **CSS3** - Custom styling with modern design

### Backend
- **Node.js** - Server runtime
- **Express 5.1.0** - Web framework
- **Socket.IO 4.8.1** - Real-time bidirectional communication
- **MongoDB** - Database for poll persistence
- **Mongoose 8.18.2** - MongoDB object modeling
- **CORS 2.8.5** - Cross-origin resource sharing

##  Project Structure

`
live-polling-system/
 client/                 # React frontend
    public/            # Static assets
    src/
       components/    # React components
          ChatModal.js
          KickedOutView.js
          RoleSelection.js
          SocketManager.js
          StudentLiveResults.js
          StudentNameEntry.js
          StudentPollView.js
          StudentView.js
          StudentWaitView.js
          TeacherLiveResults.js
          TeacherPollCreation.js
          TeacherPollHistory.js
          TeacherResultsWrapper.js
       styles/        # CSS stylesheets
       index.js       # App entry point
    package.json
 server/                # Node.js backend
    models/
       Poll.js        # MongoDB poll schema
    index.js           # Server entry point
    package.json
 README.md
`

##  Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone the repository**
   `ash
   git clone https://github.com/SONYSHAIK27/poll_system.git
   cd poll_system
   `

2. **Install server dependencies**
   `ash
   cd server
   npm install
   `

3. **Install client dependencies**
   `ash
   cd ../client
   npm install
   `

4. **Configure MongoDB**
   - Update the MongoDB connection string in server/index.js
   - Replace the connection string with your MongoDB Atlas credentials

5. **Start the application**

   **Terminal 1 - Start the server:**
   `ash
   cd server
   npm start
   `
   Server will run on http://localhost:5000

   **Terminal 2 - Start the client:**
   `ash
   cd client
   npm start
   `
   Client will run on http://localhost:3000

##  Usage Guide

### For Teachers

1. **Access the System**
   - Open http://localhost:3000
   - Select "I'm a Teacher"
   - You'll be taken to the poll creation interface

2. **Create a Poll**
   - Set the time limit (60, 120, or 180 seconds)
   - Enter your question
   - Add multiple choice options
   - Mark correct answers (optional)
   - Click "Ask Question"

3. **Monitor Results**
   - View real-time voting results
   - See student participation
   - Access chat for student questions
   - Remove disruptive students if needed

4. **View History**
   - Click "View Poll History" to see past polls
   - Review previous questions and results

### For Students

1. **Join a Session**
   - Open http://localhost:3000
   - Select "I'm a Student"
   - Enter your name
   - Wait for the teacher to start a poll

2. **Participate in Polls**
   - Answer questions when they appear
   - View live results after submitting
   - Use chat to ask questions
   - Wait for the next question

##  API Endpoints

### REST API
- GET / - Health check
- GET /api/polls - Retrieve poll history

### Socket.IO Events

#### Client to Server
- student:join - Student joins with name
- poll:create - Teacher creates new poll
- poll:answer - Student submits answer
- chat:message - Send chat message
- student:kick - Teacher removes student
- students:get - Request student list

#### Server to Client
- poll:question - New poll available
- poll:update - Live poll results update
- question:timerExpired - Poll timer expired
- students:list - Updated student list
- chat:message - New chat message
- student:kicked - Student removed notification

##  UI Components

### Core Components
- **RoleSelection**: Initial role selection (Teacher/Student)
- **TeacherPollCreation**: Poll creation interface
- **TeacherLiveResults**: Real-time results display
- **StudentPollView**: Student voting interface
- **StudentWaitView**: Waiting room for students
- **ChatModal**: Integrated chat system
- **SocketManager**: WebSocket connection management

### Styling
- Modern, responsive design
- Clean typography and spacing
- Interactive elements with hover effects
- Mobile-friendly interface
- Consistent color scheme

##  Security Features

- **CORS Configuration**: Proper cross-origin setup
- **Input Validation**: Client and server-side validation
- **Session Management**: Secure student session handling
- **Rate Limiting**: Built-in Socket.IO rate limiting
- **Error Handling**: Comprehensive error management

##  Deployment

### Environment Variables
Create a .env file in the server directory:
`
PORT=5000
MONGODB_URI=your_mongodb_connection_string
`

### Production Build
`ash
# Build client for production
cd client
npm run build

# Start server in production
cd ../server
npm start
`

##  Contributing

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add some amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

##  License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

##  Author

**Sony Shaik**
- GitHub: [@SONYSHAIK27](https://github.com/SONYSHAIK27)
- Repository: [poll_system](https://github.com/SONYSHAIK27/poll_system)

##  Acknowledgments

- Socket.IO for real-time communication
- React team for the amazing framework
- MongoDB for database services
- Express.js for the web framework

##  Support

If you encounter any issues or have questions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Contact the maintainer

---

**Happy Polling! **
