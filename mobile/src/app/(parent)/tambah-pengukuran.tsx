import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export default function TambahPengukuranScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  
  const [berat, setBerat] = useState('');
  const [tinggi, setTinggi] = useState('');
  const [lingkarKepala, setLingkarKepala] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingChildren, setFetchingChildren] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchChildren = async () => {
        if (!user) {
          setFetchingChildren(false);
          return;
        }
        
        try {
          const qChildren = query(
            collection(db, 'children'),
            where('parentId', '==', user.uid)
          );
          const childSnapshot = await getDocs(qChildren);
          const childData = childSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          childData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setChildren(childData);
          if (childData.length > 0) {
            setSelectedChildId(childData[0].id);
          }
        } catch (error) {
          console.error("Error fetching children:", error);
        } finally {
          setFetchingChildren(false);
        }
      };
      
      fetchChildren();
    }, [user?.uid])
  );

  const handleSimpan = async () => {
    if (!selectedChildId) {
      Alert.alert('Perhatian', 'Silakan pilih anak terlebih dahulu, atau tambahkan data anak jika belum ada.');
      return;
    }

    if (!berat || !tinggi) {
      Alert.alert('Error', 'Berat dan Tinggi badan wajib diisi!');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'Anda harus login terlebih dahulu!');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'measurements'), {
        parentId: user.uid,
        childId: selectedChildId,
        tanggal: new Date().toISOString(),
        berat: parseFloat(berat),
        tinggi: parseFloat(tinggi),
        lingkarKepala: lingkarKepala ? parseFloat(lingkarKepala) : null,
        createdAt: new Date().toISOString()
      });
      
      Alert.alert('Berhasil', 'Data pengukuran berhasil disimpan!');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(parent)');
      }
    } catch (error: any) {
      console.error("Error adding document: ", error);
      Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f7f9fb]`}>
      {/* Header */}
      <View style={tw`flex-row items-center px-4 h-16 bg-[#f7f9fb]/90 ${Platform.OS !== 'android' ? 'shadow-sm' : ''}` }>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(parent)')} style={tw`w-10 h-10 items-center justify-center -ml-2 mr-2`}>
          <MaterialIcons name="arrow-back" size={24} color="#44474e" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-[#031636]`}>Tambah Pengukuran</Text>
      </View>

      <ScrollView contentContainerStyle={tw`pb-32 flex-col`}>
        {/* Date Picker (Horizontal Scroll) */}
        <View style={tw`mt-4 mb-4`}>
          <View style={tw`px-4 mb-2`}>
            <Text style={tw`text-sm font-semibold text-[#191c1e]`}>Tanggal Pengukuran</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`px-4 gap-2`}>
            {/* Selected Date */}
            <TouchableOpacity style={tw`w-[72px] h-[88px] rounded-xl bg-[#031636] flex-col items-center justify-center shadow-sm`}>
              <Text style={tw`text-xs font-medium text-white/80 mb-1`}>Hari Ini</Text>
              <Text style={tw`text-2xl font-bold text-white mb-1`}>{new Date().getDate()}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Child Picker */}
        <View style={tw`px-4 flex-col gap-2 mt-2`}>
          <Text style={tw`text-sm font-semibold text-[#191c1e]`}>Pilih Anak</Text>
          {fetchingChildren ? (
            <ActivityIndicator size="small" color="#031636" style={tw`self-start`} />
          ) : children.length === 0 ? (
            <View style={tw`bg-amber-50 p-4 rounded-xl border border-amber-200`}>
              <Text style={tw`text-sm text-amber-800`}>Belum ada profil anak. Silakan tambah anak terlebih dahulu di Dashboard.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-3 py-1`}>
              {children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  onPress={() => setSelectedChildId(child.id)}
                  style={tw`flex-row items-center gap-2 px-4 py-3 rounded-full border shadow-sm ${selectedChildId === child.id ? 'bg-[#d8e2ff] border-[#031636]' : 'bg-white border-gray-200'}`}
                >
                  <MaterialIcons name={child.jenisKelamin === 'Perempuan' ? 'face-3' : 'face-6'} size={20} color={selectedChildId === child.id ? '#031636' : '#44474e'} />
                  <Text style={tw`font-bold text-sm ${selectedChildId === child.id ? 'text-[#031636]' : 'text-[#44474e]'}`}>{child.nama}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Main Inputs */}
        <View style={tw`px-4 flex-col gap-6 mt-6`}>
          {/* Berat Badan Input */}
          <View style={tw`flex-col`}>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-sm font-semibold text-[#191c1e]`}>Berat Badan</Text>
            </View>
            <View style={tw`flex-row items-center h-20 bg-white rounded-xl border border-gray-200 pl-4 overflow-hidden shadow-sm`}>
              <MaterialIcons name="monitor-weight" size={24} color="#031636" />
              <TextInput 
                style={tw`flex-1 h-full text-2xl text-[#191c1e] px-4 min-w-0`}
                placeholder="00.0"
                keyboardType="decimal-pad"
                value={berat}
                onChangeText={setBerat}
              />
              <View style={tw`h-full justify-center border-l border-gray-200 px-6 items-center bg-[#f7f9fb]`}>
                <Text style={tw`text-sm font-semibold text-[#191c1e]`}>kg</Text>
              </View>
            </View>
          </View>

          {/* Tinggi Badan Input */}
          <View style={tw`flex-col`}>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-sm font-semibold text-[#191c1e]`}>Tinggi Badan</Text>
            </View>
            <View style={tw`flex-row items-center h-20 bg-white rounded-xl border border-gray-200 pl-4 overflow-hidden shadow-sm`}>
              <MaterialIcons name="height" size={24} color="#031636" />
              <TextInput 
                style={tw`flex-1 h-full text-2xl text-[#191c1e] px-4 min-w-0`}
                placeholder="000"
                keyboardType="decimal-pad"
                value={tinggi}
                onChangeText={setTinggi}
              />
              <View style={tw`h-full justify-center border-l border-gray-200 px-6 items-center bg-[#f7f9fb]`}>
                <Text style={tw`text-sm font-semibold text-[#191c1e]`}>cm</Text>
              </View>
            </View>
          </View>

          {/* Lingkar Kepala Input */}
          <View style={tw`flex-col`}>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-sm font-semibold text-[#191c1e]`}>Lingkar Kepala <Text style={tw`font-normal text-[#44474e]`}> (Opsional)</Text></Text>
            </View>
            <View style={tw`flex-row items-center h-16 bg-white rounded-xl border border-gray-200 pl-4 overflow-hidden shadow-sm`}>
              <MaterialIcons name="face" size={20} color="#44474e" />
              <TextInput 
                style={tw`flex-1 h-full text-xl text-[#191c1e] px-4 min-w-0`}
                placeholder="--.-"
                keyboardType="decimal-pad"
                value={lingkarKepala}
                onChangeText={setLingkarKepala}
              />
              <View style={tw`h-full justify-center border-l border-gray-200 px-6 items-center bg-[#f7f9fb]`}>
                <Text style={tw`text-sm font-semibold text-[#44474e]`}>cm</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={tw`absolute bottom-0 w-full px-4 pb-8 pt-4 bg-[#f7f9fb]/90 shadow-lg border-t border-gray-200`}>
        <TouchableOpacity 
          onPress={handleSimpan}
          disabled={loading || !selectedChildId}
          style={tw`w-full h-14 bg-[#10b981] rounded-xl flex-row items-center justify-center gap-2 shadow-sm ${(loading || !selectedChildId) ? 'opacity-70' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={tw`text-white font-bold text-base`}>Simpan Pengukuran</Text>
              <MaterialIcons name="check-circle" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
