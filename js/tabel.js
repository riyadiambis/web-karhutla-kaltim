/* Bagian info: status utama, ringkasan, grafik tren 7 hari, rekap wilayah, kartu anjuran, penanda pembaruan. Pemilik: Pengembang B */
(function () {
  var URUT = ["Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];
  var KODE = { "Rendah": "rendah", "Sedang": "sedang", "Tinggi": "tinggi", "Sangat Tinggi": "sangat" };
  var SARAN = {
    "Rendah": "Kondisi aman. Tetap waspada saat membakar sampah harian.",
    "Sedang": "Hindari pembakaran lahan. Pastikan sisa api padam sepenuhnya.",
    "Tinggi": "Dilarang membakar lahan. Siapkan pasokan air dan sarana pemadam.",
    "Sangat Tinggi": "Dilarang total membakar. Laporkan kemunculan asap/api ke petugas."
  };
  var rekap = [];

  function $(id) { return document.getElementById(id); }

  function badge(kelas) { return '<span class="badge b-' + KODE[kelas] + '">' + kelas + '</span>'; }

  function fmt(n, d) {
    d = d === undefined ? 1 : d;
    return Number(n).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function namaWilayah(kab) {
    if (!kab) return "";
    var kota = ["Balikpapan", "Samarinda", "Bontang"];
    return (kota.indexOf(kab) !== -1 ? "Kota " : "Kabupaten ") + kab;
  }

  function tanggalPanjang(iso, denganJam) {
    var o = { day: "numeric", month: "short", year: "numeric" };
    if (denganJam) { o.hour = "2-digit"; o.minute = "2-digit"; o.timeZone = "Asia/Makassar"; }
    var s = new Date(iso).toLocaleString("id-ID", o);
    return denganJam ? s + " WITA" : s;
  }

  function hitung(data, idx) {
    var jumlah = {}, kab = {}, tertinggi = 0;
    URUT.forEach(function (k) { jumlah[k] = 0; });
    data.titik.forEach(function (t) {
      var p = t.prakiraan[idx], n = URUT.indexOf(p.kelas);
      jumlah[p.kelas]++;
      if (n > tertinggi) tertinggi = n;
      var k = kab[t.kabupaten] || (kab[t.kabupaten] = { n: 0, total: 0, top: 0 });
      k.n++; k.total += p.skor;
      if (n > k.top) k.top = n;
    });
    rekap = Object.keys(kab).sort().map(function (nama) {
      var k = kab[nama];
      return { nama: nama, n: k.n, rerata: k.total / k.n, kelas: URUT[k.top] };
    });
    return { jumlah: jumlah, tertinggi: URUT[tertinggi] };
  }

  function isiTabel() {
    var baris = rekap.slice().sort(function (a, b) {
      return b.rerata - a.rerata;
    });

    var wadah = $("isi-tabel");
    if (wadah) {
      wadah.innerHTML = baris.map(function (k, i) {
        var lebarMeter = Math.min(100, Math.max(0, k.rerata));
        return '<li class="baris-kab" data-kelas="' + KODE[k.kelas] + '">' +
          '<div class="bk-kiri">' +
            '<span class="bk-no">' + (i + 1) + '.</span>' +
            '<span class="bk-nama">' + k.nama + '</span>' +
          '</div>' +
          '<div class="bk-kanan">' +
            '<span class="bk-skor">rerata ' + fmt(k.rerata) + '</span>' +
            badge(k.kelas) +
          '</div>' +
          '<div class="bk-meter" role="img" aria-label="Rerata skor ' + fmt(k.rerata) + ' dari 100"><i class="k-' + KODE[k.kelas] + '" style="width:' + lebarMeter + '%"></i></div>' +
        '</li>';
      }).join("");
    }
  }

  function renderTren(data, idxAktif) {
    var wadahGrafik = $("grafik-tren");
    if (!wadahGrafik) return;

    var HARI_SINGKAT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    var HARI_PANJANG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    var BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    var dStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" });
    var posToday = data.tanggal.indexOf(dStr);
    if (posToday === -1) posToday = data.tanggal.length >= 11 ? 3 : 0;

    var akhirHari = Math.min(data.tanggal.length - 1, posToday + 7);
    var listHari = [];
    var maxBahaya = 1;

    for (var i = posToday; i <= akhirHari; i++) {
      var tinggi = 0, sangat = 0;
      data.titik.forEach(function (t) {
        var k = t.prakiraan[i].kelas;
        if (k === "Tinggi") tinggi++;
        else if (k === "Sangat Tinggi") sangat++;
      });
      var tot = tinggi + sangat;
      if (tot > maxBahaya) maxBahaya = tot;

      var tglObj = new Date(data.tanggal[i] + "T00:00:00");
      var hariSingkat = HARI_SINGKAT[tglObj.getDay()];
      var tglAngka = tglObj.getDate();
      var labelPanjang = HARI_PANJANG[tglObj.getDay()] + " " + tglAngka + " " + BULAN_SINGKAT[tglObj.getMonth()];

      listHari.push({
        idx: i,
        tanggal: data.tanggal[i],
        hari: hariSingkat,
        tgl: tglAngka,
        labelPanjang: labelPanjang,
        tinggi: tinggi,
        sangat: sangat,
        total: tot,
        kasar: (i - posToday) >= 4,
        aktif: i === idxAktif
      });
    }

    if (maxBahaya < 20) maxBahaya = 20;

    var hariMaks = listHari[0], hariMin = listHari[0];
    listHari.forEach(function (h) {
      if (h.total > hariMaks.total) hariMaks = h;
      if (h.total < hariMin.total) hariMin = h;
    });

    var ariaText = "Grafik tren risiko Tinggi dan Sangat Tinggi 7 hari ke depan. Paling berbahaya: " +
      hariMaks.labelPanjang + " (" + hariMaks.total + " kotak). Paling aman: " +
      hariMin.labelPanjang + " (" + hariMin.total + " kotak).";
    wadahGrafik.setAttribute("aria-label", ariaText);

    wadahGrafik.innerHTML = listHari.map(function (d) {
      var tinggiPersen = Math.round((d.total / maxBahaya) * 100);
      if (d.total > 0 && tinggiPersen < 6) tinggiPersen = 6;

      var kelasBatang = ["btn-batang"];
      if (d.aktif) kelasBatang.push("aktif");
      if (d.kasar) kelasBatang.push("kasar");

      var titleText = d.labelPanjang + ": " + d.total + " kotak (" + d.sangat + " Sangat Tinggi, " + d.tinggi + " Tinggi)";

      var isiBatang = "";
      if (d.total > 0) {
        isiBatang = '<div class="batang-tumpuk" style="height:' + tinggiPersen + '%">' +
          (d.sangat > 0 ? '<div class="seg-sangat" style="flex:' + d.sangat + '"></div>' : '') +
          (d.tinggi > 0 ? '<div class="seg-tinggi" style="flex:' + d.tinggi + '"></div>' : '') +
        '</div>';
      } else {
        isiBatang = '<div class="batang-tumpuk batang-nol" style="height:2px"></div>';
      }

      return '<button type="button" class="' + kelasBatang.join(" ") + '" data-idx="' + d.idx + '" title="' + titleText + '">' +
        '<span class="angka-batang">' + d.total + '</span>' +
        '<div class="batang-relatif">' +
          isiBatang +
        '</div>' +
        '<div class="label-hari-tgl">' +
          '<span class="lh-hari">' + d.hari + '</span>' +
          '<span class="lh-tgl">' + d.tgl + '</span>' +
        '</div>' +
      '</button>';
    }).join("");

    var wadahRingkasan = $("ringkasan-tren");
    if (wadahRingkasan) {
      wadahRingkasan.innerHTML =
        '<p class="teks-ringkasan-tren"><strong>Kondisi paling berbahaya:</strong> ' + hariMaks.labelPanjang + ' (' + hariMaks.total + ' kotak). ' +
        '<strong>Paling aman:</strong> ' + hariMin.labelPanjang + ' (' + hariMin.total + ' kotak).</p>';
    }

    pasangEventGrafik();
  }

  function renderAnjuran() {
    var wadah = $("daftar-anjuran");
    if (!wadah) return;
    var list = [
      {
        kelas: "Rendah",
        warna: "#3A9D5D",
        rentang: "0 - 25",
        bgIkon: "#E6F4EA",
        teksIkon: "#3A9D5D",
        ikon: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>'
      },
      {
        kelas: "Sedang",
        warna: "#F2C94C",
        rentang: "25 - 50",
        bgIkon: "#FFF6D6",
        teksIkon: "#8C6B00",
        ikon: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 2 22 22 22"></polygon><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>'
      },
      {
        kelas: "Tinggi",
        warna: "#E46A2E",
        rentang: "50 - 75",
        bgIkon: "#FDEBDD",
        teksIkon: "#E46A2E",
        ikon: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg>'
      },
      {
        kelas: "Sangat Tinggi",
        warna: "#9B1C1C",
        rentang: "75 - 100",
        bgIkon: "#FFE3E0",
        teksIkon: "#9B1C1C",
        ikon: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'
      }
    ];

    wadah.innerHTML = list.map(function (item) {
      var kelasSgt = item.kelas === "Sangat Tinggi" ? " text-sangat" : "";
      return '<div class="kartu-anjuran-item">' +
        '<div class="garis-warna-atas" style="background-color:' + item.warna + ';"></div>' +
        '<div class="ai-konten">' +
          '<div class="ai-header">' +
            '<div class="ai-ikon" style="background-color:' + item.bgIkon + ';color:' + item.teksIkon + ';">' +
              item.ikon +
            '</div>' +
            '<div>' +
              '<h3 class="ai-nama' + kelasSgt + '">' + item.kelas + '</h3>' +
              '<span class="ai-rentang font-mono">' + item.rentang + '</span>' +
            '</div>' +
          '</div>' +
          '<p class="ai-teks">' + SARAN[item.kelas] + '</p>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  function render(data, idx) {
    var h = hitung(data, idx);
    var hero = $("hero");
    if (hero) hero.setAttribute("data-kelas", KODE[h.tertinggi]);

    // Cari titik dengan skor tertinggi pada tanggal aktif
    var titikTop = data.titik[0];
    data.titik.forEach(function (t) {
      if (t.prakiraan[idx].skor > titikTop.prakiraan[idx].skor) titikTop = t;
    });
    var pTop = titikTop.prakiraan[idx];

    var dStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" });
    var posToday = data.tanggal.indexOf(dStr);
    if (posToday === -1) posToday = data.tanggal.length >= 11 ? 3 : 0;
    var statusWaktu = idx < posToday ? " (kondisi lewat)" : "";

    var tglObj = new Date(data.tanggal[idx] + "T00:00:00");
    var namaHari = tglObj.toLocaleDateString("id-ID", { weekday: "long" });
    var tglFormat = tglObj.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    var prefixHari = (idx === posToday) ? "Hari ini, " : (idx === posToday + 1) ? "Besok, " : (idx === posToday - 1) ? "Kemarin, " : "";

    if ($("hero-tgl")) $("hero-tgl").textContent = (prefixHari + namaHari + " " + tglFormat + statusWaktu).toUpperCase();
    if ($("rek-kelas")) $("rek-kelas").textContent = h.tertinggi;
    if ($("hero-skor")) $("hero-skor").textContent = "Skor " + fmt(pTop.skor);

    // Kalimat netral untuk semua kelas
    if ($("hero-kab")) {
      $("hero-kab").textContent = "di " + namaWilayah(titikTop.kabupaten) + ", skor " + fmt(pTop.skor) + " dari 100.";
    }

    // Label kotak anjuran mengikuti kelas: PERINGATAN untuk Tinggi & Sangat Tinggi, ANJURAN untuk Rendah & Sedang
    var labelAnjuran = (h.tertinggi === "Tinggi" || h.tertinggi === "Sangat Tinggi") ? "PERINGATAN:" : "ANJURAN:";
    if ($("rek-label")) $("rek-label").textContent = labelAnjuran;
    if ($("rek-teks")) $("rek-teks").textContent = SARAN[h.tertinggi];

    // Bar distribusi
    if ($("bar")) {
      $("bar").innerHTML = URUT.map(function (k) {
        return '<i class="k-' + KODE[k] + '" style="flex:' + h.jumlah[k] + ' 1 0" title="' + k + ": " + h.jumlah[k] + ' titik"></i>';
      }).join("");
    }

    // 4 blok ringkasan per kelas
    if ($("ringkasan")) {
      $("ringkasan").innerHTML = URUT.map(function (k) {
        var label = (k === "Sangat Tinggi") ? "Sgt Tinggi" : k;
        return '<li class="blok-ringkas b-' + KODE[k] + '">' +
          '<div class="br-atas"><span class="titik-kelas ' + KODE[k] + '" aria-hidden="true"></span><span class="br-label">' + label + '</span></div>' +
          '<b class="br-angka">' + h.jumlah[k] + '</b>' +
        '</li>';
      }).join("");
    }

    isiTabel();
    renderTren(data, idx);
    renderAnjuran();
  }

  function setPembaruan(iso) {
    var el = $("diperbarui");
    if (!el) return;
    var tgl = tanggalPanjang(iso, true);
    var telat = false;
    try {
      var ms = Date.now() - new Date(iso).getTime();
      if (ms > 36 * 3600 * 1000) telat = true;
    } catch (e) {}
    el.innerHTML = '<span class="teks-update">Diperbarui: ' + tgl + '</span>' +
      (telat ? ' <span class="tag-telat">Data belum diperbarui hari ini</span>' : '');
  }

  function pasangEventGrafik() {
    var elGrafik = $("grafik-tren");
    if (elGrafik && !elGrafik._terpasang) {
      elGrafik._terpasang = true;
      elGrafik.addEventListener("click", function (e) {
        var btn = e.target.closest(".btn-batang");
        if (!btn) return;
        var targetIdx = parseInt(btn.getAttribute("data-idx"), 10);
        if (!isNaN(targetIdx)) {
          var tombol = document.querySelectorAll("#tanggal button")[targetIdx];
          if (tombol) tombol.click();
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", pasangEventGrafik);

  window.Tabel = {
    render: render,
    badge: badge,
    setPembaruan: setPembaruan,
    tanggalPanjang: tanggalPanjang,
    namaWilayah: namaWilayah,
    fmt: fmt,
    SARAN: SARAN
  };
})();