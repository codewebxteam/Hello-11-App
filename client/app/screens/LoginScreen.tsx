import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS } from '../constants/colors';
import { FONT_SIZES, SPACING, COMMON_STYLES } from '../constants/theme';

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const router = useRouter();

    const handleContinue = () => {
        if (phoneNumber.length === 10) {
            router.push('/screens/HomeScreen');
        }
    };

    return (
        <SafeAreaView style={COMMON_STYLES.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Logo Section */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="car-sport" size={60} color={COLORS.primary} />
                    </View>
                    <Text style={styles.appName}>RideNow</Text>
                    <Text style={styles.tagline}>Your ride, your way</Text>
                </View>

                {/* Login Form */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Welcome!</Text>
                    <Text style={styles.subtitle}>Enter your phone number to continue</Text>

                    <View style={styles.phoneInputWrapper}>
                        <View style={styles.countryCode}>
                            <Text style={styles.countryCodeText}>+91</Text>
                        </View>
                        <Input
                            placeholder="Phone Number"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            style={styles.phoneInput}
                        />
                    </View>

                    <Button
                        title="Continue"
                        onPress={handleContinue}
                        disabled={phoneNumber.length !== 10}
                        style={styles.continueButton}
                    />

                    <Text style={styles.termsText}>
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </Text>
                </View>

                {/* Features */}
                <View style={styles.features}>
                    <View style={styles.featureItem}>
                        <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
                        <Text style={styles.featureText}>Safe & Secure</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="flash" size={24} color={COLORS.primary} />
                        <Text style={styles.featureText}>Quick Booking</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="wallet" size={24} color={COLORS.primary} />
                        <Text style={styles.featureText}>Best Prices</Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.black,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    appName: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: SPACING.sm,
    },
    tagline: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray400,
    },
    formContainer: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: FONT_SIZES.md,
        color: COLORS.gray400,
        marginBottom: SPACING.xl,
    },
    phoneInputWrapper: {
        flexDirection: 'row',
        marginBottom: SPACING.lg,
    },
    countryCode: {
        backgroundColor: COLORS.gray100,
        paddingHorizontal: SPACING.md,
        paddingVertical: 18,
        borderWidth: 2,
        borderColor: COLORS.gray200,
        borderRadius: 12,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderRightWidth: 0,
        justifyContent: 'center',
    },
    countryCodeText: {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.black,
    },
    phoneInput: {
        flex: 1,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
    },
    continueButton: {
        marginBottom: SPACING.md,
    },
    termsText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray300,
        textAlign: 'center',
        lineHeight: 18,
    },
    features: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
    },
    featureItem: {
        alignItems: 'center',
    },
    featureText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray400,
        marginTop: SPACING.sm,
        fontWeight: '500',
    },
});
