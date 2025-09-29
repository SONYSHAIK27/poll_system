import React, { createContext, useContext, useEffect, useState } from "react";

const PollingContext = createContext();
export const usePolling = () => {
  return useContext(PollingContext);
};

export const PollingManager = ({ children }) => {
  const [currentPoll, setCurrentPoll] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Check if we're in production mode
  const isProduction = window.location.hostname !== 'localhost';
  
  const API_BASE = isProduction 
    ? null // Use localStorage for production
    : 'http://localhost:5000';
  
  console.log("🔍 PollingManager environment check:", {
    hostname: window.location.hostname,
    isProduction: isProduction,
    API_BASE: API_BASE
  });

  // Polling function to check for new polls
  const pollForUpdates = async () => {
    if (API_BASE) {
      // Local development - use real API
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
    } else {
      // Production - use localStorage
      try {
        const pollData = localStorage.getItem('currentPoll');
        if (pollData) {
          const poll = JSON.parse(pollData);
          if (poll && poll.question) {
            setCurrentPoll(poll);
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error('localStorage polling error:', error);
        setIsConnected(false);
      }
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
    if (API_BASE) {
      // Local development - use real API
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
    } else {
      // Production - use localStorage
      try {
        const pollData = localStorage.getItem('currentPoll');
        if (pollData) {
          const poll = JSON.parse(pollData);
          if (poll.options[answer]) {
            poll.options[answer].votes++;
            localStorage.setItem('currentPoll', JSON.stringify(poll));
            setCurrentPoll(poll);
            return { success: true, poll };
          }
        }
        return { success: false, error: 'No active poll' };
      } catch (error) {
        console.error('Error submitting answer:', error);
        return { success: false, error: error.message };
      }
    }
  };

  // Join as student
  const joinAsStudent = async (name, studentId) => {
    if (API_BASE) {
      // Local development - use real API
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
    } else {
      // Production - use localStorage
      try {
        console.log('🎓 Student joined via localStorage:', name);
        setIsConnected(true);
        startPolling();
        return { success: true };
      } catch (error) {
        console.error('Error joining:', error);
        return { success: false, error: error.message };
      }
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
    if (API_BASE) {
      // Local development - use real API
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
    } else {
      // Production - use localStorage
      try {
        const poll = {
          question: pollData.question,
          options: pollData.options.map(opt => ({ text: opt.text, votes: 0 })),
          pollTime: pollData.pollTime || 60,
          createdAt: new Date().toISOString(),
          id: Date.now().toString()
        };
        
        localStorage.setItem('currentPoll', JSON.stringify(poll));
        setCurrentPoll(poll);
        
        // Save to poll history
        const pollHistory = JSON.parse(localStorage.getItem('pollHistory') || '[]');
        pollHistory.unshift(poll); // Add to beginning
        localStorage.setItem('pollHistory', JSON.stringify(pollHistory));
        
        console.log('📝 Poll created via localStorage:', poll);
        return { success: true, poll };
      } catch (error) {
        console.error('Error creating poll:', error);
        return { success: false, error: error.message };
      }
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
