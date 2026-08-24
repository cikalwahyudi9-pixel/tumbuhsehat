import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, G, Polyline } from 'react-native-svg';
import { db } from '../../config/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

export default function AnalitikRegional() {
  const router = useRouter();

  const [children, setChildren] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const qChildren = query(collection(db, 'children'));
        const qMeasurements = query(collection(db, 'measurements'));

        const [childrenSnapshot, measurementsSnapshot] = await Promise.all([
          getDocs(qChildren),
          getDocs(qMeasurements)
        ]);

        const childrenData = childrenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const measurementsData = measurementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setChildren(childrenData);
        setMeasurements(measurementsData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const analytics = useMemo(() => {
    const now = new Date();
    const months: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        monthKey: `${d.getFullYear()}-${d.getMonth()}`,
        normal: 0,
        waspada: 0
      });
    }

    const defaultState = { 
      totalScreened: 0, 
      interventionNeeded: 0, 
      normalCount: 0,
      rate: '0.0',
      ageGroups: { bayi: 0, baduta: 0, balita: 0 },
      monthlyData: months
    };

    if (children.length === 0) return defaultState;

    let stuntingCount = 0;
    let normalCount = 0;
    const ageGroups = { bayi: 0, baduta: 0, balita: 0 };

    const getLowerBoundTinggi = (gender: string, months: number) => {
      const isBoy = gender?.toLowerCase() !== 'perempuan';
      const boyPoints = [{m:0, h:46.1}, {m:12, h:71.0}, {m:24, h:81.7}, {m:60, h:96.1}];
      const girlPoints = [{m:0, h:45.4}, {m:12, h:68.9}, {m:24, h:80.0}, {m:60, h:95.2}];
      
      const points = isBoy ? boyPoints : girlPoints;
      const safeMonths = Math.min(Math.max(0, months), 60);
      
      let lower = points[0];
      let upper = points[points.length - 1];
      
      for (let i = 0; i < points.length - 1; i++) {
        if (safeMonths >= points[i].m && safeMonths <= points[i + 1].m) {
          lower = points[i];
          upper = points[i + 1];
          break;
        }
      }
      
      if (lower.m === upper.m) return lower.h;
      const fraction = (safeMonths - lower.m) / (upper.m - lower.m);
      return lower.h + fraction * (upper.h - lower.h);
    };

    // 1. Process all measurements for Monthly Trend
    measurements.forEach(m => {
      const child = children.find(c => c.id === m.childId);
      if (!child) return;
      
      const measureDate = new Date(m.tanggal);
      const monthKey = `${measureDate.getFullYear()}-${measureDate.getMonth()}`;
      const monthObj = months.find(mo => mo.monthKey === monthKey);
      
      if (monthObj) {
        const birthDate = child.tanggalLahir ? new Date(child.tanggalLahir) : new Date(child.createdAt || Date.now());
        const ageInMonths = Math.max(0, (measureDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        const lowerBound = getLowerBoundTinggi(child.jenisKelamin, ageInMonths);
        
        if (m.tinggi && m.tinggi < lowerBound) {
          monthObj.waspada++;
        } else {
          monthObj.normal++;
        }
      }
    });

    // 2. Process latest measurement for Current Distribution
    children.forEach(child => {
      const childMeasurements = measurements
        .filter(m => m.childId === child.id)
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
        
      if (childMeasurements.length > 0) {
        const latest = childMeasurements[0];
        const birthDate = child.tanggalLahir ? new Date(child.tanggalLahir) : new Date(child.createdAt || Date.now());
        const measureDate = new Date(latest.tanggal);
        const ageInMonths = Math.max(0, (measureDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        
        const lowerBound = getLowerBoundTinggi(child.jenisKelamin, ageInMonths);
        const isWaspada = (latest.tinggi && latest.tinggi < lowerBound);
        
        if (isWaspada) {
          stuntingCount++;
          if (ageInMonths <= 6) ageGroups.bayi++;
          else if (ageInMonths <= 24) ageGroups.baduta++;
          else ageGroups.balita++;
        } else {
          normalCount++;
        }
      }
    });

    const totalScreened = stuntingCount + normalCount;
    const rate = totalScreened > 0 ? (stuntingCount / totalScreened) * 100 : 0;

    return {
      totalScreened,
      interventionNeeded: stuntingCount,
      normalCount,
      rate: rate.toFixed(1),
      ageGroups,
      monthlyData: months
    };
  }, [children, measurements]);

  // SVG Chart Configs
  const donutRadius = 55;
  const donutStroke = 20;
  const donutCircum = 2 * Math.PI * donutRadius;
  const totalSnap = Math.max(1, analytics.totalScreened);
  const normalPercent = analytics.normalCount / totalSnap;
  const waspadaPercent = analytics.interventionNeeded / totalSnap;
  
  const normalOffset = donutCircum - (normalPercent * donutCircum);
  const waspadaOffset = donutCircum - (waspadaPercent * donutCircum);

  // Line Chart Configs
  const maxKunjungan = Math.max(...analytics.monthlyData.map(m => m.waspada + m.normal), 5);
  const chartH = 140;
  const chartW = 340;
  const xStep = chartW / 5; // 6 points = 5 intervals

  const waspadaPoints = analytics.monthlyData.map((d, i) => `${i * xStep},${chartH - (d.waspada / maxKunjungan) * chartH}`).join(' ');
  const kunjunganPoints = analytics.monthlyData.map((d, i) => `${i * xStep},${chartH - ((d.waspada + d.normal) / maxKunjungan) * chartH}`).join(' ');

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f7f9fb]`}>
      {/* Header */}
      <View style={tw`flex-row items-center px-4 h-16 bg-[#f7f9fb]/90 ${Platform.OS !== 'android' ? 'shadow-sm' : ''}` }>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(admin)')} style={tw`w-10 h-10 items-center justify-center -ml-2 mr-2`}>
          <MaterialIcons name="arrow-back" size={24} color="#44474e" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold text-[#031636]`}>Analytics</Text>
      </View>

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#031636" />
          <Text style={tw`mt-4 text-[#44474e]`}>Memuat Data Statistik...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={tw`pb-32 gap-6 pt-4`}>
          
          <View style={tw`px-4 flex-col gap-1`}>
            <Text style={tw`text-2xl font-bold text-[#031636]`}>Global Health Trends</Text>
            <Text style={tw`text-sm text-[#44474e]`}>Pemantauan agregat data posyandu secara real-time.</Text>
          </View>

          {/* 1. DISTRIBUSI STATUS GIZI (DONUT CHART) */}
          <View style={tw`px-4`}>
            <View style={tw`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-row items-center justify-between`}>
              <View style={tw`relative w-36 h-36 items-center justify-center`}>
                <Svg height="140" width="140" viewBox="0 0 140 140">
                  <Circle cx="70" cy="70" r={donutRadius} stroke="#f1f5f9" strokeWidth={donutStroke} fill="transparent" />
                  <Circle cx="70" cy="70" r={donutRadius} stroke="#10b981" strokeWidth={donutStroke} fill="transparent" strokeDasharray={donutCircum} strokeDashoffset={normalOffset} strokeLinecap="round" transform="rotate(-90 70 70)" />
                  <Circle cx="70" cy="70" r={donutRadius} stroke="#ef4444" strokeWidth={donutStroke} fill="transparent" strokeDasharray={donutCircum} strokeDashoffset={waspadaOffset} strokeLinecap="round" transform={`rotate(${-90 + (normalPercent * 360)} 70 70)`} />
                </Svg>
                <View style={tw`absolute items-center justify-center`}>
                  <Text style={tw`text-2xl font-bold text-[#031636]`}>{analytics.rate}%</Text>
                  <Text style={tw`text-[10px] text-[#44474e]`}>Beresiko</Text>
                </View>
              </View>
              
              <View style={tw`flex-col gap-4 flex-1 pl-6`}>
                <View>
                  <View style={tw`flex-row items-center gap-2 mb-1`}>
                    <View style={tw`w-3 h-3 rounded-full bg-[#10b981]`} />
                    <Text style={tw`text-xs font-semibold text-[#44474e]`}>Gizi Normal</Text>
                  </View>
                  <Text style={tw`text-xl font-bold text-[#191c1e] pl-5`}>{analytics.normalCount} anak</Text>
                </View>
                <View>
                  <View style={tw`flex-row items-center gap-2 mb-1`}>
                    <View style={tw`w-3 h-3 rounded-full bg-[#ef4444]`} />
                    <Text style={tw`text-xs font-semibold text-[#44474e]`}>Waspada</Text>
                  </View>
                  <Text style={tw`text-xl font-bold text-[#191c1e] pl-5`}>{analytics.interventionNeeded} anak</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 2. TREN KASUS PER BULAN (LINE CHART) */}
          <View style={tw`flex-col w-full px-4`}>
            <Text style={tw`text-lg font-bold text-[#191c1e] mb-2`}>Tren Deteksi Dini (6 Bulan)</Text>
            <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 p-4`}>
              <View style={tw`flex-row items-center justify-end gap-4 mb-4`}>
                <View style={tw`flex-row items-center gap-1`}>
                  <View style={tw`w-2 h-2 rounded-full bg-[#031636]`} />
                  <Text style={tw`text-[10px] text-[#44474e]`}>Total Kunjungan</Text>
                </View>
                <View style={tw`flex-row items-center gap-1`}>
                  <View style={tw`w-2 h-2 rounded-full bg-[#ef4444]`} />
                  <Text style={tw`text-[10px] text-[#44474e]`}>Kasus Waspada</Text>
                </View>
              </View>

              <View style={tw`w-full h-40 relative`}>
                <Svg height="100%" width="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                    <Line key={i} x1="0" y1={chartH * pct} x2={chartW} y2={chartH * pct} stroke="#f1f5f9" strokeWidth="1" />
                  ))}
                  
                  {/* Lines */}
                  <Polyline points={kunjunganPoints} fill="none" stroke="#031636" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <Polyline points={waspadaPoints} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Points */}
                  <G>
                    {analytics.monthlyData.map((d, i) => (
                      <React.Fragment key={i}>
                        <Circle cx={i * xStep} cy={chartH - ((d.waspada + d.normal) / maxKunjungan) * chartH} r="4" fill="#ffffff" stroke="#031636" strokeWidth="2" />
                        <Circle cx={i * xStep} cy={chartH - (d.waspada / maxKunjungan) * chartH} r="4" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                      </React.Fragment>
                    ))}
                  </G>
                </Svg>
              </View>
              
              <View style={tw`flex-row justify-between mt-2`}>
                {analytics.monthlyData.map((d, i) => (
                  <Text key={i} style={tw`text-xs text-[#44474e] w-10 text-center -ml-2`}>{d.label}</Text>
                ))}
              </View>
            </View>
          </View>

          {/* 3. DEMOGRAFI USIA KRITIS (HORIZONTAL BAR) */}
          <View style={tw`px-4 flex-col gap-4 mb-8`}>
            <Text style={tw`text-lg font-bold text-[#191c1e]`}>Peta Usia Rentan (Kasus Waspada)</Text>
            <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex-col gap-5`}>
              
              <View style={tw`flex-col`}>
                <View style={tw`flex-row justify-between mb-1.5`}>
                  <Text style={tw`text-sm font-semibold text-[#191c1e]`}>Bayi (0 - 6 bulan)</Text>
                  <Text style={tw`text-sm font-bold text-[#ef4444]`}>{analytics.ageGroups.bayi} kasus</Text>
                </View>
                <View style={tw`w-full h-3 bg-gray-100 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-[#ef4444] rounded-full`, { width: `${Math.min(100, (analytics.ageGroups.bayi / Math.max(1, analytics.interventionNeeded)) * 100)}%` }]} />
                </View>
              </View>

              <View style={tw`flex-col`}>
                <View style={tw`flex-row justify-between mb-1.5`}>
                  <Text style={tw`text-sm font-semibold text-[#191c1e]`}>Baduta (6 - 24 bulan)</Text>
                  <Text style={tw`text-sm font-bold text-[#ef4444]`}>{analytics.ageGroups.baduta} kasus</Text>
                </View>
                <View style={tw`w-full h-3 bg-gray-100 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-[#ef4444] rounded-full`, { width: `${Math.min(100, (analytics.ageGroups.baduta / Math.max(1, analytics.interventionNeeded)) * 100)}%` }]} />
                </View>
              </View>

              <View style={tw`flex-col`}>
                <View style={tw`flex-row justify-between mb-1.5`}>
                  <Text style={tw`text-sm font-semibold text-[#191c1e]`}>Balita (2 - 5 tahun)</Text>
                  <Text style={tw`text-sm font-bold text-[#ef4444]`}>{analytics.ageGroups.balita} kasus</Text>
                </View>
                <View style={tw`w-full h-3 bg-gray-100 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-[#ef4444] rounded-full`, { width: `${Math.min(100, (analytics.ageGroups.balita / Math.max(1, analytics.interventionNeeded)) * 100)}%` }]} />
                </View>
              </View>

            </View>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
