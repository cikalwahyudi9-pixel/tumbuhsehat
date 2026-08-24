import React from 'react';
import { Stack } from 'expo-router';

export default function ParentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="grafik" />
      <Stack.Screen name="riwayat" />
      <Stack.Screen name="profil" />
      <Stack.Screen name="tambah-pengukuran" />
    </Stack>
  );
}
