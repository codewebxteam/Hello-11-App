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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { driverAPI } from '../utils/api';
import { getDriverData, setDriverData } from '../utils/storage';
import { useDriverAuth } from '../context/DriverAuthContext';

import Header from '../components/Header';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function EditVehicleScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { refreshProfile } = useDriverAuth();
    const [loading, setLoading] = React.useState(false);
    const [form, setForm] = React.useState({
        vehicleModel: '',
        vehicleNumber: '',
        vehicleColor: '',
        vehicleType: '5seater'
    });

    React.useEffect(() => {
        const loadCurrentData = async () => {
            const data = await getDriverData();
            if (data) {
                setForm({
                    vehicleModel: data.vehicleModel || '',
                    vehicleNumber: data.vehicleNumber || '',
                    vehicleColor: data.vehicleColor || '',
                    vehicleType: data.vehicleType || '5seater'
                });
            }
        };
        loadCurrentData();
    }, []);

    const handleSave = async () => {
        if (!form.vehicleModel || !form.vehicleNumber) {
            return Alert.alert("Error", "Model and License Plate are required");
        }

        setLoading(true);
        try {
            const response = await driverAPI.updateVehicle(form);

            if (response.data) {
                const currentData = await getDriverData();
                await setDriverData({
                    ...currentData,
                    ...response.data.driver
                });

                // Force global context update for real-time dashboard sync
                await refreshProfile();

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Vehicle details updated");
                router.back();
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update vehicle");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            <StatusBar style="dark" />

            <Header title="Vehicle Details" />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(40, insets.bottom + 20) }}>
                <View className="px-6 py-8">
                    {/* Primary Info - LOCKED */}
                    <View className="mb-8">
                        <View className="flex-row items-center mb-4 ml-1">
                            <View className="w-1.5 h-4 bg-slate-900 rounded-full mr-2.5" />
                            <Text className="text-slate-900 text-[12px] font-black uppercase tracking-[2px]">Primary info</Text>
                            <View className="ml-2 bg-slate-100 px-2 py-0.5 rounded-md flex-row items-center">
                                <Ionicons name="lock-closed" size={10} color="#64748B" />
                                <Text className="text-slate-500 text-[8px] font-black uppercase ml-1">Verified</Text>
                            </View>
                        </View>

                        <View className="space-y-4">
                            <View>
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-4">Vehicle Model</Text>
                                <View className="bg-slate-100 border border-slate-200 rounded-[24px] px-5 py-5 shadow-sm flex-row items-center">
                                    <Ionicons name="car" size={20} color="#64748B" />
                                    <TextInput
                                        value={form.vehicleModel}
                                        editable={false}
                                        className="flex-1 text-slate-500 font-bold ml-3"
                                    />
                                    <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
                                </View>
                            </View>

                            <View className="mt-4">
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-4">License Plate</Text>
                                <View className="bg-slate-100 border border-slate-200 rounded-[24px] px-5 py-5 shadow-sm flex-row items-center">
                                    <Ionicons name="id-card" size={20} color="#64748B" />
                                    <TextInput
                                        value={form.vehicleNumber}
                                        editable={false}
                                        className="flex-1 text-slate-500 font-bold ml-3 uppercase"
                                    />
                                    <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Appearance - EDITABLE */}
                    <View className="mb-8">
                        <View className="flex-row items-center mb-4 ml-1">
                            <View className="w-1.5 h-4 bg-[#FFD700] rounded-full mr-2.5" />
                            <Text className="text-slate-900 text-[12px] font-black uppercase tracking-[2px]">Appearance</Text>
                        </View>

                        <View className="space-y-4">
                            <View>
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-4">Vehicle Color</Text>
                                <View className="bg-white border border-slate-200 rounded-[24px] px-5 py-5 shadow-sm flex-row items-center focus:border-slate-900">
                                    <Ionicons name="color-palette" size={20} color="#0F172A" />
                                    <TextInput
                                        value={form.vehicleColor}
                                        onChangeText={(text) => setForm({ ...form, vehicleColor: text })}
                                        placeholder="Color (e.g. White)"
                                        className="flex-1 text-slate-900 font-bold ml-3"
                                    />
                                    <Ionicons name="pencil" size={16} color="#CBD5E1" />
                                </View>
                            </View>

                            <View className="mt-6">
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 ml-4">Vehicle Category</Text>
                                <View className="bg-white p-2 rounded-[28px] border border-slate-100 flex-row justify-between shadow-sm">
                                    {['5seater', '7seater'].map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            onPress={() => {
                                                try {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                } catch (e) {}
                                                setForm({ ...form, vehicleType: type });
                                            }}
                                            style={{ 
                                                width: '48.5%', 
                                                backgroundColor: form.vehicleType === type ? '#0F172A' : 'transparent',
                                                borderRadius: 22,
                                                paddingVertical: 16,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'row'
                                            }}
                                        >
                                            <Ionicons 
                                                name={type === '5seater' ? "car" : "bus"} 
                                                size={16} 
                                                color={form.vehicleType === type ? '#FFD700' : '#94A3B8'} 
                                                style={{ marginRight: 8 }}
                                            />
                                            <Text className={`font-black uppercase text-[10px] tracking-widest ${form.vehicleType === type ? 'text-white' : 'text-slate-400'}`}>
                                                {type === '5seater' ? 'Standard' : 'Premium'}
                                            </Text>
                                            <Text className={`text-[8px] font-bold uppercase ml-1.5 ${form.vehicleType === type ? 'text-[#FFD700]' : 'text-slate-500'}`}>
                                                {type === '5seater' ? '(5 Seater)' : '(7 Seater)'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        activeOpacity={0.8}
                        className={`mt-10 py-5 rounded-[28px] items-center flex-row justify-center ${loading ? 'bg-slate-300' : 'bg-slate-900'}`}
                        style={!loading ? { elevation: 8, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 } : {}}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                                <Text className="text-white font-black text-sm uppercase tracking-[3px] ml-2">Update Details</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View className="mt-8 items-center">
                        <Text className="text-slate-400 text-[10px] font-bold text-center italic">
                            Contact Admin if you need to change{"\n"}primary vehicle information.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
