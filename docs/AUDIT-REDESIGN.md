# Dokumen Audit Redesign Web Peringatan Dini Risiko Karhutla Kaltim

Dokumen ini disusun sebagai acuan teknis dan fungsional sebelum implementasi redesign tampilan web Karhutla Kaltim berdasarkan rancangan Stitch di folder `docs/desain/stitch/`. Tujuannya adalah memastikan pembaruan tampilan berjalan lancar, estetis, dan modern tanpa merusak logika pemrosesan data, kontrak antarmuka JavaScript, maupun performa akses di perangkat seluler.

---

## 1. Peta Halaman Sekarang vs Desain Baru

Desain baru mengadopsi arsitektur informasi 3 lapis:
1. **Lapis 1 (Halaman Utama Ringkas):** Ditujukan untuk masyarakat umum, petani, relawan, dan aparatur desa. Konten bersifat langsung, mudah dipahami di bawah 1 menit, dan fokus pada tindakan operasional hari ini.
2. **Lapis 2 (Halaman Detail Teknis):** Ditujukan untuk petugas lapangan, penyuluh, analis, dan akademisi yang memerlukan transparansi algoritma, rumus, fungsi keanggotaan, serta bukti validasi statistik.
3. **Lapis 3 (Tautan Terbuka untuk Peneliti):** Menyediakan tautan akses ke notebook riset (Kaggle), dataset cuaca mentah, dan kode sumber (GitHub) untuk keterbukaan sains (open science).

### Tabel Pemetaan Konten Halaman

| Halaman Lama | Halaman Baru | Folder Desain Acuan Stitch | Konten Lama yang Dipindahkan / Dipertahankan |
|---|---|---|---|
| `index.html` (Beranda & Peta) | `index.html` (Beranda Ringkas) | `beranda_desktop_...`<br>`beranda_mobile_...` | Menjadi dasbor operasional ringkas: Header baru dengan logo api kuning, Date Navigation Bar di atas peta, Hero Map Kaltim dengan floating card status hari ini di kiri dan detail titik terpilih di kanan, 3 kartu ringkasan di bawah peta (distribusi per kelas, top 5 wilayah dengan rerata skor, cari lokasi), 4 kartu panduan aksi warga, kartu tautan metodologi, dan footer navy. |
| `index.html` (Bagian Peta Interaktif) | `peta-risiko.html` (Halaman Peta Layar Penuh) | `peta_risiko_desktop_...`<br>`peta_risiko_mobile_...` | Peta Leaflet 203 titik grid dijadikan halaman khusus layar penuh (full-viewport 100vh tanpa footer). Panel melayang kiri: pemilih tanggal (11 hari) dan filter kelas bahaya (checkbox 4 kelas). Panel melayang kanan (atau bottom sheet di HP): detail titik terpilih (skor 0-100, 4 cuaca, hari tanpa hujan, anjuran aksi, tombol WhatsApp). Tombol zoom, GPS, dan layer switcher di kanan bawah. |
| `cara-kerja.html` (Bagian Hero & Ringkasan) | `cara-kerja.html` (Cara Kerja Ringkas) | `cara_kerja_desktop_...`<br>`cara_kerja_mobile_...` | Tampilan edukasi ringkas di bawah 1 menit: 4 langkah alur horizontal (01 Ambil cuaca, 02 Nilai kekeringan, 03 Nilai cuaca api, 04 Beri skor & warna), progress bar skala bahaya 0-100, kartu sorotan "Kenapa tidak pakai batas kaku?" dengan kurva pembanding, serta section "Ingin tahu lebih dalam?" berisi 5 kartu tautan menuju halaman detail teknis. |
| `cara-kerja.html` (Bagian `#variabel`) | `detail-lima-data-cuaca.html` (Detail Teknis 1) | Belum ada folder khusus (mengikuti layout 2 kolom `45_aturan_...`) | Tabel 5 variabel cuaca (suhu maks, kelembapan min, curah hujan, kecepatan angin maks, hari tanpa hujan), satuan ukuran, alasan pemilihan variabel serasah/mikroklimat, dan penjelasan ambang 3 mm. |
| `cara-kerja.html` (Bagian `#keanggotaan` & `#inferensi`) | `detail-cara-menilai-tingkat.html` (Detail Teknis 2) | Belum ada folder khusus (mengikuti layout 2 kolom `45_aturan_...`) | Logika fuzzifikasi, tabel batas persentil variabel (P10, P50, P90, BMKG) dari `data/cara_kerja.json`, visualisasi grafik SVG fungsi keanggotaan 5 variabel, tahap inferensi Mamdani (MIN, MAX, centroid), dan grafik SVG himpunan output (3 kelas & 4 kelas). |
| `cara-kerja.html` (Bagian `#aturan`) | `detail-45-aturan.html` (Detail Teknis 3) | `45_aturan_penilaian_..._desktop`<br>`45_aturan_penilaian_..._mobile` | Struktur hierarki 2 tingkat (Level 1: Indeks Kekeringan 9 aturan + Indeks Cuaca Api 27 aturan; Level 2: Skor Risiko 9 aturan gabungan), prinsip penilaian bobot bahaya 0-1-2, dan tabel matriks lengkap 45 aturan JIKA-MAKA. |
| `cara-kerja.html` (Bagian `#contoh`) | `detail-contoh-hitungan.html` (Detail Teknis 4) | Belum ada folder khusus (mengikuti layout 2 kolom `45_aturan_...`) | Pembuktian langkah demi langkah hitungan fuzzy untuk 2 data riil historis dari `data/contoh_hitung.json`, lengkap dengan nilai derajat keanggotaan 2 desimal yang diverifikasi cocok dengan `riset/uji_referensi.csv`. |
| `tentang.html` (Bagian `#percaya`) & `cara-kerja.html` (Bagian `#nyata`) | `detail-hasil-uji-satelit.html` (Detail Teknis 5) | `hasil_uji_dengan_data_satelit_..._desktop`<br>`hasil_uji_dengan_data_satelit_..._mobile` | Hasil validasi retrospektif 2019-2026 terhadap 57.105 titik panas NASA FIRMS: metrik AUC 0,802 tiga metode, kurva ROC SVG, matriks konfusi 2x2 alarm vs kenyataan, porsi hari vs porsi titik panas, stabilitas AUC 8 tahun, analisis ambang alarm, deret harian 2026, dan peta perbandingan hari aman vs berisiko 2026. |
| `tentang.html` (Bagian `#apa`, `#hitung`, `#pengembang`, `#sumber`) | `tentang.html` (Tentang Ringkas) | `tentang_desktop_...`<br>`tentang_mobile_...` | Tampilan publik ringkas: Hero kredibilitas uji 57.105 titik panas, grafik batang korelasi 4 kelas bahaya (0,70% s.d. 28,93%), 3 kartu metrik kunci (8 dari 8 tahun konsisten, 72,9% titik panas di hari alarm, siklus pembaruan 05.30 WITA), kartu "Yang Perlu Diingat" (3 keterbatasan operasional), profil Tim Pengembang (Rahmat, Fahri, Richo/Husein), serta section "Untuk Peneliti" (Kaggle, Dataset, GitHub). |

