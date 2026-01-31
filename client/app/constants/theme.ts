import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

export { COLORS };

export const COMMON_STYLES = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    shadow: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    card: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        padding: 20,
    },
});

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const FONT_SIZES = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
};
