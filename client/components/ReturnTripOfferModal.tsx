import { View, Text, TouchableOpacity, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface ReturnTripOfferModalProps {
    isVisible: boolean;
    isAccepting?: boolean;
    waitingLimitMins: number;
    onClose: () => void;
    onAccept: () => void;
}

const ReturnTripOfferModal = ({ isVisible, isAccepting = false, waitingLimitMins, onClose, onAccept }: ReturnTripOfferModalProps) => {
    if (!isVisible) return null;

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            onRequestClose={isAccepting ? undefined : onClose}
        >
            <View className="flex-1 bg-black/70 justify-center items-center px-4">
                <Animated.View
                    entering={ZoomIn.duration(400).springify()}
                    className="bg-white w-full rounded-[30px] overflow-hidden relative"
                >
                    {/* Confetti/Decoration Background */}
                    <View className="absolute top-0 left-0 right-0 h-32 bg-[#FFD700] opacity-20" />

                    {/* Header Content */}
                    <View className="items-center pt-8 pb-4">
                        <View className="bg-[#FFD700] p-4 rounded-full mb-3 shadow-lg shadow-orange-200">
                            <Ionicons name="repeat" size={32} color="black" />
                        </View>
                        <Text className="text-2xl font-black text-slate-900 text-center px-4">
                            Book Return Trip?
                        </Text>
                        <Text className="text-slate-500 font-bold text-center mt-1">
                            Driver will wait for you
                        </Text>
                    </View>

                    {/* Offer Card */}
                    <View className="mx-5 bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-6 relative overflow-hidden">
                        {/* Discount Badge */}
                        <View className="absolute -right-12 top-4 bg-red-500 py-1 w-40 transform rotate-45 items-center shadow-sm">
                            <Text className="text-white font-black text-xs">LIMITED OFFER</Text>
                        </View>

                        <View className="flex-row items-end justify-center mb-2">
                            <Text className="text-5xl font-black text-slate-900">60</Text>
                            <View className="mb-2 ml-1">
                                <Text className="text-xl font-black text-slate-900 leading-5">%</Text>
                                <Text className="text-xl font-black text-slate-900 leading-5">OFF</Text>
                            </View>
                        </View>
                        <Text className="text-center text-slate-600 font-bold text-sm bg-[#FFD700]/20 py-1.5 px-3 rounded-lg overflow-hidden self-center">
                            on your return journey
                        </Text>

                        {/* Waiting Logic */}
                        <View className="mt-4 pt-4 border-t border-slate-200">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="time-outline" size={16} color="#64748B" />
                                <Text className="text-slate-500 text-xs font-bold ml-2">
                                    Free waiting up to {waitingLimitMins} mins
                                </Text>
                            </View>
                            <View className="flex-row items-center">
                                <Ionicons name="wallet-outline" size={16} color="#64748B" />
                                <Text className="text-slate-500 text-xs font-bold ml-2">
                                    Pay ₹100/hour waiting fee after that
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="px-5 pb-8 flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => {
                                console.log("[ReturnModal] No thanks clicked");
                                onClose();
                            }}
                            disabled={isAccepting}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            className={`flex-1 py-4 bg-slate-100 rounded-2xl items-center justify-center ${isAccepting ? 'opacity-50' : 'active:bg-slate-200'}`}
                        >
                            <Text className="font-bold text-slate-500">No, thanks</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                console.log("[ReturnModal] Accept clicked");
                                onAccept();
                            }}
                            disabled={isAccepting}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            className={`flex-[2] py-4 bg-slate-900 rounded-2xl items-center justify-center shadow-lg shadow-slate-300 flex-row ${isAccepting ? 'opacity-70' : 'active:scale-95'}`}
                        >
                            {isAccepting ? (
                                <ActivityIndicator color="#FFD700" size="small" />
                            ) : (
                                <>
                                    <Text className="font-black text-[#FFD700] mr-2">YES, BOOK IT</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#FFD700" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
};

export default ReturnTripOfferModal;
