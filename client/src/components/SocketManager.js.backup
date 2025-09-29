import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();
const newSocket = io('http://localhost:5000');
export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketManager = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000'); // Connect to our backend server
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Successfully connected to the backend server!');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from the server.');
    });

    return () => newSocket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};