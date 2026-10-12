"""Salin angka dan gambar hasil riset dari notebook ke berkas web.

Jalankan: python python/ekstrak_riset.py
Butuh Pillow untuk mengecilkan gambar (pip install pillow), tidak dipakai workflow harian.

Hasil:
- data/validasi.json   angka grafik halaman Tentang (E6, F2, F3, H2, H3, H4, H5)
- data/cara_kerja.json batas fungsi keanggotaan dan tabel aturan halaman Cara Kerja
- img/riset/*.png      grafik yang datanya tidak ada di repo (H1, G2, G3)

Semua angka dibaca dari output teks notebook, tidak diketik ulang. Kecuali
jumlah sel matriks kebingungan (H2) yang hanya tertulis di gambar sel 69,
jadi dicek silang ke output teks sel 5, 56, dan 70 sebelum ditulis.
"""
import base64
import io
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NOTEBOOK = ROOT / "riset" / "fuzzy-mamdani-karhutla-kaltim.ipynb"
OUT_VALIDASI = ROOT / "data" / "validasi.json"
OUT_CARA = ROOT / "data" / "cara_kerja.json"
DIR_GAMBAR = ROOT / "img" / "riset"

KELAS = ["Rendah", "Sedang", "Tinggi", "Sangat Tinggi"]
POLA_KELAS = r"(Sangat Tinggi|Rendah|Sedang|Tinggi)"

# angka H2 dari gambar sel 69 (bukan teks), dicek silang di cek_h2()
H2_GAMBAR = {"tn": 455101, "fp": 98329, "fn": 7433, "tp": 11597}

# gambar yang diambil: (penanda awal kode sel, nama berkas, lebar maksimum px)
GAMBAR = [
    ("# kurva ROC tiga metode", "h1-kurva-roc.png", 900),
    ("# peta risiko hari paling aman vs paling berisiko 2026", "g2-peta-aman-vs-berisiko-2026.png", 1400),
    ("# studi kasus harian juli sampai 20 september 2026", "g3-deret-harian-jul-sep-2026.png", 1600),
]


def cari_sel(nb, penanda):
    """Cari sel kode yang diawali komentar penanda. Kembalikan (nomor, sel)."""
    for i, sel in enumerate(nb["cells"]):
        if sel["cell_type"] == "code" and "".join(sel["source"]).lstrip().startswith(penanda):
            return i, sel
    raise ValueError(f"sel dengan penanda {penanda!r} tidak ditemukan")


def teks(sel):
    hasil = ""
    for o in sel.get("outputs", []):
        if o.get("output_type") == "stream":
            hasil += "".join(o["text"])
        elif "text/plain" in o.get("data", {}):
            hasil += "".join(o["data"]["text/plain"]) + "\n"
    return hasil


def ambil(nb, penanda):
    i, sel = cari_sel(nb, penanda)
    return i, teks(sel)


def angka(s):
    return int(s) if re.fullmatch(r"-?\d+", s) else float(s)


def satu(pola, isi):
    m = re.search(pola, isi)
    if not m:
        raise ValueError(f"pola {pola!r} tidak ditemukan")
    return m


def baris_kelas(isi):
    """Kumpulkan angka per kelas dari tabel pandas (termasuk tabel yang terpotong 2 blok)."""
    kumpul = {k: [] for k in KELAS}
    for line in isi.splitlines():
        m = re.match(POLA_KELAS + r"\s+([\d.\s]+)$", line.strip())
        if m:
            kumpul[m.group(1)] += [angka(x) for x in m.group(2).split()]
    return kumpul


