import React, { useEffect, useState } from 'react';
import { useSocket } from './SocketManager';
import { useNavigate } from 'react-router-dom';
import '../styles/StudentWaitView.css';

const StudentWaitView = () => {
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    // Listen for a new poll from the teacher
    socket.on('poll:question', (pollData) => {
      console.log("Received a new poll:", pollData);
      // When a poll is received, navigate to the student's poll page
      navigate('/student/poll', { state: { pollData } });
    });

    return () => {
      socket.off('poll:question');
    };
  }, [socket, navigate]);

  return (
    <div className="centered-container">
      <div className="centered-content">
        <span className="logo-badge">Intervue Poll</span>
        <div className="loading-spinner"></div>
        <h1>Wait for the teacher to ask questions...</h1>
      </div>
    </div>
  );
};

export default StudentWaitView;