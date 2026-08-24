import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import tw from 'twrnc';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// Web Client ID dari Firebase Authentication > Google provider
const WEB_CLIENT_ID = '79655128399-o9qjm8vmjqoef5vfrgkqkharqubtp8qs.apps.googleusercontent.com';

if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
  });
}


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
      let firebaseUser;

      if (Platform.OS === 'web') {
        // Mode Web Browser: Pakai Firebase Popup bawaan
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        firebaseUser = result.user;
      } else {
        // Mode HP (Android/iOS): Pakai Google Sign-In Native
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        await GoogleSignin.signIn();
        const { idToken } = await GoogleSignin.getTokens();

        if (!idToken) {
          throw new Error('Tidak bisa mendapatkan token Google.');
        }

        const googleCredential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, googleCredential);
        firebaseUser = result.user;
      }

      // === LOGIK DETEKSI ADMIN / ORANG TUA ===
      // Cek whitelist admin & simpan ke Firestore
      const emailKey = (firebaseUser.email || '').toLowerCase().trim();
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // User baru: Cek apakah email terdaftar sebagai admin
        const whitelistSnap = await getDoc(doc(db, 'whitelist_admins', emailKey));
        if (whitelistSnap.exists()) {
          // Masuk sebagai Admin
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || emailKey,
            email: firebaseUser.email,
            role: 'admin',
            status_verifikasi: 'verified',
            createdAt: new Date().toISOString(),
          });
        } else {
          // Masuk sebagai Orang Tua
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
        // User lama: Jika user sudah ada tapi email baru saja dimasukkan ke whitelist → update jadi admin
        const wlSnap = await getDoc(doc(db, 'whitelist_admins', emailKey));
        if (wlSnap.exists() && userSnap.data()?.role !== 'admin') {
          await setDoc(userRef, { role: 'admin', status_verifikasi: 'verified' }, { merge: true });
        }
      }

      // AuthContext akan otomatis mendeteksi perubahan state dan me-redirect ke halaman yang tepat

    } catch (error: any) {
      if (Platform.OS !== 'web' && error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User membatalkan login di HP
      } else if (Platform.OS !== 'web' && error.code === statusCodes.IN_PROGRESS) {
        // Sign-in sedang proses
      } else if (Platform.OS !== 'web' && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services tidak tersedia.');
      } else {
        console.error('Google Sign-In Error:', error);
        Alert.alert('Login Gagal', error.message || 'Terjadi kesalahan saat login.');
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
        <View style={tw`absolute inset-0 items-center justify-center opacity-10 z-0`}>
          <Image 
            source={require('../../assets/images/child_watermark.jpg')}
            style={tw`w-[120%] h-[120%]`}
            resizeMode="cover"
          />
        </View>

        {/* Main Content */}
        <View style={tw`relative z-10 flex-1 flex-col px-6 pb-12`}>
          {/* Top: Logo & Tagline */}
          <View style={tw`flex-1 items-center justify-center mt-12`}>
            <Text style={tw`text-4xl font-extrabold text-[#031636] text-center tracking-tight`}>TumbuhSehat</Text>
            <Text style={tw`text-base text-[#1A2B4C]/70 text-center mt-4 leading-relaxed px-8`}>
              Pantau Tumbuh Kembang & Cegah Stunting Sejak Dini
            </Text>
          </View>

          {/* Login Content Area */}
          <View style={tw`w-full pb-6`}>
            {/* Google Sign-In Button */}
            <View style={tw`items-center gap-3 w-full max-w-sm mx-auto`}>
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
      </View>
    </SafeAreaView>
  );
}
