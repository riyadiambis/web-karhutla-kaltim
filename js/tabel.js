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
  function $(id) { return document.getElementById(id); }

  function badge(kelas) { return '<span class="badge b-' + KODE[kelas] + '">' + kelas + '</span>'; }

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
    var q = $("cari").value.trim().toLowerCase();
    var baris = rekap.filter(function (k) { return k.nama.toLowerCase().indexOf(q) !== -1; }).sort(function (a, b) { return b.rerata - a.rerata; });
    $("isi-tabel").innerHTML = baris.map(function (k) {
      return '<li class="kab"><div class="kab-atas"><span class="kab-nama">' + k.nama + "</span>" + badge(k.kelas) +
        '</div><div class="meter" role="img" aria-label="Rerata skor ' + k.rerata.toFixed(1) + ' dari 100"><i class="k-' + KODE[k.kelas] +
        '" style="width:' + Math.min(100, k.rerata) + '%"></i></div><div class="kab-info"><span>Rerata skor ' + k.rerata.toFixed(1) +
        "</span><span>" + k.n + " titik</span></div></li>";
    }).join("");
    $("kosong").hidden = baris.length > 0;
  }

  function render(data, idx) {
    var h = hitung(data, idx);
    $("hero").setAttribute("data-kelas", KODE[h.tertinggi]);
    $("hero-tgl").textContent = "Risiko tertinggi se-Kaltim, " + tanggalPanjang(data.tanggal[idx]);
    $("rek-kelas").textContent = h.tertinggi;
    $("rek-teks").textContent = SARAN[h.tertinggi];
    $("bar").innerHTML = URUT.map(function (k) {
      return '<i class="k-' + KODE[k] + '" style="flex:' + h.jumlah[k] + ' 1 0" title="' + k + ": " + h.jumlah[k] + ' titik"></i>';
    }).join("");
    $("ringkasan").innerHTML = URUT.slice().reverse().map(function (k) {
      return '<li><i class="kotak k-' + KODE[k] + '"></i><span>' + k + "</span><b>" + h.jumlah[k] + "</b></li>";
    }).join("");
    isiTabel();
  }

  function setPembaruan(iso) { $("diperbarui").textContent = "Diperbarui: " + tanggalPanjang(iso, true); }

  document.addEventListener("DOMContentLoaded", function () { $("cari").addEventListener("input", isiTabel); });

  window.Tabel = { render: render, badge: badge, setPembaruan: setPembaruan, tanggalPanjang: tanggalPanjang };
})();