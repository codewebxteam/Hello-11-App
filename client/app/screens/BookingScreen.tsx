import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Alert, ActivityIndicator, Platform, FlatList, Animated, BackHandler, Keyboard
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { bookingAPI, locationAPI, driverAPI } from '../../utils/api';
import SearchingRideOverlay from '../../components/SearchingRideOverlay';

// Fare rates (per km) matching backend fareController.js
const LOCAL_RATES: Record<string, number> = {
  mini: 12,
  sedan: 15,
  suv: 20,
  prime: 18,
  auto: 10,
  bike: 7,
};

const VEHICLES = [
  { id: 'mini', label: 'Mini', icon: 'car-sport', rate: 12, desc: 'Comfy Hatchback' },
  { id: 'sedan', label: 'Sedan', icon: 'car', rate: 15, desc: 'Spacious & Elite' },
  { id: 'suv', label: 'SUV', icon: 'bus', rate: 20, desc: 'Perfect for Family' },
  { id: 'prime', label: 'Prime', icon: 'star', rate: 18, desc: 'Top Notch Sedan' },
  { id: 'auto', label: 'Auto', icon: 'car-outline', rate: 10, desc: 'Eco Friendly' },
  { id: 'bike', label: 'Bike', icon: 'bicycle', rate: 7, desc: 'Super Fast' },
];

const BookingScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Ride State
  const [rideMode, setRideMode] = useState<'normal' | 'long'>('normal');
  const [bookingType, setBookingType] = useState<'now' | 'schedule'>(
    (params.mode as 'now' | 'schedule') || 'now'
  );
  const [selectedVehicle, setSelectedVehicle] = useState('mini');
  const [isSearching, setIsSearching] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  // Location State
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

  // UI State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<'pickup' | 'drop' | null>(null);

  // Schedule State
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date(Date.now() + 3600000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Function to fetch current location and reverse geocode
  const fetchCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required to fetch current address.");
        setIsLoadingLocation(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setPickupCoords({ lat: latitude, lon: longitude });

      const res = await locationAPI.reverseGeocode(latitude, longitude);
      if (res.data?.success && res.data.data?.display_name) {
        setPickup(res.data.data.display_name);
      }
    } catch (err: any) {
      console.error("Fetch Location Error", err);
      Alert.alert("Error", "Could not fetch current address.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // --- BACK BUTTON HANDLING ---
  useEffect(() => {
    const backAction = () => {
      router.replace("/screens/HomeScreen");
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  // --- AUTOCOMPLETE LOGIC ---
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

  // --- DISTANCE & DRIVER STATS LOGIC ---
  const fetchRideInfo = useCallback(async () => {
    if (!pickupCoords || !dropCoords) return;
    try {
      const dirRes = await locationAPI.getDirections(
        pickupCoords.lat, pickupCoords.lon,
        dropCoords.lat, dropCoords.lon
      );
      if (dirRes.data?.data?.distanceKm) {
        const dist = parseFloat(dirRes.data.data.distanceKm);
        setDistanceKm(dist);

        // --- 40KM RULE (Always check distance) ---
        if (dist >= 40 && rideMode === 'normal') {
          Alert.alert(
            "Long Distance Detected",
            `This trip is ${dist.toFixed(1)} km. Rides over 40 km are categorized as Outstation trips. Switch to Long Distance?`,
            [
              { text: "Later", style: 'cancel' },
              {
                text: "Switch Now",
                onPress: () => {
                  setRideMode('long');
                  router.push({
                    pathname: "/screens/OutstationBookingScreen",
                    params: {
                      pickup, drop,
                      pLat: pickupCoords.lat.toString(),
                      pLon: pickupCoords.lon.toString(),
                      dLat: dropCoords.lat.toString(),
                      dLon: dropCoords.lon.toString(),
                      dist: dist.toString()
                    }
                  });
                }
              }
            ]
          );
        }
      }

      // Status card logic removed

    } catch (err) {
      console.error('Ride info fetch error:', err);
    }
  }, [pickupCoords, dropCoords, rideMode]);

  useEffect(() => {
    fetchRideInfo();
  }, [fetchRideInfo]);

  // --- SELECT SUGGESTION ---
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

  const currentRate = LOCAL_RATES[selectedVehicle] || 12;
  const estimatedFare = Math.round(distanceKm * currentRate);

  // --- HANDLE CONFIRM ---
  const handleConfirm = async () => {
    if (!pickup || !drop) {
      Alert.alert('Missing Info', 'Please enter pickup and drop locations.');
      return;
    }
    if (!pickupCoords || !dropCoords) {
      Alert.alert('Select from suggestions', 'Please select locations from the search results.');
      return;
    }
    if (rideMode === 'long') {
      // Redirection to specialized outstation screen if user selects long distance tab
      router.push({
        pathname: "/screens/OutstationBookingScreen",
        params: {
          pickup, drop,
          pLat: pickupCoords.lat.toString(),
          pLon: pickupCoords.lon.toString(),
          dLat: dropCoords.lat.toString(),
          dLon: dropCoords.lon.toString(),
          dist: distanceKm.toString()
        }
      });
      return;
    }
    // nearbyCount check removed
    if (bookingType === 'schedule' && scheduledDate <= new Date()) {
      Alert.alert('Invalid Time', 'Please select a future time for scheduling.');
      return;
    }

    try {
      const payload = {
        pickupLocation: pickup,
        dropLocation: drop,
        pickupLatitude: pickupCoords.lat,
        pickupLongitude: pickupCoords.lon,
        dropLatitude: dropCoords.lat,
        dropLongitude: dropCoords.lon,
        rideType: 'normal',
        bookingType: bookingType,
        vehicleType: selectedVehicle, // Sent chosen vehicle to backend
        scheduledDate: bookingType === 'schedule' ? scheduledDate.toISOString() : undefined,
        fare: estimatedFare,
        distance: distanceKm,
      };

      const res = await bookingAPI.createBooking(payload);
      const newBooking = res.data?.booking;

      if (newBooking?.id) {
        if (bookingType === 'schedule') {
          Alert.alert(
            '🗓️ Trip Planned!',
            `Your ride is scheduled for ${scheduledDate.toLocaleString('en-IN', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
            })}.`,
            [{ text: 'Great', onPress: () => router.replace('/screens/HomeScreen') }]
          );
        } else {
          setActiveBookingId(newBooking.id);
          setIsSearching(true);
        }
      }
    } catch (err: any) {
      const msg = err.message || "Failed to create booking.";
      Alert.alert("Booking Error", msg);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar style="dark" />

      {/* Header Section */}
      <View className="bg-[#FFD700] pt-14 pb-8 px-6 rounded-b-[45px] shadow-lg">
        <Text className="text-3xl font-black text-slate-900 mb-6">Plan Your Trip</Text>

        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', padding: 4, borderRadius: 16, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => setRideMode('normal')}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
              backgroundColor: rideMode === 'normal' ? '#fff' : 'transparent',
              ...(rideMode === 'normal' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } : {})
            }}
          >
            <Ionicons name="navigate-circle" size={18} color={rideMode === 'normal' ? "#000" : "#64748B"} />
            <Text style={{ fontWeight: '900', marginLeft: 8, fontSize: 11, color: rideMode === 'normal' ? '#000' : '#64748B' }}>NORMAL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRideMode('long')}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
              backgroundColor: rideMode === 'long' ? '#fff' : 'transparent',
              ...(rideMode === 'long' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } : {})
            }}
          >
            <MaterialCommunityIcons name="map-marker-distance" size={18} color={rideMode === 'long' ? "#000" : "#64748B"} />
            <Text style={{ fontWeight: '900', marginLeft: 8, fontSize: 11, color: rideMode === 'long' ? '#000' : '#64748B' }}>LONG DISTANCE</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white p-4 rounded-[30px] shadow-sm">
          <View className="flex-row items-center h-12">
            <View className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-4 border-2 border-blue-200" />
            <TextInput
              placeholder="From where?"
              className="flex-1 font-bold text-slate-800"
              placeholderTextColor="#94A3B8"
              value={pickup}
              onChangeText={(t) => { setPickup(t); setPickupCoords(null); setActiveInput('pickup'); }}
              onFocus={() => setActiveInput('pickup')}
            />
            {pickupCoords && <Ionicons name="checkmark-circle" size={18} color="#16A34A" />}
          </View>
          <View className="w-[1px] h-3 bg-slate-200 ml-[4px] my-1" />
          <View className="flex-row items-center h-12">
            <Ionicons name="location" size={22} color="#EF4444" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Where to go?"
              className="flex-1 font-bold text-slate-800"
              placeholderTextColor="#94A3B8"
              value={drop}
              onChangeText={(t) => { setDrop(t); setDropCoords(null); setActiveInput('drop'); }}
              onFocus={() => setActiveInput('drop')}
            />
            {dropCoords && <Ionicons name="checkmark-circle" size={18} color="#16A34A" />}
          </View>

          {activeInput === 'pickup' && (
            <TouchableOpacity
              className="flex-row items-center p-3 border-b border-slate-100 bg-blue-50/50"
              onPress={() => {
                fetchCurrentLocation();
                setSuggestions([]);
                setActiveInput(null);
                Keyboard.dismiss();
              }}
            >
              <Ionicons name="navigate-outline" size={16} color="#3B82F6" />
              <Text className="text-blue-600 text-sm font-bold ml-3 flex-1">
                Use Current Location
              </Text>
              {isLoadingLocation && <ActivityIndicator size="small" color="#3B82F6" />}
            </TouchableOpacity>
          )}

          {suggestions.length > 0 && activeInput && (
            <View className="mt-3 border-t border-slate-100 max-h-[220px]">
              <FlatList
                data={suggestions.slice(0, 5)}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="flex-row items-center py-4 border-b border-slate-50"
                    onPress={() => selectSuggestion(item)}
                  >
                    <Ionicons name="pin" size={16} color="#94A3B8" />
                    <Text className="text-slate-700 text-sm font-medium ml-3 flex-1" numberOfLines={1}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>

        {/* Long Distance Message */}
        {rideMode === 'long' && (
          <View className="bg-blue-600 p-8 rounded-[40px] mb-8 shadow-xl">
            <View className="bg-white/20 w-12 h-12 rounded-2xl items-center justify-center mb-4">
              <MaterialCommunityIcons name="map-clock-outline" size={28} color="#FFF" />
            </View>
            <Text className="text-white font-black text-xl mb-2">Intercity Travel</Text>
            <Text className="text-white/80 text-sm font-bold leading-5">
              For trips above 40km, we offer specialized outstation services with round-trip discounts.
            </Text>
          </View>
        )}

        {/* Fare Summary (For Normal) */}
        {distanceKm > 0 && rideMode === 'normal' && (
          <View className="bg-slate-900 p-6 rounded-[35px] mb-8 flex-row justify-between items-center shadow-lg">
            <View>
              <Text className="text-slate-400 text-[10px] font-black uppercase">Estimated Fare ({selectedVehicle.toUpperCase()})</Text>
              <Text style={{ color: '#FFD700', fontWeight: '900', fontSize: 30 }}>₹{estimatedFare}</Text>
            </View>
            <View className="items-end">
              <Text className="text-slate-400 text-[10px] font-black uppercase">Distance</Text>
              <Text className="text-white font-black text-lg">{distanceKm.toFixed(1)} km</Text>
            </View>
          </View>
        )}

        {/* Vehicle Selection for Normal Rides */}
        {rideMode === 'normal' && (
          <View className="mb-8">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Choose Ride Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {VEHICLES.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  onPress={() => setSelectedVehicle(v.id)}
                  className={`mr-4 p-5 rounded-[35px] items-center border-2 w-32 ${selectedVehicle === v.id ? 'bg-[#FFD700] border-[#FFD700] shadow-md' : 'bg-white border-slate-100 shadow-sm'}`}
                >
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-3 ${selectedVehicle === v.id ? 'bg-white/40' : 'bg-slate-50'}`}>
                    <Ionicons name={v.icon as any} size={28} color={selectedVehicle === v.id ? "#000" : "#64748B"} />
                  </View>
                  <Text className={`font-black text-sm ${selectedVehicle === v.id ? 'text-black' : 'text-slate-800'}`}>{v.label}</Text>
                  <Text className={`text-[9px] font-black uppercase mt-1 ${selectedVehicle === v.id ? 'text-black/60' : 'text-slate-400'}`}>₹{v.rate}/KM</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', padding: 6, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <TouchableOpacity
            onPress={() => setBookingType('now')}
            style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: bookingType === 'now' ? '#FFD700' : 'transparent' }}
          >
            <Text style={{ fontWeight: '900', fontSize: 11, color: bookingType === 'now' ? '#000' : '#94a3b8' }}>RIDE NOW</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setBookingType('schedule')}
            style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: bookingType === 'schedule' ? '#FFD700' : 'transparent' }}
          >
            <Text style={{ fontWeight: '900', fontSize: 11, color: bookingType === 'schedule' ? '#000' : '#94a3b8' }}>SCHEDULE</Text>
          </TouchableOpacity>
        </View>

        {/* Scheduler */}
        {bookingType === 'schedule' && (
          <View className="bg-white p-6 rounded-[35px] border border-slate-100 mb-6">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select Date & Time</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-1 bg-slate-50 p-4 rounded-2xl flex-row items-center justify-between border border-slate-100"
              >
                <Ionicons name="calendar-outline" size={18} color="#FFD700" />
                <Text className="text-slate-600 font-black text-xs">{scheduledDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                <Ionicons name="chevron-down" size={14} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                className="flex-1 bg-slate-50 p-4 rounded-2xl flex-row items-center justify-between border border-slate-100"
              >
                <Ionicons name="time-outline" size={18} color="#FFD700" />
                <Text className="text-slate-600 font-black text-xs">{scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
                <Ionicons name="chevron-down" size={14} color="#64748B" />
              </TouchableOpacity>
            </View>

            {(showDatePicker || showTimePicker) && (
              <DateTimePicker
                value={scheduledDate}
                mode={showDatePicker ? 'date' : 'time'}
                minimumDate={new Date()}
                onChange={(_, d) => {
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                  if (d) setScheduledDate(d);
                }}
              />
            )}
          </View>
        )}

        <TouchableOpacity
          onPress={handleConfirm}
          className="bg-slate-900 py-[22px] rounded-[28px] items-center shadow-lg active:scale-95"
        >
          <Text className="text-white font-black text-lg tracking-[2px]">
            {rideMode === 'long' ? 'CONTINUE TO OUTSTATION' : (bookingType === 'schedule' ? 'PLAN MY TRIP' : 'SEARCH RIDE NOW')}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Ride Searching Overlay */}
      <SearchingRideOverlay
        isVisible={isSearching}
        onCancel={async () => {
          if (activeBookingId) {
            try { await bookingAPI.cancelBooking(activeBookingId); } catch { }
          }
          setIsSearching(false);
          setActiveBookingId(null);
        }}
        pickupLocation={pickup || "Current Location"}
        dropLocation={drop || "Select Destination"}
        rideMode="Normal Ride"
      />
    </View>
  );
};

export default BookingScreen;