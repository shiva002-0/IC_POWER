import * as THREE from 'three';

// 1. Multi-octave Perlin-style Simplex Noise approximation for fast canvas generation
function createNoiseGenerator() {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    const tmp = p[i];
    p[i] = p[r];
    p[r] = tmp;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  function grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  function noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);

    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];

    const x1 = (1 - u) * grad(aa, xf, yf) + u * grad(ba, xf - 1, yf);
    const x2 = (1 - u) * grad(ab, xf, yf - 1) + u * grad(bb, xf - 1, yf - 1);
    return (1 - v) * x1 + v * x2;
  }

  function fbm(x, y, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
    let total = 0;
    let freq = 1;
    let amp = 1;
    let max = 0;
    for (let i = 0; i < octaves; i++) {
      total += noise2D(x * freq, y * freq) * amp;
      max += amp;
      freq *= lacunarity;
      amp *= persistence;
    }
    return total / max;
  }

  return { noise2D, fbm };
}

const noiseGen = createNoiseGenerator();

// Global texture cache to prevent duplicate canvas allocations and GPU memory bloat
const textureCache = new Map();

/**
 * 1. Realistic Water Normal Map (512x512)
 * Creates multi-octave water surface ripples with seamless tiling
 */
export function createWaterNormalTexture(size = 512) {
  const cacheKey = `water_normal_${size}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // Generate height field
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * 8.0;
      const ny = (y / size) * 8.0;
      // Multi-directional waves
      const wave1 = Math.sin(nx * 3.0 + ny * 2.0) * 0.5 + 0.5;
      const wave2 = Math.cos(nx * 5.0 - ny * 4.0) * 0.5 + 0.5;
      const micro = noiseGen.fbm(nx * 2.5, ny * 2.5, 4, 0.55);
      heights[y * size + x] = wave1 * 0.35 + wave2 * 0.3 + micro * 0.35;
    }
  }

  // Calculate normals using central difference
  const strength = 3.5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const left = heights[y * size + ((x - 1 + size) % size)];
      const right = heights[y * size + ((x + 1) % size)];
      const up = heights[((y - 1 + size) % size) * size + x];
      const down = heights[((y + 1) % size) * size + x];

      const dx = (right - left) * strength;
      const dy = (down - up) * strength;
      const dz = 1.0;

      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const nx = (dx / len) * 0.5 + 0.5;
      const ny = (dy / len) * 0.5 + 0.5;
      const nz = (dz / len) * 0.5 + 0.5;

      data[idx] = Math.floor(nx * 255);
      data[idx + 1] = Math.floor(ny * 255);
      data[idx + 2] = Math.floor(nz * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * 2. Realistic Mountain Rock Texture & Strata Map (512x512)
 * Stratified dark slate with warm mineral crevices and roughness
 */
export function createRockTexture(size = 512) {
  const cacheKey = `rock_${size}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = (x / size) * 6.0;
      const ny = (y / size) * 12.0; // horizontal stratification

      const strata = Math.sin(ny * 1.8 + noiseGen.noise2D(nx * 1.5, ny * 0.8) * 2.0) * 0.5 + 0.5;
      const microCrag = noiseGen.fbm(nx * 4.0, ny * 4.0, 5, 0.55);
      const crack = Math.abs(noiseGen.fbm(nx * 2.0, ny * 2.0, 3) * 2.0 - 1.0);

      // Olympian dark basalt rock with slate-blue & warm amber striations
      let r = 24 + strata * 18 + microCrag * 25 - crack * 12;
      let g = 28 + strata * 16 + microCrag * 24 - crack * 10;
      let b = 38 + strata * 14 + microCrag * 30 - crack * 8;

      // Subtle mineral warmth
      if (strata > 0.65) {
        r += 12;
        g += 8;
      }

      data[idx] = Math.min(255, Math.max(0, Math.floor(r)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.floor(g)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.floor(b)));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * 3. Classical Greek Pentelic White Marble Texture (512x512)
 * Subtle grey and golden vein lines for the temple sanctuary, columns, and thrones
 */
export function createMarbleTexture(size = 512) {
  const cacheKey = `marble_${size}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = (x / size) * 4.0;
      const ny = (y / size) * 4.0;

      // Vein turbulence
      const turb = noiseGen.fbm(nx * 2.0, ny * 2.0, 4, 0.6) * 3.0;
      const vein1 = Math.abs(Math.sin((nx + ny) * 2.5 + turb));
      const vein2 = Math.abs(Math.sin((nx * 1.5 - ny * 0.8) * 3.0 + turb * 0.8));

      const v = Math.min(vein1, vein2);
      const veinIntensity = Math.pow(1.0 - v, 4.0);

      // Base pure Pentelic marble
      let r = 240 + noiseGen.noise2D(nx * 6, ny * 6) * 10;
      let g = 242 + noiseGen.noise2D(nx * 6, ny * 6) * 8;
      let b = 246 + noiseGen.noise2D(nx * 6, ny * 6) * 6;

      // Grey & subtle gold veins
      r -= veinIntensity * 50;
      g -= veinIntensity * 45;
      b -= veinIntensity * 35;

      data[idx] = Math.min(255, Math.max(0, Math.floor(r)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.floor(g)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.floor(b)));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * 4. Soft Volumetric Cloud Alpha Texture (256x256)
 * Multi-layer puffy cumulus texture with Gaussian falloff
 */
export function createRealisticCloudTexture(size = 256) {
  const cacheKey = `cloud_${size}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  const center = size / 2;
  const radius = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = (x - center) / radius;
      const dy = (y - center) / radius;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= 1.0) {
        data[idx + 3] = 0;
        continue;
      }

      const falloff = Math.cos(dist * Math.PI * 0.5);
      const nx = (x / size) * 3.5;
      const ny = (y / size) * 3.5;
      const puff = noiseGen.fbm(nx, ny, 4, 0.55);

      const alpha = Math.max(0, Math.min(1, (falloff * 0.75 + puff * 0.55) * falloff));

      data[idx] = 255;
      data[idx + 1] = 250;
      data[idx + 2] = 245;
      data[idx + 3] = Math.floor(alpha * 255);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * 5. Sun Flare & Radiant Corona Texture (256x256)
 */
export function createSunFlareTexture(size = 256) {
  const cacheKey = `sunflare_${size}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 2, center, center, center);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.12, 'rgba(255, 240, 180, 0.95)');
  grad.addColorStop(0.28, 'rgba(254, 215, 60, 0.65)');
  grad.addColorStop(0.55, 'rgba(245, 158, 11, 0.25)');
  grad.addColorStop(0.85, 'rgba(217, 119, 6, 0.06)');
  grad.addColorStop(1.0, 'rgba(180, 83, 9, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Add 8 subtle golden diffraction spike rays
  ctx.save();
  ctx.translate(center, center);
  ctx.strokeStyle = 'rgba(255, 245, 200, 0.22)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-center * 0.9, 0);
    ctx.lineTo(center * 0.9, 0);
    ctx.stroke();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * 6. Ancient Hammered Olympian Gold Texture (256x256)
 */
export function createGoldLeafTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = (x / size) * 8.0;
      const ny = (y / size) * 8.0;

      const hammer = noiseGen.fbm(nx * 2, ny * 2, 4, 0.6);
      const sheen = Math.sin(nx * 1.5 + ny * 1.2) * 0.15;

      // Rich Olympian Gold: 245, 185, 45 with subtle variations
      const r = Math.min(255, Math.max(180, Math.floor(235 + hammer * 35 + sheen * 40)));
      const g = Math.min(240, Math.max(130, Math.floor(175 + hammer * 30 + sheen * 35)));
      const b = Math.min(100, Math.max(20, Math.floor(40 + hammer * 25 + sheen * 20)));

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * 7. Authentic Greek Key (Meander) Frieze Texture (512x128)
 */
export function createGreekMeanderTexture(width = 512, height = 128) {
  const cacheKey = `meander_${width}_${height}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background Pentelic marble or deep navy
  ctx.fillStyle = '#101628';
  ctx.fillRect(0, 0, width, height);

  // Borders top and bottom
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(width, 8);
  ctx.moveTo(0, height - 8);
  ctx.lineTo(width, height - 8);
  ctx.stroke();

  // Draw repeating Greek Key units
  const unitWidth = 64;
  const units = width / unitWidth;
  ctx.lineWidth = 5;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  for (let i = 0; i < units; i++) {
    const x = i * unitWidth;
    ctx.strokeStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(x + 4, height - 18);
    ctx.lineTo(x + unitWidth - 8, height - 18);
    ctx.lineTo(x + unitWidth - 8, 20);
    ctx.lineTo(x + 16, 20);
    ctx.lineTo(x + 16, height - 32);
    ctx.lineTo(x + unitWidth - 24, height - 32);
    ctx.lineTo(x + unitWidth - 24, 34);
    ctx.lineTo(x + 30, 34);
    ctx.stroke();

    // Golden inner highlight
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 5;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(4, 1);
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * 8. Cascading Waterfall Texture (256x512)
 */
export function createWaterfallTexture(width = 256, height = 512) {
  const cacheKey = `waterfall_${width}_${height}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const nx = (x / width) * 4.0;
      const ny = (y / height) * 24.0; // intense vertical elongation

      const streak = noiseGen.fbm(nx * 3.0, ny * 0.8, 3, 0.6);
      const foam = noiseGen.noise2D(nx * 12.0, ny * 3.0);
      const alpha = Math.min(1.0, Math.max(0.2, streak * 0.7 + foam * 0.35 + 0.3));

      // Shimmering crystalline Olympian water & frothy white crests
      data[idx] = Math.floor(190 + foam * 65);
      data[idx + 1] = Math.floor(230 + foam * 25);
      data[idx + 2] = 255;
      data[idx + 3] = Math.floor(alpha * 220);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

