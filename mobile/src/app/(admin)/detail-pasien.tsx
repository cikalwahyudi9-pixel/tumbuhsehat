import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator, TextInput, Alert } from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db } from '../../config/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

export default function DetailPasien() {
  const router = useRouter();
  const { childId } = useLocalSearchParams();
  const [child, setChild] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'tinggi' | 'berat' | 'lingkarKepala'>('tinggi');
  
  const [catatanText, setCatatanText] = useState('');
  const [statusEvaluasi, setStatusEvaluasi] = useState<'normal' | 'waspada' | 'darurat' | null>(null);
  const [savingCatatan, setSavingCatatan] = useState(false);

  useEffect(() => {
    if (!childId) return;

    // Fetch Child
    const fetchChild = async () => {
      try {
        const docRef = doc(db, 'children', childId as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setChild({ id: docSnap.id, ...data });
          if (data.catatanDokter) {
            setCatatanText(data.catatanDokter.pesan || '');
            setStatusEvaluasi(data.catatanDokter.status || null);
          }
        }
      } catch (error) {
        console.error("Error fetching child:", error);
      }
    };
    fetchChild();

    // Fetch Measurements (real-time)
    const q = query(
      collection(db, 'measurements'),
      where('childId', '==', childId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
      setMeasurements(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [childId]);

  if (loading || !child) {
    return (
      <SafeAreaView style={tw`flex-1 bg-[#f7f9fb] justify-center items-center`}>
        <ActivityIndicator size="large" color="#031636" />
      </SafeAreaView>
    );
  }

  // Calculate age string
  let ageString = "-";
  if (child.tanggalLahir) {
    const diff = new Date().getTime() - new Date(child.tanggalLahir).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30.44);
    if (months < 12) {
      ageString = `${months} Bulan`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      ageString = `${years} Tahun ${remainingMonths} Bulan`;
    }
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f7f9fb]`}>
      {/* Header */}
      <View style={tw`flex-row items-center px-4 h-16 bg-[#f7f9fb]/90 ${Platform.OS !== 'android' ? 'shadow-sm' : ''}` }>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(admin)')} style={tw`w-10 h-10 items-center justify-center -ml-2 mr-2`}>
          <MaterialIcons name="arrow-back" size={24} color="#44474e" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-[#031636]`}>Rekam Medis Pasien</Text>
      </View>

      <ScrollView contentContainerStyle={tw`px-4 pt-6 pb-24 flex-col gap-6`}>
        
        {/* Header Section: Patient Quick Info */}
        <View style={tw`flex-col gap-4`}>
          <View style={tw`flex-row items-center gap-4`}>
            <View style={tw`relative w-16 h-16 rounded-full shadow-sm bg-gray-100 items-center justify-center`}>
              <MaterialIcons name={child.jenisKelamin === 'Perempuan' ? 'face-3' : 'face-6'} size={40} color="#44474e" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-2xl font-bold text-[#031636]`}>{child.nama || 'Tanpa Nama'}</Text>
              <View style={tw`flex-row items-center gap-1 mt-1 flex-wrap`}>
                <Text style={tw`text-sm text-[#44474e]`}>{child.jenisKelamin}</Text>
                <View style={tw`w-1 h-1 rounded-full bg-gray-300 mx-1`} />
                <Text style={tw`text-sm text-[#44474e]`}>{ageString}</Text>
              </View>
            </View>
          </View>

          {/* Chart Controls */}
          <View style={tw`flex-row gap-2 mt-2`}>
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

          {/* Legend */}
          <View style={tw`flex-row gap-4 mb-2`}>
            <View style={tw`flex-row items-center gap-1.5`}>
              <View style={tw`w-3 h-3 rounded-full bg-[#10b981] opacity-60`} />
              <Text style={tw`text-[10px] font-semibold text-[#44474e]`}>Standar Ideal</Text>
            </View>
            <View style={tw`flex-row items-center gap-1.5`}>
              <View style={tw`w-3 h-3 rounded-full bg-[#f59e0b] opacity-60`} />
              <Text style={tw`text-[10px] font-semibold text-[#44474e]`}>Waspada</Text>
            </View>
            <View style={tw`flex-row items-center gap-1.5`}>
              <View style={tw`w-3 h-3 rounded-full bg-[#031636]`} />
              <Text style={tw`text-[10px] font-bold text-[#44474e]`}>Data Anak</Text>
            </View>
          </View>

          {/* Chart SVG */}
          <View style={tw`w-full h-64 bg-[#f7f9fb] rounded-xl flex-row pt-2 pb-6 px-2 shadow-sm border border-gray-50`}>
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
                
                {/* Grid */}
                <Line x1="0" y1="0" x2="100%" y2="0" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
                <Line x1="0" y1="20" x2="100%" y2="20" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
                <Line x1="0" y1="40" x2="100%" y2="40" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
                <Line x1="0" y1="60" x2="100%" y2="60" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
                <Line x1="0" y1="80" x2="100%" y2="80" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
                <Line x1="0" y1="100" x2="100%" y2="100" stroke="#cbd5e1" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                
                <Line x1="16.6%" y1="0" x2="16.6%" y2="100" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" />
                <Line x1="33.3%" y1="0" x2="33.3%" y2="100" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" />
                <Line x1="50%" y1="0" x2="50%" y2="100" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" />
                <Line x1="66.6%" y1="0" x2="66.6%" y2="100" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" />
                <Line x1="83.3%" y1="0" x2="83.3%" y2="100" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" />
                <Line x1="100%" y1="0" x2="100%" y2="100" stroke="#e1e7ec" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" />

                {/* WHO Overlay */}
                {(() => {
                  const config = {
                    tinggi: { min: 40, max: 100 },
                    berat: { min: 0, max: 15 },
                    lingkarKepala: { min: 30, max: 55 }
                  }[activeChart];

                  const isGirl = child?.jenisKelamin?.toLowerCase() === 'perempuan';

                  const whoDataBoys = {
                    tinggi: { ideal: [49.9, 67.6, 75.7, 82.3, 87.1], lower: [46.1, 63.3, 71.0, 76.9, 81.7] },
                    berat: { ideal: [3.3, 7.9, 9.6, 10.9, 12.2], lower: [2.5, 6.4, 7.7, 8.8, 9.7] },
                    lingkarKepala: { ideal: [34.5, 43.3, 46.1, 47.4, 48.3], lower: [31.9, 41.0, 43.6, 44.9, 45.8] }
                  };

                  const whoDataGirls = {
                    tinggi: { ideal: [49.1, 65.7, 74.0, 80.7, 85.5], lower: [45.4, 61.2, 68.9, 74.9, 80.0] },
                    berat: { ideal: [3.2, 7.3, 8.9, 10.2, 11.5], lower: [2.4, 5.7, 7.0, 8.1, 9.0] },
                    lingkarKepala: { ideal: [33.9, 42.2, 44.9, 46.2, 47.2], lower: [31.5, 39.7, 42.2, 43.5, 44.6] }
                  };

                  const whoData = (isGirl ? whoDataGirls : whoDataBoys)[activeChart];

                  const xPoints = [0, 25, 50, 75, 100];
                  const getD = (values: number[]) => {
                    const points = values.map((val, i) => ({ x: xPoints[i], y: 100 - ((val - config.min) / (config.max - config.min)) * 100 }));
                    return `M${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L${p.x},${p.y}`).join(' ');
                  };

                  return (
                    <>
                      <Path d={getD(whoData.ideal)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" vectorEffect="non-scaling-stroke" />
                      <Path d={getD(whoData.lower)} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" vectorEffect="non-scaling-stroke" />
                    </>
                  );
                })()}

                {/* Data Anak */}
                {(() => {
                  if (!child.tanggalLahir || measurements.length === 0) return null;
                  
                  const config = {
                    tinggi: { min: 40, max: 100, getVal: (m: any) => m.tinggi },
                    berat: { min: 0, max: 15, getVal: (m: any) => m.berat },
                    lingkarKepala: { min: 30, max: 55, getVal: (m: any) => m.lingkarKepala }
                  }[activeChart];
                  
                  const points = measurements.map(m => {
                    const mDate = new Date(m.tanggal);
                    const bDate = new Date(child.tanggalLahir);
                    const diffDays = (mDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24);
                    const ageMonths = Math.max(0, diffDays / 30.44);
                    
                    const val = config.getVal(m);
                    if (val === null || val === undefined) return null;
                    
                    let x = (ageMonths / 24) * 100;
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
          <Text style={tw`text-center text-[10px] text-[#44474e] mb-4`}>Umur (Bulan)</Text>
        </View>

        {/* Status Tumbuh Kembang Alert */}
        {(() => {
          if (!child?.tanggalLahir || measurements.length === 0) return null;
          
          const getStatus = (val: any, ageMonths: number, type: 'tinggi' | 'berat' | 'lingkarKepala') => {
            if (val === undefined || val === null || val === '') return { text: '-', color: 'text-gray-500', bg: 'bg-gray-100', icon: 'remove' };
            
            const isGirl = child?.jenisKelamin?.toLowerCase() === 'perempuan';
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
          const bDate = new Date(child.tanggalLahir);
          const diffDays = (mDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24);
          const ageMonths = Math.max(0, diffDays / 30.44);
          
          const statusTinggi = getStatus(latest.tinggi, ageMonths, 'tinggi');
          const statusBerat = getStatus(latest.berat, ageMonths, 'berat');
          const statusKepala = getStatus(latest.lingkarKepala, ageMonths, 'lingkarKepala');

          const isWarning = statusTinggi.text === 'Bahaya' || statusBerat.text === 'Bahaya' || statusKepala.text === 'Bahaya';

          return (
            <View style={tw`bg-white rounded-3xl p-5 shadow-sm flex-col gap-4 border ${isWarning ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
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

        {/* Form Catatan Dokter */}
        <View style={tw`flex-col gap-4 mt-2`}>
          <Text style={tw`text-lg font-bold text-[#031636]`}>Kirim Catatan / Panggilan</Text>
          <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex-col gap-4`}>
            
            <View>
              <Text style={tw`text-sm font-semibold text-[#191c1e] mb-2`}>Status Peringatan (Warna Banner)</Text>
              <View style={tw`flex-row gap-2`}>
                <TouchableOpacity onPress={() => setStatusEvaluasi('normal')} style={tw`flex-1 py-2 rounded-lg border ${statusEvaluasi === 'normal' ? 'border-[#10b981] bg-[#10b981]/10' : 'border-gray-200'} items-center`}>
                  <Text style={tw`text-xs font-bold ${statusEvaluasi === 'normal' ? 'text-[#10b981]' : 'text-gray-500'}`}>Normal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStatusEvaluasi('waspada')} style={tw`flex-1 py-2 rounded-lg border ${statusEvaluasi === 'waspada' ? 'border-[#f59e0b] bg-[#f59e0b]/10' : 'border-gray-200'} items-center`}>
                  <Text style={tw`text-xs font-bold ${statusEvaluasi === 'waspada' ? 'text-[#f59e0b]' : 'text-gray-500'}`}>Waspada</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStatusEvaluasi('darurat')} style={tw`flex-1 py-2 rounded-lg border ${statusEvaluasi === 'darurat' ? 'border-[#dc2626] bg-[#dc2626]/10' : 'border-gray-200'} items-center`}>
                  <Text style={tw`text-xs font-bold ${statusEvaluasi === 'darurat' ? 'text-[#dc2626]' : 'text-gray-500'}`}>Darurat</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Text style={tw`text-sm font-semibold text-[#191c1e] mb-2`}>Rekomendasi Cepat</Text>
              <View style={tw`flex-row flex-wrap gap-2`}>
                {[
                  "Grafik menurun, segera bawa ke Puskesmas.",
                  "Lanjutkan pemberian Makanan Tambahan (PMT).",
                  "Bawa Buku KIA saat kunjungan berikutnya.",
                  "Pertumbuhan sangat baik, pertahankan!"
                ].map((msg, i) => (
                  <TouchableOpacity key={i} onPress={() => setCatatanText(msg)} style={tw`bg-gray-100 px-3 py-1.5 rounded-full`}>
                    <Text style={tw`text-xs text-[#44474e]`}>{msg}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={tw`text-sm font-semibold text-[#191c1e] mb-2`}>Pesan Spesifik</Text>
              <TextInput
                style={tw`w-full bg-[#f7f9fb] border border-gray-200 rounded-xl p-3 text-sm text-[#191c1e] min-h-[80px]`}
                placeholder="Ketik pesan untuk orang tua di sini..."
                placeholderTextColor="#8c949f"
                multiline
                textAlignVertical="top"
                value={catatanText}
                onChangeText={setCatatanText}
              />
            </View>

            <TouchableOpacity 
              disabled={savingCatatan || !statusEvaluasi || !catatanText}
              style={tw`w-full py-3 rounded-xl items-center justify-center flex-row gap-2 ${(savingCatatan || !statusEvaluasi || !catatanText) ? 'bg-gray-300' : 'bg-[#031636]'}`}
              onPress={async () => {
                setSavingCatatan(true);
                try {
                  await updateDoc(doc(db, 'children', childId as string), {
                    catatanDokter: {
                      pesan: catatanText,
                      status: statusEvaluasi,
                      timestamp: new Date().toISOString(),
                      read: false
                    }
                  });
                  if (Platform.OS === 'web') {
                    window.alert("Catatan berhasil dikirim ke orang tua!");
                  } else {
                    Alert.alert("Sukses", "Catatan berhasil dikirim ke orang tua!");
                  }
                  setCatatanText('');
                  setStatusEvaluasi(null);
                } catch (error) {
                  console.error(error);
                  if (Platform.OS === 'web') window.alert("Gagal mengirim catatan");
                } finally {
                  setSavingCatatan(false);
                }
              }}
            >
              {savingCatatan ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color="white" />
                  <Text style={tw`text-white font-bold text-sm`}>Kirim ke Orang Tua</Text>
                </>
              )}
            </TouchableOpacity>

          </View>
        </View>

        {/* Measurement History */}
        <View style={tw`flex-col gap-4`}>
          <Text style={tw`text-lg font-bold text-[#031636]`}>Riwayat Pengukuran</Text>
          
          <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}>
            {measurements.length === 0 ? (
              <View style={tw`p-8 items-center justify-center`}>
                <Text style={tw`text-[#44474e]`}>Belum ada data pengukuran.</Text>
              </View>
            ) : (
              measurements.map((item) => (
                <View key={item.id} style={tw`flex-col p-4 border-b border-gray-50`}>
                  <View style={tw`flex-row items-center mb-3`}>
                    <View style={tw`w-2 h-2 rounded-full bg-[#10b981] mr-2`} />
                    <Text style={tw`text-sm font-bold text-[#191c1e]`}>
                      {new Date(item.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                    </Text>
                  </View>
                  
                  <View style={tw`flex-row justify-between bg-[#f7f9fb] p-3 rounded-xl`}>
                    <View style={tw`flex-col items-center flex-1 border-r border-gray-200`}>
                      <Text style={tw`text-xs text-[#8c949f] mb-1`}>Tinggi</Text>
                      <Text style={tw`text-base font-bold text-[#031636]`}>{item.tinggi} <Text style={tw`text-xs font-normal`}>cm</Text></Text>
                    </View>
                    <View style={tw`flex-col items-center flex-1 border-r border-gray-200`}>
                      <Text style={tw`text-xs text-[#8c949f] mb-1`}>Berat</Text>
                      <Text style={tw`text-base font-bold text-[#031636]`}>{item.berat} <Text style={tw`text-xs font-normal`}>kg</Text></Text>
                    </View>
                    <View style={tw`flex-col items-center flex-1`}>
                      <Text style={tw`text-xs text-[#8c949f] mb-1`}>Kepala</Text>
                      <Text style={tw`text-base font-bold text-[#031636]`}>{item.lingkarKepala} <Text style={tw`text-xs font-normal`}>cm</Text></Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