---

## 2. Kontrak HTML yang WAJIB Dipertahankan

File JavaScript di repositori (`js/peta.js`, `js/tabel.js`, `js/grafik.js`) terikat langsung pada ID elemen, class, dan atribut dataset tertentu. Jika elemen-elemen ini hilang saat redesign, skrip akan melempar error dan web berhenti bekerja.

### A. Kontrak di `js/peta.js` (Peta Leaflet & Interaksi)

| Identifier HTML / Selector | Tipe | Fungsi Teknis | Status Kepatuhan Redesign |
|---|---|---|---|
| `id="peta"` | Elemen Container | Tempat inisialisasi peta Leaflet `L.map("peta", ...)`. | Kritis, tidak boleh diubah tanpa ubah JS. |
| `id="tanggal"` | Elemen Grup | Container tombol pemilihan tanggal prakiraan (H-3 sampai H+7). Diisi dinamis lewat JS. | Kritis, tidak boleh diubah. |
| `#tanggal button` | Selektor Turunan | Menerima event listener `click` untuk mengganti layer tanggal yang aktif (`gambar(i)`). | Kritis, elemen di dalam `#tanggal` harus berupa button. |
| `id="catatan"` | Teks Peringatan | Teks penanda "Perkiraan kasar, bisa berubah." yang muncul otomatis untuk tanggal H+4 sampai H+7 (toggle atribut `hidden`). | Kritis, pertahankan ID dan atribut `hidden`. |
| `id="galat"` | Alert Pesan | Menampilkan pesan ramah jika fetch JSON gagal atau jika web dibuka tanpa web server lokal (protokol `file:`). | Kritis, pertahankan ID dan atribut `hidden`. |
| `id="diperbarui"` | Teks Status | Ditulis ulang oleh JS jika terjadi galat ("Diperbarui: belum tersedia"). | Kritis, harus ada di DOM. |
| `id="modal"` | Container Modal | Wrapper pop-up detail titik grid cuaca. Di-toggle dengan properti `hidden = true/false`. | Kritis, pertahankan ID ini untuk mekanisme pop-up/sheet. |
| `.modal-isi` | Class Elemen | Kotak dialog modal yang menerima fokus aksesibilitas (`.focus()`) saat modal dibuka. | Aman diganti class asalkan selector di `js/peta.js` disesuaikan. |
| `id="modal-badan"` | Container Konten | Tempat disuntikkannya HTML dinamis isi cuaca: suhu, kelembapan, hujan, angin, hari tanpa hujan. | Kritis, tidak boleh diubah. |
| `id="modal-judul"` | Heading Dialog | Dibuat dinamis oleh JS di dalam modal badan untuk atribut aksesibilitas `aria-labelledby`. | Wajib dipertahankan dalam struktur modal. |
| `id="tutup"` | Tombol Tutup | Menerima event `click` untuk menutup modal. | Kritis, tidak boleh diubah. |
| `id="btn-peta-saja"` | Tombol Kontrol Peta | Tombol kustom Leaflet di pojok kiri atas untuk sembunyikan/tampilkan grid kotak. Dibuat dinamis oleh Leaflet control. | Logika ada di JS, tombol membaca `id="btn-peta-saja"`. |
| `localStorage` ("karhutla_mode_peta_saja") | Penyimpanan Lokal | Menyimpan preferensi pengguna apakah sedang mengaktifkan mode peta saja atau menampilkan grid. | Kritis, logika penyimpanan di browser. |
| `fetch("data/risiko.json?t=" + ...)` | Panggilan Jaringan | Mengambil berkas JSON utama risiko 203 titik dengan proteksi cache bust timestamp. | Kritis, path URL tidak boleh diubah. |

