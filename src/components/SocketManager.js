import React, { createContext, useContext, useEffect, useState } from "react";

// Only import Socket.IO in development
let io = null;
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  try {
    io = require('socket.io-client');
  } catch (e) {
    console.log('Socket.IO not available');
  }
}

const SocketContext = createContext();
export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketManager = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'failed'

  useEffect(() => {
    // Check if we're in production mode
    const isProduction = window.location.hostname !== 'localhost';
    
    console.log("🔍 Environment check:", {
      hostname: window.location.hostname,
      isProduction: isProduction,
      ioAvailable: !!io
    });
    
    if (isProduction || !io) {
      // Production mode or Socket.IO not available - use localStorage fallback
      console.log("🌐 Production mode - using localStorage fallback (Socket.IO disabled)");
      setConnectionStatus('failed'); // This will trigger polling fallback
      setSocket(null); // Ensure no socket is set
      return;
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


