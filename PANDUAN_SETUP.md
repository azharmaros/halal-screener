# Panduan Setup: Halal Stock Screener
## Netlify (hosting) + Firebase (database)

---

## Bagian 1 — Firebase (Database)

### Langkah 1: Buat project Firebase
1. Buka https://console.firebase.google.com
2. Klik **"Add project"** → beri nama (misal: `halal-screener`) → klik Continue
3. Matikan Google Analytics (tidak perlu) → klik **Create project**
4. Tunggu sampai selesai → klik **Continue**

### Langkah 2: Aktifkan Firestore
1. Di sidebar kiri, klik **Build → Firestore Database**
2. Klik **Create database**
3. Pilih **"Start in production mode"** → klik Next
4. Pilih lokasi server: pilih **asia-southeast1 (Singapore)** → klik **Enable**
5. Tunggu Firestore selesai dibuat

### Langkah 3: Atur security rules Firestore
1. Di halaman Firestore, klik tab **Rules**
2. Ganti isi rules dengan ini:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Siapa saja boleh baca
    match /stocks/latest {
      allow read: if true;
      allow write: if false; // write hanya lewat Functions
    }
  }
}
```

3. Klik **Publish**

### Langkah 4: Ambil API Key dan Project ID
1. Di sidebar kiri, klik ikon ⚙️ (gear) → **Project settings**
2. Di tab **General**, scroll ke bawah ke bagian **"Your apps"**
3. Klik ikon **"</>"** (Web app) → beri nama → klik **Register app**
4. Salin nilai:
   - `apiKey` → ini adalah **FIREBASE_API_KEY**
   - `projectId` → ini adalah **FIREBASE_PROJECT_ID**
5. Klik **Continue to console**

---

## Bagian 2 — Netlify (Hosting)

### Langkah 5: Upload project ke GitHub
> Ini cara paling mudah untuk deploy ke Netlify.

1. Buka https://github.com → login → klik **New repository**
2. Beri nama repo (misal: `halal-screener`) → pilih **Private** → klik **Create repository**
3. Upload semua file project (index.html, netlify.toml, netlify/functions/):
   - Klik **"uploading an existing file"**
   - Drag & drop semua file dan folder
   - Klik **Commit changes**

### Langkah 6: Deploy ke Netlify
1. Buka https://app.netlify.com → login (bisa pakai akun GitHub)
2. Klik **"Add new site" → "Import an existing project"**
3. Pilih **GitHub** → authorize → pilih repo `halal-screener`
4. Di bagian **Build settings**:
   - Build command: *(kosongkan)*
   - Publish directory: `.`
5. Klik **Deploy site**
6. Tunggu deploy selesai (biasanya < 1 menit)
7. Netlify akan memberi subdomain otomatis seperti `random-name-123.netlify.app`
   - Bisa diganti: **Site configuration → Change site name**

### Langkah 7: Tambahkan Environment Variables
1. Di dashboard Netlify, klik site Anda
2. Klik **Site configuration → Environment variables**
3. Klik **"Add a variable"**, tambahkan satu per satu:

| Key | Value |
|-----|-------|
| `FIREBASE_PROJECT_ID` | (project ID dari langkah 4) |
| `FIREBASE_API_KEY` | (API key dari langkah 4) |
| `UPLOAD_SECRET` | (buat password Anda sendiri, misal: `Halal@2025!`) |

4. Setelah semua ditambahkan, klik **"Trigger deploy"** (agar env vars aktif)

---

## Bagian 3 — Tes & Penggunaan

### Langkah 8: Tes pertama
1. Buka URL Netlify Anda
2. Halaman akan tampil tulisan **"Database kosong"** — ini normal
3. Klik tombol **"Update Data"** di kanan atas
4. Upload 3 file CSV (TradingView, Musaffa, XTB)
5. Masukkan secret key yang Anda buat di langkah 7
6. Klik **"Simpan ke Database"**
7. Data akan langsung tampil

### Penggunaan selanjutnya
- Pengunjung biasa: buka URL → data langsung tampil, tidak perlu upload apapun
- Anda ingin update data: klik **"Update Data"** → upload 3 CSV baru → masukkan secret key → simpan
- Data lama akan **tertimpa** otomatis dengan data baru

---

## Troubleshooting

**"Gagal memuat data: Fetch gagal"**
→ Pastikan Netlify Functions sudah aktif. Buka tab **Functions** di dashboard Netlify.
→ Pastikan sudah trigger deploy ulang setelah menambah environment variables.

**"Error: Unauthorized: secret key salah"**
→ Pastikan `UPLOAD_SECRET` di Netlify sama persis dengan yang Anda ketik di form.

**"Tidak ada saham yang lolos filter"**
→ Buka DevTools (F12) → Console → cek log "Kolom terdeteksi" untuk debug kolom CSV.

**Firestore error 403**
→ Pastikan Security Rules sudah di-publish (langkah 3).
→ Pastikan `FIREBASE_API_KEY` sudah benar.