### B. Kontrak di `js/tabel.js` (Status Utama, Ringkasan, & Tabel Kabupaten)

| Identifier HTML / Selector | Tipe | Fungsi Teknis | Status Kepatuhan Redesign |
|---|---|---|---|
| `id="hero"` | Container Section | Kartu banner risiko tertinggi se-Kaltim. JS memanipulasi atribut `data-kelas="rendah|sedang|tinggi|sangat"`. | Kritis, style CSS mengandalkan selector `[data-kelas]`. |
| `id="hero-tgl"` | Teks Tanggal | Menampilkan teks tanggal terpilih dan penanda status waktu (misal "kondisi lewat"). | Kritis, tidak boleh diubah. |
| `id="rek-kelas"` | Teks Nama Kelas | Menampilkan teks kelas risiko tertinggi ("Rendah", "Sedang", "Tinggi", "Sangat Tinggi"). | Kritis, tidak boleh diubah. |
| `id="rek-teks"` | Teks Rekomendasi | Menampilkan kalimat saran aksi resmi sesuai kelas tertinggi hari terpilih. | Kritis, tidak boleh diubah. |
| `id="diperbarui"` | Teks Waktu | Menampilkan string waktu pembaruan data ("Diperbarui: DD MMM YYYY, HH:mm WITA"). | Kritis, dipanggil via `Tabel.setPembaruan()`. |
| `id="bar"` | Container Visual | Bar distribusi horizontal yang diisi elemen `<i>` per kelas dengan inline style `flex: N 1 0`. | Kritis, pertahankan ID. |
| `id="ringkasan"` | Container List | Daftar `<ul>` jumlah titik per kelas dengan kotak warna dan angka tebal. | Kritis, pertahankan ID. |
| `id="cari"` | Input Pencarian | Field input teks filter kabupaten. JS memasang event listener `input`. | Kritis, tidak boleh diubah ID-nya. |
| `id="isi-tabel"` | Container Daftar | Elemen `<ul>` yang diisi baris kartu kabupaten beserta persentase meter dan rerata skor. | Kritis, pertahankan ID. |
| `id="kosong"` | Pesan Kosong | Elemen pemberitahuan jika hasil pencarian nihil (toggle atribut `hidden`). | Kritis, pertahankan ID dan atribut `hidden`. |
| Class dinamis yang di-generate | Class CSS | `.badge`, `.b-rendah`, `.b-sedang`, `.b-tinggi`, `.b-sangat`, `.kab`, `.kab-atas`, `.kab-nama`, `.meter`, `.k-rendah`, `.k-sedang`, `.k-tinggi`, `.k-sangat`, `.kab-info`. | Kritis di CSS baru, aturan class ini harus tetap tersedia di `css/gaya.css`. |
| Objek Global `window.Tabel` | Antarmuka JS | Menyediakan fungsi `render`, `badge`, `setPembaruan`, dan `tanggalPanjang` yang dipanggil oleh `js/peta.js`. | Kritis, jangan ubah nama fungsi publik di objek `window.Tabel`. |

### C. Kontrak di `js/grafik.js` (Halaman Tentang, Cara Kerja, & Detail Teknis)

