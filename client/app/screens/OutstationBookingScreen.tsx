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
  const [vehicleOptions, setVehicleOptions] = useState<any[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('sedan');
  const [estimatedFare, setEstimatedFare] = useState<number>(0);
  const [fareRate, setFareRate] = useState<number>(0);

  // UI state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<'pickup' | 'drop' | null>(null);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
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
        const res = await locationAPI.getAutocomplete(query);
        setSuggestions(res.data.data || []);
      } catch { setSuggestions([]); }
    }, 500);
    return () => clearTimeout(timer);
  }, [pickup, drop, activeInput]);

  // ─── Fetch Outstation Rates ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchRates = async () => {
      setLoadingRates(true);
      try {
        const res = await fareAPI.getOutstationRates();
        if (res.data?.success) {
          setVehicleOptions(res.data.data.vehicleTypes);
        }
      } catch (err) {
        console.error('Failed to fetch rates:', err);
      } finally {
        setLoadingRates(false);
      }
    };
    fetchRates();
  }, []);

  // ─── Calculate Estimate ──────────────────────────────────────────────────────
  useEffect(() => {
    if (distanceKm > 0 && selectedVehicleType) {
      const fetchEstimate = async () => {
        try {
          const res = await fareAPI.calculateEstimate({
            distanceKm,
            cabType: selectedVehicleType,
            bookingType: 'outstation'
          });
          if (res.data?.success) {
            setEstimatedFare(res.data.data.estimatedFare);
            setFareRate(res.data.data.ratePerKm);
          }
        } catch (err) {
          console.error('Fare estimate error:', err);
          // Fallback calculation if server fails (optional)
        }
      };
      fetchEstimate();
    }
  }, [distanceKm, selectedVehicleType]);

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
        fare: estimatedFare,
        baseFare: estimatedFare,
        distance: distanceKm,
        vehicleType: selectedVehicleType, // Send the selected category
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
      <View className="flex-1 bg-slate-900 items-center justify-center px-8">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="light" />
        <Animated.View
          style={{ opacity: searchingDotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }}
          className="w-32 h-32 rounded-full border-4 border-[#FFD700] items-center justify-center mb-8"
        >
          <Ionicons name="car" size={52} color="#FFD700" />
        </Animated.View>
        <Text className="text-white font-black text-2xl text-center mb-3">requesting {selectedVehicleType}</Text>
        <Text className="text-slate-400 font-bold text-sm text-center mb-2">🛣️ Outstation Ride</Text>
        <Text className="text-slate-500 text-xs font-bold text-center mb-1" numberOfLines={1}>{pickup}</Text>
        <Text className="text-slate-500 text-xs font-bold text-center mb-8" numberOfLines={1}>→ {drop}</Text>
        <View className="bg-slate-800 px-8 py-4 rounded-[20px] mb-10 items-center">
          <Text className="text-slate-400 text-[9px] font-black uppercase">Estimated Fare</Text>
          <Text className="text-[#FFD700] text-3xl font-black">₹{estimatedFare}</Text>
          <Text className="text-slate-500 text-[10px] font-bold mt-1">{distanceKm.toFixed(1)} km · ₹{fareRate}/km</Text>
        </View>
        <ActivityIndicator color="#FFD700" size="large" />
        <Text className="text-slate-600 text-xs font-bold mt-4 mb-10">Searching nearby {selectedVehicleType}s...</Text>
        <TouchableOpacity
          onPress={async () => {
            clearInterval(pollInterval.current);
            try { await bookingAPI.cancelBooking(activeBookingId); } catch { }
            setIsSearchingDriver(false);
            setActiveBookingId(null);
          }}
          className="bg-slate-800 border border-slate-700 px-10 py-4 rounded-[18px]"
        >
          <Text className="text-slate-300 font-black text-sm tracking-widest">CANCEL REQUEST</Text>
        </TouchableOpacity>
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
              <View className="bg-slate-900 px-2 py-0.5 rounded-full mt-1">
                <Text className="text-[#FFD700] text-[9px] font-black">🛣️ LONG DISTANCE · {distanceKm.toFixed(0)} KM</Text>
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
              <Text className="text-slate-400 text-[9px] font-black uppercase mb-1">Est. Fare</Text>
              <Text className="text-slate-900 font-black text-lg">₹{estimatedFare}</Text>
            </View>
          </View>
        )}

        {/* ─── CHOOSE RIDE TYPE (Vehicle Options) ─── */}
        <Text className="text-xs font-black text-slate-500 mb-3 ml-1">CHOOSE VEHICLE</Text>

        {loadingRates ? (
          <ActivityIndicator color="#FFD700" size="small" />
        ) : (
          <View>
            {vehicleOptions.map((option) => {
              const isSelected = selectedVehicleType === option.type;
              const thisFare = distanceKm > 0 ? Math.round(distanceKm * option.ratePerKm) : 0;

              return (
                <TouchableOpacity
                  key={option.type}
                  onPress={() => setSelectedVehicleType(option.type)}
                  activeOpacity={0.9}
                  style={{
                    marginBottom: 12,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: isSelected ? '#FFD700' : 'transparent',
                    backgroundColor: isSelected ? '#FEFCE8' : '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    ...(!isSelected ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1
                    } : {
                      shadowColor: "#FFD700",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 4
                    })
                  }}
                >
                  {/* Icon Box */}
                  <View style={{
                    backgroundColor: isSelected ? '#FFD700' : '#F1F5F9',
                    borderRadius: 12,
                    width: 50,
                    height: 50,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <Ionicons name={option.icon as any} size={28} color="#0F172A" />
                  </View>

                  {/* Details */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 2 }}>{option.title}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>{option.desc} • {option.capacity} seats</Text>
                  </View>

                  {/* Price */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>₹{thisFare}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>₹{option.ratePerKm}/km</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ─── BOOKING PANEL ─── */}
        <View className="bg-slate-900 p-5 rounded-[35px] mt-4">
          {/* Ride Now / Schedule Toggle */}
          <View className="flex-row bg-slate-800 p-1.5 rounded-[15px] mb-4">
            <TouchableOpacity
              onPress={() => setBookingType('now')}
              className={`flex-1 py-3 items-center rounded-xl ${bookingType === 'now' ? 'bg-[#FFD700]' : ''}`}
            >
              <Text className={`text-[11px] font-black ${bookingType === 'now' ? 'text-black' : 'text-slate-400'}`}>
                ⚡ RIDE NOW
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBookingType('schedule')}
              className={`flex-1 py-3 items-center rounded-xl ${bookingType === 'schedule' ? 'bg-[#FFD700]' : ''}`}
            >
              <Text className={`text-[11px] font-black ${bookingType === 'schedule' ? 'text-black' : 'text-slate-400'}`}>
                🗓️ SCHEDULE
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
                📅 Scheduled: {formatScheduledDate(scheduledDate)}
              </Text>
            </View>
          )}

          {/* Fare Summary */}
          {estimatedFare > 0 && (
            <View className="bg-slate-800 p-3 rounded-xl mb-4 flex-row justify-between items-center">
              <View>
                <Text className="text-slate-400 text-[9px] font-black uppercase">Estimated Fare</Text>
                <Text className="text-[#FFD700] font-black text-xl">₹{estimatedFare}</Text>
              </View>
              <View className="items-end">
                <Text className="text-slate-400 text-[9px] font-black uppercase">Rate</Text>
                <Text className="text-white font-bold text-sm">₹{fareRate}/km · {distanceKm.toFixed(0)}km</Text>
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