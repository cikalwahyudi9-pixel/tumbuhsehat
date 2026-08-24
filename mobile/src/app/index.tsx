import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, Dimensions, Platform, Alert } from 'react-native';
import tw from 'twrnc';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { auth, db } from '../config/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const GoogleIcon = () => (
  <Svg height="24" viewBox="0 0 24 24" width="24">
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
  const { user, role, status, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (status === 'pending') {
        router.replace('/verifikasi');
      } else if (role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(parent)');
      }
    }
  }, [user, role, status, loading]);

  const handleLogin = async () => {
    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Cek apakah user sudah ada di Firestore
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        
        if (!docSnap.exists()) {
          // Cek apakah email terdaftar di whitelist Superadmin
          const emailKey = (user.email || '').toLowerCase().trim();
          const whitelistDoc = await getDoc(doc(db, 'whitelist_admins', emailKey));
          
          if (whitelistDoc.exists()) {
            const wlData = whitelistDoc.data();
            await setDoc(userRef, {
              uid: user.uid,
              name: wlData.namaLengkap || user.displayName || '',
              email: user.email,
              role: 'admin',
              status_verifikasi: 'verified',
              institusi: wlData.institusi || '',
              kota: wlData.kota || '',
              wilayah: wlData.wilayah || '',
              jenisNakes: wlData.jenisNakes || '',
              strNomor: wlData.strNomor || '',
              noTelp: wlData.noTelp || '',
              createdAt: new Date().toISOString()
            });
          } else {
            // Buat user baru sebagai Parent default
            await setDoc(userRef, {
              name: user.displayName,
              email: user.email,
              role: 'parent',
              status_verifikasi: 'verified',
              createdAt: new Date().toISOString()
            });
          }
        }
      } catch (error: any) {
        Alert.alert('Login Error', error.message);
        console.error(error);
      }
    } else {
      Alert.alert('Perhatian', 'Saat ini Google Sign-In versi Native belum diatur di prototipe ini. Jalankan di Web (npm run web) untuk mengujinya.');
      // Fallback mock login for native
      router.replace('/(parent)');
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
        <View style={tw`relative z-10 flex-col flex-1 px-4 pt-24 pb-12 w-full max-w-md mx-auto`}>
          
          {/* Top Section: Logo & Welcome */}
          <View style={tw`flex-col items-center mt-12`}>
            <View style={tw`w-32 h-32 rounded-full bg-white p-4 items-center justify-center border border-[#1A2B4C]/10 overflow-hidden shadow-sm`}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida/AEtjO1XejXHJ-SLgl282mdHs_T4o6jSFuL_HvMFjUbRvyda4_p9EW-n5NHB30GVI218p2IN-hoBieNJ6J_UbPb6J2uJ6SMRVOrVk5fqh5G-mcDW5tQNFUZE1kDGtZaKZmJo-kn-u2qv9u08DAn9HoycL3mr8IxNfu3WJMWMP7tEJ0UrpKnof1NkA7gjp9B8t0s2wiTU1ntCnBdZvgMErAfXpXpKvnva7zhfemW0ncBsnoAMfr5nesZYuJ-Pp1A' }} 
                style={tw`w-full h-full`}
                resizeMode="contain"
              />
            </View>
            <View style={tw`items-center mt-6`}>
              <Text style={tw`text-[28px] text-center font-bold text-[#1A2B4C]`}>
                Selamat Datang di TumbuhSehat
              </Text>
              <Text style={tw`text-base text-center text-[#1A2B4C]/70 mt-3 px-4`}>
                Pantau Tumbuh Kembang Buah Hati dengan Presisi Medis
              </Text>
            </View>
          </View>

          <View style={tw`flex-grow`} />

          {/* Lower Third: Login Button */}
          <View style={tw`w-full mb-8`}>
            <TouchableOpacity 
              onPress={handleLogin}
              style={tw`w-full flex-row items-center justify-center bg-white py-4 px-6 rounded-full border border-[#1A2B4C]/5 shadow-sm`}
            >
              <GoogleIcon />
              <Text style={tw`text-base font-semibold ml-4 text-[#1A2B4C]`}>
                Masuk dengan Google
              </Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </View>
    </SafeAreaView>
  );
}