| Identifier HTML / Selector | Tipe | Fungsi Teknis | Status Kepatuhan Redesign |
|---|---|---|---|
| `body[data-data]` | Atribut Body | Menentukan berkas data JSON yang wajib di-fetch (`validasi`, `cara_kerja`, `contoh_hitung`). | Kritis, cantumkan di tag `<body>` halaman terkait. |
| `data-grafik="e6"` | Atribut Kontainer | Me-render SVG persentase titik panas per kelas risiko. | Kritis pada halaman Tentang / Detail Satelit. |
| `data-grafik="f2"` | Atribut Kontainer | Me-render SVG perbandingan AUC tiga metode (Fuzzy, If-else, Hujan saja). | Kritis pada Detail Satelit. |
| `data-grafik="h2"` | Atribut Kontainer | Me-render SVG matriks konfusi 2x2 dan kartu metrik (Recall, Presisi, Spesifisitas, Lift). | Kritis pada Detail Satelit. |
| `data-grafik="h3"` | Atribut Kontainer | Me-render SVG perbandingan porsi hari-grid vs porsi titik panas. | Kritis pada Detail Satelit. |
| `data-grafik="h4"` | Atribut Kontainer | Me-render SVG kurva trade-off pemilihan ambang alarm (presisi/recall/F1). | Kritis pada Detail Satelit. |
| `data-grafik="h5"` | Atribut Kontainer | Me-render SVG konsistensi AUC model per tahun (2019-2026). | Kritis pada Detail Satelit. |
| `data-grafik="out-3"` | Atribut Kontainer | Me-render SVG grafik fungsi keanggotaan output 3 kelas (indeks tingkat 1). | Kritis pada Detail Menilai Tingkat. |
| `data-grafik="out-4"` | Atribut Kontainer | Me-render SVG grafik fungsi keanggotaan output 4 kelas risiko karhutla. | Kritis pada Detail Menilai Tingkat. |
| `data-grafik="mf-[var]"` | Atribut Kontainer | Me-render kurva fungsi keanggotaan: `mf-suhu`, `mf-kelembapan`, `mf-hujan`, `mf-angin`, `mf-hari_tanpa_hujan`. | Kritis pada Detail Menilai Tingkat. |
| `data-isi="batas"` | Atribut Kontainer | Menyuntikkan tabel HTML batas persentil P10, P50, P90 dari `cara_kerja.json`. | Kritis pada Detail Menilai Tingkat. |
| `data-isi="kenapa"` | Atribut Kontainer | Menyuntikkan tabel perbandingan fuzzy vs if-else (contoh kelembapan 56,9% vs 57,1%). | Kritis pada Cara Kerja / Detail Menilai Tingkat. |
| `data-isi="aturan-kekeringan"` | Atribut Kontainer | Menyuntikkan tabel matriks 9 aturan indeks kekeringan. | Kritis pada Detail 45 Aturan. |
| `data-isi="aturan-api"` | Atribut Kontainer | Menyuntikkan tabel matriks 27 aturan indeks cuaca api. | Kritis pada Detail 45 Aturan. |
| `data-isi="aturan-risiko"` | Atribut Kontainer | Menyuntikkan tabel matriks 9 aturan skor risiko final. | Kritis pada Detail 45 Aturan. |
| `data-isi="contoh-1"`, `contoh-2` | Atribut Kontainer | Menyuntikkan tabel langkah demi langkah fuzzifikasi, implikasi, agregasi, defuzzifikasi. | Kritis pada Detail Contoh Hitungan. |
| `data-isi="g2"` | Atribut Kontainer | Menyuntikkan teks keterangan gambar peta hari aman vs berisiko 2026. | Kritis pada Detail Satelit. |
| `id="lightbox"` | Elemen Dialog | Modal lightbox perbesar gambar riset (`<dialog id="lightbox">`). | Kritis jika fitur zoom gambar dipertahankan. |
| `.toc a[href^='#']` | Selektor Menu | Memasang pengamat scroll untuk memberi penanda `aria-current="true"` pada link daftar isi aktif. | Pertahankan format link jika memakai sidebar navigasi TOC. |

---

## 3. Area Terlarang (DILARANG DISENTUH)

File dan folder berikut adalah wilayah backend data dan otomasi CI/CD milik Rahmat. File-file ini tidak boleh diubah, dipindahkan, atau diganti strukturnya saat pekerjaan redesign tampilan:

1. **Folder `python/` (`fuzzy_karhutla.py`, `ambil_prakiraan.py`, `ekstrak_riset.py`):**
   - *Alasan:* Berisi algoritma logika inferensi fuzzy Mamdani, kalkulasi hari tanpa hujan berturut-turut, script penarik API Open-Meteo harian, dan script konversi data riset notebook ke JSON. Perubahan pada file ini dapat merusak konsistensi skor riset yang sudah divalidasi.
2. **Folder `data/` (`risiko.json`, `grid_kaltim.csv`, `validasi.json`, `cara_kerja.json`, `contoh_hitung.json`):**
   - *Alasan:* Merupakan satu-satunya sumber data frontend. Berkas `data/risiko.json` adalah kontrak data aktif yang diperbarui otomatis setiap pagi oleh GitHub Actions bot (`github-actions[bot]`). Jika struktur atau nama file diubah, web akan mengalami kegagalan render fatal.
3. **Folder `.github/workflows/` (`perbarui.yml`):**
   - *Alasan:* Mengatur cron job GitHub Actions yang berjalan otomatis setiap pagi sekitar pukul 05.30 WITA. Jika file ini tersentuh, pipeline pembaruan harian dapat terhenti.
4. **File `requirements.txt`:**
   - *Alasan:* Berisi daftar library Python (pandas, numpy, scikit-fuzzy, requests) untuk lingkungan GitHub Actions. Redesign tampilan berbasis HTML/CSS statis tidak memerlukan tambahan dependensi python maupun build tools node/npm.
5. **File `pratinjau.html`:**
   - *Alasan:* Berkas acuan data historis milik Rahmat. Boleh dibaca untuk mencocokkan logika render, tetapi tidak boleh diubah.

