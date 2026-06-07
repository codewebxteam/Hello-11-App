import React, { useState, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from "../../context/AuthContext";

const RegisterScreen = () => {
  const { width } = useWindowDimensions();
  const { phone: prefillPhone } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState((prefillPhone as string) || "");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const router = useRouter();
  const { register, verifyOTP } = useAuth();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleRegisterRequest = async () => {
    if (!name.trim() || phoneNumber.length < 10) {
      Alert.alert("Attention", "Please enter your name and 10-digit mobile number.");
      return;
    }
    if (!termsAccepted) {
      Alert.alert("Terms Required", "Please accept the Terms & Privacy Policy to continue.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await register(name, phoneNumber);
      if (result.success) {
        setIsOtpSent(true);
        Alert.alert("OTP Sent", "Code sent to WhatsApp.");
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit code.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyOTP(phoneNumber, otp);
      if (result.success) {
        Alert.alert("Success", `Welcome ${name}!`);
        router.replace("/screens/HomeScreen");
      } else {
        Alert.alert("Verification Failed", result.message);
      }
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const isSmallPhone = width < 360;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: '#FFD700' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" translucent backgroundColor="transparent" />

        {/* Background decorative circles */}
        <View style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 999 }} />
        <View style={{ position: 'absolute', bottom: -150, right: -100, width: 500, height: 500, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 999 }} />
        <View style={{ position: 'absolute', top: '30%', right: -20, width: 96, height: 96, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999 }} />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 36, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={{ alignItems: 'center', marginTop: isKeyboardVisible ? 48 : 64, marginBottom: isKeyboardVisible ? 16 : 28 }}>
              <View style={{ backgroundColor: 'white', padding: 22, borderRadius: 60, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 }}>
                <Image
                  source={require("../../assets/images/official_logo.png")}
                  style={{ width: isKeyboardVisible ? 70 : 100, height: isKeyboardVisible ? 70 : 100 }}
                  resizeMode="contain"
                />
              </View>
              {!isKeyboardVisible && (
                <View style={{ marginTop: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#000', fontSize: 36, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 }}>
                    HELLO <Text style={{ color: 'white' }}>11</Text>
                  </Text>
                  <Text style={{ color: 'rgba(0,0,0,0.4)', fontSize: 10, fontWeight: '700', marginTop: 6, letterSpacing: 4, textTransform: 'uppercase' }}>
                    Join the Elite Circle
                  </Text>
                </View>
              )}
            </View>

            {/* ── FULL NAME ── */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, marginLeft: 4 }}>
                Full Name
              </Text>
              <View style={{
                backgroundColor: 'white',
                height: 64,
                borderRadius: 24,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.10,
                shadowRadius: 12,
                elevation: 5,
                borderWidth: focusedInput === 'name' ? 2 : 0,
                borderColor: focusedInput === 'name' ? 'rgba(0,0,0,0.12)' : 'transparent',
              }}>
                <Ionicons name="person" size={20} color="#1E293B" />
                <TextInput
                  placeholder="Your full name"
                  placeholderTextColor="#94A3B8"
                  style={{ flex: 1, fontWeight: '700', color: '#1E293B', fontSize: 17, marginLeft: 14 }}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  editable={!isLoading && !isOtpSent}
                  autoComplete="name"
                  textContentType="name"
                />
              </View>
            </View>

            {/* ── MOBILE NUMBER ── */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, marginLeft: 4 }}>
                Mobile Number
              </Text>
              <View style={{
                backgroundColor: 'white',
                height: 64,
                borderRadius: 24,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.10,
                shadowRadius: 12,
                elevation: 5,
                borderWidth: focusedInput === 'phone' ? 2 : 0,
                borderColor: focusedInput === 'phone' ? 'rgba(0,0,0,0.12)' : 'transparent',
              }}>
                <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                <TextInput
                  placeholder="WhatsApp number"
                  placeholderTextColor="#94A3B8"
                  style={{ flex: 1, fontWeight: '700', color: '#1E293B', fontSize: 17, marginLeft: 14 }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => setFocusedInput(null)}
                  editable={!isLoading && !isOtpSent}
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  selectTextOnFocus={true}
                />
              </View>
            </View>

            {/* ── OTP ── */}
            {isOtpSent && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, marginLeft: 4 }}>
                  OTP Code
                </Text>
                <View style={{
                  backgroundColor: 'white',
                  height: 64,
                  borderRadius: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.10,
                  shadowRadius: 12,
                  elevation: 5,
                  borderWidth: focusedInput === 'otp' ? 2 : 0,
                  borderColor: focusedInput === 'otp' ? 'rgba(0,0,0,0.12)' : 'transparent',
                }}>
                  <Ionicons name="shield-checkmark" size={20} color="#1E293B" />
                  <TextInput
                    placeholder="6-digit code"
                    placeholderTextColor="#94A3B8"
                    style={{ flex: 1, fontWeight: '900', color: '#1E293B', fontSize: 20, marginLeft: 14, letterSpacing: 4 }}
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtp(cleaned);
                    }}
                    onFocus={() => setFocusedInput('otp')}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isLoading}
                    autoComplete="sms-otp"
                    textContentType="oneTimeCode"
                    contextMenuHidden={false}
                  />
                </View>
              </View>
            )}

            {/* ── TERMS & PRIVACY CHECKBOX ── */}
            {!isOtpSent && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTermsAccepted(prev => !prev)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 20,
                  marginTop: 4,
                  backgroundColor: termsAccepted ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.5)',
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1.5,
                  borderColor: termsAccepted ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.8)',
                }}
              >
                {/* Checkbox box */}
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  backgroundColor: termsAccepted ? '#1E293B' : 'white',
                  borderWidth: 2,
                  borderColor: termsAccepted ? '#1E293B' : '#CBD5E1',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  flexShrink: 0,
                }}>
                  {termsAccepted && <Ionicons name="checkmark" size={15} color="#FFD700" />}
                </View>

                {/* Text */}
                <Text style={{ flex: 1, fontSize: 12.5, color: '#1E293B', fontWeight: '600', lineHeight: 18 }}>
                  I agree to the{' '}
                  <Text
                    style={{ fontWeight: '900', textDecorationLine: 'underline' }}
                    onPress={() => router.push("/screens/TermsScreen")}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={{ fontWeight: '900', textDecorationLine: 'underline' }}
                    onPress={() => router.push("/screens/PrivacyScreen")}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>
            )}

            {/* ── REGISTER / VERIFY BUTTON ── */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={isOtpSent ? handleVerifyOtp : handleRegisterRequest}
              disabled={isLoading || (!isOtpSent && !termsAccepted)}
              style={{
                height: 64,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (!isOtpSent && !termsAccepted) ? 'rgba(0,0,0,0.25)' : '#000',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: (!isOtpSent && !termsAccepted) ? 0 : 8,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFD700" />
              ) : (
                <Text style={{ color: '#FFD700', fontWeight: '900', fontSize: 17, letterSpacing: 2, textTransform: 'uppercase' }}>
                  {isOtpSent ? "Create Account" : "Register Now"}
                </Text>
              )}
            </TouchableOpacity>

            {/* ── FOOTER ── */}
            {!isKeyboardVisible && (
              <View style={{ marginTop: 32, alignItems: 'center' }}>
                <TouchableOpacity onPress={() => router.push("/screens/LoginScreen")} style={{ flexDirection: 'row' }}>
                  <Text style={{ color: '#000', fontWeight: '500', fontSize: 14 }}>Already a member? </Text>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 14, textDecorationLine: 'underline' }}>Sign In</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default RegisterScreen;