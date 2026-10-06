"""Ambil prakiraan cuaca Open-Meteo, hitung risiko karhutla, tulis data/risiko.json.

Jalankan: python python/ambil_prakiraan.py
Coba dulu tanpa menulis file: python python/ambil_prakiraan.py --dry-run

Kalau pengambilan data gagal atau hasilnya tidak valid, data/risiko.json yang lama
TIDAK diubah (jadi cadangan) dan skrip keluar dengan kode 1.
"""
import argparse
import json
import os
import re
import sys
import time
import traceback
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd
import requests

from fuzzy_karhutla import hitung_hari_tanpa_hujan, hitung_risiko

ROOT = Path(__file__).resolve().parent.parent
GRID_CSV = ROOT / "data" / "grid_kaltim.csv"
OUT_JSON = ROOT / "data" / "risiko.json"

URL = "https://api.open-meteo.com/v1/forecast"
ZONA = "Asia/Makassar"  # WITA
WITA = timezone(timedelta(hours=8))
HARI_LALU = 92  # batas past_days Open-Meteo, dipakai buat menghitung hari tanpa hujan
HARI_DEPAN = 8  # H sampai H+7
TOTAL_HARI = HARI_LALU + HARI_DEPAN
JUMLAH_TITIK = 52
BATCH = 13  # titik per permintaan
JEDA_ANTAR_BATCH = 2  # detik
PERCOBAAN = 3

# nama variabel Open-Meteo -> nama kolom kita
DAILY = {
    "temperature_2m_max": "suhu",
    "relative_humidity_2m_min": "kelembapan",
    "precipitation_sum": "hujan",
    "wind_speed_10m_max": "angin",
}
KELAS_VALID = {"Rendah", "Sedang", "Tinggi", "Sangat Tinggi"}


def rapikan_nama(nama):
    # "KutaiKartanegara" -> "Kutai Kartanegara"
    return re.sub(r"(?<!^)(?=[A-Z])", " ", nama)


def muat_grid():
    if not GRID_CSV.exists():
        raise FileNotFoundError(f"{GRID_CSV} tidak ada")
    grid = pd.read_csv(GRID_CSV)
    for kolom in ("id", "lat", "lon", "kabupaten"):
        if kolom not in grid.columns:
            raise ValueError(f"kolom {kolom} tidak ada di grid_kaltim.csv")
    if len(grid) != JUMLAH_TITIK:
        raise ValueError(f"grid_kaltim.csv harus {JUMLAH_TITIK} baris, ternyata {len(grid)}")
    grid = grid.sort_values("id").reset_index(drop=True)
    grid["kabupaten"] = grid["kabupaten"].map(rapikan_nama)
    return grid


def ambil_batch(lats, lons):
    """Ambil data satu kelompok titik. Kembalikan list isi 'daily' per titik."""
    params = {
        "latitude": ",".join(str(x) for x in lats),
        "longitude": ",".join(str(x) for x in lons),
        "daily": ",".join(DAILY.keys()),
        "timezone": ZONA,
        "past_days": HARI_LALU,
        "forecast_days": HARI_DEPAN,
    }
    jeda = 5
    for percobaan in range(1, PERCOBAAN + 1):
        try:
            r = requests.get(URL, params=params, timeout=60)
            if r.status_code == 400:
                # salah parameter, tidak ada gunanya diulang
                raise ValueError(f"Open-Meteo menolak permintaan: {r.text[:300]}")
            r.raise_for_status()
            isi = r.json()
            break
        except ValueError:
            raise
        except Exception as e:
            print(f"  percobaan {percobaan} gagal: {e}")
            if percobaan == PERCOBAAN:
                raise
            time.sleep(jeda)
            jeda *= 3

    daftar = isi if isinstance(isi, list) else [isi]
    if len(daftar) != len(lats):
        raise ValueError(f"minta {len(lats)} titik, dapat {len(daftar)}")
    return [d["daily"] for d in daftar]


def ambil_semua(grid):
    hasil = []
    for mulai in range(0, len(grid), BATCH):
        potong = grid.iloc[mulai:mulai + BATCH]
        print(f"Ambil titik {mulai} sampai {mulai + len(potong) - 1} ...")
        hasil.extend(ambil_batch(potong["lat"].tolist(), potong["lon"].tolist()))
        if mulai + BATCH < len(grid):
            time.sleep(JEDA_ANTAR_BATCH)
    return hasil


def deret_titik(daily):
    """Ubah 'daily' satu titik jadi DataFrame 8 hari (H sampai H+7) lengkap dengan hari tanpa hujan."""
    tanggal = daily["time"]
    if len(tanggal) != TOTAL_HARI:
        raise ValueError(f"harus {TOTAL_HARI} hari, dapat {len(tanggal)}")

    df = pd.DataFrame({"tanggal": tanggal})
    for nama_api, nama in DAILY.items():
        df[nama] = pd.Series(daily[nama_api], dtype="float64")

    selisih = pd.to_datetime(df["tanggal"]).diff().dropna()
    if not (selisih == pd.Timedelta(days=1)).all():
        raise ValueError("tanggal dari API tidak berurutan harian")

    # hujan yang kosong di hari lalu dianggap 0 (kering), hari prakiraan tidak boleh kosong
    df.loc[: HARI_LALU - 1, "hujan"] = df.loc[: HARI_LALU - 1, "hujan"].fillna(0.0)
    depan = df.iloc[HARI_LALU:]
    if depan[list(DAILY.values())].isna().any().any():
        raise ValueError("ada nilai kosong di hari prakiraan")

    df["hari_tanpa_hujan"] = hitung_hari_tanpa_hujan(df["hujan"].tolist())
    return df.iloc[HARI_LALU:].reset_index(drop=True)