---

## 4. Fitur di Desain yang BELUM Ada di Kode

Tabel perbandingan antara mockup desain Stitch dengan fungsionalitas yang ada saat ini di repositori:

| Fitur Baru di Desain | Deskripsi Singkat Fitur | File yang Perlu Diubah | Perkiraan Kesulitan | Saran Prioritas |
|---|---|---|---|---|
| **Halaman Peta Risiko Penuh (`peta-risiko.html`)** | Peta interaktif Leaflet satu layar penuh (viewport 100vh) tanpa footer, dengan floating card panel kiri dan kanan. | Buat `peta-risiko.html`, perbarui `js/peta.js`. | Sedang | **Wajib sekarang** (pilar utama arsitektur baru). |
| **Bottom Sheet di HP (Peta Layar Seluler)** | Panel modal detail cuaca titik terpilih berbentuk laci tarik di bagian bawah layar HP, lengkap dengan handle bar dan mode ringkas. | `peta-risiko.html`, `css/gaya.css`, `js/peta.js`. | Sedang | **Wajib sekarang** (standar kenyamanan akses mobile). |
| **Filter Kelas Bahaya (Checkbox / Pill)** | Opsi checkbox untuk menyaring titik di peta berdasarkan kelas risiko (Rendah, Sedang, Tinggi, Sangat Tinggi). | `js/peta.js`, `peta-risiko.html`. | Sedang | **Wajib sekarang** (membantu petugas menyaring zona merah). |
| **Tombol Bagikan ke WhatsApp** | Tautan tombol hijau dengan icon WhatsApp untuk membagikan status peringatan titik terpilih ke WhatsApp grup/warga. | `js/peta.js`, `peta-risiko.html`. | Mudah | **Wajib sekarang** (sangat mudah dibuat dan bernilai guna tinggi). |
| **Mobile Bottom Tab Bar** | Bilah navigasi bawah tetap di HP dengan 4 menu: Beranda, Peta Risiko, Cara Kerja, Tentang. | Semua file HTML, `css/gaya.css`. | Mudah ke Sedang | **Wajib sekarang** (navigasi mobile konsisten). |
| **Peta Dasar Terang Bersih (Clean Basemap)** | Mengganti tampilan peta standar OSM ke basemap terang lembut tanpa gangguan teks usaha/toko (misalnya CartoDB Positron). | `js/peta.js`. | Sangat Mudah | **Wajib sekarang** (hanya ganti konfigurasi URL TileLayer Leaflet). |
| **Breadcrumb & Sidebar Navigasi Halaman Detail** | Navigasi breadcrumb di atas dan daftar bab navigasi 5 detail teknis di sidebar sticky. | File detail teknis, `css/gaya.css`. | Mudah | **Wajib saat halaman detail dibuat**. |
| **Pencarian Lokasi Saya & Quick Chips di Beranda** | Input pencarian lokasi di beranda yang dilengkapi tombol GPS dan chip pintasan (Paser, Samarinda, Kukar, Berau). | `index.html`, `js/tabel.js`, `js/peta.js`. | Sedang | **Bisa ditunda** (sudah ada pencarian kabupaten di tabel). |
| **Pendeteksi Lokasi GPS (`navigator.geolocation`)** | Tombol untuk mengambil koordinat pengguna, lalu mencari titik grid 0,25 derajat terdekat di Kaltim. | `js/peta.js`. | Sedang | **Bisa ditunda** (perlu penanganan izin lokasi dan pengguna di luar Kaltim). |
| **Layer Switcher (Ganti Lapisan Peta)** | Kontrol tombol layers untuk mengganti lapisan satelit atau peta dasar. | `js/peta.js`. | Sedang | **Bisa ditunda** (cukup pertahankan mode "Peta Saja" yang sudah ada). |

---

## 5. Teks dan Data di Desain yang TIDAK BOLEH Disalin (Halusinasi Stitch)

Peralatan generator antarmuka (Stitch) kerap mengarang istilah teknis, metrik statistik, dan data meteorologi. Tim dilarang menyalin teks-teks berikut secara mentah-mentah ke dalam kode implementasi:

1. **Penyebutan Istilah FDRS dan FWI:**
   - *Teks salah di Stitch:* "FDRS (Fire Danger Rating System)", "FDRS Ref: Sub-sistem B-45", "terkalibrasi FDRS Kaltim", "FDRS numerical indexes".
   - *Fakta sistem yang benar:* Sistem ini murni memakai **Sistem Fuzzy Mamdani Bertingkat**, bukan Canadian FDRS atau FWI. Jangan ada istilah FDRS di situs resmi.
2. **Klaim Pantauan Satelit Langsung (Live Satellite Hotspot Tracking):**
   - *Teks salah di Stitch:* "Live MODIS/VIIRS", "Pantauan Aktif satelit", toggle overlay "Satelit NOAA20, Terra/Aqua, Sentinel".
   - *Fakta sistem yang benar:* Peta web ini menampilkan **estimasi risiko bahaya karhutla berbasis parameter cuaca** (suhu, kelembapan, hujan, angin, hari tanpa hujan). Bukan peta titik api langsung yang sedang menyala. Satelit NASA FIRMS hanya digunakan sebagai data uji validasi model masa lalu (2019-2026).
