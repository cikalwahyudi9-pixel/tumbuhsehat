"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

type Step = 1 | 2 | 3;

interface FormData {
  namaLengkap: string;
  email: string;
  noTelp: string;
  institusi: string;
  wilayah: string;
  kota: string;
  jenisNakes: string;
  strNomor: string;
  strFile: File | null;
}

export default function DaftarPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    namaLengkap: "",
    email: "",
    noTelp: "",
    institusi: "",
    wilayah: "",
    kota: "",
    jenisNakes: "",
    strNomor: "",
    strFile: null,
  });

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      setUser(u);
      setFormData((prev) => ({
        ...prev,
        namaLengkap: u.displayName || "",
        email: u.email || "",
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, "adminApplications", user.uid), {
        uid: user.uid,
        email: user.email,
        namaLengkap: formData.namaLengkap,
        noTelp: formData.noTelp,
        institusi: formData.institusi,
        wilayah: formData.wilayah,
        kota: formData.kota,
        jenisNakes: formData.jenisNakes,
        strNomor: formData.strNomor,
        photoURL: user.photoURL,
        status: "pending",
        submittedAt: serverTimestamp(),
      });
      router.push("/menunggu");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="min-h-screen bg-surface">
      {/* Simple Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 md:px-6 max-w-container-max mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[16px]">child_care</span>
            </div>
            <span className="text-lg font-bold text-primary">TumbuhSehat</span>
          </Link>
          <Link href="/" className="text-sm text-on-surface-variant hover:text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali
          </Link>
        </div>
      </nav>

      <main className="pt-20 pb-32 px-4 md:px-6 w-full flex justify-center">
        <div className="max-w-[1050px] w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start my-4">

          {/* Left Column */}
          <div className="md:col-span-5 flex flex-col gap-4 md:sticky md:top-24">
            <div>
              <span className="inline-block bg-secondary/10 text-secondary text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                Daftar sebagai Tenaga Kesehatan
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-primary mb-3 leading-tight">
                Mulai Pantau Kesehatan Anak di Wilayah Anda
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Platform khusus untuk Tenaga Kesehatan dan Puskesmas untuk memantau tumbuh kembang anak secara digital.
              </p>
            </div>

            <div className="space-y-3 py-2">
              {[
                "Terverifikasi oleh Tim Medis",
                "Data Aman & Terenkripsi",
                "Akses Gratis untuk Puskesmas",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm">
                  <span className="material-symbols-outlined text-secondary icon-fill text-[20px]">check_circle</span>
                  <span className="text-on-surface font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="border border-outline-variant/30 rounded-xl p-4 bg-white shadow-sm">
              <p className="text-xs text-on-surface-variant mb-1">Sudah punya akun?</p>
              <a className="text-secondary font-bold hover:underline flex items-center gap-1.5 text-sm" href="#">
                Login via Aplikasi Mobile
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="md:col-span-7">
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(3,22,54,0.06)] border border-outline-variant/30 p-6 md:p-8">

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Langkah {step} dari 3: {step === 1 ? "Identitas" : step === 2 ? "Institusi" : "Dokumen"}
                  </span>
                  <span className="text-xs font-bold text-secondary">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {/* Step indicators */}
                <div className="flex items-center justify-between mt-4">
                  {[
                    { s: 1, label: "Identitas" },
                    { s: 2, label: "Institusi" },
                    { s: 3, label: "Dokumen" },
                  ].map(({ s, label }, idx) => (
                    <div key={s} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${
                          s < step ? "bg-secondary text-white" : s === step ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"
                        }`}>
                          {s < step ? <span className="material-symbols-outlined text-[14px]">check</span> : s}
                        </div>
                        <span className={`text-[10px] font-semibold ${s === step ? "text-primary" : "text-on-surface-variant"}`}>{label}</span>
                      </div>
                      {idx < 2 && (
                        <div className={`flex-1 h-0.5 mx-2 mb-4 ${s < step ? "bg-secondary" : "bg-outline-variant"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1: Identitas */}
              {step === 1 && (
                <div className="space-y-4">
                  {!user ? (
                    <>
                      <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-outline text-on-surface font-semibold py-3 px-4 rounded-xl hover:bg-surface-container-low transition-colors shadow-sm disabled:opacity-60"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.34H19.27C21.35 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                          <path d="M12 23C14.97 23 17.46 22.02 19.27 20.34L15.71 17.58C14.73 18.24 13.48 18.63 12 18.63C9.14 18.63 6.72 16.7 5.83 14.11H2.15V16.96C3.97 20.58 7.68 23 12 23Z" fill="#34A853"/>
                          <path d="M5.83 14.11C5.6 13.43 5.47 12.72 5.47 12C5.47 11.28 5.6 10.57 5.83 9.89V7.04H2.15C1.41 8.52 1 10.21 1 12C1 13.79 1.41 15.48 2.15 16.96L5.83 14.11Z" fill="#FBBC05"/>
                          <path d="M12 5.38C13.62 5.38 15.07 5.94 16.21 7.03L19.34 3.9C17.45 2.14 14.97 1 12 1C7.68 1 3.97 3.42 2.15 7.04L5.83 9.89C6.72 7.3 9.14 5.38 12 5.38Z" fill="#EA4335"/>
                        </svg>
                        {loading ? "Menghubungkan..." : "Login dengan Google"}
                      </button>
                      <p className="text-xs text-center text-on-surface-variant">
                        Kami gunakan Google untuk memverifikasi identitas Anda secara aman
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 bg-secondary/10 rounded-xl p-3 border border-secondary/20">
                        {user.photoURL && (
                          <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full" />
                        )}
                        <div>
                          <p className="font-semibold text-on-surface text-sm">{user.displayName}</p>
                          <p className="text-xs text-on-surface-variant">{user.email}</p>
                        </div>
                        <span className="ml-auto material-symbols-outlined text-secondary icon-fill text-[20px]">verified</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Nama Lengkap (sesuai STR/SIP)</label>
                          <input
                            type="text"
                            value={formData.namaLengkap}
                            onChange={(e) => updateForm("namaLengkap", e.target.value)}
                            className="w-full bg-white border border-outline-variant rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Email</label>
                          <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-sm text-on-surface-variant cursor-not-allowed opacity-70"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface mb-1">Nomor Telepon</label>
                          <input
                            type="tel"
                            value={formData.noTelp}
                            onChange={(e) => updateForm("noTelp", e.target.value)}
                            placeholder="Contoh: 081234567890"
                            className="w-full bg-white border border-outline-variant rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {user && (
                    <button
                      onClick={() => setStep(2)}
                      disabled={!formData.namaLengkap || !formData.noTelp}
                      className="w-full mt-4 bg-[#031636] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#081b3b] shadow-md transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      Selanjutnya: Informasi Institusi
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              )}

              {/* Step 2: Institusi */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">Jenis Tenaga Kesehatan</label>
                      <select
                        value={formData.jenisNakes}
                        onChange={(e) => updateForm("jenisNakes", e.target.value)}
                        className="w-full bg-white border border-outline-variant rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                      >
                        <option value="">Pilih jenis tenaga kesehatan</option>
                        <option>Dokter Umum</option>
                        <option>Dokter Spesialis Anak</option>
                        <option>Bidan</option>
                        <option>Perawat</option>
                        <option>Ahli Gizi</option>
                        <option>Tenaga Promkes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">Nama Institusi / Puskesmas</label>
                      <input
                        type="text"
                        value={formData.institusi}
                        onChange={(e) => updateForm("institusi", e.target.value)}
                        placeholder="Contoh: Puskesmas Surabaya Utara"
                        className="w-full bg-white border border-outline-variant rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">Kota / Kabupaten</label>
                      <input
                        type="text"
                        value={formData.kota}
                        onChange={(e) => updateForm("kota", e.target.value)}
                        placeholder="Contoh: Surabaya"
                        className="w-full bg-white border border-outline-variant rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">Wilayah Kerja / Kelurahan</label>
                      <input
                        type="text"
                        value={formData.wilayah}
                        onChange={(e) => updateForm("wilayah", e.target.value)}
                        placeholder="Contoh: Kel. Sukolilo, Kec. Sukolilo"
                        className="w-full bg-white border border-outline-variant rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setStep(1)} className="flex-1 border border-outline text-on-surface py-3 rounded-xl font-semibold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      Kembali
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!formData.jenisNakes || !formData.institusi || !formData.kota || !formData.wilayah}
                      className="flex-[2] bg-[#031636] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#081b3b] shadow-md transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      Selanjutnya: Dokumen
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Dokumen */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">Nomor STR / SIP</label>
                      <input
                        type="text"
                        value={formData.strNomor}
                        onChange={(e) => updateForm("strNomor", e.target.value)}
                        placeholder="Contoh: 12.3456.7890.12345"
                        className="w-full bg-white border border-outline-variant rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">Upload Dokumen STR / SIP</label>
                      <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center hover:border-secondary transition-colors cursor-pointer bg-surface-container-lowest">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2 block">upload_file</span>
                        <p className="text-xs text-on-surface-variant mb-1 font-medium">Klik atau seret file ke sini</p>
                        <p className="text-[10px] text-on-surface-variant opacity-60">PDF, JPG, PNG maks. 5MB</p>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setFormData(prev => ({ ...prev, strFile: e.target.files![0] }));
                            }
                          }}
                        />
                      </div>
                      {formData.strFile && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-secondary font-medium">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          {formData.strFile.name}
                        </div>
                      )}
                    </div>
                    <div className="bg-[#fef3c7] border border-amber/30 rounded-xl p-3">
                      <p className="text-xs text-[#92400e] flex items-start gap-1.5 leading-relaxed">
                        <span className="material-symbols-outlined text-[16px] text-amber shrink-0 mt-0.5">info</span>
                        Pengajuan Anda akan ditinjau oleh tim kami dalam 1-2 hari kerja. Anda akan mendapat notifikasi setelah disetujui.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setStep(2)} className="flex-1 border border-outline text-on-surface py-3 rounded-xl font-semibold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      Kembali
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !formData.strNomor}
                      className="flex-[2] bg-[#031636] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#081b3b] shadow-md transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Mengirim...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[18px]">send</span>Kirim Pengajuan</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