def susun_validasi(nb):
    v = {"sumber": "riset/fuzzy-mamdani-karhutla-kaltim.ipynb", "dibuat_oleh": "python/ekstrak_riset.py"}

    i5, t5 = ambil(nb, "# baca data cuaca grid 0,25")
    i38, t38 = ambil(nb, "# buang titik tambang")
    i46, t46 = ambil(nb, "# hitung titik panas per grid per hari")
    i50, t50 = ambil(nb, "# grafik per kelas + deret waktu bulanan")
    i62, t62 = ambil(nb, "# studi kasus harian juli sampai 20 september 2026")
    v["ringkasan"] = {
        "hari_grid": angka(satu(r"\((\d+), \d+\)", t5).group(1)),
        "periode": satu(r"(\d{4}-\d{2}-\d{2} sampai \d{4}-\d{2}-\d{2})", t5).group(1),
        "titik_grid": angka(satu(r"(\d+) titik grid", t5).group(1)),
        "titik_panas": angka(satu(r"titik panas bersih: (\d+)", t38).group(1)),
        "persen_hari_grid_ada_api": angka(satu(r"persen hari-grid ada api: ([\d.]+)", t46).group(1)),
        "spearman_bulanan": angka(satu(r"korelasi Spearman bulanan: ([\d.]+)", t50).group(1)),
        "spearman_harian_jul_sep_2026": angka(satu(r"spearman harian Jul sampai Sep 2026: ([\d.]+)", t62).group(1)),
        "sel": {"hari_grid": i5, "periode": i5, "titik_grid": i5, "titik_panas": i38,
                "persen_hari_grid_ada_api": i46, "spearman_bulanan": i50, "spearman_harian_jul_sep_2026": i62},
    }

    i, t = ambil(nb, "# persentase hari ada api per kelas risiko")
    k = baris_kelas(t)
    v["e6"] = {"sel": i, "kelas": [
        {"kelas": n, "jumlah_hari_grid": k[n][0], "persen_ada_api": k[n][1],
         "rata2_titik_panas": k[n][2], "kali_lipat_vs_rata2": k[n][3]} for n in KELAS]}

    i, t = ambil(nb, "# bandingkan AUC harian dan spearman bulanan")
    v["f2"] = {"sel": i, "metode": [
        {"metode": m.group(1).strip(), "auc": angka(m.group(2)), "spearman_bulanan": angka(m.group(3))}
        for m in re.finditer(r"^\d+\s+(.+?)\s+([\d.]+)\s+([\d.]+)\s*$", t, re.M)]}

    i, t = ambil(nb, "# kalau kelas Tinggi + Sangat Tinggi dianggap alarm")
    m = satu(r"hari alarm: (\d+) \(([\d.]+)%", t)
    v["f3"] = {"sel": i, "hari_alarm": angka(m.group(1)), "persen_hari_alarm": angka(m.group(2)),
               "presisi": angka(satu(r"presisi: ([\d.]+)", t).group(1)),
               "recall": angka(satu(r"recall: ([\d.]+)", t).group(1))}

    i70, t70 = ambil(nb, "# ukuran kinerja dari matriks kebingungan")
    blok1 = t70.split("\n\n")[0]
    ukuran = [{"ukuran": m.group(1).strip(), "nilai": angka(m.group(2))}
              for m in re.finditer(r"^\d+\s+(.+?)\s+([\d.]+)\s*$", blok1, re.M)]
    arti = [m.group(1).strip() for m in re.finditer(r"^\d+\s+(.+?)\s*$", t70.split("\n\n")[1], re.M)]
    for u, a in zip(ukuran, arti):
        u["arti"] = a
    i69, _ = cari_sel(nb, "# matriks kebingungan alarm")
    v["h2"] = dict(H2_GAMBAR, sel_gambar=i69, sel_ukuran=i70, ukuran=ukuran)
    v["h2"]["verifikasi"] = cek_h2(v)

    i, t = ambil(nb, "# porsi hari-grid vs porsi titik panas")
    k = baris_kelas(t)
    v["h3"] = {"sel": i,
               "persen_titik_panas_di_hari_alarm": angka(satu(r"hari alarm: ([\d.]+) %", t).group(1)),
               "kelas": [{"kelas": n, "hari": k[n][0], "titik": k[n][1],
                          "persen_hari_grid": k[n][2], "persen_titik_panas": k[n][3]} for n in KELAS]}

    i, t = ambil(nb, "# geser ambang alarm")
    v["h4"] = {"sel": i, "ambang_dipakai": 50, "baris": [
        dict(zip(["ambang", "persen_hari_alarm", "presisi", "recall", "f1", "lift"], map(angka, m.groups())))
        for m in re.finditer(r"^\d+\s+(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$", t, re.M)]}

    i, t = ambil(nb, "# AUC tiap tahun")
    kepala = next(line for line in t.splitlines() if "Fuzzy Mamdani" in line)
    nama = sorted(["Fuzzy Mamdani", "If-else tegas", "Hari tanpa hujan saja"], key=kepala.index)
    baris = [m.groups() for m in re.finditer(r"^(\d{4})\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$", t, re.M)]
    v["h5"] = {"sel": i, "tahun": [int(b[0]) for b in baris],
               "seri": {n: [angka(b[j + 1]) for b in baris] for j, n in enumerate(nama)}}

    i, t = ambil(nb, "# cari tanggal paling berisiko di musim kering 2026")
    v["g1"] = {"sel": i, "hari": [{"tanggal": m.group(1), "skor": angka(m.group(2)), "titik_panas": angka(m.group(3))}
                                  for m in re.finditer(r"^(\d{4}-\d{2}-\d{2})\s+([\d.]+)\s+(\d+)\s*$", t, re.M)]}
    return v