3. **Jadwal dan Frekuensi Pembaruan Data Cuaca:**
   - *Teks salah di Stitch:* "Pembaruan otomatis tiap 6 jam sekali", "pembaruan satelit 06.00 atau 14.00", "06.00 WITA Setiap Hari".
   - *Fakta sistem yang benar:* Data diperbarui otomatis **sekali sehari setiap pagi sekitar pukul 05.30 WITA** melalui GitHub Actions yang menarik prakiraan harian Open-Meteo.
4. **Resolusi Spasial Grid:**
   - *Teks salah di Stitch:* Di beberapa bagian tertulis "0,1 derajat".
   - *Fakta sistem yang benar:* Resolusi spasial sistem adalah **0,25 derajat (sekitar 28 km)** yang menghasilkan tepat 203 titik pantauan di Kaltim.
5. **Jumlah Kabupaten/Kota:**
   - *Teks salah di Stitch:* Tertulis "10 wilayah / 10 kabupaten kota".
   - *Fakta sistem yang benar:* Wilayah yang saat ini memiliki titik grid dan tampil di tabel berjumlah **8 kabupaten/kota** (Balikpapan, Berau, Kutai Barat, Kutai Kartanegara, Kutai Timur, Paser, Penajam Paser Utara, Samarinda). Kota Bontang dan Kabupaten Mahakam Ulu belum memiliki titik grid tersendiri pada Versi 1.
6. **Ambang Batas Status Alarm yang Keliru:**
   - *Teks salah di Stitch:* Pada matriks konfusi tertulis "Alarm Aktif: Skor ≥ 0,65" dan "Tanpa Alarm: Skor < 0,65".
   - *Fakta sistem yang benar:* Skala skor keluaran sistem adalah rentang bulat **0 sampai 100**. Status alarm terjadi ketika risiko berada pada kelas **Tinggi (skor 50-75)** dan **Sangat Tinggi (skor 75-100)**, yaitu **skor ≥ 50**, bukan 0,65.
7. **Metrik dan Angka Statistik Karangan:**
   - *Teks salah di Stitch:* "Tingkat akurasi komparatif > 82.4%", "Radius penyangga 5 km", "Sampel validasi 572.460 titik-hari divalidasi dengan radius 5 km", "Durasi pemrosesan ~45 detik".
   - *Fakta sistem yang benar:* Angka validasi resmi yang tertera di PRD dan `data/validasi.json` adalah: **AUC 0,802**, 57.105 titik panas NASA FIRMS (2019-2026), 572.460 hari-grid, korelasi Spearman bulanan 0,666, dan pencocokan spasial grid sel 0,25 derajat tanpa radius penyangga 5 km.
8. **Label Usaha Komersial (POI) di Peta:**
   - *Mockup Stitch:* Sering menyertakan pin usaha komersial atau toko lokal.
   - *Fakta sistem yang benar:* Peta publik harus bersih dari label tempat bisnis. Hanya menampilkan batas wilayah geografis, aliran sungai utama, dan nama ibukota kabupaten/kota.
9. **Bentuk Poligon Wilayah vs Kotak Grid:**
   - *Mockup Stitch:* Menampilkan batas wilayah administratif kabupaten yang diwarnai seperti peta poligon vektor.
   - *Fakta sistem yang benar:* Model riset ini direpresentasikan dalam bentuk **203 kotak grid reguler** (persegi ukuran ~28 km), bukan poligon batas kabupaten.

---

## 6. Catatan Teknis Desain

### A. Teknologi pada Mockup Stitch
File `code.html` dari Stitch disusun menggunakan:
1. Skrip Play CDN Tailwind: `<script src="https://cdn.tailwindcss.com">`.
2. Font eksternal Google Fonts: Public Sans, IBM Plex Sans, IBM Plex Mono, dan Material Symbols Outlined.
3. Struktur inline CSS utility yang sangat padat.

### B. Kesesuaian dengan Arsitektur Repositori Saat Ini
1. Repositori ini memiliki aturan tegas di `PRD.md` dan `AGENTS.md`: **HTML5, CSS3 murni (`css/gaya.css`), Vanilla JavaScript, dan Leaflet.js CDN. DILARANG menggunakan framework, bundler, npm build step, maupun library berat.**
2. Menggunakan `cdn.tailwindcss.com` di lingkungan produksi web GitHub Pages memiliki kelemahan serius:
   - Ukuran library Tailwind CDN mencapai sekitar 3 MB yang harus diunduh dan diproses di browser klien setiap kali halaman dibuka.
   - Mengakibatkan beban komputasi CPU berlebih pada ponsel spesifikasi rendah dan menimbulkan kedipan tampilan (Flash of Unstyled Content / FOUC).
   - Menghambat target non-fungsional PRD: **target load di HP di bawah 3 detik pada koneksi seluler**.

