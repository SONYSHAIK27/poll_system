import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext();
export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketManager = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'failed'

  useEffect(() => {
    // Use local server for development, deployed server for production
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin
      : "http://localhost:5000";
    
    console.log("🔌 Attempting to connect to:", serverUrl);
    
    const newSocket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      timeout: 10000, // Reduced timeout for faster fallback
      forceNew: true,
      autoConnect: true,
      reconnection: false // Disable reconnection to fail faster
    });
    setSocket(newSocket);

    // Set a timeout to detect if connection fails
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


