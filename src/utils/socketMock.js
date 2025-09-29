// Mock Socket.IO for production - does nothing
export const createMockSocket = () => {
  return {
    on: () => {},
    off: () => {},
    emit: () => {},
    disconnect: () => {},
    connect: () => {},
    id: 'mock-socket-id'
  };
};

export const createMockIO = () => {
  return () => createMockSocket();
};
