import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../context/AuthContext';

// Safe prevent auto-hide
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Layout() {
  useEffect(() => {
    // Sembunyikan splash screen segera setelah komponen utama dimuat
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(parent)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="verifikasi" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
