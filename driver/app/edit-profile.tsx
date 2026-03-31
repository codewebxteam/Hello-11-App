import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
    StatusBar as RNStatusBar,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { getImageUrl } from '../utils/imagekit';
import { driverAPI } from '../utils/api';
import { getDriverData, setDriverData } from '../utils/storage';
import { useDriverAuth } from '../context/DriverAuthContext';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function EditProfileScreen() {
    const router = useRouter();
    const { refreshProfile, driver: authDriver } = useDriverAuth();
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
            Alert.alert('Permission Denied', 'We need access to your gallery to upload profile image.');
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
            const currentData = await getDriverData();
            
            const response = await driverAPI.updateProfile({
                name: form.name,
                experienceYears: Number(form.experienceYears)
            });

            // If image changed, update it separately (from its own API)
            if (form.profileImage && form.profileImage !== currentData.profileImage) {
                await driverAPI.updateProfileImage(form.profileImage);
            }

            if (response.data) {
                // Update local storage
                await setDriverData({
                    ...currentData,
                    name: response.data.driver.name,
                    profileImage: form.profileImage, // Use the new one if changed
                    experienceYears: response.data.driver.experienceYears
                });

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                
                // Trigger global refresh to update Dashboard/Profile instantly
                await refreshProfile();
                
                Alert.alert("Success", "Profile updated perfectly!");
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

            <ScrollView className="flex-1 px-6 mt-8 pb-10" showsVerticalScrollIndicator={false}>
                {/* Profile Image Picker */}
                <View className="items-center mb-10">
                    <TouchableOpacity
                        onPress={() => pickImage()}
                        className="w-32 h-32 bg-slate-200 rounded-full items-center justify-center border-4 border-white shadow-sm overflow-hidden"
                    >
                        {form.profileImage ? (
                            <Image 
                                source={{ uri: getImageUrl(form.profileImage, { width: 300, height: 300, quality: 90 }) }} 
                                style={{ width: '100%', height: '100%' }} 
                            />
                        ) : (
                            <Ionicons name="camera" size={40} color="#94A3B8" />
                        )}
                    </TouchableOpacity>
                    <View className="bg-slate-900 px-4 py-1.5 rounded-full -mt-4 shadow-md border-2 border-white">
                      <Text className="text-white text-[9px] font-black uppercase tracking-[2px]">Change Photo</Text>
                    </View>
                </View>

                <View className="mb-8">
                    <Text className="text-slate-900 text-xl font-black mb-1 italic">Basic Details</Text>
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">Verify your primary identity</Text>
                    
                    <View>
                        <View className="flex-row justify-between items-center mb-2 ml-1">
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Full Name</Text>
                            <View className="flex-row items-center">
                                <Ionicons name="lock-closed" size={10} color="#94A3B8" />
                                <Text className="text-slate-400 text-[8px] font-bold uppercase ml-1">Verified Only</Text>
                            </View>
                        </View>
                        <View className="bg-slate-100/80 border border-slate-200 rounded-[20px] px-4 py-4 shadow-sm opacity-70">
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
                                <Text className="text-slate-400 text-[8px] font-bold uppercase ml-1">Verified Only</Text>
                            </View>
                        </View>
                        <View className="bg-slate-100/80 border border-slate-200 rounded-[20px] px-4 py-4 shadow-sm opacity-70">
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
                    className={`mb-12 py-5 rounded-[26px] items-center shadow-2xl flex-row justify-center ${loading ? 'bg-slate-700' : 'bg-slate-900 shadow-slate-900/30'}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#FFD700" className="mr-2" />
                          <Text className="text-white font-black text-sm tracking-[4px] uppercase ml-2">Submit Profile</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
