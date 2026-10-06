"""Mesin fuzzy Mamdani risiko karhutla Kaltim.

Isinya sama dengan notebook riset (riset/fuzzy-mamdani-karhutla-kaltim.ipynb):
5 input, 3 tingkat, 45 aturan, inferensi MIN, MAX, dan centroid.
Batas fungsi keanggotaan ditulis tetap, bukan dihitung ulang dari data.
"""
from itertools import product

import numpy as np
import pandas as pd
import skfuzzy as fuzz

VARIABEL = ["suhu", "kelembapan", "hujan", "angin", "hari_tanpa_hujan"]
AMBANG_HUJAN = 3  # mm, hujan di bawah ini dihitung hari tanpa hujan

# batas bawah, tengah, atas (persentil data ERA5 2019-2026, hari tanpa hujan pakai BMKG)
BATAS = {
    "suhu": (25.6, 29.5, 31.8),
    "kelembapan": (57.0, 69.0, 80.0),
    "hujan": (3.0, 7.5, 22.7),
    "angin": (6.2, 9.0, 13.6),
    "hari_tanpa_hujan": (5, 10, 20),
}

SEMESTA = {
    "suhu": np.arange(15, 40.1, 0.1),
    "kelembapan": np.arange(20, 100.1, 0.5),
    "hujan": np.arange(0, 250.1, 0.5),
    "angin": np.arange(0, 40.1, 0.1),
    "hari_tanpa_hujan": np.arange(0, 70.1, 0.5),
}

LABEL = {
    "suhu": ["rendah", "sedang", "tinggi"],
    "kelembapan": ["kering", "sedang", "lembap"],
    "hujan": ["rendah", "sedang", "tinggi"],
    "angin": ["pelan", "sedang", "kencang"],
    "hari_tanpa_hujan": ["pendek", "menengah", "panjang"],
}

# skor bahaya tiap himpunan (0 aman, 2 paling bahaya)
SKOR_HUJAN = {"tinggi": 0, "sedang": 1, "rendah": 2}
SKOR_HTH = {"pendek": 0, "menengah": 1, "panjang": 2}
SKOR_SUHU = {"rendah": 0, "sedang": 1, "tinggi": 2}
SKOR_LEMBAP = {"lembap": 0, "sedang": 1, "kering": 2}
SKOR_ANGIN = {"pelan": 0, "sedang": 1, "kencang": 2}
SKOR_3 = {"rendah": 0, "sedang": 1, "tinggi": 2}
KELAS_4 = {0: "rendah", 1: "rendah", 2: "sedang", 3: "tinggi", 4: "sangat tinggi"}
NAMA_KELAS = ["Rendah", "Sedang", "Tinggi", "Sangat Tinggi"]

U_OUT = np.arange(0, 100.1, 0.5)
MF_3 = {
    "rendah": fuzz.trapmf(U_OUT, [0, 0, 20, 50]),
    "sedang": fuzz.trimf(U_OUT, [20, 50, 80]),
    "tinggi": fuzz.trapmf(U_OUT, [50, 80, 100, 100]),
}
MF_4 = {
    "rendah": fuzz.trapmf(U_OUT, [0, 0, 12.5, 37.5]),
    "sedang": fuzz.trimf(U_OUT, [12.5, 37.5, 62.5]),
    "tinggi": fuzz.trimf(U_OUT, [37.5, 62.5, 87.5]),
    "sangat tinggi": fuzz.trapmf(U_OUT, [62.5, 87.5, 100, 100]),
}


def _buat_mf():
    # tiap input: 2 trapesium di ujung, 1 segitiga di tengah
    mf = {}
    for v in VARIABEL:
        u = SEMESTA[v]
        a, b, c = BATAS[v]
        mf[v] = {
            LABEL[v][0]: fuzz.trapmf(u, [u[0], u[0], a, b]),
            LABEL[v][1]: fuzz.trimf(u, [a, b, c]),
            LABEL[v][2]: fuzz.trapmf(u, [b, c, u[-1], u[-1]]),
        }
    return mf


MF = _buat_mf()


