import React, { createContext, useContext } from "react";
import { getSocket } from "@/lib/socket";

interface SocketContextValue {
  socket: ReturnType<typeof getSocket>;
}

const SocketContext = createContext<SocketContextValue>({
  socket: getSocket(),
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketNotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Sockets removed to prevent network delays and achieve fast API responses
  return (
    <SocketContext.Provider value={{ socket: getSocket() }}>
      {children}
    </SocketContext.Provider>
  );
};

