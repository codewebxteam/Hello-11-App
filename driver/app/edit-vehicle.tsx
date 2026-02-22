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
import { driverAPI } from '../utils/api';
import { getDriverData, setDriverData } from '../utils/storage';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function EditVehicleScreen() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [form, setForm] = React.useState({
        vehicleModel: '',
        vehicleNumber: '',
        vehicleColor: '',
        vehicleType: 'sedan'
    });

    React.useEffect(() => {
        const loadCurrentData = async () => {
            const data = await getDriverData();
            if (data) {
                setForm({
                    vehicleModel: data.vehicleModel || '',
                    vehicleNumber: data.vehicleNumber || '',
                    vehicleColor: data.vehicleColor || '',
                    vehicleType: data.vehicleType || 'sedan'
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
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />

            <View style={{ paddingTop: STATUSBAR_HEIGHT }} className="bg-white shadow-sm">
                <View className="px-6 py-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-slate-900 font-black text-lg tracking-wider uppercase">Vehicle Details</Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1 px-6">
                <View className="mt-8">
                    <View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Vehicle Model</Text>
                        <View className="bg-white border border-slate-200 rounded-[20px] px-4 py-4 shadow-sm">
                            <TextInput
                                value={form.vehicleModel}
                                onChangeText={(text) => setForm({ ...form, vehicleModel: text })}
                                placeholder="e.g. Toyota Camry"
                                className="text-slate-900 font-bold"
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">License Plate</Text>
                        <View className="bg-white border border-slate-200 rounded-[20px] px-4 py-4 shadow-sm">
                            <TextInput
                                value={form.vehicleNumber}
                                onChangeText={(text) => setForm({ ...form, vehicleNumber: text })}
                                placeholder="e.g. MH 12 AB 1234"
                                className="text-slate-900 font-bold"
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Color</Text>
                        <View className="bg-white border border-slate-200 rounded-[20px] px-4 py-4 shadow-sm">
                            <TextInput
                                value={form.vehicleColor}
                                onChangeText={(text) => setForm({ ...form, vehicleColor: text })}
                                placeholder="e.g. White"
                                className="text-slate-900 font-bold"
                            />
                        </View>
                    </View>

                    <View className="mt-6">
                        <View className="flex-row justify-between items-center mb-4 ml-1">
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Vehicle Category</Text>
                            {(form.vehicleType === 'auto' || form.vehicleType === 'bike') && (
                                <View className="flex-row items-center">
                                    <Ionicons name="lock-closed" size={10} color="#94A3B8" />
                                    <Text className="text-slate-400 text-[8px] font-black uppercase ml-1">Cab Only for {form.vehicleType}</Text>
                                </View>
                            )}
                        </View>
                        <View className="bg-white p-2 rounded-[24px] border border-slate-100 flex-row flex-wrap justify-between">
                            {['sedan', 'suv', 'mini', 'prime', 'auto', 'bike'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setForm({ ...form, vehicleType: type })}
                                    style={{ width: '30%', marginBottom: 8 }}
                                    className={`px-2 py-3 rounded-[20px] items-center ${form.vehicleType === type ? 'bg-slate-900' : 'bg-slate-50'}`}
                                >
                                    <Text className={`font-black uppercase text-[10px] ${form.vehicleType === type ? 'text-[#FFD700]' : 'text-slate-400'}`}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    className={`mt-12 py-5 rounded-[24px] items-center shadow-xl ${loading ? 'bg-slate-400' : 'bg-slate-900 shadow-slate-900/20'}`}
                >
                    <Text className="text-white font-black text-base uppercase tracking-widest">
                        {loading ? 'Updating...' : 'Save Vehicle'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
