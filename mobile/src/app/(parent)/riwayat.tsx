import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function RiwayatScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams();
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [childrenDict, setChildrenDict] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!user) {
          setLoading(false);
          return;
        }
        
        setLoading(true);
        try {
          const constraints: any[] = [where('parentId', '==', user.uid)];
          
          if (childId) {
            constraints.push(where('childId', '==', childId));
          }
          
          const q = query(collection(db, 'measurements'), ...constraints);
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          data.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
          
          setMeasurements(data);

          // Fetch children names to display
          const childrenQ = query(collection(db, 'children'), where('parentId', '==', user.uid));
          const childrenSnap = await getDocs(childrenQ);
          const dict: Record<string, string> = {};
          childrenSnap.forEach(d => {
            dict[d.id] = d.data().nama;
          });
          setChildrenDict(dict);

        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }, [user?.uid, childId])
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f7f9fb]`}>
      {/* Header */}
      <View style={tw`flex-row items-center px-4 h-16 bg-[#f7f9fb]/90 ${Platform.OS !== 'android' ? 'shadow-sm' : ''}` }>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(parent)')} style={tw`mr-3`}>
          <MaterialIcons name="arrow-back" size={24} color="#031636" />
        </TouchableOpacity>
        <Text style={tw`text-xl font-bold text-[#031636]`}>Riwayat</Text>
      </View>

      <ScrollView contentContainerStyle={tw`pb-32 px-4 gap-6 pt-4`}>
        
        {/* Date Filter */}
        <View style={tw`flex-row justify-between items-center`}>
          <Text style={tw`text-lg font-bold text-[#191c1e]`}>Semua Riwayat</Text>
          <TouchableOpacity style={tw`bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 flex-row items-center gap-1`}>
            <MaterialIcons name="filter-list" size={16} color="#031636" />
            <Text style={tw`text-xs font-semibold text-[#031636]`}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Timeline */}
        <View style={tw`flex-col gap-4`}>
          {loading ? (
            <ActivityIndicator size="large" color="#031636" style={tw`mt-10`} />
          ) : measurements.length === 0 ? (
            <Text style={tw`text-center mt-10 text-[#44474e]`}>Belum ada riwayat pengukuran.</Text>
          ) : (
            measurements.map((item, index) => {
              const date = new Date(item.tanggal);
              const formattedDate = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
              const isFirst = index === 0;

              return (
                <View key={item.id} style={tw`relative pl-6 pb-4`}>
                  {/* Timeline vertical line */}
                  {index !== measurements.length - 1 && (
                    <View style={tw`absolute left-[9px] top-6 bottom-0 w-[2px] bg-gray-200`} />
                  )}
                  {/* Timeline dot */}
                  <View style={tw`absolute left-0 top-2 w-[20px] h-[20px] ${isFirst ? 'bg-[#d8e2ff]' : 'bg-gray-300'} rounded-full flex items-center justify-center border-4 border-[#f7f9fb]`}>
                    {isFirst && <View style={tw`w-2 h-2 bg-[#031636] rounded-full`} />}
                  </View>
                  
                  {/* Content Card */}
                  <View style={tw`bg-white rounded-xl p-4 shadow-sm flex-col gap-3 border border-gray-100 ${!isFirst ? 'opacity-80' : ''}`}>
                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-sm font-semibold text-[#191c1e]`}>
                        {formattedDate} {childrenDict[item.childId] ? `• ${childrenDict[item.childId]}` : ''}
                      </Text>
                      {isFirst && (
                        <View style={tw`bg-[#10b981]/10 px-2 py-0.5 rounded-full`}>
                          <Text style={tw`text-[10px] font-bold text-[#10b981]`}>Terbaru</Text>
                        </View>
                      )}
                    </View>
                    <View style={tw`flex-row items-center justify-between`}>
                      <View style={tw`flex-col flex-1 items-center`}>
                        <Text style={tw`text-xs text-[#44474e]`}>Tinggi</Text>
                        <Text style={tw`text-base font-bold text-[#191c1e]`}>{item.tinggi} cm</Text>
                      </View>
                      <View style={tw`w-[1px] h-full bg-gray-200`} />
                      <View style={tw`flex-col flex-1 items-center`}>
                        <Text style={tw`text-xs text-[#44474e]`}>Berat</Text>
                        <Text style={tw`text-base font-bold text-[#191c1e]`}>{item.berat} kg</Text>
                      </View>
                      {item.lingkarKepala && (
                        <>
                          <View style={tw`w-[1px] h-full bg-gray-200`} />
                          <View style={tw`flex-col flex-1 items-center`}>
                            <Text style={tw`text-xs text-[#44474e]`}>L. Kepala</Text>
                            <Text style={tw`text-base font-bold text-[#191c1e]`}>{item.lingkarKepala} cm</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
