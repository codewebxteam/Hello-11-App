import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { FONT_SIZES, SPACING } from '../constants/theme';

interface InputProps extends TextInputProps {
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
}

export default function Input({ icon, iconColor = COLORS.gray400, ...props }: InputProps) {
    return (
        <View style={styles.container}>
            {icon && (
                <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />
            )}
            <TextInput
                style={styles.input}
                placeholderTextColor={COLORS.gray300}
                {...props}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.gray200,
        borderRadius: 12,
        paddingHorizontal: SPACING.md,
    },
    icon: {
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        paddingVertical: SPACING.md,
        fontSize: FONT_SIZES.md,
        color: COLORS.black,
    },
});
