import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import Input from '../components/Input';
import QuickAction from '../components/QuickAction';
import RideCard from '../components/RideCard';
import Button from '../components/Button';
import { COLORS } from '../constants/colors';
import { SPACING, FONT_SIZES, COMMON_STYLES } from '../constants/theme';

export default function HomeScreen() {
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const router = useRouter();

    const handleMenuPress = () => {
        // Handle menu press
        console.log('Menu pressed');
    };

    const handleProfilePress = () => {
        router.push('/screens/ProfileScreen');
    };

    return (
        <SafeAreaView style={COMMON_STYLES.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

            <Header
                title="RideNow"
                onMenuPress={handleMenuPress}
                onProfilePress={handleProfilePress}
            />

            <View style={styles.content}>
                {/* Location Input Card */}
                <View style={[COMMON_STYLES.card, COMMON_STYLES.shadow, styles.locationCard]}>
                    <Text style={styles.cardTitle}>Where to?</Text>

                    {/* Pickup Location */}
                    <View style={styles.inputRow}>
                        <View style={styles.pickupDot} />
                        <Input
                            placeholder="Pickup location"
                            value={pickup}
                            onChangeText={setPickup}
                            style={styles.locationInput}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Destination */}
                    <View style={styles.inputRow}>
                        <Input
                            icon="location-sharp"
                            placeholder="Where to?"
                            value={destination}
                            onChangeText={setDestination}
                            style={styles.locationInput}
                        />
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <QuickAction icon="home" label="Home" />
                    <QuickAction icon="briefcase" label="Work" />
                    <QuickAction icon="time" label="Recent" />
                </View>

                {/* Ride Options */}
                <View style={styles.rideOptions}>
                    <Text style={styles.sectionTitle}>Choose your ride</Text>

                    <RideCard
                        icon="car-sport"
                        name="Mini"
                        description="Affordable rides"
                        price="₹120"
                    />

                    <RideCard
                        icon="car"
                        name="Sedan"
                        description="Comfortable rides"
                        price="₹180"
                    />

                    <RideCard
                        icon="car-sport-outline"
                        name="Premium"
                        description="Luxury rides"
                        price="₹250"
                    />
                </View>
            </View>

            {/* Book Now Button */}
            <View style={styles.footer}>
                <Button title="Book Now" onPress={() => console.log('Book Now')} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    locationCard: {
        marginBottom: SPACING.lg,
    },
    cardTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 15,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    pickupDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.black,
        marginRight: SPACING.sm,
    },
    locationInput: {
        flex: 1,
        borderWidth: 0,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray200,
        marginLeft: 20,
        marginVertical: SPACING.sm,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 25,
    },
    rideOptions: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 15,
    },
    footer: {
        padding: SPACING.lg,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
    },
});
