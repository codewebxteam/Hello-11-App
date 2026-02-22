import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
    StatusBar as RNStatusBar,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { driverAPI } from '../utils/api';
import { getDriverData, setDriverData } from '../utils/storage';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function EditProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [form, setForm] = React.useState({
        name: '',
        mobile: '',
        experienceYears: '',
        profileImage: ''
    });

    React.useEffect(() => {
        const loadCurrentData = async () => {
            const data = await getDriverData();
            if (data) {
                setForm({
                    name: data.name || '',
                    mobile: data.mobile || '',
                    experienceYears: String(data.experienceYears || '0'),
                    profileImage: data.profileImage || ''
                });
            }
        };
        loadCurrentData();
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery to upload a profile picture.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0].base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setForm({ ...form, profileImage: base64Image });
        }
    };

    const handleSave = async () => {
        if (!form.name) return Alert.alert("Error", "Name is required");

        setLoading(true);
        try {
            const response = await driverAPI.updateProfile({
                name: form.name,
                experienceYears: Number(form.experienceYears)
            });

            // If image changed, update it separately
            const currentData = await getDriverData();
            if (form.profileImage && form.profileImage !== currentData.profileImage) {
                await driverAPI.updateProfileImage(form.profileImage);
            }

            if (response.data) {
                // Update local storage
                const currentData = await getDriverData();
                await setDriverData({
                    ...currentData,
                    name: response.data.driver.name,
                    experienceYears: response.data.driver.experienceYears,
                    profileImage: form.profileImage
                });

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Profile updated successfully");
                router.back();
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />

            <View style={{ paddingTop: STATUSBAR_HEIGHT }} className="bg-white shadow-sm">
                <View className="px-6 py-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-slate-900 font-black text-lg tracking-wider uppercase">Edit Profile</Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1 px-6 mt-8">
                {/* Profile Image Picker */}
                <View className="items-center mb-8">
                    <TouchableOpacity
                        onPress={pickImage}
                        className="w-32 h-32 bg-slate-200 rounded-full items-center justify-center border-4 border-white shadow-sm overflow-hidden"
                    >
                        {form.profileImage ? (
                            <Image source={{ uri: form.profileImage }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <Ionicons name="camera" size={40} color="#94A3B8" />
                        )}
                    </TouchableOpacity>
                    <Text className="text-slate-400 text-[10px] font-black uppercase mt-2 tracking-widest">Tap to change photo</Text>
                </View>

                <View>
                    <View>
                        <View className="flex-row justify-between items-center mb-2 ml-1">
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Full Name</Text>
                            <View className="flex-row items-center">
                                <Ionicons name="lock-closed" size={10} color="#94A3B8" />
                                <Text className="text-slate-400 text-[8px] font-bold uppercase ml-1">Locked</Text>
                            </View>
                        </View>
                        <View className="bg-slate-100 border border-slate-200 rounded-[20px] px-4 py-4 shadow-sm opacity-70">
                            <TextInput
                                value={form.name}
                                editable={false}
                                placeholder="Enter your full name"
                                className="text-slate-500 font-bold"
                            />
                        </View>
                    </View>

                    <View className="mt-6">
                        <View className="flex-row justify-between items-center mb-2 ml-1">
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Mobile Number</Text>
                            <View className="flex-row items-center">
                                <Ionicons name="lock-closed" size={10} color="#94A3B8" />
                                <Text className="text-slate-400 text-[8px] font-bold uppercase ml-1">Locked</Text>
                            </View>
                        </View>
                        <View className="bg-slate-100 border border-slate-200 rounded-[20px] px-4 py-4 shadow-sm opacity-70">
                            <TextInput
                                value={form.mobile ? `+91 ${form.mobile}` : ''}
                                editable={false}
                                placeholder="Enter your mobile number"
                                className="text-slate-500 font-bold"
                            />
                        </View>
                    </View>

                    <View className="mt-6">
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Years of Experience</Text>
                        <View className="bg-white border border-slate-200 rounded-[20px] px-4 py-4 shadow-sm">
                            <TextInput
                                value={form.experienceYears}
                                onChangeText={(text) => setForm({ ...form, experienceYears: text.replace(/[^0-9.]/g, '') })}
                                placeholder="Enter years of experience"
                                keyboardType="numeric"
                                className="text-slate-900 font-bold"
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    className={`mt-12 py-5 rounded-[24px] items-center shadow-xl ${loading ? 'bg-slate-400' : 'bg-slate-900 shadow-slate-900/20'}`}
                >
                    <Text className="text-white font-black text-base uppercase tracking-widest">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
