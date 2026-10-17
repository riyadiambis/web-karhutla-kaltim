/* Bagian info: status utama, ringkasan, tabel kabupaten, penanda pembaruan. Pemilik: Pengembang B */
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
  var tampilSemua = false;

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
    var elCari = $("cari");
    var q = elCari ? elCari.value.trim().toLowerCase() : "";
    var sedangMencari = q.length > 0;
    var baris = rekap.filter(function (k) {
      return k.nama.toLowerCase().indexOf(q) !== -1;
    }).sort(function (a, b) {
      return b.rerata - a.rerata;
    });

    var daftar = sedangMencari || tampilSemua ? baris : baris.slice(0, 5);

    var wadah = $("isi-tabel");
    if (wadah) {
      wadah.innerHTML = daftar.map(function (k, i) {
        var lebarMeter = Math.min(100, Math.max(0, k.rerata));
        return '<li class="baris-kab" data-kelas="' + KODE[k.kelas] + '">' +
          '<div class="bk-kiri">' +
            '<span class="bk-no">' + (i + 1) + '.</span>' +
            '<span class="bk-nama">' + k.nama + '</span>' +
          '</div>' +
          '<div class="bk-kanan">' +
            '<span class="bk-skor">' + fmt(k.rerata) + '</span>' +
            badge(k.kelas) +
          '</div>' +
          '<div class="bk-meter" role="img" aria-label="Rerata skor ' + fmt(k.rerata) + ' dari 100"><i class="k-' + KODE[k.kelas] + '" style="width:' + lebarMeter + '%"></i></div>' +
        '</li>';
      }).join("");
    }

    if ($("kosong")) $("kosong").hidden = baris.length > 0;

    var btn = $("btn-semua-kab");
    if (btn) {
      if (sedangMencari) {
        btn.hidden = true;
      } else {
        btn.hidden = false;
        btn.innerHTML = tampilSemua
          ? '<span>Tampilkan 5 wilayah teratas</span> <span aria-hidden="true">&uarr;</span>'
          : '<span>Lihat semua kabupaten/kota (' + rekap.length + ' wilayah)</span> <span aria-hidden="true">&rarr;</span>';
      }
    }
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

  document.addEventListener("DOMContentLoaded", function () {
    var elCari = $("cari");
    if (elCari) elCari.addEventListener("input", isiTabel);

    var btnSemua = $("btn-semua-kab");
    if (btnSemua) {
      btnSemua.addEventListener("click", function () {
        tampilSemua = !tampilSemua;
        isiTabel();
      });
    }
  });

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