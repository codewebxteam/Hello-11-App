import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../constants/apiConfig";
import { getToken } from "./storage";

let socket: Socket | null = null;

export const initSocket = async () => {
    const token = await getToken();

    if (!socket) {
        socket = io(API_BASE_URL, {
            auth: {
                token
            },
            transports: ['websocket']
        });

        socket.on("connect", () => {
            console.log("Client connected to socket server");
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });
    }

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export default {
    emit: (event: string, data: any) => socket?.emit(event, data),
    on: (event: string, callback: any) => socket?.on(event, callback),
    off: (event: string, callback: any) => socket?.off(event, callback),
    id: () => socket?.id
};
