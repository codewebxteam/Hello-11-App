import io from "socket.io-client";
import { getBaseUrl } from "./api";
import { getDriverToken } from "./storage";

let socket: any = null;
let _driverId: string | null = null;

/**
 * Set the driver ID for auto room re-join on reconnect.
 * Call this from _layout.tsx when driverId is known.
 */
export const setSocketDriverId = (id: string | null) => {
    _driverId = id;
    // If socket is already connected, immediately join the room
    if (socket?.connected && id) {
        console.log("[Socket] setSocketDriverId → joining room:", id);
        socket.emit("join", id);
    }
};

export const getSocketDriverId = () => _driverId;

export const initSocket = async () => {
    const baseUrl = getBaseUrl();
    const token = await getDriverToken();

    if (!socket) {
        socket = io(baseUrl, {
            auth: {
                token: token
            },
            transports: ['websocket'],
            // --- Auto-reconnect config (Ola/Uber style) ---
            reconnection: true,
            reconnectionAttempts: Infinity,   // Never stop trying
            reconnectionDelay: 1000,          // Start with 1s delay
            reconnectionDelayMax: 10000,      // Max 10s delay between retries
            timeout: 10000,                   // Connection timeout (10s) before connect_error
        });

        // ✅ Auto room re-join on EVERY connect (initial + reconnect)
        socket.on("connect", () => {
            console.log("[Socket] Connected:", socket.id);
            if (_driverId) {
                console.log("[Socket] Auto-joining room:", _driverId);
                socket.emit("join", _driverId);
            }
        });

        // ✅ Explicit reconnect event — log for debugging
        socket.on("reconnect", (attemptNumber: number) => {
            console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
            // Room re-join already happens in "connect" above
        });

        socket.on("reconnect_attempt", (attemptNumber: number) => {
            console.log(`[Socket] Reconnect attempt #${attemptNumber}`);
        });

        socket.on("reconnect_error", (error: any) => {
            console.log("[Socket] Reconnect error:", error?.message || error);
        });

        socket.on("disconnect", (reason: string) => {
            console.log("[Socket] Disconnected. Reason:", reason);
            // If server disconnected us, force reconnect
            if (reason === "io server disconnect") {
                console.log("[Socket] Server-initiated disconnect, forcing reconnect...");
                socket.connect();
            }
            // For "transport close" / "ping timeout" → socket.io auto-reconnects
        });
    } else if (socket.disconnected) {
        // Socket exists but is disconnected — force reconnect
        console.log("[Socket] Existing socket is disconnected, reconnecting...");
        socket.connect();
    }

    return socket;
};

export const getSocket = () => socket;

/**
 * Force reconnect — use when app comes back to foreground
 * to ensure socket is alive and room is joined.
 */
export const ensureSocketConnected = async () => {
    if (!socket) {
        return await initSocket();
    }
    if (socket.disconnected) {
        console.log("[Socket] ensureSocketConnected → reconnecting...");
        socket.connect();
    } else if (socket.connected && _driverId) {
        // Already connected — just re-join room to be safe
        console.log("[Socket] ensureSocketConnected → re-joining room:", _driverId);
        socket.emit("join", _driverId);
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    _driverId = null;
};

export default {
    emit: (event: string, data: any) => socket?.emit(event, data),
    on: (event: string, callback: any) => socket?.on(event, callback),
    off: (event: string, callback: any) => socket?.off(event, callback),
    id: () => socket?.id
};
