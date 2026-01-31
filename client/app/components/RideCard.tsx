import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { FONT_SIZES, SPACING } from '../constants/theme';

interface RideCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    name: string;
    description: string;
    price: string;
    onPress?: () => void;
}

export default function RideCard({ icon, name, description, price, onPress }: RideCardProps) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.info}>
                <Ionicons name={icon} size={32} color={COLORS.black} />
                <View style={styles.details}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.description}>{description}</Text>
                </View>
            </View>
            <Text style={styles.price}>{price}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 15,
        marginBottom: 12,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    info: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    details: {
        marginLeft: 15,
    },
    name: {
        fontSize: FONT_SIZES.md,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    description: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray400,
        marginTop: 2,
    },
    price: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.black,
    },
});
