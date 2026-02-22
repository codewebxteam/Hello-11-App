import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import socket from '../utils/socket'; // Assumes singleton socket instance
import { driverAPI } from '../utils/api';

interface Message {
    id: string;
    sender: 'user' | 'driver';
    message: string;
    timestamp: string;
}

export default function ChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const bookingId = (params.bookingId || params.id) as string;
    const userName = (params.userName || params.passengerName) as string || "Passenger";

    console.log("[DEBUG] Driver Chat Screen - bookingId:", bookingId, "Params:", params);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!bookingId) return;

        let activeSocket: any = null;

        // 1. Define listener
        const handleReceiveMessage = (msg: Message) => {
            console.log("Driver received chat msg:", msg);
            setMessages((prev) => {
                // Prevent duplicates
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            // Scroll to bottom on new message
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        };

        // 2. Join Chat Room & Ensure Init
        const setupSocket = async () => {
            try {
                const { initSocket } = require("../utils/socket");
                activeSocket = await initSocket();

                // Register listener IMMEDIATELY after getting socket
                activeSocket.on("receiveMessage", handleReceiveMessage);

                // Join the room
                activeSocket.emit("joinChat", bookingId);
                console.log("Driver joined chat room via init:", bookingId);
            } catch (err) {
                console.error("Socket setup failed in driver chat:", err);
            }
        };

        // 3. Fetch History
        const fetchHistory = async () => {
            try {
                const res = await driverAPI.getChatHistory(bookingId);
                if (res.data && res.data.chats) {
                    setMessages(res.data.chats);
                }
            } catch (error) {
                console.error("Error fetching chat history", error);
            }
        };

        setupSocket();
        fetchHistory();

        return () => {
            if (activeSocket) {
                activeSocket.off("receiveMessage", handleReceiveMessage);
            }
        };
    }, [bookingId]);

    const handleSend = async () => {
        if (inputText.trim().length === 0) return;

        const msgText = inputText.trim();
        setInputText('');

        // Emit message via socket
        const payload = {
            bookingId,
            sender: 'driver',
            message: msgText
        };

        try {
            // Check if socket is connected
            const { getSocket } = require("../utils/socket");
            const s = getSocket();

            if (s && s.connected) {
                s.emit("sendMessage", payload);
            } else {
                console.warn("Socket not connected, using REST API fallback for chat");
                // Fallback to REST API
                const res = await driverAPI.sendChatMessage(payload);
                if (res.data && res.data.chat) {
                    const newMsg = res.data.chat;
                    setMessages((prev) => {
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
                }
            }
        } catch (error) {
            console.error("Error sending chat message:", error);
            // Revert input text on failure? 
            // For now just log it.
        }
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isMe = item.sender === 'driver';
        return (
            <View className={`mb-2 max-w-[80%] p-3 rounded-2xl ${isMe ? 'self-end bg-[#FFD700] rounded-br-none' : 'self-start bg-slate-100 rounded-bl-none'}`}>
                <Text className={`text-base ${isMe ? 'text-slate-900 font-bold' : 'text-slate-800'}`}>
                    {item.message}
                </Text>
                <Text className="text-[10px] text-slate-500 mt-1 self-end">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
                <StatusBar style="dark" />

                {/* Header */}
                <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <Ionicons name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>{userName}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#22C55E' }}>Passenger</Text>
                    </View>
                </View>

                {/* Chat Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    contentContainerStyle={{ padding: 16, paddingBottom: 8, flexGrow: 1 }}
                    style={{ flex: 1 }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    keyboardShouldPersistTaps="handled"
                />

                {/* Input Bar */}
                <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        style={{ flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12, fontSize: 15, marginRight: 10 }}
                        placeholderTextColor="#94A3B8"
                        returnKeyType="send"
                        onSubmitEditing={handleSend}
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={inputText.trim().length === 0}
                        style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: inputText.trim().length > 0 ? '#FFD700' : '#E2E8F0' }}
                    >
                        <Ionicons name="send" size={20} color={inputText.trim().length > 0 ? '#0F172A' : '#94A3B8'} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}
