import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    isLoading?: boolean;
    icon?: any;
    className?: string;
}

const Button = ({
    title,
    onPress,
    variant = 'primary',
    isLoading,
    icon = <Ionicons name="chevron-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />,
    className
}: ButtonProps) => {
    const { controlHeight, isSmallPhone } = useResponsive();
    const baseClasses = "flex-row items-center justify-center rounded-3xl";
    const variantClasses = {
        primary: "bg-slate-800",
        secondary: "bg-orange-500",
        outline: "bg-transparent border border-slate-800"
    };
    const textClasses = {
        primary: "text-white",
        secondary: "text-white",
        outline: "text-slate-800"
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={{ minHeight: controlHeight, paddingVertical: isSmallPhone ? 12 : 14, paddingHorizontal: 16 }}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator color="white" />
            ) : (
                <>
                    <Text className={`font-extrabold ${textClasses[variant]}`} style={{ fontSize: isSmallPhone ? 16 : 18 }}>{title}</Text>
                    {icon}
                </>
            )}
        </TouchableOpacity>
    );
};

export default Button;
