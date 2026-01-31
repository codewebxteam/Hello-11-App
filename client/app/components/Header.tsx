import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { FONT_SIZES, SPACING } from '../constants/theme';

interface HeaderProps {
    title: string;
    onMenuPress?: () => void;
    onProfilePress?: () => void;
    showMenu?: boolean;
    showProfile?: boolean;
}

export default function Header({
    title,
    onMenuPress,
    onProfilePress,
    showMenu = true,
    showProfile = true
}: HeaderProps) {
    return (
        <View style={styles.header}>
            {showMenu ? (
                <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
                    <Ionicons name="menu" size={28} color={COLORS.black} />
                </TouchableOpacity>
            ) : (
                <View style={styles.placeholder} />
            )}

            <Text style={styles.title}>{title}</Text>

            {showProfile ? (
                <TouchableOpacity style={styles.iconButton} onPress={onProfilePress}>
                    <Ionicons name="person-circle-outline" size={28} color={COLORS.black} />
                </TouchableOpacity>
            ) : (
                <View style={styles.placeholder} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: 15,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    iconButton: {
        padding: 5,
    },
    title: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    placeholder: {
        width: 38,
    },
});
