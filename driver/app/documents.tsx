import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Animated,
    Easing,
    Modal,
    Image,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker'; // Added ImagePicker
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { driverAPI } from '../utils/api';
import { getImageUrl } from '../utils/imagekit';
import { useDriverAuth } from '../context/DriverAuthContext';
import Header from '../components/Header';

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
    }, [shimmerAnim]);

    const { width } = useWindowDimensions();
    const translateX = shimmerAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: [-width, width],
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
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const isLargePhone = screenWidth >= 412;
    const isTablet = screenWidth >= 768;
    const contentMaxWidth = isTablet ? 760 : isLargePhone ? 560 : undefined;
    
    const [loading, setLoading] = React.useState(true);
    const [isVerified, setIsVerified] = React.useState(false); // New state to track admin approval
    const [verificationNote, setVerificationNote] = React.useState<string>(''); // Admin rejection reason
    
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
                // Set the admin verification status & rejection reason note
                setIsVerified(driverData.isVerified === true);
                setVerificationNote(driverData.verificationNote || '');
            }
        } catch (err) {
            console.log("Docs load error:", err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadDocs();
    }, []);

    const removeDocumentImage = (key: keyof typeof docs) => {
        setDocs((prev) => ({ ...prev, [key]: '' }));
    };

    const processImageResult = (result: ImagePicker.ImagePickerResult, key: keyof typeof docs) => {
        if (!result.canceled && result.assets?.[0]?.base64) {
            // Limit check handling is abstracted via quality compression in the picker
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setDocs((prev) => ({ ...prev, [key]: base64Img }));
            Haptics.selectionAsync();
        }
    };

    const openCamera = async (key: keyof typeof docs) => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Please allow camera access to take document photos.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5, // Compress image to reduce upload size
            base64: true,
        });
        processImageResult(result, key);
    };

    const openGallery = async (key: keyof typeof docs) => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Please allow gallery access to select document photos.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
            base64: true,
        });
        processImageResult(result, key);
    };

    const handleImagePick = (key: keyof typeof docs, title: string) => {
        Alert.alert(
            `Upload ${title}`,
            "How would you like to provide this document?",
            [
                { text: "Take a Photo", onPress: () => openCamera(key) },
                { text: "Choose from Gallery", onPress: () => openGallery(key) },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const handleIndividualSave = async (key: keyof typeof docs, value: string, title: string) => {
        if (!value) return Alert.alert("Error", "Please select a document first");
        if (value.startsWith('http')) return; // Already saved remote image

        setIndividualLoading(prev => ({ ...prev, [key]: true }));
        try {
            const response = await driverAPI.updateDocuments({ [key]: value });
            const resData = response.data;
            
            if (resData && (resData.driver || resData.documents || resData.license)) {
                const updatedDocs = resData.driver?.documents || resData.documents || resData;
                const newDocs = {
                    license: updatedDocs?.license || docs.license,
                    insurance: updatedDocs?.insurance || docs.insurance,
                    registration: updatedDocs?.registration || docs.registration
                };
                setDocs(newDocs);

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", `${title} uploaded! It will remain in 'Pending Review' until Admin verification.`);
                await refreshProfile();
            } else {
                throw new Error("Invalid server response structure.");
            }
        } catch (error: any) {
            const errMsg = error.response?.data?.message || error.message || `Failed to upload ${title.toLowerCase()}`;
            Alert.alert("Error", errMsg);
        } finally {
            setIndividualLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const viewDocument = async (value: string) => {
        if (!value) return;
        
        // Since we are strictly using ImagePicker now, everything is an image. 
        // We can safely open both base64 and http URLs in our Modal Image Viewer.
        setImgError(null);
        setImgLoading(true);
        setPreviewImage(value);
        setPreviewVisible(true);
    };

    const renderDocItem = (title: string, value: string, key: keyof typeof docs, icon: any) => {
        const isUploaded = value && (value.startsWith('http') || value.startsWith('https'));
        const isLocal = value && value.startsWith('data:');
        const isSaving = individualLoading[key];
        const isViewing = viewingDocs[key];

        // Core requirement check:
        const isLockedByAdmin = isVerified;
        const isRejectedByAdmin = !isVerified && !!verificationNote;

        return (
            <View className="mb-6">
                <View className="flex-row justify-between items-center mb-3 ml-1">
                    <View className="flex-row items-center flex-1 pr-2">
                        <View className={`w-1.5 h-4 ${isLockedByAdmin ? 'bg-[#166534]' : isRejectedByAdmin ? 'bg-[#E11D48]' : 'bg-[#FFD700]'} rounded-full mr-2.5`} />
                        <Text className="text-slate-900 text-[12px] font-black uppercase tracking-[1.5px] flex-shrink" numberOfLines={1}>{title}</Text>
                    </View>
                    
                    {/* Status Tags */}
                    {isUploaded && isLockedByAdmin && (
                        <View className="flex-row items-center bg-green-100/80 px-3 py-1 rounded-full border border-green-300">
                            <Ionicons name="shield-checkmark" size={10} color="#15803D" />
                            <Text className="text-green-800 text-[9px] font-black uppercase ml-1 tracking-wider">VERIFIED</Text>
                        </View>
                    )}
                    {isRejectedByAdmin && (
                        <View className="flex-row items-center bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                            <Ionicons name="close-circle" size={10} color="#E11D48" />
                            <Text className="text-rose-800 text-[9px] font-black uppercase ml-1 tracking-wider">REJECTED - RE-UPLOAD</Text>
                        </View>
                    )}
                    {isUploaded && !isLockedByAdmin && !isRejectedByAdmin && (
                        <View className="flex-row items-center bg-amber-100/50 px-3 py-1 rounded-full border border-amber-200">
                            <Ionicons name="time" size={10} color="#D97706" />
                            <Text className="text-amber-800 text-[9px] font-black uppercase ml-1 tracking-wider">PENDING REVIEW</Text>
                        </View>
                    )}
                </View>
                
                <View className={`bg-white border ${isLockedByAdmin ? 'border-green-200' : isRejectedByAdmin ? 'border-rose-300 shadow-rose-500/10' : 'border-slate-200'} rounded-[20px] px-4 py-4 shadow-sm`}>
                    
                    <View className="flex-row items-center mb-3">
                        <View className={`w-9 h-9 rounded-full ${isLockedByAdmin ? 'bg-green-50' : isRejectedByAdmin ? 'bg-rose-100' : 'bg-slate-100'} items-center justify-center`}>
                            <Ionicons name={icon} size={18} color={isLockedByAdmin ? "#166534" : isRejectedByAdmin ? "#E11D48" : "#64738B"} />
                        </View>
                        <View className="ml-3 flex-1">
                            <Text className={`font-bold text-[13px] ${isLockedByAdmin ? 'text-green-700' : isRejectedByAdmin ? 'text-rose-900 font-extrabold' : 'text-slate-700'}`}>
                                {isLockedByAdmin ? 'Document Approved' : isRejectedByAdmin ? 'Re-upload Action Required' : isUploaded ? 'Under Review' : isLocal ? 'Photo Ready to Upload' : 'Upload Required'}
                            </Text>
                            {isLockedByAdmin && <Text className="text-green-600/60 text-[9px] font-bold">Successfully verified by Admin</Text>}
                            {isRejectedByAdmin && <Text className="text-rose-600 text-[9px] font-extrabold">Please provide a clear replacement photo</Text>}
                            {!isLockedByAdmin && !isRejectedByAdmin && isUploaded && <Text className="text-amber-600/60 text-[9px] font-bold">You can update this if needed</Text>}
                        </View>
                    </View>

                    {/* Prominent Inline Rejection Callout (Inside Document Card) */}
                    {isRejectedByAdmin && (
                        <View className="bg-rose-50 border border-rose-200 p-3 rounded-xl mb-4 flex-row items-start">
                            <Ionicons name="alert-circle" size={16} color="#E11D48" style={{ marginTop: 1 }} />
                            <View className="ml-2.5 flex-1">
                                <Text className="text-rose-900 text-[10px] font-black uppercase tracking-wider">Admin Rejection Note:</Text>
                                <Text className="text-rose-950 font-bold text-xs mt-0.5">{verificationNote}</Text>
                            </View>
                        </View>
                    )}

                    {/* View Document Area */}
                    {value ? (
                        <TouchableOpacity 
                            onPress={() => viewDocument(value)}
                            disabled={isViewing || isSaving}
                            className={`h-28 rounded-[20px] overflow-hidden items-center justify-center mb-4 ${isLockedByAdmin ? 'border border-green-200' : isRejectedByAdmin ? 'border-2 border-rose-300' : 'border border-blue-200'}`}
                            activeOpacity={0.7}
                        >
                            <Image 
                                source={{ uri: value.startsWith('http') ? getImageUrl(value, { width: 400 }) : value }}
                                className="w-full h-full opacity-60"
                                style={{ backgroundColor: '#000' }}
                                resizeMode="cover"
                            />
                            <View className="absolute items-center bg-black/40 px-4 py-2 rounded-full flex-row">
                                <Ionicons name="eye" size={16} color="#FFF" />
                                <Text className="text-white text-[10px] font-black uppercase ml-2 tracking-widest">Tap to View Image</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            onPress={() => handleImagePick(key, title)}
                            className="h-24 rounded-2xl border border-dashed border-slate-300 items-center justify-center mb-4 bg-slate-50"
                        >
                            <Ionicons name="camera-outline" size={32} color="#94A3B8" />
                            <Text className="text-slate-400 text-[9px] uppercase font-black tracking-tighter mt-2">Tap to take or select photo</Text>
                        </TouchableOpacity>
                    )}

                    {/* Action Buttons */}
                    <View className="flex-row gap-2">
                        {isLocal && !isUploaded && (
                            <>
                                <TouchableOpacity
                                    onPress={() => handleIndividualSave(key, value, title)}
                                    disabled={isSaving}
                                    className="flex-1 bg-[#FFD700] py-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-yellow-500/20"
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color="#000" />
                                    ) : (
                                        <>
                                            <Ionicons name="cloud-upload" size={16} color="#1E293B" />
                                            <Text className="text-slate-900 font-black text-xs uppercase tracking-wider ml-2">UPLOAD PHOTO</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {!isSaving && (
                                    <TouchableOpacity
                                        onPress={() => removeDocumentImage(key)}
                                        className="bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl items-center justify-center"
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {/* Allowed to Edit until Verified */}
                        {isUploaded && !isLockedByAdmin && (
                            <TouchableOpacity
                                onPress={() => handleImagePick(key, title)}
                                disabled={isSaving}
                                className={`flex-1 ${isRejectedByAdmin ? 'bg-amber-500 border border-amber-600' : 'bg-slate-100 border border-slate-300'} py-3.5 rounded-xl flex-row items-center justify-center shadow-sm`}
                            >
                                <Ionicons name="camera-reverse-outline" size={16} color={isRejectedByAdmin ? "#0F172A" : "#475569"} />
                                <Text className={`${isRejectedByAdmin ? 'text-slate-950 font-black' : 'text-slate-700 font-black'} text-[10px] uppercase tracking-wider ml-2`}>
                                    {isRejectedByAdmin ? 'RE-UPLOAD CLEAR PHOTO' : 'UPDATE PHOTO'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Completely Locked */}
                        {isUploaded && isLockedByAdmin && (
                            <View className="flex-1 bg-green-50/50 border border-green-100 py-3.5 rounded-xl flex-row items-center justify-center">
                                <Ionicons name="lock-closed" size={16} color="#166534" />
                                <Text className="text-green-700 font-black text-[10px] uppercase tracking-widest ml-2">LOCKED BY ADMIN</Text>
                            </View>
                        )}
                    </View>
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

            <Header title="KYC Documents" />

            <ScrollView 
                className="flex-1 px-6 mt-8" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: Math.max(40, insets.bottom + 20), width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}
            >
                {/* Dynamic Notice Banner based on verification & rejection state */}
                {!loading && (
                    isVerified ? (
                        <View className="p-6 rounded-[24px] mb-8 border border-green-200 bg-green-50 flex-row items-center shadow-sm">
                            <View className="w-12 h-12 rounded-2xl bg-green-100 items-center justify-center border border-green-200">
                                <Ionicons name="shield-checkmark" size={26} color="#15803D" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="text-green-900 text-xs font-black uppercase tracking-wider">
                                    Account Verified
                                </Text>
                                <Text className="text-green-700/80 text-[10px] font-bold leading-4 mt-0.5">
                                    Your documents have been approved by the Admin and are securely locked.
                                </Text>
                            </View>
                        </View>
                    ) : verificationNote ? (
                        <View className="p-6 rounded-[24px] mb-8 border-2 border-rose-300 bg-rose-50 shadow-lg shadow-rose-500/10">
                            <View className="flex-row items-center mb-3">
                                <View className="w-10 h-10 rounded-xl bg-rose-500/10 items-center justify-center border border-rose-200 mr-3">
                                    <Ionicons name="close-circle" size={24} color="#E11D48" />
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row items-center flex-wrap">
                                        <Text className="text-rose-900 text-sm font-black uppercase tracking-wider">
                                            Document Rejected
                                        </Text>
                                        <View className="bg-rose-600 px-2 py-0.5 rounded ml-2">
                                            <Text className="text-white text-[9px] font-black uppercase tracking-widest">Action Required</Text>
                                        </View>
                                    </View>
                                    <Text className="text-rose-700 text-[10px] font-bold mt-0.5">
                                        Admin requested document re-upload
                                    </Text>
                                </View>
                            </View>
                            
                            <View className="bg-white/90 border-l-4 border-rose-600 p-4 rounded-r-xl border border-rose-200/80 shadow-sm">
                                <Text className="text-rose-900 text-[10px] font-black uppercase tracking-widest mb-1">
                                    Admin Rejection Reason:
                                </Text>
                                <Text className="text-slate-900 font-extrabold text-xs leading-5">
                                    "{verificationNote}"
                                </Text>
                            </View>

                            <View className="flex-row items-center mt-3 pt-3 border-t border-rose-200/60">
                                <Ionicons name="information-circle-outline" size={14} color="#BE123C" />
                                <Text className="text-rose-800 text-[10px] font-bold ml-1 flex-1">
                                    Please review the reason above and re-upload clear photos of your document(s).
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View className="p-6 rounded-[24px] mb-8 border border-amber-200 bg-amber-50 flex-row items-center shadow-sm">
                            <View className="w-12 h-12 rounded-2xl bg-amber-100 items-center justify-center border border-amber-200">
                                <Ionicons name="time" size={26} color="#D97706" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="text-amber-900 text-xs font-black uppercase tracking-wider">
                                    Pending Admin Review
                                </Text>
                                <Text className="text-amber-700/80 text-[10px] font-bold leading-4 mt-0.5">
                                    You can upload and edit photos of your documents until the admin approves them.
                                </Text>
                            </View>
                        </View>
                    )
                )}

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

            {/* Universal Image Preview Modal */}
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
                                    <Text className="text-white/60 mt-4 font-bold text-[12px] tracking-widest uppercase">Loading Image...</Text>
                                </View>
                            )}
                            <Image 
                                source={{ uri: previewImage.startsWith('http') ? getImageUrl(previewImage, { width: 1200, quality: 90 }) : previewImage }}
                                style={{ 
                                    width: screenWidth, 
                                    height: screenHeight * 0.85,
                                    resizeMode: 'contain' 
                                }}
                                onLoadStart={() => setImgLoading(true)}
                                onLoadEnd={() => setImgLoading(false)}
                                onError={(e) => {
                                    setImgError(e.nativeEvent.error);
                                    setImgLoading(false);
                                }}
                            />
                        </View>
                    ) : (imgError || previewImage) ? (
                        <View className="items-center px-10">
                            <View className="w-20 h-20 bg-amber-500/10 rounded-full items-center justify-center mb-6">
                                <Ionicons name="alert" size={48} color="#F59E0B" />
                            </View>
                            <Text className="text-white text-xl font-black mb-2 text-center">Failed to Load</Text>
                            <Text className="text-white/40 text-center text-[12px] leading-5">
                                The image couldn't be loaded properly. Try opening it externally.
                            </Text>
                            
                            <TouchableOpacity 
                                onPress={async () => {
                                    if (previewImage && previewImage.startsWith('http')) {
                                        await WebBrowser.openBrowserAsync(previewImage, {
                                            toolbarColor: '#1E293B',
                                            showTitle: true,
                                        });
                                    }
                                    setPreviewVisible(false);
                                }}
                                className="mt-8 bg-blue-600 px-10 py-4 rounded-2xl shadow-xl shadow-blue-900/40"
                            >
                                <Text className="text-white font-black uppercase tracking-widest text-[12px]">Open in Browser</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="items-center">
                            <ActivityIndicator color="#FFD700" size="large" />
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}