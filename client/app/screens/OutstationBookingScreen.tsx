import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Alert, ActivityIndicator, Platform, FlatList, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { bookingAPI, locationAPI, driverAPI, fareAPI } from '../../utils/api';
import { initSocket } from '../../utils/socket';

const OutstationBookingScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Location state
  const [pickup, setPickup] = useState(params.pickup as string || '');
  const [drop, setDrop] = useState(params.drop as string || '');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lon: number } | null>(
    params.pLat ? { lat: parseFloat(params.pLat as string), lon: parseFloat(params.pLon as string) } : null
  );
  const [dropCoords, setDropCoords] = useState<{ lat: number; lon: number } | null>(
    params.dLat ? { lat: parseFloat(params.dLat as string), lon: parseFloat(params.dLon as string) } : null
  );
  const [distanceKm, setDistanceKm] = useState<number>(
    params.dist ? parseFloat(params.dist as string) : 0
  );

  // Fare/Vehicle state
  const [carType, setCarType] = useState<'5seater' | '7seater'>('5seater');
  const [fares, setFares] = useState<{ [key: string]: { fare: number; total: number; time: number; nightSurcharge: number; isNight: boolean } }>({
    '5seater': { fare: 0, total: 0, time: 0, nightSurcharge: 0, isNight: false },
    '7seater': { fare: 0, total: 0, time: 0, nightSurcharge: 0, isNight: false },
  });
  const [loadingFares, setLoadingFares] = useState(false);

  // UI state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<'pickup' | 'drop' | null>(null);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);

  const [bookingType, setBookingType] = useState<'now' | 'schedule'>('now');
  const [isBooking, setIsBooking] = useState(false);

  // Searching state — shown after booking is created
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const searchingDotAnim = useRef(new Animated.Value(0)).current;
  const pollInterval = useRef<any>(null);

  // Schedule state
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date(Date.now() + 3600000)); // 1hr from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ─── Autocomplete ────────────────────────────────────────────────────────────
  useEffect(() => {
    const query = activeInput === 'pickup' ? pickup : drop;
    if (!query || query.length < 3) { setSuggestions([]); return; }

    const timer = setTimeout(async () => {
      try {
        // Pass pickup coords so backend restricts suggestions to India + 50km radius
        const userLat = pickupCoords?.lat;
        const userLon = pickupCoords?.lon;
        const res = await locationAPI.getAutocomplete(query, userLat, userLon);
        setSuggestions(res.data.data || []);
      } catch { setSuggestions([]); }
    }, 500);
    return () => clearTimeout(timer);
  }, [pickup, drop, activeInput, pickupCoords]);

  // ─── Calculate Fare (fetch for both vehicle types simultaneously) ──────────
  useEffect(() => {
    if (distanceKm > 0) {
      const fetchFares = async () => {
        setLoadingFares(true);
        try {
          const bookingTime = bookingType === 'schedule' ? scheduledDate.toISOString() : new Date().toISOString();
          
          const [res5, res7] = await Promise.all([
            fareAPI.calculateTripFare({ distance: distanceKm, carType: '5seater', service: 'rental', bookingTime }),
            fareAPI.calculateTripFare({ distance: distanceKm, carType: '7seater', service: 'rental', bookingTime })
          ]);

          const newFares = { ...fares };
          if (res5.data?.success) {
            newFares['5seater'] = {
              fare: res5.data.data.oneWayFare,
              total: res5.data.data.totalFare,
              time: res5.data.data.allowedTimeMinutes,
              nightSurcharge: res5.data.data.nightSurcharge ?? 0,
              isNight: res5.data.data.isNightSurcharge ?? false
            };
          }
          if (res7.data?.success) {
            newFares['7seater'] = {
              fare: res7.data.data.oneWayFare,
              total: res7.data.data.totalFare,
              time: res7.data.data.allowedTimeMinutes,
              nightSurcharge: res7.data.data.nightSurcharge ?? 0,
              isNight: res7.data.data.isNightSurcharge ?? false
            };
          }
          setFares(newFares);
        } catch (err) {
          console.error('Fare calculation error:', err);
        } finally {
          setLoadingFares(false);
        }
      };
      fetchFares();
    }
  }, [distanceKm, bookingType, scheduledDate]);

  // ─── Distance + Drivers (Availability Check) ─────────────────────────────────
  const fetchDistanceAndDrivers = useCallback(async () => {
    if (!pickupCoords || !dropCoords) return;
    try {
      // Distance
      const dirRes = await locationAPI.getDirections(
        pickupCoords.lat, pickupCoords.lon,
        dropCoords.lat, dropCoords.lon
      );
      if (dirRes.data?.data?.distanceKm) {
        setDistanceKm(parseFloat(dirRes.data.data.distanceKm));
      }

      // Nearby drivers (Just to verify some availability, though for "Ride Now" we want to know if *any* exist)
      setLoadingDrivers(true);
      const driverRes = await driverAPI.getNearbyDrivers(pickupCoords.lat, pickupCoords.lon);
      setNearbyDrivers(driverRes.data?.data || driverRes.data?.drivers || []);
    } catch (err) {
      console.error('Distance/Drivers error:', err);
    } finally {
      setLoadingDrivers(false);
    }
  }, [pickupCoords, dropCoords]);

  useEffect(() => {
    fetchDistanceAndDrivers();
  }, [fetchDistanceAndDrivers]);

  // ─── Searching animation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isSearchingDriver) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(searchingDotAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(searchingDotAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      searchingDotAnim.setValue(0);
    }
  }, [isSearchingDriver]);

  // ─── Poll booking status when searching ──────────────────────────────────────
  useEffect(() => {
    if (!isSearchingDriver || !activeBookingId) return;

    const checkStatus = async () => {
      try {
        const res = await bookingAPI.getBookingStatus(activeBookingId);
        const status = res.data?.booking?.status;
        if (status && status !== 'pending') {
          clearInterval(pollInterval.current);
          setIsSearchingDriver(false);
          if (status === 'cancelled') {
            Alert.alert('No Driver Found', 'Could not find a driver. Please try again.');
          } else {
            router.replace({
              pathname: '/screens/LiveRideTrackingScreen',
              params: { bookingId: activeBookingId }
            });
          }
        }
      } catch { }
    };

    // Poll every 4 seconds
    pollInterval.current = setInterval(checkStatus, 4000);
    checkStatus(); // immediate first check

    // Also listen via socket
    let socketRef: any;
    initSocket().then(socket => {
      socketRef = socket;
      socket?.on('rideStatusUpdate', (data: any) => {
        if (String(data.bookingId) === String(activeBookingId) && data.status !== 'pending') {
          clearInterval(pollInterval.current);
          setIsSearchingDriver(false);
          router.replace({
            pathname: '/screens/LiveRideTrackingScreen',
            params: { bookingId: activeBookingId }
          });
        }
      });
      socket?.on('bookingCancelledByUser', (data: any) => {
        if (String(data.bookingId) === String(activeBookingId)) {
          clearInterval(pollInterval.current);
          setIsSearchingDriver(false);
        }
      });
    });

    return () => {
      clearInterval(pollInterval.current);
      socketRef?.off('rideStatusUpdate');
      socketRef?.off('bookingCancelledByUser');
    };
  }, [isSearchingDriver, activeBookingId]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const isLongDistance = distanceKm >= 40;

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
  };

  const formatScheduledDate = (date: Date) => {
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  // ─── Confirm Booking ─────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!pickup || !drop) {
      Alert.alert('Missing Info', 'Please enter pickup and drop locations.');
      return;
    }
    if (!pickupCoords || !dropCoords) {
      Alert.alert('Select from suggestions', 'Please select locations from the autocomplete list.');
      return;
    }
    // For 'Ride Now', simplistic check if ANY driver is nearby (optional)
    // if (bookingType === 'now' && nearbyDrivers.length === 0) { ... } 
    // ^ Disabled for now to allow trying even if exact type isn't immediately visible in sample

    if (bookingType === 'schedule' && scheduledDate <= new Date()) {
      Alert.alert('Invalid Time', 'Please select a future date and time for scheduling.');
      return;
    }

    setIsBooking(true);
    try {
      const payload = {
        pickupLocation: pickup,
        dropLocation: drop,
        pickupLatitude: pickupCoords.lat,
        pickupLongitude: pickupCoords.lon,
        dropLatitude: dropCoords.lat,
        dropLongitude: dropCoords.lon,
        rideType: 'outstation',
        bookingType: bookingType,
        scheduledDate: bookingType === 'schedule' ? scheduledDate.toISOString() : undefined,
        fare: fares[carType].fare,
        baseFare: Math.max(0, fares[carType].fare - (fares[carType].nightSurcharge || 0)),
        nightSurcharge: fares[carType].nightSurcharge || 0,
        returnTripFare: 0,
        totalFare: fares[carType].total,
        hasReturnTrip: false,
        distance: distanceKm,
        vehicleType: carType,
      };

      const res = await bookingAPI.createBooking(payload);
      const newBooking = res.data?.booking;

      if (newBooking?.id) {
        if (bookingType === 'schedule') {
          Alert.alert(
            '🗓️ Scheduled!',
            `Your outstation ride is scheduled for ${formatScheduledDate(scheduledDate)}.\nBooking ID: ${newBooking.id}`,
            [{ text: 'OK', onPress: () => router.replace('/screens/HomeScreen') }]
          );
        } else {
          // Show searching overlay — poll/socket will navigate when driver accepts
          setActiveBookingId(newBooking.id);
          setIsSearchingDriver(true);
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to create booking. Try again.';
      Alert.alert('Booking Failed', msg);
    } finally {
      setIsBooking(false);
    }
  };

  // ─── Select suggestion ───────────────────────────────────────────────────────
  const selectSuggestion = (item: any) => {
    if (activeInput === 'pickup') {
      setPickup(item.display_name);
      setPickupCoords({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) });
    } else {
      setDrop(item.display_name);
      setDropCoords({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) });
    }
    setSuggestions([]);
    setActiveInput(null);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (isSearchingDriver && activeBookingId) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center px-6">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="light" />

        <View className="w-full max-w-[430px] rounded-[30px] border border-slate-700 bg-slate-800/70 p-6 shadow-2xl">
          <Animated.View
            style={{ opacity: searchingDotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }}
            className="w-24 h-24 self-center rounded-full border-4 border-[#FFD700] items-center justify-center mb-5 bg-slate-900"
          >
            <Ionicons name={carType === '7seater' ? "bus" : "car"} size={42} color="#FFD700" />
          </Animated.View>

          <Text className="text-white font-black text-2xl text-center mb-2">
            Requesting {carType === '7seater' ? '7-Seater' : '5-Seater'}
          </Text>

          <View className="self-center flex-row items-center bg-blue-500/20 border border-blue-400/40 px-3 py-1 rounded-full mb-4">
            <Ionicons name="navigate" size={12} color="#60A5FA" />
            <Text className="text-blue-300 font-black text-[10px] ml-1.5 uppercase tracking-widest">Outstation Ride</Text>
          </View>

          <View className="bg-slate-900/70 border border-slate-700 rounded-2xl px-4 py-3 mb-4">
            <View className="flex-row items-start mb-2">
              <Ionicons name="radio-button-on" size={13} color="#3B82F6" />
              <Text className="text-slate-300 text-xs font-bold ml-2 flex-1" numberOfLines={1}>{pickup}</Text>
            </View>
            <View className="ml-[5px] h-3 w-[1px] bg-slate-600 mb-2" />
            <View className="flex-row items-start">
              <Ionicons name="location" size={13} color="#EF4444" />
              <Text className="text-slate-300 text-xs font-bold ml-2 flex-1" numberOfLines={1}>{drop}</Text>
            </View>
          </View>

          <View className="bg-slate-900/80 border border-slate-700 px-5 py-4 rounded-2xl mb-6 items-center">
            <View className="flex-row justify-between w-full mb-1">
              <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Base Fare</Text>
              <Text className="text-white text-sm font-black">₹{fares[carType].fare - (fares[carType].nightSurcharge || 0)}</Text>
            </View>
            {fares[carType].nightSurcharge > 0 && (
              <View className="flex-row justify-between w-full mb-2">
                <Text className="text-indigo-400 text-[9px] font-black uppercase tracking-wider">Night Surcharge</Text>
                <Text className="text-indigo-400 text-sm font-black">+₹{fares[carType].nightSurcharge}</Text>
              </View>
            )}
            <View className="h-[1px] bg-slate-700 w-full mb-2" />
            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Estimated Total</Text>
            <Text className="text-[#FFD700] text-3xl font-black">₹{fares[carType].fare}</Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="speedometer-outline" size={11} color="#94A3B8" />
              <Text className="text-slate-500 text-[10px] font-bold ml-1">{distanceKm.toFixed(1)} km</Text>
              <Text className="text-slate-600 text-[10px] font-bold mx-1.5">•</Text>
              <Ionicons name="time-outline" size={11} color="#94A3B8" />
              <Text className="text-slate-500 text-[10px] font-bold ml-1">{formatTime(fares[carType].time)}</Text>
            </View>
          </View>

          <View className="items-center">
            <ActivityIndicator color="#FFD700" size="large" />
            <Text className="text-slate-500 text-xs font-bold mt-3 mb-6">
              Searching nearby {carType === '7seater' ? '7-Seaters' : '5-Seaters'}...
            </Text>
          </View>

          <TouchableOpacity
            onPress={async () => {
              clearInterval(pollInterval.current);
              try { await bookingAPI.cancelBooking(activeBookingId); } catch { }
              setIsSearchingDriver(false);
              setActiveBookingId(null);
            }}
            className="bg-slate-900 border border-slate-600 py-4 rounded-[16px] items-center"
          >
            <Text className="text-slate-200 font-black text-sm tracking-widest">CANCEL REQUEST</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      {/* ─── HEADER ─── */}
      <View className="bg-[#FFD700] pt-12 pb-8 px-5 rounded-b-[40px] shadow-sm">
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity onPress={() => router.back()} className="bg-white/50 p-2 rounded-xl">
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-base font-black text-black">OUTSTATION RIDE</Text>
            {isLongDistance && distanceKm > 0 && (
              <View className="bg-slate-900 px-2 py-1 rounded-full mt-1 flex-row items-center">
                <Ionicons name="navigate" size={10} color="#FACC15" />
                <Text className="text-[#FFD700] text-[9px] font-black ml-1">LONG DISTANCE · {distanceKm.toFixed(0)} KM</Text>
              </View>
            )}
          </View>
          <View className="w-10" />
        </View>

        {/* Location Card */}
        <View className="bg-white p-4 rounded-[25px] shadow-lg">
          {/* Pickup */}
          <View className="flex-row items-center h-[45px]">
            <View className="w-2 h-2 rounded-full bg-blue-500 mr-4" />
            <TextInput
              placeholder="Enter Pickup Location"
              className="flex-1 font-bold text-sm text-slate-800"
              placeholderTextColor="#94A3B8"
              value={pickup}
              onChangeText={(t) => { setPickup(t); setPickupCoords(null); setActiveInput('pickup'); }}
              onFocus={() => setActiveInput('pickup')}
            />
            {pickupCoords && <Ionicons name="checkmark-circle" size={18} color="#22c55e" />}
          </View>
          <View className="w-[1px] h-2.5 bg-slate-200 ml-[3px]" />
          {/* Drop */}
          <View className="flex-row items-center h-[45px]">
            <Ionicons name="location" size={18} color="#ef4444" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Enter Drop Destination"
              className="flex-1 font-bold text-sm text-slate-800"
              placeholderTextColor="#94A3B8"
              value={drop}
              onChangeText={(t) => { setDrop(t); setDropCoords(null); setActiveInput('drop'); }}
              onFocus={() => setActiveInput('drop')}
            />
            {dropCoords && <Ionicons name="checkmark-circle" size={18} color="#22c55e" />}
          </View>

          {/* Autocomplete dropdown */}
          {suggestions.length > 0 && activeInput && (
            <View className="bg-white rounded-2xl mt-3 border border-slate-100 shadow-xl max-h-[200px]">
              <FlatList
                data={suggestions.slice(0, 5)}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="flex-row items-center p-3 border-b border-slate-100"
                    onPress={() => selectSuggestion(item)}
                  >
                    <Ionicons name="pin-outline" size={14} color="#6366f1" />
                    <Text className="text-slate-700 text-xs font-bold ml-2 flex-1" numberOfLines={1}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* ─── TRIP SUMMARY ─── */}
        {distanceKm > 0 && (
          <View className="flex-row bg-white rounded-[20px] p-4 mb-5 border border-slate-100 shadow-sm gap-4">
            <View className="flex-1 items-center">
              <Text className="text-slate-400 text-[9px] font-black uppercase mb-1">Distance</Text>
              <Text className="text-slate-900 font-black text-lg">{distanceKm.toFixed(1)} km</Text>
            </View>
            <View className="w-[1px] bg-slate-100" />
            <View className="flex-1 items-center">
              <Text className="text-slate-400 text-[9px] font-black uppercase mb-1">Type</Text>
              <Text className={`font-black text-sm ${isLongDistance ? 'text-orange-500' : 'text-green-600'}`}>
                {isLongDistance ? 'Long Distance' : 'Normal'}
              </Text>
            </View>
            <View className="w-[1px] bg-slate-100" />
            <View className="flex-1 items-center">
              <Text className="text-slate-400 text-[9px] font-black uppercase mb-1">Min Fare</Text>
              <Text className="text-slate-900 font-black text-lg">₹{fares['5seater'].fare || '--'}</Text>
            </View>
          </View>
        )}

        {/* ─── CHOOSE VEHICLE TYPE ─── */}
        <Text className="text-xs font-black text-slate-500 mb-3 ml-1">CHOOSE VEHICLE</Text>
        <View>
          {([{ type: '5seater', icon: 'car-outline', title: '5-Seater', desc: 'Comfortable sedan/hatchback', capacity: '4+1', color: '#3B82F6' },
             { type: '7seater', icon: 'bus-outline', title: '7-Seater', desc: 'Spacious SUV / MUV', capacity: '6+1', color: '#10B981' }] as const).map((option) => {
            const isSelected = carType === option.type;
            const vehicleFare = fares[option.type].fare;
            const vehicleTime = fares[option.type].time;
            const extraRate = option.type === '5seater' ? '₹12/km' : '₹13/km';

            return (
              <TouchableOpacity
                key={option.type}
                onPress={() => setCarType(option.type)}
                activeOpacity={0.8}
                style={{
                  marginBottom: 16,
                  borderRadius: 24,
                  backgroundColor: isSelected ? '#FFFFFF' : '#F8FAFC',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderWidth: 2,
                  borderColor: isSelected ? '#FFD700' : '#F1F5F9',
                  shadowColor: isSelected ? '#FFD700' : '#000',
                  shadowOffset: { width: 0, height: isSelected ? 8 : 2 },
                  shadowOpacity: isSelected ? 0.3 : 0.05,
                  shadowRadius: isSelected ? 12 : 4,
                  elevation: isSelected ? 8 : 2,
                  overflow: 'hidden'
                }}
              >
                {/* Accent line for selected */}
                {isSelected && <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: '#FFD700' }} />}

                {/* Left: Icon and Type */}
                <View style={{
                  backgroundColor: isSelected ? '#0F172A' : '#FFFFFF',
                  borderRadius: 20, width: 64, height: 64,
                  alignItems: 'center', justifyContent: 'center', marginRight: 16,
                  borderWidth: 1, borderColor: '#F1F5F9'
                }}>
                  <Ionicons name={option.icon as any} size={32} color={isSelected ? '#FFD700' : '#64748B'} />
                </View>

                {/* Center: Details */}
                <View style={{ flex: 1 }}>
                  <View className="flex-row items-center mb-1">
                    <Text className="text-slate-900 font-black text-base mr-2">{option.title}</Text>
                    <View className="bg-slate-100 px-2 py-0.5 rounded-full">
                      <Text className="text-slate-500 text-[8px] font-black">{option.capacity} SEATS</Text>
                    </View>
                  </View>
                  <Text className="text-slate-500 text-[10px] font-bold mb-1" numberOfLines={1}>{option.desc}</Text>
                  <Text className="text-slate-400 text-[9px] font-black uppercase tracking-tighter">
                    {extraRate} after 40km
                  </Text>
                </View>

                {/* Right: Fare */}
                <View style={{ alignItems: 'flex-end' }}>
                  {loadingFares ? (
                    <ActivityIndicator size="small" color="#FFD700" />
                  ) : (
                    <>
                      <Text className={`${isSelected ? 'text-slate-900' : 'text-slate-600'} font-black text-xl`}>
                        ₹{vehicleFare || '--'}
                      </Text>
                      {vehicleTime > 0 && (
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="time-outline" size={10} color="#94A3B8" />
                          <Text className="text-slate-400 text-[10px] font-bold ml-0.5">
                            {formatTime(vehicleTime)}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── BOOKING PANEL ─── */}
        <View className="bg-slate-900 p-5 rounded-[35px] mt-4">
          {/* Ride Now / Schedule Toggle */}
          <View className="flex-row bg-slate-800 p-1.5 rounded-[15px] mb-4">
            <TouchableOpacity
              onPress={() => setBookingType('now')}
              className={`flex-1 py-3 items-center rounded-xl flex-row justify-center ${bookingType === 'now' ? 'bg-[#FFD700]' : ''}`}
            >
              <Ionicons name="flash" size={14} color={bookingType === 'now' ? 'black' : '#94a3b8'} style={{ marginRight: 6 }} />
              <Text className={`text-[11px] font-black ${bookingType === 'now' ? 'text-black' : 'text-slate-400'}`}>
                RIDE NOW
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBookingType('schedule')}
              className={`flex-1 py-3 items-center rounded-xl flex-row justify-center ${bookingType === 'schedule' ? 'bg-[#FFD700]' : ''}`}
            >
              <Ionicons name="calendar" size={14} color={bookingType === 'schedule' ? 'black' : '#94a3b8'} style={{ marginRight: 6 }} />
              <Text className={`text-[11px] font-black ${bookingType === 'schedule' ? 'text-black' : 'text-slate-400'}`}>
                SCHEDULE
              </Text>
            </TouchableOpacity>
          </View>

          {/* Schedule Date/Time Picker */}
          {bookingType === 'schedule' && (
            <View className="mb-4">
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center bg-slate-800 p-4 rounded-xl mb-2"
              >
                <Ionicons name="calendar" size={18} color="#FFD700" />
                <View className="ml-3 flex-1">
                  <Text className="text-slate-400 text-[9px] font-black uppercase">Date</Text>
                  <Text className="text-white font-bold text-sm">
                    {scheduledDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748b" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                className="flex-row items-center bg-slate-800 p-4 rounded-xl"
              >
                <Ionicons name="time" size={18} color="#FFD700" />
                <View className="ml-3 flex-1">
                  <Text className="text-slate-400 text-[9px] font-black uppercase">Time</Text>
                  <Text className="text-white font-bold text-sm">
                    {scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748b" />
              </TouchableOpacity>

              {(showDatePicker || showTimePicker) && (
                <DateTimePicker
                  value={scheduledDate}
                  mode={showDatePicker ? 'date' : 'time'}
                  minimumDate={new Date()}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, selected) => {
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                    if (selected) setScheduledDate(selected);
                  }}
                />
              )}

              <Text className="text-slate-500 text-[10px] font-bold mt-2 text-center">
                Scheduled: {formatScheduledDate(scheduledDate)}
              </Text>
            </View>
          )}

          {/* Fare Summary */}
          {fares[carType].fare > 0 && (
            <View className="bg-slate-800 p-4 rounded-xl mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text className="text-slate-400 text-[9px] font-black uppercase mb-1">Base Fare</Text>
                  <Text className="text-white font-black text-lg">₹{fares[carType].fare - (fares[carType].nightSurcharge || 0)}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-slate-400 text-[9px] font-black uppercase mb-1">Allowed Time</Text>
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={12} color="white" style={{ marginRight: 4 }} />
                    <Text className="text-white font-bold text-sm">{formatTime(fares[carType].time)}</Text>
                  </View>
                </View>
              </View>

              {fares[carType].nightSurcharge > 0 && (
                <View className="flex-row justify-between items-center mb-3 pt-3 border-t border-slate-700">
                  <View className="flex-row items-center">
                    <Ionicons name="moon" size={12} color="#fbbf24" style={{ marginRight: 6 }} />
                    <Text className="text-amber-400 text-[10px] font-black uppercase">Night Surcharge (+20%)</Text>
                  </View>
                  <Text className="text-amber-400 font-black text-sm">+₹{fares[carType].nightSurcharge}</Text>
                </View>
              )}

              <View className="flex-row justify-between items-center pt-3 border-t border-slate-700">
                <Text className="text-[#FFD700] text-[10px] font-black uppercase tracking-widest">Total Estimate</Text>
                <Text className="text-[#FFD700] font-black text-2xl">₹{fares[carType].fare}</Text>
              </View>
            </View>
          )}

          {/* Confirm Button */}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={isBooking}
            className={`py-[18px] rounded-[15px] items-center flex-row justify-center ${isBooking ? 'bg-slate-600' : 'bg-white active:bg-gray-100'
              }`}
          >
            {isBooking ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name={bookingType === 'schedule' ? 'calendar' : 'car'} size={18} color="#000" style={{ marginRight: 8 }} />
                <Text className="font-black text-sm tracking-widest text-slate-900">
                  {bookingType === 'schedule' ? 'SCHEDULE RIDE' : 'CONFIRM OUTSTATION'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default OutstationBookingScreen;
