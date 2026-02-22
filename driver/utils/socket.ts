import io from "socket.io-client";
import { getBaseUrl } from "./api";
import { getDriverToken } from "./storage";

let socket: any;

export const initSocket = async () => {
    const baseUrl = getBaseUrl();
    const token = await getDriverToken();

    if (!socket) {
        socket = io(baseUrl, {
            auth: {
                token: token
            },
            transports: ['websocket']
        });

        socket.on("connect", () => {
            console.log("Connected to socket server");
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
