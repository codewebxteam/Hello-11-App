import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS } from '../constants/colors';
import { FONT_SIZES, SPACING, COMMON_STYLES } from '../constants/theme';

export default function ProfileScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [gender, setGender] = useState('');
    const router = useRouter();

    const handleSave = () => {
        if (name.trim()) {
            router.back();
        }
    };

    return (
        <SafeAreaView style={COMMON_STYLES.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Profile</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {/* Profile Picture */}
                    <View style={styles.profilePictureSection}>
                        <View style={styles.profilePicture}>
                            <Ionicons name="person" size={50} color={COLORS.gray400} />
                        </View>
                        <TouchableOpacity style={styles.editIconContainer}>
                            <Ionicons name="camera" size={20} color={COLORS.black} />
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.title}>Your Details</Text>
                        <Text style={styles.subtitle}>Update your information</Text>

                        {/* Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <Input
                                icon="person-outline"
                                placeholder="Enter your name"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email (Optional)</Text>
                            <Input
                                icon="mail-outline"
                                placeholder="Enter your email"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        {/* Gender Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Gender (Optional)</Text>
                            <View style={styles.genderContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.genderButton,
                                        gender === 'male' && styles.genderButtonActive
                                    ]}
                                    onPress={() => setGender('male')}
                                >
                                    <Ionicons
                                        name="male"
                                        size={24}
                                        color={gender === 'male' ? COLORS.black : COLORS.gray400}
                                    />
                                    <Text style={[
                                        styles.genderText,
                                        gender === 'male' && styles.genderTextActive
                                    ]}>Male</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.genderButton,
                                        gender === 'female' && styles.genderButtonActive
                                    ]}
                                    onPress={() => setGender('female')}
                                >
                                    <Ionicons
                                        name="female"
                                        size={24}
                                        color={gender === 'female' ? COLORS.black : COLORS.gray400}
                                    />
                                    <Text style={[
                                        styles.genderText,
                                        gender === 'female' && styles.genderTextActive
                                    ]}>Female</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.genderButton,
                                        gender === 'other' && styles.genderButtonActive
                                    ]}
                                    onPress={() => setGender('other')}
                                >
                                    <Ionicons
                                        name="person"
                                        size={24}
                                        color={gender === 'other' ? COLORS.black : COLORS.gray400}
                                    />
                                    <Text style={[
                                        styles.genderText,
                                        gender === 'other' && styles.genderTextActive
                                    ]}>Other</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Save Button */}
                <View style={styles.footer}>
                    <Button
                        title="Save Changes"
                        onPress={handleSave}
                        disabled={!name.trim()}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    placeholder: {
        width: 32,
    },
    profilePictureSection: {
        alignItems: 'center',
        marginVertical: SPACING.xl,
    },
    profilePicture: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.gray100,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: '35%',
        backgroundColor: COLORS.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    formContainer: {
        paddingHorizontal: SPACING.lg,
    },
    title: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray400,
        marginBottom: SPACING.xl,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: SPACING.sm,
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    genderButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderWidth: 2,
        borderColor: COLORS.gray200,
        borderRadius: 12,
        backgroundColor: COLORS.white,
    },
    genderButtonActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.lightYellow,
    },
    genderText: {
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        color: COLORS.gray400,
        marginLeft: SPACING.sm,
    },
    genderTextActive: {
        color: COLORS.black,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.lg,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
    },
});
