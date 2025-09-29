import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './SocketManager';
import '../styles/StudentNameEntry.css';

const StudentNameEntry = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const socket = useSocket();

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleContinue = () => {
    if (name.trim() !== '') {
      if (socket) {
        socket.emit('student:join', { name });
      }
      sessionStorage.setItem('studentName', name);
      navigate('/student-wait', { state: { studentName: name } });
    }
  };

  return (
    <div className="entry-container">
      <div className="entry-card">
        <span className="logo-badge">Intervue Poll</span>
        <h1>Let's Get Started</h1>
        <p>If you're a student, you'll be able to submit your answers, participate in live polls, and see how your responses compare with your classmates!</p>
        <div className="input-group">
          <label htmlFor="name-input">Enter your Name</label>
          <input
            id="name-input"
            type="text"
            placeholder="Rahul Bajaj"
            value={name}
            onChange={handleNameChange}
          />
        </div>
        <button
          className="continue-button"
          onClick={handleContinue}
          disabled={name.trim() === ''}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StudentNameEntry;