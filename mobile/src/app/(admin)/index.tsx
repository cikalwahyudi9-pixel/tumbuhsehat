import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, TextInput, Platform, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db } from '../../config/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Admin should see ALL children, or children belonging to their clinic.
    // For MVP, we'll fetch all children.
    const q = query(collection(db, 'children'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const childrenData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChildren(childrenData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching children:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredChildren = children.filter(c => 
    (c.nama || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f7f9fb]`}>
      {/* Header */}
      <View style={tw`flex-row items-center px-4 h-16 bg-[#f7f9fb]/90 ${Platform.OS !== 'android' ? 'shadow-sm' : ''}` }>
        <Text style={tw`text-lg font-bold text-[#031636]`}>Admin Dashboard</Text>
        <TouchableOpacity 
          onPress={async () => {
            await logout();
            if (Platform.OS === 'web') {
              window.location.href = '/';
            } else {
              router.replace('/');
            }
          }} 
          style={tw`ml-auto flex-row items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-100`}
        >
          <Text style={tw`text-xs font-bold text-red-600`}>Keluar</Text>
          <MaterialIcons name="logout" size={14} color="#dc2626" />
        </TouchableOpacity>
      </View>

      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        {/* Sticky Search Sub-header */}
        <View style={tw`bg-[#f7f9fb]/95 py-2 px-4 shadow-sm z-40`}>
          <View style={tw`flex-row items-center gap-2`}>
            <View style={tw`relative flex-1 justify-center`}>
              <View style={tw`absolute left-3 z-10`}>
                <MaterialIcons name="search" size={20} color="#44474e" />
              </View>
              <TextInput 
                placeholder="Cari nama pasien..."
                placeholderTextColor="#44474e"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={tw`w-full h-10 pl-10 pr-4 rounded-full bg-[#e0e3e5]/30 text-[#191c1e] text-base`}
              />
            </View>
          </View>
        </View>

        <View style={tw`px-4 pb-12 pt-4 flex-col gap-6`}>
          
          {/* KPI Dashboard Section */}
          <View style={tw`flex-col gap-2`}>
            <Text style={tw`text-lg font-bold text-[#031636]`}>Overview</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`py-2 gap-4`}>
              {/* KPI: Total Anak Bina */}
              <View style={tw`w-[150px] bg-white/60 rounded-2xl shadow-sm p-4 border border-white flex-col gap-2`}>
                <View style={tw`w-10 h-10 rounded-full bg-[#031636]/10 items-center justify-center`}>
                  <MaterialIcons name="groups" size={20} color="#031636" />
                </View>
                <View style={tw`flex-col`}>
                  <Text style={tw`text-xs text-[#44474e]`}>Total Anak Bina</Text>
                  <Text style={tw`text-3xl font-bold text-[#031636] tracking-tight`}>{children.length}</Text>
                </View>
              </View>

              {/* Analytics Shortcut */}
              <TouchableOpacity onPress={() => router.push('/(admin)/analitik')} style={tw`w-[150px] bg-[#031636] rounded-2xl shadow-sm p-4 flex-col gap-2`}>
                <View style={tw`w-10 h-10 rounded-full bg-white/20 items-center justify-center`}>
                  <MaterialIcons name="analytics" size={20} color="white" />
                </View>
                <View style={tw`flex-col mt-auto`}>
                  <Text style={tw`text-xs text-white/80`}>Statistik Agregat</Text>
                  <Text style={tw`text-base font-bold text-white leading-tight`}>Lihat Tren Regional</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* List Section */}
          <View style={tw`flex-col gap-4`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-lg font-bold text-[#031636]`}>Daftar Pasien Terbaru</Text>
              <Text style={tw`text-sm text-[#44474e]`}>{filteredChildren.length} pasien</Text>
            </View>

            <View style={tw`bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100`}>
              {loading ? (
                <View style={tw`p-8 items-center justify-center`}>
                  <ActivityIndicator size="large" color="#031636" />
                </View>
              ) : filteredChildren.length === 0 ? (
                <View style={tw`p-8 items-center justify-center`}>
                  <Text style={tw`text-[#44474e]`}>Belum ada pasien yang terdaftar.</Text>
                </View>
              ) : (
                filteredChildren.map((child) => (
                  <TouchableOpacity 
                    key={child.id}
                    style={tw`flex-row items-center p-4 border-b border-gray-100`} 
                    onPress={() => router.push({ pathname: '/(admin)/detail-pasien', params: { childId: child.id } })}
                  >
                    <View style={tw`w-12 h-12 rounded-full bg-gray-100 items-center justify-center overflow-hidden`}>
                      <MaterialIcons name={child.jenisKelamin === 'Perempuan' ? 'face-3' : 'face-6'} size={32} color="#44474e" />
                    </View>
                    
                    <View style={tw`flex-1 justify-center ml-3`}>
                      <Text style={tw`text-base font-semibold text-[#191c1e]`}>{child.nama || 'Tanpa Nama'}</Text>
                      <View style={tw`flex-row items-center mt-0.5`}>
                        <MaterialIcons name="calendar-today" size={14} color="#44474e" />
                        <Text style={tw`text-xs text-[#44474e] ml-1`}>
                          {child.tanggalLahir ? new Date(child.tanggalLahir).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : 'Tidak ada tgl lahir'}
                        </Text>
                      </View>
                    </View>
                    <View style={tw`px-3 py-1 rounded-full bg-[#031636]/10`}>
                      <Text style={tw`text-xs font-semibold text-[#031636]`}>Lihat Rekam</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
