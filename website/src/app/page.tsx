"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AdminAccount {
  id: string;
  email: string;
  nama?: string;
  addedBy?: string;
  createdAt?: any;
  isRegisteredUser?: boolean;
}

// ==========================================
// KREDENSIAL KHUSUS SUPERADMIN
// ==========================================
const SUPERADMIN_CREDENTIALS = {
  username: "admin", // atau admin@tumbuhsehat.com
  password: "admin", // password superadmin
};

export default function SuperadminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Form login state
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Admins state
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminAccount | null>(null);

  // Form tambah admin
  const [inputEmail, setInputEmail] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Check saved session in localStorage
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem("ts_superadmin_auth");
      if (savedAuth === "true") {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingAuth(false);
  }, []);

  // Listen to Whitelist Admins & Registered Admin Users
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Listen to whitelist_admins collection
    const unsubWhitelist = onSnapshot(collection(db, "whitelist_admins"), (whitelistSnap) => {
      const list: AdminAccount[] = whitelistSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          email: data.email || d.id,
          nama: data.namaLengkap || data.name || "",
          addedBy: data.addedBy || "superadmin",
          createdAt: data.createdAt,
          isRegisteredUser: false,
        };
      });

      // 2. Also listen to users collection with role admin
      const qUsers = query(collection(db, "users"), where("role", "==", "admin"));
      const unsubUsers = onSnapshot(qUsers, (usersSnap) => {
        const registeredList: AdminAccount[] = usersSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: (data.email || d.id).toLowerCase(),
            email: (data.email || "").toLowerCase(),
            nama: data.name || data.namaLengkap || "",
            createdAt: data.createdAt,
            isRegisteredUser: true,
          };
        });

        // Merge without duplicates
        const map = new Map<string, AdminAccount>();
        list.forEach((item) => map.set(item.email.toLowerCase(), item));
        registeredList.forEach((item) => {
          if (item.email) {
            const existing = map.get(item.email.toLowerCase());
            map.set(item.email.toLowerCase(), {
              ...existing,
              ...item,
              isRegisteredUser: true,
            });
          }
        });

        setAdmins(Array.from(map.values()));
      });

      return () => unsubUsers();
    });

    return () => unsubWhitelist();
  }, [isAuthenticated]);

  // Handle Login Superadmin dengan Kredensial Khusus
  const handleSuperadminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    setTimeout(() => {
      const isUserMatch =
        usernameInput.trim() === SUPERADMIN_CREDENTIALS.username ||
        usernameInput.trim().toLowerCase() === "admin@tumbuhsehat.com" ||
        usernameInput.trim().toLowerCase() === "superadmin";

      const isPassMatch = passwordInput === SUPERADMIN_CREDENTIALS.password;

      if (isUserMatch && isPassMatch) {
        setIsAuthenticated(true);
        localStorage.setItem("ts_superadmin_auth", "true");
        setUsernameInput("");
        setPasswordInput("");
      } else {
        setLoginError("Username atau Password Superadmin salah!");
      }
      setLoginLoading(false);
    }, 400);
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("ts_superadmin_auth");
  };

  // Handle Add Admin Email
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const emailClean = inputEmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes("@")) {
      setFormError("Masukkan alamat email Google yang valid.");
      return;
    }

    setFormSubmitting(true);
    try {
      // 1. Simpan email ke whitelist_admins
      await setDoc(doc(db, "whitelist_admins", emailClean), {
        email: emailClean,
        addedBy: "superadmin",
        createdAt: new Date().toISOString(),
      });

      // 2. Jika user sudah pernah login di aplikasi mobile sebelumnya, update rolenya langsung
      const userQuery = query(collection(db, "users"), where("email", "==", emailClean));
      const userSnap = await getDocs(userQuery);

      for (const uDoc of userSnap.docs) {
        await setDoc(
          doc(db, "users", uDoc.id),
          {
            role: "admin",
            status_verifikasi: "verified",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      setFormSuccess(`Email ${emailClean} berhasil ditambahkan sebagai Admin!`);
      setInputEmail("");

      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess("");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setFormError("Gagal menambahkan admin: " + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Admin
  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    try {
      const emailKey = selectedAdmin.email.toLowerCase();
      // 1. Hapus dari whitelist_admins
      await deleteDoc(doc(db, "whitelist_admins", emailKey));

      // 2. Cabut role admin di collection users jika ada
      const userQuery = query(collection(db, "users"), where("email", "==", emailKey));
      const userSnap = await getDocs(userQuery);
      for (const uDoc of userSnap.docs) {
        await setDoc(
          doc(db, "users", uDoc.id),
          {
            role: "parent",
          },
          { merge: true }
        );
      }

      setIsDeleteModalOpen(false);
      setSelectedAdmin(null);
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus admin: " + err.message);
    }
  };

  // Filtered list
  const filteredAdmins = admins.filter((admin) =>
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (admin.nama && admin.nama.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // -------------------------------------------------------------
  // RENDER: LOADING STATE
  // -------------------------------------------------------------
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-secondary rounded-full animate-spin" />
          <p className="text-sm font-semibold text-on-surface-variant">Memuat Portal Superadmin...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: LOGIN FORM KHUSUS SUPERADMIN (USERNAME & PASSWORD)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-[#071d43] to-[#041026] text-white flex flex-col justify-between">
        {/* Header */}
        <header className="p-6 flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shadow-lg shadow-secondary/30">
              <span className="material-symbols-outlined text-white text-[20px]">child_care</span>
            </div>
            <span className="text-xl font-bold tracking-tight">TumbuhSehat</span>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-white/10 rounded-full border border-white/15 text-white/80">
            Akses Terbatas Superadmin
          </span>
        </header>

        {/* Center Login Box */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-10 text-[#191c1e] shadow-2xl border border-white/20">
            <div className="text-center space-y-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </div>
              <h1 className="text-2xl font-bold text-primary">Login Superadmin</h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Masuk dengan akun khusus Superadmin untuk mengelola akses admin pencegahan stunting.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {loginError}
              </div>
            )}

            <form onSubmit={handleSuperadminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary mb-1">Username / ID Admin</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full bg-surface border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    key
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full bg-surface border border-outline-variant rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 bg-primary hover:bg-[#081b3b] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    Masuk ke Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-outline-variant/30 text-center">
              <p className="text-xs text-on-surface-variant flex items-center justify-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[16px] text-secondary">shield</span>
                Hanya pemilik kredensial yang dapat masuk
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} TumbuhSehat Superadmin Portal
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SUPERADMIN DASHBOARD (AUTHENTICATED)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-primary text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-white text-[18px]">child_care</span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight">TumbuhSehat</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-white/15 rounded text-secondary">
                Superadmin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span>Superadmin Aktif</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Banner Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
              Kelola Akun Admin
            </h1>
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
              Cukup tambahkan email Google admin di sini. Begitu mereka login di aplikasi mobile, mereka akan otomatis mendapat akses Admin pencegah stunting anak.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError("");
              setFormSuccess("");
              setInputEmail("");
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] text-white">person_add</span>
            <span className="text-white font-bold">Tambah Email Admin</span>
          </button>
        </div>

        {/* Stats & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Admin Terdaftar</p>
              <p className="text-2xl font-bold text-primary">{admins.length}</p>
            </div>
          </div>

          <div className="sm:col-span-2 bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan email admin..."
                className="w-full bg-surface border border-outline-variant/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Admin List Table */}
        <div className="bg-white rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {filteredAdmins.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl">mail_lock</span>
                </div>
                <h3 className="text-base font-bold text-primary">Belum ada email admin terdaftar</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  {searchQuery
                    ? "Tidak ditemukan email yang sesuai dengan pencarian."
                    : "Klik tombol Tambah Email Admin di atas untuk mendaftarkan akun admin baru."}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-surface/80 text-on-surface-variant text-xs uppercase font-bold tracking-wider border-b border-outline-variant/20">
                    <th className="py-4 px-6">Email Google Admin</th>
                    <th className="py-4 px-6">Status Akses Mobile</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-surface/50 transition-colors">
                      {/* Email & Name */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-primary font-mono text-sm">{admin.email}</div>
                        {admin.nama && (
                          <div className="text-xs text-on-surface-variant mt-0.5">{admin.nama}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-secondary/15 text-secondary">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          Akses Admin Aktif
                        </span>
                      </td>

                      {/* Delete Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setIsDeleteModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white px-3.5 py-1.5 rounded-xl border border-red-200 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Hapus Akses
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: TAMBAH ADMIN (HANYA EMAIL) */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-outline-variant/30">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-primary">Tambah Email Admin</h2>
                  <p className="text-xs text-on-surface-variant">Beri izin akses admin aplikasi mobile</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:text-primary p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary mb-1.5">
                  Email Akun Google Admin <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="contoh: dokter@gmail.com"
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors font-mono"
                />
                <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
                  Masukkan email Google yang akan dipakai login di aplikasi mobile TumbuhSehat.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px] text-white">save</span>
                      <span className="text-white font-bold">Simpan Email Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: KONFIRMASI HAPUS ADMIN */}
      {/* ------------------------------------------------------------- */}
      {isDeleteModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-red-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-primary">Cabut Akses Admin?</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Akses admin untuk email <strong className="text-primary font-mono">{selectedAdmin.email}</strong> akan dicabut dari aplikasi mobile.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAdmin}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
