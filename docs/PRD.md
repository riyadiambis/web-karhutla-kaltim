# PRD: Web Peringatan Dini Risiko Karhutla Kaltim

Tanggal: 5 Oktober 2026
Penyusun: Rahmat Riyadi
Status: Tahap 1 (persiapan dasar)

## 1. Ringkasan Produk

Web statis berbasis HTML yang menampilkan peta risiko karhutla Kalimantan Timur untuk hari ini sampai 7 hari ke depan. Risiko dihitung otomatis dari prakiraan cuaca memakai sistem fuzzy Mamdani yang sudah divalidasi (AUC 0,773 terhadap titik panas NASA FIRMS 2019-2026).

**Pengguna sasaran:** masyarakat umum, petani/pekebun, dan petugas lapangan (BPBD, Manggala Agni, perangkat desa).

**Pertanyaan utama:** "Seberapa berbahaya aktivitas pembakaran atau potensi api di lokasi saya dalam 7 hari ke depan?"

**Fitur utama:** peta 52 titik grid berwarna sesuai kelas risiko (Rendah, Sedang, Tinggi, Sangat Tinggi), daftar risiko per kabupaten/kota, dan rekomendasi tindakan preventif.

**Prinsip arsitektur V1:** sederhana, ringan, HTML statis, tanpa login, tanpa server berbayar.

## 2. Latar Belakang dan Masalah

- Karhutla di Kaltim berulang setiap musim kemarau, tapi informasi risiko harian yang lokal belum mudah diakses publik.
- Kondisi 2026: BMKG mencatat El Nino sangat kuat sampai awal 2027, sehingga periode ini jadi puncak titik panas Kaltim dalam catatan NASA FIRMS 2019-2026.
- Masalah: peringatan biasanya baru keluar setelah api muncul, padahal indikator cuaca berbahaya sudah terbentuk beberapa hari sebelumnya.
- Dasar solusi: model fuzzy Mamdani bertingkat terbukti valid terhadap 57.105 titik panas. Pada kelas Sangat Tinggi, titik panas terdeteksi di 57,22% hari-grid (dibanding 2,88% pada kelas Rendah).
- Peluang: menggabungkan model fuzzy dengan data prakiraan cuaca untuk memberi peringatan dini sebelum kebakaran terjadi.

## 3. Tujuan, Ukuran Keberhasilan, dan Batasan

Versi 1 dianggap berhasil jika mampu menyajikan risiko 8 hari (H sampai H+7) pada 52 titik grid secara otomatis setiap pagi, dengan antarmuka yang ramah pengguna.

### Tujuan Utama

1. Menampilkan peta risiko karhutla harian Kaltim berdasarkan prakiraan cuaca.
2. Memperbarui data otomatis tanpa intervensi manual.
3. Memberi rekomendasi aksi konkret sesuai tingkat risiko.

### Ukuran Keberhasilan

| Metrik | Target | Metode Pengukuran |
|---|---|---|
| Otomatisasi | Pembaruan sukses 7 hari beruntun | Cek timestamp web setiap pagi |
| Konsistensi model | Output web identik dengan notebook | Uji komparasi 5-10 data historis |
| Performa load | Kurang dari 3 detik di HP | Uji jaringan seluler standar |
| Usabilitas | Skor SUS 68 atau lebih | Kuesioner System Usability Scale |

### Di Luar Cakupan (V1)

- Login/akun pengguna
- Notifikasi langsung (WhatsApp, email, push)
- Peta tingkat desa/kecamatan (V1 fokus ke grid dan kabupaten)
- Aplikasi Android/iOS native
- Integrasi data tutupan lahan/lahan gambut

## 4. Pengguna Sasaran dan User Stories

| Profil | Kebutuhan Utama | Perangkat |
|---|---|---|
| Masyarakat / Petani | Tahu tingkat bahaya sebelum membakar lahan/sampah | Smartphone |
| Petugas lapangan (BPBD, Manggala Agni) | Memantau area rawan tinggi untuk patroli pencegahan | Smartphone dan laptop |
| Perangkat desa / Penyuluh | Bahan acuan untuk instruksi dan sosialisasi kewaspadaan warga | Smartphone |

### User Stories

