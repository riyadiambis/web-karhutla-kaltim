/* Bagian peta: ambil data, peta Leaflet, tombol tanggal, panel detail, dan mode peta saja. Pemilik: Pengembang A */
(function () {
  var WARNA = { "Rendah": "#2e9e4f", "Sedang": "#f2c230", "Tinggi": "#e03b2f", "Sangat Tinggi": "#8b1a1a" };
  var SETENGAH = 0.12, BATAS_SETENGAH = 0.125;
  var KUNCI_PETA_SAJA = "karhutla_mode_peta_saja";
  var data, peta, lapisan, batas, idx = 3, kotakAktif = null;
  var modePetaSaja = false;
  try { modePetaSaja = localStorage.getItem(KUNCI_PETA_SAJA) === "true"; } catch (e) {}

  // Halaman Peta Risiko ditandai adanya class .hal-peta pada body.
  var modePetaRisiko = document.body.classList.contains("hal-peta");
  var modePanel = !!document.getElementById("detail");
  // Di Beranda, mode peta saja tidak digunakan (selalu tampilkan grid)
  if (!modePetaRisiko) modePetaSaja = false;
  var KODE = { "Rendah": "rendah", "Sedang": "sedang", "Tinggi": "tinggi", "Sangat Tinggi": "sangat" };
  var SARAN = {
    "Rendah": "Kondisi aman. Tetap waspada saat membakar sampah harian.",
    "Sedang": "Hindari pembakaran lahan. Pastikan sisa api padam sepenuhnya.",
    "Tinggi": "Dilarang membakar lahan. Siapkan pasokan air dan sarana pemadam.",
    "Sangat Tinggi": "Dilarang total membakar. Laporkan kemunculan asap/api ke petugas."
  };
  // Pengaturan tile peta dasar (OpenStreetMap, tanpa API key).
  var TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var TILE_ATRIBUSI = "&copy; OpenStreetMap contributors";
  var dipilihId = null, titikId = {};
  var tampil = { "Rendah": true, "Sedang": true, "Tinggi": true, "Sangat Tinggi": true };

  function $(id) { return document.getElementById(id); }

  function galat(pesan) {
    $("galat").textContent = pesan;
    $("galat").hidden = false;
    if ($("diperbarui")) $("diperbarui").textContent = "Diperbarui: belum tersedia";
  }

  function ikonPetaSaja(aktif) {
    if (aktif) {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>' +
        '<rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>' +
        '<span class="sr">Tampilkan grid</span>';
    }
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>' +
      '<line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>' +
      '<span class="sr">Peta saja</span>';
  }

  function terapkanModePetaSaja() {
    var btn = $("btn-peta-saja");
    if (btn) {
      btn.setAttribute("aria-pressed", modePetaSaja ? "true" : "false");
      btn.setAttribute("title", modePetaSaja ? "Tampilkan grid risiko" : "Mode peta saja (sembunyikan grid)");
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

  // Format angka gaya Indonesia (koma desimal). Dipakai bersama oleh semua tampilan.
  function fmt(n, d) {
    d = d === undefined ? 1 : d;
    return Number(n).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  // Logika data detail satu titik pada satu tanggal.
  function ambilDetail(t, i) {
    var p = t.prakiraan[i];
    return { titik: t, p: p, kelas: p.kelas, kode: KODE[p.kelas], saran: SARAN[p.kelas] };
  }

  function titikTertinggi(i) {
    var terbaik = data.titik[0];
    data.titik.forEach(function (t) { if (t.prakiraan[i].skor > terbaik.prakiraan[i].skor) terbaik = t; });
    return terbaik;
  }

  function namaWilayah(kab) {
    if (!kab) return "";
    var kota = ["Balikpapan", "Samarinda", "Bontang"];
    return (kota.indexOf(kab) !== -1 ? "Kota " : "Kabupaten ") + kab;
  }

  function linkWA(d) {
    var url = location.href.split(/[?#]/)[0];
    var teks = "Risiko karhutla " + Tabel.tanggalPanjang(d.p.tanggal) + " di " + namaWilayah(d.titik.kabupaten) + ": " + d.kelas +
      ", skor " + fmt(d.p.skor) + " dari 100. Anjuran: " + d.saran.replace(/\.$/, "") + ". Cek peta: " + url;
    return "https://wa.me/?text=" + encodeURIComponent(teks);
  }

  var IKON = {
    suhu: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>',
    lembap: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>',
    hujan: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25M8 19v2M8 13v2M12 21v2M12 15v2M16 19v2M16 13v2"/></svg>',
    angin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/></svg>',
    matahari: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
    awas: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>',
    wa: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.411z"/></svg>'
  };

  // Tampilan panel detail (desktop: panel melayang/kanan, HP: kartu/sheet).
  function panelHtml(d) {
    var p = d.p, skor = fmt(p.skor);
    function ubin(ikon, label, nilai, satuan) {
      var spasi = (satuan === "%" || !satuan) ? "" : " ";
      return '<div class="ubin-cuaca"><span class="ub-label">' + ikon + "<span>" + label + '</span></span><span class="ub-nilai"><b>' + nilai + "</b>" +
        (satuan ? '<small class="satuan">' + spasi + satuan + "</small>" : "") + "</span></div>";
    }
    return '<div class="detail-kepala">' +
        '<div class="dk-teks"><span class="label-kecil">Detail titik terpilih</span><h2 id="detail-kab" class="dk-nama">' + namaWilayah(d.titik.kabupaten) + "</h2></div>" +
        '<div class="dk-kanan"><span class="lencana-kelas">' + IKON.awas + d.kelas + "</span>" +
        '<span class="skor-mini"><b>' + skor + "</b><small> / 100</small></span></div>" +
      "</div>" +
      '<p class="petunjuk-panel">Ketuk kotak di peta untuk melihat detail.</p>' +
      '<div class="detail-badan">' +
        '<div class="kotak-skor"><div class="ks-baris"><span>Skor indeks bahaya</span><b class="ks-angka">' + skor + "<small> / 100</small></b></div>" +
        '<div class="bar-skor" role="img" aria-label="Skor ' + skor + ' dari 100"><i style="width:' + Math.min(100, p.skor) + '%"></i></div></div>' +
        '<p class="label-kecil label-param">Parameter cuaca permukaan</p>' +
        '<div class="grid-cuaca">' +
          ubin(IKON.suhu, "Suhu Maks", fmt(p.suhu), "&deg;C") +
          ubin(IKON.lembap, "Kelembapan Min", fmt(p.kelembapan, 0), "%") +
          ubin(IKON.hujan, "Curah Hujan", fmt(p.hujan), "mm") +
          ubin(IKON.angin, "Angin Maks", fmt(p.angin), "km/jam") +
        "</div>" +
        '<div class="baris-kering"><span class="bk-label">' + IKON.matahari + "<span>Hari tanpa hujan berturut-turut</span></span><b>" + fmt(p.hari_tanpa_hujan, 0) + " Hari</b></div>" +
        '<div class="kotak-anjuran">' + IKON.awas + "<p>" + d.saran + "</p></div>" +
        '<a id="btn-wa" class="btn-wa" href="' + linkWA(d) + '" target="_blank" rel="noopener noreferrer">' + IKON.wa + "<span>Bagikan ke WhatsApp</span></a>" +
      "</div>";
  }

  function aturSheet(buka) {
    var d = $("detail");
    if (d) d.setAttribute("data-ringkas", buka ? "tidak" : "ya");
    var st = $("sheet-toggle");
    if (st) st.setAttribute("aria-expanded", buka ? "true" : "false");
  }

  function tampilkanPanel(t, i, bukaSheet) {
    var d = ambilDetail(t, i);
    var elDetail = $("detail");
    if (elDetail) elDetail.setAttribute("data-kelas", d.kode);
    var elIsi = $("detail-isi");
    if (elIsi) elIsi.innerHTML = panelHtml(d);
    if (bukaSheet && $("sheet-toggle")) aturSheet(true);
  }

  // Tombol tanggal (desktop: teks hari + angka, HP: satu baris ringkas)
  function tombolPanel(tgl, delta) {
    var o = new Date(tgl + "T00:00:00");
    var hari = o.toLocaleDateString("id-ID", { weekday: "short" });
    var tglAngka = o.getDate();
    var ini = delta === 0;
    var teks = (delta === 0) ? "Hari ini" : (delta === 1) ? "Besok" : (delta === -1) ? "Kemarin" : (delta < 0) ? "H" + delta : "+" + delta;
    var kelas = [];
    if (ini) kelas.push("ini");
    if (delta < 0) kelas.push("lewat");
    var attr = kelas.length ? ' class="' + kelas.join(" ") + '"' : "";
    return '<button type="button" aria-pressed="false"' + attr + ">" +
      '<span class="t-a">' + teks + '</span><span class="t-b">' + hari + " " + tglAngka + "</span>" +
      '<span class="t-m">' + (ini ? "Hari ini, " : "") + hari + " " + tglAngka + "</span></button>";
  }

  function cariIndeksHariIni() {
    var tglIni = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" });
    var pos = data.tanggal.indexOf(tglIni);
    return pos !== -1 ? pos : (data.tanggal.length >= 11 ? 3 : 0);
  }

  function tengahkanTombolTanggal(tombol) {
    var w = $("tanggal");
    if (!w || !tombol) return;
    var bRect = tombol.getBoundingClientRect();
    var wRect = w.getBoundingClientRect();
    var offsetRelatif = bRect.left - wRect.left + w.scrollLeft;
    var target = offsetRelatif - (w.clientWidth - bRect.width) / 2;
    if (w.scrollTo) {
      w.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    } else {
      w.scrollLeft = Math.max(0, target);
    }
  }

  function gambar(i) {
    idx = i;
    var idxHariIni = cariIndeksHariIni();
    var tombolAktif = null;
    document.querySelectorAll("#tanggal button").forEach(function (b, n) {
      var aktif = n === i;
      b.setAttribute("aria-pressed", aktif ? "true" : "false");
      if (aktif) tombolAktif = b;
    });
    if (tombolAktif) {
      tengahkanTombolTanggal(tombolAktif);
      setTimeout(function () { tengahkanTombolTanggal(tombolAktif); }, 80);
    }

    // Label perkiraan kasar untuk H+4 sampai H+7
    var bedaHari = i - idxHariIni;
    if ($("catatan")) {
      if (bedaHari >= 4) {
        $("catatan").textContent = "Perkiraan kasar, bisa berubah.";
        $("catatan").hidden = false;
      } else {
        $("catatan").hidden = true;
      }
    }

    if (lapisan) lapisan.remove();
    lapisan = L.layerGroup();
    kotakAktif = null;

    var rectById = {};

    data.titik.slice().sort(function (a, b) { return a.prakiraan[i].skor - b.prakiraan[i].skor; }).forEach(function (t) {
      var p = t.prakiraan[i];
      if (modePetaRisiko && !tampil[p.kelas]) return;
      var kotak = [[t.lat - SETENGAH, t.lon - SETENGAH], [t.lat + SETENGAH, t.lon + SETENGAH]];
      var dasar = { stroke: true, color: "#ffffff", weight: 1, opacity: 0.9, fillColor: WARNA[p.kelas], fillOpacity: 0.65 };
      var aktif = { stroke: true, color: "#0B2A42", weight: 3, opacity: 1, fillOpacity: 0.85 };

      var rect = L.rectangle(kotak, dasar)
        .bindTooltip(namaWilayah(t.kabupaten) + ": skor " + p.skor + " (" + p.kelas + ")", { sticky: true })
        .on("click", function () {
          if (kotakAktif && kotakAktif !== this) { kotakAktif.setStyle(kotakAktif._dasar); }
          kotakAktif = this;
          this.setStyle(aktif);
          this.bringToFront();
          dipilihId = t.id;
          tampilkanPanel(t, i, true);
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
      rect._aktif = aktif;
      rectById[t.id] = rect;
      rect.addTo(lapisan);
    });

    if (modePanel) {
      // Otomatis pilih titik skor tertinggi; setelah itu titik yang sama dipertahankan saat tanggal diganti.
      if (dipilihId === null) dipilihId = titikTertinggi(i).id;
      var rp = rectById[dipilihId];
      if (rp) { kotakAktif = rp; rp.setStyle(rp._aktif); rp.bringToFront(); }
      tampilkanPanel(titikId[dipilihId], i, false);
    }

    if (!modePetaSaja) lapisan.addTo(peta);
    if ($("hero")) Tabel.render(data, i);
  }

  function perbaruiInteraksiBeranda() {
    if (!peta || modePetaRisiko) return;
    if (L.Browser.touch || window.innerWidth < 768) {
      peta.dragging.disable();
    } else {
      peta.dragging.enable();
    }
  }

  function mulai() {
    data.titik.forEach(function (t) { titikId[t.id] = t; });
    var opsiPeta = {
      zoomControl: false,
      attributionControl: !modePetaRisiko,
      maxZoom: 13,
      maxBoundsViscosity: 1.0
    };
    if (!modePetaRisiko) {
      opsiPeta.scrollWheelZoom = false;
      opsiPeta.dragging = !L.Browser.touch && window.innerWidth >= 768;
    }
    peta = L.map("peta", opsiPeta);
    L.control.zoom({ position: modePetaRisiko ? "bottomright" : (window.innerWidth < 768 ? "topright" : "bottomright") }).addTo(peta);
    if (modePetaRisiko) L.control.attribution({ position: "bottomleft" }).addTo(peta);

    // Tombol kontrol mode Peta Saja di pojok kanan bawah peta di bawah zoom (khusus peta-risiko)
    var kontrolPeta = L.control({ position: "bottomright" });
    kontrolPeta.onAdd = function () {
      var wadah = L.DomUtil.create("div", "kontrol-peta-saja");
      wadah.innerHTML = '<button type="button" id="btn-peta-saja" class="btn-peta-saja" aria-pressed="' +
        (modePetaSaja ? "true" : "false") + '" title="' +
        (modePetaSaja ? "Tampilkan grid risiko" : "Mode peta saja (sembunyikan grid)") + '">' +
        ikonPetaSaja(modePetaSaja) + '</button>';
      L.DomEvent.disableClickPropagation(wadah);
      L.DomEvent.disableScrollPropagation(wadah);
      return wadah;
    };
    if (modePetaRisiko) kontrolPeta.addTo(peta);

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

    if (window.ResizeObserver) new ResizeObserver(function () { sesuaikan(); }).observe($("peta"));
    L.tileLayer(TILE_URL, { maxZoom: 13, attribution: TILE_ATRIBUSI }).addTo(peta);
    batas = L.latLngBounds([]);
    data.titik.forEach(function (t) {
      batas.extend([t.lat - BATAS_SETENGAH, t.lon - BATAS_SETENGAH]);
      batas.extend([t.lat + BATAS_SETENGAH, t.lon + BATAS_SETENGAH]);
    });

    // Batasi geser peta dengan maxBounds = batas grid diperlebar sekitar 1 derajat
    var batasGeser = L.latLngBounds(
      [batas.getSouth() - 1.0, batas.getWest() - 1.0],
      [batas.getNorth() + 1.0, batas.getEast() + 1.0]
    );
    peta.setMaxBounds(batasGeser);

    pasKan();

    Tabel.setPembaruan(data.diperbarui);

    var idxHariIni = cariIndeksHariIni();
    $("tanggal").innerHTML = data.tanggal.map(function (tgl, i) {
      return tombolPanel(tgl, i - idxHariIni);
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
    peta.setMinZoom(0);
    peta.fitBounds(batas, { padding: [14, 14] });
    var minZ = peta.getBoundsZoom(batas, false, [14, 14]);
    peta.setMinZoom(minZ);
  }

  function sesuaikan() {
    if (!peta || !batas) return;
    peta.invalidateSize();
    peta.setMinZoom(0);
    var minZ = peta.getBoundsZoom(batas, false, [14, 14]);
    peta.setMinZoom(minZ);
    if (peta.getZoom() < minZ) {
      peta.setZoom(minZ);
    }
    perbaruiInteraksiBeranda();
  }

  window.addEventListener("load", pasKan);
  window.addEventListener("resize", sesuaikan);
  window.addEventListener("orientationchange", function () { setTimeout(pasKan, 250); });

  // Filter kelas (Peta Risiko): berlaku juga saat tanggal diganti karena gambar() membaca status "tampil".
  document.querySelectorAll("#filter-kelas input[data-kelas]").forEach(function (cb) {
    cb.addEventListener("change", function () {
      Object.keys(KODE).forEach(function (nama) {
        if (KODE[nama] === cb.getAttribute("data-kelas")) tampil[nama] = cb.checked;
      });
      if (data) gambar(idx);
    });
  });

  // Bottom sheet (HP di peta-risiko): ketuk handle atau bagian kepala untuk membuka/menutup
  if ($("sheet-toggle")) {
    $("sheet-toggle").addEventListener("click", function () { aturSheet($("detail").getAttribute("data-ringkas") === "ya"); });
    $("detail-isi").addEventListener("click", function (e) {
      if (e.target.closest(".detail-kepala") && window.matchMedia("(max-width: 767px)").matches) {
        aturSheet($("detail").getAttribute("data-ringkas") === "ya");
      }
    });
  }

  if (location.protocol === "file:") {
    galat("Halaman harus dibuka lewat server lokal. Jalankan 'python -m http.server 8000', lalu buka http://localhost:8000");
  } else {
    fetch("data/risiko.json?t=" + Date.now())
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { data = d; mulai(); })
      .catch(function (e) { console.error(e); galat("Data belum bisa dimuat, coba lagi nanti."); });
  }
})();