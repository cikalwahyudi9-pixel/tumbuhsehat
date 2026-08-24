# PRD — TumbuhSehat
### Aplikasi Monitoring Deteksi Dini Perawakan Pendek (Stunting) pada Anak

---

## 1. Latar Belakang

Terinspirasi dari tema webinar "Deteksi Dini dan Tatalaksana pada Anak Perawakan Pendek" (kerja sama UK Endokrin Anak IDAI Jatim & IDI). Aplikasi ini membantu orang tua memantau tumbuh kembang anak secara rutin, dan membantu tenaga kesehatan (dokter/puskesmas) memantau serta menindaklanjuti kasus di wilayahnya.

---

## 2. Arsitektur Platform: Website (Pendaftaran Admin) + Mobile App (Utama)

Aplikasi dibagi menjadi 2 platform dengan fungsi berbeda:

| Platform | Fungsi | Digunakan oleh |
|---|---|---|
| **Website** | Landing page + form pendaftaran admin (upload STR/SIP, wilayah kerja) + dashboard approval superadmin | Calon admin & superadmin |
| **Mobile App** | Aplikasi utama sehari-hari — satu tombol login untuk semua, otomatis routing sesuai role | Orang tua & admin yang sudah diverifikasi |

Orang tua **tidak pernah melihat opsi/tombol pendaftaran admin** karena flow tersebut sepenuhnya berada di website, terpisah dari mobile app.

### Metode Login
- **Google Sign-In (OAuth 2.0 via Firebase Auth)** — dipakai di web maupun mobile
- Satu tombol Google Login yang sama untuk semua orang di mobile app — tidak ada tombol "Login Admin" terpisah

### Prinsip Kunci: Deteksi Role Berdasarkan UID, Bukan Email
Satu akun Google selalu menghasilkan **UID Firebase yang identik**, baik saat login dari website maupun mobile app (selama dalam project Firebase yang sama). Maka:
- Pendaftaran & penyimpanan role admin **wajib menggunakan `uid` sebagai kunci utama**, bukan email
- Email hanya dipakai untuk tampilan/identifikasi, bukan untuk pencocokan data

### Flow Pendaftaran Admin (di Website)
```
1. Calon admin buka website -> "Daftar sebagai Tenaga Kesehatan"
2. Login dengan Google -> dapat uid & email
3. Isi form: nama, wilayah kerja, institusi, upload STR/SIP
4. Data tersimpan ke Firestore:
   adminApplications/{uid}
     - email, uid, name, dokumen, wilayah
     - status: "pending"
5. Superadmin login di website -> review pengajuan -> Approve/Reject
6. Jika di-approve, Cloud Function otomatis:
   - Update/buat users/{uid} dengan role: "admin", adminStatus: "verified"
   - Set Firebase Custom Claim { role: "admin" } pada uid tsb
```

### Flow Login di Mobile App (Satu Pintu untuk Semua)
```
1. User/Admin tap "Masuk dengan Google" (tombol tunggal, sama untuk semua)
2. Firebase Auth mengembalikan uid, email, displayName, photoURL
3. App cek custom claims & Firestore users/{uid}:
   - uid tidak terdaftar sama sekali -> auto-buat sebagai role "parent" (default)
   - uid terdaftar dgn claim role: "admin" & status verified -> masuk Dashboard Admin
   - uid terdaftar sbg admin tapi status "pending" -> halaman "Menunggu Verifikasi"
4. Redirect otomatis ke UI sesuai role (bukan pilihan manual dari user)
```

### Role-based Access Control
- **Firebase Custom Claims** (`role: "parent"` / `role: "admin"`) di-set via Cloud Function saat superadmin approve di website — bukan disembunyikan hanya di level tampilan
- **Firestore Security Rules** membatasi akses baca/tulis data berdasarkan claim ini, sehingga meskipun seseorang mencoba mengakses screen admin, data tetap terkunci jika claim tidak sesuai
- Deteksi role bersifat **real-time & otomatis** — tidak perlu proses manual tambahan di sisi user saat login di mobile

---

## 3. Fitur per Role

### A. User (Orang Tua)
| Fitur | Deskripsi |
|---|---|
| Login Google | Onboarding cepat, tanpa isi form panjang |
| Profil Anak | Tambah 1+ anak: nama, tanggal lahir, jenis kelamin, foto |
| Input Pengukuran | Input tinggi badan & berat badan bulanan |
| Grafik Pertumbuhan | Plot otomatis ke kurva WHO/CDC (height-for-age z-score) |
| Status Alert | Badge otomatis: Normal / Waspada / Rujuk ke Dokter |
| Riwayat | List histori pengukuran per anak |
| Edukasi | Artikel/video singkat gizi & growth hormone |
| Booking Konsultasi | Ajukan konsultasi ke dokter terdaftar (terintegrasi WhatsApp) |
| Reminder | Notifikasi jadwal ukur bulanan & imunisasi |

