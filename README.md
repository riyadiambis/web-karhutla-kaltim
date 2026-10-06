# Web Peringatan Dini Risiko Karhutla Kaltim

Web statis yang menampilkan peta risiko kebakaran hutan dan lahan (karhutla) Kalimantan Timur untuk hari ini sampai 7 hari ke depan. Risiko dihitung otomatis dari prakiraan cuaca memakai sistem fuzzy Mamdani.

## Status

Tahap 1: persiapan dasar (struktur repo dan skema data).

## Fitur Utama

- Peta 52 titik grid berwarna sesuai kelas risiko (Rendah, Sedang, Tinggi, Sangat Tinggi)
- Pemilih tanggal H sampai H+7
- Detail cuaca per titik (suhu, kelembapan, hujan, angin, hari tanpa hujan)
- Tabel risiko per kabupaten/kota
- Rekomendasi tindakan preventif sesuai kelas risiko

## Cara Kerja Singkat

1. Skrip Python mengambil prakiraan cuaca dari Open-Meteo
2. Skrip menghitung skor risiko dengan fuzzy Mamdani (5 input, 45 aturan)
3. Hasil disimpan ke `data/risiko.json`
4. Halaman HTML membaca `risiko.json` dan menampilkannya di peta
5. GitHub Actions menjalankan proses ini otomatis setiap pagi

## Struktur Folder

- `index.html`, `tentang.html`: halaman web
- `css/`, `js/`: tampilan dan interaksi
- `data/`: `risiko.json` (output harian) dan `grid_kaltim.csv` (koordinat grid)
- `python/`: mesin fuzzy dan pengambil data
- `riset/`: notebook riset dasar
- `.github/workflows/`: otomasi harian

## Sumber Data

- Prakiraan cuaca: Open-Meteo
- Validasi titik panas: NASA FIRMS

## Tim

- Rahmat Riyadi: data, model fuzzy, otomasi
- [Nama teman]: peta interaktif dan antarmuka

## Disclaimer

Skor menunjukkan potensi bahaya berdasarkan cuaca, bukan kepastian lokasi atau waktu kebakaran.
