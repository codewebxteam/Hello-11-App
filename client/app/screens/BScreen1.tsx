import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, Dimensions, TextInput, StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useRouter, Stack } from "expo-router";

const { width } = Dimensions.get('window');

const FLEET_DATA = [
  { id: '1', name: 'MINI', price: '₹12/km', label: 'ECO' },
  { id: '2', name: 'SEDAN', price: '₹16/km', label: 'PRO' },
  { id: '3', name: 'SUV', price: '₹22/km', label: 'LUX' },
];

const BScreen1 = () => {
  const router = useRouter();
  const [distance, setDistance] = useState('');
  const [selectedCab, setSelectedCab] = useState('1');
  const [bookingType, setBookingType] = useState<'now' | 'schedule'>('now');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>OUTSTATION RIDE</Text>
          <View style={{ width: 40 }} /> 
        </View>

        {/* LOCATION CARD */}
        <View style={styles.locationCard}>
          <View style={styles.inputBox}>
            <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
            <TextInput placeholder="Enter Pickup Location" style={styles.input} />
          </View>
          <View style={styles.line} />
          <View style={styles.inputBox}>
            <Ionicons name="location" size={18} color="#ef4444" style={{marginRight: 10}} />
            <TextInput placeholder="Enter Drop Destination" style={styles.input} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* DISTANCE BOX */}
        <View style={styles.distContainer}>
          <Ionicons name="map-outline" size={20} color="#6366f1" />
          <TextInput 
            placeholder="Estimated Distance" 
            keyboardType="numeric"
            value={distance}
            onChangeText={setDistance}
            style={styles.distInput}
          />
          {distance !== '' && <Text style={styles.kmLabel}>KM</Text>}
        </View>

        <Text style={styles.label}>SELECT YOUR VEHICLE</Text>

        {/* FLEET GRID - PURE STYLE (NO TAILWIND HERE) */}
        <View style={styles.fleetGrid}>
          {FLEET_DATA.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setSelectedCab(item.id)}
              style={[
                styles.cabCard,
                selectedCab === item.id ? styles.cabSelected : styles.cabUnselected
              ]}
            >
              <Text style={[styles.typeLabel, { color: selectedCab === item.id ? '#854d0e' : '#94a3b8' }]}>
                {item.label}
              </Text>
              <Text style={styles.cabName}>{item.name}</Text>
              <Text style={styles.priceText}>{item.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BOOKING PANEL */}
        <View style={styles.darkPanel}>
          <View style={styles.tabBar}>
            <TouchableOpacity 
              onPress={() => setBookingType('now')}
              style={[styles.tab, bookingType === 'now' && styles.tabActive]}
            >
              <Text style={[styles.tabText, { color: bookingType === 'now' ? 'black' : '#94a3b8' }]}>RIDE NOW</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setBookingType('schedule')}
              style={[styles.tab, bookingType === 'schedule' && styles.tabActive]}
            >
              <Text style={[styles.tabText, { color: bookingType === 'schedule' ? 'black' : '#94a3b8' }]}>SCHEDULE</Text>
            </TouchableOpacity>
          </View>

          {bookingType === 'schedule' && (
            <TouchableOpacity style={styles.scheduleRow}>
              <Ionicons name="calendar" size={18} color="#FFD700" />
              <Text style={styles.scheduleText}>Pick Date & Time</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.mainBtn}>
            <Text style={styles.mainBtnText}>CONFIRM OUTSTATION</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#FFD700', paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.5)', padding: 8, borderRadius: 12 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: 'black' },
  locationCard: { backgroundColor: 'white', padding: 15, borderRadius: 25, elevation: 5 },
  inputBox: { flexDirection: 'row', alignItems: 'center', height: 45 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 15 },
  input: { flex: 1, fontWeight: 'bold', fontSize: 14 },
  line: { width: 1, height: 10, backgroundColor: '#e2e8f0', marginLeft: 3 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  distContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#e2e8f0' },
  distInput: { flex: 1, marginLeft: 10, fontWeight: 'bold', fontSize: 15 },
  kmLabel: { fontWeight: '900', color: '#64748b' },
  label: { fontSize: 12, fontWeight: '900', color: '#64748b', marginBottom: 15, marginLeft: 5 },
  fleetGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  cabCard: { width: (width - 60) / 3.2, padding: 15, borderRadius: 22, alignItems: 'center', borderWidth: 2 },
  cabSelected: { borderColor: '#FFD700', backgroundColor: '#fefce8' },
  cabUnselected: { borderColor: 'transparent', backgroundColor: 'white' },
  typeLabel: { fontSize: 8, fontWeight: '900', marginBottom: 5 },
  cabName: { fontSize: 13, fontWeight: '900' },
  priceText: { fontSize: 10, fontWeight: 'bold', marginTop: 5, color: '#FFD700' },
  darkPanel: { backgroundColor: '#0f172a', padding: 20, borderRadius: 35 },
  tabBar: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 5, borderRadius: 15, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: '#FFD700' },
  tabText: { fontSize: 11, fontWeight: '900' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: '#1e293b', padding: 12, borderRadius: 12 },
  scheduleText: { color: 'white', marginLeft: 10, fontWeight: 'bold' },
  mainBtn: { backgroundColor: 'white', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  mainBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});

export default BScreen1;