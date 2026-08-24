"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { User } from "firebase/auth";

export default function MenungguPage() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"pending" | "verified" | "rejected">("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubDoc = onSnapshot(doc(db, "adminApplications", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status) {
          setStatus(data.status);
        }
      }
      setLoading(false);
    });
    return unsubDoc;
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- STATE: APPROVED (VERIFIED) ---
  if (status === "verified") {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-secondary/30 shadow-xl shadow-secondary/5">
          {/* Animated verified icon */}
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 bg-secondary/20 rounded-full animate-ping opacity-30" />
            <div className="relative w-full h-full bg-secondary text-white rounded-full flex items-center justify-center shadow-lg shadow-secondary/30">
              <span className="material-symbols-outlined text-[64px]">verified</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-block bg-secondary/10 text-secondary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Status: Terverifikasi
            </span>
            <h1 className="text-2xl font-bold text-primary tracking-tight">Akun Anda Telah Disetujui!</h1>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Selamat, pengajuan Anda sebagai Tenaga Kesehatan telah diverifikasi. Sekarang Anda memiliki akses penuh ke Dashboard Admin di aplikasi mobile.
            </p>
          </div>

          {/* Status cards (All checked) */}
          <div className="space-y-2.5 text-left pt-2">
            <div className="bg-secondary/5 rounded-xl p-3.5 border border-secondary/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-primary">Pengajuan Diterima</p>
                <p className="text-[11px] text-on-surface-variant">Data pendaftaran tersimpan</p>
              </div>
              <span className="material-symbols-outlined text-secondary icon-fill text-[20px]">check_circle</span>
            </div>

            <div className="bg-secondary/5 rounded-xl p-3.5 border border-secondary/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-primary">Verifikasi Kredensial STR/SIP</p>
                <p className="text-[11px] text-secondary font-medium">Disetujui oleh Superadmin</p>
              </div>
              <span className="material-symbols-outlined text-secondary icon-fill text-[20px]">check_circle</span>
            </div>

            <div className="bg-secondary/10 rounded-xl p-3.5 border border-secondary/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#031636] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">phone_android</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-primary">Akses Aplikasi Mobile Aktif</p>
                <p className="text-[11px] text-on-surface-variant">Role Admin Puskesmas telah aktif</p>
              </div>
              <span className="material-symbols-outlined text-secondary icon-fill text-[20px]">check_circle</span>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <div className="bg-[#031636] text-white rounded-2xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Langkah Selanjutnya di HP:
              </p>
              <ol className="text-xs text-white/90 list-decimal list-inside space-y-1 leading-relaxed">
                <li>Buka <strong>Aplikasi Mobile TumbuhSehat</strong> di HP Anda</li>
                <li>Login dengan akun Google yang sama: <br/><strong className="text-secondary">{user?.email}</strong></li>
                <li>Anda akan langsung diarahkan ke <strong>Dashboard Admin</strong>!</li>
              </ol>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary transition-colors font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- STATE: REJECTED ---
  if (status === "rejected") {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-red-200 shadow-xl">
          <div className="w-20 h-20 mx-auto bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[48px]">cancel</span>
          </div>
          <div className="space-y-2">
            <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Status: Pengajuan Ditolak
            </span>
            <h1 className="text-2xl font-bold text-primary tracking-tight">Pengajuan Belum Disetujui</h1>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Mohon maaf, dokumen STR/SIP atau data institusi yang Anda lampirkan belum memenuhi persyaratan verifikasi.
            </p>
          </div>
          <Link
            href="/daftar"
            className="inline-flex items-center justify-center w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-container transition-colors text-sm"
          >
            Ajukan Ulang Pendaftaran
          </Link>
        </div>
      </div>
    );
  }

  // --- STATE: PENDING (DEFAULT) ---
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-lg">
        {/* Animated icon */}
        <div className="relative w-28 h-28 mx-auto">
          <div className="absolute inset-0 bg-primary-fixed/30 rounded-full animate-ping opacity-40" />
          <div className="relative w-full h-full bg-primary-fixed/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: "56px" }}>schedule</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="inline-block bg-amber/10 text-amber text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Status: Menunggu Tinjauan
          </span>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Pengajuan Terkirim!</h1>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Pengajuan pendaftaran Anda sedang ditinjau oleh Superadmin. Halaman ini akan otomatis terupdate saat disetujui.
          </p>
        </div>

        {/* Status cards */}
        <div className="space-y-2.5 text-left">
          <div className="bg-white rounded-xl p-3.5 border border-outline-variant/30 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary text-[18px]">task_alt</span>
            </div>
            <div className="text-left flex-1">
              <p className="text-xs font-bold text-on-surface">Pengajuan Diterima</p>
              <p className="text-[11px] text-on-surface-variant">Data Anda sudah kami simpan</p>
            </div>
            <span className="material-symbols-outlined text-secondary icon-fill text-[20px]">check_circle</span>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-outline-variant/30 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-amber/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-amber text-[18px]">shield_person</span>
            </div>
            <div className="text-left flex-1">
              <p className="text-xs font-bold text-on-surface">Verifikasi Kredensial</p>
              <p className="text-[11px] text-amber font-medium">Sedang dalam proses pengecekan</p>
            </div>
            <div className="w-4 h-4 rounded-full border-2 border-outline-variant border-t-amber animate-spin" />
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-outline-variant/30 flex items-center gap-3 shadow-sm opacity-50">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">phone_android</span>
            </div>
            <div className="text-left flex-1">
              <p className="text-xs font-bold text-on-surface">Akses Aplikasi Mobile</p>
              <p className="text-[11px] text-on-surface-variant">Menunggu persetujuan</p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
