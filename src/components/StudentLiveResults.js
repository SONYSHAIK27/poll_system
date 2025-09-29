import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from './SocketManager';
import { usePolling } from './PollingManager';
import '../styles/TeacherLiveResults.css';
import ChatModal from './ChatModal';

const StudentLiveResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, isSocketConnected } = useSocket();
  const { currentPoll, getPollResults } = usePolling();
  const { pollData, studentName } = location.state || {}; // New: get studentName
  const [livePollData, setLivePollData] = useState(pollData);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Handle Socket.IO updates (local development)
  useEffect(() => {
    if (isSocketConnected && socket) {
      console.log("📊 StudentLiveResults using Socket.IO");
      
      const handlePollUpdate = (updatedPoll) => {
        setLivePollData(updatedPoll);
      };

      const handleKicked = () => {
        navigate('/kicked-out');
      };

      socket.on('poll:update', handlePollUpdate);
      socket.on('student:kicked', handleKicked);
      
      return () => {
        socket.off('poll:update', handlePollUpdate);
        socket.off('student:kicked', handleKicked);
      };
    }
  }, [isSocketConnected, socket, navigate]);

  // Handle polling updates (production)
  useEffect(() => {
    if (!isSocketConnected && currentPoll) {
      console.log("📊 StudentLiveResults using polling - received poll update:", currentPoll);
      setLivePollData(currentPoll);
    }
  }, [currentPoll, isSocketConnected]);

  // Poll for updates in production
  useEffect(() => {
    if (!isSocketConnected) {
      const interval = setInterval(async () => {
        const results = await getPollResults();
        if (results && results.poll) {
          setLivePollData(results.poll);
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [isSocketConnected, getPollResults]);

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  if (!livePollData) {
    return (
      <div className="live-results-container">
        <p>No active poll to display results for.</p>
      </div>
    );
  }

  const totalVotes = livePollData.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <div className="live-results-container">
      <div className="top-right-section">
        <button className="view-history-button" onClick={() => alert("Viewing Poll History (Bonus Feature)")}>
          <span className="eye-icon">👁️</span> View Poll history
        </button>
      </div>
      <div className="results-card">
        <h2 className="results-question-label">Question</h2>
        <div className="question-display-box">
          <p className="question-text">{livePollData.question}</p>
        </div>
        <div className="options-list">
          {livePollData.options.map((option, index) => (
            <div key={index} className="option-result-item">
              <span className="option-label">
                <span className="option-number">{index + 1}</span> {option.text}
              </span>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <span className="vote-percentage">
                {totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="wait-message">Wait for the teacher to ask a new question..</p>

      <div className="chat-icon" onClick={handleToggleChat}>
        💬
      </div>

      {isChatOpen && <ChatModal onClose={handleToggleChat} studentName={studentName} />}
    </div>
  );
};

export default StudentLiveResults;