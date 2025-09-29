import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from './SocketManager';
import ChatModal from './ChatModal';
import '../styles/StudentPollView.css';

const StudentPollView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const { pollData: initialPollData } = location.state || {};
  
  const [pollData, setPollData] = useState(initialPollData);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState((initialPollData && initialPollData.pollTime) || 60); 
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const studentName = sessionStorage.getItem('studentName') || 'Student';

  // If page refreshed or navigated directly without poll data, go to waiting room
  useEffect(() => {
    if (!initialPollData) {
      navigate('/student-wait', { replace: true });
    }
  }, [initialPollData, navigate]);

  useEffect(() => {
    if (!socket) return;
    
    const handlePollUpdate = (updatedPollData) => {
      setPollData(updatedPollData);
    };

    const handleTimerExpired = () => {
      setIsTimeUp(true);
    };

    const handleNewPoll = (newPoll) => {
      setPollData(newPoll);
      setSelectedOption(null);
      setIsTimeUp(false);
      setTimeLeft(newPoll.pollTime || 60);
    };

    const handleKicked = () => {
      navigate('/kicked-out');
    };

    socket.on('poll:update', handlePollUpdate);
    socket.on('question:timerExpired', handleTimerExpired);
    socket.on('poll:question', handleNewPoll);
    socket.on('student:kicked', handleKicked);

    const timer = setInterval(() => {
      setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timer);
      socket.off('poll:update', handlePollUpdate);
      socket.off('question:timerExpired', handleTimerExpired);
      socket.off('poll:question', handleNewPoll);
      socket.off('student:kicked', handleKicked);
    };
  }, [socket, navigate, initialPollData]);

  const handleSubmit = () => {
    if (socket && selectedOption !== null) {
      // Find the index of the selected option
      const selectedIndex = pollData.options.findIndex(option => option.text === selectedOption);
      socket.emit('poll:answer', {
        answer: selectedIndex,
      });
      setSelectedOption('submitted');
    }
  };

  if (!pollData) {
    return null;
  }
  
  const totalVotes = pollData.options.reduce((sum, option) => sum + option.votes, 0);
  // Keep this student in selection mode until THEY submit
  const showResults = selectedOption === 'submitted';

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  return (
    <div className="poll-container">
      <div className="poll-card">
        <div className="question-header">
          <h2 className="question-label">Question {pollData.number || 1}</h2>
          {!isTimeUp && (
            <div className="timer-display">
              <span className="timer-icon">⏰</span>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
        
        <div className="question-box">
          <p>{pollData.question}</p>
        </div>
        
        <div className="options-list">
          {pollData.options.map((option, index) => {
            const isSelected = selectedOption === option.text;
            return (
              <div 
                key={index} 
                className={`option-item ${showResults ? 'results-mode' : 'selection-mode'} ${isSelected ? 'selected' : ''}`}
                onClick={() => !showResults && setSelectedOption(option.text)}
              >
                {showResults ? (
                  <>
                    <span className="option-label">
                      <span className="option-number">{index + 1}</span> {option.text}
                    </span>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{ width: `${totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="vote-percentage">
                      {totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0}%
                    </span>
                  </>
                ) : (
                  <div className="option-selection">
                    <span className="option-number small">{index + 1}</span>
                    <span className="option-selection-text">{option.text}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {!showResults && (
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={selectedOption === null}
          >
            Submit
          </button>
        )}
      </div>

      <div className="chat-icon" onClick={toggleChat}>💬</div>
      {isChatOpen && <ChatModal onClose={toggleChat} studentName={studentName} />}

      {showResults && (
        <p className="wait-message">Wait for the teacher to ask a new question..</p>
      )}
    </div>
  );
};

export default StudentPollView;