| ID | Aktor | Ingin | Supaya | Prioritas |
|---|---|---|---|---|
| US-1 | Petani | Melihat status risiko kabupaten hari ini | Bisa menentukan aman tidaknya membakar lahan | Wajib |
| US-2 | Petani | Melihat tren risiko 7 hari ke depan | Bisa merapikan jadwal kerja lapangan | Wajib |
| US-3 | Warga | Membaca rekomendasi aksi yang lugas | Bisa mengambil langkah antisipasi yang tepat | Wajib |
| US-4 | Petugas | Melihat gambaran peta se-Kaltim | Bisa menemukan zona merah dengan cepat | Wajib |
| US-5 | Petugas | Mengecek parameter cuaca per titik | Bisa menganalisis pemicu risiko tinggi | Wajib |
| US-6 | Umum | Melihat timestamp pembaruan data | Bisa memastikan informasi masih baru | Wajib |
| US-7 | Penyuluh | Mencari kabupaten di tabel | Hemat waktu navigasi | Tambahan |
| US-8 | Warga | Tampilan responsif di HP | Nyaman diakses dari smartphone | Tambahan |

## 5. Arsitektur dan Alur Data

Sistem dibuat terpisah (decoupled):

1. Skrip Python berjalan setiap pagi lewat GitHub Actions.
2. Skrip mengambil prakiraan cuaca dari Open-Meteo, lalu menghitung skor fuzzy Mamdani.
3. Hasil disimpan ke `data/risiko.json`.
4. Halaman HTML membaca `risiko.json` dan menampilkannya di peta.

File JSON jadi "kontrak data" antara tim data dan tim antarmuka. Dengan begitu aplikasinya ringan, bisa di-hosting gratis, dan kedua tim bisa kerja sendiri-sendiri.

## 6. Kebutuhan Fungsional dan Desain Antarmuka

Aplikasi punya dua halaman: Beranda (peta) dan Tentang (metodologi).

### Tata Letak Beranda (`index.html`)

```
+--------------------------------------------------------------+
| HEADER: Peringatan Dini Risiko Karhutla Kaltim               |
| Diperbarui: 5 Okt 2026, 06.00 WITA                           |
+--------------------------------------------------------------+
| PILIH TANGGAL: [Hari ini] [Besok] [+2] [+3] [+4] [+5] [+6] [+7] |
+-------------------------------------+------------------------+
|                                     | RINGKASAN HARI INI     |
|   PETA KALTIM                       | Sangat Tinggi: 5 titik |
|   52 grid berwarna                  | Tinggi: 18 titik       |
|   (klik -> modal detail cuaca)      | Sedang: 20 titik       |
|                                     | Rendah: 9 titik        |
|   Legenda: Hijau, Kuning,           +------------------------+
|   Merah, Merah Tua                  | REKOMENDASI AKSI       |
|                                     | Sesuai kelas tertinggi |
+-------------------------------------+------------------------+
| TABEL KABUPATEN/KOTA: nama, status tertinggi, rerata skor    |
+--------------------------------------------------------------+
| FOOTER: Sumber Data (Open-Meteo, NASA FIRMS) | Disclaimer    |
+--------------------------------------------------------------+
```

### Komponen

| Komponen | Deskripsi | Prioritas |
|---|---|---|
| Peta risiko | Overlay 52 grid interaktif berwarna di atas wilayah Kaltim | Wajib |
| Pemilih tanggal | Navigasi tanggal H sampai H+7 untuk mengganti layer peta | Wajib |
| Detail titik grid | Modal pop-up saat grid diklik: skor, suhu, kelembapan, hujan, angin, hari tanpa hujan | Wajib |
| Ringkasan harian | Jumlah titik grid per kelas risiko | Wajib |
| Saran tindakan | Teks rekomendasi sesuai kelas risiko tertinggi | Wajib |
| Tabel wilayah | Kelas tertinggi dan rerata skor per kabupaten/kota | Wajib |
| Status update | Penanda waktu sinkronisasi data terakhir | Wajib |
| Filter tabel | Pencarian nama kabupaten/kota | Tambahan |
| Layout responsif | Tata letak yang pas untuk layar HP | Tambahan |

### Klasifikasi dan Rekomendasi

| Kelas | Rentang Skor | Warna | Rekomendasi Tindakan |
|---|---|---|---|
| Rendah | 0 - 25 | Hijau | Kondisi aman. Tetap waspada saat membakar sampah harian. |
| Sedang | 25 - 50 | Kuning | Hindari pembakaran lahan. Pastikan sisa api padam sepenuhnya. |
| Tinggi | 50 - 75 | Merah | Dilarang membakar lahan. Siapkan pasokan air dan sarana pemadam. |
| Sangat Tinggi | 75 - 100 | Merah Tua | Dilarang total membakar. Laporkan kemunculan asap/api ke petugas. |

