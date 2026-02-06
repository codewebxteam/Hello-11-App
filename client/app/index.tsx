import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
  Platform
} from 'react-native';
import { useRouter } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// Tablet detection (Common breakpoint: 768px)
const isTablet = width > 768;

const SLIDE_DATA = [
  { id: '1', title: 'Your Ultimate\nTravel Partner.', subTitle: 'Duri pata na chale. Travel anywhere\nwith comfort and ease.' },
  { id: '2', title: 'Track Your\nJourney.', subTitle: 'Real-time updates to keep you\ninformed at every step.' },
  { id: '3', title: 'Ready to\nExplore?', subTitle: 'Join Hello 11 and start your\nadventure today.' },
];

const Start = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const scrollX = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -width * 0.1, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start(() => {
        router.push("/screens/LoginScreen");
      });
    }
  };

  return (
    <View className="flex-1 bg-[#FFD700]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        
        {/* Upper Section: Logo Image Container */}
        <Animated.View 
          style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}
          className="flex-[1.3] justify-center items-center px-6"
        >
          <View 
            style={{ 
              width: isTablet ? width * 0.45 : width * 0.65, 
              aspectRatio: 1 
            }}
            className="bg-white rounded-full justify-center items-center overflow-hidden shadow-2xl border-4 border-white/30"
          >
            <Image
              source={require('../assets/images/imgss.jpeg')}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Bottom Section: Interactive Sheet */}
        <Animated.View 
          style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}
          className="flex-1 bg-white rounded-t-[50px] pt-10 md:pt-16 shadow-inner"
        >
          <Animated.FlatList
            ref={flatListRef}
            data={SLIDE_DATA}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width: width }} className="px-10 items-center justify-start">
                <Text className="text-slate-900 text-3xl md:text-5xl font-black text-center leading-tight">
                  {item.title}
                </Text>
                <Text className="text-slate-500 text-base md:text-xl text-center leading-6 mt-4 md:mt-6 max-w-[85%] md:max-w-[70%]">
                  {item.subTitle}
                </Text>
              </View>
            )}
          />

          {/* Footer: Pagination & Button */}
          <View className={`px-10 items-center ${isTablet ? 'pb-20' : 'pb-12'}`}>
            {/* Custom Pagination Dots */}
            <View className="flex-row mb-10">
              {SLIDE_DATA.map((_, index) => (
                <View 
                  key={index} 
                  className={`h-2 rounded-full mx-1 transition-all duration-300 ${
                    activeIndex === index ? 'w-8 bg-[#FFD700]' : 'w-2 bg-slate-200'
                  }`} 
                />
              ))}
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.9}
              className="bg-slate-900 w-full max-w-md py-5 rounded-full items-center shadow-lg"
            >
              <Text className="text-white text-lg md:text-xl font-bold">
                {activeIndex === SLIDE_DATA.length - 1 ? "Get started" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
};

export default Start;