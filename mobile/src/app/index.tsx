import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import tw from 'twrnc';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// Web Client ID dari Firebase Authentication > Google provider
const WEB_CLIENT_ID = '79655128399-o9qjm8vmjqoef5vfrgkqkharqubtp8qs.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  offlineAccess: false,
});

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
  const [signingIn, setSigningIn] = useState(false);

  // Redirect jika sudah login
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

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      // Cek ketersediaan Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Tampilkan dialog pilih akun Google
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        throw new Error('Tidak bisa mendapatkan token Google.');
      }

      // Buat credential Firebase dari token Google
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, googleCredential);
      const firebaseUser = result.user;

      // Cek whitelist admin & simpan ke Firestore jika perlu
      const emailKey = (firebaseUser.email || '').toLowerCase().trim();
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Cek whitelist admin
        const whitelistSnap = await getDoc(doc(db, 'whitelist_admins', emailKey));
        if (whitelistSnap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || emailKey,
            email: firebaseUser.email,
            role: 'admin',
            status_verifikasi: 'verified',
            createdAt: new Date().toISOString(),
          });
        } else {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || emailKey,
            email: firebaseUser.email,
            role: 'parent',
            status_verifikasi: 'verified',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        // Jika user sudah ada tapi email ada di whitelist → update jadi admin
        const wlSnap = await getDoc(doc(db, 'whitelist_admins', emailKey));
        if (wlSnap.exists() && userSnap.data()?.role !== 'admin') {
          await setDoc(userRef, { role: 'admin', status_verifikasi: 'verified' }, { merge: true });
        }
      }

      // AuthContext akan mendeteksi auth state change dan redirect otomatis
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User membatalkan proses sign-in — tidak perlu tampilkan error
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign-in sudah dalam proses
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services tidak tersedia atau belum diperbarui.');
      } else {
        console.error('Google Sign-In Error:', error);
        Alert.alert('Login Gagal', error.message || 'Terjadi kesalahan saat login dengan Google.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#031636] items-center justify-center`}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={tw`text-white/70 text-sm mt-4`}>Memuat aplikasi...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F0F7F7]`}>
      <View style={tw`flex-1 relative flex-col justify-between overflow-hidden bg-[#F0F7F7]`}>
        {/* Watermark Background */}
        <View style={tw`absolute inset-0 items-center justify-center opacity-5 z-0`}>
          <View style={{ transform: [{ scale: 2.5 }] }}>
            <WatermarkIcon />
          </View>
        </View>

        {/* Main Content */}
        <View style={tw`relative z-10 flex-1 flex-col justify-between px-6 pt-20 pb-12`}>
          {/* Top: Logo & Tagline */}
          <View style={tw`items-center`}>
            <View style={tw`w-28 h-28 rounded-3xl bg-[#031636] items-center justify-center shadow-2xl mb-6`}>
              <Text style={tw`text-5xl`}>🌱</Text>
            </View>
            <Text style={tw`text-3xl font-bold text-[#031636] text-center`}>TumbuhSehat</Text>
            <Text style={tw`text-base text-[#1A2B4C]/70 text-center mt-3 leading-relaxed px-4`}>
              Pantau Tumbuh Kembang & Cegah Stunting Sejak Dini
            </Text>
          </View>

          {/* Info Cards */}
          <View style={tw`flex-col gap-3`}>
            {[
              { icon: '📏', title: 'Pemantauan Pertumbuhan', desc: 'Lacak berat, tinggi & lingkar kepala anak secara berkala' },
              { icon: '📊', title: 'Grafik WHO Interaktif', desc: 'Visualisasi pertumbuhan anak vs standar WHO internasional' },
              { icon: '🏥', title: 'Pantauan Tenaga Medis', desc: 'Admin puskesmas dapat memantau seluruh pasien' },
            ].map((item, i) => (
              <View key={i} style={tw`flex-row items-center gap-4 bg-white/80 rounded-2xl px-4 py-3.5 shadow-sm`}>
                <Text style={tw`text-2xl`}>{item.icon}</Text>
                <View style={tw`flex-1`}>
                  <Text style={tw`font-bold text-[#031636] text-sm`}>{item.title}</Text>
                  <Text style={tw`text-xs text-[#44474e] mt-0.5 leading-relaxed`}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Google Sign-In Button */}
          <View style={tw`items-center gap-3`}>
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={signingIn}
              activeOpacity={0.85}
              style={tw`w-full flex-row items-center justify-center bg-white py-4 px-6 rounded-2xl shadow-md border border-gray-200 gap-3 ${signingIn ? 'opacity-60' : ''}`}
            >
              {signingIn ? (
                <>
                  <ActivityIndicator size="small" color="#031636" />
                  <Text style={tw`font-bold text-[#031636] text-base`}>Memproses...</Text>
                </>
              ) : (
                <>
                  <Svg height="22" viewBox="0 0 24 24" width="22">
                    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </Svg>
                  <Text style={tw`font-bold text-[#031636] text-base`}>Masuk dengan Akun Google</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={tw`text-xs text-[#1A2B4C]/50 text-center`}>
              Admin didaftarkan melalui Portal Superadmin • Data aman & terenkripsi
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
