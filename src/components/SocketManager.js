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
    // Use local server for development, mock connection for production
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? null // No real backend for now - will use localStorage fallback
      : "http://localhost:5000";
    
    if (serverUrl) {
      console.log("🔌 Attempting to connect to:", serverUrl);
      
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
    } else {
      // Production mode - no real backend, use localStorage fallback
      console.log("🌐 Production mode - using localStorage fallback");
      setConnectionStatus('failed'); // This will trigger polling fallback
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