### C. Rekomendasi Arsitektur CSS
- **Sangat Direkomendasikan: Desain Stitch diterjemahkan ke dalam CSS Vanilla murni di `css/gaya.css`.**
- *Keuntungan:*
  - Waktu muat instan: CSS murni hanya berukuran belasan kilobyte, di-cache secara permanen oleh browser, dan tidak memerlukan eksekusi compiler JS.
  - Mematuhi aturan PRD dan AGENTS.md sepenuhnya.
  - Ringan dan mulus dijalankan di ponsel Android milik petani maupun relawan di area dengan sinyal seluler terbatas.
  - Mudah dirawat oleh Pengembang B tanpa perlu memasang node_modules, webpack, atau vite.
- *Strategi Implementasi:*
  - Ambil nilai token desain dari `DESIGN.md` Stitch (palet warna `#001527`, `#0B2A42`, `#F8F9FB`, `#D5DCE3`, warna status `#3A9D5D`, `#F2C94C`, `#E46A2E`, `#9B1C1C`, sudut rounded 8px) dan deklarasikan sebagai CSS Custom Properties (`:root { ... }`) di `css/gaya.css`.
  - Untuk ikon navigasi dan cuaca: gunakan SVG inline ringkas yang tajam dan ringan (seperti yang sudah terbukti efisien di `index.html`), daripada memuat webfont raksasa Material Symbols yang memakan bandwidth.

---

## 7. Kepemilikan File dan Koordinasi Tim

Berdasarkan pembagian kerja resmi di `AGENTS.md` dan `PRD.md`:
- **Pengembang A (Fahri):**
  - Bertanggung jawab atas peta Leaflet, pewarnaan 203 grid, kontrol tanggal, dan interaksi spasial di `js/peta.js` serta elemen peta di HTML.
- **Pengembang B (Richo / Husein):**
  - Bertanggung jawab atas struktur UI, kartu status, ringkasan risiko, tabel kabupaten di `js/tabel.js`, gaya visual di `css/gaya.css`, teks informasi di `index.html`, serta halaman `tentang.html` dan `cara-kerja.html`.
- **Rahmat Riyadi:**
  - Bertanggung jawab atas pipeline data, model fuzzy, dan otomasi di `python/`, `data/`, dan `.github/workflows/`.

### Matriks File yang Terdampak Redesign

| Berkas | Pemilik Utama | Perubahan Saat Redesign | Catatan Koordinasi |
|---|---|---|---|
| `css/gaya.css` | Pengembang B | Pembaruan total sistem desain (token warna baru, layout grid, kartu, bottom bar mobile). | Disarankan dibuat bertahap agar tidak merusak tampilan lama sebelum halaman baru siap. |
| `index.html` | Pengembang A & B | Perubahan tata letak Beranda: Map Hero band, date navigation bar, 3 kartu ringkasan, panduan aksi warga. | Perlu koordinasi antara A (kontainer peta) dan B (hero card, tabel, footer). |
| `peta-risiko.html` (Baru) | Pengembang A | Halaman peta fullscreen khusus, kontrol floating panels, bottom sheet HP. | Menjadi tanggung jawab utama Fahri (Pengembang A). |
| `js/peta.js` | Pengembang A (Fahri) | Penambahan fitur filter kelas bahaya, integrasi tombol WhatsApp, penyesuaian event bottom sheet/modal. | Hanya boleh diedit oleh Pengembang A atau atas izinnya. |
| `js/tabel.js` | Pengembang B | Penyesuaian selektor render DOM untuk mengisi 3 kartu ringkasan baru di Beranda. | Pengembang B memperbarui fungsi `render()` dan `isiTabel()`. |
| `cara-kerja.html` | Pengembang B | Perombakan halaman metode menjadi format ringkas di bawah 1 menit dengan 5 tautan detail. | Pengembang B merapikan teks dan diagram alur. |
| `tentang.html` | Pengembang B | Perombakan halaman tentang menjadi format ringkas dengan kartu metrik dan bagian peneliti. | Pengembang B menyusun tata letak baru. |
| File Detail Teknis (Baru) | Pengembang B | Membuat 5 file HTML detail teknis (Lima data cuaca, Cara menilai tingkat, 45 aturan, Contoh hitungan, Hasil uji satelit). | Menghubungkan script `js/grafik.js` untuk render data riset. |

---

## 8. Urutan Kerja yang Disarankan

Pekerjaan redesign disarankan dipecah menjadi 7 tahapan kecil yang aman dan dapat diuji secara mandiri (satu commit per tahap):

### Tahap 1: Fondasi Desain & Token Warna CSS (`css/gaya.css`)
- **Tindakan:** Masukkan variabel CSS (warna `#0B2A42`, `#F8F9FB`, `#D5DCE3`, warna status risiko, radius 8px) dan font Public Sans / IBM Plex Sans ke `css/gaya.css`. Rapikan gaya tombol dan kartu dasar.
- **Cara Menguji di Lokal:** Jalankan `python -m http.server 8000`, buka `http://localhost:8000/index.html`. Pastikan fungsi peta, tombol tanggal, dan tabel tetap bekerja 100% tanpa ada layout yang patah.

