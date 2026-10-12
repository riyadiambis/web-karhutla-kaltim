# Web Peringatan Dini Risiko Karhutla Kalimantan Timur

Web statis yang menyajikan sistem peringatan dini **risiko** kebakaran hutan dan lahan (karhutla) harian di Kalimantan Timur. Sistem ini mengevaluasi tingkat kerentanan lingkungan berdasarkan dinamika parameter meteorologis, **bukan** meramalkan atau memastikan kejadian kebakaran secara deterministik.

---

## Fitur Utama

- **Peta Interaktif 203 Kotak Grid:** Resolusi spasial 0,25 derajat (~28 km) sesuai kisi atmosferik ERA5, mencakup seluruh daratan utama Kalimantan Timur dengan visualisasi warna transparan (35% opasitas) agar peta dasar tetap terbaca jelas.
- **Rentang Waktu 11 Hari (H-3 sampai H+7):**
  - **H-3 s.d. H-1:** Evaluasi kondisi riwayat yang telah terjadi (ditandai dengan tombol abu-abu redup bertuliskan "Lewat").
  - **Hari Ini:** Kondisi berjalan saat ini (otomatis terpilih saat halaman pertama kali dibuka berdasarkan zona waktu WITA).
  - **H+1 s.d. H+7:** Prakiraan potensi risiko ke depan, dilengkapi label pengingat *"Perkiraan kasar, bisa berubah"* untuk rentang H+4 sampai H+7.
- **Mode "Peta Saja":** Tombol kontrol di pojok peta untuk menyembunyikan atau menampilkan lapisan grid kapan saja. Pilihan pengguna disimpan otomatis di peramban via `localStorage`.
- **Detail Cuaca Tiap Grid:** Klik atau sentuh kotak grid untuk menyorot area dan membuka modal berisi skor risiko (0–100), kelas risiko, suhu maksimum, kelembapan minimum, curah hujan, kecepatan angin, dan deret hari tanpa hujan.
- **Ringkasan Wilayah & Tabel Kabupaten/Kota:** Menampilkan distribusi titik per kelas risiko, rekomendasi tindakan preventif sesuai kelas risiko tertinggi se-provinsi, serta tabel rekapitulasi rerata skor dan kelas puncak untuk setiap kabupaten/kota dengan fitur pencarian interaktif.
- **Halaman Penjelasan Ilmiah (Tentang):** Dokumentasi metodologi fuzzy Mamdani, fungsi keanggotaan, 45 aturan inferensi, matriks validasi empiris, dan batasan operasional.

---

## Cara Kerja Singkat

1. **Pengambilan Data Cuaca:** Skrip Python mengambil data cuaca harian dari API Open-Meteo untuk 203 koordinat grid Kaltim (suhu maksimum, kelembapan minimum, curah hujan harian, dan kecepatan angin maksimum).
2. **Perhitungan Hari Tanpa Hujan:** Deret hari tanpa hujan dihitung berkesinambungan per titik dari riwayat 92 hari ke belakang sampai 8 hari ke depan menggunakan ambang presipitasi 3 mm (hujan < 3 mm menambah akumulasi hari kering, hujan $\ge$ 3 mm mereset hitungan ke 0).
3. **Inferensi Fuzzy Mamdani Bertingkat:**
   - **Tahap 1:** Memadukan *Hari Tanpa Hujan* dan *Kelembapan Udara* menghasilkan **Indeks Kekeringan** (9 aturan).
   - **Tahap 2:** Memadukan *Suhu Udara* dan *Kecepatan Angin* menghasilkan **Indeks Cuaca Api** (12 aturan).
   - **Tahap 3:** Memadukan *Indeks Kekeringan* dan *Indeks Cuaca Api* menghasilkan **Skor Risiko Karhutla** final skala 0–100 (24 aturan, defuzzifikasi centroid). Total 45 aturan terintegrasi.
4. **Penyimpanan Data Ringkas:** Hasil kalkulasi disimpan ke file statis `data/risiko.json` tanpa indentasi (format ringkas ~299 KB) untuk menjamin pemuatan cepat di peramban.
5. **Penyajian di Peta:** Antarmuka web statis (Leaflet.js + Vanilla JS) membaca `data/risiko.json` secara asinkron dan merender grid risiko di peramban tanpa memerlukan server backend dinamis.

---

## Hasil Validasi Empiris

Validasi kuantitatif dilakukan dengan membandingkan skor risiko terhadap riwayat titik panas (*hotspot*) NASA FIRMS (sensor MODIS & VIIRS) di seluruh Kalimantan Timur periode 2019–2026:

- **Kemampuan Diskriminasi Model:** Mencapai **AUC-ROC 0,802** pada resolusi 0,25 derajat (meningkat signifikan dari versi 0,5 derajat yang bernilai 0,773).
- **Konsistensi Tahunan:** Model fuzzy unggul konsisten atas *baseline* pada seluruh **8 dari 8 tahun evaluasi**.
- **Tangkapan Titik Panas:** Sebanyak **72,9% titik panas** FIRMS historis berhasil terdeteksi jatuh pada hari-hari ketika model mengeluarkan status alarm risiko (kelas Sedang, Tinggi, atau Sangat Tinggi).
- *Catatan Metodologis:* Hasil validasi ini mencerminkan korelasi kondisi atmosferik terhadap kemunculan titik panas, dan harus diinterpretasikan secara bijak sebagai indikator potensi bahaya lingkungan, bukan kepastian terbakarnya suatu titik.

---

## Struktur Folder

