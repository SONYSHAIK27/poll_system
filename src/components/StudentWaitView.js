import React, { useEffect, useState } from 'react';
import { useSocket } from './SocketManager';
import { usePolling } from './PollingManager';
import { useNavigate } from 'react-router-dom';
import '../styles/StudentWaitView.css';

const StudentWaitView = () => {
  const { socket, connectionStatus, isSocketConnected } = useSocket();
  const { currentPoll, joinAsStudent, isConnected } = usePolling();
  const navigate = useNavigate();
  const [studentId] = useState(() => `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Handle Socket.IO connection
  useEffect(() => {
    if (isSocketConnected && socket) {
      console.log("✅ Using Socket.IO connection");
      
      const handlePollQuestion = (pollData) => {
        console.log("🎯 Received a new poll via Socket.IO:", pollData);
        navigate('/student/poll', { state: { pollData } });
      };

      const handleKicked = () => {
        console.log("🚫 Student was kicked out");
        navigate('/kicked-out');
      };

      socket.on('poll:question', handlePollQuestion);
      socket.on('student:kicked', handleKicked);
      
      return () => {
        socket.off('poll:question', handlePollQuestion);
        socket.off('student:kicked', handleKicked);
      };
    }
  }, [isSocketConnected, socket, navigate]);

  // Handle polling fallback
  useEffect(() => {
    if (connectionStatus === 'failed' || (!isSocketConnected && connectionStatus !== 'connecting')) {
      console.log("🔄 Using polling fallback");
      
      // Join as student using polling
      const studentName = sessionStorage.getItem('studentName') || 'Student';
      joinAsStudent(studentName, studentId);
    }
  }, [connectionStatus, isSocketConnected, joinAsStudent, studentId]);

  // Handle new poll from polling
  useEffect(() => {
    if (currentPoll && !isSocketConnected) {
      console.log("🎯 Received a new poll via polling:", currentPoll);
      navigate('/student/poll', { state: { pollData: currentPoll } });
    }
  }, [currentPoll, isSocketConnected, navigate]);

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