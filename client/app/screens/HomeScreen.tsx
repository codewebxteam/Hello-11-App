import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
  Platform,
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  BackHandler,
  ToastAndroid
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router"; //
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import ProfileScreen from "./ProfileScreen";
import SearchingRideOverlay from "../../components/SearchingRideOverlay";
import DriverAssignedOverlay from "../../components/DriverAssignedOverlay";


const { width, height } = Dimensions.get('window');


const HomeScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter(); // router initialize kiya
  const displayName = params.userName || "Shiv";

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isDriverAssigned, setIsDriverAssigned] = useState(false);

  const [activeTab, setActiveTab] = useState("Home");


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // --- DOUBLE BACK PRESS TO EXIT LOGIC ---
  useEffect(() => {
    let backPressCount = 0;

    const backAction = () => {
      if (activeTab !== "Home") {
        setActiveTab("Home");
        return true;
      }

      if (backPressCount === 0) {
        backPressCount++;
        if (Platform.OS === 'android') {
          ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
        }

        setTimeout(() => {
          backPressCount = 0;
        }, 2000);
        return true;
      } else {
        BackHandler.exitApp();
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [activeTab]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, []);

  const handleFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 120, animated: true });
    }, 100);
  };

  const TabItem = ({ name, icon, label }: { name: string, icon: any, label: string }) => (
    <TouchableOpacity
      className="items-center justify-center pt-2 w-1/4"
      onPress={() => {
        if (name === "Booking") {
          // Folder structure ke hisaab se redirection
          router.push("/screens/BookingScreen");
        } else {
          setActiveTab(name);
        }
      }}
    >
      <Ionicons
        name={activeTab === name ? icon : `${icon}-outline`}
        size={24}
        color={activeTab === name ? "#1E293B" : "#94A3B8"}
      />
      <Text className={`text-[11px] font-bold mt-1 ${activeTab === name ? "text-slate-800" : "text-slate-400"}`}>
        {label}
      </Text>
      {activeTab === name && <View className="w-1 h-1 rounded-full bg-slate-800 mt-1" />}
    </TouchableOpacity>
  );

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {activeTab === "Home" && (
        <>
          <View className="h-[45vh] bg-[#FFD700] rounded-b-[50px] z-10 relative overflow-hidden">
            <View className="absolute -bottom-[20%] self-center w-[150%] h-[20%] bg-white rounded-[100%] scale-x-[1.3] opacity-10" />

            <SafeAreaView className="flex-1 px-6 pt-4">
              <View className="flex-row justify-between items-center mt-2">
                <View>
                  <Text className="text-base text-slate-800 font-medium opacity-70">Hello,</Text>
                  <Text className="text-3xl text-slate-800 font-black tracking-tight">{displayName}</Text>
                </View>
                <TouchableOpacity className="bg-white p-3 rounded-full shadow-sm elevation-3 relative">
                  <Ionicons name="notifications-outline" size={24} color="#1E293B" />
                  <View className="absolute top-2.5 right-3 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
                </TouchableOpacity>
              </View>

              <View className="mt-8">
                <Text className="text-4xl font-black text-slate-800 leading-[44px] italic">Where are you{"\n"}going today?</Text>
                <Text className="text-base text-slate-800 mt-3 mb-5 font-semibold opacity-75">Book your ride with Hello11</Text>
              </View>
            </SafeAreaView>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 z-20 -mt-16"
          >
            <ScrollView
              ref={scrollViewRef}
              contentContainerClassName="px-6 pb-32"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View
                className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 z-50 elevation-10"
                style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
              >
                <View className="mb-4">
                  <View className="flex-row items-center mb-2.5">
                    <View className="w-8 items-center">
                      <View className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-blue-200" />
                      <View className="w-[2px] h-9 bg-slate-200 my-1 border-dashed" />
                    </View>
                    <View className="flex-1 ml-3 border-b border-slate-100 pb-2">
                      <Text className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">From where</Text>
                      <TextInput
                        className="text-base text-slate-800 font-semibold mt-0.5"
                        placeholder="Current Location"
                        placeholderTextColor="#94A3B8"
                        value={source}
                        onChangeText={setSource}
                        onFocus={handleFocus}
                      />
                    </View>
                  </View>

                  <View className="flex-row items-center mb-2.5">
                    <View className="w-8 items-center pt-1"><Ionicons name="location" size={20} color="#F97316" /></View>
                    <View className="flex-1 ml-3 border-b border-slate-100 pb-2">
                      <Text className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Where to go</Text>
                      <TextInput
                        className="text-base text-slate-800 font-semibold mt-0.5"
                        placeholder="Enter Destination"
                        placeholderTextColor="#94A3B8"
                        value={destination}
                        onChangeText={setDestination}
                        onFocus={handleFocus}
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  className="bg-slate-800 py-4 rounded-[18px] items-center flex-row justify-center active:opacity-90"
                  activeOpacity={0.8}
                  onPress={() => {
                    Keyboard.dismiss();
                    if (destination.trim()) {
                      setIsSearching(true);
                      // After 3 seconds, show driver assigned overlay
                      setTimeout(() => {
                        setIsSearching(false);
                        setIsDriverAssigned(true);
                      }, 3000);
                    } else {
                      ToastAndroid.show("Please enter a destination", ToastAndroid.SHORT);
                    }
                  }}
                >
                  <Text className="text-white text-lg font-extrabold tracking-wide">Search Ride</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

              </Animated.View>

              <Animated.View className="mt-8" style={[{ opacity: fadeAnim }]}>
                <Text className="text-lg font-extrabold text-slate-800 mb-4">Recent Places</Text>
                <TouchableOpacity className="flex-row items-center bg-slate-50 p-4 rounded-[18px] mb-2.5 border border-slate-100">
                  <View className="bg-white p-2 rounded-xl mr-4"><Ionicons name="time-outline" size={20} color="#64748B" /></View>
                  <View>
                    <Text className="text-[15px] text-slate-800 font-bold">Lucknow Railway Station</Text>
                    <Text className="text-xs text-slate-400 font-medium mt-0.5">Lucknow, Uttar Pradesh</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </>
      )}

      {activeTab === "Profile" && <ProfileScreen />}

      {activeTab === "Activity" && (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-slate-500 font-bold">Activity Coming Soon!</Text>
        </View>
      )}

      {/* Bottom Tab Bar */}
      <View
        className="absolute bottom-0 w-full bg-white flex-row justify-around items-center border-t border-slate-100 shadow-2xl elevation-[25] z-50"
        style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 10 }}
      >
        <TabItem name="Home" icon="home" label="Home" />
        <TabItem name="Activity" icon="list" label="Activity" />
        <TabItem name="Booking" icon="calendar" label="Booking" />
        <TabItem name="Profile" icon="person" label="Profile" />
      </View>

      {/* Ride Searching Overlay */}
      <SearchingRideOverlay
        isVisible={isSearching}
        onCancel={() => setIsSearching(false)}
        pickupLocation={source || "Current Location"}
        dropLocation={destination || "Select Destination"}
        rideMode="Standard"
      />

      {/* Driver Assigned Overlay */}
      <DriverAssignedOverlay
        isVisible={isDriverAssigned}
        onClose={() => setIsDriverAssigned(false)}
        onCallDriver={() => console.log("Call driver")}
        onCancel={() => setIsDriverAssigned(false)}
        onBookRide={() => {
          setIsDriverAssigned(false);
          router.push("/screens/LiveRideTrackingScreen");
        }}
      />
    </View>

  );
};

export default HomeScreen;