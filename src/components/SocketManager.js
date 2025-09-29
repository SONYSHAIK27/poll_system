import React, { createContext, useContext, useEffect, useState } from "react";
import PollingService from '../services/pollingService';

// Check if we're in production
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// Always use polling service - no Socket.IO
console.log('🌐 Using polling service for all environments');

const SocketContext = createContext();
export const useSocket = () => {
  const context = useContext(SocketContext);
  return context?.socket || null;
};

export const SocketManager = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'failed'

  useEffect(() => {
    console.log("🔍 Environment check:", {
      hostname: window.location.hostname,
      isProduction: isProduction
    });
    
    // ALWAYS use polling service - no Socket.IO
    console.log("🌐 Using polling service for all environments");
    const service = new PollingService();
    setSocket(service);
    setConnectionStatus('connected');
    service.startPolling();
    
    return () => {
      service.disconnect();
    };
  }, []);

  const value = {
    socket,
    connectionStatus,
    isSocketConnected: connectionStatus === 'connected'
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};


