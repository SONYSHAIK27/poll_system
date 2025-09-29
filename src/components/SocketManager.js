import React, { createContext, useContext, useEffect, useState } from "react";
import { createMockIO } from '../utils/socketMock';
import PollingService from '../services/pollingService';

// Import Socket.IO for both development and production
let io = null;
if (typeof window !== 'undefined') {
  try {
    // Try to dynamically import Socket.IO
    const socketIO = require('socket.io-client');
    io = socketIO;
    console.log('🔌 Socket.IO loaded');
  } catch (e) {
    console.log('Socket.IO not available, using mock');
    io = createMockIO();
  }
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
    
    // For production, use polling service
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
    
    // Only try Socket.IO in development
    if (!io) {
      console.log("🌐 Socket.IO not available - using polling fallback");
      const service = new PollingService();
      setPollingService(service);
      setSocket(service);
      setConnectionStatus('connected');
      service.startPolling();
      return () => {
        service.disconnect();
      };
    }
    
    // Development mode - try Socket.IO
    const serverUrl = "http://localhost:5000";
    console.log("🔌 Development mode - attempting to connect to:", serverUrl);
    
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
        console.log("⏰ Socket.IO connection timeout - will use polling fallback");
        setConnectionStatus('failed');
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
    });

    return () => {
      console.log("🧹 Cleaning up socket connection");
      clearTimeout(connectionTimeout);
      newSocket.disconnect();
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


