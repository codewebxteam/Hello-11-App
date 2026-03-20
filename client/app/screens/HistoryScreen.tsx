import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ActivitySection from '../../components/ActivitySection';
import { bookingAPI } from '../../utils/api';

type Tab = 'normal' | 'scheduled';

const ScheduledRideCard = ({ item, onViewDetails }: { item: any; onViewDetails: (b: any) => void }) => {
  const id = item._id || item.id;
  return (
    <View style={{ backgroundColor: '#fff', marginBottom: 16, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontWeight: '900' }}>{new Date(item.scheduledDate || item.createdAt).toLocaleString()}</Text>
        <Text style={{ fontWeight: '900' }}>₹{item.fare || item.totalFare || '--'}</Text>
      </View>

      <Text style={{ color: '#64748b', marginBottom: 6 }}>{item.pickupLocation}</Text>
      <Text style={{ color: '#1e293b', fontWeight: '700', marginBottom: 12 }}>{item.dropLocation}</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <TouchableOpacity onPress={() => onViewDetails(item)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '700', marginRight: 6 }}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function HistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('normal');

  // Scheduled history state
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  const fetchScheduledHistory = useCallback(async () => {
    try {
      setLoadingScheduled(true);
      const res = await bookingAPI.getScheduledHistory();
      setScheduled(res.data?.bookings || []);
    } catch (err) {
      console.error('[HistoryScreen] fetchScheduledHistory', err);
      setScheduled([]);
    } finally {
      setLoadingScheduled(false);
    }
  }, []);

  useEffect(() => { if (tab === 'scheduled') fetchScheduledHistory(); }, [tab, fetchScheduledHistory]);

  const openDetails = (item: any) => {
    const bookingId = item._id || item.id;
    router.push({ pathname: '/screens/RideDetailsScreen', params: { bookingId: String(bookingId), prefill: JSON.stringify(item) } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ backgroundColor: '#fff', paddingTop: 16, paddingBottom: 12, paddingHorizontal: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={{ fontWeight: '900', fontSize: 18 }}>History</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 12, padding: 4, marginTop: 12 }}>
          <TouchableOpacity onPress={() => setTab('normal')} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: tab === 'normal' ? '#fff' : 'transparent' }}>
            <Text style={{ fontWeight: '900', textTransform: 'uppercase', fontSize: 12 }}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('scheduled')} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: tab === 'scheduled' ? '#fff' : 'transparent' }}>
            <Text style={{ fontWeight: '900', textTransform: 'uppercase', fontSize: 12 }}>Scheduled</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        {tab === 'normal' ? (
          <ActivitySection onBookRide={() => router.push('/screens/BookingScreen')} />
        ) : (
          loadingScheduled ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#FFD700" />
            </View>
          ) : (
            <FlatList
              data={scheduled}
              keyExtractor={(i) => (i._id || i.id || Math.random()).toString()}
              renderItem={({ item }) => <ScheduledRideCard item={item} onViewDetails={openDetails} />}
              contentContainerStyle={{ paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
            />
          )
        )}
      </View>
    </SafeAreaView>
  );
}