def cek_h2(v):
    h = H2_GAMBAR
    u = {x["ukuran"]: x["nilai"] for x in v["h2"]["ukuran"]}
    total = h["tn"] + h["fp"] + h["fn"] + h["tp"]
    cek = {
        "tp_plus_fp_sama_hari_alarm_sel_56": h["tp"] + h["fp"] == v["f3"]["hari_alarm"],
        "jumlah_empat_sel_sama_baris_data_sel_5": total == v["ringkasan"]["hari_grid"],
        "presisi_sama_sel_70": round(100 * h["tp"] / (h["tp"] + h["fp"]), 2) == u["Presisi"],
        "recall_sama_sel_70": round(100 * h["tp"] / (h["tp"] + h["fn"]), 2) == u["Recall (sensitivitas)"],
        "spesifisitas_sama_sel_70": round(100 * h["tn"] / (h["tn"] + h["fp"]), 2) == u["Spesifisitas"],
        "akurasi_sama_sel_70": round(100 * (h["tp"] + h["tn"]) / total, 2) == u["Akurasi"],
    }
    if not all(cek.values()):
        raise ValueError(f"angka H2 tidak cocok dengan output teks: {cek}")
    cek["catatan"] = ("TN, FP, FN, TP hanya tertulis di gambar sel 69. Dicek silang: TP+FP = hari alarm (sel 56), "
                      "jumlah keempatnya = jumlah baris data (sel 5), dan presisi, recall, spesifisitas, akurasi "
                      "hasil hitung ulang sama dengan sel 70.")
    return cek


def susun_cara_kerja(nb):
    c = {"sumber": "riset/fuzzy-mamdani-karhutla-kaltim.ipynb", "dibuat_oleh": "python/ekstrak_riset.py"}

    i, t = ambil(nb, "# batas dikunci sama dengan versi 52 titik")
    c["batas"] = {"sel": i, "variabel": {
        m.group(1): [angka(m.group(2)), angka(m.group(3)), angka(m.group(4))]
        for m in re.finditer(r"^(\w+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$", t, re.M)}}

    pola = r"^\d+\s+(\S+)\s+(\S+)\s+(\d+)\s+(.+?)\s*$"
    i, t = ambil(nb, "# 9 aturan kekeringan")
    c["aturan_kekeringan"] = {"sel": i, "kolom": ["curah hujan", "hari tanpa hujan", "skor", "kekeringan"],
                              "baris": [[m.group(1), m.group(2), int(m.group(3)), m.group(4)] for m in re.finditer(pola, t, re.M)]}
    i, t = ambil(nb, "# 27 aturan cuaca api")
    c["aturan_cuaca_api"] = {"sel": i, "kolom": ["suhu", "kelembapan", "angin", "skor", "cuaca api"],
                             "baris": [[m.group(1), m.group(2), m.group(3), int(m.group(4)), m.group(5)]
                                       for m in re.finditer(r"^\d+\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(.+?)\s*$", t, re.M)]}
    i, t = ambil(nb, "# 9 aturan risiko")
    c["aturan_risiko"] = {"sel": i, "kolom": ["kekeringan", "cuaca api", "skor", "risiko"],
                          "baris": [[m.group(1), m.group(2), int(m.group(3)), m.group(4)] for m in re.finditer(pola, t, re.M)]}
    return c


