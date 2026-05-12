import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, FlatList, useWindowDimensions, Platform } from 'react-native';
import { useRouter, Redirect } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const SLIDE_DATA = [
  {
    id: '1',
    title: 'THE ELITE\nRIDE.',
    subTitle: 'Experience luxury and comfort in every journey. Hello 11 is your premium travel partner.',
    icon: 'car-sport'
  },
  {
    id: '2',
    title: 'TRACK IN\nREAL-TIME.',
    subTitle: 'Stay informed with live updates. Track your ride from start to finish with pinpoint accuracy.',
    icon: 'location'
  },
  {
    id: '3',
    title: 'JOIN THE\nCIRCLE.',
    subTitle: 'Become a member today and unlock exclusive benefits and priority bookings.',
    icon: 'people'
  },
];

const Start = () => {
  const { isAuthenticated } = useAuth();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const scrollX = useRef(new Animated.Value(0)).current;

  if (isAuthenticated) {
    return <Redirect href="/screens/HomeScreen" />;
  }

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        if (currentIndex !== activeIndex) setActiveIndex(currentIndex);
      }
    }
  );

  const handleNext = () => {
    if (activeIndex < SLIDE_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.push("/screens/LoginScreen");
    }
  };

  return (
    <View className="flex-1 bg-[#FFD700]">
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Soft Premium Glows */}
      <View className="absolute top-[-100] right-[-100] w-96 h-96 bg-white/20 rounded-full" />
      <View className="absolute bottom-[-150] left-[-100] w-[500px] h-[500px] bg-black/5 rounded-full" />

      <SafeAreaView className="flex-1">

        {/* Top Branding Section - Reduced height slightly */}
        <View className="items-center mt-4 h-[30%] justify-center">
          <View className="bg-white p-5 rounded-[50px] shadow-2xl shadow-black/10 border border-white/50">
            <Image
              source={require('../assets/images/official_logo.png')}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
          </View>
          <View className="mt-6 items-center">
            <Text className="text-black text-4xl font-black tracking-tighter italic">
              HELLO <Text className="text-white shadow-sm">11</Text>
            </Text>
          </View>
        </View>

        {/* Content Section - Added vertical padding to prevent cutting */}
        <View className="flex-1">
          <FlatList
            ref={flatListRef}
            data={SLIDE_DATA}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 20 }}
            renderItem={({ item }) => (
              <View style={{ width: width }} className="px-8 justify-center py-4">
                <View
                  className="bg-white p-8 rounded-[45px] shadow-2xl border border-white/40 items-center"
                  style={{
                    elevation: 15,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.1,
                    shadowRadius: 20
                  }}
                >
                  <View className="bg-[#FFD700]/15 p-5 rounded-[28px] mb-6">
                    <Ionicons name={item.icon as any} size={32} color="#000" />
                  </View>
                  <Text className="text-black text-3xl font-black text-center tracking-tight italic leading-tight">
                    {item.title}
                  </Text>
                  <Text className="text-slate-500 text-sm text-center mt-4 font-medium leading-5 px-2">
                    {item.subTitle}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>

        {/* Footer Controls */}
        <View className="px-10 pb-8 items-center">
          {/* Progress Indicators */}
          <View className="flex-row mb-8">
            {SLIDE_DATA.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full mx-1.5 ${activeIndex === index ? 'w-10 bg-black' : 'w-2 bg-black/10'}`}
              />
            ))}
          </View>

          {/* Main Action Button with Visual Feedback */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleNext}
            className="bg-black w-full py-4 rounded-[25px] items-center shadow-2xl shadow-black/30 active:bg-slate-800"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 15 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              transform: [{ scale: 1 }] // Base scale
            }}
          >
            <Text className="text-[#FFD700] text-base font-black uppercase tracking-[3px]">
              {activeIndex === SLIDE_DATA.length - 1 ? "Start Journey" : "Next Step"}
            </Text>
          </TouchableOpacity>

          {/* Skip Option */}
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => router.push("/screens/LoginScreen")}
            className="mt-8 active:opacity-40"
          >
            <Text className="text-black/40 font-bold text-[12px] uppercase tracking-[2px]">
              Skip Introduction
            </Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
};

export default Start;
