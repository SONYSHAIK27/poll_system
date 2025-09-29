import React, { createContext, useContext, useEffect, useState } from "react";
import PollingService from '../services/pollingService';

// Check if we're in production
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// Only try to load Socket.IO in development
let io = null;
if (!isProduction) {
  try {
    // Try to dynamically import Socket.IO only in development
    const socketIO = require('socket.io-client');
    io = socketIO;
    console.log('🔌 Socket.IO loaded for development');
  } catch (e) {
    console.log('Socket.IO not available in development, will use polling');
    io = null;
  }
} else {
  // Production - never load Socket.IO
  console.log('🌐 Production mode - Socket.IO completely disabled');
  io = null;
}

const SocketContext = createContext();
export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketManager = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'failed'
  const [pollingService, setPollingService] = useState(null);

  useEffect(() => {
    console.log("🔍 Environment check:", {
      hostname: window.location.hostname,
      isProduction: isProduction,
      ioAvailable: !!io
    });
    
    // ALWAYS use polling service in production
    if (isProduction) {
      console.log("🌐 Production mode - using polling service for Vercel");
      const service = new PollingService();
      setPollingService(service);
      setSocket(service);
      setConnectionStatus('connected');
      service.startPolling();
      return () => {
        service.disconnect();
      };
    }
    
    // Development mode - try Socket.IO if available, otherwise use polling
    if (io && typeof io === 'function') {
      console.log("🔌 Development mode - attempting Socket.IO connection");
      const serverUrl = "http://localhost:5000";
      
      const newSocket = io(serverUrl, {
        transports: ['polling', 'websocket'],
        timeout: 10000,
        forceNew: true,
        autoConnect: true,
        reconnection: false
      });
      setSocket(newSocket);

      const connectionTimeout = setTimeout(() => {
        console.log("⏰ Socket.IO connection timeout - switching to polling");
        setConnectionStatus('failed');
        // Switch to polling service
        const service = new PollingService();
        setPollingService(service);
        setSocket(service);
        setConnectionStatus('connected');
        service.startPolling();
      }, 15000);

      newSocket.on("connect", () => {
        console.log("✅ Successfully connected via Socket.IO!");
        setConnectionStatus('connected');
        clearTimeout(connectionTimeout);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("❌ Socket.IO disconnected:", reason);
        setConnectionStatus('failed');
      });

      newSocket.on("connect_error", (error) => {
        console.error("❌ Socket.IO connection error:", error);
        setConnectionStatus('failed');
        clearTimeout(connectionTimeout);
        // Switch to polling service on error
        const service = new PollingService();
        setPollingService(service);
        setSocket(service);
        setConnectionStatus('connected');
        service.startPolling();
      });

      return () => {
        clearTimeout(connectionTimeout);
        newSocket.disconnect();
      };
    } else {
      // Socket.IO not available - use polling
      console.log("🌐 Using polling service (Socket.IO not available)");
      const service = new PollingService();
      setPollingService(service);
      setSocket(service);
      setConnectionStatus('connected');
      service.startPolling();
      return () => {
        service.disconnect();
      };
    }
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