def cek_dengan_modul(c):
    """Pastikan isi notebook sama dengan python/fuzzy_karhutla.py (modul hanya dibaca)."""
    sys.path.insert(0, str(ROOT / "python"))
    import fuzzy_karhutla as fk

    for var, nilai in c["batas"]["variabel"].items():
        if tuple(float(x) for x in nilai) != tuple(float(x) for x in fk.BATAS[var]):
            raise ValueError(f"batas {var} di notebook beda dengan fuzzy_karhutla.py")
    jumlah = len(c["aturan_kekeringan"]["baris"]) + len(c["aturan_cuaca_api"]["baris"]) + len(c["aturan_risiko"]["baris"])
    if (len(c["aturan_kekeringan"]["baris"]), len(c["aturan_cuaca_api"]["baris"]), len(c["aturan_risiko"]["baris"]), jumlah) != (9, 27, 9, 45):
        raise ValueError("jumlah aturan bukan 9 + 27 + 9 = 45")
    for (kond, keluar), b in zip(fk.ATURAN_KERING, c["aturan_kekeringan"]["baris"]):
        if [lab for _, lab in kond] + [keluar] != [b[0], b[1], b[3]]:
            raise ValueError(f"aturan kekeringan beda: {b}")
    for (kond, keluar), b in zip(fk.ATURAN_API, c["aturan_cuaca_api"]["baris"]):
        if [lab for _, lab in kond] + [keluar] != [b[0], b[1], b[2], b[4]]:
            raise ValueError(f"aturan cuaca api beda: {b}")
    for ((kr, ap), keluar), b in zip(fk.ATURAN_RISIKO, c["aturan_risiko"]["baris"]):
        if [kr, ap, keluar] != [b[0], b[1], b[3]]:
            raise ValueError(f"aturan risiko beda: {b}")

    # himpunan output: parameter dicek ulang terhadap array di modul
    import numpy as np
    import skfuzzy as fuzz
    keluaran = {
        "tiga_kelas": {"rendah": [0, 0, 20, 50], "sedang": [20, 50, 80], "tinggi": [50, 80, 100, 100]},
        "empat_kelas": {"rendah": [0, 0, 12.5, 37.5], "sedang": [12.5, 37.5, 62.5],
                        "tinggi": [37.5, 62.5, 87.5], "sangat tinggi": [62.5, 87.5, 100, 100]},
    }
    for nama, acuan in (("tiga_kelas", fk.MF_3), ("empat_kelas", fk.MF_4)):
        for lab, p in keluaran[nama].items():
            buat = fuzz.trapmf(fk.U_OUT, p) if len(p) == 4 else fuzz.trimf(fk.U_OUT, p)
            if not np.allclose(buat, acuan[lab]):
                raise ValueError(f"himpunan output {nama} {lab} beda dengan modul")
    c["himpunan_output"] = keluaran
    c["skor_bahaya"] = {"suhu": fk.SKOR_SUHU, "kelembapan": fk.SKOR_LEMBAP, "hujan": fk.SKOR_HUJAN,
                        "angin": fk.SKOR_ANGIN, "hari_tanpa_hujan": fk.SKOR_HTH}
    c["label"] = fk.LABEL


def simpan_gambar(nb):
    from PIL import Image

    DIR_GAMBAR.mkdir(parents=True, exist_ok=True)
    daftar = []
    for penanda, nama, lebar in GAMBAR:
        i, sel = cari_sel(nb, penanda)
        png = next(o["data"]["image/png"] for o in sel["outputs"] if "image/png" in o.get("data", {}))
        img = Image.open(io.BytesIO(base64.b64decode(png))).convert("RGB")
        if img.width > lebar:
            img = img.resize((lebar, round(img.height * lebar / img.width)), Image.LANCZOS)
        # grafik matplotlib cukup 128 warna, ukurannya jauh lebih kecil
        img = img.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        tujuan = DIR_GAMBAR / nama
        img.save(tujuan, optimize=True)
        daftar.append((nama, i, img.size, tujuan.stat().st_size))
    return daftar


def tulis(data, tujuan):
    with open(tujuan, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write("\n")


def main():
    nb = json.loads(NOTEBOOK.read_text(encoding="utf-8"))
    validasi = susun_validasi(nb)
    cara = susun_cara_kerja(nb)
    cek_dengan_modul(cara)
    tulis(validasi, OUT_VALIDASI)
    tulis(cara, OUT_CARA)
    print(f"OK: {OUT_VALIDASI.relative_to(ROOT)} dan {OUT_CARA.relative_to(ROOT)} ditulis.")
    for nama, i, (w, h), ukuran in simpan_gambar(nb):
        print(f"OK: img/riset/{nama} dari sel {i}, {w}x{h}, {ukuran / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
