import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { useRouter } from "expo-router";

const { width } = Dimensions.get('window');

const ThankYouScreen = () => {
    const router = useRouter();
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        // Logic to submit rating would go here
        console.log({ rating, feedback });
        router.replace("/screens/HomeScreen");
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-white">
                <StatusBar style="dark" />
                <SafeAreaView className="flex-1">

                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        className="flex-1 justify-center"
                    >
                        <View className="flex-1 px-6 pt-10 pb-6 justify-between">

                            {/* Header Section */}
                            <View className="items-center">
                                <Animated.View
                                    entering={ZoomIn.duration(600).springify()}
                                    className="bg-[#FFD700] w-24 h-24 rounded-full items-center justify-center mb-6 shadow-xl shadow-orange-200"
                                >
                                    <Ionicons name="heart" size={48} color="black" />
                                </Animated.View>

                                <Animated.View entering={FadeIn.delay(300)} className="items-center">
                                    <Text className="text-3xl font-black text-slate-900 text-center mb-2">Thank You!</Text>
                                    <Text className="text-slate-500 font-bold text-center text-base">
                                        for riding with Hello11
                                    </Text>
                                </Animated.View>
                            </View>

                            {/* Rating Section */}
                            <Animated.View
                                entering={SlideInUp.delay(500).springify()}
                                className="bg-slate-50 rounded-3xl p-6 border border-slate-100 items-center shadow-lg shadow-slate-100"
                            >
                                <Text className="text-slate-900 font-black text-lg mb-1">Rate your Driver</Text>
                                <Text className="text-slate-400 font-bold text-xs mb-6">Vikram Singh</Text>

                                <View className="flex-row gap-2 mb-8">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => setRating(star)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name={star <= rating ? "star" : "star-outline"}
                                                size={40}
                                                color={star <= rating ? "#FFD700" : "#CBD5E1"}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Feedback Input */}
                                <View className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                    <TextInput
                                        placeholder="Write your feedback here..."
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                        numberOfLines={4}
                                        className="text-slate-700 font-bold text-sm min-h-[80px] text-justify"
                                        value={feedback}
                                        onChangeText={setFeedback}
                                        textAlignVertical="top"
                                    />
                                </View>
                            </Animated.View>

                            {/* Submit Button */}
                            <Animated.View entering={FadeIn.delay(800)}>
                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={rating === 0}
                                    className={`py-4 rounded-2xl items-center shadow-lg active:scale-95 ${rating > 0 ? 'bg-slate-900 shadow-slate-300' : 'bg-slate-200'}`}
                                >
                                    <Text className={`font-black text-lg ${rating > 0 ? 'text-[#FFD700]' : 'text-slate-400'}`}>
                                        SUBMIT REVIEW
                                    </Text>
                                </TouchableOpacity>
                            </Animated.View>

                        </View>
                    </KeyboardAvoidingView>

                </SafeAreaView>
            </View>
        </TouchableWithoutFeedback>
    );
};

export default ThankYouScreen;
