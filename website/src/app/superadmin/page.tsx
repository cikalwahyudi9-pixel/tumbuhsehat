"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, signOut, User } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

// Superadmin UIDs — add your UID here after first login
const SUPERADMIN_UIDS = [
  // "your-uid-here"
];

interface Application {
  id: string;
  uid: string;
  namaLengkap: string;
  email: string;
  institusi: string;
  kota: string;
  wilayah: string;
  jenisNakes: string;
  strNomor: string;
  noTelp: string;
  status: "pending" | "verified" | "rejected";
  submittedAt: { toDate(): Date } | null;
}

export default function SuperadminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [selected, setSelected] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "adminApplications"), orderBy("submittedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application)));
    });
    return unsub;
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (app: Application) => {
    setActionLoading(app.id);
    try {
      // Update adminApplications status
      await updateDoc(doc(db, "adminApplications", app.id), {
        status: "verified",
        reviewedAt: serverTimestamp(),
      });
      // Create/update users/{uid} with role admin
      await setDoc(doc(db, "users", app.uid), {
        uid: app.uid,
        email: app.email,
        name: app.namaLengkap,
        role: "admin",
        adminStatus: "verified",
        region: app.wilayah,
        institusi: app.institusi,
        kota: app.kota,
        jenisNakes: app.jenisNakes,
        noTelp: app.noTelp,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSelected(null);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (app: Application) => {
    setActionLoading(app.id);
    try {
      await updateDoc(doc(db, "adminApplications", app.id), {
        status: "rejected",
        reviewedAt: serverTimestamp(),
      });
      setSelected(null);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredApps = activeTab === "all" ? applications : applications.filter((a) => a.status === activeTab);
  const counts = {
    pending: applications.filter((a) => a.status === "pending").length,
    verified: applications.filter((a) => a.status === "verified").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  // Login gate
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 shadow-[0_4px_20px_rgba(3,22,54,0.08)] border border-outline-variant/20 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-white text-3xl">admin_panel_settings</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Superadmin Dashboard</h1>
            <p className="text-on-surface-variant mt-2">Masuk untuk mengelola pengajuan tenaga kesehatan</p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-outline-variant text-on-surface font-semibold py-3.5 px-4 rounded-xl hover:bg-surface-container-low transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.34H19.27C21.35 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.27 20.34L15.71 17.58C14.73 18.24 13.48 18.63 12 18.63C9.14 18.63 6.72 16.7 5.83 14.11H2.15V16.96C3.97 20.58 7.68 23 12 23Z" fill="#34A853"/>
              <path d="M5.83 14.11C5.6 13.43 5.47 12.72 5.47 12C5.47 11.28 5.6 10.57 5.83 9.89V7.04H2.15C1.41 8.52 1 10.21 1 12C1 13.79 1.41 15.48 2.15 16.96L5.83 14.11Z" fill="#FBBC05"/>
              <path d="M12 5.38C13.62 5.38 15.07 5.94 16.21 7.03L19.34 3.9C17.45 2.14 14.97 1 12 1C7.68 1 3.97 3.42 2.15 7.04L5.83 9.89C6.72 7.3 9.14 5.38 12 5.38Z" fill="#EA4335"/>
            </svg>
            Login dengan Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar */}
      <aside className="w-60 bg-primary text-white flex flex-col fixed top-0 bottom-0 left-0 z-40">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[16px]">child_care</span>
            </div>
            <span className="text-base font-bold">TumbuhSehat</span>
          </div>
          <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider">Superadmin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/10 text-white text-sm font-semibold">
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            Dasbor
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/70 hover:bg-white/5 text-sm font-medium transition-colors">
            <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            Pengajuan Baru
            {counts.pending > 0 && (
              <span className="ml-auto bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{counts.pending}</span>
            )}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/70 hover:bg-white/5 text-sm font-medium transition-colors">
            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
            Semua Admin
          </button>
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            {user.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user.displayName}</p>
              <p className="text-[10px] text-white/50">Superadmin</p>
            </div>
            <button onClick={() => signOut(auth)} title="Logout">
              <span className="material-symbols-outlined text-white/50 hover:text-white text-[20px] transition-colors">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-60 flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-outline-variant/20 flex items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="text-lg font-bold text-primary">Dashboard Superadmin</h1>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            <span>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </header>

        <main className="p-8 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Menunggu Persetujuan", value: counts.pending, icon: "hourglass_empty", color: "text-amber", bg: "bg-[#fef3c7]", border: "border-amber/20" },
              { label: "Admin Aktif", value: counts.verified, icon: "verified_user", color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
              { label: "Ditolak", value: counts.rejected, icon: "cancel", color: "text-error", bg: "bg-error/10", border: "border-error/20" },
            ].map((card) => (
              <div key={card.label} className={`bg-white rounded-2xl p-6 border ${card.border} shadow-[0_2px_12px_rgba(3,22,54,0.04)]`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{card.label}</p>
                    <p className={`text-4xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined ${card.color} text-[24px]`}>{card.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-[0_2px_12px_rgba(3,22,54,0.04)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
              <h2 className="text-base font-bold text-primary">Pengajuan Tenaga Kesehatan</h2>
              <div className="flex gap-2">
                {(["pending", "verified", "rejected", "all"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      activeTab === tab ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {tab === "pending" ? "Menunggu" : tab === "verified" ? "Disetujui" : tab === "rejected" ? "Ditolak" : "Semua"}
                    {tab !== "all" && counts[tab] > 0 && (
                      <span className="ml-1.5 bg-white/20 px-1.5 rounded-full">{counts[tab as keyof typeof counts]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low text-left">
                    <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Institusi</th>
                    <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Kota</th>
                    <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant text-sm">
                        <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">inbox</span>
                        Tidak ada pengajuan
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{app.namaLengkap}</p>
                            <p className="text-xs text-on-surface-variant">{app.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-on-surface">{app.institusi || "-"}</p>
                          <p className="text-xs text-on-surface-variant">{app.jenisNakes || "-"}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface">{app.kota || "-"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            app.status === "pending" ? "bg-[#fef3c7] text-amber" :
                            app.status === "verified" ? "bg-secondary/10 text-secondary" :
                            "bg-error/10 text-error"
                          }`}>
                            <span className="material-symbols-outlined icon-fill text-[12px]">
                              {app.status === "pending" ? "hourglass_empty" : app.status === "verified" ? "check_circle" : "cancel"}
                            </span>
                            {app.status === "pending" ? "Menunggu" : app.status === "verified" ? "Disetujui" : "Ditolak"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelected(app)}
                              className="text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors"
                            >
                              Detail
                            </button>
                            {app.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(app)}
                                  disabled={actionLoading === app.id}
                                  className="text-xs font-semibold text-white bg-secondary px-3 py-1.5 rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-60"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleReject(app)}
                                  disabled={actionLoading === app.id}
                                  className="text-xs font-semibold text-error border border-error/30 px-3 py-1.5 rounded-lg hover:bg-error hover:text-white transition-colors disabled:opacity-60"
                                >
                                  Tolak
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
              <h2 className="text-lg font-bold text-primary">Detail Pengajuan</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Nama Lengkap", value: selected.namaLengkap },
                { label: "Email", value: selected.email },
                { label: "No. Telepon", value: selected.noTelp || "-" },
                { label: "Jenis Tenaga Kesehatan", value: selected.jenisNakes || "-" },
                { label: "Institusi", value: selected.institusi || "-" },
                { label: "Kota", value: selected.kota || "-" },
                { label: "Wilayah Kerja", value: selected.wilayah || "-" },
                { label: "No. STR/SIP", value: selected.strNomor || "-" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-start gap-4">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider shrink-0">{item.label}</span>
                  <span className="text-sm text-on-surface font-medium text-right">{item.value}</span>
                </div>
              ))}
            </div>
            {selected.status === "pending" && (
              <div className="flex gap-3 p-6 border-t border-outline-variant/20">
                <button
                  onClick={() => handleReject(selected)}
                  disabled={actionLoading === selected.id}
                  className="flex-1 border border-error/30 text-error py-3 rounded-xl font-semibold hover:bg-error hover:text-white transition-colors disabled:opacity-60"
                >
                  Tolak Pengajuan
                </button>
                <button
                  onClick={() => handleApprove(selected)}
                  disabled={actionLoading === selected.id}
                  className="flex-[2] bg-secondary text-white py-3 rounded-xl font-bold hover:bg-emerald-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {actionLoading === selected.id ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">check_circle</span>Setujui Pengajuan</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
