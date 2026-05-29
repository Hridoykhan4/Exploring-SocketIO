import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socketInstance = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    autoConnect: false,
});

const useSocket = () => {
    const [connected, setConnected] = useState(socketInstance.connected);

    useEffect(() => {
        const handleConnect = () => {
            setConnected(true);
            console.log("Connected to server: ", socketInstance.id);
        };

        const handleDisconnect = () => {
            setConnected(false);
            console.log("Disconnected from socket server");
        };

        const handleServerMessage = (data) => {
            console.log("Server message", data?.message);
        };

        socketInstance.on("connect", handleConnect);
        socketInstance.on("disconnect", handleDisconnect);
        socketInstance.on("connected", handleServerMessage);
        socketInstance.on("Connected", handleServerMessage);

        if (!socketInstance.connected) {
            socketInstance.connect();
        }

        return () => {
            socketInstance.off("connect", handleConnect);
            socketInstance.off("disconnect", handleDisconnect);
            socketInstance.off("connected", handleServerMessage);
            socketInstance.off("Connected", handleServerMessage);
        };
    }, []);

    return {
        socket: socketInstance,
        connected,
    };
};

export default useSocket;