### Halaman Tentang (`tentang.html`)

- Penjelasan fuzzy Mamdani secara intuitif dan non-teknis
- Atribusi sumber data (Open-Meteo dan NASA FIRMS)
- Ringkasan validasi ilmiah model (AUC 0,773)
- Informasi pengembang dan kontak resmi

## 7. Spesifikasi Data (`data/risiko.json`)

File ini adalah kontrak utama antara backend (Python) dan frontend (HTML/JS). Selama tahap awal, frontend boleh memakai mock `risiko.json` tanpa menunggu skrip Python jadi.

```json
{
  "diperbarui": "2026-10-05T06:00:00+08:00",
  "tanggal": ["2026-10-05", "2026-10-06", "2026-10-07"],
  "titik": [
    {
      "id": 0,
      "lat": -2.0,
      "lon": 116.0,
      "kabupaten": "Paser",
      "prakiraan": [
        {
          "tanggal": "2026-10-05",
          "skor": 72.4,
          "kelas": "Tinggi",
          "suhu": 33.1,
          "kelembapan": 52,
          "hujan": 0.4,
          "angin": 14.2,
          "hari_tanpa_hujan": 12
        }
      ]
    }
  ]
}
```

| Properti | Tipe | Satuan | Keterangan |
|---|---|---|---|
| `diperbarui` | String (ISO 8601) | WITA | Waktu skrip pembaruan dijalankan |
| `tanggal` | Array of string | - | Daftar tanggal untuk opsi navigasi |
| `id`, `lat`, `lon` | Number | Derajat | Koordinat grid (dari `grid_kaltim.csv`) |
| `kabupaten` | String | - | Nama kabupaten/kota terkait |
| `skor` | Number | 0-100 | Hasil defuzzifikasi |
| `kelas` | String | - | Rendah, Sedang, Tinggi, atau Sangat Tinggi |
| `suhu` | Number | derajat C | Suhu udara maksimum harian |
| `kelembapan` | Number | % | Kelembapan relatif minimum harian |
| `hujan` | Number | mm | Total curah hujan harian |
| `angin` | Number | km/jam | Kecepatan angin maksimum harian |
| `hari_tanpa_hujan` | Number | hari | Jumlah hari berturut-turut dengan hujan kurang dari 3 mm |

## 8. Kebutuhan Non-Fungsional

| Aspek | Spesifikasi |
|---|---|
| Kinerja | Sangat ringan, payload JSON dibatasi 52 titik x 8 hari |
| Aksesibilitas seluler | Layout adaptif, tombol mudah disentuh di layar HP |
| Inklusivitas UI | Teks kelas risiko ditampilkan berdampingan dengan warna (untuk buta warna) |
| Keandalan data | Pakai data cache terakhir kalau API atau eksekusi otomatis gagal |
| Integritas algoritma | Batas fungsi keanggotaan, ambang hujan 3 mm, dan 45 aturan fuzzy harus sama persis dengan riset dasar |
| Efisiensi biaya | Tanpa biaya operasional (GitHub Pages, GitHub Actions, Open-Meteo) |
| Bahasa dan konten | Bahasa Indonesia yang komunikatif, tanpa istilah teknis rumit di halaman utama |
| Transparansi | Ada disclaimer bahwa skor adalah potensi berbasis cuaca, bukan kepastian kejadian |

## 9. Pembagian Tugas Tim

| Peran | Penanggung Jawab | Tanggung Jawab | Deliverables |
|---|---|---|---|
| Python / data dan fuzzy | Rahmat Riyadi | Migrasi modul fuzzy, otomasi ambil data Open-Meteo, hitung hari tanpa hujan, buat JSON harian | `fuzzy_karhutla.py`, `ambil_prakiraan.py`, `risiko.json` |
| Frontend / peta interaktif | Fahri (Pengembang A) | Peta Leaflet, pewarnaan 52 grid, kontrol tanggal, modal detail cuaca | `index.html` (bagian peta), `js/peta.js` |
| Frontend / UI dan informasi | Pengembang B (Richo atau Husein, belum final) | Header, ringkasan risiko, tabel wilayah, CSS, halaman Tentang | `index.html` (bagian info), `tentang.html`, `css/gaya.css`, `js/tabel.js` |

