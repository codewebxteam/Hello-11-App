import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar as RNStatusBar,
    Alert,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { driverAPI } from '../utils/api';
import { getDriverData } from '../utils/storage';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function DocumentsScreen() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [docs, setDocs] = React.useState({
        license: '',
        insurance: '',
        registration: ''
    });

    React.useEffect(() => {
        const loadDocs = async () => {
            try {
                const response = await driverAPI.getProfile();
                if (response.data && response.data.driver) {
                    const driver = response.data.driver;
                    setDocs({
                        license: driver.documents?.license || '',
                        insurance: driver.documents?.insurance || '',
                        registration: driver.documents?.registration || ''
                    });
                }
            } catch (err) {
                console.log("Docs load error:", err);
            }
        };
        loadDocs();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await driverAPI.updateDocuments(docs);
            if (response.data) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Documents updated successfully");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update documents");
        } finally {
            setLoading(false);
        }
    };

    const renderDocItem = (title: string, value: string, key: keyof typeof docs, icon: any) => (
        <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">{title}</Text>
            <View className="bg-white border border-slate-200 rounded-[20px] px-5 py-4 shadow-sm flex-row items-center">
                <Ionicons name={icon} size={20} color="#94A3B8" />
                <TextInput
                    value={value}
                    onChangeText={(text) => setDocs({ ...docs, [key]: text })}
                    placeholder={`Enter ${title.toLowerCase()} link/ID`}
                    className="flex-1 ml-3 text-slate-900 font-bold"
                />
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />

            <View style={{ paddingTop: STATUSBAR_HEIGHT }} className="bg-white shadow-sm">
                <View className="px-6 py-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-slate-900 font-black text-lg tracking-wider uppercase">Documents</Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1 px-6 mt-8">
                <View className="bg-blue-50 p-6 rounded-[24px] mb-8 border border-blue-100 flex-row items-center">
                    <Ionicons name="information-circle" size={24} color="#3B82F6" />
                    <Text className="text-blue-600 text-[11px] font-bold ml-3 flex-1 leading-4">
                        Please provide links or identification numbers for your vehicle and personal documents for verification.
                    </Text>
                </View>

                {renderDocItem("Driving License", docs.license, "license", "card")}
                {renderDocItem("Vehicle Insurance", docs.insurance, "insurance", "shield-checkmark")}
                {renderDocItem("Vehicle Registration (RC)", docs.registration, "registration", "document-text")}

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    className={`mt-6 py-5 rounded-[24px] items-center mb-10 shadow-xl ${loading ? 'bg-slate-400' : 'bg-slate-900 shadow-slate-900/20'}`}
                >
                    <Text className="text-white font-black text-base uppercase tracking-widest">
                        {loading ? 'Updating...' : 'Save Documents'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
