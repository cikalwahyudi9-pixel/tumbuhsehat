import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Polyline, Line, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';

const VerifikasiIcon = () => (
  <Svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" style={tw`text-[#031636] w-full h-full`}>
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="16" x2="8" y1="13" y2="13" />
    <Line x1="16" x2="8" y1="17" y2="17" />
    <Polyline points="10 9 9 9 8 9" />
    <Circle cx="15" cy="15" r="4" fill="white" stroke="#031636" />
    <Path d="M15 13v2l1.5 1.5" strokeWidth="1.5" stroke="#031636" />
  </Svg>
);

export default function VerifikasiScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f7f9fb]`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 h-16`}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={tw`w-10 h-10 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color="#44474e" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-[#031636]`}>Verification</Text>
        <Image 
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRPd3YKzA33bsJ86z7vxpWSgRcdFxt40cQUcYTRY7thRLYZkXpPIOeEWJbug5HQcONLx60Ri2RwG09eCyW1Y-jjazkaDkUjOGgCRP5UJ0N6FuiJpPvoRyEZowoIFIQiIwxIO2G6ylzugNrY8GaioTWgwPOJ6Mp_H3Ki_6Xmcd3k8inSAkQyrdVnbmQawYAzNno_qqsiIx3jzgW-qguHgi9Loq4hycCwliijbxeEW49a7x2BoxW6B4n' }}
          style={tw`w-8 h-8 rounded-full`}
        />
      </View>

      <View style={tw`flex-1 items-center justify-center px-4`}>
        <View style={tw`w-48 h-48 mb-8 relative justify-center items-center`}>
          <View style={tw`absolute inset-0 bg-[#d8e2ff]/20 rounded-full`} />
          <View style={tw`absolute inset-4 bg-[#b6c6f0]/30 rounded-full`} />
          <View style={tw`w-32 h-32`}>
            <VerifikasiIcon />
          </View>
        </View>

        <View style={tw`items-center max-w-sm`}>
          <Text style={tw`text-2xl font-bold text-[#031636] text-center tracking-tight`}>
            Akun Sedang Diverifikasi
          </Text>
          <Text style={tw`text-lg text-[#44474e] text-center mt-2`}>
            Tim medis kami sedang memverifikasi kredensial Anda. Mohon cek kembali nanti.
          </Text>
        </View>

        <View style={tw`mt-12 flex-col w-full max-w-sm gap-4`}>
          {/* Step 1: Ongoing */}
          <View style={tw`bg-[#eceef0] rounded-xl p-4 flex-row items-center relative overflow-hidden`}>
            <View style={tw`absolute left-0 top-0 bottom-0 w-1 bg-[#031636] rounded-l-xl`} />
            <View style={tw`w-10 h-10 rounded-full bg-[#d8e2ff] items-center justify-center mr-4`}>
              <MaterialIcons name="security" size={20} color="#071b3b" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-bold text-[#191c1e]`}>Verifikasi Kredensial</Text>
              <Text style={tw`text-xs text-[#44474e]`}>Sedang dalam proses pengecekan</Text>
            </View>
            <View style={tw`w-6 h-6 rounded-full border-2 border-gray-300 border-t-[#031636]`} />
          </View>

          {/* Step 2: Pending */}
          <View style={tw`bg-[#eceef0]/50 rounded-xl p-4 flex-row items-center opacity-70`}>
            <View style={tw`w-10 h-10 rounded-full bg-[#e0e3e5] items-center justify-center mr-4`}>
              <MaterialIcons name="check-circle" size={20} color="#44474e" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-bold text-[#191c1e]`}>Aktivasi Akun</Text>
              <Text style={tw`text-xs text-[#44474e]`}>Menunggu tahap sebelumnya</Text>
            </View>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}
