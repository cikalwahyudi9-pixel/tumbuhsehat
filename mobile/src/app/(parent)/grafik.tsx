import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

export default function GrafikScreen() {
  const router = useRouter();
  const { childId: initialChildId } = useLocalSearchParams();
  const { user } = useAuth();

  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    (initialChildId as string) || null
  );
  const [children, setChildren] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [activeChart, setActiveChart] = useState<'tinggi' | 'berat' | 'lingkarKepala'>('tinggi');

  const [loading, setLoading] = useState(true);
  const [fetchingChildren, setFetchingChildren] = useState(true);

  // 1. Real-time Listener untuk Daftar Anak
  React.useEffect(() => {
    if (!user) {
      setFetchingChildren(false);
      return;
    }

    const qChildren = query(
      collection(db, 'children'),
      where('parentId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(qChildren, (snapshot) => {
      const childData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      childData.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setChildren(childData);

      setSelectedChildId(prev => {
        if (!prev && childData.length > 0) return childData[0].id;
        if (prev && !childData.find(c => c.id === prev) && childData.length > 0) return childData[0].id;
        return prev;
      });

      setFetchingChildren(false);
    }, (error) => {
      console.error("Error listening to children:", error);
      setFetchingChildren(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // 2. Real-time Listener untuk Pengukuran
  React.useEffect(() => {
    if (!user || !selectedChildId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'measurements'),
      where('parentId', '==', user.uid),
      where('childId', '==', selectedChildId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const timeA = a.tanggal ? new Date(a.tanggal).getTime() : 0;
        const timeB = b.tanggal ? new Date(b.tanggal).getTime() : 0;
        return timeB - timeA; // Descending (newest first for history list)
      });
      setMeasurements(data);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to measurements:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, selectedChildId]);

  // Ambil detail anak yang sedang terpilih untuk ditampilkan
  const selectedChild = children.find(c => c.id === selectedChildId);
  const displayChildName = selectedChild?.nama || 'Anak Anda';
  const displayChildGender = selectedChild?.jenisKelamin || '-';

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f7f9fb]`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 h-16 bg-[#f7f9fb]/90 ${Platform.OS !== 'android' ? 'shadow-sm' : ''}`}>
        <View style={tw`flex-row items-center gap-2`}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(parent)')} style={tw`mr-2`}>
            <MaterialIcons name="arrow-back" size={24} color="#031636" />
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8Rg90ui8Pj6JGGUEd0GIk0S1ROtli-m0yE9yKUE8OFEUQ14D0F8eIt0SG2BANYLjRGJRcP0IpdmtFcuvDHqLC9YbR0zvuztVS0W8snDFQlEr4SRItLg_uCicnlXnJjdXL2mEeXutaLYoKdWWJKBjjqqj5nmz5ja4gNoOkGuIwLi_bam6JOBQyYd2MVBUoDweiT_162oOChuW3m28m_77LYXKsQErcvn72owsDhV38ntqgWyl4NQmG' }}
            style={tw`h-8 w-8`}
            resizeMode="contain"
          />
          <Text style={tw`text-lg font-bold text-[#031636]`}>Grafik</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={tw`pb-32 px-4 gap-6`}>
        {/* Profile Hero Card */}
        <View style={tw`bg-white rounded-3xl p-6 mt-4 shadow-sm flex-row items-center justify-between overflow-hidden border border-gray-100`}>
          <View style={tw`flex-col gap-1 z-10`}>
            <Text style={tw`text-xs uppercase tracking-widest text-[#44474e]`}>Pasien</Text>
            <Text style={tw`text-2xl font-bold text-[#031636]`}>{displayChildName}</Text>
            <View style={tw`flex-row items-center gap-2 mt-1`}>
              <View style={tw`bg-[#031636]/10 px-3 py-1 rounded-full`}>
                <Text style={tw`text-xs font-semibold text-[#031636]`}>{displayChildGender}</Text>
              </View>
            </View>
          </View>
          <View style={tw`w-16 h-16 rounded-full border-2 border-white bg-gray-100 items-center justify-center z-10`}>
            <MaterialIcons name={selectedChild?.jenisKelamin === 'Perempuan' ? 'face-3' : 'face-6'} size={40} color="#44474e" />
          </View>
        </View>

        {/* Child Picker */}
        <View style={tw`flex-col gap-2 mt-[-10px]`}>
          <Text style={tw`text-sm font-semibold text-[#191c1e]`}>Pilih Anak</Text>
          {fetchingChildren ? (
            <ActivityIndicator size="small" color="#031636" style={tw`self-start`} />
          ) : children.length === 0 ? (
            <Text style={tw`text-xs text-amber-700`}>Belum ada profil anak.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-3 py-1`}>
              {children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  onPress={() => setSelectedChildId(child.id)}
                  style={tw`justify-center items-center px-6 py-2.5 rounded-full border shadow-sm ${selectedChildId === child.id ? 'bg-[#031636] border-[#031636]' : 'bg-white border-gray-200'}`}
                >
                  <Text style={tw`font-bold text-sm ${selectedChildId === child.id ? 'text-white' : 'text-[#44474e]'}`}>{child.nama}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Growth Chart Section */}
        <View style={tw`bg-white rounded-3xl p-6 shadow-sm flex-col gap-4 border border-gray-100`}>
          <View style={tw`flex-row justify-between items-center`}>
            <Text style={tw`text-xl font-bold text-[#191c1e]`}>Grafik Pertumbuhan</Text>
          </View>

          {/* Metric Tabs */}
          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              onPress={() => setActiveChart('tinggi')}
              style={tw`px-3 py-1.5 rounded-full border ${activeChart === 'tinggi' ? 'bg-[#031636] border-[#031636]' : 'bg-white border-gray-300'}`}
            >
              <Text style={tw`text-xs font-semibold ${activeChart === 'tinggi' ? 'text-white' : 'text-[#44474e]'}`}>Tinggi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveChart('berat')}
              style={tw`px-3 py-1.5 rounded-full border ${activeChart === 'berat' ? 'bg-[#031636] border-[#031636]' : 'bg-white border-gray-300'}`}
            >
              <Text style={tw`text-xs font-semibold ${activeChart === 'berat' ? 'text-white' : 'text-[#44474e]'}`}>Berat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveChart('lingkarKepala')}
              style={tw`px-3 py-1.5 rounded-full border ${activeChart === 'lingkarKepala' ? 'bg-[#031636] border-[#031636]' : 'bg-white border-gray-300'}`}
            >
              <Text style={tw`text-xs font-semibold ${activeChart === 'lingkarKepala' ? 'text-white' : 'text-[#44474e]'}`}>Lingkar Kepala</Text>
            </TouchableOpacity>
          </View>

          {/* Warning for missing Tanggal Lahir */}
          {selectedChild && !selectedChild.tanggalLahir && (
            <View style={tw`bg-red-50 p-3 rounded-lg border border-red-200 mt-2`}>
              <Text style={tw`text-xs text-red-800`}>
                Profil anak ini tidak memiliki Tanggal Lahir (dibuat sebelum fitur ini ada). Grafik memerlukan Tanggal Lahir untuk menghitung umur.
              </Text>
            </View>
          )}

          {/* Legend */}
          <View style={tw`flex-row gap-4 mb-2`}>
            <View style={tw`flex-row items-center gap-1.5`}>
              <View style={tw`w-3 h-3 rounded-full bg-[#10b981] opacity-60`} />
              <Text style={tw`text-[10px] font-semibold text-[#44474e]`}>Standar Ideal (WHO)</Text>
            </View>
            <View style={tw`flex-row items-center gap-1.5`}>
              <View style={tw`w-3 h-3 rounded-full bg-[#f59e0b] opacity-60`} />
              <Text style={tw`text-[10px] font-semibold text-[#44474e]`}>Batas Waspada</Text>
            </View>
            <View style={tw`flex-row items-center gap-1.5`}>
              <View style={tw`w-3 h-3 rounded-full bg-[#031636]`} />
              <Text style={tw`text-[10px] font-bold text-[#44474e]`}>Data Anak Anda</Text>
            </View>
          </View>

          {/* Chart Visualization */}
          <View style={tw`w-full h-64 bg-[#f7f9fb] rounded-xl flex-row pt-2 pb-6 px-2 shadow-sm border border-gray-50`}>
            {/* Dynamic Y Labels */}
            <View style={tw`flex-col justify-between h-full w-6 text-right pr-2`}>
              {(() => {
                const config = {
                  tinggi: { min: 40, max: 100, step: 10 },
                  berat: { min: 0, max: 15, step: 3 },
                  lingkarKepala: { min: 30, max: 55, step: 5 }
                }[activeChart];

                const labels = [];
                for (let i = config.max; i >= config.min; i -= config.step) {
                  labels.push(i);
                }

                return labels.map((lbl, idx) => (
                  <Text key={idx} style={tw`text-[9px] font-semibold text-[#8c949f]`}>{lbl}</Text>
                ));
              })()}
            </View>

            <View style={tw`flex-1 h-full relative`}>
              <Svg height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={tw`absolute inset-0`}>
                <Defs>
                  <LinearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                    <Stop offset="0%" stopColor="#031636" stopOpacity="0.4" />
                    <Stop offset="100%" stopColor="#031636" stopOpacity="0.05" />
                  </LinearGradient>
                </Defs>

                {/* Premium Grid Lines */}
                <Line x1="0" y1="0" x2="100%" y2="0" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
                <Line x1="0" y1="20" x2="100%" y2="20" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
                <Line x1="0" y1="40" x2="100%" y2="40" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
                <Line x1="0" y1="60" x2="100%" y2="60" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
                <Line x1="0" y1="80" x2="100%" y2="80" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
                <Line x1="0" y1="100" x2="100%" y2="100" stroke="#cbd5e1" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />

                {/* Vertical Guidelines for age */}
                <Line x1="16.6%" y1="0" x2="16.6%" y2="100" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" />
                <Line x1="33.3%" y1="0" x2="33.3%" y2="100" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" />
                <Line x1="50%" y1="0" x2="50%" y2="100" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" />
                <Line x1="66.6%" y1="0" x2="66.6%" y2="100" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" />
                <Line x1="83.3%" y1="0" x2="83.3%" y2="100" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" />
                <Line x1="100%" y1="0" x2="100%" y2="100" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" />

                {/* WHO Standard Curves Overlay */}
                {(() => {
                  const config = {
                    tinggi: { min: 40, max: 100 },
                    berat: { min: 0, max: 15 },
                    lingkarKepala: { min: 30, max: 55 }
                  }[activeChart];

                  const isGirl = selectedChild?.jenisKelamin?.toLowerCase() === 'perempuan';

                  const whoDataBoys = {
                    tinggi: {
                      ideal: [49.9, 67.6, 75.7, 82.3, 87.1], // 0, 6, 12, 18, 24 bln
                      lower: [46.1, 63.3, 71.0, 76.9, 81.7]
                    },
                    berat: {
                      ideal: [3.3, 7.9, 9.6, 10.9, 12.2],
                      lower: [2.5, 6.4, 7.7, 8.8, 9.7]
                    },
                    lingkarKepala: {
                      ideal: [34.5, 43.3, 46.1, 47.4, 48.3],
                      lower: [31.9, 41.0, 43.6, 44.9, 45.8]
                    }
                  };

                  const whoDataGirls = {
                    tinggi: {
                      ideal: [49.1, 65.7, 74.0, 80.7, 85.5],
                      lower: [45.4, 61.2, 68.9, 74.9, 80.0]
                    },
                    berat: {
                      ideal: [3.2, 7.3, 8.9, 10.2, 11.5],
                      lower: [2.4, 5.7, 7.0, 8.1, 9.0]
                    },
                    lingkarKepala: {
                      ideal: [33.9, 42.2, 44.9, 46.2, 47.2],
                      lower: [31.5, 39.7, 42.2, 43.5, 44.6]
                    }
                  };

                  const whoData = (isGirl ? whoDataGirls : whoDataBoys)[activeChart];

                  const xPoints = [0, 25, 50, 75, 100];

                  const getD = (values: number[]) => {
                    const points = values.map((val, i) => {
                      const y = 100 - ((val - config.min) / (config.max - config.min)) * 100;
                      return { x: xPoints[i], y };
                    });
                    return `M${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L${p.x},${p.y}`).join(' ');
                  };

                  return (
                    <>
                      {/* Jalur Ideal WHO (Hijau) */}
                      <Path d={getD(whoData.ideal)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" vectorEffect="non-scaling-stroke" />
                      {/* Batas Waspada WHO (Oranye) */}
                      <Path d={getD(whoData.lower)} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" vectorEffect="non-scaling-stroke" />
                    </>
                  );
                })()}

                {/* Dynamic Line Path (Data Anak) */}
                {(() => {
                  if (!selectedChild?.tanggalLahir || measurements.length === 0) return null;

                  const config = {
                    tinggi: { min: 40, max: 100, getVal: (m: any) => m.tinggi },
                    berat: { min: 0, max: 15, getVal: (m: any) => m.berat },
                    lingkarKepala: { min: 30, max: 55, getVal: (m: any) => m.lingkarKepala }
                  }[activeChart];

                  const points = measurements.map(m => {
                    const mDate = new Date(m.tanggal);
                    const bDate = new Date(selectedChild.tanggalLahir);
                    const diffDays = (mDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24);
                    const ageMonths = Math.max(0, diffDays / 30.44); // Hindari minus

                    const val = config.getVal(m);
                    if (val === null || val === undefined) return null;

                    let x = (ageMonths / 24) * 100;
                    // Y calculation: 0 is top (max), 100 is bottom (min)
                    let y = 100 - ((val - config.min) / (config.max - config.min)) * 100;
                    
                    const labelStr = `${mDate.getDate()}/${mDate.getMonth() + 1}`;

                    return { 
                      x: Math.max(0, Math.min(100, x)), 
                      y: Math.max(0, Math.min(100, y)),
                      label: labelStr
                    };
                  }).filter(p => p !== null).sort((a: any, b: any) => a.x - b.x);

                  if (points.length === 0) return null;

                  if (points.length === 1) {
                    return (
                      <React.Fragment>
                        <Circle cx={points[0].x} cy={points[0].y} r="1.5" fill="#ffffff" stroke="#031636" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                        <SvgText x={points[0].x} y={points[0].y - 4} fontSize="3.5" fill="#031636" textAnchor="middle" fontWeight="bold">{points[0].label}</SvgText>
                      </React.Fragment>
                    );
                  }

                  const lineD = `M${points[0].x},${points[0].y} ` + points.slice(1).map((p: any) => `L${p.x},${p.y}`).join(' ');
                  const fillD = `${lineD} L${points[points.length - 1].x},100 L${points[0].x},100 Z`;

                  return (
                    <>
                      <Path d={fillD} fill="url(#lineGrad)" />
                      <Path d={lineD} fill="none" stroke="#031636" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      {points.map((p: any, i: number) => (
                        <React.Fragment key={i}>
                          <Circle cx={p.x} cy={p.y} r="1.5" fill="#ffffff" stroke="#031636" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                          <SvgText x={p.x} y={p.y - 4} fontSize="3.5" fill="#031636" textAnchor="middle" fontWeight="bold">{p.label}</SvgText>
                        </React.Fragment>
                      ))}
                    </>
                  );
                })()}
              </Svg>
            </View>
            <View style={tw`absolute bottom-0 left-6 right-0 flex-row justify-between pt-1`}>
              <Text style={tw`text-[10px] text-[#44474e]`}>0</Text>
              <Text style={tw`text-[10px] text-[#44474e]`}>4</Text>
              <Text style={tw`text-[10px] text-[#44474e]`}>8</Text>
              <Text style={tw`text-[10px] text-[#44474e]`}>12</Text>
              <Text style={tw`text-[10px] text-[#44474e]`}>16</Text>
              <Text style={tw`text-[10px] text-[#44474e]`}>20</Text>
              <Text style={tw`text-[10px] text-[#44474e]`}>24</Text>
            </View>
          </View>
          <Text style={tw`text-center text-[10px] text-[#44474e]`}>Umur (Bulan)</Text>
        </View>

        {/* Status Tumbuh Kembang Alert */}
        {(() => {
          if (!selectedChild?.tanggalLahir || measurements.length === 0) return null;

          const getStatus = (val: any, ageMonths: number, type: 'tinggi' | 'berat' | 'lingkarKepala') => {
            if (val === undefined || val === null || val === '') return { text: '-', color: 'text-gray-500', bg: 'bg-gray-100', icon: 'remove' };

            const isGirl = selectedChild?.jenisKelamin?.toLowerCase() === 'perempuan';
            const whoDataBoys = {
              tinggi: { lower: [46.1, 63.3, 71.0, 76.9, 81.7] },
              berat: { lower: [2.5, 6.4, 7.7, 8.8, 9.7] },
              lingkarKepala: { lower: [31.9, 41.0, 43.6, 44.9, 45.8] }
            };
            const whoDataGirls = {
              tinggi: { lower: [45.4, 61.2, 68.9, 74.9, 80.0] },
              berat: { lower: [2.4, 5.7, 7.0, 8.1, 9.0] },
              lingkarKepala: { lower: [31.5, 39.7, 42.2, 43.5, 44.6] }
            };

            const lowerArray = (isGirl ? whoDataGirls : whoDataBoys)[type].lower;

            let interpolatedLower = lowerArray[0];
            if (ageMonths <= 0) {
              interpolatedLower = lowerArray[0];
            } else if (ageMonths >= 24) {
              interpolatedLower = lowerArray[4];
            } else {
              const idx = Math.floor(ageMonths / 6);
              const remainder = ageMonths % 6;
              interpolatedLower = lowerArray[idx] + (remainder / 6) * (lowerArray[idx + 1] - lowerArray[idx]);
            }

            if (Number(val) >= interpolatedLower) {
              return { text: 'Aman', color: 'text-green-700', bg: 'bg-green-100', icon: 'check-circle' };
            } else {
              return { text: 'Bahaya', color: 'text-red-700', bg: 'bg-red-100', icon: 'warning' };
            }
          };

          const latest = measurements[0];
          const mDate = new Date(latest.tanggal);
          const bDate = new Date(selectedChild.tanggalLahir);
          const diffDays = (mDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24);
          const ageMonths = Math.max(0, diffDays / 30.44);

          const statusTinggi = getStatus(latest.tinggi, ageMonths, 'tinggi');
          const statusBerat = getStatus(latest.berat, ageMonths, 'berat');
          const statusKepala = getStatus(latest.lingkarKepala, ageMonths, 'lingkarKepala');

          // Cek jika ada yang bahaya untuk alert global
          const isWarning = statusTinggi.text === 'Bahaya' || statusBerat.text === 'Bahaya' || statusKepala.text === 'Bahaya';

          return (
            <View style={tw`bg-white rounded-3xl p-5 shadow-sm flex-col gap-4 border ${isWarning ? 'border-red-200 bg-red-50/30' : 'border-gray-100'} mt-2`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-lg font-bold text-[#191c1e]`}>Status Gizi Terakhir</Text>
                {isWarning && (
                  <View style={tw`bg-red-100 px-2 py-1 rounded flex-row items-center gap-1`}>
                    <MaterialIcons name="error" size={12} color="#b91c1c" />
                    <Text style={tw`text-[10px] font-bold text-red-700`}>Butuh Perhatian</Text>
                  </View>
                )}
              </View>

              <View style={tw`flex-row justify-between gap-2`}>
                <View style={tw`flex-1 flex-col items-center p-3 rounded-xl ${statusTinggi.bg}`}>
                  <Text style={tw`text-xs text-gray-700 mb-1`}>Tinggi</Text>
                  <MaterialIcons name={statusTinggi.icon as any} size={24} style={tw`${statusTinggi.color} mb-1`} />
                  <Text style={tw`text-sm font-bold ${statusTinggi.color}`}>{statusTinggi.text}</Text>
                </View>

                <View style={tw`flex-1 flex-col items-center p-3 rounded-xl ${statusBerat.bg}`}>
                  <Text style={tw`text-xs text-gray-700 mb-1`}>Berat</Text>
                  <MaterialIcons name={statusBerat.icon as any} size={24} style={tw`${statusBerat.color} mb-1`} />
                  <Text style={tw`text-sm font-bold ${statusBerat.color}`}>{statusBerat.text}</Text>
                </View>

                <View style={tw`flex-1 flex-col items-center p-3 rounded-xl ${statusKepala.bg}`}>
                  <Text style={tw`text-xs text-gray-700 mb-1 text-center`}>Lingkar Kepala</Text>
                  <MaterialIcons name={statusKepala.icon as any} size={24} style={tw`${statusKepala.color} mb-1`} />
                  <Text style={tw`text-sm font-bold ${statusKepala.color}`}>{statusKepala.text}</Text>
                </View>
              </View>

              <Text style={tw`text-[10px] text-gray-500 text-center mt-1`}>
                Dianalisa berdasarkan pengukuran terbaru dan batas bawah Standar WHO (-2 SD).
              </Text>
            </View>
          );
        })()}

        {/* Measurement History */}
        <View style={tw`flex-col gap-4 mt-2`}>
          <View style={tw`flex-row justify-between items-center`}>
            <Text style={tw`text-lg font-bold text-[#191c1e]`}>Riwayat Pengukuran</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(parent)/riwayat', params: { childId: selectedChildId } })}>
              <Text style={tw`text-sm font-semibold text-[#031636]`}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#031636" style={tw`mt-4`} />
          ) : measurements.length === 0 ? (
            <Text style={tw`text-center mt-4 text-[#44474e]`}>Belum ada riwayat pengukuran.</Text>
          ) : (
            measurements.slice(0, 5).map((item, index) => {
              const date = new Date(item.tanggal);
              const formattedDate = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
              const isFirst = index === 0;

              return (
                <View key={item.id} style={tw`relative pl-6 pb-4`}>
                  {index !== measurements.length - 1 && (
                    <View style={tw`absolute left-[9px] top-6 bottom-0 w-[2px] bg-gray-200`} />
                  )}
                  <View style={tw`absolute left-0 top-2 w-[20px] h-[20px] ${isFirst ? 'bg-[#d8e2ff]' : 'bg-gray-300'} rounded-full flex items-center justify-center border-4 border-[#f7f9fb]`}>
                    {isFirst && <View style={tw`w-2 h-2 bg-[#031636] rounded-full`} />}
                  </View>
                  <View style={tw`bg-white rounded-xl p-4 shadow-sm flex-row items-center justify-between border border-gray-100 ${!isFirst ? 'opacity-70' : ''}`}>
                    <View style={tw`flex-col gap-1`}>
                      <Text style={tw`text-sm font-semibold text-[#44474e]`}>{formattedDate}</Text>
                      <View style={tw`flex-row gap-4`}>
                        <Text style={tw`text-base font-bold text-[#191c1e]`}>{item.tinggi} cm</Text>
                        <Text style={tw`text-base font-bold text-[#191c1e]`}>{item.berat} kg</Text>
                      </View>
                    </View>
                    {isFirst && (
                      <View style={tw`bg-[#10b981]/10 px-3 py-1 rounded-full`}>
                        <Text style={tw`text-xs font-bold text-[#10b981]`}>Baru</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={tw`absolute bottom-20 right-4 w-14 h-14 bg-[#031636] rounded-full shadow-lg items-center justify-center`}
        onPress={() => router.push('/(parent)/tambah-pengukuran')}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
