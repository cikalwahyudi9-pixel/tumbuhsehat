import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfilScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f7f9fb]`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 h-16 bg-[#031636] ${Platform.OS !== 'android' ? 'shadow-sm' : ''}` }>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(parent)')} 
            style={tw`w-10 h-10 items-center justify-center -ml-2 mr-2`}
          >
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={tw`text-lg font-bold text-white`}>Profil</Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="settings" size={24} color="#44474e" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={tw`pb-32 px-4 pt-4 flex-col gap-6`}>
        
        {/* User Card */}
        <View style={tw`flex-col items-center bg-white rounded-3xl p-6 shadow-sm border border-gray-100`}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRPd3YKzA33bsJ86z7vxpWSgRcdFxt40cQUcYTRY7thRLYZkXpPIOeEWJbug5HQcONLx60Ri2RwG09eCyW1Y-jjazkaDkUjOGgCRP5UJ0N6FuiJpPvoRyEZowoIFIQiIwxIO2G6ylzugNrY8GaioTWgwPOJ6Mp_H3Ki_6Xmcd3k8inSAkQyrdVnbmQawYAzNno_qqsiIx3jzgW-qguHgi9Loq4hycCwliijbxeEW49a7x2BoxW6B4n' }}
            style={tw`w-24 h-24 rounded-full mb-3`}
          />
          <Text style={tw`text-xl font-bold text-[#191c1e]`}>Ibu Siti Nurbaya</Text>
          <Text style={tw`text-sm text-[#44474e]`}>siti.nurbaya@example.com</Text>
          <TouchableOpacity style={tw`bg-[#eceef0] px-4 py-2 rounded-full mt-4`}>
            <Text style={tw`text-sm font-semibold text-[#031636]`}>Edit Profil</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={tw`flex-col gap-2`}>
          <Text style={tw`text-sm font-bold text-[#44474e] uppercase tracking-wider ml-2`}>Data Akun</Text>
          <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}>
            
            <TouchableOpacity style={tw`flex-row items-center p-4 border-b border-gray-100`}>
              <View style={tw`w-10 h-10 rounded-full bg-[#031636]/5 items-center justify-center`}>
                <MaterialIcons name="person-outline" size={20} color="#031636" />
              </View>
              <Text style={tw`text-base font-semibold text-[#191c1e] ml-4 flex-1`}>Informasi Pribadi</Text>
              <MaterialIcons name="chevron-right" size={24} color="#44474e" />
            </TouchableOpacity>

            <TouchableOpacity style={tw`flex-row items-center p-4 border-b border-gray-100`}>
              <View style={tw`w-10 h-10 rounded-full bg-[#031636]/5 items-center justify-center`}>
                <MaterialIcons name="child-care" size={20} color="#031636" />
              </View>
              <Text style={tw`text-base font-semibold text-[#191c1e] ml-4 flex-1`}>Kelola Profil Anak</Text>
              <MaterialIcons name="chevron-right" size={24} color="#44474e" />
            </TouchableOpacity>

            <TouchableOpacity style={tw`flex-row items-center p-4 border-b border-gray-100`}>
              <View style={tw`w-10 h-10 rounded-full bg-[#031636]/5 items-center justify-center`}>
                <MaterialIcons name="medical-services" size={20} color="#031636" />
              </View>
              <Text style={tw`text-base font-semibold text-[#191c1e] ml-4 flex-1`}>Faskes Terdaftar</Text>
              <MaterialIcons name="chevron-right" size={24} color="#44474e" />
            </TouchableOpacity>

          </View>
        </View>

        {/* App Section */}
        <View style={tw`flex-col gap-2 mt-2`}>
          <Text style={tw`text-sm font-bold text-[#44474e] uppercase tracking-wider ml-2`}>Lainnya</Text>
          <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}>
            
            <TouchableOpacity style={tw`flex-row items-center p-4 border-b border-gray-100`}>
              <View style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center`}>
                <MaterialIcons name="help-outline" size={20} color="#44474e" />
              </View>
              <Text style={tw`text-base font-semibold text-[#191c1e] ml-4 flex-1`}>Bantuan & FAQ</Text>
              <MaterialIcons name="chevron-right" size={24} color="#44474e" />
            </TouchableOpacity>

            <TouchableOpacity style={tw`flex-row items-center p-4 border-b border-gray-100`}>
              <View style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center`}>
                <MaterialIcons name="info-outline" size={20} color="#44474e" />
              </View>
              <Text style={tw`text-base font-semibold text-[#191c1e] ml-4 flex-1`}>Tentang Aplikasi</Text>
              <MaterialIcons name="chevron-right" size={24} color="#44474e" />
            </TouchableOpacity>

          </View>
        </View>

        <TouchableOpacity 
          style={tw`mt-4 bg-red-100 py-4 rounded-xl flex-row items-center justify-center shadow-sm`}
          onPress={() => router.replace('/')}
        >
          <MaterialIcons name="logout" size={20} color="#ba1a1a" />
          <Text style={tw`ml-2 text-base font-bold text-[#ba1a1a]`}>Keluar</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
