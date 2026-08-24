import React, { useState, createElement } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TambahAnakScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [nama, setNama] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());
  
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan' | null>(null);
  const [loading, setLoading] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateObj(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setTanggalLahir(`${year}-${month}-${day}`);
    }
  };

  const handleSimpan = async () => {
    if (!nama || !jenisKelamin || !tanggalLahir) {
      Alert.alert('Perhatian', 'Nama, Tanggal Lahir, dan Jenis Kelamin wajib diisi!');
      return;
    }
    
    // Basic date validation YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(tanggalLahir)) {
      Alert.alert('Perhatian', 'Format tanggal lahir harus YYYY-MM-DD (Misal: 2023-08-15)');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'Anda harus login terlebih dahulu!');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'children'), {
        parentId: user.uid,
        nama: nama,
        tanggalLahir: tanggalLahir,
        jenisKelamin: jenisKelamin,
        createdAt: new Date().toISOString()
      });
      
      Alert.alert('Berhasil', 'Data anak berhasil ditambahkan!');
      router.back();
    } catch (error: any) {
      console.error("Error adding child: ", error);
      Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan data anak.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f7f9fb]`}>
      {/* Header */}
      <View style={tw`flex-row items-center px-4 h-16 bg-[#f7f9fb]/90 ${Platform.OS !== 'android' ? 'shadow-sm' : ''}` }>
        <TouchableOpacity onPress={() => router.back()} style={tw`w-10 h-10 items-center justify-center -ml-2 mr-2`}>
          <MaterialIcons name="arrow-back" size={24} color="#44474e" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-[#031636]`}>Tambah Anak</Text>
      </View>

      <ScrollView contentContainerStyle={tw`pb-32 flex-col`}>
        <View style={tw`px-4 pt-4 pb-2`}>
          <Text style={tw`text-2xl font-bold text-[#191c1e]`}>Profil Anak Baru</Text>
          <Text style={tw`text-sm text-[#44474e] mt-1`}>Masukkan data anak Anda untuk mulai memantau tumbuh kembangnya.</Text>
        </View>

        {/* Main Inputs */}
        <View style={tw`px-4 flex-col gap-6 mt-6`}>
          {/* Nama Anak Input */}
          <View style={tw`flex-col`}>
            <Text style={tw`text-sm font-semibold text-[#191c1e] mb-2`}>Nama Lengkap Anak</Text>
            <View style={tw`flex-row items-center h-16 bg-white rounded-xl border border-gray-200 px-4 shadow-sm`}>
              <MaterialIcons name="person" size={20} color="#44474e" />
              <TextInput 
                style={tw`flex-1 h-full text-base text-[#191c1e] px-4`}
                placeholder="Misal: Andi Pratama"
                value={nama}
                onChangeText={setNama}
              />
            </View>
          </View>

          {/* Tanggal Lahir Input */}
          <View style={tw`flex-col`}>
            <Text style={tw`text-sm font-semibold text-[#191c1e] mb-2`}>Tanggal Lahir</Text>
            
            {Platform.OS === 'web' ? (
              <View style={tw`flex-row items-center h-16 bg-white rounded-xl border border-gray-200 px-4 shadow-sm`}>
                {createElement('input', {
                  type: 'date',
                  value: tanggalLahir,
                  onChange: (e: any) => setTanggalLahir(e.target.value),
                  onClick: (e: any) => {
                    try {
                      e.target.showPicker();
                    } catch (err) {
                      // fallback for older browsers that don't support showPicker
                    }
                  },
                  style: { flex: 1, height: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: '#191c1e', cursor: 'pointer' }
                })}
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                style={tw`flex-row items-center h-16 bg-white rounded-xl border border-gray-200 px-4 shadow-sm`}
              >
                <MaterialIcons name="calendar-today" size={20} color="#44474e" />
                <Text style={tw`flex-1 text-base px-4 ${tanggalLahir ? 'text-[#191c1e]' : 'text-gray-400'}`}>
                  {tanggalLahir || 'Pilih Tanggal Lahir'}
                </Text>
              </TouchableOpacity>
            )}

            {showDatePicker && Platform.OS !== 'web' && (
              <DateTimePicker
                testID="dateTimePicker"
                value={dateObj}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={onChangeDate}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Jenis Kelamin Input */}
          <View style={tw`flex-col`}>
            <Text style={tw`text-sm font-semibold text-[#191c1e] mb-2`}>Jenis Kelamin</Text>
            <View style={tw`flex-row gap-4`}>
              <TouchableOpacity 
                style={tw`flex-1 h-16 rounded-xl flex-row items-center justify-center gap-2 border shadow-sm ${jenisKelamin === 'Laki-laki' ? 'bg-[#d8e2ff] border-[#031636]' : 'bg-white border-gray-200'}`}
                onPress={() => setJenisKelamin('Laki-laki')}
              >
                <MaterialIcons name="male" size={24} color={jenisKelamin === 'Laki-laki' ? '#031636' : '#44474e'} />
                <Text style={tw`font-bold ${jenisKelamin === 'Laki-laki' ? 'text-[#031636]' : 'text-[#44474e]'}`}>Laki-laki</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={tw`flex-1 h-16 rounded-xl flex-row items-center justify-center gap-2 border shadow-sm ${jenisKelamin === 'Perempuan' ? 'bg-pink-100 border-pink-700' : 'bg-white border-gray-200'}`}
                onPress={() => setJenisKelamin('Perempuan')}
              >
                <MaterialIcons name="female" size={24} color={jenisKelamin === 'Perempuan' ? '#be185d' : '#44474e'} />
                <Text style={tw`font-bold ${jenisKelamin === 'Perempuan' ? 'text-pink-700' : 'text-[#44474e]'}`}>Perempuan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={tw`absolute bottom-0 w-full px-4 pb-8 pt-4 bg-[#f7f9fb]/90 shadow-lg border-t border-gray-200`}>
        <TouchableOpacity 
          onPress={handleSimpan}
          disabled={loading}
          style={tw`w-full h-14 bg-[#10b981] rounded-xl flex-row items-center justify-center gap-2 shadow-sm ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={tw`text-white font-bold text-base`}>Simpan Profil Anak</Text>
              <MaterialIcons name="check-circle" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
