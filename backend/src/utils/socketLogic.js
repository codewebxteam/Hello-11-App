import { Server } from "socket.io";
import { serverLog } from "./logger.js";
import Chat from "../models/Chat.js";
import Booking from "../models/Booking.js";
import Driver from "../models/Driver.js";
import { sendPushNotification } from "./notifications.js";

let io;

// Track active sockets per driver and disconnect grace timers
const driverActiveSockets = new Map(); // driverId (string) -> Set of socket IDs
const socketToDriver = new Map();       // socketId -> driverId (string)
const disconnectTimers = new Map();     // driverId (string) -> NodeJS.Timeout

export const cancelDriverDisconnectTimer = (driverId) => {
    if (!driverId) return;
    const idStr = String(driverId);
    if (disconnectTimers.has(idStr)) {
        clearTimeout(disconnectTimers.get(idStr));
        disconnectTimers.delete(idStr);
        serverLog(`[DISCONNECT-WATCHDOG] Manually cancelled disconnect timer for driver ${idStr}`);
    }
};

export const getDisconnectTimersCount = () => disconnectTimers.size;
export const getActiveDriversCount = () => driverActiveSockets.size;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        serverLog(`New socket connection: ${socket.id}`);

        socket.on("join", (userId) => {
            if (!userId) {
                serverLog(`WARN: Socket ${socket.id} joined with empty ID`);
                return;
            }
            const idStr = String(userId);
            socket.join(idStr);
            serverLog(`Socket ${socket.id} joined room: ${idStr}`);

            // Track driver socket associations
            socketToDriver.set(socket.id, idStr);
            if (!driverActiveSockets.has(idStr)) {
                driverActiveSockets.set(idStr, new Set());
            }
            driverActiveSockets.get(idStr).add(socket.id);

            // If there was a pending disconnect timer for this driver, cancel it immediately
            if (disconnectTimers.has(idStr)) {
                clearTimeout(disconnectTimers.get(idStr));
                disconnectTimers.delete(idStr);
                serverLog(`[DISCONNECT-WATCHDOG] Driver ${idStr} reconnected on socket ${socket.id}, cancelled pending offline notification`);
            }

            const rooms = Array.from(socket.rooms);
            serverLog(`Socket ${socket.id} active rooms: ${JSON.stringify(rooms)}`);
        });

        // --- CHAT EVENTS ---
        socket.on("joinChat", (bookingId) => {
            if (!bookingId) return;
            const roomName = `chat_${bookingId}`;
            socket.join(roomName);
            serverLog(`[CHAT] Socket ${socket.id} joined room: ${roomName}`);

            // Log all rooms for this socket to verify
            const rooms = Array.from(socket.rooms);
            serverLog(`[CHAT] Socket ${socket.id} current rooms: ${JSON.stringify(rooms)}`);
        });

        socket.on("sendMessage", async (data) => {
            const { bookingId, sender, message } = data;
            serverLog(`[CHAT] Message received: From=${sender}, Booking=${bookingId}, Text=${message.substring(0, 20)}...`);

            if (!bookingId || !message) {
                serverLog(`[CHAT] ERROR: Missing bookingId or message in sendMessage`);
                return;
            }

            try {
                // Save to DB
                const newChat = await Chat.create({
                    booking: bookingId,
                    sender,
                    message
                });

                // Emit to room
                const roomName = `chat_${bookingId}`;
                io.to(roomName).emit("receiveMessage", {
                    id: String(newChat._id),
                    sender,
                    message,
                    timestamp: newChat.createdAt
                });
                serverLog(`[CHAT] Broadcasted msg to room: ${roomName}, Sender: ${sender}, ID: ${newChat._id}`);

                // --- PUSH NOTIFICATIONS ---
                // Find the booking and populate users to get push tokens
                const booking = await Booking.findById(bookingId).populate("user driver");
                if (booking) {
                    const recipient = sender === "user" ? booking.driver : booking.user;
                    if (recipient && recipient.pushToken) {
                        const title = sender === "user" ? "Message from Passenger" : "Message from Driver";
                        sendPushNotification(
                            recipient.pushToken,
                            title,
                            message,
                            { type: "chat", bookingId }
                        );
                    }
                }
            } catch (err) {
                serverLog(`[CHAT] DB Error saving chat: ${err.message}`);
            }
        });

        socket.on("disconnect", () => {
            serverLog(`Client disconnected: ${socket.id}`);

            const driverId = socketToDriver.get(socket.id);
            if (driverId) {
                socketToDriver.delete(socket.id);
                const activeSet = driverActiveSockets.get(driverId);
                if (activeSet) {
                    activeSet.delete(socket.id);
                    if (activeSet.size === 0) {
                        driverActiveSockets.delete(driverId);

                        // Start 15-second grace period timer before declaring driver offline
                        serverLog(`[DISCONNECT-WATCHDOG] Driver ${driverId} has no active sockets. Starting 15s grace timer before marking offline...`);

                        if (disconnectTimers.has(driverId)) {
                            clearTimeout(disconnectTimers.get(driverId));
                        }

                        const timer = setTimeout(async () => {
                            disconnectTimers.delete(driverId);
                            try {
                                const driver = await Driver.findById(driverId);
                                if (driver && driver.online) {
                                    serverLog(`[DISCONNECT-WATCHDOG] 15s grace period expired for Driver ${driverId}. Marking OFFLINE and sending push notification.`);

                                    driver.online = false;
                                    driver.available = false;
                                    driver.lastOnlineToggle = new Date();
                                    await driver.save();

                                    if (io) {
                                        io.emit("driver_status_changed", {
                                            driverId: String(driver._id),
                                            online: false,
                                            available: false,
                                            reason: "app_killed"
                                        });
                                    }

                                    if (driver.pushToken) {
                                        await sendPushNotification(
                                            driver.pushToken,
                                            "🔴 Aap Offline ho gaye hain",
                                            "Hello-11: App background se band ho gayi hai. Nayi ride requests paane ke liye app open karein.",
                                            {
                                                type: "driver_offline_killed",
                                                driverId: String(driver._id),
                                                timestamp: new Date().toISOString()
                                            }
                                        );
                                        serverLog(`[DISCONNECT-WATCHDOG] Offline push notification successfully sent to: ${driver.pushToken}`);
                                    } else {
                                        serverLog(`[DISCONNECT-WATCHDOG] Driver ${driverId} has no pushToken`);
                                    }
                                } else {
                                    serverLog(`[DISCONNECT-WATCHDOG] Driver ${driverId} is already offline or not found.`);
                                }
                            } catch (err) {
                                serverLog(`[DISCONNECT-WATCHDOG] Error processing disconnect for driver ${driverId}: ${err.message}`);
                            }
                        }, 15000);

                        disconnectTimers.set(driverId, timer);
                    }
                }
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

