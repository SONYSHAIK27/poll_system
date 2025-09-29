import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext();
export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketManager = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Use local server for development, deployed server for production
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin
      : "http://localhost:5000";
    
    console.log("Attempting to connect to:", serverUrl);
    
    const newSocket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Successfully connected to the backend server!");
      console.log("Socket ID:", newSocket.id);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from the server. Reason:", reason);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      console.error("Error details:", error.message);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Reconnected after", attemptNumber, "attempts");
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("❌ Reconnection error:", error);
    });

    return () => {
      console.log("Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};


