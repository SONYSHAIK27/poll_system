import React, { createContext, useContext, useEffect, useState } from "react";
import { createMockIO } from '../utils/socketMock';
import PollingService from '../services/pollingService';

// Only import Socket.IO in development
let io = null;
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  try {
    // Try to dynamically import Socket.IO
    const socketIO = require('socket.io-client');
    io = socketIO;
    console.log('🔌 Socket.IO loaded for development');
  } catch (e) {
    console.log('Socket.IO not available, using mock');
    io = createMockIO();
  }
} else {
  // Production - use mock to prevent Socket.IO from loading
  console.log('🌐 Production mode - Socket.IO disabled');
  io = createMockIO();
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
    // Check if we're in production mode
    const isProduction = window.location.hostname !== 'localhost';
    
    console.log("🔍 Environment check:", {
      hostname: window.location.hostname,
      isProduction: isProduction,
      ioAvailable: !!io
    });
    
    // For production, ALWAYS use polling service (never Socket.IO)
    if (isProduction) {
      console.log("🌐 Production mode - using polling service for Vercel");
      const service = new PollingService();
      setPollingService(service);
      setSocket(service); // Use polling service as socket replacement
      setConnectionStatus('connected');
      service.startPolling();
      return () => {
        service.disconnect();
      };
    }
    
    // Development mode - try Socket.IO first, fallback to polling
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
        if (connectionStatus === 'connecting') {
          console.log("⏰ Socket.IO connection timeout - switching to polling fallback");
          setConnectionStatus('failed');
          // Switch to polling service
          const service = new PollingService();
          setPollingService(service);
          setSocket(service);
          setConnectionStatus('connected');
          service.startPolling();
        }
      }, 15000);

      newSocket.on("connect", () => {
        console.log("✅ Successfully connected to the backend server via Socket.IO!");
        console.log("Socket ID:", newSocket.id);
        setConnectionStatus('connected');
        clearTimeout(connectionTimeout);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from the server. Reason:", reason);
        setConnectionStatus('failed');
      });

      newSocket.on("connect_error", (error) => {
        console.error("❌ Socket.IO connection error:", error);
        console.error("Error details:", error.message);
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
        console.log("🧹 Cleaning up socket connection");
        clearTimeout(connectionTimeout);
        newSocket.disconnect();
      };
    } else {
      // Socket.IO not available in development - use polling
      console.log("🌐 Socket.IO not available in development - using polling service");
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


