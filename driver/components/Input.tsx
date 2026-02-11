import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';


interface InputProps extends TextInputProps {
    icon?: any;
    error?: string;
    isFocused?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    rightIcon?: any;
    onRightIconPress?: () => void;
}

const Input = ({
    icon,
    error,
    isFocused,
    rightIcon,
    onRightIconPress,
    ...props
}: InputProps) => {
    return (
        <View className="mb-3">
            <View
                className={`flex-row items-center border-[1.5px] rounded-[18px] bg-slate-50 px-4 h-[60px] ${isFocused ? 'border-[#FFD700] bg-white' : 'border-slate-100'
                    } ${error ? 'border-red-500' : ''}`}
            >
                {icon && (
                    <View className="mr-3">
                        {icon}
                    </View>
                )}

                <TextInput
                    className="flex-1 text-base text-slate-800 font-semibold h-full"
                    placeholderTextColor="#94A3B8"
                    {...props}
                />

                {rightIcon && (
                    <View onTouchEnd={onRightIconPress}>
                        {rightIcon}
                    </View>
                )}
            </View>
            {error && <Text className="text-red-500 text-xs ml-1 mt-1">{error}</Text>}
        </View>
    );
};

export default Input;