### B. Admin (Dokter / Puskesmas / Tenaga Kesehatan)
| Fitur | Deskripsi |
|---|---|
| Login Google + Verifikasi | Daftar dengan Google, menunggu approval superadmin (upload STR/SIP) |
| Dashboard Wilayah | List semua anak di wilayah binaan, filter status (Normal/Waspada/Rujuk) |
| Detail Rekam Anak | Grafik pertumbuhan, riwayat lengkap, data orang tua |
| Catatan Tindak Lanjut | Admin bisa kirim catatan/rekomendasi ke akun user terkait |
| Statistik Agregat | Chart: % anak stunting per bulan, tren wilayah |
| Export Laporan | Export PDF/Excel untuk laporan ke Dinkes |
| Approval Tenaga Kesehatan | Superadmin menyetujui/menolak pendaftaran admin baru |

---

## 4. Struktur Database (Firestore)

```
users/{uid}                          # dokumen id = Firebase Auth UID (kunci utama)
  - name, email, photoURL
  - role: "parent" | "admin" | "superadmin"
  - adminStatus: "pending" | "verified" | "rejected"  (khusus admin)
  - region: string (khusus admin, wilayah binaan)
  - createdAt

children/{childId}
  - parentId: ref(users)
  - name, birthDate, gender
  - photoURL
  - createdAt

measurements/{measurementId}
  - childId: ref(children)
  - height (cm), weight (kg)
  - measuredAt: timestamp
  - zScore: number (dihitung otomatis)
  - status: "normal" | "waspada" | "rujuk"

followUpNotes/{noteId}
  - childId: ref(children)
  - adminId: ref(users)
  - note: string
  - createdAt

consultations/{consultId}
  - parentId, childId, adminId
  - status: "requested" | "scheduled" | "done"
  - scheduledAt

adminApplications/{uid}              # dokumen id = Firebase Auth UID (bukan email)
  - email, uid, name
  - str/sip document URL, institusi, wilayah kerja
  - status: "pending" | "verified" | "rejected"
  - reviewedBy: ref(superadmin)
  - submittedAt, reviewedAt
```

---

## 5. Tech Stack Rekomendasi

| Layer | Tools |
|---|---|
| Frontend Mobile (utama) | React Native (Expo) atau Flutter |
| Frontend Website (pendaftaran admin) | React / Next.js (mengikuti pola JasaGeh Lampung) |
| Auth | Firebase Authentication (Google Sign-In) — dipakai bersama web & mobile |
| Database | Cloud Firestore — satu project Firebase untuk web & mobile |
| Storage | Firebase Storage (foto anak, dokumen STR/SIP admin) |
| Notifikasi | Firebase Cloud Messaging |
| Chart | Victory Native / React Native Chart Kit |
| Backend logic | Cloud Functions (hitung z-score, approve admin, set custom claims, export laporan) |
| Integrasi Konsultasi | WhatsApp Business API (mengikuti pola bot yang pernah kamu buat) |

> Catatan penting: website dan mobile app **wajib terhubung ke project Firebase yang sama** agar UID akun Google konsisten di kedua platform.

---

## 6. Alur Layar Utama (User)

1. Splash → Login Google
2. Home (list anak) → Tambah Anak
3. Detail Anak → Grafik Pertumbuhan → Tambah Pengukuran
4. Notifikasi Status (jika "Rujuk") → CTA "Booking Konsultasi"
5. Edukasi (tab terpisah)

## 7. Alur Layar Utama (Admin)

1. Splash → Login Google → (jika belum verified) Form Upload STR/SIP → Halaman Menunggu
2. Dashboard (list anak binaan + filter status)
3. Detail Anak → Tambah Catatan Tindak Lanjut
4. Statistik Wilayah (chart)
5. Export Laporan

---

## 8. Alur Layar Website (Pendaftaran Admin)

1. Landing page → tombol "Daftar sebagai Tenaga Kesehatan"
2. Login Google → Form pendaftaran (nama, institusi, wilayah kerja, upload STR/SIP)
3. Halaman konfirmasi "Pengajuan terkirim, menunggu verifikasi"
4. (Superadmin) Login → Dashboard daftar pengajuan → Detail pengajuan → Approve/Reject
5. Setelah approve, sistem otomatis kirim notifikasi/email bahwa akun sudah aktif dan bisa dipakai login di mobile app

## 9. Next Steps
- [ ] Setup Firebase project (satu project untuk web & mobile) + aktifkan Google Sign-In provider
- [ ] Bangun website pendaftaran admin (form + dashboard superadmin)
- [ ] Desain wireframe UI mobile (Figma / langsung prototype React Native)
- [ ] Implementasi rumus z-score WHO growth standard
- [ ] Buat Cloud Function untuk approval admin (set custom claims berdasarkan UID) & export laporan
