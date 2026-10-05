/**
 * WebGLWindLayer.js
 * Engine Simulasi Partikel Aliran Angin Dinamis (Overlay Canvas 60 FPS)
 * 
 * Standar Transparansi Mutlak & Anti-Solid Background:
 * - Canvas 100% transparan dengan pembersihan `clearRect(0, 0, width, height)` pada setiap frame requestAnimationFrame.
 * - TIDAK MENGGUNAKAN background warna pekat / solid hitam sama sekali.
 * - Partikel dilacak menggunakan histori koordinat pendek untuk menghasilkan jejak garis halus (streamlines).
 * - Siklus animasi dihentikan dan dibersihkan secara bersih via cancelAnimationFrame saat layer dinonaktifkan.
 * - Terintegrasi dengan badge "Simulasi ilustratif".
 */
import { fromLonLat, toLonLat } from 'ol/proj';

export class WindParticleEngine {
  constructor(map, canvasElement, options = {}) {
    this.map = map;
    this.canvas = canvasElement;
    this.ctx = canvasElement?.getContext('2d', { alpha: true });
    
    this.numParticles = options.numParticles || 1200;
    this.pattern = options.pattern || 'muson_tenggara'; // 'muson_tenggara' | 'muson_barat' | 'sirkulasi_mentaya'
    this.speedMode = options.speedMode || 'medium'; // 'slow' | 'medium' | 'fast'
    
    this.isRunning = false;
    this.particles = [];
    this.animId = null;
    this.dpr = window.devicePixelRatio || 1;

    // Batas Geografis Kabupaten Kotawaringin Timur
    this.bounds = {
      minLon: 111.1,
      maxLon: 114.1,
      minLat: -3.4,
      maxLat: -1.0
    };

    // Binding methods
    this.handleResize = this.resize.bind(this);
    this.handleMoveStart = this.onMoveStart.bind(this);
    this.handleMoveEnd = this.onMoveEnd.bind(this);

    this.resize();
    this.initParticles();
  }

  getSpeedMultiplier() {
    switch (this.speedMode) {
      case 'slow': return 0.00045;
      case 'fast': return 0.0016;
      case 'medium':
      default: return 0.0009;
    }
  }

