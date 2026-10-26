# 🌟 Daily Habit Tracker

Aplikasi pelacak kebiasaan harian (*Daily Habit Tracker*) berbasis web yang dirancang untuk membantu individu membangun kebiasaan positif dan memantau konsistensi capaian target setiap hari melalui visualisasi grafik perkembangan (*progress charts*).

Dibangun dengan arsitektur bersih, modular, dan mudah dipahami pemula menggunakan **Go (Gin Framework)** di sisi backend dan **Vanilla HTML, CSS, JavaScript** di sisi frontend.

---

## 🚀 Fitur Utama

### 1. Autentikasi Pengguna yang Aman
* **Registrasi & Login Akun**: Kata sandi dienkripsi dengan aman menggunakan algoritma **bcrypt**.
* **JWT (JSON Web Token)**: Mengelola sesi login pengguna, token disimpan di `localStorage` pada sisi peramban (*browser*).
* **Validasi Kepemilikan Data**: Setiap data kebiasaan dan catatan capaian terikat dengan `user_id`. Pengguna tidak dapat melihat atau mengubah catatan milik pengguna lain.

### 2. Kelola Jenis Kebiasaan & Parameter (Halaman 2)
* Menambahkan jenis kebiasaan baru, mengedit, dan menghapus kebiasaan beserta riwayat log terkait.
* **Dukungan 2 Tipe Parameter Capaian**:
  1. **🔢 Target Angka**: Cocok untuk kebiasaan yang memiliki kuantitas atau durasi terukur (misal: *Minum Air Putih target 8 gelas*, *Membaca Buku target 15 halaman*, *Olahraga target 30 menit*).
  2. **🔘 Opsi Ya / Tidak**: Cocok untuk kebiasaan biner atau rutinitas harian (misal: *Sholat Subuh Berjamaah*, *Bangun Sebelum Jam 05.00*, *Tidak Merokok*, *Minum Vitamin*).

### 3. Pelacak Capaian Harian & Visualisasi Grafik (Halaman 3)
* **Pemilih Tanggal (*Date Picker*)**: Memungkinkan pengguna melihat dan mencatat capaian pada hari ini maupun hari-hari sebelumnya.
* **Pencatatan Cepat & Responsif**:
  * Input angka capaian riil untuk tipe angka.
  * Pilihan cepat `✓ Ya (Terpenuhi)` atau `✗ Tidak (Belum)` untuk tipe Ya/Tidak.
  * Catatan singkat opsional untuk setiap capaian.
  * Indikator *Progress Bar* langsung berubah warna menjadi hijau saat target tercapai.
* **📊 Grafik Gabungan Seluruh Kebiasaan (*Combined Multi-Line Chart*)**:
  * Menampilkan tren seluruh kebiasaan sekaligus dalam satu kanvas grafik interaktif (**Chart.js**).
  * **Normalisasi Persentase (0% s.d. 100%)**: Seluruh kebiasaan ditampilkan dalam skala persentase yang seragam agar mudah dibandingkan.
  * **Kenaikan Akumulatif Ya/Tidak**: Untuk kebiasaan bertipe Ya/Tidak, kenaikan terakumulasi sebesar $\frac{1}{\text{Jumlah Hari}} \times 100\%$ per hari "Ya" (misal $+3.3\%$ per hari pada rentang 1 bulan, sehingga mencapai $100\%$ jika konsisten selama 30 hari penuh).
  * **Interaktif**: Dapat menyembunyikan/menampilkan kebiasaan tertentu dengan mengklik nama kebiasaan pada legenda grafik.
* **📈 Grafik Tunggal per Kebiasaan**:
  * Menampilkan kurva perkembangan kebiasaan spesifik beserta garis target harian/bulanan.
* **Pilihan Rentang Waktu**: Tersedia filter rentang **1 Bulan (30 Hari)**, **2 Minggu (14 Hari)**, dan **1 Minggu (7 Hari)**.
* **Logout**: Menghapus token dari `localStorage` dan mengarahkan kembali ke halaman login.

---

