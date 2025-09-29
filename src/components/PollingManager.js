import React, { createContext, useContext, useEffect, useState } from "react";

const PollingContext = createContext();
export const usePolling = () => {
  return useContext(PollingContext);
};

export const PollingManager = ({ children }) => {
  const [currentPoll, setCurrentPoll] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:5000';

  // Polling function to check for new polls
  const pollForUpdates = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/current-poll`);
      if (response.ok) {
        const poll = await response.json();
        if (poll && poll.question) {
          setCurrentPoll(poll);
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
      setIsConnected(false);
    }
  };

  // Start polling
  const startPolling = () => {
    console.log('🔄 Starting polling fallback');
    pollForUpdates(); // Initial poll
    const interval = setInterval(pollForUpdates, 2000); // Poll every 2 seconds
    setPollingInterval(interval);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Submit answer
  const submitAnswer = async (answer, studentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/poll/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer, studentId }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setCurrentPoll(result.poll);
        return { success: true, poll: result.poll };
      }
      return { success: false, error: 'Failed to submit answer' };
    } catch (error) {
      console.error('Error submitting answer:', error);
      return { success: false, error: error.message };
    }
  };

  // Join as student
  const joinAsStudent = async (name, studentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/student/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, studentId }),
      });
      
      if (response.ok) {
        setIsConnected(true);
        startPolling();
        return { success: true };
      }
      return { success: false, error: 'Failed to join' };
    } catch (error) {
      console.error('Error joining:', error);
      return { success: false, error: error.message };
    }
  };

  // Leave as student
  const leaveAsStudent = async (studentId) => {
    try {
      await fetch(`${API_BASE}/api/student/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });
      setIsConnected(false);
      stopPolling();
    } catch (error) {
      console.error('Error leaving:', error);
    }
  };

  // Create poll (teacher)
  const createPoll = async (pollData) => {
    try {
      const response = await fetch(`${API_BASE}/api/poll/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pollData),
      });
      
      if (response.ok) {
        const result = await response.json();
        setCurrentPoll(result.poll);
        return { success: true, poll: result.poll };
      }
      return { success: false, error: 'Failed to create poll' };
    } catch (error) {
      console.error('Error creating poll:', error);
      return { success: false, error: error.message };
    }
  };

  // Get poll results
  const getPollResults = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/poll/results`);
      if (response.ok) {
        const results = await response.json();
        return results;
      }
      return null;
    } catch (error) {
      console.error('Error getting results:', error);
      return null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const value = {
    currentPoll,
    isConnected,
    submitAnswer,
    joinAsStudent,
    leaveAsStudent,
    createPoll,
    getPollResults,
    startPolling,
    stopPolling
  };

  return (
    <PollingContext.Provider value={value}>
      {children}
    </PollingContext.Provider>
  );
};
