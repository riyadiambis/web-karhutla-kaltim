/* Bagian peta: ambil data, peta Leaflet, tombol tanggal, modal detail. Pemilik: Pengembang A */
(function () {
  var WARNA = { "Rendah": "#2e9e4f", "Sedang": "#f2c230", "Tinggi": "#e03b2f", "Sangat Tinggi": "#8b1a1a" };
  var SETENGAH = 0.35, RADIUS = 25000;
  var data, peta, lapisan, batas, idx = 0, pemicu = null;
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
      if (n === i) { var w = $("tanggal"); w.scrollLeft = b.offsetLeft - (w.clientWidth - b.offsetWidth) / 2; }
    });
    $("catatan").hidden = i < 5;
    if (lapisan) lapisan.remove();
    lapisan = L.layerGroup();
    data.titik.slice().sort(function (a, b) { return a.prakiraan[i].skor - b.prakiraan[i].skor; }).forEach(function (t) {
      var p = t.prakiraan[i];
      var dasar = { stroke: false, fillColor: WARNA[p.kelas], fillOpacity: 0.75 };
      L.circle([t.lat, t.lon], Object.assign({ radius: RADIUS }, dasar))
        .bindTooltip(t.kabupaten + ": skor " + p.skor + " (" + p.kelas + ")", { sticky: true })
        .on("click", function () { bukaModal(t, p); })
        .on("mouseover", function () { this.setStyle({ stroke: true, color: "#fff", weight: 2, fillOpacity: 0.9 }); this.bringToFront(); })
        .on("mouseout", function () { this.setStyle({ stroke: false, fillOpacity: 0.75 }); })
        .addTo(lapisan);
    });
    lapisan.addTo(peta);
    Tabel.render(data, i);
  }

  function mulai() {
    peta = L.map("peta", { zoomControl: false });
    L.control.zoom({ position: "topright" }).addTo(peta);
    if (window.ResizeObserver) new ResizeObserver(function () { peta.invalidateSize(); }).observe($("peta"));
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 12, attribution: "&copy; OpenStreetMap" }).addTo(peta);
    batas = L.latLngBounds([]);
    data.titik.forEach(function (t) {
      batas.extend([t.lat - SETENGAH, t.lon - SETENGAH]);
      batas.extend([t.lat + SETENGAH, t.lon + SETENGAH]);
    });
    pasKan();
    peta.setMaxBounds(batas.pad(0.7));
    peta.setMinZoom(Math.max(peta.getZoom() - 1, 4));

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

  function pasKan() {
    if (!peta || !batas) return;
    peta.invalidateSize();
    peta.fitBounds(batas, { padding: [14, 14] });
  }
  function sesuaikan() { if (peta) peta.invalidateSize(); }
  window.addEventListener("load", pasKan);
  window.addEventListener("resize", sesuaikan);
  window.addEventListener("orientationchange", function () { setTimeout(pasKan, 250); });

  $("tutup").addEventListener("click", tutupModal);
  $("modal").addEventListener("click", function (e) { if (e.target === this) tutupModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("modal").hidden) tutupModal(); });

  if (location.protocol === "file:") {
    galat("Halaman harus dibuka lewat server lokal. Jalankan 'python -m http.server 8000', lalu buka http://localhost:8000");
  } else {
    fetch("data/risiko.json?t=" + Date.now())
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { data = d; mulai(); })
      .catch(function (e) { console.error(e); galat("Data belum bisa dimuat, coba lagi nanti."); });
  }
})();