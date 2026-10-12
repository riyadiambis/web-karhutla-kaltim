/* Bagian peta: ambil data, peta Leaflet, tombol tanggal, modal detail, dan mode peta saja. Pemilik: Pengembang A */
(function () {
  var WARNA = { "Rendah": "#2e9e4f", "Sedang": "#f2c230", "Tinggi": "#e03b2f", "Sangat Tinggi": "#8b1a1a" };
  var SETENGAH = 0.12, BATAS_SETENGAH = 0.125;
  var KUNCI_PETA_SAJA = "karhutla_mode_peta_saja";
  var data, peta, lapisan, batas, idx = 3, pemicu = null, kotakAktif = null;
  var modePetaSaja = false;
  try { modePetaSaja = localStorage.getItem(KUNCI_PETA_SAJA) === "true"; } catch (e) {}

  function $(id) { return document.getElementById(id); }

  function galat(pesan) {
    $("galat").textContent = pesan;
    $("galat").hidden = false;
    $("diperbarui").textContent = "Diperbarui: belum tersedia";
  }

  function ikonPetaSaja(aktif) {
    if (aktif) {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>' +
        '<rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>' +
        '<span>Tampilkan grid</span>';
    }
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>' +
      '<line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>' +
      '<span>Peta saja</span>';
  }

  function terapkanModePetaSaja() {
    var btn = $("btn-peta-saja");
    if (btn) {
      btn.setAttribute("aria-pressed", modePetaSaja ? "true" : "false");
      btn.innerHTML = ikonPetaSaja(modePetaSaja);
    }
    if (lapisan && peta) {
      if (modePetaSaja) {
        if (peta.hasLayer(lapisan)) peta.removeLayer(lapisan);
      } else {
        if (!peta.hasLayer(lapisan)) peta.addLayer(lapisan);
      }
    }
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
    if (kotakAktif) {
      kotakAktif.setStyle(kotakAktif._dasar);
      kotakAktif = null;
    }
    if (pemicu && pemicu.focus) pemicu.focus();
  }

  function cariIndeksHariIni() {
    var d = new Date();
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), tgl = String(d.getDate()).padStart(2, "0");
    var tglIni = y + "-" + m + "-" + tgl;
    var pos = data.tanggal.indexOf(tglIni);
    return pos !== -1 ? pos : (data.tanggal.length >= 11 ? 3 : 0);
  }

  function gambar(i) {
    idx = i;
    var idxHariIni = cariIndeksHariIni();
    document.querySelectorAll("#tanggal button").forEach(function (b, n) {
      b.setAttribute("aria-pressed", n === i ? "true" : "false");
      if (n === i) { var w = $("tanggal"); w.scrollLeft = b.offsetLeft - (w.clientWidth - b.offsetWidth) / 2; }
    });

    // Label perkiraan kasar untuk H+4 sampai H+7
    var bedaHari = i - idxHariIni;
    if (bedaHari >= 4) {
      $("catatan").textContent = "Perkiraan kasar, bisa berubah.";
      $("catatan").hidden = false;
    } else {
      $("catatan").hidden = true;
    }

    if (lapisan) lapisan.remove();
    lapisan = L.layerGroup();
    kotakAktif = null;

    data.titik.slice().sort(function (a, b) { return a.prakiraan[i].skor - b.prakiraan[i].skor; }).forEach(function (t) {
      var p = t.prakiraan[i];
      var kotak = [[t.lat - SETENGAH, t.lon - SETENGAH], [t.lat + SETENGAH, t.lon + SETENGAH]];
      var dasar = { stroke: true, color: "#ffffff", weight: 0.6, opacity: 0.45, fillColor: WARNA[p.kelas], fillOpacity: 0.35 };
      var aktif = { stroke: true, color: "#ffffff", weight: 2.2, opacity: 1, fillOpacity: 0.85 };

      var rect = L.rectangle(kotak, dasar)
        .bindTooltip(t.kabupaten + ": skor " + p.skor + " (" + p.kelas + ")", { sticky: true })
        .on("click", function () {
          if (kotakAktif && kotakAktif !== this) { kotakAktif.setStyle(kotakAktif._dasar); }
          kotakAktif = this;
          this.setStyle(aktif);
          this.bringToFront();
          bukaModal(t, p);
        })
        .on("mouseover", function () {
          if (kotakAktif !== this) {
            this.setStyle({ stroke: true, color: "#ffffff", weight: 1.6, opacity: 0.95, fillOpacity: 0.75 });
            this.bringToFront();
          }
        })
        .on("mouseout", function () {
          if (kotakAktif !== this) this.setStyle(dasar);
        });
      rect._dasar = dasar;
      rect.addTo(lapisan);
    });

    if (!modePetaSaja) lapisan.addTo(peta);
    Tabel.render(data, i);
  }

  function mulai() {
    peta = L.map("peta", { zoomControl: false });
    L.control.zoom({ position: "topright" }).addTo(peta);

    // Tombol kontrol mode Peta Saja di pojok kiri atas peta
    var kontrolPeta = L.control({ position: "topleft" });
    kontrolPeta.onAdd = function () {
      var wadah = L.DomUtil.create("div", "kontrol-peta-saja");
      wadah.innerHTML = '<button type="button" id="btn-peta-saja" class="btn-peta-saja" aria-pressed="' +
        (modePetaSaja ? "true" : "false") + '" title="Sembunyikan atau tampilkan grid">' +
        ikonPetaSaja(modePetaSaja) + '</button>';
      L.DomEvent.disableClickPropagation(wadah);
      L.DomEvent.disableScrollPropagation(wadah);
      return wadah;
    };
    kontrolPeta.addTo(peta);

    setTimeout(function () {
      var btn = $("btn-peta-saja");
      if (btn) {
        btn.addEventListener("click", function () {
          modePetaSaja = !modePetaSaja;
          try { localStorage.setItem(KUNCI_PETA_SAJA, modePetaSaja ? "true" : "false"); } catch (e) {}
          terapkanModePetaSaja();
        });
      }
    }, 0);

    if (window.ResizeObserver) new ResizeObserver(function () { peta.invalidateSize(); }).observe($("peta"));
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 12, attribution: "&copy; OpenStreetMap" }).addTo(peta);
    batas = L.latLngBounds([]);
    data.titik.forEach(function (t) {
      batas.extend([t.lat - BATAS_SETENGAH, t.lon - BATAS_SETENGAH]);
      batas.extend([t.lat + BATAS_SETENGAH, t.lon + BATAS_SETENGAH]);
    });
    pasKan();
    peta.setMaxBounds(batas.pad(0.5));
    peta.setMinZoom(Math.max(peta.getZoom() - 1, 4));

    Tabel.setPembaruan(data.diperbarui);

    var idxHariIni = cariIndeksHariIni();
    $("tanggal").innerHTML = data.tanggal.map(function (tgl, i) {
      var d = new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      var delta = i - idxHariIni;
      var teks = (delta === 0) ? "Hari ini" : (delta === 1) ? "Besok" : (delta < 0) ? "H" + delta : "+" + delta;
      var kelasTombol = delta < 0 ? ' class="lewat"' : "";
      var sub = (delta < 0) ? d + " &bull; Lewat" : d;
      return '<button type="button" aria-pressed="false"' + kelasTombol + '>' + teks + "<small>" + sub + "</small></button>";
    }).join("");

    document.querySelectorAll("#tanggal button").forEach(function (b, i) {
      b.addEventListener("click", function () { gambar(i); });
    });

    // Otomatis memilih Hari ini saat dibuka
    gambar(idxHariIni);
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