def _susun_aturan():
    # 9 aturan kekeringan, 27 aturan cuaca api, 9 aturan risiko (total 45)
    kering = []
    for h, t in product(LABEL["hujan"], LABEL["hari_tanpa_hujan"]):
        s = SKOR_HUJAN[h] + SKOR_HTH[t]
        keluar = "rendah" if s <= 1 else ("sedang" if s == 2 else "tinggi")
        kering.append(([("hujan", h), ("hari_tanpa_hujan", t)], keluar))

    api = []
    for su, ke, an in product(LABEL["suhu"], LABEL["kelembapan"], LABEL["angin"]):
        s = SKOR_SUHU[su] + SKOR_LEMBAP[ke] + SKOR_ANGIN[an]
        keluar = "rendah" if s <= 2 else ("sedang" if s == 3 else "tinggi")
        api.append(([("suhu", su), ("kelembapan", ke), ("angin", an)], keluar))

    risiko = []
    for kr, ap in product(MF_3, MF_3):
        s = SKOR_3[kr] + SKOR_3[ap]
        risiko.append(((kr, ap), KELAS_4[s]))
    return kering, api, risiko


ATURAN_KERING, ATURAN_API, ATURAN_RISIKO = _susun_aturan()
assert len(ATURAN_KERING) + len(ATURAN_API) + len(ATURAN_RISIKO) == 45


def mamdani(aturan, mf_keluar):
    # sama persis dengan notebook: implikasi MIN, agregasi MAX, defuzzifikasi centroid
    n = len(aturan[0][0][0])
    agregasi = np.zeros((n, len(U_OUT)), dtype=np.float32)
    for anteseden, keluar in aturan:
        kekuatan = np.minimum.reduce(anteseden).astype(np.float32)
        klip = np.minimum(kekuatan[:, None], mf_keluar[keluar][None, :].astype(np.float32))
        agregasi = np.maximum(agregasi, klip)
    return (agregasi * U_OUT).sum(axis=1) / (agregasi.sum(axis=1) + 1e-9)


def hitung_risiko(df):
    """Terima DataFrame berkolom suhu, kelembapan, hujan, angin, hari_tanpa_hujan.

    Kembalikan salinannya dengan tambahan kolom indeks_kekeringan,
    indeks_cuaca_api, skor_risiko, dan kelas_risiko.
    """
    hasil = df.copy()

    # fuzzifikasi (nilai di luar semesta dipotong ke ujung semesta)
    derajat = {}
    for v in VARIABEL:
        nilai = np.clip(hasil[v].to_numpy(dtype=float), SEMESTA[v][0], SEMESTA[v][-1])
        derajat[v] = {lab: fuzz.interp_membership(SEMESTA[v], MF[v][lab], nilai) for lab in LABEL[v]}

    # tingkat 1: indeks kekeringan dan indeks cuaca api
    aturan = [([derajat[v][lab] for v, lab in kond], keluar) for kond, keluar in ATURAN_KERING]
    hasil["indeks_kekeringan"] = mamdani(aturan, MF_3)

    aturan = [([derajat[v][lab] for v, lab in kond], keluar) for kond, keluar in ATURAN_API]
    hasil["indeks_cuaca_api"] = mamdani(aturan, MF_3)

    # tingkat 2: skor risiko dari kedua indeks
    d_kering = {lab: fuzz.interp_membership(U_OUT, MF_3[lab], hasil["indeks_kekeringan"].to_numpy()) for lab in MF_3}
    d_api = {lab: fuzz.interp_membership(U_OUT, MF_3[lab], hasil["indeks_cuaca_api"].to_numpy()) for lab in MF_3}
    aturan = [([d_kering[kr], d_api[ap]], keluar) for (kr, ap), keluar in ATURAN_RISIKO]
    hasil["skor_risiko"] = mamdani(aturan, MF_4)

    hasil["kelas_risiko"] = pd.cut(
        hasil["skor_risiko"],
        bins=[0, 25, 50, 75, 100],
        labels=NAMA_KELAS,
        include_lowest=True,
    ).astype(str)
    return hasil


def hitung_hari_tanpa_hujan(deret_hujan, awal=0):
    """Hitung hari berturut-turut dengan hujan di bawah 3 mm.

    Hari kering ikut dihitung (hari itu +1), hujan 3 mm atau lebih mereset ke 0.
    awal = hitungan sebelum data pertama.
    """
    hasil = []
    hitung = awal
    for h in deret_hujan:
        hitung = hitung + 1 if h < AMBANG_HUJAN else 0
        hasil.append(hitung)
    return hasil
