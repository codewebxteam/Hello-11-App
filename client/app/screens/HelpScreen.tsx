import React from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    Linking,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
    <View className="bg-white p-4 rounded-2xl border border-slate-100 mb-3 shadow-sm">
        <Text className="font-black text-slate-800 text-sm mb-2">{question}</Text>
        <Text className="font-medium text-slate-500 text-xs leading-5">{answer}</Text>
    </View>
);

const HelpScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const openWhatsApp = () => {
        const phone = '+919628911211'; // Replace with actual WhatsApp number
        const text = 'Hello, I need help with the Hello 11 app.';
        Linking.openURL(`whatsapp://send?text=${text}&phone=${phone}`).catch(() => {
            alert('Make sure WhatsApp is installed on your device');
        });
    };

    const callSupport = () => {
        const phone = '+919628911211'; // Replace with actual support number
        Linking.openURL(`tel:${phone}`).catch(() => {
            alert('Failed to open dialer');
        });
    };

    const emailSupport = () => {
        const email = 'support@hello11.in'; // Replace with actual support email
        Linking.openURL(`mailto:${email}?subject=App Support`).catch(() => {
            alert('Failed to open email client');
        });
    };

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            <StatusBar style="dark" />
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 160 }}
            >
                {/* Header */}
                <View 
                    className="bg-[#FFD700] rounded-b-[40px] shadow-sm relative overflow-hidden px-6"
                    style={{ paddingTop: insets.top + 20, paddingBottom: 40 }}
                >
                    <View className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
                    
                    <View className="flex-row items-center justify-center z-10 w-full mb-2">
                        <Ionicons name="help-buoy" size={32} color="#1E293B" style={{ marginRight: 10 }} />
                        <Text numberOfLines={1} className="text-[28px] font-black text-slate-900 italic tracking-tighter text-center">
                            Help & Support
                        </Text>
                    </View>
                    <Text className="text-center font-bold text-slate-700 text-xs">
                        How can we assist you today?
                    </Text>
                </View>

                <View className="px-5 mt-6">
                    {/* Contact Options */}
                    <Text className="text-[12px] font-black text-slate-400 mb-4 tracking-[2px] uppercase italic pl-1">
                        Contact Us Directly
                    </Text>

                    <View className="flex-row justify-between mb-8">
                        <TouchableOpacity 
                            onPress={callSupport}
                            className="bg-white p-4 rounded-2xl flex-1 mr-2 items-center border border-slate-100 shadow-sm"
                        >
                            <View className="bg-blue-50 w-12 h-12 rounded-full items-center justify-center mb-2">
                                <Ionicons name="call" size={24} color="#3B82F6" />
                            </View>
                            <Text className="font-black text-slate-800 text-xs">Call Us</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={openWhatsApp}
                            className="bg-white p-4 rounded-2xl flex-1 mx-1 items-center border border-slate-100 shadow-sm"
                        >
                            <View className="bg-green-50 w-12 h-12 rounded-full items-center justify-center mb-2">
                                <Ionicons name="logo-whatsapp" size={24} color="#10B981" />
                            </View>
                            <Text className="font-black text-slate-800 text-xs">WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={emailSupport}
                            className="bg-white p-4 rounded-2xl flex-1 ml-2 items-center border border-slate-100 shadow-sm"
                        >
                            <View className="bg-orange-50 w-12 h-12 rounded-full items-center justify-center mb-2">
                                <Ionicons name="mail" size={24} color="#F97316" />
                            </View>
                            <Text className="font-black text-slate-800 text-xs">Email</Text>
                        </TouchableOpacity>
                    </View>

                    {/* FAQs */}
                    <Text className="text-[12px] font-black text-slate-400 mb-4 tracking-[2px] uppercase italic pl-1">
                        Frequently Asked Questions
                    </Text>

                    <FAQItem 
                        question="How do I book a ride?" 
                        answer="Enter your destination on the home screen, select your vehicle type, and tap 'Search Ride'. Our nearest driver will be assigned to you shortly." 
                    />
                    <FAQItem 
                        question="What are the rules during a trip?" 
                        answer="We expect both riders and drivers to be respectful. Please wear your seatbelt, do not distract the driver, and ensure you don't leave any trash behind. Smoking is strictly prohibited." 
                    />
                    <FAQItem 
                        question="How is the fare calculated?" 
                        answer="Fare is calculated based on the base rate, distance, and time. Tolls and parking charges (if any) are extra and to be paid directly by you to the driver." 
                    />
                    <FAQItem 
                        question="Can I cancel a ride?" 
                        answer="Yes, you can cancel a ride before the driver arrives. However, frequent cancellations may incur a small cancellation fee depending on the time elapsed." 
                    />
                    <FAQItem 
                        question="How do I book an outstation trip?" 
                        answer="For trips over 40km, our app automatically suggests Outstation mode. It offers specialized rates and the option to retain the cab for longer durations." 
                    />
                </View>
            </ScrollView>

            {/* Bottom Tab Bar */}
            <View
                className="absolute bottom-0 w-full bg-white flex-row justify-around items-center border-t border-slate-100 shadow-2xl elevation-[25] z-50"
                style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 10 }}
            >
                <TouchableOpacity className="items-center justify-center pt-2 w-1/4" onPress={() => router.replace('/screens/HomeScreen')}>
                    <Ionicons name="home" size={24} color="#94A3B8" />
                    <Text className="text-[11px] font-bold mt-1 text-slate-400">Home</Text>
                </TouchableOpacity>
                {false && (
                    <TouchableOpacity className="items-center justify-center pt-2 w-1/4" onPress={() => router.replace({ pathname: '/screens/BookingScreen', params: { mode: 'schedule' } })}>
                        <Ionicons name="calendar" size={24} color="#94A3B8" />
                        <Text className="text-[11px] font-bold mt-1 text-slate-400">Ride</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity className="items-center justify-center pt-2 w-1/4" onPress={() => router.replace('/screens/HistoryScreen')}>
                    <Ionicons name="list" size={24} color="#94A3B8" />
                    <Text className="text-[11px] font-bold mt-1 text-slate-400">History</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center justify-center pt-2 w-1/4" onPress={() => {}}>
                    <Ionicons name="help-circle" size={24} color="#1E293B" />
                    <Text className="text-[11px] font-bold mt-1 text-slate-800">Help</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center justify-center pt-2 w-1/4" onPress={() => router.replace('/screens/ProfileScreen')}>
                    <Ionicons name="person" size={24} color="#94A3B8" />
                    <Text className="text-[11px] font-bold mt-1 text-slate-400">Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default HelpScreen;
