# Panduan untuk AI Coding

Proyek: Web Peringatan Dini Risiko Karhutla Kaltim.
Web statis yang menampilkan peta risiko karhutla 52 titik grid untuk hari ini sampai 7 hari ke depan.

## Baca ini dulu

1. `docs/PRD.md` adalah spesifikasi lengkap. Ikuti ini.
2. `data/risiko.json` adalah satu-satunya sumber data untuk tampilan.

Kalau ada yang bertentangan antara permintaan dan PRD, tanya dulu, jangan langsung ubah PRD.

## Stack (jangan diganti)

- HTML5, CSS3, Vanilla JavaScript
- Peta: Leaflet.js (boleh lewat CDN)
- DILARANG: framework (React, Vue, dll), bundler, npm build step, dan library berat
- Web harus bisa jalan sebagai file statis di GitHub Pages

## Pembagian file

| File | Pemilik |
|---|---|
| `js/peta.js`, bagian peta di `index.html` | Pengembang A |
| `css/gaya.css`, `js/tabel.js`, `tentang.html`, bagian info di `index.html` | Pengembang B |
| `python/`, `.github/`, `data/risiko.json` (isi asli) | Rahmat (JANGAN DISENTUH) |

Hanya edit file milik peran yang sedang dikerjakan, supaya tidak bentrok saat merge.

## Aturan data

- Frontend membaca `data/risiko.json` lewat `fetch`.
- JANGAN ubah struktur JSON. Kalau butuh field baru, minta persetujuan tim dulu.
- Selama backend belum jadi, pakai `data/risiko.json` versi dummy.
- Kalau `fetch` gagal, tampilkan pesan ramah ("Data belum bisa dimuat, coba lagi nanti"), jangan biarkan halaman kosong atau error.

Struktur singkat:

```
diperbarui: string ISO 8601 (WITA)
tanggal: array string tanggal
titik[]: id, lat, lon, kabupaten, prakiraan[]
prakiraan[]: tanggal, skor (0-100), kelas, suhu, kelembapan, hujan, angin, hari_tanpa_hujan
```

## Kelas risiko dan warna

| Kelas | Skor | Warna | Teks rekomendasi |
|---|---|---|---|
| Rendah | 0-25 | Hijau | Kondisi aman. Tetap waspada saat membakar sampah harian. |
| Sedang | 25-50 | Kuning | Hindari pembakaran lahan. Pastikan sisa api padam sepenuhnya. |
| Tinggi | 50-75 | Merah | Dilarang membakar lahan. Siapkan pasokan air dan sarana pemadam. |
| Sangat Tinggi | 75-100 | Merah Tua | Dilarang total membakar. Laporkan kemunculan asap/api ke petugas. |

Saran kode warna (boleh disesuaikan, tapi harus SAMA di peta, legenda, tabel, dan ringkasan):
- Rendah `#2e9e4f`, Sedang `#f2c230`, Tinggi `#e03b2f`, Sangat Tinggi `#8b1a1a`

Teks `kelas` dari JSON dipakai apa adanya sebagai acuan. Hitung ulang kelas dari skor hanya kalau memang diminta.

## Fitur yang harus ada (wajib)

1. Peta Leaflet dengan 52 grid berwarna sesuai kelas
2. Tombol tanggal H sampai H+7 yang mengganti warna peta
3. Klik grid memunculkan modal: skor, kelas, suhu, kelembapan, hujan, angin, hari tanpa hujan
4. Ringkasan hari ini: jumlah titik per kelas
5. Kotak rekomendasi aksi sesuai kelas TERTINGGI di hari yang dipilih
6. Tabel kabupaten/kota: kelas tertinggi dan rerata skor
7. Penanda "Diperbarui: ..." dari field `diperbarui`
8. Footer: sumber data (Open-Meteo, NASA FIRMS) dan disclaimer

Tambahan (kerjakan setelah yang wajib): filter pencarian di tabel dan layout responsif yang rapi.

## Aturan tampilan

- Bahasa Indonesia yang sederhana. Hindari istilah teknis di halaman utama.
- Tampilkan TEKS kelas risiko di samping warna (untuk pengguna buta warna). Jangan andalkan warna saja.
- Mobile first. Target sentuh tombol cukup besar, tidak ada scroll horizontal di HP.
- Target load kurang dari 3 detik di jaringan seluler.
- Untuk H+5 sampai H+7, tampilkan catatan kecil bahwa akurasi prakiraan menurun.
- Wajib ada disclaimer: skor adalah potensi bahaya berbasis cuaca, BUKAN kepastian kebakaran.

## Cara menjalankan lokal

`fetch` ke file JSON tidak jalan kalau halaman dibuka langsung (`file://`). Jalankan server lokal:

```
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.

## Alur kerja Git

- Satu repo bersama. Commit kecil dan sering, dengan pesan yang jelas.
- Sebelum mulai kerja: `git pull`. Sebelum push: pastikan tidak menyentuh file milik orang lain.
- Jangan commit file rahasia atau API key (Open-Meteo yang dipakai tidak butuh key).

## Hal yang JANGAN dilakukan

- Jangan menambah login, notifikasi, atau backend server.
- Jangan mengganti stack atau menambah dependency tanpa izin.
- Jangan mengubah skema `risiko.json`.
- Jangan menyentuh `python/` dan `.github/`.
- Jangan mengubah angka-angka riset (45 aturan fuzzy, ambang hujan 3 mm, AUC 0,773) di teks halaman Tentang.