### Tahap 2: Pembuatan Halaman Peta Risiko Layar Penuh (`peta-risiko.html`)
- **Tindakan:** Buat halaman baru `peta-risiko.html` khusus peta layar penuh (100vh) mengacu pada folder Stitch `peta_risiko_desktop` dan `peta_risiko_mobile`. Tambahkan filter checkbox kelas bahaya, tombol share WhatsApp, dan bottom sheet di layar mobile.
- **File Terdampak:** `peta-risiko.html`, `js/peta.js`, `css/gaya.css`.
- **Cara Menguji di Lokal:** Buka `http://localhost:8000/peta-risiko.html`. Uji klik titik grid, ganti tanggal H-3 s.d. H+7, uncheck kelas Sedang/Rendah (pastikan grid tersembunyi), dan uji toggle bottom sheet pada mode inspeksi mobile (DevTools).

### Tahap 3: Pembaruan Halaman Beranda (`index.html`)
- **Tindakan:** Perbarui struktur `index.html` sesuai desain Beranda Stitch: bilah tanggal di atas peta, floating card status tertinggi di atas peta, 3 kartu ringkasan di bawah peta (distribusi per kelas, wilayah tertinggi, pencarian lokasi), 4 kartu panduan aksi, dan tautan metodologi. Sesuaikan `js/tabel.js` agar mengisi elemen baru tersebut.
- **File Terdampak:** `index.html`, `js/tabel.js`, `css/gaya.css`.
- **Cara Menguji di Lokal:** Buka `http://localhost:8000/index.html`. Pastikan tanggal berpindah dengan mulus, progress bar kelas terisi proporsional, daftar wilayah terurut dari rerata tertinggi, dan fitur cari kabupaten tetap berfungsi.

### Tahap 4: Redesign Halaman Cara Kerja Ringkas (`cara-kerja.html`)
- **Tindakan:** Rombak `cara-kerja.html` menjadi halaman ringkas (bacaan di bawah 1 menit): hero, diagram alur 4 langkah, visualisasi skala risiko 0-100, kartu pembanding batas kaku vs bertahap, dan 5 kartu tautan menuju halaman detail teknis.
- **File Terdampak:** `cara-kerja.html`, `css/gaya.css`.
- **Cara Menguji di Lokal:** Buka `http://localhost:8000/cara-kerja.html`. Pastikan semua elemen teks komunikatif, layout responsif, dan tautan siap mengarah ke dokumen detail.

### Tahap 5: Redesign Halaman Tentang Ringkas (`tentang.html`)
- **Tindakan:** Rombak `tentang.html` menjadi ringkasan kredibilitas sistem: hero uji satelit 57.105 titik api, 4 kartu korelasi kelas bahaya, 3 kartu metrik kunci, catatan keterbatasan operasional, profil tim pengembang, dan section "Untuk Peneliti" (Kaggle, Dataset, GitHub).
- **File Terdampak:** `tentang.html`, `css/gaya.css`.
- **Cara Menguji di Lokal:** Buka `http://localhost:8000/tentang.html`. Pastikan tidak ada data karangan dan seluruh tautan eksternal berfungsi dengan baik.

### Tahap 6: Pembuatan 5 Halaman Detail Teknis
- **Tindakan:** Buat 5 halaman detail teknis dengan layout dokumentasi 2 kolom (sidebar daftar bab di kiri, isi teknis di kanan):
  1. `detail-lima-data-cuaca.html` (dari bagian variabel lama).
  2. `detail-cara-menilai-tingkat.html` (dari fungsi keanggotaan & inferensi lama, panggil `js/grafik.js`).
  3. `detail-45-aturan.html` (mengikuti desain Stitch `45_aturan_...`).
  4. `detail-contoh-hitungan.html` (dari contoh hitungan langkah demi langkah lama).
  5. `detail-hasil-uji-satelit.html` (mengikuti desain Stitch `hasil_uji_...`).
- **File Terdampak:** 5 berkas HTML baru, `css/gaya.css`, `css/artikel.css`.
- **Cara Menguji di Lokal:** Buka setiap halaman di browser, pastikan script `js/grafik.js` berhasil memuat data dari `data/validasi.json`, `data/cara_kerja.json`, dan `data/contoh_hitung.json` tanpa error di console.

### Tahap 7: Navigasi Mobile Bawah & Penyetelan Aksesibilitas
- **Tindakan:** Pasang bilah navigasi bawah (bottom tab bar) tetap pada layar HP (< 768px) di semua halaman publik utama. Periksa rasio kontras teks (WCAG 2.1 AA) dan pastikan target sentuh tombol minimal 44x44 px.
- **File Terdampak:** Semua file HTML, `css/gaya.css`.
- **Cara Menguji di Lokal:** Uji performa di DevTools dengan simulasi jaringan 3G dan layar smartphone. Pastikan waktu muat di bawah 3 detik dan navigasi antar halaman terasa responsif tanpa hambatan.
