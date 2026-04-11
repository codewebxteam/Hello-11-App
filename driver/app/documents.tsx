import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar as RNStatusBar,
    Alert,
    ActivityIndicator,
    Animated,
    Easing,
    Modal,
    Image,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
const cacheDirectory = FileSystem.cacheDirectory;
const documentDirectory = FileSystem.documentDirectory;
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { driverAPI } from '../utils/api';
import { getImageUrl } from '../utils/imagekit';
import { useDriverAuth } from '../context/DriverAuthContext';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

// Shimmer Component
const ShimmerPlaceHolder = ({ className }: { className?: string }) => {
    const shimmerAnim = React.useRef(new Animated.Value(-1)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: [-200, 200],
    });

    return (
        <View className={`${className} bg-slate-200 overflow-hidden relative`}>
            <Animated.View
                style={{
                    transform: [{ translateX }],
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                }}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>
        </View>
    );
};

export default function DocumentsScreen() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [individualLoading, setIndividualLoading] = React.useState<Record<string, boolean>>({
        license: false,
        insurance: false,
        registration: false
    });
    const [docs, setDocs] = React.useState({
        license: '',
        insurance: '',
        registration: ''
    });

    const [viewingDocs, setViewingDocs] = React.useState<Record<string, boolean>>({
        license: false,
        insurance: false,
        registration: false
    });

    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const [previewVisible, setPreviewVisible] = React.useState(false);
    const [imgLoading, setImgLoading] = React.useState(false);
    const [imgError, setImgError] = React.useState<string | null>(null);

    const { refreshProfile } = useDriverAuth();

    const loadDocs = async () => {
        setLoading(true);
        try {
            const response = await driverAPI.getProfile();
            if (response.data && response.data.driver) {
                const driverData = response.data.driver;
                setDocs({
                    license: driverData.documents?.license || '',
                    insurance: driverData.documents?.insurance || '',
                    registration: driverData.documents?.registration || ''
                });
            }
        } catch (err) {
            console.log("Docs load error:", err);
        } finally {
            setLoading(false);
        }
    };

    const removeDocumentImage = (key: keyof typeof docs) => {
        setDocs((prev) => ({ ...prev, [key]: '' }));
    };

    React.useEffect(() => {
        console.log("[DEBUG_DOCS] DocumentsScreen Mounted");
        console.log("[DEBUG_DOCS] cacheDirectory:", cacheDirectory);
        console.log("[DEBUG_DOCS] documentDirectory:", documentDirectory);
        
        if (!cacheDirectory) {
            console.error("[DEBUG_DOCS] CRITICAL: cacheDirectory is NULL!");
            Alert.alert("System Error", "Local storage is not accessible. Please restart the app.");
        }
        
        loadDocs();
    }, []);

    const handleIndividualSave = async (key: keyof typeof docs, value: string, title: string) => {
        if (!value) return Alert.alert("Error", "Please select a document first");
        if (value.startsWith('http')) return; // Already saved

        setIndividualLoading(prev => ({ ...prev, [key]: true }));
        try {
            let Haptics;
            try {
                Haptics = require('expo-haptics');
            } catch (e) {}

            console.log(`[Documents] Uploading ${key}...`);
            const response = await driverAPI.updateDocuments({ [key]: value });
            console.log("[Documents] Backend raw response:", response.data);

            const resData = response.data;
            if (resData && (resData.driver || resData.documents || resData.license)) {
                const updatedDocs = resData.driver?.documents || resData.documents || resData;
                console.log("[Documents] Successfully extracted docs:", updatedDocs);

                const newDocs = {
                    license: updatedDocs?.license || docs.license,
                    insurance: updatedDocs?.insurance || docs.insurance,
                    registration: updatedDocs?.registration || docs.registration
                };
                setDocs(newDocs);

                if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", `${title} uploaded successfully! It is now locked and cannot be changed.`);
                
                await refreshProfile();
            } else {
                console.error("[Documents] Structure mismatch. Available keys:", Object.keys(resData || {}));
                throw new Error(`Invalid server response structure. Received keys: ${Object.keys(resData || {}).join(', ')}`);
            }
        } catch (error: any) {
            console.error("[Documents] Upload error detail:", error);
            const errMsg = error.response?.data?.message || error.message || `Failed to upload ${title.toLowerCase()}`;
            Alert.alert("Error", errMsg);
        } finally {
            setIndividualLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const pickDocumentImage = async (key: keyof typeof docs, title: string) => {
        try {
            let DocumentPicker, Haptics;
            try {
                DocumentPicker = require('expo-document-picker');
                Haptics = require('expo-haptics');
            } catch (e) {
                Alert.alert("Native Module Missing", "Required native modules (Picker/Haptics) are missing.");
                return;
            }

            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                multiple: false,
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets?.[0]?.uri) {
                const asset = result.assets[0];
                const fileSize = asset.size || 0;
                const maxSize = 10 * 1024 * 1024; // 10MB

                if (fileSize > maxSize) {
                    if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    Alert.alert(
                        "File Too Large", 
                        `Selected file is ${(fileSize / (1024 * 1024)).toFixed(1)}MB. Maximum allowed size is 10MB. Please select a smaller file.`
                    );
                    return;
                }

                const pdfUri = asset.uri;
                const pdfBase64 = await FileSystem.readAsStringAsync(pdfUri, {
                    encoding: 'base64'
                });
                setDocs((prev: any) => ({ ...prev, [key]: `data:application/pdf;base64,${pdfBase64}` }));
                if (Haptics) Haptics.selectionAsync();
            }
        } catch (error) {
            console.log("PDF picker error:", error);
            Alert.alert("Error", "Could not select PDF file.");
        }
    };

    const viewDocument = async (value: string, title: string, key: string) => {
        if (!value) return;
        console.log(`[DEBUG_DOCS] Entry - title: ${title}, key: ${key}, value: ${value.substring(0, 50)}`);
        
        // 1. Detect Document Type
        const isPdf = value.toLowerCase().includes('.pdf') || value.startsWith('data:application/pdf');
        
        // 2. Handle Remote Documents (Direct to System Viewer)
        if (value.startsWith('http')) {
            console.log(`[DEBUG_DOCS] Opening remote document via Direct System Viewer: ${value}`);
            setViewingDocs(prev => ({ ...prev, [key]: true }));
            try {
                const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(value)}`;
                await WebBrowser.openBrowserAsync(viewerUrl, {
                    toolbarColor: '#1E293B',
                    showTitle: true,
                });
            } catch (error: any) {
                console.error("[DEBUG_DOCS] WebBrowser error:", error);
                Alert.alert("Error", "Could not open document viewer.");
            } finally {
                setViewingDocs(prev => ({ ...prev, [key]: false }));
            }
            return;
        }

        // 3. Handle Local/Base64 Documents (Newly Picked)
        if (value.startsWith('data:')) {
            if (value.startsWith('data:image')) {
                // For local images, still use the direct modal for instant preview
                setImgError(null);
                setImgLoading(true);
                setPreviewImage(value);
                setPreviewVisible(true);
            } else if (value.startsWith('data:application/pdf')) {
                // For local PDFs, use Sharing as it's the only way for local files on Android
                setViewingDocs(prev => ({ ...prev, [key]: true }));
                try {
                    const base64Content = value.split('base64,')[1];
                    const filename = `${title.replace(/\s+/g, '_')}_PREVIEW.pdf`;
                    const fileUri = `${cacheDirectory}${filename}`;
                    await FileSystem.writeAsStringAsync(fileUri, base64Content, { encoding: 'base64' });
                    await Sharing.shareAsync(fileUri, {
                        mimeType: 'application/pdf',
                        dialogTitle: 'Preview Document',
                        UTI: 'com.adobe.pdf'
                    });
                } catch (error: any) {
                    Alert.alert("Error", "Could not preview local PDF.");
                } finally {
                    setViewingDocs(prev => ({ ...prev, [key]: false }));
                }
            }
        }
    };

    const renderDocItem = (title: string, value: string, key: keyof typeof docs, icon: any) => {
        const isUploaded = value && (value.startsWith('http') || value.startsWith('https'));
        const isLocal = value && value.startsWith('data:');
        const isSaving = individualLoading[key];
        const isViewing = viewingDocs[key];

        return (
            <View className="mb-6">
                <View className="flex-row justify-between items-center mb-3 ml-1">
                    <View className="flex-row items-center">
                        <View className="w-1.5 h-4 bg-[#FFD700] rounded-full mr-2.5 shadow-sm shadow-[#FFD700]/50" />
                        <Text className="text-slate-900 text-[12px] font-black uppercase tracking-[1.5px]">{title}</Text>
                    </View>
                    {isUploaded && (
                        <View className="flex-row items-center bg-green-100/50 px-3 py-1 rounded-full border border-green-200">
                            <Ionicons name="lock-closed" size={10} color="#15803D" />
                            <Text className="text-green-800 text-[9px] font-black uppercase ml-1 tracking-wider">LOCKED</Text>
                        </View>
                    )}
                </View>
                
                <View className={`bg-white border ${isUploaded ? 'border-green-100' : 'border-slate-200'} rounded-[20px] px-4 py-4 shadow-sm`}>
                    <View className="flex-row items-center mb-3">
                        <View className={`w-9 h-9 rounded-full ${isUploaded ? 'bg-green-50' : 'bg-slate-100'} items-center justify-center`}>
                            <Ionicons name={icon} size={18} color={isUploaded ? "#166534" : "#64738B"} />
                        </View>
                        <View className="ml-3 flex-1">
                            <Text className={`font-bold text-[13px] ${isUploaded ? 'text-green-700' : 'text-slate-700'}`}>
                                {isUploaded ? 'Document Uploaded' : isLocal ? 'PDF Selected' : 'Pending Upload'}
                            </Text>
                            {isUploaded && <Text className="text-green-600/60 text-[9px] font-bold">Successfully saved to cloud</Text>}
                        </View>
                    </View>

                    {value ? (
                        <TouchableOpacity 
                            onPress={() => viewDocument(value, title, key)}
                            disabled={isViewing || isSaving}
                            className={`h-24 rounded-[20px] border ${isViewing ? 'bg-slate-100 border-slate-300' : isUploaded ? 'border-green-200 bg-green-50/30' : 'border-blue-200 bg-blue-50/50'} items-center justify-center mb-4 flex-col`}
                            activeOpacity={0.7}
                        >
                            {isViewing ? (
                                <ActivityIndicator size="small" color={isUploaded ? "#166534" : "#3B82F6"} />
                            ) : (
                                <Ionicons name="eye-outline" size={28} color={isUploaded ? "#166534" : "#3B82F6"} />
                            )}
                            <Text className={`${isUploaded ? 'text-green-700' : 'text-blue-700'} text-xs font-black mt-2 uppercase tracking-widest`}>
                                {isViewing ? 'PREPARING...' : isUploaded ? 'View & Download' : 'Preview & Confirm'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="h-24 rounded-2xl border border-dashed border-slate-300 items-center justify-center mb-4 bg-slate-50">
                            <Ionicons name="cloud-upload-outline" size={32} color="#94A3B8" />
                            <Text className="text-slate-400 text-[9px] uppercase font-black tracking-tighter mt-2">Tap below to select {title.toLowerCase()} PDF</Text>
                        </View>
                    )}

                    <View className="flex-row gap-2">
                        {!isUploaded ? (
                            <>
                                <TouchableOpacity
                                    onPress={() => isLocal ? handleIndividualSave(key, value, title) : pickDocumentImage(key, title)}
                                    disabled={isSaving}
                                    className={`flex-1 ${isLocal ? 'bg-indigo-600' : 'bg-slate-900'} py-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-black/10`}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name={isLocal ? "shield-checkmark-outline" : "document-attach-outline"} size={16} color="#FFFFFF" />
                                            <Text className="text-white font-black text-xs uppercase tracking-wider ml-2">
                                                {isLocal ? 'CONFIRM & UPLOAD' : 'SELECT PDF'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {isLocal && !isSaving && (
                                    <TouchableOpacity
                                        onPress={() => removeDocumentImage(key)}
                                        className="bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl items-center justify-center"
                                    >
                                        <Ionicons name="close-circle-outline" size={20} color="#64738B" />
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <View className="flex-1 bg-slate-100/50 border border-slate-200 py-4 rounded-xl flex-row items-center justify-center">
                                <Ionicons name="checkmark-done-circle" size={18} color="#166534" />
                                <Text className="text-slate-500 font-black text-xs uppercase tracking-widest ml-2">UPLOADED & ARCHIVED</Text>
                            </View>
                        )}
                    </View>
                    {!isUploaded && (
                        <Text className="text-slate-400 text-[8px] font-bold mt-3 text-center uppercase tracking-tighter">
                            {isLocal ? "Review PDF above then click Confirm to save permanently." : "Once uploaded, documents are locked for security."}
                        </Text>
                    )}
                    {isUploaded && (
                        <Text className="text-slate-400 text-[8px] font-bold mt-3 text-center uppercase tracking-tighter">
                            Tip: Tap 'View' to share or download this document.
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const renderSkeletonItem = () => (
        <View className="mb-6 bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
            <View className="flex-row items-center mb-4">
                <ShimmerPlaceHolder className="w-10 h-10 rounded-full" />
                <View className="ml-3 flex-1">
                    <ShimmerPlaceHolder className="w-32 h-3 rounded-full mb-2" />
                    <ShimmerPlaceHolder className="w-20 h-2 rounded-full" />
                </View>
            </View>
            <ShimmerPlaceHolder className="h-28 rounded-2xl mb-4" />
            <ShimmerPlaceHolder className="h-12 rounded-xl" />
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
                    <Text className="text-slate-900 font-black text-lg tracking-wider uppercase">KYC Documents</Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1 px-6 mt-8" showsVerticalScrollIndicator={false}>
                <View className="bg-amber-50 p-6 rounded-[24px] mb-8 border border-amber-100 flex-row items-center shadow-sm">
                    <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center">
                        <Ionicons name="alert-circle" size={24} color="#D97706" />
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-amber-800 text-[12px] font-black uppercase tracking-tighter">Important Notice</Text>
                        <Text className="text-amber-700/70 text-[10px] font-bold leading-4 mt-0.5">
                            Documents can only be uploaded <Text className="text-amber-900 font-black">ONE TIME</Text>. Maximum file size is <Text className="text-red-700 font-black">10MB</Text>. Please ensure your PDF is clear.
                        </Text>
                    </View>
                </View>

                {loading ? (
                    <>
                        {renderSkeletonItem()}
                        {renderSkeletonItem()}
                        {renderSkeletonItem()}
                    </>
                ) : (
                    <>
                        {renderDocItem("Driving License", docs.license, "license", "card")}
                        {renderDocItem("Vehicle Insurance", docs.insurance, "insurance", "shield-checkmark")}
                        {renderDocItem("Vehicle Registration (RC)", docs.registration, "registration", "document-text")}
                    </>
                )}
                
                <View className="mb-10 items-center">
                    <Text className="text-slate-300 text-[9px] font-black uppercase tracking-widest">Hello-11 Verification Protocol</Text>
                </View>
            </ScrollView>

            {/* Image Preview Modal */}
            <Modal
                visible={previewVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPreviewVisible(false)}
            >
                <View className="flex-1 bg-black items-center justify-center">
                    <TouchableOpacity 
                        onPress={() => {
                            setPreviewVisible(false);
                            setImgError(null);
                        }}
                        className="absolute top-12 right-6 z-20 w-12 h-12 bg-white/20 rounded-full items-center justify-center border border-white/20 shadow-lg"
                    >
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>

                    {previewImage && !imgError ? (
                        <View className="w-full h-full items-center justify-center">
                            {imgLoading && (
                                <View className="absolute z-10 items-center">
                                    <ActivityIndicator color="#FFD700" size="large" />
                                    <Text className="text-white/60 mt-4 font-bold text-[12px] tracking-widest uppercase">Fetching Document...</Text>
                                </View>
                            )}
                            <Image 
                                source={{ uri: getImageUrl(previewImage, { width: 1200, quality: 90, format: 'jpg', pg: 1 }) }}
                                style={{ 
                                    width: Dimensions.get('window').width, 
                                    height: Dimensions.get('window').height * 0.85,
                                    resizeMode: 'contain' 
                                }}
                                onLoadStart={() => {
                                    console.log("[DEBUG_DOCS] Image loading started...");
                                    setImgLoading(true);
                                }}
                                onLoadEnd={() => {
                                    console.log("[DEBUG_DOCS] Image loading finished.");
                                    setImgLoading(false);
                                }}
                                onError={(e) => {
                                    console.error("[DEBUG_DOCS] Image loading error:", e.nativeEvent.error);
                                    setImgError(e.nativeEvent.error);
                                    setImgLoading(false);
                                }}
                            />
                        </View>
                    ) : (imgError || previewImage) ? (
                        <View className="items-center px-10">
                            <View className="w-20 h-20 bg-amber-500/10 rounded-full items-center justify-center mb-6">
                                <Ionicons name="eye-off" size={48} color="#F59E0B" />
                            </View>
                            <Text className="text-white text-xl font-black mb-2 text-center">Format Not Supported</Text>
                            <Text className="text-white/40 text-center text-[12px] leading-5">
                                This document cannot be previewed as an image. Click below to open it in the secure system viewer.
                            </Text>
                            
                            <TouchableOpacity 
                                onPress={async () => {
                                    if (previewImage) {
                                        const viewerUrl = previewImage.startsWith('http') 
                                            ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(previewImage)}`
                                            : previewImage;
                                            
                                        await WebBrowser.openBrowserAsync(viewerUrl, {
                                            toolbarColor: '#1E293B',
                                            showTitle: true,
                                        });
                                        setPreviewVisible(false);
                                    }
                                }}
                                className="mt-8 bg-blue-600 px-10 py-4 rounded-2xl shadow-xl shadow-blue-900/40"
                            >
                                <Text className="text-white font-black uppercase tracking-widest text-[12px]">Open in System Viewer</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => setPreviewVisible(false)}
                                className="mt-4 px-8 py-3"
                            >
                                <Text className="text-white/40 font-bold text-[12px]">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="items-center">
                            <ActivityIndicator color="#FFD700" size="large" />
                        </View>
                    )}

                    <View className="absolute bottom-12 px-8 py-3 bg-white/5 rounded-full border border-white/5">
                        <Text className="text-white/30 text-[9px] font-black uppercase tracking-[3px]">Secure Viewer Mode</Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
