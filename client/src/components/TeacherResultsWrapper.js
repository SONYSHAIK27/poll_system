import React, { useState, useEffect } from 'react';
import { useSocket } from './SocketManager';
import TeacherLiveResults from './TeacherLiveResults';
import TeacherPollCreation from './TeacherPollCreation';
import '../styles/TeacherLiveResults.css';

const TeacherResultsWrapper = () => {
  const socket = useSocket();
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

  const handleAskQuestion = (pollData) => {
    console.log('🔄 Ask question button clicked', { pollData, socket: !!socket });
    if (socket) {
      console.log('📤 Emitting poll:create event');
      socket.emit('poll:create', pollData);
      setCurrentPoll(pollData);
      console.log('✅ Poll state updated');
    } else {
      console.error('❌ Socket is null!');
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