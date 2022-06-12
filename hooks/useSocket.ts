import { useCallback, useEffect, useRef } from "react";

const useSocket = (url: string, onMessage: any) => {
  const socket = useRef<any>(null);

  const msgHandler = useRef<any>(null);
  msgHandler.current = onMessage;

  useEffect(() => {
    const createdSocket = new WebSocket(url);
    createdSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      msgHandler.current(data);
    };

    socket.current = createdSocket;
    console.log("created socket to " + url);

    return () => {
      console.log("socket disconnected");
      createdSocket.close();
    };
  }, [url]);

  return useCallback((data: any) => {
    if (socket.current === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(data));
    }
  }, []);
};

export default useSocket;
