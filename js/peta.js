/* Bagian peta: ambil data, peta Leaflet, tombol tanggal, modal detail. Pemilik: Pengembang A */
(function () {
  var WARNA = { "Rendah": "#2e9e4f", "Sedang": "#f2c230", "Tinggi": "#e03b2f", "Sangat Tinggi": "#8b1a1a" };
  var SETENGAH = 0.25;
  var data, peta, lapisan, idx = 0, pemicu = null;
  function $(id) { return document.getElementById(id); }

  function galat(pesan) {
    $("galat").textContent = pesan;
    $("galat").hidden = false;
    $("diperbarui").textContent = "Diperbarui: belum tersedia";
  }

  function bukaModal(t, p) {
    $("modal-badan").innerHTML =
      '<h2 id="modal-judul">Titik ' + t.id + ", " + t.kabupaten + "</h2>" +
      "<div>" + Tabel.tanggalPanjang(p.tanggal) + "</div>" +
      '<div class="skor">' + p.skor + "</div>" + Tabel.badge(p.kelas) +
      '<dl class="data">' +
      "<dt>Suhu tertinggi</dt><dd>" + p.suhu + " &deg;C</dd>" +
      "<dt>Kelembapan terendah</dt><dd>" + p.kelembapan + " %</dd>" +
      "<dt>Curah hujan</dt><dd>" + p.hujan + " mm</dd>" +
      "<dt>Angin tertinggi</dt><dd>" + p.angin + " km/jam</dd>" +
      "<dt>Hari berturut tanpa hujan</dt><dd>" + p.hari_tanpa_hujan + " hari</dd></dl>";
    pemicu = document.activeElement;
    $("modal").hidden = false;
    document.querySelector(".modal-isi").focus();
  }

  function tutupModal() {
    $("modal").hidden = true;
    if (pemicu && pemicu.focus) pemicu.focus();
  }

  function gambar(i) {
    idx = i;
    document.querySelectorAll("#tanggal button").forEach(function (b, n) {
      b.setAttribute("aria-pressed", n === i ? "true" : "false");
    });
    $("catatan").hidden = i < 5;
    if (lapisan) lapisan.remove();
    lapisan = L.layerGroup();
    data.titik.forEach(function (t) {
      var p = t.prakiraan[i];
      L.rectangle([[t.lat - SETENGAH, t.lon - SETENGAH], [t.lat + SETENGAH, t.lon + SETENGAH]],
        { color: "#fff", weight: 1, fillColor: WARNA[p.kelas], fillOpacity: 0.65 })
        .on("click", function () { bukaModal(t, p); })
        .addTo(lapisan);
    });
    lapisan.addTo(peta);
    Tabel.render(data, i);
  }

  function mulai() {
    peta = L.map("peta");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 12, attribution: "&copy; OpenStreetMap" }).addTo(peta);
    peta.fitBounds(data.titik.map(function (t) { return [t.lat, t.lon]; }), { padding: [30, 30] });

    Tabel.setPembaruan(data.diperbarui);
    var label = ["Hari ini", "Besok", "+2", "+3", "+4", "+5", "+6", "+7"];
    $("tanggal").innerHTML = data.tanggal.map(function (tgl, i) {
      var d = new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      return '<button type="button" aria-pressed="false">' + (label[i] || tgl) + "<small>" + d + "</small></button>";
    }).join("");
    document.querySelectorAll("#tanggal button").forEach(function (b, i) {
      b.addEventListener("click", function () { gambar(i); });
    });
    gambar(0);
  }

  function sesuaikan() { if (peta) peta.invalidateSize(); }
  window.addEventListener("resize", sesuaikan);
  window.addEventListener("orientationchange", function () { setTimeout(sesuaikan, 250); });

  $("tutup").addEventListener("click", tutupModal);
  $("modal").addEventListener("click", function (e) { if (e.target === this) tutupModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("modal").hidden) tutupModal(); });

  if (location.protocol === "file:") {
    galat("Halaman harus dibuka lewat server lokal. Jalankan 'python -m http.server 8000', lalu buka http://localhost:8000");
  } else {
    fetch("data/risiko.json?t=" + Date.now())
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { data = d; mulai(); })
      .catch(function () { galat("Data belum bisa dimuat, coba lagi nanti."); });
  }
})();