### Aturan Kolaborasi

- Frontend mengacu penuh pada struktur `data/risiko.json`.
- Perubahan skema JSON harus disepakati semua anggota tim dulu.
- Pakai Git di satu repo bersama, dengan pembagian file per orang supaya tidak bentrok saat commit.

## 10. Teknologi dan Hosting

| Komponen | Teknologi | Alasan |
|---|---|---|
| Frontend UI | HTML5, CSS3, Vanilla JS | Sederhana, cepat, tanpa framework |
| Peta interaktif | Leaflet.js | Ringan, open-source, cukup untuk 52 grid |
| Data cuaca | Open-Meteo Forecast API | Gratis untuk non-komersial, variabelnya sesuai riset |
| Pemrosesan backend | Python (pandas, numpy, scikit-fuzzy) | Satu lingkungan dengan notebook riset |
| Otomasi | GitHub Actions | Menjalankan Python tiap hari dan commit JSON baru |
| Hosting web | GitHub Pages | Gratis, terhubung langsung ke repo |

### Struktur Repositori

```
web-karhutla-kaltim/
├── AGENTS.md
├── README.md
├── requirements.txt
├── index.html              (Fahri (Pengembang A) + Pengembang B (Richo atau Husein, belum final))
├── tentang.html            (Pengembang B (Richo atau Husein, belum final))
├── css/
│   └── gaya.css            (Pengembang B (Richo atau Husein, belum final))
├── js/
│   ├── peta.js             (Fahri (Pengembang A))
│   └── tabel.js            (Pengembang B (Richo atau Husein, belum final))
├── data/
│   ├── risiko.json         (output harian)
│   └── grid_kaltim.csv     (koordinat 52 titik)
├── docs/
│   └── PRD.md
├── python/
│   ├── fuzzy_karhutla.py   (Rahmat)
│   └── ambil_prakiraan.py  (Rahmat)
└── .github/workflows/
    └── perbarui.yml        (Rahmat)
```

Hosting cadangan: mini-PC server lokal milik Rahmat, kalau suatu saat butuh kontrol server sendiri.

## 11. Rencana Rilis dan Tahapan Kerja

**Tahap 1: Persiapan dasar (bersama)**
- Buat repo GitHub dan struktur folder
- Finalisasi skema `risiko.json`
- Siapkan dummy `risiko.json` untuk uji antarmuka

**Tahap 2: Kerja paralel**
- Rahmat: `fuzzy_karhutla.py` dan `ambil_prakiraan.py`
- Fahri (Pengembang A): peta Leaflet, pewarnaan grid, kontrol tanggal, popup info
- Pengembang B (Richo atau Husein, belum final): layout UI, ringkasan, saran aksi, tabel wilayah, halaman Tentang

**Tahap 3: Integrasi**
- Hubungkan data asli dari Python ke antarmuka
- Uji di desktop dan HP
- Aktifkan GitHub Pages

**Tahap 4: Otomasi dan penjaminan mutu**
- Atur jadwal GitHub Actions (`perbarui.yml`)
- Pantau stabilitas pembaruan harian selama 3 hari beruntun

## 12. Batasan, Risiko, dan Keputusan yang Belum Final

### Batasan dan Risiko

- **Sifat informasi:** hasilnya tingkat potensi bahaya cuaca, bukan prediksi pasti lokasi titik api.
- **Lisensi API:** pemakaian Open-Meteo harus sesuai ketentuan kuota non-komersial.
- **Hari tanpa hujan:** dihitung dari riwayat cuaca ditambah prakiraan, dengan ambang hujan 3 mm.
- **Konsistensi parameter:** 45 aturan inferensi dan batas variabel harus identik dengan studi awal.
- **Akurasi jangka panjang:** prakiraan H+5 sampai H+7 menurun secara alami, jadi harus dijelaskan di UI.
- **Pengembangan akademis:** web ini jadi bahan Paper 2 (penerapan sistem dan uji usabilitas).

### Keputusan yang Perlu Difinalkan

1. Pengembang A: Fahri (sudah fix). Pengembang B: Richo atau Husein (belum fix)
2. Domain resmi dan nama repo publik (usulan: `web-karhutla-kaltim`)
3. Rencana dan target responden kuesioner SUS
4. Perlu tidaknya resolusi tingkat kecamatan di versi berikutnya
5. Prosedur koordinasi dan lisensi data dengan BPBD setempat
