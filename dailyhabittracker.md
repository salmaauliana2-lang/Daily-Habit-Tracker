Project Specification — Daily Habit Tracker

Tugas 1: Isi spesifikasi aplikasi sebelum mulai melakukan vibe coding.



Tentukan kebutuhan aplikasi dan pilih teknologi yang akan digunakan. Jangan mulai membuat kode sebelum spesifikasi selesai.



1\. Informasi Aplikasi

Nama aplikasi:

\[Daily Habit Tracker]



Deskripsi aplikasi:

\[Membuat dan memantau kebiasaan sehari-hari sesuai target capaian yang diisi sesuai parameter masing-masing dari jenis kebiasaan yang ingin dibangun.]



Target pengguna:

\[individu]



Masalah yang ingin diselesaikan:

\[membangun kebiasaan baru dan memantau konsistensi individu dalam mencapai targetnya setiap hari melalui grafik perkembangan progress capaian]



2\. Kebutuhan Aplikasi

Fitur utama aplikasi:



\[Halaman 1 : Register, Login]

\[Halaman 2 : menambahkan dan mengedit jenis kebiasaan dan parameternya, memilih tanggal]

\[Halaman 3 : mengisi parameter sesuai jenis kebiasaan, melihat grafik perkembangan dari setiap jenis kebiasaan, logout]



contoh jenis dan parameternya:

bangun sebelum jam 05.00 (ya/tidak)

tidur sebelum jam 22.00 (ya/tidak)

olahraga (ya/tidak)

sarapan protein (ya/tidak)

kondisi kulilt (nilai 1-3)

kondisi mood (emot senyum, datar, dan cemberut)



3\. Pilihan Teknologi

Pilih satu opsi untuk setiap komponen yang diperlukan. Sesuaikan dengan kebutuhan aplikasi. isiskan \[x] hanya satu saja



A. Backend Framework

\[ ] 1. Go Standard Library (net/http)

\[x] 2. Gin

\[ ] 3. Lainnya sebutkan

Pilihan saya: 2



B. ORM (Object-Relational Mapping)

\[ ] 1. Tidak menggunakan ORM (SQL manual)

\[x] 2. GORM

\[ ] 3. Lainnya sebutkan

Pilihan saya: 2



Ketentuan: \[memakai Gin dan Gorm]



C. Database

\[x] 1. PostgreSQL

\[ ] 2. MySQL

\[ ] 3. SQLite

Pilihan saya: 1



D. Frontend

\[x] 1. HTML, CSS, JavaScript murni

\[ ] 2. React

\[ ] 3. Vue

Pilihan saya: 1



E. Sistem Autentikasi

\[ ] 1. Session

\[x] 2. JWT

Pilihan saya: 2



Ketentuan: Gunakan JWT berbasis server untuk mengelola status login pengguna.



F. Penyimpanan Sesi atau Token

\[ ] 1. Cookie

\[x] 2. localStorage

\[ ] 3. Tidak diperlukan

Pilihan saya: 2



Ketentuan: Simpan ID session dalam localStorage dengan pengaturan keamanan yang sesuai.



G. API

\[x] 1. REST API

\[ ] 2. Tidak membutuhkan API terpisah

Pilihan saya: 1



Ketentuan: Backend menyediakan REST API untuk autentikasi dan pengelolaan catatan. Frontend mengakses API menggunakan fetch().



H. Version Control

\[x] 1. Git

\[ ] 2. Tidak menggunakan Git

Pilihan saya: 1



4\. Detail Autentikasi

Registrasi akun: Ya



Login: Ya



Logout: Ya



Role pengguna: User saja. Tidak ada role Admin.



Aturan akses:



Pengguna harus login untuk mengakses catatan.

Pengguna yang belum login hanya dapat mengakses halaman Login dan Register.

Setiap catatan harus memiliki user\_id sebagai pemiliknya.

Backend harus memeriksa kepemilikan catatan pada setiap operasi melihat detail, mengedit, dan menghapus.

Pengguna tidak boleh melihat atau mengubah catatan pengguna lain, termasuk dengan mengubah ID pada URL atau request API.

Password harus disimpan dalam bentuk hash menggunakan algoritma yang sesuai, bukan sebagai teks biasa.

Setelah logout, session harus dinonaktifkan dan cookie session dibersihkan.

5\. Konfigurasi Environment dan Database

Ketentuan wajib:



Semua konfigurasi aplikasi yang sensitif harus menggunakan environment variable.

Gunakan file .env untuk konfigurasi saat pengembangan lokal.

Sediakan file .env.example sebagai contoh konfigurasi tanpa kredensial asli.

File .env tidak boleh dimasukkan ke Git.

URL atau connection string PostgreSQL harus dibaca dari environment variable bernama DATABASE\_URL.

Jangan menulis URL database, username, password database, session secret, atau kredensial lainnya secara langsung di kode.

Aplikasi harus memberikan pesan error yang jelas jika konfigurasi wajib belum tersedia, tanpa membocorkan password atau rahasia lainnya.

Contoh .env.example:



APP\_PORT=8080

DATABASE\_URL=postgres://username:password@localhost:5432/personal\_notes?sslmode=disable

SESSION\_SECRET=replace-with-a-random-secret



Catatan: Nilai di atas hanya contoh untuk pengembangan lokal. Gunakan kredensial dan session secret milik sendiri pada file .env. Untuk database produksi, gunakan konfigurasi SSL sesuai persyaratan penyedia database.



6\. Batasan Pengembangan

Struktur folder sederhana.

Kode mudah dipahami pemula.

Memisahkan frontend dan backend.

Menggunakan environment variable untuk konfigurasi.

Membuat pengujian dasar.

Menjelaskan kode dan perubahan yang dibuat AI.



6\. Fitur yang Tidak Dibutuhkan

Akan ditulis setelah uji coba aplikasi



7\. Pemeriksaan Sebelum Vibe Coding

Nama dan tujuan aplikasi sudah jelas.

Fitur utama sudah ditentukan.

Pilihan teknologi sudah diisi.

Kebutuhan autentikasi sudah ditentukan.

Batasan proyek sudah ditentukan.

Penggunaan .env dan DATABASE\_URL sudah ditentukan.

Status spesifikasi: Siap untuk diperiksa dan disetujui sebelum implementasi.



8\. Instruksi untuk Agy

Baca dan pahami file dailyhabittracker.md secara lengkap.



Gunakan spesifikasi ini sebagai acuan utama pengembangan.



Periksa apakah spesifikasi sudah lengkap dan konsisten.

Tanyakan jika ada informasi penting yang belum jelas.

Usulkan struktur folder sederhana sesuai teknologi yang dipilih.

Jelaskan fungsi folder dan file utama.

Jangan langsung membuat seluruh aplikasi sekaligus.

Jangan membuat, mengubah, atau menghapus file sebelum saya menyetujui usulan struktur folder.

Implementasikan aplikasi secara bertahap setelah mendapat persetujuan.

Jelaskan perubahan kode dan cara menguji setiap tahap.

Jangan mengganti teknologi atau menambahkan dependensi tanpa menjelaskan alasannya dan meminta persetujuan saya.

Pastikan DATABASE\_URL dibaca dari environment variable dan tidak pernah di-hardcode.

Pastikan .env masuk ke .gitignore, sementara .env.example boleh disimpan di Git.

Jangan menampilkan nilai rahasia dari .env pada log atau respons API.

