import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import tw from 'twrnc';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const GoogleIcon = () => (
  <Svg height="22" viewBox="0 0 24 24" width="22">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </Svg>
);

const WatermarkIcon = () => (
  <Svg fill="none" height="400" stroke="#1A2B4C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.5" viewBox="0 0 24 24" width="400">
    <Path d="M12 22c0-4-3-8-8-8c0 4 3 8 8 8Z" />
    <Path d="M12 22c0-8 6-12 10-12c0 8-6 12-10 12Z" />
    <Path d="M12 22V10" />
    <Path d="M12 22H6" />
    <Path d="M12 18H8" />
    <Path d="M12 14H10" />
  </Svg>
);

export default function LoginScreen() {
  const router = useRouter();
  const { user, role, status, loading, loginWithEmail } = useAuth();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle redirect if user is already logged in
  useEffect(() => {
    if (!loading && user && role) {
      if (status === 'pending') {
        router.replace('/verifikasi');
      } else if (role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(parent)');
      }
    }
  }, [user, role, status, loading]);

  const handlePerformLogin = async (emailToLogin: string) => {
    const cleanEmail = emailToLogin.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Masukkan alamat email yang valid.');
      return;
    }

    setAuthLoading(true);
    setErrorMessage('');

    try {
      const result = await loginWithEmail(cleanEmail);
      setModalVisible(false);
      
      if (result.role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(parent)');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Gagal masuk: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F0F7F7]`}>
      <View style={tw`flex-1 relative flex-col justify-between overflow-hidden bg-[#F0F7F7]`}>
        {/* Subtle Watermark Background */}
        <View style={tw`absolute inset-0 items-center justify-center opacity-5 z-0`}>
          <View style={{ transform: [{ scale: 2.5 }] }}>
            <WatermarkIcon />
          </View>
        </View>

        {/* Main Content Container */}
        <View style={tw`relative z-10 flex-col flex-1 px-4 pt-16 pb-10 w-full max-w-md mx-auto justify-between`}>
          
          {/* Top Section: Logo & Welcome */}
          <View style={tw`flex-col items-center mt-8`}>
            <View style={tw`w-28 h-28 rounded-3xl bg-[#031636] p-4 items-center justify-center shadow-lg`}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida/AEtjO1XejXHJ-SLgl282mdHs_T4o6jSFuL_HvMFjUbRvyda4_p9EW-n5NHB30GVI218p2IN-hoBieNJ6J_UbPb6J2uJ6SMRVOrVk5fqh5G-mcDW5tQNFUZE1kDGtZaKZmJo-kn-u2qv9u08DAn9HoycL3mr8IxNfu3WJMWMP7tEJ0UrpKnof1NkA7gjp9B8t0s2wiTU1ntCnBdZvgMErAfXpXpKvnva7zhfemW0ncBsnoAMfr5nesZYuJ-Pp1A' }} 
                style={tw`w-full h-full`}
                resizeMode="contain"
              />
            </View>

            <View style={tw`items-center mt-6`}>
              <Text style={tw`text-[26px] text-center font-bold text-[#031636]`}>
                TumbuhSehat Mobile
              </Text>
              <Text style={tw`text-sm text-center text-[#1A2B4C]/70 mt-2 px-4 leading-relaxed`}>
                Aplikasi Pemantauan Tumbuh Kembang & Pencegahan Stunting Anak Terintegrasi
              </Text>
            </View>
          </View>

          {/* Action Buttons Section */}
          <View style={tw`w-full space-y-3`}>
            {/* Primary Google Login Button */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                setErrorMessage('');
                setInputEmail('');
                setModalVisible(true);
              }}
              style={tw`w-full flex-row items-center justify-center bg-white py-4 px-6 rounded-2xl border border-[#1A2B4C]/10 shadow-sm`}
            >
              <GoogleIcon />
              <Text style={tw`text-base font-bold ml-3 text-[#031636]`}>
                Masuk dengan Akun Google
              </Text>
            </TouchableOpacity>

            <Text style={tw`text-[11px] text-center text-[#1A2B4C]/50 mt-2`}>
              Admin/Nakes didaftarkan melalui Portal Superadmin Website
            </Text>
          </View>
          
        </View>
      </View>

      {/* LOGIN MODAL */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={tw`flex-1 bg-black/60 items-center justify-center p-4`}>
          <View style={tw`bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl`}>
            
            <Text style={tw`text-lg font-bold text-[#031636] text-center mb-1`}>
              Masuk ke TumbuhSehat
            </Text>
            <Text style={tw`text-xs text-[#1A2B4C]/60 text-center mb-5`}>
              Masukkan email Google yang terdaftar
            </Text>

            {errorMessage ? (
              <View style={tw`bg-red-50 p-2.5 rounded-xl mb-3 border border-red-200`}>
                <Text style={tw`text-xs text-red-600 font-semibold text-center`}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={tw`mb-4`}>
              <Text style={tw`text-xs font-bold text-[#031636] mb-1.5`}>
                Alamat Email Google
              </Text>
              <TextInput
                value={inputEmail}
                onChangeText={setInputEmail}
                placeholder="contoh: dokter@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={tw`w-full bg-[#f7f9fb] border border-gray-300 rounded-xl px-3.5 py-3 text-sm text-[#031636]`}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={authLoading}
              onPress={() => handlePerformLogin(inputEmail)}
              style={tw`w-full bg-[#10b981] py-3.5 rounded-xl items-center justify-center shadow-md mb-3`}
            >
              {authLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={tw`text-white font-bold text-sm`}>
                  Lanjutkan Masuk
                </Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={tw`w-full py-2.5 items-center justify-center`}
            >
              <Text style={tw`text-xs text-gray-500 font-semibold`}>
                Batal
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
