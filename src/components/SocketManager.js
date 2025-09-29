import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext();
export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketManager = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const serverUrl = "https://poll-system-3a4pxp95p-sonys-projects-eca9a033.vercel.app";
    const newSocket = io(serverUrl, {
      transports: ['polling'],
      upgrade: false,
      rememberUpgrade: false,
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