```text
web-karhutla-kaltim/
├── index.html              # Halaman utama aplikasi (peta risiko, kontrol, ringkasan)
├── tentang.html            # Halaman metodologi fuzzy, validasi, dan latar belakang riset
├── pratinjau.html          # Halaman acuan data lokal untuk verifikasi cepat
├── css/
│   └── gaya.css            # Desain antarmuka, variabel warna risiko, dan responsivitas
├── js/
│   ├── peta.js             # Logika peta Leaflet, interaksi grid, tombol tanggal, dan modal
│   └── tabel.js            # Rekapitulasi kabupaten/kota, filter pencarian, dan rekomendasi
├── data/
│   ├── grid_kaltim.csv     # Daftar 203 titik koordinat (resolusi 0,25°) se-Kaltim
│   └── risiko.json         # Output data risiko 11 hari (H-3 s.d. H+7) untuk visualisasi
├── python/
│   ├── fuzzy_karhutla.py   # Mesin inferensi fuzzy Mamdani 45 aturan (standar riset)
│   ├── ambil_prakiraan.py  # Pipeline pengambilan API Open-Meteo & penulisan risiko.json
│   └── uji_konsistensi.py  # Uji otomatis kesesuaian numerik Python vs notebook riset
├── riset/
│   ├── fuzzy-mamdani-karhutla-kaltim.ipynb  # Notebook riset dasar validasi 0,25 derajat
│   ├── uji_referensi.csv   # Data acuan uji regresi fuzzy
│   └── uji_urutan.csv      # Data acuan uji urutan hari tanpa hujan
├── docs/
│   └── PRD.md              # Spesifikasi produk lengkap (Product Requirements Document)
└── .github/workflows/
    └── ambil_data.yml      # Workflow otomasi pembaruan data harian GitHub Actions
```

---

## Cara Menjalankan di Komputer Sendiri

Aplikasi ini membutuhkan **Python 3.10+** untuk pipeline data, serta peramban web modern untuk frontend.

### 1. Pasang Dependensi Python

```bash
pip install -r requirements.txt
```

### 2. Jalankan Uji Konsistensi Numerik

Pastikan logika kalkulasi fuzzy dan deret hari tanpa hujan identik 100% dengan notebook riset:

```bash
python python/uji_konsistensi.py
```
*(Harus menampilkan: `SEMUA UJI LULUS`)*

### 3. Perbarui Data Prakiraan Cuaca

Jalankan pengambil data untuk memperbarui `data/risiko.json`:

```bash
# Uji coba tanpa menulis file (opsional)
python python/ambil_prakiraan.py --dry-run

# Eksekusi pembaruan data asli
python python/ambil_prakiraan.py
```

### 4. Jalankan Server Web Lokal

Karena peramban membatasi permintaan `fetch()` pada protokol `file://`, jalankan server statis lokal:

```bash
python -m http.server 8000
```

Buka peramban di [http://localhost:8000](http://localhost:8000) untuk membuka antarmuka utama `index.html`.

---

## Pembaruan Otomatis lewat GitHub Actions

Data risiko diperbarui setiap hari secara otomatis tanpa memerlukan server komputasi mandiri:

- **Jadwal Otomatis:** Workflow [.github/workflows/ambil_data.yml](.github/workflows/ambil_data.yml) berjalan setiap hari pukul **05.30 WITA** (21.30 UTC).
- **Proses:** Menjalankan `python/ambil_prakiraan.py`, memvalidasi struktur data 203 titik $\times$ 11 hari, dan melakukan commit otomatis ke branch utama bila data valid.
- **Pemicu Manual:** Alur kerja dapat dijalankan manual sewaktu-waktu melalui menu **Actions** > **Ambil data prakiraan cuaca** > **Run workflow** di repositori GitHub.

---

## Keterbatasan Sistem

1. **Fokus pada Faktor Meteorologis:** Sistem saat ini murni memodelkan bahaya cuaca (kekeringan mikro, kelembapan, suhu, dan angin). Belum memperhitungkan faktor pemicu antropogenik (aktivitas manusia membakar lahan), kedalaman muka air tanah gambut, maupun peta tutupan bahan bakar (*fuel bed*).
2. **Ketidakpastian Prakiraan Jangka Panjang (H+4 ke Atas):** Akurasi prakiraan cuaca numerik secara alami menurun seiring bertambahnya horizon waktu. Informasi H+4 hingga H+7 sebaiknya dipandang sebagai indikasi perkiraan kasar yang dapat berubah.
3. **Cakupan Wilayah Spesifik:** Karena resolusi grid 0,25 derajat (~28 km) terfokus pada daratan utama Kaltim, wilayah administratif **Kota Bontang** dan sebagian pedalaman **Kabupaten Mahakam Ulu** belum memiliki titik grid koordinat mandiri yang jatuh persis di dalam batas wilayahnya.

---

## Sumber Data dan Atribusi

- **Data Cuaca & Prakiraan:** [Open-Meteo Weather API](https://open-meteo.com/) (menggunakan model ECMWF IFS / GFS).
- **Data Reanalisis Atmosfer:** ERA5 dari European Centre for Medium-Range Weather Forecasts (ECMWF).
- **Titik Panas Satelit & Validasi:** NASA Fire Information for Resource Management System ([FIRMS](https://firms.modaps.eosdis.nasa.gov/)).
- **Peta Dasar:** [OpenStreetMap](https://www.openstreetmap.org/) kontributor.
- **Pustaka Peta Web:** [Leaflet.js](https://leafletjs.com/).

---

## Tim Pengembang

- **Rahmat Riyadi:** Arsitektur data, perancangan model fuzzy Mamdani, pipeline otomasi, dan riset validasi.
- **Fahri:** Antarmuka peta interaktif (`js/peta.js` dan integrasi peta di `index.html`).
- **Richo / Husein:** Desain antarmuka informasi, tabel kabupaten, dan halaman penjelasan (`css/gaya.css`, `js/tabel.js`, `tentang.html`).