  updateVisibleBounds() {
    if (!this.map) return;
    try {
      const size = this.map.getSize();
      if (!size) return;
      const extent = this.map.getView().calculateExtent(size);
      const minCoord = toLonLat([extent[0], extent[1]]);
      const maxCoord = toLonLat([extent[2], extent[3]]);

      this.bounds = {
        minLon: Math.max(110.5, Math.min(minCoord[0], maxCoord[0])),
        maxLon: Math.min(114.8, Math.max(minCoord[0], maxCoord[0])),
        minLat: Math.max(-3.8, Math.min(minCoord[1], maxCoord[1])),
        maxLat: Math.min(-0.8, Math.max(minCoord[1], maxCoord[1]))
      };
    } catch (e) {
      this.bounds = { minLon: 111.1, maxLon: 114.1, minLat: -3.4, maxLat: -1.0 };
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * this.dpr);
    this.canvas.height = Math.floor(rect.height * this.dpr);

    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);
      this.ctx.clearRect(0, 0, rect.width, rect.height);
    }
    this.updateVisibleBounds();
  }

  initParticles() {
    this.particles = [];
    this.updateVisibleBounds();
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const lon = this.bounds.minLon + Math.random() * (this.bounds.maxLon - this.bounds.minLon);
    const lat = this.bounds.minLat + Math.random() * (this.bounds.maxLat - this.bounds.minLat);
    const maxAge = 40 + Math.floor(Math.random() * 60);

    let baseAngle;
    if (this.pattern === 'muson_barat') {
      baseAngle = 0.72 + (Math.random() - 0.5) * 0.45;
    } else if (this.pattern === 'sirkulasi_mentaya') {
      baseAngle = -1.57 + (Math.random() - 0.5) * 0.5;
    } else {
      // Muson Tenggara
      baseAngle = 2.45 + (Math.random() - 0.5) * 0.45;
    }

    const speedVariance = 0.85 + Math.random() * 0.45;
    const u = Math.cos(baseAngle) * speedVariance;
    const v = Math.sin(baseAngle) * speedVariance;

    return {
      lon,
      lat,
      u,
      v,
      history: [{ lon, lat }],
      age: Math.floor(Math.random() * (maxAge * 0.7)),
      maxAge,
      size: 1.1 + Math.random() * 1.4,
      isAccent: Math.random() > 0.82
    };
  }

  setPattern(newPattern) {
    this.pattern = newPattern;
    this.initParticles();
  }

  setSpeedMode(newSpeedMode) {
    this.speedMode = newSpeedMode;
  }

  setDensity(newCount) {
    this.numParticles = newCount;
    this.initParticles();
  }

  onMoveStart() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.ctx && this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width, rect.height);
    }
  }

  onMoveEnd() {
    if (!this.isRunning) return;
    this.resize();
    this.initParticles();
    if (!this.animId) {
      this.animate();
    }
  }

  start() {
    if (this.isRunning) return;
    if (!this.canvas || !this.ctx) return;

    this.isRunning = true;
    this.canvas.classList.remove('hidden');

    this.resize();
    this.initParticles();

    if (this.map) {
      this.map.on('movestart', this.handleMoveStart);
      this.map.on('moveend', this.handleMoveEnd);
    }
    window.addEventListener('resize', this.handleResize);

    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    if (this.canvas) {
      this.canvas.classList.add('hidden');
      if (this.ctx) {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
      }
    }

    if (this.map) {
      this.map.un('movestart', this.handleMoveStart);
      this.map.un('moveend', this.handleMoveEnd);
    }
    window.removeEventListener('resize', this.handleResize);
  }

  animate() {
    if (!this.isRunning) return;
    this.render();
    this.animId = requestAnimationFrame(() => this.animate());
  }

  render() {
    if (!this.ctx || !this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    // PEMBERSIHAN TOTAL TRANSPARAN 100% (Mencegah Solid/Gelap di Basemap)
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.globalCompositeOperation = 'source-over';

    const speed = this.getSpeedMultiplier();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Update posisi partikel
      p.lon += p.u * speed;
      p.lat += p.v * speed;
      p.age++;

      // Simpan riwayat jejak (maksimal 4 titik untuk streamline pendek yang tajam)
      p.history.push({ lon: p.lon, lat: p.lat });
      if (p.history.length > 4) {
        p.history.shift();
      }

      // Respawn jika melampaui umur atau keluar cakupan
      if (
        p.age >= p.maxAge ||
        p.lon < this.bounds.minLon ||
        p.lon > this.bounds.maxLon ||
        p.lat < this.bounds.minLat ||
        p.lat > this.bounds.maxLat
      ) {
        this.particles[i] = this.createParticle();
        continue;
      }

      if (p.history.length < 2) continue;

      // Konversi riwayat ke koordinat pixel layar
      const tailCoord = fromLonLat([p.history[0].lon, p.history[0].lat]);
      const headCoord = fromLonLat([p.lon, p.lat]);

      const tailPixel = this.map.getPixelFromCoordinate(tailCoord);
      const headPixel = this.map.getPixelFromCoordinate(headCoord);

      if (!tailPixel || !headPixel) continue;

      // Cek apakah berada di dalam layar
      if (
        headPixel[0] < -30 || headPixel[0] > width + 30 ||
        headPixel[1] < -30 || headPixel[1] > height + 30
      ) {
        continue;
      }

      // Hitung alpha halus kurva sinus
      const alpha = Math.sin((p.age / p.maxAge) * Math.PI) * 0.85;
      if (alpha <= 0.02) continue;

      let strokeStyle;
      if (p.isAccent) {
        strokeStyle = `rgba(251, 191, 36, ${alpha.toFixed(3)})`; // Kuning keemasan
      } else if (this.pattern === 'muson_barat') {
        strokeStyle = `rgba(56, 189, 248, ${alpha.toFixed(3)})`;  // Sky blue
      } else {
        strokeStyle = `rgba(45, 212, 191, ${alpha.toFixed(3)})`;  // Teal mentaya
      }

      this.ctx.beginPath();
      this.ctx.moveTo(tailPixel[0], tailPixel[1]);
      this.ctx.lineTo(headPixel[0], headPixel[1]);
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = p.size;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }
  }
}
