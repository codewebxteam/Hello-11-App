import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONT_SIZES, SPACING } from '../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
    style?: ViewStyle;
}

export default function Button({ title, onPress, disabled = false, variant = 'primary', style }: ButtonProps) {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
                disabled && styles.disabledButton,
                style,
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            <Text style={[styles.buttonText, disabled && styles.disabledText]}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 12,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
    },
    secondaryButton: {
        backgroundColor: COLORS.gray200,
    },
    disabledButton: {
        backgroundColor: COLORS.gray200,
    },
    buttonText: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    disabledText: {
        color: COLORS.gray300,
    },
});
