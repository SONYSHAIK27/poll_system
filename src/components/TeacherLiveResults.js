import React, { useState, useEffect } from 'react';
import { useSocket } from './SocketManager';
import { useNavigate } from 'react-router-dom';
import '../styles/TeacherLiveResults.css';
import ChatModal from './ChatModal';

const TeacherLiveResults = ({ initialPollData, onStartNewPoll }) => {
  const socket = useSocket();
  const [livePollData, setLivePollData] = useState(initialPollData);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;
    socket.on('poll:update', (updatedPoll) => {
      setLivePollData(updatedPoll);
    });
    return () => {
      socket.off('poll:update');
    };
  }, [socket]);
  
  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const goToHistory = () => {
    navigate('/teacher/history');
  };

  // Student management now handled in ChatModal participants tab
    
  if (!livePollData) {
    return (
      <div className="live-results-container">
        <p className="loading-message">Waiting for poll data...</p>
      </div>
    );
  }

  const totalVotes = livePollData.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <div className="live-results-container">
      <div className="top-right-section">
        <button className="view-history-button" onClick={goToHistory}>
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
        <button className="ask-new-question-button" onClick={onStartNewPoll}>
          + Ask a new question
        </button>
      </div>

      {/* Students panel removed - now using ChatModal participants tab for better UX */}
      
      <div className="chat-icon" onClick={handleToggleChat}>💬</div>
      {isChatOpen && <ChatModal onClose={handleToggleChat} />}
    </div>
  );
};

export default TeacherLiveResults;