/* Grafik riset untuk halaman Tentang, Cara Kerja, dan detail teknis: SVG buatan sendiri tanpa library,
   animasi sekali saat masuk layar, lightbox gambar, dan daftar isi aktif.
   Angka dibaca dari data/validasi.json, data/cara_kerja.json, dan data/contoh_hitung.json. */
(function () {
  "use strict";
  var KELAS = { "Rendah": "#3A9D5D", "Sedang": "#F2C94C", "Tinggi": "#E46A2E", "Sangat Tinggi": "#9B1C1C" };
  var BAHAYA = ["#3A9D5D", "#F2C94C", "#E46A2E"]; // warna himpunan menurut skor bahaya 0, 1, 2
  var METODE = {
    "Fuzzy Mamdani": { warna: "#0B2A42", garis: "", tebal: 3 },
    "If-else tegas": { warna: "#2E6192", garis: "7 5", tebal: 2.2 },
    "Hari tanpa hujan saja": { warna: "#73777E", garis: "2 4", tebal: 2.2 }
  };
  var NAMA_VAR = { suhu: "Suhu maksimum", kelembapan: "Kelembapan minimum", hujan: "Curah hujan", angin: "Angin maksimum", hari_tanpa_hujan: "Hari tanpa hujan" };
  var PENDEK = { suhu: "suhu", kelembapan: "kelembapan", hujan: "hujan", angin: "angin", hari_tanpa_hujan: "hari tanpa hujan", indeks_kekeringan: "kekeringan", indeks_cuaca_api: "cuaca api" };
  var SATUAN = { suhu: "°C", kelembapan: "%", hujan: "mm", angin: "km/jam", hari_tanpa_hujan: "hari" };
  var DASAR = {
    suhu: "P10, P50, P90 data harian",
    kelembapan: "P10, P50, P90 data harian",
    hujan: "Ambang 3 mm, P50, P90 data harian",
    angin: "P10, P50, P90 data harian",
    hari_tanpa_hujan: "Kategori BMKG (5, 10, 20 hari)"
  };
  // rentang sumbu x grafik fungsi keanggotaan (hanya tampilan, semesta aslinya lebih lebar)
  var RENTANG = { suhu: [22, 35], kelembapan: [40, 95], hujan: [0, 40], angin: [2, 20], hari_tanpa_hujan: [0, 30] };
  var VARIABEL = ["suhu", "kelembapan", "hujan", "angin", "hari_tanpa_hujan"];
  var GERAK = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var data = {}, nomorUnik = 0, pengamat = null;

  function $(id) { return document.getElementById(id); }
  function fmt(n, d) {
    var s = Number(n).toFixed(d || 0).split(".");
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return s.join(",");
  }
  function fmtPas(n) { return Number.isInteger(Number(n)) ? fmt(n) : fmt(n, 1); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function skala(d0, d1, r0, r1) { return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); }; }
  function bulat(n) { return Math.round(n * 10) / 10; }
  function svg(w, h, isi, label) {
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(label) + '">' + isi + "</svg>";
  }
  function teks(x, y, s, atr) { return '<text x="' + bulat(x) + '" y="' + bulat(y) + '"' + (atr || "") + ">" + s + "</text>"; }
  function garis(x1, y1, x2, y2, kls) {
    return '<line class="' + kls + '" x1="' + bulat(x1) + '" y1="' + bulat(y1) + '" x2="' + bulat(x2) + '" y2="' + bulat(y2) + '"/>';
  }
  function jalur(titik) {
    return titik.map(function (p, i) { return (i ? "L" : "M") + bulat(p[0]) + " " + bulat(p[1]); }).join("");
  }
  // label dua baris kalau ruangnya sempit, misalnya "Sangat Tinggi"
  function labelLipat(x, y, s, ruang, atr) {
    var kata = String(s).split(" ");
    if (ruang >= 96 || kata.length < 2) return teks(x, y, esc(s), atr);
    return '<text x="' + bulat(x) + '" y="' + bulat(y) + '"' + (atr || "") + ">" +
      '<tspan x="' + bulat(x) + '">' + esc(kata[0]) + '</tspan><tspan x="' + bulat(x) + '" dy="14">' + esc(kata.slice(1).join(" ")) + "</tspan></text>";
  }
  // tirai: clipPath yang melebar untuk animasi garis tergambar dari kiri ke kanan
  function tirai(x, y, w, h, tampil) {
    var id = "tirai" + (++nomorUnik);
    return {
      id: id,
      def: '<clipPath id="' + id + '"><rect data-tirai="' + bulat(w) + '" x="' + bulat(x) + '" y="' + bulat(y) + '" width="' + (tampil ? bulat(w) : 0) + '" height="' + bulat(h) + '"/></clipPath>'
    };
  }
  function contohGaris(warna, pola, tebal) {
    return '<svg width="26" height="10" aria-hidden="true"><line x1="1" y1="5" x2="25" y2="5" stroke="' + warna + '" stroke-width="' + (tebal || 2.5) + '"' +
      (pola ? ' stroke-dasharray="' + pola + '"' : "") + "/></svg>";
  }
  function contohKotak(warna) {
    return '<svg width="14" height="14" aria-hidden="true"><rect width="14" height="14" rx="3" fill="' + warna + '"/></svg>';
  }
  function legenda(isi) {
    return '<ul class="legenda-grafik">' + isi.map(function (x) { return "<li>" + x[0] + esc(x[1]) + "</li>"; }).join("") + "</ul>";
  }
  function badge(kelas) {
    var k = String(kelas).toLowerCase(), kode = k === "sangat tinggi" ? "sangat" : k;
    return '<span class="badge b-' + kode + '">' + esc(kelas) + "</span>";
  }

  /* ---------- Grafik halaman Tentang ---------- */

  // E6: persentase hari-grid ada titik panas per kelas
  function grafikE6(w) {
    var d = data.validasi.e6.kelas, h = 290, m = { l: 44, r: 8, t: 26, b: 50 };
    var y = skala(0, 30, h - m.b, m.t), lebar = (w - m.l - m.r) / d.length, isi = "";
    [0, 10, 20, 30].forEach(function (v) {
      isi += garis(m.l, y(v), w - m.r, y(v), v ? "kisi" : "sumbu") + teks(m.l - 8, y(v) + 4, fmt(v) + "%", ' text-anchor="end"');
    });
    d.forEach(function (k, i) {
      var bw = Math.min(lebar * 0.62, 96), x = m.l + i * lebar + (lebar - bw) / 2, yv = y(k.persen_ada_api);
      isi += '<rect class="batang" style="transition-delay:' + i * 140 + 'ms" x="' + bulat(x) + '" y="' + bulat(yv) + '" width="' + bulat(bw) +
        '" height="' + bulat(y(0) - yv) + '" rx="4" fill="' + KELAS[k.kelas] + '"/>';
      isi += teks(x + bw / 2, yv - 8, fmt(k.persen_ada_api, 2) + "%", ' class="nilai muncul" text-anchor="middle"');
      isi += labelLipat(x + bw / 2, h - m.b + 20, k.kelas, lebar, ' class="label" text-anchor="middle"');
    });
    return svg(w, h, isi, "Persentase hari-grid dengan titik panas: " + d.map(function (k) { return k.kelas + " " + fmt(k.persen_ada_api, 2) + "%"; }).join(", "));
  }

  // F2: AUC tiga metode
  function grafikF2(w) {
    var d = data.validasi.f2.metode.slice().sort(function (a, b) { return b.auc - a.auc; });
    var m = { l: 4, r: 54, t: 6, b: 46 }, baris = 62, h = m.t + d.length * baris + m.b;
    var x = skala(0.5, 1, m.l, w - m.r), isi = "";
    [0.5, 0.6, 0.7, 0.8, 0.9, 1].forEach(function (v) {
      isi += garis(x(v), m.t, x(v), h - m.b + 4, v === 0.5 ? "sumbu" : "kisi") + teks(x(v), h - m.b + 20, fmt(v, 1), ' text-anchor="middle"');
    });
    isi += teks(m.l, h - 6, "AUC 0,5 = setara tebakan acak, 1 = sempurna");
    d.forEach(function (k, i) {
      var y0 = m.t + i * baris, gaya = METODE[k.metode] || { warna: "#5F6E7B" };
      isi += '<text x="' + m.l + '" y="' + (y0 + 16) + '" class="label">' + esc(k.metode) +
        '<tspan dx="8" style="font-weight:400;fill:#5F6E7B;font-size:12px">' + (w < 420 ? "Spearman " : "Spearman bulanan ") + fmt(k.spearman_bulanan, 3) + "</tspan></text>";
      isi += '<rect class="batang h" style="transition-delay:' + i * 140 + 'ms" x="' + bulat(x(0.5)) + '" y="' + (y0 + 26) + '" width="' + bulat(x(k.auc) - x(0.5)) +
        '" height="22" rx="4" fill="' + gaya.warna + '"/>';
      isi += teks(x(k.auc) + 6, y0 + 42, fmt(k.auc, 3), ' class="nilai muncul"');
    });
    return svg(w, h, isi, "AUC: " + d.map(function (k) { return k.metode + " " + fmt(k.auc, 3); }).join(", "));
  }

  // H2: matriks kebingungan sistem peringatan
  function grafikH2(w) {
    var v = data.validasi.h2, sempit = w < 460, lk = sempit ? 70 : 120, atas = 34, h = sempit ? 250 : 270;
    var cw = (w - lk) / 2, ch = (h - atas) / 2, isi = "";
    isi += teks(lk + cw / 2, 20, "Sistem: tidak alarm", ' class="label" text-anchor="middle"');
    isi += teks(lk + cw * 1.5, 20, "Sistem: alarm", ' class="label" text-anchor="middle"');
    isi += labelLipat(lk - 10, atas + ch / 2 - (sempit ? 2 : -4), "Tidak ada api", sempit ? 0 : 200, ' class="label" text-anchor="end"');
    isi += teks(lk - 10, atas + ch * 1.5 + 4, "Ada api", ' class="label" text-anchor="end"');
    [
      ["Benar aman", v.tn, "#236B3B", 0, 0],
      ["Alarm palsu", v.fp, "#8C6B13", 1, 0],
      ["Api terlewat", v.fn, "#8B231D", 0, 1],
      ["Api tertangkap", v.tp, "#1B5E89", 1, 1]
    ].forEach(function (s, i) {
      var x = lk + s[3] * cw, y = atas + s[4] * ch;
      isi += '<g class="muncul" style="transition-delay:' + i * 160 + 'ms"><rect x="' + bulat(x + 3) + '" y="' + bulat(y + 3) + '" width="' + bulat(cw - 6) + '" height="' + bulat(ch - 6) + '" rx="10" fill="' + s[2] + '"/>' +
        teks(x + cw / 2, y + ch / 2 - 6, s[0], ' class="label putih" text-anchor="middle"') +
        teks(x + cw / 2, y + ch / 2 + 18, fmt(s[1]), ' class="nilai putih" text-anchor="middle" style="font-size:' + (sempit ? 16 : 20) + 'px"') + "</g>";
    });
    var u = {};
    v.ukuran.forEach(function (x) { u[x.ukuran] = x; });
    var kartu = [["Recall (sensitivitas)", "Api tertangkap", "%"], ["Presisi", "Alarm yang benar ada api", "%"], ["Spesifisitas", "Hari tanpa api dinilai aman", "%"], ["Lift", "Dibanding asal pilih hari", " kali"]];
    return svg(w, h, isi, "Matriks kebingungan: benar aman " + fmt(v.tn) + ", alarm palsu " + fmt(v.fp) + ", api terlewat " + fmt(v.fn) + ", api tertangkap " + fmt(v.tp)) +
      '<ul class="angka-kunci">' + kartu.map(function (k) {
        return "<li><b>" + fmt(u[k[0]].nilai, 2) + k[2] + "</b>" + esc(k[1]) + "</li>";
      }).join("") + "</ul>";
  }

  // H3: porsi hari-grid vs porsi titik panas per kelas
  function grafikH3(w) {
    var d = data.validasi.h3.kelas, m = { l: 4, r: 58, t: 4, b: 30 }, baris = 70, h = m.t + d.length * baris + m.b;
    var x = skala(0, 60, m.l, w - m.r), isi = "", ABU = "#73777E";
    [0, 20, 40, 60].forEach(function (v) {
      isi += garis(x(v), m.t, x(v), h - m.b + 4, v ? "kisi" : "sumbu") + teks(x(v), h - m.b + 20, fmt(v) + "%", ' text-anchor="' + (v ? "middle" : "start") + '"');
    });
    d.forEach(function (k, i) {
      var y0 = m.t + i * baris;
      isi += teks(m.l, y0 + 15, esc(k.kelas), ' class="label"');
      [[k.persen_hari_grid, ABU, 24], [k.persen_titik_panas, KELAS[k.kelas], 44]].forEach(function (b, j) {
        isi += '<rect class="batang h" style="transition-delay:' + (i * 140 + j * 80) + 'ms" x="' + bulat(x(0)) + '" y="' + (y0 + b[2]) + '" width="' + bulat(x(b[0]) - x(0)) + '" height="16" rx="3" fill="' + b[1] + '"/>';
        isi += teks(x(b[0]) + 6, y0 + b[2] + 13, fmt(b[0], 2) + "%", ' class="nilai muncul"' + (j ? "" : ' style="font-weight:400;fill:#5F6E7B"'));
      });
    });
    return legenda([[contohKotak(ABU), "Porsi seluruh hari-grid"], [contohKotak("#E46A2E"), "Porsi titik panas (warna kelas)"]]) +
      svg(w, h, isi, "Porsi hari-grid dan titik panas per kelas: " + d.map(function (k) { return k.kelas + " " + fmt(k.persen_hari_grid, 2) + "% hari, " + fmt(k.persen_titik_panas, 2) + "% titik panas"; }).join("; "));
  }

  // grafik garis umum (H4, H5)
  function grafikGaris(w, tampil, o) {
    var h = w < 520 ? 260 : 300, m = { l: 46, r: 16, t: o.tanda ? 26 : 12, b: 34 };
    var x0 = o.x[0], x1 = o.x[o.x.length - 1];
    var x = skala(x0, x1, m.l, w - m.r), y = skala(o.yMin, o.yMax, h - m.b, m.t);
    var t = tirai(m.l - 8, 0, w - m.l - m.r + 16, h, tampil), isi = "<defs>" + t.def + "</defs>";
    o.yTick.forEach(function (v) {
      isi += garis(m.l, y(v), w - m.r, y(v), v === o.yMin ? "sumbu" : "kisi") + teks(m.l - 8, y(v) + 4, o.fmtY(v), ' text-anchor="end"');
    });
    var langkah = (w - m.l - m.r) / (o.x.length - 1) < 34 ? 2 : 1;
    o.x.forEach(function (v, i) {
      if (i % langkah === 0 || i === o.x.length - 1) isi += teks(x(v), h - m.b + 20, String(v), ' text-anchor="middle"');
    });
    if (o.tanda) {
      isi += garis(x(o.tanda.x), m.t, x(o.tanda.x), h - m.b, "tanda") + teks(x(o.tanda.x), m.t - 10, esc(o.tanda.teks), ' class="label" text-anchor="middle"');
    }
    isi += '<g clip-path="url(#' + t.id + ')">';
    o.seri.forEach(function (s) {
      var titik = s.nilai.map(function (v, i) { return [x(o.x[i]), y(v)]; });
      isi += '<path d="' + jalur(titik) + '" fill="none" stroke="' + s.warna + '" stroke-width="' + (s.tebal || 2.4) + '" stroke-linejoin="round" stroke-linecap="round"' +
        (s.garis ? ' stroke-dasharray="' + s.garis + '"' : "") + "/>";
      titik.forEach(function (p, i) {
        isi += '<circle cx="' + bulat(p[0]) + '" cy="' + bulat(p[1]) + '" r="3.2" fill="' + s.warna + '"><title>' + esc(s.nama) + ", " + o.x[i] + ": " + o.fmtNilai(s.nilai[i]) + "</title></circle>";
      });
    });
    isi += "</g>";
    return legenda(o.seri.map(function (s) { return [contohGaris(s.warna, s.garis, s.tebal), s.nama]; })) + svg(w, h, isi, o.label);
  }

  // H4: presisi, recall, F1 terhadap ambang alarm
  function grafikH4(w, tampil) {
    var d = data.validasi.h4;
    function kolom(k) { return d.baris.map(function (b) { return b[k]; }); }
    return grafikGaris(w, tampil, {
      x: kolom("ambang"), yMin: 0, yMax: 100, yTick: [0, 25, 50, 75, 100],
      fmtY: function (v) { return fmt(v) + "%"; }, fmtNilai: function (v) { return fmt(v, 2) + "%"; },
      tanda: { x: d.ambang_dipakai, teks: "Ambang dipakai (" + d.ambang_dipakai + ")" },
      seri: [
        { nama: "Recall (api tertangkap)", warna: "#2E7D32", nilai: kolom("recall"), tebal: 3 },
        { nama: "Presisi (alarm benar)", warna: "#0E4A7A", nilai: kolom("presisi"), garis: "7 5" },
        { nama: "F1 (keseimbangan)", warna: "#D97706", nilai: kolom("f1"), garis: "2 4" }
      ],
      label: "Presisi, recall, dan F1 untuk ambang 25 sampai 75"
    });
  }

  // H5: AUC per tahun tiga metode
  function grafikH5(w, tampil) {
    var d = data.validasi.h5;
    var urut = ["Fuzzy Mamdani", "If-else tegas", "Hari tanpa hujan saja"];
    return grafikGaris(w, tampil, {
      x: d.tahun, yMin: 0.55, yMax: 0.85, yTick: [0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85],
      fmtY: function (v) { return fmt(v, 2); }, fmtNilai: function (v) { return fmt(v, 3); },
      seri: urut.map(function (n) { return { nama: n, warna: METODE[n].warna, garis: METODE[n].garis, tebal: METODE[n].tebal, nilai: d.seri[n] }; }),
      label: "AUC per tahun 2019 sampai 2026 untuk tiga metode"
    });
  }

  /* ---------- Grafik halaman Cara Kerja ---------- */

  // fungsi keanggotaan satu variabel input: tepi trapesium, tengah segitiga
  function grafikMF(w, tampil, v) {
    var b = data.cara.batas.variabel[v], r = RENTANG[v], lab = data.cara.label[v], skor = data.cara.skor_bahaya[v];
    var xa = skala(r[0], r[1], 30, w - 14);
    // label tengah naik satu baris kalau terlalu dekat dengan label tepi (misalnya curah hujan di HP)
    var naik = Math.abs(xa(b[1]) - xa((r[0] + b[0]) / 2)) < 66 || Math.abs(xa((b[2] + r[1]) / 2) - xa(b[1])) < 66;
    var h = naik ? 216 : 200, m = { l: 30, r: 14, t: naik ? 46 : 30, b: 40 };
    var x = skala(r[0], r[1], m.l, w - m.r), y = skala(0, 1, h - m.b, m.t);
    var t = tirai(m.l - 4, 0, w - m.l - m.r + 8, h, tampil), isi = "<defs>" + t.def + "</defs>";
    isi += garis(m.l, y(0), w - m.r, y(0), "sumbu") + garis(m.l, y(1), w - m.r, y(1), "kisi");
    isi += teks(m.l - 8, y(0) + 4, "0", ' text-anchor="end"') + teks(m.l - 8, y(1) + 4, "1", ' text-anchor="end"');
    b.forEach(function (n) {
      isi += garis(x(n), y(0), x(n), y(1), "kisi") + teks(x(n), h - m.b + 18, fmtPas(n), ' class="label" text-anchor="middle"');
    });
    isi += teks(w - m.r, h - 4, SATUAN[v], ' text-anchor="end"');
    var bentuk = [
      [[r[0], 0], [r[0], 1], [b[0], 1], [b[1], 0]],
      [[b[0], 0], [b[1], 1], [b[2], 0]],
      [[b[1], 0], [b[2], 1], [r[1], 1], [r[1], 0]]
    ];
    var posLabel = [(r[0] + b[0]) / 2, b[1], (b[2] + r[1]) / 2];
    isi += '<g clip-path="url(#' + t.id + ')">';
    bentuk.forEach(function (bt, i) {
      var c = BAHAYA[skor[lab[i]]], p = bt.map(function (q) { return [x(q[0]), y(q[1])]; });
      isi += '<path d="' + jalur(p) + 'Z" fill="' + c + '" fill-opacity=".14" stroke="none"/>';
      isi += '<path d="' + jalur(i === 0 ? p.slice(1) : i === 2 ? p.slice(0, 3) : p) + '" fill="none" stroke="' + c + '" stroke-width="2.5" stroke-linejoin="round"/>';
    });
    isi += "</g>";
    lab.forEach(function (l, i) {
      var xl = Math.min(Math.max(x(posLabel[i]), m.l + 24), w - m.r - 30);
      isi += teks(xl, m.t - (naik && i === 1 ? 26 : 10), esc(l), ' class="nilai" text-anchor="middle" style="fill:' + BAHAYA[skor[l]] + '"');
    });
    return svg(w, h, isi, NAMA_VAR[v] + ": himpunan " + lab.join(", ") + " dengan batas " + b.map(fmtPas).join(", ") + " " + SATUAN[v]);
  }

  // himpunan output 3 kelas (indeks) dan 4 kelas (skor risiko)
  function grafikOutput(w, tampil, jenis) {
    var set = data.cara.himpunan_output[jenis], nama = Object.keys(set), empat = nama.length === 4;
    var warna = empat ? [KELAS.Rendah, KELAS.Sedang, KELAS.Tinggi, KELAS["Sangat Tinggi"]] : BAHAYA;
    var ruang = empat ? (w - 44) / 4 : 200, lipat = ruang < 96;
    var h = (empat ? 250 : 200) + (lipat ? 14 : 0), m = { l: 30, r: 14, t: lipat ? 44 : 30, b: empat ? 90 : 40 };
    var x = skala(0, 100, m.l, w - m.r), y = skala(0, 1, h - m.b, m.t);
    var t = tirai(m.l - 4, 0, w - m.l - m.r + 8, h, tampil), isi = "<defs>" + t.def + "</defs>";
    isi += garis(m.l, y(0), w - m.r, y(0), "sumbu") + garis(m.l, y(1), w - m.r, y(1), "kisi");
    isi += teks(m.l - 8, y(0) + 4, "0", ' text-anchor="end"') + teks(m.l - 8, y(1) + 4, "1", ' text-anchor="end"');
    (empat ? [0, 25, 50, 75, 100] : [0, 20, 50, 80, 100]).forEach(function (n) { isi += teks(x(n), y(0) + 18, String(n), ' text-anchor="middle"'); });
    isi += '<g clip-path="url(#' + t.id + ')">';
    nama.forEach(function (n, i) {
      var p = set[n], titik = p.length === 4 ? [[p[0], 0], [p[1], 1], [p[2], 1], [p[3], 0]] : [[p[0], 0], [p[1], 1], [p[2], 0]];
      var q = titik.map(function (z) { return [x(z[0]), y(z[1])]; });
      isi += '<path d="' + jalur(q) + 'Z" fill="' + warna[i] + '" fill-opacity=".14"/><path d="' + jalur(q) + '" fill="none" stroke="' + warna[i] + '" stroke-width="2.5" stroke-linejoin="round"/>';
    });
    isi += "</g>";
    nama.forEach(function (n, i) {
      var p = set[n], pusat = p.length === 4 ? (p[1] + p[2]) / 2 : p[1];
      // label di tepi digeser ke dalam supaya tidak terpotong
      var xl = Math.min(Math.max(x(pusat), m.l + 28), w - m.r - 44);
      isi += labelLipat(xl, m.t - (lipat && n.indexOf(" ") > 0 ? 26 : 12), n, ruang, ' class="nilai" text-anchor="middle" style="fill:' + warna[i] + '"');
    });
    if (empat) {
      var yk = h - 40;
      isi += teks(m.l, yk - 8, "Kelas akhir dari skor:");
      ["Rendah", "Sedang", "Tinggi", "Sangat Tinggi"].forEach(function (k, i) {
        var xa = x(i * 25), xb = x((i + 1) * 25);
        isi += '<rect x="' + bulat(xa + 1) + '" y="' + yk + '" width="' + bulat(xb - xa - 2) + '" height="34" rx="5" fill="' + KELAS[k] + '"/>';
        isi += labelLipat((xa + xb) / 2, yk + (xb - xa < 96 && k === "Sangat Tinggi" ? 14 : 21), k, xb - xa, ' class="label" text-anchor="middle" style="fill:' + (k === "Sedang" ? "#231b00" : "#fff") + ';font-size:12px"');
      });
    }
    return svg(w, h, isi, "Himpunan output " + nama.join(", "));
  }

  // derajat "kering" menurut kelembapan: batas kaku if-else vs himpunan fuzzy bertahap
  function grafikKaku(w, tampil) {
    var b = data.cara.batas.variabel.kelembapan, batas = data.contoh.kenapa_fuzzy.batas_kering, nama = data.cara.label.kelembapan[0];
    var r = [40, 80], h = 200, m = { l: 30, r: 14, t: 30, b: 40 };
    var x = skala(r[0], r[1], m.l, w - m.r), y = skala(0, 1, h - m.b, m.t);
    var t = tirai(m.l - 4, 0, w - m.l - m.r + 8, h, tampil), isi = "<defs>" + t.def + "</defs>";
    isi += garis(m.l, y(0), w - m.r, y(0), "sumbu") + garis(m.l, y(1), w - m.r, y(1), "kisi");
    isi += teks(m.l - 8, y(0) + 4, "0", ' text-anchor="end"') + teks(m.l - 8, y(1) + 4, "1", ' text-anchor="end"');
    [r[0], b[0], b[1], r[1]].forEach(function (n) {
      isi += teks(x(n), h - m.b + 18, fmtPas(n), ' class="label" text-anchor="middle"');
    });
    isi += teks(w - m.r, h - 4, SATUAN.kelembapan, ' text-anchor="end"');
    isi += garis(x(batas), m.t - 4, x(batas), y(0), "tanda") + teks(x(batas) + 6, m.t - 10, "Ambang " + fmtPas(batas) + "%", ' class="label" style="fill:#BA1A1A"');
    isi += teks(x(r[0]) + 6, m.t - 10, esc(nama), ' class="nilai" style="fill:' + BAHAYA[2] + '"');
    isi += '<g clip-path="url(#' + t.id + ')">';
    isi += '<path d="' + jalur([[x(r[0]), y(1)], [x(batas), y(1)], [x(batas), y(0)], [x(r[1]), y(0)]]) + '" fill="none" stroke="#73777E" stroke-width="2.5" stroke-dasharray="5 5"/>';
    isi += '<path d="' + jalur([[x(r[0]), y(1)], [x(b[0]), y(1)], [x(b[1]), y(0)], [x(r[1]), y(0)]]) + '" fill="none" stroke="#2E6192" stroke-width="3" stroke-linejoin="round"/>';
    isi += "</g>";
    return legenda([[contohGaris("#73777E", "5 5"), "Batas Kaku"], [contohGaris("#2E6192", "", 3), "Bertahap (Kami)"]]) +
      svg(w, h, isi, "Derajat " + nama + " menurut kelembapan: batas kaku " + fmtPas(batas) + "%, bertahap dari " + fmtPas(b[0]) + "% sampai " + fmtPas(b[1]) + "%");
  }

  var GRAFIK = {
    e6: grafikE6, f2: grafikF2, h2: grafikH2, h3: grafikH3, h4: grafikH4, h5: grafikH5, kaku: grafikKaku,
    "out-3": function (w, t) { return grafikOutput(w, t, "tiga_kelas"); },
    "out-4": function (w, t) { return grafikOutput(w, t, "empat_kelas"); }
  };
  VARIABEL.forEach(function (v) { GRAFIK["mf-" + v] = function (w, t) { return grafikMF(w, t, v); }; });

  /* ---------- Isi halaman Cara Kerja (tabel dan contoh) ---------- */

  function tabel(kolom, baris, kelasKolom) {
    return '<div class="tabel-gulir"><table class="tabel"><thead><tr>' + kolom.map(function (k, i) {
      return '<th class="' + ((kelasKolom || [])[i] || "") + '">' + esc(k) + "</th>";
    }).join("") + "</tr></thead><tbody>" + baris.map(function (b) {
      return "<tr>" + b.map(function (s, i) { return '<td class="' + ((kelasKolom || [])[i] || "") + '">' + s + "</td>"; }).join("") + "</tr>";
    }).join("") + "</tbody></table></div>";
  }

  function isiBatas() {
    var b = data.cara.batas.variabel;
    return tabel(["Variabel", "Satuan", "Batas bawah", "Tengah", "Batas atas", "Dasar penentuan"],
      VARIABEL.map(function (v) {
        return [esc(NAMA_VAR[v]), esc(SATUAN[v]), fmtPas(b[v][0]), fmtPas(b[v][1]), fmtPas(b[v][2]), '<span class="redam">' + esc(DASAR[v]) + "</span>"];
      }), ["", "", "angka", "angka", "angka", ""]);
  }

  function isiAturan(kunci) {
    var a = data.cara[kunci], akhir = a.kolom.length - 1;
    return tabel(["No"].concat(a.kolom), a.baris.map(function (b, i) {
      return [String(i + 1)].concat(b.map(function (s, j) { return j === akhir ? badge(s) : j === akhir - 1 ? String(s) : esc(s); }));
    }), ["angka"].concat(a.kolom.map(function (_, j) { return j === akhir - 1 ? "angka" : ""; })));
  }

  function isiKenapa() {
    var k = data.contoh.kenapa_fuzzy;
    return tabel(["Kelembapan", "If-else tegas (batas " + fmtPas(k.batas_kering) + "%)", "Fuzzy: derajat keanggotaan"],
      k.nilai.map(function (n) {
        return ["<b>" + fmt(n.kelembapan, 1) + "%</b>",
          n.ifelse_poin ? "Kering, 1 poin bahaya" : "Tidak kering, 0 poin",
          Object.keys(n.fuzzy).map(function (l) { return esc(l) + " " + (n.fuzzy[l] > 0 ? fmt(n.fuzzy[l], 2) : "0"); }).join(" · ")];
      }), ["angka", "", ""]);
  }

  function tanggalPanjang(tgl) {
    return new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  }

  function daftarAturan(aturan, namaKeluar) {
    var per = {};
    var html = "<ul>" + aturan.map(function (r) {
      (per[r.maka] = per[r.maka] || []).push(r.kekuatan);
      return "<li>JIKA " + r.jika.map(function (j) { return esc(PENDEK[j[0]]) + " <b>" + esc(j[1]) + "</b> (" + fmt(j[2], 2) + ")"; }).join(" DAN ") +
        " MAKA " + esc(namaKeluar) + " <b>" + esc(r.maka) + '</b><br><span class="rumus">kekuatan = MIN(' + r.jika.map(function (j) { return fmt(j[2], 2); }).join("; ") +
        ") = " + fmt(r.kekuatan, 2) + "</span></li>";
    }).join("") + "</ul>";
    var agregasi = Object.keys(per).map(function (k) {
      var n = per[k];
      return esc(namaKeluar) + " <b>" + esc(k) + "</b> = " + (n.length > 1 ? "MAX(" + n.map(function (x) { return fmt(x, 2); }).join("; ") + ") = " : "") + fmt(Math.max.apply(null, n), 2);
    });
    return html + '<p class="rumus">Agregasi MAX: ' + agregasi.join(", ") + "</p>";
  }

  function isiContoh(i) {
    var c = data.contoh.contoh[i], r = c.referensi;
    var derajat = VARIABEL.map(function (v) {
      var d = c.derajat[v];
      return [esc(NAMA_VAR[v]), fmtPas(c.input[v]) + " " + esc(SATUAN[v]), Object.keys(d).map(function (l) {
        return d[l] > 0 ? "<b>" + esc(l) + " " + fmt(d[l], 2) + "</b>" : '<span class="redam">' + esc(l) + " 0</span>";
      }).join(" · ")];
    });
    var di = c.derajat_indeks;
    function teksDerajat(o) { return Object.keys(o).filter(function (l) { return o[l] > 0.0005; }).map(function (l) { return esc(l) + " " + fmt(o[l], 2); }).join(", "); }
    return "<h3>Contoh " + (i + 1) + ": titik " + c.id + ", " + tanggalPanjang(c.tanggal) + " " + badge(c.kelas_risiko) + "</h3>" +
      '<ul class="input-contoh">' + VARIABEL.map(function (v) { return "<li>" + esc(PENDEK[v]) + " <b>" + fmtPas(c.input[v]) + " " + esc(SATUAN[v]) + "</b></li>"; }).join("") + "</ul>" +
      "<h4>Langkah 1. Fuzzifikasi</h4><p>Setiap nilai diubah menjadi derajat keanggotaan 0 sampai 1 pada tiga himpunan.</p>" +
      tabel(["Variabel", "Nilai", "Derajat keanggotaan"], derajat, ["", "angka", ""]) +
      "<h4>Langkah 2. Aturan tingkat 1 yang aktif</h4><p>Indeks kekeringan (dari 9 aturan):</p>" + daftarAturan(c.aturan_kekeringan, "kekeringan") +
      "<p>Indeks cuaca api (dari 27 aturan):</p>" + daftarAturan(c.aturan_cuaca_api, "cuaca api") +
      "<h4>Langkah 3. Defuzzifikasi centroid tingkat 1</h4><p>Indeks kekeringan = <b>" + fmt(c.indeks_kekeringan, 1) + "</b>, indeks cuaca api = <b>" + fmt(c.indeks_cuaca_api, 1) + "</b>.</p>" +
      "<h4>Langkah 4. Tingkat 2: gabungkan kedua indeks</h4><p>Kedua indeks difuzzifikasi ulang: kekeringan " + teksDerajat(di.kekeringan) + "; cuaca api " + teksDerajat(di.cuaca_api) + ".</p>" +
      daftarAturan(c.aturan_risiko, "risiko") +
      "<h4>Langkah 5. Skor akhir dan kelas</h4>" +
      '<div class="hasil-akhir"><span class="skor">' + fmt(c.skor_risiko, 1) + "</span>" + badge(c.kelas_risiko) +
      '<span class="cocok">Sama dengan acuan notebook (riset/uji_referensi.csv): ' + fmt(r.skor_risiko, 1) + ", " + esc(r.kelas_risiko) + "</span></div>";
  }

  function isiG2() {
    var g = data.validasi.g1.hari[0];
    return "Kiri: hari paling aman 2026. Kanan: hari paling berisiko 2026 (" + tanggalPanjang(g.tanggal) + ", rata-rata skor " + fmt(g.skor, 1) +
      ", " + fmt(g.titik_panas) + " titik panas). Tiap kotak satu titik grid; segitiga hitam adalah titik panas NASA FIRMS pada hari yang sama. Sumber: notebook bagian G1 dan G2.";
  }

  var ISI = {
    batas: isiBatas, kenapa: isiKenapa, g2: isiG2,
    "aturan-kekeringan": function () { return isiAturan("aturan_kekeringan"); },
    "aturan-api": function () { return isiAturan("aturan_cuaca_api"); },
    "aturan-risiko": function () { return isiAturan("aturan_risiko"); },
    "contoh-1": function () { return isiContoh(0); },
    "contoh-2": function () { return isiContoh(1); }
  };

  /* ---------- Gambar, animasi, lightbox, daftar isi ---------- */

  function animasi(el) {
    // belum digambar (misalnya di dalam details yang baru dibuka): tunda sampai gambarSemua selesai
    if (!el.querySelector("svg")) { el._tunda = true; return; }
    el.classList.add("tampil");
    var rect = el.querySelectorAll("rect[data-tirai]");
    if (!rect.length) return;
    var mulai = null;
    function langkah(t) {
      if (mulai === null) mulai = t;
      var p = Math.min((t - mulai) / 1400, 1), e = 1 - Math.pow(1 - p, 3);
      rect.forEach(function (r) { r.setAttribute("width", r.getAttribute("data-tirai") * e); });
      if (p < 1) requestAnimationFrame(langkah);
    }
    requestAnimationFrame(langkah);
  }

  function gambarSemua() {
    document.querySelectorAll("[data-grafik]").forEach(function (el) {
      var fn = GRAFIK[el.getAttribute("data-grafik")], w = Math.max(240, Math.floor(el.clientWidth));
      // grafik di dalam details yang tertutup belum punya lebar, digambar saat dibuka
      if (!fn || !el.clientWidth || el._lebar === w) return;
      el._lebar = w;
      try {
        el.innerHTML = fn(w, el.classList.contains("tampil"));
        if (el._tunda) {
          el._tunda = false;
          requestAnimationFrame(function () { requestAnimationFrame(function () { animasi(el); }); });
        }
      } catch (err) {
        console.error(err);
        el.innerHTML = '<p class="kecil">Grafik belum bisa ditampilkan.</p>';
      }
    });
  }

  function isiSemua() {
    document.querySelectorAll("[data-isi]").forEach(function (el) {
      var fn = ISI[el.getAttribute("data-isi")];
      if (!fn) return;
      try { el.innerHTML = fn(); } catch (err) { console.error(err); el.innerHTML = '<p class="kecil">Bagian ini belum bisa ditampilkan.</p>'; }
    });
  }

  function mulaiAnimasi() {
    var semua = document.querySelectorAll("[data-grafik]");
    if (!GERAK || !("IntersectionObserver" in window)) {
      // tanpa animasi: tirai langsung dibuka penuh supaya garis grafik tetap terlihat
      semua.forEach(function (el) {
        el.classList.add("tampil");
        el.querySelectorAll("rect[data-tirai]").forEach(function (r) { r.setAttribute("width", r.getAttribute("data-tirai")); });
      });
      return;
    }
    pengamat = new IntersectionObserver(function (entri) {
      entri.forEach(function (e) {
        if (e.isIntersecting) { pengamat.unobserve(e.target); animasi(e.target); }
      });
    }, { threshold: 0.25 });
    semua.forEach(function (el) { pengamat.observe(el); });
  }

  function siapkanLightbox() {
    var dlg = $("lightbox");
    if (!dlg) return;
    var img = dlg.querySelector("img"), ket = dlg.querySelector(".lb-atas p");
    document.querySelectorAll(".gambar-riset button").forEach(function (b) {
      b.addEventListener("click", function () {
        var g = b.querySelector("img");
        if (!dlg.showModal) { window.open(g.src, "_blank"); return; }
        img.src = g.currentSrc || g.src;
        img.alt = g.alt;
        img.classList.toggle("lebar", g.naturalWidth / Math.max(g.naturalHeight, 1) > 1.6);
        ket.textContent = (img.classList.contains("lebar") && window.innerWidth <= 700 ? "Geser gambar ke samping untuk melihat seluruhnya. " : "") +
          b.closest("figure").querySelector("figcaption").textContent;
        dlg.showModal();
      });
    });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.closest(".lb-tutup") || e.target.classList.contains("lb-gulir")) dlg.close();
    });
  }

  function siapkanDaftarIsi() {
    var tautan = document.querySelectorAll(".toc a[href^='#']");
    if (!tautan.length) return;
    var bagian = Array.prototype.map.call(tautan, function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    var tunggu = false;
    function tandai() {
      tunggu = false;
      var aktif = 0;
      if (window.scrollY > 10) {
        bagian.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.3) aktif = i; });
      }
      tautan.forEach(function (a, i) { if (i === aktif) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    }
    window.addEventListener("scroll", function () { if (!tunggu) { tunggu = true; requestAnimationFrame(tandai); } }, { passive: true });
    tandai();
  }

  function galat(pesan) {
    document.querySelectorAll("[data-grafik],[data-isi]").forEach(function (el) {
      el.innerHTML = '<p class="kecil">' + esc(pesan) + "</p>";
    });
  }

  function ambilJson(nama) {
    return fetch("data/" + nama + ".json").then(function (r) { if (!r.ok) throw new Error(nama + " " + r.status); return r.json(); });
  }

  siapkanLightbox();
  siapkanDaftarIsi();

  // body data-data="validasi cara_kerja contoh_hitung" menentukan berkas yang dibutuhkan halaman
  var perlu = (document.body.getAttribute("data-data") || "").split(/\s+/).filter(Boolean);
  var KUNCI = { validasi: "validasi", cara_kerja: "cara", contoh_hitung: "contoh" };
  if (location.protocol === "file:") {
    galat("Grafik butuh server lokal. Jalankan 'python -m http.server 8000', lalu buka http://localhost:8000");
  } else {
    Promise.all(perlu.map(ambilJson)).then(function (hasil) {
      hasil.forEach(function (d, i) { data[KUNCI[perlu[i]]] = d; });
      isiSemua();
      gambarSemua();
      mulaiAnimasi();
      document.querySelectorAll("details").forEach(function (d) { d.addEventListener("toggle", gambarSemua); });
      var jeda;
      window.addEventListener("resize", function () { clearTimeout(jeda); jeda = setTimeout(gambarSemua, 150); });
    }).catch(function (e) {
      console.error(e);
      galat("Data belum bisa dimuat, coba lagi nanti.");
    });
  }
})();
