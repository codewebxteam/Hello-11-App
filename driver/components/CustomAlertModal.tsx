import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, DeviceEventEmitter, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const SHOW_CUSTOM_ALERT = 'SHOW_CUSTOM_ALERT';

type AlertButton = {
    text?: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
};

type AlertData = {
    title: string;
    message?: string;
    buttons?: AlertButton[];
    options?: { cancelable?: boolean; onDismiss?: () => void };
};

export default function CustomAlertModal() {
    const [visible, setVisible] = useState(false);
    const [alertData, setAlertData] = useState<AlertData | null>(null);
    const scaleValue = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener(SHOW_CUSTOM_ALERT, (data: AlertData) => {
            setAlertData(data);
            setVisible(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            
            scaleValue.setValue(0.8);
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
                tension: 65,
                friction: 7,
            }).start();
        });

        return () => subscription.remove();
    }, [scaleValue]);

    const handleClose = () => {
        Animated.timing(scaleValue, {
            toValue: 0.8,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
            if (alertData?.options?.onDismiss) {
                alertData.options.onDismiss();
            }
            setAlertData(null);
        });
    };

    const handleButtonPress = (button?: AlertButton) => {
        if (button?.onPress) {
            button.onPress();
        }
        handleClose();
    };

    if (!visible || !alertData) return null;

    const defaultButtons: AlertButton[] = [{ text: 'OK', style: 'default' }];
    const incomingButtons = alertData.buttons && alertData.buttons.length > 0 ? alertData.buttons : defaultButtons;
    const isNegativeButton = (btn: AlertButton) => {
        const t = (btn.text || '').trim().toLowerCase();
        return (
            btn.style === 'cancel' ||
            t === 'no' ||
            t.startsWith('no ') ||
            t.includes('cancel') ||
            t.includes('later') ||
            t.includes('close') ||
            t.includes('not now')
        );
    };
    const buttonsToRender = [
        ...incomingButtons.filter((btn) => !isNegativeButton(btn)),
        ...incomingButtons.filter((btn) => isNegativeButton(btn)),
    ];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={() => {
                const cancelable = alertData.options?.cancelable !== false;
                if (cancelable) handleClose();
            }}
        >
            <View className="flex-1 bg-black/60 justify-center items-center px-6">
                <Animated.View 
                    style={{ transform: [{ scale: scaleValue }] }}
                    className="w-full max-w-[400px] bg-slate-900 rounded-[32px] p-6 shadow-2xl border border-slate-700/50 relative overflow-hidden items-center"
                >
                    {/* Background decoration */}
                    <View className="absolute -top-20 -right-20 w-40 h-40 bg-[#FFD700] rounded-full opacity-5 blur-3xl" />
                    
                    {/* Header Icon */}
                    <View className="w-14 h-14 rounded-full bg-slate-800 items-center justify-center mb-5 border border-slate-700">
                        <Ionicons name="notifications" size={26} color="#FFD700" />
                    </View>

                    {/* Text content */}
                    <Text className="text-white text-xl font-black mb-2 text-center">{alertData.title}</Text>
                    {alertData.message ? (
                        <Text className="text-slate-400 text-[15px] font-medium leading-6 mb-8 text-center">
                            {alertData.message}
                        </Text>
                    ) : ( <View className="mb-6" /> )}

                    {/* Action Buttons */}
                    <View className={`w-full ${buttonsToRender.length > 1 ? 'flex-col' : 'flex-row justify-center'}`}>
                        {buttonsToRender.map((btn, index) => {
                            const isCancel = btn.style === 'cancel';
                            const isDestructive = btn.style === 'destructive';
                            const isLast = index === buttonsToRender.length - 1;
                            
                            // Determine styles based on button type
                            let btnBg = "bg-[#FFD700]";
                            let textColor = "text-slate-900";
                            
                            if (isCancel && buttonsToRender.length > 1) {
                                btnBg = "bg-slate-800 border border-slate-700";
                                textColor = "text-slate-300";
                            } else if (isDestructive) {
                                btnBg = "bg-red-500/20";
                                textColor = "text-red-500";
                            } else if (buttonsToRender.length > 1 && index === 0 && !btn.style) {
                                // First button of 2 is conventionally negative/neutral if no style is given
                                btnBg = "bg-slate-800 border border-slate-700";
                                textColor = "text-slate-300";
                            }
                            
                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => handleButtonPress(btn)}
                                    className={`py-4 px-6 rounded-2xl items-center justify-center w-full ${buttonsToRender.length > 1 ? (isLast ? 'mb-0' : 'mb-3') : 'max-w-[140px]'} ${btnBg}`}
                                    activeOpacity={0.8}
                                >
                                    <Text className={`font-black text-sm uppercase tracking-wider ${textColor}`}>
                                        {btn.text || 'OK'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}
