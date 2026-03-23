import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, Animated, FlatList } from 'react-native';
import { useRouter, Redirect } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

const SLIDE_DATA = [
  { id: '1', title: 'Your Ultimate\nTravel Partner.', subTitle: 'Duri pata na chale. Travel anywhere\nwith comfort and ease.' },
  { id: '2', title: 'Track Your\nJourney.', subTitle: 'Real-time updates to keep you\ninformed at every step.' },
  { id: '3', title: 'Ready to\nExplore?', subTitle: 'Join Hello 11 and start your\nadventure today.' },
];

const Start = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Redirect href="/screens/HomeScreen" />;
  }

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const scrollX = useRef(new Animated.Value(0)).current;
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
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        router.push("/screens/LoginScreen");
      });
    }
  };

  return (
    <View className="flex-1 bg-[#FFD700]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        
        <Animated.View 
          style={{ opacity: fadeAnim }}
          className="flex-1 justify-center items-center px-6 min-h-[250px]"
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
              //  FIX: 102% ya 105% use karein edges cover karne ke liye
              style={{ width: '105%', height: '105%' }} 
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        <Animated.View 
          style={{ opacity: fadeAnim }}
          className="flex-[1.2] bg-white rounded-t-[50px] pt-10 shadow-inner min-h-[340px]"
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
                <Text className="text-slate-900 text-3xl font-black text-center">{item.title}</Text>
                <Text className="text-slate-500 text-base text-center mt-4">{item.subTitle}</Text>
              </View>
            )}
          />

          <View className="px-10 items-center pb-12">
            <View className="flex-row mb-10">
              {SLIDE_DATA.map((_, index) => (
                <View key={index} className={`h-2 rounded-full mx-1 ${activeIndex === index ? 'w-8 bg-[#FFD700]' : 'w-2 bg-slate-200'}`} />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleNext}
              className="bg-slate-900 w-full py-5 rounded-full items-center shadow-lg"
            >
              <Text className="text-white text-lg font-bold">
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