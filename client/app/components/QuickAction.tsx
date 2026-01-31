import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { FONT_SIZES, SPACING } from '../constants/theme';

interface QuickActionProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
}

export default function QuickAction({ icon, label, onPress }: QuickActionProps) {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={24} color={COLORS.black} />
            </View>
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    label: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.black,
        fontWeight: '500',
    },
});