## 🛠️ Stack Teknologi

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Backend Runtime** | Go (Golang) v1.21+ | Performa tinggi, efisien, dan konkurensi native |
| **Web Framework** | [Gin Gonic](https://github.com/gin-gonic/gin) | Router HTTP dan middleware REST API yang cepat |
| **ORM** | [GORM](https://gorm.io/) | Object-Relational Mapping & auto-migration |
| **Database** | PostgreSQL | Koneksi dibaca aman dari environment variable `DATABASE_URL` *(didukung fallback SQLite untuk pengujian lokal)* |
| **Autentikasi** | JWT (`golang-jwt/jwt/v5`) & `bcrypt` | Enkripsi kata sandi dan proteksi endpoint API |
| **Konfigurasi** | `godotenv` | Membaca file konfigurasi `.env` |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Tanpa framework berat, manipulasi DOM murni, `fetch()` API |
| **Visualisasi Data** | [Chart.js](https://www.chartjs.org/) | Rendering grafik garis interaktif berbasis Canvas via CDN |

---

## 📁 Struktur Folder

```text
daily habit tracker/
├── .env                      # File konfigurasi lokal aktif (diabaikan oleh git)
├── .env.example              # Template variabel lingkungan tanpa kredensial sensitif
├── .gitignore                # Mencegah file .env dan file biner masuk ke Git
├── go.mod                    # Definisi modul dan dependensi Go
├── go.sum                    # Checksum verifikasi modul Go
├── main.go                   # Titik masuk utama aplikasi & registrasi endpoint
├── README.md                 # Dokumentasi proyek
│
├── config/
│   └── database.go           # Inisialisasi GORM, PostgreSQL driver, & migrasi tabel
│
├── models/
│   ├── user.go               # Struct model User (id, name, email, password)
│   ├── habit.go              # Struct model Habit (id, user_id, name, type, target, unit)
│   └── habit_log.go          # Struct model HabitLog (id, user_id, habit_id, date, actual_value, notes)
│
├── middleware/
│   └── auth.go               # Middleware validasi JWT token & ekstraksi user_id
│
├── handlers/
│   ├── auth_handler.go       # Handler Registrasi, Login, dan Profil User
│   ├── habit_handler.go      # Handler CRUD Manajemen Kebiasaan (Halaman 2)
│   └── log_handler.go        # Handler Pencatatan Capaian Harian & Data Grafik (Halaman 3)
│
└── web/                      # Frontend statis
    ├── css/
    │   └── style.css         # Desain antarmuka modern, bersih, dan responsif
    ├── js/
    │   ├── api.js            # Helper fetch(), manajemen token, & penanganan sesi
    │   ├── auth.js           # Logika Form Login & Registrasi
    │   ├── habits.js         # Logika Tambah, Edit, & Hapus Kebiasaan
    │   └── tracker.js        # Logika Input Capaian & Rendering Chart.js
    └── pages/
        ├── login.html        # Halaman 1: Login & Registrasi
        ├── habits.html       # Halaman 2: Tambah & Edit Kebiasaan
        └── tracker.html      # Halaman 3: Pelacak Harian & Grafik Perkembangan
```

---

## ⚙️ Persyaratan Sistem & Instalasi

### 1. Prasyarat
* **Go (Golang)**: Versi 1.21 atau yang lebih baru.
* **Database**: PostgreSQL (lokal atau cloud seperti Supabase / Neon / Render).

### 2. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Buka file `.env` dan sesuaikan nilainya:
```env
# Port server aplikasi
APP_PORT=8080

# URL koneksi database PostgreSQL
# Format: postgres://username:password@host:port/database_name?sslmode=disable
DATABASE_URL=postgres://postgres:password@localhost:5432/habit_tracker?sslmode=disable

# Kunci rahasia JWT (ganti dengan string acak yang aman)
SESSION_SECRET=kunci_rahasia_jwt_anda_disini
```

> [!IMPORTANT]
> Jangan pernah membagikan atau memasukkan file `.env` yang berisi kredensial asli ke dalam repositori Git. File `.env` telah secara otomatis didaftarkan pada `.gitignore`.

---

## 🏃 Cara Menjalankan Aplikasi

1. **Masuk ke direktori proyek**:
   ```bash
   cd "daily habit tracker"
   ```

2. **Unduh seluruh dependensi**:
   ```bash
   go mod download
   ```

3. **Jalankan aplikasi**:
   * Mode Pengembangan:
     ```bash
     go run main.go
     ```
   * Atau *compile* menjadi file biner:
     ```bash
     go build -o daily-habit-tracker.exe
     ./daily-habit-tracker.exe
     ```

4. **Buka aplikasi di peramban (*browser*)**:
   Kunjungi: **[http://localhost:8080](http://localhost:8080)**

---

## 📡 Dokumentasi Endpoint REST API

Semua respons dikembalikan dalam format format JSON (`application/json`).

### 1. Autentikasi (Publik)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Mendaftarkan akun baru (`name`, `email`, `password`) |
| `POST` | `/api/auth/login` | Masuk ke akun & memperoleh token JWT |

### 2. Autentikasi & Profil (Terproteksi)
*Header Wajib*: `Authorization: Bearer <TOKEN_JWT>`

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/auth/me` | Mengambil data profil pengguna yang sedang login |

### 3. Manajemen Kebiasaan (Terproteksi)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/habits` | Mengambil seluruh daftar kebiasaan milik pengguna |
| `POST` | `/api/habits` | Membuat jenis kebiasaan baru (`name`, `type`, `target_value`, `unit`, `description`) |
| `GET` | `/api/habits/:id` | Mengambil detail kebiasaan spesifik berdasarkan ID |
| `PUT` | `/api/habits/:id` | Memperbarui data kebiasaan berdasarkan ID |
| `DELETE` | `/api/habits/:id` | Menghapus kebiasaan beserta riwayat log terkait |

### 4. Pencatatan Harian & Data Grafik (Terproteksi)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/logs` | Menyimpan / memperbarui capaian harian (`habit_id`, `date`, `actual_value`, `notes`) |
| `GET` | `/api/logs?date=YYYY-MM-DD` | Mengambil seluruh catatan capaian pada tanggal tertentu |
| `GET` | `/api/logs/chart/:habit_id?days=30` | Mengambil data riwayat capaian sebuah kebiasaan untuk grafik |
| `GET` | `/api/logs/chart-combined?days=30` | Mengambil data normalisasi gabungan seluruh kebiasaan (% capaian) |

---

## 🔒 Kebijakan Keamanan

* **Hashing Password**: Menggunakan `bcrypt` dengan *salt cost* standar industri.
* **Token Expiration**: Token JWT memiliki masa berlaku 24 jam.
* **SQL Injection & XSS Protection**: Menggunakan parameterized query via GORM serta sanitasi karakter HTML (*HTML escaping*) pada antarmuka frontend.
* **Kerahasiaan Kredensial**: String koneksi database dan kredensial sensitif tidak pernah ditampilkan pada log aplikasi maupun respons error API.

---

## 📄 Lisensi
Proyek ini dibuat untuk keperluan pembelajaran dan pengembangan aplikasi manajemen kebiasaan harian (*Daily Habit Tracker*). Bebas dimodifikasi dan dikembangkan lebih lanjut.

