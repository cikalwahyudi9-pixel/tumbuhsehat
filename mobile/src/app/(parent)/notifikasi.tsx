import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function NotifikasiScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'children'), where('parentId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.catatanDokter) {
          notifs.push({
            childId: docSnap.id,
            childName: data.nama || 'Anak',
            ...data.catatanDokter
          });
        }
      });
      
      // Sort by timestamp desc
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (childId: string) => {
    try {
      await updateDoc(doc(db, 'children', childId), {
        'catatanDokter.read': true
      });
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'darurat': return { bg: 'bg-[#dc2626]/10', border: 'border-[#dc2626]', text: 'text-[#dc2626]', icon: 'error' };
      case 'waspada': return { bg: 'bg-[#f59e0b]/10', border: 'border-[#f59e0b]', text: 'text-[#f59e0b]', icon: 'warning' };
      default: return { bg: 'bg-[#10b981]/10', border: 'border-[#10b981]', text: 'text-[#10b981]', icon: 'info' };
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f7f9fb]`}>
      {/* Header */}
      <View style={tw`flex-row items-center px-4 h-16 bg-[#f7f9fb]/90 ${Platform.OS !== 'android' ? 'shadow-sm' : ''}` }>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(parent)')} style={tw`w-10 h-10 items-center justify-center -ml-2 mr-2`}>
          <MaterialIcons name="arrow-back" size={24} color="#44474e" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-[#031636]`}>Notifikasi Dokter</Text>
      </View>

      <ScrollView contentContainerStyle={tw`pb-10 pt-4 px-4 gap-4`}>
        {loading ? (
          <ActivityIndicator size="large" color="#031636" style={tw`mt-10`} />
        ) : notifications.length === 0 ? (
          <View style={tw`items-center justify-center mt-20`}>
            <View style={tw`w-16 h-16 rounded-full bg-gray-200 items-center justify-center mb-4`}>
              <MaterialIcons name="notifications-none" size={32} color="#8c949f" />
            </View>
            <Text style={tw`text-base font-semibold text-[#191c1e]`}>Belum Ada Pesan</Text>
            <Text style={tw`text-sm text-[#44474e] text-center mt-2`}>Catatan medis dan rekomendasi dari dokter akan muncul di sini.</Text>
          </View>
        ) : (
          notifications.map((notif, index) => {
            const style = getStatusStyle(notif.status);
            return (
              <TouchableOpacity 
                key={index} 
                style={tw`bg-white rounded-2xl shadow-sm border ${!notif.read ? style.border : 'border-gray-100'} p-4 flex-col gap-3 relative overflow-hidden`}
                onPress={() => markAsRead(notif.childId)}
              >
                {!notif.read && <View style={tw`absolute top-0 left-0 w-1 h-full bg-[#ef4444]`} />}
                
                <View style={tw`flex-row justify-between items-start`}>
                  <View style={tw`flex-row items-center gap-2`}>
                    <View style={tw`w-8 h-8 rounded-full ${style.bg} items-center justify-center`}>
                      <MaterialIcons name={style.icon as any} size={16} style={tw`${style.text}`} />
                    </View>
                    <View>
                      <Text style={tw`text-sm font-bold text-[#191c1e]`}>Pesan untuk {notif.childName}</Text>
                      <Text style={tw`text-[10px] text-[#8c949f]`}>{formatTime(notif.timestamp)}</Text>
                    </View>
                  </View>
                  {!notif.read && (
                    <View style={tw`bg-red-100 px-2 py-0.5 rounded`}>
                      <Text style={tw`text-[10px] font-bold text-red-700`}>Baru</Text>
                    </View>
                  )}
                </View>

                <View style={tw`bg-[#f7f9fb] p-3 rounded-xl border border-gray-100`}>
                  <Text style={tw`text-sm text-[#191c1e] leading-5`}>{notif.pesan}</Text>
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
