"""Uji konsistensi: kode Python web harus menghasilkan angka yang sama dengan notebook riset.

Jalankan: python python/uji_konsistensi.py
Keluar dengan kode 1 kalau ada yang tidak cocok.
"""
import sys
from pathlib import Path

import pandas as pd

from fuzzy_karhutla import VARIABEL, hitung_hari_tanpa_hujan, hitung_risiko

ROOT = Path(__file__).resolve().parent.parent
REFERENSI = ROOT / "riset" / "uji_referensi.csv"
URUTAN = ROOT / "riset" / "uji_urutan.csv"
TOLERANSI = 0.01


def uji_skor():
    print("Uji 1: skor fuzzy dibanding notebook")
    acuan = pd.read_csv(REFERENSI)
    hasil = hitung_risiko(acuan[VARIABEL])
    lulus = True

    for kolom in ["indeks_kekeringan", "indeks_cuaca_api", "skor_risiko"]:
        selisih = (hasil[kolom] - acuan[kolom]).abs().max()
        ok = selisih <= TOLERANSI
        lulus = lulus and ok
        print(f"  {kolom}: selisih maks {selisih:.6f} -> {'LULUS' if ok else 'GAGAL'}")

    sama = (hasil["kelas_risiko"] == acuan["kelas_risiko"]).sum()
    ok = sama == len(acuan)
    lulus = lulus and ok
    print(f"  kelas_risiko: {sama} dari {len(acuan)} sama -> {'LULUS' if ok else 'GAGAL'}")

    if not ok:
        salah = acuan[hasil["kelas_risiko"] != acuan["kelas_risiko"]]
        print("  baris yang beda:")
        print(salah[["id", "tanggal", "kelas_risiko"]].to_string(index=False))
    return lulus


def uji_hari_tanpa_hujan():
    print("Uji 2: hitungan hari tanpa hujan dibanding notebook")
    urutan = pd.read_csv(URUTAN)
    hitung = hitung_hari_tanpa_hujan(urutan["hujan"].tolist())
    beda = urutan[urutan["hari_tanpa_hujan"] != pd.Series(hitung)]
    ok = len(beda) == 0
    print(f"  {len(urutan) - len(beda)} dari {len(urutan)} hari sama -> {'LULUS' if ok else 'GAGAL'}")
    if not ok:
        print(beda.head(10).to_string(index=False))
    return ok


def main():
    for berkas in (REFERENSI, URUTAN):
        if not berkas.exists():
            print(f"GAGAL: file {berkas} tidak ada")
            return 1
    hasil = [uji_skor(), uji_hari_tanpa_hujan()]
    if all(hasil):
        print("SEMUA UJI LULUS")
        return 0
    print("ADA UJI YANG GAGAL")
    return 1


if __name__ == "__main__":
    sys.exit(main())
