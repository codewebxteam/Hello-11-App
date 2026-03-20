import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar as RNStatusBar,
    Alert,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { driverAPI } from '../utils/api';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;
const DocumentPicker = require('expo-document-picker');

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

    const pickDocumentImage = async (key: keyof typeof docs, title: string) => {
        Alert.alert(
            `Upload ${title}`,
            "Choose document type to upload.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Photo",
                    onPress: async () => {
                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('Permission Denied', 'Gallery permission is required to upload document images.');
                            return;
                        }

                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            aspect: [4, 3],
                            quality: 0.45,
                            base64: true
                        });

                        if (!result.canceled && result.assets?.[0]?.base64) {
                            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                            setDocs((prev) => ({ ...prev, [key]: base64Image }));
                            Haptics.selectionAsync();
                            Alert.alert("Selected", `${title} photo is ready to save.`);
                        }
                    }
                },
                {
                    text: "PDF",
                    onPress: async () => {
                        try {
                            const result = await DocumentPicker.getDocumentAsync({
                                type: 'application/pdf',
                                multiple: false,
                                copyToCacheDirectory: true,
                            });

                            if (!result.canceled && result.assets?.[0]?.uri) {
                                const pdfUri = result.assets[0].uri;
                                const pdfBase64 = await FileSystem.readAsStringAsync(pdfUri, {
                                    encoding: 'base64' as any
                                });
                                setDocs((prev) => ({ ...prev, [key]: `data:application/pdf;base64,${pdfBase64}` }));
                                Haptics.selectionAsync();
                                Alert.alert("Selected", `${title} PDF is ready to save.`);
                            }
                        } catch (error) {
                            console.log("PDF picker error:", error);
                            Alert.alert("Error", "Could not select PDF file.");
                        }
                    }
                }
            ]
        );
    };

    const removeDocumentImage = (key: keyof typeof docs) => {
        Alert.alert(
            "Delete Document",
            "Are you sure you want to remove this document?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => setDocs((prev) => ({ ...prev, [key]: '' }))
                }
            ]
        );
    };

    const renderDocItem = (title: string, value: string, key: keyof typeof docs, icon: any) => (
        <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">{title}</Text>
            <View className="bg-white border border-slate-200 rounded-[20px] px-4 py-4 shadow-sm">
                <View className="flex-row items-center mb-3">
                    <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
                        <Ionicons name={icon} size={18} color="#64748B" />
                    </View>
                    <Text className="ml-3 text-slate-700 font-bold flex-1">
                        {value ? ((value.toLowerCase().includes('.pdf') || value.startsWith('data:application/pdf')) ? 'PDF selected' : 'Document image selected') : 'No document selected'}
                    </Text>
                </View>

                {value ? (
                    (value.toLowerCase().includes('.pdf') || value.startsWith('data:application/pdf')) ? (
                        <View className="h-24 rounded-2xl border border-blue-100 items-center justify-center mb-3 bg-blue-50">
                            <Ionicons name="document-text" size={24} color="#2563EB" />
                            <Text className="text-blue-700 text-xs font-bold mt-1">PDF selected</Text>
                        </View>
                    ) : (
                        <View className="rounded-2xl overflow-hidden border border-slate-100 mb-3">
                            <Image source={{ uri: value }} className="w-full h-40" resizeMode="cover" />
                        </View>
                    )
                ) : (
                    <View className="h-24 rounded-2xl border border-dashed border-slate-300 items-center justify-center mb-3 bg-slate-50">
                        <Text className="text-slate-400 text-xs font-bold">Upload photo or PDF of {title.toLowerCase()}</Text>
                    </View>
                )}

                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={() => pickDocumentImage(key, title)}
                        className="flex-1 bg-slate-900 py-3 rounded-xl flex-row items-center justify-center"
                    >
                        <Ionicons name="image-outline" size={16} color="#FFFFFF" />
                        <Text className="text-white font-black text-xs uppercase tracking-wider ml-2">
                            {value ? 'Change File' : 'Upload File'}
                        </Text>
                    </TouchableOpacity>

                    {value ? (
                        <TouchableOpacity
                            onPress={() => removeDocumentImage(key)}
                            className="bg-red-50 border border-red-200 px-4 py-3 rounded-xl items-center justify-center"
                        >
                            <Ionicons name="trash-outline" size={16} color="#DC2626" />
                        </TouchableOpacity>
                    ) : null}
                </View>
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
                        Upload clear photos or PDF files of your driving license, insurance, and RC. Tap Save Documents after selecting files.
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
