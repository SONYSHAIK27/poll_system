import React, { useState, useEffect } from 'react';
import { useSocket } from './SocketManager';
import { usePolling } from './PollingManager';
import TeacherLiveResults from './TeacherLiveResults';
import TeacherPollCreation from './TeacherPollCreation';
import '../styles/TeacherLiveResults.css';

const TeacherResultsWrapper = () => {
  const { socket, isSocketConnected } = useSocket();
  const { createPoll } = usePolling();
  const [currentPoll, setCurrentPoll] = useState(null);

  // Hydrate from sessionStorage so going back from history restores results view
  useEffect(() => {
    const saved = sessionStorage.getItem('currentPoll');
    if (saved) {
      try {
        setCurrentPoll(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Persist current poll
  useEffect(() => {
    if (currentPoll) {
      sessionStorage.setItem('currentPoll', JSON.stringify(currentPoll));
    } else {
      sessionStorage.removeItem('currentPoll');
    }
  }, [currentPoll]);

  const handleAskQuestion = async (pollData) => {
    if (isSocketConnected && socket) {
      // Use Socket.IO for local development
      console.log("📝 Creating poll via Socket.IO");
      socket.emit('poll:create', pollData);
      setCurrentPoll(pollData);
    } else {
      // Use polling system for production
      console.log("📝 Creating poll via polling system");
      const result = await createPoll(pollData);
      if (result.success) {
        setCurrentPoll(result.poll);
      } else {
        console.error("Failed to create poll:", result.error);
      }
    }
  };
  
  const startNewPoll = () => {
    setCurrentPoll(null);
  };

  if (currentPoll) {
    return <TeacherLiveResults initialPollData={currentPoll} onStartNewPoll={startNewPoll} />;
  }

  return <TeacherPollCreation onAskQuestion={handleAskQuestion} />;
};

export default TeacherResultsWrapper;