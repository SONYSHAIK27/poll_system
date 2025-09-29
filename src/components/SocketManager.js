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
    const newSocket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      timeout: 20000,
      forceNew: true
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Successfully connected to the backend server!");
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from the server.");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    return () => newSocket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};


