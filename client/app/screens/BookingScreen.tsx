import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Alert, ActivityIndicator, Platform, FlatList, Animated, BackHandler, Keyboard, useWindowDimensions, AppState
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { bookingAPI, locationAPI, driverAPI, fareAPI } from '../../utils/api';
import SearchingRideOverlay from '../../components/SearchingRideOverlay';

const VEHICLES = [
  { id: '5seater', label: '5-Seater', icon: 'car-outline', title: '5-Seater', desc: 'Comfortable sedan/hatchback', capacity: '4+1', color: '#3B82F6', extraRate: '₹12/km' },
  { id: '7seater', label: '7-Seater', icon: 'bus-outline', title: '7-Seater', desc: 'Spacious SUV / MUV', capacity: '6+1', color: '#10B981', extraRate: '₹13/km' },
];

const BookingScreen = () => {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Ride State
  const [rideMode, setRideMode] = useState<'normal' | 'long'>('normal');
  const [bookingType, setBookingType] = useState<'now' | 'schedule'>(
    (params.mode as 'now' | 'schedule') || 'now'
  );
  const [selectedVehicle, setSelectedVehicle] = useState('5seater');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tollCost, setTollCost] = useState(0);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  // Fare/Vehicle state
  const [fares, setFares] = useState<any>({
    '5seater': { fare: 0, total: 0, isNight: false, nightSurcharge: 0, tollCost: 0 },
    '7seater': { fare: 0, total: 0, isNight: false, nightSurcharge: 0, tollCost: 0 }
  });
  const [loadingFares, setLoadingFares] = useState(false);

  useEffect(() => {
    if (rideMode === 'normal' && bookingType === 'schedule') {
      setBookingType('now');
    }
  }, [rideMode, bookingType]);

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
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
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
    if (!query || query.length < 2) { 
      setSuggestions([]); 
      setIsLoadingSuggestions(false);
      return; 
    }

    setIsLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const userLat = pickupCoords?.lat;
        const userLon = pickupCoords?.lon;
        const res = await locationAPI.getAutocomplete(query, userLat, userLon);
        setSuggestions(res.data.data || []);
      } catch { setSuggestions([]); }
      finally { setIsLoadingSuggestions(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [pickup, drop, activeInput, pickupCoords]);

  // --- FARE CALCULATION ---
  useEffect(() => {
    if (distanceKm > 0 && rideMode === 'normal') {
      const fetchFares = async () => {
        setLoadingFares(true);
        try {
          const bookingTime = bookingType === 'schedule' ? scheduledDate.toISOString() : new Date().toISOString();
          
          const [res5, res7] = await Promise.all([
            fareAPI.calculateTripFare({ distance: distanceKm, carType: '5seater', service: 'cab', bookingTime }),
            fareAPI.calculateTripFare({ distance: distanceKm, carType: '7seater', service: 'cab', bookingTime })
          ]);

          const newFares = { ...fares };
          if (res5.data?.success) {
            newFares['5seater'] = {
              fare: res5.data.data.totalFare,
              total: res5.data.data.totalFare,
              isNight: res5.data.data.isNightSurcharge ?? false,
              nightSurcharge: res5.data.data.nightSurcharge || 0,
              tollCost: tollCost
            };
          }
          if (res7.data?.success) {
            newFares['7seater'] = {
              fare: res7.data.data.totalFare,
              total: res7.data.data.totalFare,
              isNight: res7.data.data.isNightSurcharge ?? false,
              nightSurcharge: res7.data.data.nightSurcharge || 0,
              tollCost: tollCost
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
  }, [distanceKm, bookingType, scheduledDate, rideMode, tollCost]);

  // --- DISTANCE & DRIVER STATS LOGIC ---
  const fetchRideInfo = useCallback(async () => {
    if (!pickupCoords || !dropCoords) return;
    try {
      const [dirRes, tollRes] = await Promise.all([
        locationAPI.getDirections(
          pickupCoords.lat, pickupCoords.lon,
          dropCoords.lat, dropCoords.lon
        ),
        locationAPI.getTolls(
          pickupCoords.lat, pickupCoords.lon,
          dropCoords.lat, dropCoords.lon
        ).catch(() => ({ data: { data: { tollPrice: 0 } } })) 
      ]);
      
      const tollPrice = tollRes.data?.data?.tollPrice || 0;

      if (dirRes.data?.data?.distanceKm) {
        const dist = parseFloat(dirRes.data.data.distanceKm);
        setDistanceKm(dist);
        setTollCost(tollPrice);

        if (dist >= 40 && rideMode === 'normal') {
          Alert.alert(
            "Long Distance Detected",
            `This trip is ${dist.toFixed(1)} km. Rides over 40 km are categorized as Outstation trips. Switching to Long Distance.`,
            [
              {
                text: "Switch to Outstation",
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
    } catch (err) {
      console.error('Ride info fetch error:', err);
    }
  }, [pickupCoords, dropCoords, rideMode]);

  useEffect(() => {
    fetchRideInfo();
  }, [fetchRideInfo]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState === "active" && isSearching && activeBookingId) {
        try {
          const res = await bookingAPI.getBookingStatus(activeBookingId);
          const status = res.data?.booking?.status;
          const cancellationReason = res.data?.booking?.cancellationReason;
          if (status && status !== 'pending') {
            setIsSearching(false);
            if (status === 'cancelled') {
              if (cancellationReason === 'No driver accepted within timeout limit') {
                Alert.alert(
                  "Sorry for the inconvenience",
                  "No drivers are available right now. Please try again after some time."
                );
              } else {
                Alert.alert("Ride Cancelled", "Sorry, no drivers could accept your ride or it was cancelled.");
              }
            } else {
              router.replace({
                pathname: "/screens/LiveRideTrackingScreen",
                params: { bookingId: activeBookingId }
              });
            }
          }
        } catch (err) {}
      }
    });
    return () => subscription.remove();
  }, [isSearching, activeBookingId]);

  // Poll & Socket listener for booking status when searching
  useEffect(() => {
    if (!isSearching || !activeBookingId) return;

    let socketRef: any;
    let pollIntervalId: any;

    const checkStatus = async () => {
      try {
        const res = await bookingAPI.getBookingStatus(activeBookingId);
        const status = res.data?.booking?.status;
        const cancellationReason = res.data?.booking?.cancellationReason;
        if (status && status !== 'pending') {
          clearInterval(pollIntervalId);
          setIsSearching(false);
          if (status === 'cancelled') {
            if (cancellationReason === 'No driver accepted within timeout limit') {
              Alert.alert(
                "Sorry for the inconvenience",
                "No drivers are available right now. Please try again after some time."
              );
            } else {
              Alert.alert("Ride Cancelled", "Sorry, no drivers could accept your ride or it was cancelled.");
            }
          } else {
            router.replace({
              pathname: "/screens/LiveRideTrackingScreen",
              params: { bookingId: activeBookingId }
            });
          }
        }
      } catch (err) {}
    };

    // Poll every 4 seconds
    pollIntervalId = setInterval(checkStatus, 4000);
    checkStatus();

    // Also listen via socket
    const { initSocket } = require("../../utils/socket");
    initSocket().then((socket: any) => {
      socketRef = socket;
      
      socket.on("rideAccepted", (data: any) => {
        const booking = data?.booking || {};
        if (String(booking.id || booking._id) === String(activeBookingId)) {
          clearInterval(pollIntervalId);
          setIsSearching(false);
          router.replace({
            pathname: "/screens/LiveRideTrackingScreen",
            params: { bookingId: activeBookingId }
          });
        }
      });

      socket.on("bookingCancelledBySystemTimeout", (data: any) => {
        if (String(data.bookingId) === String(activeBookingId)) {
          clearInterval(pollIntervalId);
          setIsSearching(false);
          Alert.alert(
            "Sorry for the inconvenience",
            "No drivers are available right now. Please try again after some time."
          );
        }
      });

      socket.on("bookingCancelledByUser", (data: any) => {
        if (String(data.bookingId) === String(activeBookingId)) {
          clearInterval(pollIntervalId);
          setIsSearching(false);
        }
      });
    });

    return () => {
      clearInterval(pollIntervalId);
      if (socketRef) {
        socketRef.off("rideAccepted");
        socketRef.off("bookingCancelledBySystemTimeout");
        socketRef.off("bookingCancelledByUser");
      }
    };
  }, [isSearching, activeBookingId]);

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

  const handleConfirm = async () => {
    if (isSubmitting) return;
    if (!pickup || !drop) {
      Alert.alert('Missing Info', 'Please enter pickup and drop locations.');
      return;
    }
    if (!pickupCoords || !dropCoords) {
      Alert.alert('Select from suggestions', 'Please select locations from the search results.');
      return;
    }
    if (rideMode === 'long') {
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
    if (bookingType === 'schedule' && scheduledDate <= new Date()) {
      Alert.alert('Invalid Time', 'Please select a future time for scheduling.');
      return;
    }

    if (distanceKm < 2) {
      Alert.alert('Distance Too Short', 'Minimum distance for a ride is 2 KM. Please select a farther destination.');
      return;
    }
    
    if (!fares[selectedVehicle]?.fare || fares[selectedVehicle].fare <= 0) {
      Alert.alert('Calculating Fare', 'Please wait while we calculate the fare. Ride cannot be booked for ₹0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const carType = selectedVehicle;
      const payload = {
        pickupLocation: pickup,
        dropLocation: drop,
        pickupLatitude: pickupCoords.lat,
        pickupLongitude: pickupCoords.lon,
        dropLatitude: dropCoords.lat,
        dropLongitude: dropCoords.lon,
        rideType: 'normal',
        bookingType: bookingType,
        vehicleType: selectedVehicle,
        scheduledDate: bookingType === 'schedule' ? scheduledDate.toISOString() : undefined,
        fare: fares[selectedVehicle].fare,
        baseFare: Math.max(0, fares[carType].fare - (fares[carType].nightSurcharge || 0)),
        distance: distanceKm,
        nightSurcharge: fares[carType].nightSurcharge || 0,
        tollFee: tollCost || 0,
        totalFare: (fares[carType]?.total || 0) + (tollCost || 0),
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
      const msg = err?.response?.data?.message || err.message || "Failed to create booking.";
      Alert.alert("Booking Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar style="dark" />

      <View className={`bg-[#FFD700] ${isSmallPhone ? 'pt-12 pb-6 px-4 rounded-b-[32px]' : 'pt-14 pb-8 px-6 rounded-b-[45px]'} shadow-lg`}>
        <Text className={`${isSmallPhone ? 'text-[28px] mb-4' : 'text-3xl mb-6'} font-black text-slate-900`}>Plan Your Trip</Text>

        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', padding: 4, borderRadius: 16, marginBottom: 24 }}>
          {(distanceKm === 0 || distanceKm < 40) && (
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
          )}

          {(distanceKm === 0 || distanceKm >= 40) && (
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
          )}
        </View>

        <View className={`bg-white ${isSmallPhone ? 'p-3 rounded-[22px]' : 'p-4 rounded-[30px]'} shadow-sm`}>
          <View className="flex-row items-center h-12">
            <View className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-4 border-2 border-blue-200" />
            <TextInput
              placeholder={isLoadingLocation ? "Fetching your live location..." : "From where?"}
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

          {isLoadingSuggestions && activeInput ? (
            <View className="mt-3 border-t border-slate-100 max-h-[220px]">
              {[1, 2, 3].map((_, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: '#F1F5F9', opacity: 1 - i * 0.2 }}>
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#E2E8F0', marginRight: 12 }} />
                  <View style={{ flex: 1, height: 14, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
                </View>
              ))}
            </View>
          ) : suggestions.length > 0 && activeInput ? (
            <View className="mt-3 border-t border-slate-100 max-h-[220px]">
              <FlatList
                data={suggestions.slice(0, 12)}
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
          ) : null}
        </View>
      </View>

      <ScrollView className={`flex-1 ${isSmallPhone ? 'px-4 pt-4' : 'px-6 pt-6'}`} contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>

        {rideMode === 'long' && (
          <View className={`bg-blue-600 ${isSmallPhone ? 'p-5 rounded-[26px] mb-6' : 'p-8 rounded-[40px] mb-8'} shadow-xl`}>
            <View className="bg-white/20 w-12 h-12 rounded-2xl items-center justify-center mb-4">
              <MaterialCommunityIcons name="map-clock-outline" size={28} color="#FFF" />
            </View>
            <Text className="text-white font-black text-xl mb-2">Intercity Travel</Text>
            <Text className="text-white/80 text-sm font-bold leading-5">
              For trips above 40km, we offer specialized outstation services with round-trip discounts.
            </Text>
          </View>
        )}

        {distanceKm > 0 && rideMode === 'normal' && (
          <View className="mb-8">
            <View className={`bg-white ${isSmallPhone ? 'p-4 rounded-[24px]' : 'p-6 rounded-[35px]'} border border-slate-100 flex-row items-center justify-between shadow-sm`}>
              <View className="flex-row items-center flex-1">
                <View className="bg-slate-900 w-12 h-12 rounded-2xl items-center justify-center mr-4">
                  <Ionicons name="car-sport" size={24} color="#FFD700" />
                </View>
                <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Estimated Ride</Text>
                  <Text className="text-slate-900 font-black text-base">{distanceKm.toFixed(1)} KM Trip</Text>
                </View>
              </View>
              <View className="items-end">
                {loadingFares || (distanceKm > 0 && (fares['5seater']?.fare || 0) === 0) ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#FFD700" />
                    <Text className="text-slate-400 text-[10px] font-bold ml-2">Calculating...</Text>
                  </View>
                ) : (
                  <>
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 text-right">Total Fare</Text>
                    <Text className="text-slate-900 font-black text-3xl">₹{(fares['5seater']?.total || 0) + (tollCost || 0)}</Text>
                    
                    <View className="flex-col mt-2 w-full items-end gap-1">
                      <View className="flex-row items-center justify-end">
                        <Text className="text-slate-500 text-[10px] font-bold mr-2">Base Fare</Text>
                        <Text className="text-slate-700 text-[10px] font-bold">₹{Math.max(0, (fares['5seater']?.fare || 0) - (fares['5seater']?.nightSurcharge || 0))}</Text>
                      </View>
                      
                      {fares['5seater']?.isNight && (
                        <View className="flex-row items-center justify-end">
                          <Text className="text-[#6366F1] text-[10px] font-bold mr-2">Night Fare</Text>
                          <Text className="text-[#6366F1] text-[10px] font-bold">+₹{fares['5seater']?.nightSurcharge}</Text>
                        </View>
                      )}
                      
                      {(tollCost || 0) > 0 && (
                        <View className="flex-row items-center justify-end">
                          <Text className="text-emerald-600 text-[10px] font-bold mr-2">Toll/State Tax</Text>
                          <Text className="text-emerald-600 text-[10px] font-bold">+₹{tollCost || 0}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Scheduler removed */}

        {/* --- TOLLS & PARKING DISCLAIMER ADDED HERE --- */}
        <View style={{ backgroundColor: '#FEF2F2', padding: 14, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="information-circle" size={22} color="#EF4444" />
          <Text style={{ flex: 1, marginLeft: 10, color: '#DC2626', fontSize: 11, fontWeight: '800', lineHeight: 16 }}>
            Note: {tollCost > 0 ? `₹${(tollCost) * 2} Estimated toll (round-trip) is included in your fare. Extra Parking charges (if any) are to be paid by you directly.` : `Tolls & Parking charges (if any) are extra and to be paid by you directly to the driver.`}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={isSubmitting}
          className={`bg-slate-900 ${isSmallPhone ? 'py-4 rounded-[20px]' : 'py-[22px] rounded-[28px]'} px-4 items-center shadow-lg active:scale-95 ${isSubmitting ? 'opacity-50' : 'opacity-100'}`}
        >
          <Text 
            numberOfLines={1}
            className="text-white font-black text-sm tracking-[1px] text-center uppercase"
          >
            {isSubmitting ? 'PROCESSING...' : (rideMode === 'long' ? 'CONTINUE TO OUTSTATION' : (bookingType === 'schedule' ? 'PLAN MY TRIP' : 'SEARCH RIDE NOW'))}
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
        totalFare={(fares[selectedVehicle]?.total || 0) + ((tollCost || 0) * 2)}
        tollFee={(tollCost || 0) * 2}
      />

      {/* Bottom Tab Bar (visible on this screen to match Home) */}
      <View
        className="absolute bottom-0 w-full bg-white flex-row justify-around items-center border-t border-slate-100 shadow-2xl elevation-[25] z-50"
        style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 10 }}
      >
        <TouchableOpacity className="items-center justify-center pt-2 w-1/5" onPress={() => router.replace('/screens/HomeScreen')}>
          <Ionicons name="home" size={24} color="#94A3B8" />
          <Text className="text-[11px] font-bold mt-1 text-slate-400">Home</Text>
        </TouchableOpacity>
        {false && (
          <TouchableOpacity className="items-center justify-center pt-2 w-1/5" onPress={() => router.replace({ pathname: '/screens/BookingScreen', params: { mode: 'schedule' } })}>
            <Ionicons name="calendar" size={24} color="#1E293B" />
            <Text className="text-[11px] font-bold mt-1 text-slate-800">Ride</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity className="items-center justify-center pt-2 w-1/5" onPress={() => router.replace('/screens/HistoryScreen')}>
          <Ionicons name="list" size={24} color="#94A3B8" />
          <Text className="text-[11px] font-bold mt-1 text-slate-400">History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="items-center justify-center pt-2 w-1/5" onPress={() => router.replace('/screens/HelpScreen')}>
          <Ionicons name="help-circle" size={24} color="#94A3B8" />
          <Text className="text-[11px] font-bold mt-1 text-slate-400">Help</Text>
        </TouchableOpacity>
     
        <TouchableOpacity className="items-center justify-center pt-2 w-1/5" onPress={() => router.replace('/screens/ProfileScreen')}>
          <Ionicons name="person" size={24} color="#94A3B8" />
          <Text className="text-[11px] font-bold mt-1 text-slate-400">Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BookingScreen;