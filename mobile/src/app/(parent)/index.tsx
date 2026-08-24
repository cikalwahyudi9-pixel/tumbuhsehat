import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator, Alert } from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, limit, doc, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore';

export default function ParentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteChild = async (childId: string, childName: string) => {
    const performDelete = async () => {
      try {
        // 1. Delete child doc
        await deleteDoc(doc(db, 'children', childId));
        
        // 2. Delete associated measurements
        const q = query(collection(db, 'measurements'), where('childId', '==', childId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
        
        if (Platform.OS === 'web') {
          window.alert("Data anak telah dihapus.");
        } else {
          Alert.alert("Berhasil", "Data anak telah dihapus.");
        }
      } catch (error) {
        console.error("Error deleting child:", error);
        if (Platform.OS === 'web') {
          window.alert("Gagal menghapus data anak.");
        } else {
          Alert.alert("Error", "Gagal menghapus data anak.");
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus profil ${childName}? Semua riwayat pengukurannya juga akan dihapus.`);
      if (confirmDelete) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Hapus Data Anak",
        `Apakah Anda yakin ingin menghapus profil ${childName}? Semua riwayat pengukurannya juga akan dihapus.`,
        [
          { text: "Batal", style: "cancel" },
          { 
            text: "Hapus", 
            style: "destructive",
            onPress: performDelete
          }
        ]
      );
    }
  };
  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const qChildren = query(collection(db, 'children'), where('parentId', '==', user.uid));
    const unsubscribeChildren = onSnapshot(qChildren, (childSnapshot) => {
      const childrenData = childSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      childrenData.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setChildrenList(childrenData);
    });

    const qMeasurements = query(
      collection(db, 'measurements'),
      where('parentId', '==', user.uid),
      limit(5)
    );
    const unsubscribeMeasurements = onSnapshot(qMeasurements, (measSnapshot) => {
      const measurementsData = measSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      measurementsData.sort((a: any, b: any) => {
        const timeA = a.tanggal ? new Date(a.tanggal).getTime() : 0;
        const timeB = b.tanggal ? new Date(b.tanggal).getTime() : 0;
        return timeB - timeA;
      });
      setMeasurements(measurementsData);
      setLoading(false);
    });

    return () => {
      unsubscribeChildren();
      unsubscribeMeasurements();
    };
  }, [user?.uid]);

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f7f9fb]`}>
      {/* App Bar */}
      <View style={tw`flex-row items-center justify-between px-4 h-16 bg-[#f7f9fb]/90 ${Platform.OS !== 'android' ? 'shadow-sm' : ''}` }>
        <View style={tw`flex-row items-center gap-2`}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8Rg90ui8Pj6JGGUEd0GIk0S1ROtli-m0yE9yKUE8OFEUQ14D0F8eIt0SG2BANYLjRGJRcP0IpdmtFcuvDHqLC9YbR0zvuztVS0W8snDFQlEr4SRItLg_uCicnlXnJjdXL2mEeXutaLYoKdWWJKBjjqqj5nmz5ja4gNoOkGuIwLi_bam6JOBQyYd2MVBUoDweiT_162oOChuW3m28m_77LYXKsQErcvn72owsDhV38ntqgWyl4NQmG' }} 
            style={tw`h-8 w-8`} 
            resizeMode="contain" 
          />
          <Text style={tw`text-lg font-bold text-[#031636]`}>TumbuhSehat</Text>
        </View>
        <View style={tw`flex-row items-center gap-4`}>
          <TouchableOpacity 
            style={tw`relative`}
            onPress={() => router.push('/(parent)/notifikasi')}
          >
            <MaterialIcons name="notifications-none" size={24} color="#44474e" />
            {childrenList.some(c => c.catatanDokter && !c.catatanDokter.read) && (
              <View style={tw`absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-white`} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={tw`w-8 h-8 rounded-full overflow-hidden bg-gray-200`}
            onPress={() => router.push('/(parent)/profil')}
          >
            {Platform.OS === 'web' && user?.photoURL ? (
              <img 
                src={user.photoURL} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <Image 
                source={user?.photoURL ? { uri: user.photoURL } : require('../../../assets/images/avatar_placeholder.png')}
                style={tw`w-full h-full bg-[#031636]/10`}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={tw`pb-32 px-4`}>
        {/* Welcome Section */}
        <View style={tw`mt-6 mb-6`}>
          <Text style={tw`text-2xl font-bold text-[#191c1e] mb-1`}>Halo, {user?.displayName || 'Orang Tua'}</Text>
          <Text style={tw`text-sm text-[#44474e]`}>Mari pantau tumbuh kembang si kecil hari ini.</Text>
        </View>

        {/* Action Grid */}
        <View style={tw`flex-row gap-3 w-full mb-8`}>
          {/* Main Action (Add Measurement) */}
          <TouchableOpacity 
            style={tw`flex-1 h-32 bg-[#031636] rounded-3xl p-5 justify-between shadow-md`}
            onPress={() => router.push('/(parent)/tambah-pengukuran')}
          >
            <View style={tw`w-10 h-10 bg-white/20 rounded-full items-center justify-center`}>
              <MaterialIcons name="add" size={24} color="white" />
            </View>
            <Text style={tw`text-base font-bold text-white`}>Tambah{'\n'}Pengukuran</Text>
          </TouchableOpacity>

          <View style={tw`flex-1 flex-col gap-3`}>
            {/* Secondary Action 1 */}
            <TouchableOpacity 
              style={tw`flex-1 bg-[#d8e2ff] rounded-2xl p-4 flex-row items-center gap-3 shadow-sm`}
              onPress={() => router.push('/(parent)/grafik')}
            >
              <View style={tw`w-8 h-8 bg-white/50 rounded-full items-center justify-center`}>
                <MaterialIcons name="show-chart" size={18} color="#031636" />
              </View>
              <Text style={tw`text-sm font-bold text-[#031636]`}>Lihat Grafik</Text>
            </TouchableOpacity>

            {/* Secondary Action 2 */}
            <TouchableOpacity style={tw`flex-1 bg-white border border-gray-200 rounded-2xl p-4 flex-row items-center gap-3 shadow-sm`}>
              <View style={tw`w-8 h-8 bg-[#031636]/5 rounded-full items-center justify-center`}>
                <MaterialIcons name="tips-and-updates" size={18} color="#031636" />
              </View>
              <Text style={tw`text-sm font-semibold text-[#191c1e]`}>Tips Gizi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Children List Header */}
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text style={tw`text-lg font-bold text-[#191c1e]`}>Anak Anda</Text>
          <TouchableOpacity 
            style={tw`bg-[#f7f9fb] px-3 py-1.5 rounded-full flex-row items-center gap-1 border border-gray-200`}
            onPress={() => router.push('/(parent)/tambah-anak')}
          >
            <MaterialIcons name="person-add" size={16} color="#031636" />
            <Text style={tw`text-xs font-bold text-[#031636]`}>Tambah</Text>
          </TouchableOpacity>
        </View>

        {/* Child Cards */}
        {loading ? (
          <ActivityIndicator size="small" color="#031636" style={tw`mb-6`} />
        ) : childrenList.length > 0 ? (
          childrenList.map((child, index) => (
            <View 
              key={child.id}
              style={tw`bg-white rounded-[24px] shadow-sm border border-gray-100 flex-row items-center overflow-hidden w-full relative mb-4`}
            >
              <View style={tw`absolute -right-8 -top-8 w-32 h-32 ${child.jenisKelamin === 'Perempuan' ? 'bg-pink-100' : 'bg-[#d8e2ff]'} rounded-full opacity-30`} />
              
              {/* Main Card Area (Clickable) */}
              <TouchableOpacity 
                style={tw`flex-1 flex-row items-center p-5`}
                onPress={() => router.push({
                  pathname: '/(parent)/grafik',
                  params: { childId: child.id, childName: child.nama, childGender: child.jenisKelamin }
                })}
              >
                <View style={tw`w-16 h-16 rounded-full border-2 border-white shadow-sm z-10 bg-gray-100 items-center justify-center`}>
                  <MaterialIcons name={child.jenisKelamin === 'Perempuan' ? 'face-3' : 'face-6'} size={32} color="#44474e" />
                </View>
                
                <View style={tw`ml-4 flex-1 z-10`}>
                  <Text style={tw`text-lg font-bold text-[#031636] mb-1`}>{child.nama}</Text>
                  <View style={tw`flex-row flex-wrap gap-2`}>
                    <View style={tw`bg-[#031636]/5 px-2.5 py-1 rounded-md`}>
                      <Text style={tw`text-[11px] font-semibold text-[#031636]`}>{child.jenisKelamin}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Action Buttons (Right Side) */}
              <View style={tw`flex-row items-center pr-5 z-10`}>
                <TouchableOpacity 
                  onPress={() => handleDeleteChild(child.id, child.nama)}
                  style={tw`p-2 mr-1`}
                >
                  <MaterialIcons name="delete-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
                <MaterialIcons name="chevron-right" size={24} color="#031636" />
              </View>
            </View>
          ))
        ) : (
          <View style={tw`bg-white rounded-2xl p-6 border border-dashed border-gray-300 items-center mb-6`}>
            <MaterialIcons name="child-care" size={32} color="#9ca3af" />
            <Text style={tw`text-sm font-semibold text-[#44474e] mt-2`}>Belum ada profil anak</Text>
            <Text style={tw`text-xs text-center text-gray-400 mt-1 mb-3`}>Tambahkan profil anak Anda untuk mulai memantau pertumbuhannya.</Text>
            <TouchableOpacity 
              style={tw`bg-[#031636] px-4 py-2 rounded-full flex-row items-center`}
              onPress={() => router.push('/(parent)/tambah-anak')}
            >
              <Text style={tw`text-white font-bold text-xs`}>Tambah Anak Sekarang</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Measurements Activity */}
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text style={tw`text-lg font-bold text-[#191c1e]`}>Riwayat Pengukuran Terakhir</Text>
          <TouchableOpacity onPress={() => router.push('/(parent)/riwayat')}>
            <Text style={tw`text-sm font-semibold text-[#031636]`}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        <View style={tw`bg-white rounded-[24px] p-2 shadow-sm border border-gray-100`}>
          {loading ? (
            <Text style={tw`text-center p-4 text-[#44474e]`}>Memuat data...</Text>
          ) : measurements.length > 0 ? (
            measurements.map((item, index) => (
              <View key={item.id} style={tw`flex-row items-center p-3 ${index !== measurements.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <View style={tw`w-12 h-12 bg-[#031636]/5 rounded-2xl items-center justify-center`}>
                  <MaterialIcons name="monitor-weight" size={20} color="#031636" />
                </View>
                <View style={tw`flex-1 ml-4`}>
                  <Text style={tw`text-base font-bold text-[#191c1e]`}>{item.berat} kg • {item.tinggi} cm</Text>
                  <Text style={tw`text-xs text-[#44474e] mt-0.5`}>{(childrenList.find((c: any) => c.id === item.childId)?.nama || 'Anak')} • {new Date(item.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</Text>
                </View>
                <View style={tw`bg-[#10b981]/10 px-3 py-1 rounded-full`}>
                  <Text style={tw`text-[10px] font-bold text-[#10b981]`}>Baru</Text>
                </View>
              </View>
            ))
          ) : (
             <Text style={tw`text-center p-4 text-[#44474e]`}>Belum ada riwayat pengukuran.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
