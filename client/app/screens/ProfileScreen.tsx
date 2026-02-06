import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from "expo-router";
import Button from "../../components/Button";

const ProfileScreen = () => {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white justify-center items-center px-8">
            <View className="bg-slate-50 p-6 rounded-3xl items-center w-full">
                <View className="w-20 h-20 bg-[#FFD700] rounded-full justify-center items-center mb-4">
                    <Text className="text-2xl font-black text-slate-800">S</Text>
                </View>
                <Text className="text-2xl font-bold text-slate-800 mb-2">Shiv</Text>
                <Text className="text-slate-500 mb-6">shiv@example.com</Text>

                <Button
                    title="Logout"
                    onPress={() => router.replace("/")}
                    variant="secondary"
                    className="w-full"
                />
            </View>
        </View>
    );
};

export default ProfileScreen;