def susun_tabel(grid, hasil_api):
    potongan = []
    for (_, titik), daily in zip(grid.iterrows(), hasil_api):
        d = deret_titik(daily)
        d.insert(0, "id", int(titik["id"]))
        potongan.append(d)
    tabel = pd.concat(potongan, ignore_index=True)

    tanggal_per_titik = tabel.groupby("id")["tanggal"].apply(list)
    if tanggal_per_titik.map(lambda x: x != tanggal_per_titik.iloc[0]).any():
        raise ValueError("tanggal antar titik tidak sama")
    return hitung_risiko(tabel)


def buat_json(grid, tabel):
    tanggal = tabel[tabel["id"] == int(grid.iloc[0]["id"])]["tanggal"].tolist()
    titik = []
    for _, g in grid.iterrows():
        baris = tabel[tabel["id"] == int(g["id"])]
        prakiraan = []
        for _, b in baris.iterrows():
            prakiraan.append({
                "tanggal": b["tanggal"],
                "skor": round(float(b["skor_risiko"]), 1),
                "kelas": b["kelas_risiko"],
                "suhu": round(float(b["suhu"]), 1),
                "kelembapan": int(round(float(b["kelembapan"]))),
                "hujan": round(float(b["hujan"]), 1),
                "angin": round(float(b["angin"]), 1),
                "hari_tanpa_hujan": int(b["hari_tanpa_hujan"]),
            })
        titik.append({
            "id": int(g["id"]),
            "lat": float(g["lat"]),
            "lon": float(g["lon"]),
            "kabupaten": g["kabupaten"],
            "prakiraan": prakiraan,
        })
    return {
        "diperbarui": datetime.now(WITA).replace(microsecond=0).isoformat(),
        "tanggal": tanggal,
        "titik": titik,
    }


def validasi(data, jumlah_titik):
    if len(data["titik"]) != jumlah_titik:
        raise ValueError(f"jumlah titik {len(data['titik'])}, harusnya {jumlah_titik}")
    if len(data["tanggal"]) != HARI_DEPAN:
        raise ValueError(f"jumlah tanggal {len(data['tanggal'])}, harusnya {HARI_DEPAN}")
    for t in data["titik"]:
        if len(t["prakiraan"]) != HARI_DEPAN:
            raise ValueError(f"titik {t['id']} punya {len(t['prakiraan'])} hari, harusnya {HARI_DEPAN}")
        for p in t["prakiraan"]:
            for kunci, nilai in p.items():
                if nilai is None or (isinstance(nilai, float) and nilai != nilai):
                    raise ValueError(f"titik {t['id']} {p['tanggal']}: {kunci} kosong")
            if not 0 <= p["skor"] <= 100:
                raise ValueError(f"titik {t['id']} {p['tanggal']}: skor {p['skor']} di luar 0 sampai 100")
            if not 0 <= p["kelembapan"] <= 100:
                raise ValueError(f"titik {t['id']} {p['tanggal']}: kelembapan {p['kelembapan']} di luar 0 sampai 100")
            if p["hujan"] < 0 or p["angin"] < 0 or p["hari_tanpa_hujan"] < 0:
                raise ValueError(f"titik {t['id']} {p['tanggal']}: ada nilai negatif")
            if p["kelas"] not in KELAS_VALID:
                raise ValueError(f"titik {t['id']} {p['tanggal']}: kelas {p['kelas']} tidak dikenal")


def ringkas(data):
    print(f"Diperbarui: {data['diperbarui']}")
    print(f"Tanggal: {data['tanggal'][0]} sampai {data['tanggal'][-1]}")
    for idx in (0, HARI_DEPAN - 1):
        hitung = {}
        for t in data["titik"]:
            kelas = t["prakiraan"][idx]["kelas"]
            hitung[kelas] = hitung.get(kelas, 0) + 1
        urut = ", ".join(f"{k}: {hitung.get(k, 0)}" for k in ["Rendah", "Sedang", "Tinggi", "Sangat Tinggi"])
        print(f"Jumlah titik per kelas, {data['tanggal'][idx]}: {urut}")
    print("Contoh 3 titik, hari pertama:")
    for t in data["titik"][:3]:
        print(f"  {t['id']} {t['kabupaten']}: {t['prakiraan'][0]}")


def tulis_atomik(data, tujuan):
    # tulis ke file sementara dulu supaya tidak ada file setengah jadi
    sementara = tujuan.with_suffix(".json.tmp")
    with open(sementara, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(sementara, tujuan)


def main():
    ap = argparse.ArgumentParser(description="Perbarui data/risiko.json dari prakiraan Open-Meteo")
    ap.add_argument("--dry-run", action="store_true", help="hitung dan tampilkan ringkasan tanpa menulis file")
    args = ap.parse_args()

    try:
        grid = muat_grid()
        hasil_api = ambil_semua(grid)
        tabel = susun_tabel(grid, hasil_api)
        data = buat_json(grid, tabel)
        validasi(data, len(grid))
    except Exception as e:
        traceback.print_exc()
        print(f"GAGAL: {e}")
        print("data/risiko.json yang lama tidak diubah.")
        return 1

    ringkas(data)
    if args.dry_run:
        print("Dry-run: file tidak ditulis.")
        return 0
    tulis_atomik(data, OUT_JSON)
    print(f"OK: {OUT_JSON} ditulis.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
