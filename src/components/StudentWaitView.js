import React, { useEffect } from 'react';
import { useSocket } from './SocketManager';
import { useNavigate } from 'react-router-dom';
import '../styles/StudentWaitView.css';

const StudentWaitView = () => {
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) {
      console.log("❌ No socket available in StudentWaitView");
      return;
    }

    console.log("✅ Socket available in StudentWaitView, setting up listeners");
    
    // Listen for a new poll from the teacher
    const handlePollQuestion = (pollData) => {
      console.log("🎯 Received a new poll:", pollData);
      // When a poll is received, navigate to the student's poll page
      navigate('/student/poll', { state: { pollData } });
    };

    const handleKicked = () => {
      console.log("🚫 Student was kicked out");
      navigate('/kicked-out');
    };

    // Add debugging for connection events
    const handleConnect = () => {
      console.log("✅ Socket connected in StudentWaitView");
    };

    const handleDisconnect = () => {
      console.log("❌ Socket disconnected in StudentWaitView");
    };

    socket.on('poll:question', handlePollQuestion);
    socket.on('student:kicked', handleKicked);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    // Clean up the event listener to prevent it from being added multiple times
    return () => {
      console.log("Cleaning up StudentWaitView socket listeners");
      socket.off('poll:question', handlePollQuestion);
      socket.off('student:kicked', handleKicked);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
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