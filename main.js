import * as THREE from 'three';

const Spec = {
  length: 140,
  width: 26,
  height: 48,
  aisle: 8,
  bays: 8,
};

/**
 * Shared procedural void-stone maps (Mac-friendly 512–1024, one set for all stone mats).
 * @param {number} size
 * @returns {{ map: THREE.CanvasTexture, roughnessMap: THREE.CanvasTexture, bumpMap: THREE.CanvasTexture }}
 */
function makeNoisyStoneMaps(size = 768) {
  const colorC = document.createElement('canvas');
  colorC.width = colorC.height = size;
  const roughC = document.createElement('canvas');
  roughC.width = roughC.height = size;
  const bumpC = document.createElement('canvas');
  bumpC.width = bumpC.height = size;
  const cctx = colorC.getContext('2d');
  const rctx = roughC.getContext('2d');
  const bctx = bumpC.getContext('2d');
  const cImg = cctx.createImageData(size, size);
  const rImg = rctx.createImageData(size, size);
  const bImg = bctx.createImageData(size, size);
  const cd = cImg.data;
  const rd = rImg.data;
  const bd = bImg.data;
  // Cheap value-noise via layered hash (no deps)
  const hash = (x, y) => {
    let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const noise = (x, y) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const a = hash(x0, y0);
    const b = hash(x0 + 1, y0);
    const c = hash(x0, y0 + 1);
    const d = hash(x0 + 1, y0 + 1);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  };
  const fbm = (x, y) => {
    let a = 0;
    let amp = 0.5;
    let freq = 1;
    for (let o = 0; o < 5; o++) {
      a += amp * noise(x * freq, y * freq);
      amp *= 0.5;
      freq *= 2.05;
    }
    return a;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size * 6.5;
      const ny = y / size * 6.5;
      const n = fbm(nx, ny);
      const n2 = fbm(nx * 2.3 + 17.1, ny * 2.3 - 9.4);
      const pit = Math.pow(Math.max(0, 1 - Math.abs(n2 - 0.42) * 4.2), 2.2);
      // Weathered purple-void stone tint
      const baseR = 48 + n * 38 + pit * -18;
      const baseG = 40 + n * 28 + pit * -14;
      const baseB = 62 + n * 48 + pit * -8 + n2 * 12;
      cd[i] = Math.max(0, Math.min(255, baseR | 0));
      cd[i + 1] = Math.max(0, Math.min(255, baseG | 0));
      cd[i + 2] = Math.max(0, Math.min(255, baseB | 0));
      cd[i + 3] = 255;
      const rough = Math.max(0.35, Math.min(0.98, 0.55 + n * 0.4 + pit * 0.25));
      const rv = (rough * 255) | 0;
      rd[i] = rd[i + 1] = rd[i + 2] = rv;
      rd[i + 3] = 255;
      const bump = Math.max(0, Math.min(255, ((n * 0.72 + n2 * 0.28 + pit * 0.35) * 255) | 0));
      bd[i] = bd[i + 1] = bd[i + 2] = bump;
      bd[i + 3] = 255;
    }
  }
  cctx.putImageData(cImg, 0, 0);
  rctx.putImageData(rImg, 0, 0);
  bctx.putImageData(bImg, 0, 0);
  const wrap = (tex) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  };
  const map = wrap(new THREE.CanvasTexture(colorC));
  map.colorSpace = THREE.SRGBColorSpace;
  const roughnessMap = wrap(new THREE.CanvasTexture(roughC));
  const bumpMap = wrap(new THREE.CanvasTexture(bumpC));
  return { map, roughnessMap, bumpMap };
}

const _stoneMaps = makeNoisyStoneMaps(768);

const stone = new THREE.MeshStandardMaterial({
  color: 0xb8aec8,
  map: _stoneMaps.map,
  roughnessMap: _stoneMaps.roughnessMap,
  bumpMap: _stoneMaps.bumpMap,
  bumpScale: 0.085,
  roughness: 0.92,
  metalness: 0.04,
});
const stoneDark = new THREE.MeshStandardMaterial({
  color: 0x7a7088,
  map: _stoneMaps.map,
  roughnessMap: _stoneMaps.roughnessMap,
  bumpMap: _stoneMaps.bumpMap,
  bumpScale: 0.1,
  roughness: 0.95,
  metalness: 0.03,
});
const stoneWarm = new THREE.MeshStandardMaterial({
  color: 0xc4a8c8,
  map: _stoneMaps.map,
  roughnessMap: _stoneMaps.roughnessMap,
  bumpMap: _stoneMaps.bumpMap,
  bumpScale: 0.09,
  roughness: 0.88,
  metalness: 0.05,
});
const metal = new THREE.MeshStandardMaterial({
  color: 0x6a5e48,
  roughness: 0.45,
  metalness: 0.72,
});
const flameMat = new THREE.MeshStandardMaterial({
  color: 0xffa0d0,
  emissive: 0xd050ff,
  emissiveIntensity: 1.9,
  roughness: 1,
  metalness: 0,
});
const glassMats = [
  new THREE.MeshStandardMaterial({ color: 0xc070e0, emissive: 0x8030c0, emissiveIntensity: 1.35, roughness: 0.5, metalness: 0 }),
  new THREE.MeshStandardMaterial({ color: 0x9060ff, emissive: 0x5020d0, emissiveIntensity: 1.4, roughness: 0.5, metalness: 0 }),
  new THREE.MeshStandardMaterial({ color: 0xe090ff, emissive: 0xa040e0, emissiveIntensity: 1.25, roughness: 0.5, metalness: 0 }),
  new THREE.MeshStandardMaterial({ color: 0x7050c8, emissive: 0x4020a0, emissiveIntensity: 1.3, roughness: 0.5, metalness: 0 }),
];

const clothRed = new THREE.MeshStandardMaterial({
  color: 0x5a1820,
  roughness: 0.92,
  metalness: 0.02,
  side: THREE.DoubleSide,
});
const clothBone = new THREE.MeshStandardMaterial({
  color: 0xc8b898,
  roughness: 0.88,
  metalness: 0.02,
  side: THREE.DoubleSide,
});
const parchment = new THREE.MeshStandardMaterial({
  color: 0xc4a878,
  roughness: 0.95,
  metalness: 0,
});
const waxRed = new THREE.MeshStandardMaterial({
  color: 0x8a1820,
  emissive: 0x501018,
  emissiveIntensity: 0.55,
  roughness: 0.65,
  metalness: 0.05,
});
const bone = new THREE.MeshStandardMaterial({
  color: 0xd0c4a8,
  roughness: 0.78,
  metalness: 0.02,
});
const crateWood = new THREE.MeshStandardMaterial({
  color: 0x4a3a28,
  roughness: 0.9,
  metalness: 0.04,
});
const cableMat = new THREE.MeshStandardMaterial({
  color: 0x2a2a30,
  roughness: 0.7,
  metalness: 0.35,
});
const leadMat = new THREE.MeshStandardMaterial({
  color: 0x12141a,
  roughness: 0.55,
  metalness: 0.65,
});
const ringMetal = new THREE.MeshStandardMaterial({
  color: 0x8a7a5a,
  roughness: 0.4,
  metalness: 0.78,
});
const aquilaDark = new THREE.MeshStandardMaterial({
  color: 0x2a2c34,
  roughness: 0.48,
  metalness: 0.82,
});
const aquilaBone = new THREE.MeshStandardMaterial({
  color: 0xc8bca0,
  roughness: 0.72,
  metalness: 0.08,
});
const aquilaGold = new THREE.MeshStandardMaterial({
  color: 0xc8a848,
  emissive: 0x8a6820,
  emissiveIntensity: 0.55,
  roughness: 0.38,
  metalness: 0.85,
});
// Apse stained-glass textures (Illustrator art) — loaded once, shared with glass mats
const APSE_GLASS_URL = './assets/stained-glass/vc-apse-glass-01.png';
const APSE_ROSE_URL = './assets/stained-glass/vc-apse-glass-02-rose.png';
const _apseGlassLoader = new THREE.TextureLoader();
let _apseGlassTex = null;
let _apseRoseTex = null;
function loadApseGlassTexture() {
  if (_apseGlassTex) return _apseGlassTex;
  const tex = _apseGlassLoader.load(APSE_GLASS_URL);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  _apseGlassTex = tex;
  return tex;
}
function loadApseRoseTexture() {
  if (_apseRoseTex) return _apseRoseTex;
  const tex = _apseGlassLoader.load(APSE_ROSE_URL);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  _apseRoseTex = tex;
  return tex;
}

// Illustrator heraldry pack (altar / floor / seals / glass accents)
const HERALDRY_BASE = './assets/heraldry/';
const HERALDRY_URLS = {
  altarCloth: HERALDRY_BASE + 'vc-altar-cloth-01.png',
  floorMedallion: HERALDRY_BASE + 'vc-floor-medallion-01.png',
  floorRunner: HERALDRY_BASE + 'vc-floor-runner-01.png',
  clerestory: HERALDRY_BASE + 'vc-clerestory-01.png',
  puritySeal: HERALDRY_BASE + 'vc-purity-seal-01.png',
  shipCrest: HERALDRY_BASE + 'vc-ship-crest-01.png',
  oculus: HERALDRY_BASE + 'vc-oculus-01.png',
  wallRelief: HERALDRY_BASE + 'vc-wall-relief-01.png',
  censer: HERALDRY_BASE + 'vc-censer-01.png',
};
const _heraldryLoader = new THREE.TextureLoader();
/** @type {Record<string, THREE.Texture>} */
const _heraldryTexCache = {};
/**
 * @param {keyof typeof HERALDRY_URLS} key
 * @param {{ wrapS?: number, wrapT?: number, rotation?: number }} [opts]
 * @returns {THREE.Texture}
 */
function loadHeraldryTexture(key, opts = {}) {
  const cacheKey = key + '|' + (opts.rotation || 0) + '|' + (opts.wrapS || 0);
  if (_heraldryTexCache[cacheKey]) return _heraldryTexCache[cacheKey];
  const tex = _heraldryLoader.load(HERALDRY_URLS[key]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = opts.wrapS != null ? opts.wrapS : THREE.ClampToEdgeWrapping;
  tex.wrapT = opts.wrapT != null ? opts.wrapT : THREE.ClampToEdgeWrapping;
  if (opts.rotation) {
    tex.center.set(0.5, 0.5);
    tex.rotation = opts.rotation;
  }
  _heraldryTexCache[cacheKey] = tex;
  return tex;
}

/**
 * Procedural deep purple/magenta nebula + stars for exterior void (clerestory view).
 * @param {number} w
 * @param {number} h
 * @returns {THREE.CanvasTexture}
 */
function makeNebulaTexture(w = 1024, h = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050208';
  ctx.fillRect(0, 0, w, h);
  // Soft nebula blobs
  const blobs = [
    [0.22, 0.45, 0.55, 'rgba(90, 20, 120, 0.55)'],
    [0.55, 0.38, 0.7, 'rgba(140, 30, 160, 0.5)'],
    [0.78, 0.55, 0.5, 'rgba(70, 25, 140, 0.48)'],
    [0.4, 0.7, 0.45, 'rgba(180, 40, 140, 0.35)'],
    [0.12, 0.25, 0.4, 'rgba(50, 15, 100, 0.45)'],
    [0.88, 0.3, 0.35, 'rgba(120, 20, 180, 0.4)'],
    [0.65, 0.75, 0.4, 'rgba(100, 40, 160, 0.32)'],
  ];
  for (const [ux, uy, r, col] of blobs) {
    const gx = ux * w;
    const gy = uy * h;
    const rad = r * Math.min(w, h);
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(5, 2, 8, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  // Filaments
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) {
    const x0 = Math.random() * w;
    const y0 = Math.random() * h;
    const x1 = x0 + (Math.random() - 0.5) * w * 0.45;
    const y1 = y0 + (Math.random() - 0.5) * h * 0.35;
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, `rgba(${120 + (Math.random() * 80) | 0}, ${20 + (Math.random() * 40) | 0}, ${160 + (Math.random() * 60) | 0}, 0.22)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 8 + Math.random() * 28;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) * 0.5 + (Math.random() - 0.5) * 80, (y0 + y1) * 0.5, x1, y1);
    ctx.stroke();
  }
  // Stars
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const bright = 0.35 + Math.random() * 0.65;
    const s = Math.random() < 0.08 ? 1.6 + Math.random() * 1.4 : 0.5 + Math.random() * 1.1;
    ctx.fillStyle = `rgba(${200 + (Math.random() * 55) | 0}, ${180 + (Math.random() * 50) | 0}, ${220 + (Math.random() * 35) | 0}, ${bright})`;
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Exterior void shell + soft purple wash visible through clerestory openings.
 * Shell clears the FULL cathedral footprint; never intersects the nave volume.
 * @param {THREE.Group} group
 * @param {{ length: number, width: number, height: number, aisle: number }} spec
 */
function addVoidNebulaExterior(group, spec) {
  const { length, width, height, aisle } = spec;
  // Radius from half of the longer plan extent (length), not width alone
  const footprint = Math.max(length, width + aisle * 2);
  const r = footprint * 0.5 + 40;
  const nebulaTex = makeNebulaTexture(1024, 512);
  const skyMat = new THREE.MeshBasicMaterial({
    map: nebulaTex,
    side: THREE.BackSide,
    fog: false,
  });
  // Tall open cylinder well outside walls and ends (BackSide sky)
  const cylH = height * 2.2;
  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, cylH, 64, 1, true),
    skyMat,
  );
  cyl.position.set(0, height * 0.55, 0);
  cyl.renderOrder = -2;
  group.add(cyl);

  // Flat roof void disk ABOVE the ridge — never dips into the interior
  const roofDisk = new THREE.Mesh(
    new THREE.CircleGeometry(r * 0.98, 64),
    skyMat,
  );
  roofDisk.rotation.x = Math.PI / 2;
  roofDisk.position.set(0, height + 18, 0);
  roofDisk.renderOrder = -2;
  group.add(roofDisk);

  // Soft emissive wash planes just outside high openings (push purple in)
  const washMat = new THREE.MeshBasicMaterial({
    color: 0xa050e0,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  const halfL = length / 2;
  const halfW = width / 2;
  for (const side of [-1, 1]) {
    const wash = new THREE.Mesh(new THREE.PlaneGeometry(length * 0.92, height * 0.22), washMat);
    wash.position.set(0, height * 0.9, side * (halfW + aisle * 0.55 + 3.2));
    wash.rotation.y = side > 0 ? Math.PI : 0;
    wash.renderOrder = -1;
    group.add(wash);
  }
  // Facade / apse end washes
  for (const [x, rotY] of [[-halfL - 4, Math.PI / 2], [halfL + 2, -Math.PI / 2]]) {
    const wash = new THREE.Mesh(new THREE.PlaneGeometry(width + aisle, height * 0.35), washMat.clone());
    wash.position.set(x, height * 0.75, 0);
    wash.rotation.y = rotY;
    wash.renderOrder = -1;
    group.add(wash);
  }
}

/**
 * Translucent violet shafts from clerestory into the nave.
 * @param {THREE.Group} group
 * @param {{ length: number, width: number, height: number, bays: number }} spec
 * @returns {THREE.Mesh[]}
 */
function addLightShafts(group, spec) {
  const { length, width, height, bays } = spec;
  const halfL = length / 2;
  const halfW = width / 2;
  const bay = length / (bays + 1);
  /** @type {THREE.Mesh[]} */
  const shafts = [];
  const shaftMat = new THREE.MeshBasicMaterial({
    color: 0xb888ff,
    transparent: true,
    opacity: 0.075,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  // Handful of shafts (not dozens): staggered clerestory bays
  const use = [];
  for (let i = 0; i < bays; i++) {
    if (i % 2 === 0) use.push([i, -1]);
    else use.push([i, 1]);
  }
  const selected = use.filter((_, idx) => idx % 2 === 0).slice(0, 8);
  const yAxis = new THREE.Vector3(0, 1, 0);
  for (const [i, side] of selected) {
    // Aim at clerestory void between uprights (not the pier center)
    const x = -halfL + bay * (i + 1.5);
    if (x > halfL - bay * 0.4) continue;
    const tip = new THREE.Vector3(x, height * 0.9, side * (halfW + 0.15));
    const toe = new THREE.Vector3(x + (i % 3 - 1) * 1.2, 3.2, side * 0.8);
    const dir = toe.clone().sub(tip);
    const beamLen = dir.length();
    const mid = tip.clone().lerp(toe, 0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(yAxis, dir.clone().normalize());

    const beam = new THREE.Mesh(
      new THREE.PlaneGeometry(bay * 0.26, beamLen),
      shaftMat.clone(),
    );
    beam.position.copy(mid);
    beam.quaternion.copy(quat);
    beam.renderOrder = 2;
    beam.userData.baseOpacity = 0.08;
    beam.userData.pulsePhase = i * 0.7 + side;
    group.add(beam);
    shafts.push(beam);

    // Second plane crossed for a soft volume read
    const beam2 = beam.clone();
    beam2.material = shaftMat.clone();
    beam2.rotateY(Math.PI / 2);
    beam2.userData.baseOpacity = 0.055;
    beam2.userData.pulsePhase = i * 0.7 + side + 0.9;
    group.add(beam2);
    shafts.push(beam2);

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(bay * 0.14, beamLen, 7, 1, true),
      shaftMat.clone(),
    );
    cone.position.copy(mid);
    cone.quaternion.copy(quat);
    // ConeGeometry tip is +Y; we oriented +Y along tip→toe, so flip so tip sits at window
    cone.rotateX(Math.PI);
    cone.renderOrder = 2;
    cone.userData.baseOpacity = 0.04;
    cone.userData.pulsePhase = i * 0.7 + side + 1.4;
    group.add(cone);
    shafts.push(cone);
  }
  return shafts;
}

/**
 * Sparse purple-white dust motes drifting in mid-nave / shaft volumes.
 * @param {THREE.Group} group
 * @param {{ length: number, width: number, height: number }} spec
 * @returns {{ points: THREE.Points, velocities: Float32Array }}
 */
function addDustMotes(group, spec) {
  const { length, width, height } = spec;
  const halfL = length / 2;
  const count = 280;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const ix = i * 3;
    positions[ix] = (Math.random() - 0.5) * length * 0.85;
    positions[ix + 1] = 4 + Math.random() * height * 0.72;
    positions[ix + 2] = (Math.random() - 0.5) * width * 0.7;
    velocities[ix] = (Math.random() - 0.5) * 0.15;
    velocities[ix + 1] = 0.04 + Math.random() * 0.12;
    velocities[ix + 2] = (Math.random() - 0.5) * 0.12;
    const tint = Math.random();
    colors[ix] = 0.75 + tint * 0.25;
    colors[ix + 1] = 0.55 + tint * 0.35;
    colors[ix + 2] = 0.95;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    fog: false,
  });
  const points = new THREE.Points(geo, mat);
  points.renderOrder = 3;
  points.userData.bounds = { halfL: halfL * 0.92, halfW: width * 0.38, yMin: 3.5, yMax: height * 0.85 };
  group.add(points);
  return { points, velocities };
}

/**
 * @param {THREE.Scene} scene
 * @returns {{ lights: THREE.PointLight[], flames: THREE.Mesh[], banners: THREE.Object3D[], floaters: { mesh: THREE.Object3D, path: THREE.CatmullRomCurve3, t: number, speed: number, phase: number, amp: number }[], glassPanes: THREE.MeshStandardMaterial[], shafts: THREE.Mesh[], dust: { points: THREE.Points, velocities: Float32Array } }}
 */
function buildCathedral(scene) {
  const { length, width, height, aisle, bays } = Spec;
  const halfL = length / 2;
  const halfW = width / 2;
  const group = new THREE.Group();

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(length + 16, 1, width + aisle * 2 + 6),
    stoneDark,
  );
  floor.position.y = -0.5;
  floor.receiveShadow = true;
  group.add(floor);

  const inlay = new THREE.Mesh(new THREE.BoxGeometry(length * 0.9, 0.06, 3.6), metal);
  inlay.position.y = 0.03;
  group.add(inlay);

  for (const side of [-1, 1]) {
    const z = side * (halfW + aisle * 0.3);
    const lower = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.36, 2),
      stone,
    );
    lower.position.set(0, height * 0.18, z);
    lower.castShadow = true;
    lower.receiveShadow = true;
    group.add(lower);

    const bay = length / (bays + 1);
    for (let i = 0; i < bays; i++) {
      const x = -halfL + bay * (i + 1);
      const pier = new THREE.Mesh(
        new THREE.BoxGeometry(bay * 0.4, height * 0.5, 2),
        stone,
      );
      pier.position.set(x, height * 0.45, z);
      pier.castShadow = true;
      group.add(pier);

      const pane = new THREE.Mesh(
        new THREE.BoxGeometry(bay * 0.34, height * 0.22, 0.35),
        glassMats[i % glassMats.length],
      );
      pane.position.set(x, height * 0.56, z);
      group.add(pane);

      const mull = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, height * 0.22, 0.4),
        stoneDark,
      );
      mull.position.set(x, height * 0.56, z);
      group.add(mull);
    }

    const cornice = new THREE.Mesh(
      new THREE.BoxGeometry(length + 2, 1.4, 3),
      stoneWarm,
    );
    cornice.position.set(0, height * 0.78, z);
    group.add(cornice);

    // Clerestory: stone uprights + open voids so exterior nebula reads through
    {
      const bay = length / (bays + 1);
      const clerY = height * 0.9;
      const clerH = height * 0.14;
      const pierW = bay * 0.38;
      // Uprights over lower piers + short end caps
      for (let i = 0; i < bays; i++) {
        const x = -halfL + bay * (i + 1);
        const clerPier = new THREE.Mesh(
          new THREE.BoxGeometry(pierW, clerH, 1.6),
          stone,
        );
        clerPier.position.set(x, clerY, z);
        clerPier.castShadow = true;
        group.add(clerPier);
      }
      for (const endX of [-halfL + pierW * 0.55, halfL - pierW * 0.55]) {
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(pierW * 1.1, clerH, 1.6),
          stone,
        );
        cap.position.set(endX, clerY, z);
        group.add(cap);
      }
      // Sill / lintel so openings read as windows
      const sill = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.32, 1.7),
        stoneDark,
      );
      sill.position.set(0, clerY - clerH * 0.5, z);
      group.add(sill);
      const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.32, 1.7),
        stoneDark,
      );
      lintel.position.set(0, clerY + clerH * 0.5, z);
      group.add(lintel);
      // Thin center mullion in each void (opening stays mostly empty)
      for (let i = 0; i < bays - 1; i++) {
        const x = -halfL + bay * (i + 1.5);
        const mull = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, clerH * 0.82, 1.65),
          stoneDark,
        );
        mull.position.set(x, clerY, z);
        group.add(mull);
      }
      // A few Illustrator clerestory lancets (emissive); leave other voids open for nebula
      {
        const clerTex = loadHeraldryTexture('clerestory');
        const clerMat = new THREE.MeshStandardMaterial({
          map: clerTex,
          emissiveMap: clerTex,
          emissive: 0xffffff,
          emissiveIntensity: 0.95,
          color: 0xffffff,
          roughness: 0.5,
          metalness: 0.04,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: true,
        });
        // Pick every-other mid void, only two per side
        const paneIdx = side > 0 ? [1, 4] : [2, 5];
        for (const i of paneIdx) {
          if (i >= bays - 1) continue;
          const x = -halfL + bay * (i + 1.5);
          const openW = bay - pierW;
          const paneW = Math.min(openW * 0.72, 4.2);
          const paneH = clerH * 0.78;
          const pane = new THREE.Mesh(new THREE.PlaneGeometry(paneW, paneH), clerMat);
          pane.position.set(x, clerY, z - side * 0.85);
          // Face inward toward nave
          pane.rotation.y = side > 0 ? Math.PI : 0;
          group.add(pane);
        }
      }
    }
  }

  /** @type {THREE.Vector3[]} */
  const columnBases = [];

  for (let i = 0; i < bays; i++) {
    const bay = length / (bays + 1);
    const x = -halfL + bay * (i + 1);
    for (const side of [-1, 1]) {
      const z = side * (halfW * 0.72);
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(1.05, 1.3, height * 0.68, 12),
        stoneWarm,
      );
      col.position.set(x, height * 0.34, z);
      col.castShadow = true;
      col.receiveShadow = true;
      group.add(col);

      const capital = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.7, 2.6),
        stone,
      );
      capital.position.set(x, height * 0.7, z);
      group.add(capital);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.45, 1.55, 0.55, 10),
        stoneDark,
      );
      base.position.set(x, 0.3, z);
      group.add(base);
      columnBases.push(new THREE.Vector3(x, 0.6, z));
    }
  }

  for (let i = 0; i < bays; i++) {
    const bay = length / (bays + 1);
    const x = -halfL + bay * (i + 1);
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 1.15, width + 4),
      stoneDark,
    );
    rib.position.set(x, height * 0.82, 0);
    group.add(rib);

    const cross = new THREE.Mesh(
      new THREE.BoxGeometry(bay * 0.9, 0.7, 0.7),
      stoneDark,
    );
    cross.position.set(x, height * 0.86, 0);
    group.add(cross);
  }
  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.9, 0.9),
    stoneWarm,
  );
  ridge.position.set(0, height * 0.88, 0);
  group.add(ridge);

  const apse = new THREE.Mesh(
    new THREE.BoxGeometry(6, height * 0.85, width + aisle),
    stone,
  );
  apse.position.set(halfL - 2, height * 0.4, 0);
  apse.castShadow = true;
  group.add(apse);

  /** @type {THREE.MeshStandardMaterial[]} */
  const glassPanes = [];
  addApseStainedGlass(group, { halfL, halfW, height, aisle, glassPanes });

  const altar = new THREE.Mesh(new THREE.BoxGeometry(8, 3.2, 5), metal);
  altar.position.set(halfL - 10, 1.6, 0);
  altar.castShadow = true;
  group.add(altar);

  // Illustrator altar cloth on raised top (+Y); thin frontal apron toward nave (-X)
  {
    const clothTex = loadHeraldryTexture('altarCloth');
    const clothMat = new THREE.MeshStandardMaterial({
      map: clothTex,
      color: 0xffffff,
      roughness: 0.78,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });
    const clothTop = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.4), clothMat);
    clothTop.rotation.x = -Math.PI / 2;
    clothTop.position.set(halfL - 10, 3.26, 0);
    group.add(clothTop);
    // Frontal apron hangs slightly off the nave-facing face
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.35), clothMat);
    apron.position.set(halfL - 14.06, 2.15, 0);
    apron.rotation.y = Math.PI / 2; // face -X (nave)
    group.add(apron);
  }

  for (let i = 0; i < 6; i++) {
    const x = -halfL + 16 + i * ((length - 36) / 5);
    for (const side of [-1, 1]) {
      const butt = new THREE.Mesh(
        new THREE.BoxGeometry(3, height * 0.55, 2.5),
        stoneDark,
      );
      butt.position.set(x, height * 0.28, side * (halfW + aisle + 4));
      butt.castShadow = true;
      group.add(butt);
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1.4, 1.6),
        stone,
      );
      arm.position.set(x, height * 0.55, side * (halfW + aisle * 0.6));
      arm.rotation.z = side * -0.35;
      group.add(arm);
    }
  }

  const facade = new THREE.Mesh(
    new THREE.BoxGeometry(4, height * 0.9, width + aisle * 0.5),
    stone,
  );
  facade.position.set(-halfL + 1, height * 0.42, 0);
  group.add(facade);
  const portal = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 10, 6),
    stoneDark,
  );
  portal.position.set(-halfL + 2.2, 5, 0);
  group.add(portal);

  /** @type {THREE.Object3D[]} */
  const banners = [];
  /** @type {{ mesh: THREE.Object3D, path: THREE.CatmullRomCurve3, t: number, speed: number, phase: number, amp: number }[]} */
  const floaters = [];

  addRelicDetails(group, { halfL, halfW, height, length, aisle, bays, columnBases, banners, floaters });

  addVoidNebulaExterior(group, { length, width, height, aisle });
  const shafts = addLightShafts(group, { length, width, height, bays });
  const dust = addDustMotes(group, { length, width, height });

  scene.add(group);

  scene.add(new THREE.AmbientLight(0x6a5090, 1.05));
  scene.add(new THREE.HemisphereLight(0xb090e0, 0x2a1838, 1.05));

  const key = new THREE.DirectionalLight(0xc0a0ff, 1.25);
  key.position.set(-35, 75, 28);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 10;
  key.shadow.camera.far = 200;
  key.shadow.camera.left = -60;
  key.shadow.camera.right = 60;
  key.shadow.camera.top = 50;
  key.shadow.camera.bottom = -50;
  key.shadow.radius = 2;
  key.shadow.bias = -0.0003;
  scene.add(key);

  const warmFill = new THREE.DirectionalLight(0xffb0e0, 0.65);
  warmFill.position.set(25, 45, -15);
  scene.add(warmFill);

  const voidFill = new THREE.DirectionalLight(0x8050c8, 0.55);
  voidFill.position.set(0, 20, -40);
  scene.add(voidFill);

  /** @type {THREE.PointLight[]} */
  const lights = [];
  /** @type {THREE.Mesh[]} */
  const flames = [];

  function addFlame(x, y, z, scale = 1) {
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.28 * scale, 8, 8), flameMat);
    flame.position.set(x, y, z);
    flame.scale.set(0.7, 1.35, 0.7);
    group.add(flame);
    flames.push(flame);
  }

  function addPoint(color, intensity, distance, decay, x, y, z) {
    const pl = new THREE.PointLight(color, intensity, distance, decay);
    pl.position.set(x, y, z);
    scene.add(pl);
    lights.push(pl);
    return pl;
  }

  // Dense pedestals; PointLight only on even indices to stay in budget
  const candleN = 24;
  for (let i = 0; i < candleN; i++) {
    const along = (i / (candleN - 1)) * (length - 22) - halfL + 11;
    const side = i % 2 === 0 ? -1 : 1;
    const z = side * (halfW * 0.55);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 2, 8), metal);
    ped.position.set(along, 1, z);
    ped.castShadow = true;
    group.add(ped);
    addFlame(along, 2.3, z, 1);
    if (i % 2 === 0) {
      addPoint(0xe080ff, 8.0, 30, 1.55, along, 2.3, z);
    }
  }

  for (let i = 0; i < 5; i++) {
    const x = -halfL + 20 + i * ((length - 44) / 4);
    const y = height * 0.42;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.14, 8, 20), metal);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, y, 0);
    group.add(ring);

    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), metal);
    hub.position.set(x, y, 0);
    group.add(hub);

    const chain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, height * 0.35, 6),
      metal,
    );
    chain.position.set(x, y + height * 0.175, 0);
    group.add(chain);

    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2;
      const fx = x + Math.cos(ang) * 1.9;
      const fz = Math.sin(ang) * 1.9;
      addFlame(fx, y - 0.35, fz, 0.85);
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.1, 0.1),
        metal,
      );
      spoke.position.set(x + Math.cos(ang) * 0.95, y, fz * 0.5 + Math.sin(ang) * 0.95);
      spoke.rotation.y = -ang;
      group.add(spoke);
    }
    addPoint(0xd0a0ff, 19, 50, 1.3, x, y - 0.4, 0);
    addFlame(x, y - 0.55, 0, 1.5);
  }

  const tints = [0xc070e0, 0x8060ff, 0xe090ff, 0x9050d0, 0xb060f0, 0x7040d8];
  for (let i = 0; i < 6; i++) {
    const x = -halfL + 18 + i * ((length - 40) / 5);
    const side = i % 2 === 0 ? -1 : 1;
    addPoint(tints[i], 6.5, 36, 1.55, x, height * 0.52, side * (halfW * 0.35));
  }

  for (const side of [-1, 1]) {
    const x = halfL - 16;
    const z = side * 6;
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 4.5, 8), metal);
    stand.position.set(x, 2.25, z);
    stand.castShadow = true;
    group.add(stand);
    addFlame(x, 5.2, z, 1.35);
    addPoint(0xf090ff, 16, 44, 1.25, x, 5.2, z);
  }

    // Apse glass beacon — warm + cool, steady (no flicker)
  const gx = halfL - 6;
  const gy = height * 0.5;
  addPoint(0xf0d0ff, 28, 62, 1.15, gx, gy, 0);
  addPoint(0xa060ff, 22, 52, 1.25, gx - 1.5, gy + 2, 3.5);
  addPoint(0xe070ff, 16, 44, 1.3, gx - 1.2, gy - 3, -3.2);
  lights[lights.length - 3].userData.steady = true;
  lights[lights.length - 2].userData.steady = true;
  lights[lights.length - 1].userData.steady = true;

  // Cap: dense candle meshes, real PointLights every other + cores + glass (~27)
  return { lights, flames, banners, floaters, glassPanes, shafts, dust };
}

/**
 * Double-headed eagle silhouette from boxes — shallow depth for wall/banner relief.
 * Faces +Z; scale ~1 → ~2 units tall.
 * @param {number} scale
 * @returns {THREE.Group}
 */

const SENPAI_BANNER_URLS = [
  './assets/banners/senpai-banner-00.png',
  './assets/banners/senpai-banner-01.png',
  './assets/banners/senpai-banner-02.png',
  './assets/banners/senpai-banner-03.png',
  './assets/banners/senpai-banner-04.png',
  './assets/banners/senpai-banner-05.png',
];
const SENPAI_BANNER_ASPECTS = [0.75, 0.5625, 0.75, 0.5625, 0.75, 0.5625];
const _bannerTexCache = [];
const _bannerLoader = new THREE.TextureLoader();
function loadSenpaiBannerTexture(idx) {
  const i = ((idx % SENPAI_BANNER_URLS.length) + SENPAI_BANNER_URLS.length) % SENPAI_BANNER_URLS.length;
  if (_bannerTexCache[i]) return _bannerTexCache[i];
  const tex = _bannerLoader.load(SENPAI_BANNER_URLS[i]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  _bannerTexCache[i] = tex;
  return tex;
}

/**
 * Banner pole X positions: midpoints between consecutive column/pier X coords
 * so cloth never shares an X with a pier. Skip the center gap when there are
 * 7 intervals so we keep 6 clearer banners per side (symmetric).
 * @returns {number[]}
 */
function getSenpaiBannerXs() {
  const { length, bays } = Spec;
  const halfL = length / 2;
  const bay = length / (bays + 1);
  const xs = [];
  const gaps = bays - 1;
  const skip = gaps > 6 ? Math.floor(gaps / 2) : -1;
  for (let g = 0; g < gaps; g++) {
    if (g === skip) continue;
    xs.push(-halfL + bay * (g + 1.5));
  }
  return xs;
}

/**
 * Shared banner layout: front-facing (yaw 0) toward nave center.
 * Poles clear of columns (|z|≈halfW*0.72); cloth nudged inboard.
 * Side camera rails must stay at |z| < cloth |z| so art faces the lens.
 * @param {number} halfW
 * @returns {{ bannerPoleZ: number, bannerClothNudge: number, bannerYaw: number, clothAbsZ: number }}
 */
function getBannerLayout(halfW) {
  const bannerPoleZ = halfW * 0.40; // ~5.2; columns ~halfW*0.72 (~9.4)
  const bannerClothNudge = 0.55; // toward nave → |zCloth| ~ 4.65
  const bannerYaw = 0; // nave-facing (no gallery yaw)
  return {
    bannerPoleZ,
    bannerClothNudge,
    bannerYaw,
    clothAbsZ: bannerPoleZ - bannerClothNudge,
  };
}



const AMBIENCE_URLS = [
  './assets/ambience/ambience-00.jpg',
  './assets/ambience/ambience-01.jpg',
  './assets/ambience/ambience-02.jpg',
  './assets/ambience/ambience-03.jpg',
  './assets/ambience/ambience-04.jpg',
  './assets/ambience/ambience-05.jpg',
];
const AMBIENCE_ASPECTS = [0.75, 0.75, 0.5625, 0.5625, 0.75, 0.5625];
const AMBIENCE_WIDE_URLS = [
  './assets/ambience/ambience-wide-00.jpg',
  './assets/ambience/ambience-wide-01.jpg',
  './assets/ambience/ambience-wide-02.jpg',
  './assets/ambience/ambience-wide-03.jpg',
];
const _ambienceTexCache = [];
function loadAmbienceTexture(idx) {
  const i = ((idx % AMBIENCE_URLS.length) + AMBIENCE_URLS.length) % AMBIENCE_URLS.length;
  if (_ambienceTexCache[i]) return _ambienceTexCache[i];
  const tex = _bannerLoader.load(AMBIENCE_URLS[i]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  _ambienceTexCache[i] = tex;
  return tex;
}
const _ambienceWideCache = [];
function loadAmbienceWideTexture(idx) {
  const i = ((idx % AMBIENCE_WIDE_URLS.length) + AMBIENCE_WIDE_URLS.length) % AMBIENCE_WIDE_URLS.length;
  if (_ambienceWideCache[i]) return _ambienceWideCache[i];
  const tex = _bannerLoader.load(AMBIENCE_WIDE_URLS[i]);
  tex.colorSpace = THREE.SRGBColorSpace;
  _ambienceWideCache[i] = tex;
  return tex;
}

function makeAquila(scale = 1) {
  const g = new THREE.Group();
  const s = scale;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.35 * s, 0.7 * s, 0.18 * s), aquilaDark);
  body.position.set(0, 0.05 * s, 0);
  g.add(body);
  const torsoTrim = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.55 * s, 0.2 * s), aquilaGold);
  torsoTrim.position.set(0, 0.08 * s, 0.02 * s);
  g.add(torsoTrim);
  // Twin head suggestion
  for (const hx of [-0.18, 0.18]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.28 * s, 0.2 * s), aquilaBone);
    head.position.set(hx * s, 0.52 * s, 0.02 * s);
    head.rotation.z = hx > 0 ? -0.35 : 0.35;
    g.add(head);
    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.08 * s, 0.16 * s), aquilaGold);
    beak.position.set(hx * s * 1.35, 0.48 * s, 0.06 * s);
    g.add(beak);
  }
  // Wing fans — stepped boxes
  for (const side of [-1, 1]) {
    for (let w = 0; w < 4; w++) {
      const ww = 0.55 * s + w * 0.22 * s;
      const wh = 0.28 * s - w * 0.04 * s;
      const feather = new THREE.Mesh(new THREE.BoxGeometry(ww, wh, 0.1 * s), w % 2 === 0 ? aquilaDark : aquilaBone);
      feather.position.set(side * (0.45 * s + w * 0.28 * s), 0.15 * s - w * 0.12 * s, -0.02 * s);
      feather.rotation.z = side * (0.55 - w * 0.08);
      feather.rotation.y = side * 0.12;
      g.add(feather);
    }
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.35 * s, 0.12 * s, 0.08 * s), aquilaGold);
    tip.position.set(side * 1.45 * s, -0.25 * s, 0);
    tip.rotation.z = side * 0.4;
    g.add(tip);
  }
  // Tail fan
  for (let t = 0; t < 3; t++) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.18 * s, 0.4 * s, 0.08 * s), t === 1 ? aquilaGold : aquilaDark);
    tail.position.set((t - 1) * 0.16 * s, -0.45 * s, 0);
    tail.rotation.z = (t - 1) * 0.25;
    g.add(tail);
  }
  return g;
}

/**
 * Skull + wing plaque variant for banner alternation.
 * @param {number} scale
 * @returns {THREE.Group}
 */
function makeWingedSkull(scale = 1) {
  const g = new THREE.Group();
  const s = scale;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.32 * s, 8, 6), aquilaBone);
  skull.position.set(0, 0.08 * s, 0.04 * s);
  skull.scale.set(1, 0.95, 0.9);
  g.add(skull);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.38 * s, 0.14 * s, 0.28 * s), aquilaBone);
  jaw.position.set(0, -0.18 * s, 0.06 * s);
  g.add(jaw);
  for (const sx of [-0.12, 0.12]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 5, 5), aquilaDark);
    eye.position.set(sx * s, 0.12 * s, 0.28 * s);
    g.add(eye);
  }
  for (const side of [-1, 1]) {
    for (let w = 0; w < 3; w++) {
      const feather = new THREE.Mesh(
        new THREE.BoxGeometry(0.45 * s + w * 0.15 * s, 0.16 * s, 0.07 * s),
        w === 1 ? aquilaGold : aquilaDark,
      );
      feather.position.set(side * (0.4 * s + w * 0.22 * s), 0.05 * s - w * 0.08 * s, 0);
      feather.rotation.z = side * (0.45 - w * 0.06);
      g.add(feather);
    }
  }
  return g;
}

/**
 * Invented cross-in-circle wall icon (not a licensed mark).
 * @param {number} scale
 * @returns {THREE.Group}
 */
function makeCruxIcon(scale = 1) {
  const g = new THREE.Group();
  const s = scale;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.85 * s, 0.85 * s, 0.12 * s, 16), aquilaDark);
  disc.rotation.x = Math.PI / 2;
  g.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.85 * s, 0.06 * s, 6, 20), aquilaGold);
  g.add(rim);
  const armH = new THREE.Mesh(new THREE.BoxGeometry(1.35 * s, 0.28 * s, 0.14 * s), aquilaBone);
  g.add(armH);
  const armV = new THREE.Mesh(new THREE.BoxGeometry(0.28 * s, 1.35 * s, 0.14 * s), aquilaBone);
  g.add(armV);
  const gem = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.22 * s, 0.18 * s), aquilaGold);
  gem.position.z = 0.04 * s;
  g.add(gem);
  // Corner studs
  for (const a of [0.55, -0.55]) {
    for (const b of [0.55, -0.55]) {
      const stud = new THREE.Mesh(new THREE.BoxGeometry(0.14 * s, 0.14 * s, 0.12 * s), aquilaGold);
      stud.position.set(a * s, b * s, 0.02 * s);
      g.add(stud);
    }
  }
  return g;
}

/**
 * Wall-mounted servo-arm bracket (folded, shallow into aisle).
 * @param {number} scale
 * @returns {THREE.Group}
 */
function makeServoBracket(scale = 1) {
  const g = new THREE.Group();
  const s = scale;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.7 * s, 0.9 * s, 0.12 * s), aquilaDark);
  g.add(plate);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.18 * s, 0.22 * s, 8), aquilaGold);
  hub.rotation.z = Math.PI / 2;
  hub.position.set(0, 0.1 * s, 0.18 * s);
  g.add(hub);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.18 * s, 0.85 * s, 0.18 * s), aquilaDark);
  upper.position.set(0, -0.25 * s, 0.35 * s);
  upper.rotation.x = 0.55;
  g.add(upper);
  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.14 * s, 6, 6), aquilaGold);
  elbow.position.set(0, -0.55 * s, 0.55 * s);
  g.add(elbow);
  const lower = new THREE.Mesh(new THREE.BoxGeometry(0.14 * s, 0.7 * s, 0.14 * s), aquilaDark);
  lower.position.set(0, -0.85 * s, 0.45 * s);
  lower.rotation.x = -0.65;
  g.add(lower);
  const claw = new THREE.Mesh(new THREE.BoxGeometry(0.35 * s, 0.1 * s, 0.2 * s), aquilaBone);
  claw.position.set(0, -1.15 * s, 0.28 * s);
  g.add(claw);
  return g;
}

/**
 * Relics / ritual clutter readable from the rail. Shared mats; no extra PointLights.
 * @param {THREE.Group} group
 * @param {object} ctx
 */
function addRelicDetails(group, ctx) {
  const { halfL, halfW, height, length, aisle, bays, columnBases, banners, floaters } = ctx;
  const bay = length / (bays + 1);

  // --- Banner poles along nave sides (mid-bay gaps, clear of piers) ---
  const bannerXs = getSenpaiBannerXs();
  const { bannerPoleZ, bannerClothNudge, bannerYaw } = getBannerLayout(halfW);
  for (let i = 0; i < bannerXs.length; i++) {
    const x = bannerXs[i];
    for (const side of [-1, 1]) {
      const zPole = side * bannerPoleZ;
      const zCloth = zPole - side * bannerClothNudge;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.12, 11, 6),
        metal,
      );
      pole.position.set(x, 5.5, zPole);
      pole.castShadow = true;
      group.add(pole);

      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), metal);
      finial.position.set(x, 11.1, zPole);
      group.add(finial);

      // Senpai artwork banners — full uncropped art; plane matches each texture aspect
      const artIdx = (i * 2 + (side > 0 ? 1 : 0)) % SENPAI_BANNER_URLS.length;
      const aspect = SENPAI_BANNER_ASPECTS[artIdx] || 0.75;
      const clothH = 5.4 + (i % 3) * 0.2;
      const clothW = clothH * aspect;
      const artTex = loadSenpaiBannerTexture(artIdx);
      artTex.wrapS = THREE.ClampToEdgeWrapping;
      artTex.wrapT = THREE.ClampToEdgeWrapping;
      const artMat = new THREE.MeshBasicMaterial({
        map: artTex,
        side: THREE.DoubleSide,
      });
      const banner = new THREE.Group();
      banner.position.set(x, 8.2 - clothH * 0.15, zCloth);
      // Front-facing (yaw 0): art toward nave center; side flip keeps portrait readable from aisle
      banner.rotation.y = side * bannerYaw;
      banner.rotation.z = side * 0.04;
      banner.userData.swayPhase = i * 0.9 + side;
      banner.userData.swaySide = side;
      banner.userData.baseYaw = side * bannerYaw;
      group.add(banner);
      banners.push(banner);

      const backing = new THREE.Mesh(
        new THREE.BoxGeometry(clothW + 0.28, clothH + 0.28, 0.05),
        i % 3 === 0 ? clothBone : clothRed,
      );
      banner.add(backing);

      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(clothW + 0.34, clothH + 0.34, 0.04),
        aquilaGold,
      );
      frame.position.z = side > 0 ? 0.01 : -0.01;
      banner.add(frame);

      // Slight inset so gold frame frames art without covering it
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(clothW, clothH),
        artMat,
      );
      art.position.z = side > 0 ? -0.045 : 0.045;
      if (side > 0) art.rotation.y = Math.PI;
      banner.add(art);

      // Notch / tear hint
      const tear = new THREE.Mesh(
        new THREE.BoxGeometry(clothW * 0.35, 0.55, 0.05),
        i % 3 === 0 ? clothBone : clothRed,
      );
      tear.position.set(
        x + clothW * 0.28,
        8.2 - clothH * 0.15 - clothH * 0.42,
        zCloth,
      );
      tear.rotation.z = side * 0.35;
      tear.rotation.y = side * bannerYaw;
      group.add(tear);
    }
  }

  // Ambience Illustrator pack used as lighting/glass mood reference (not wall stickers)

  // --- Purity-seal ribbons on columns (denser) ---
  for (let i = 0; i < columnBases.length; i++) {
    const p = columnBases[i];
    const side = p.z >= 0 ? 1 : -1;
    const nRibbons = i % 3 === 0 ? 3 : 2;
    for (let r = 0; r < nRibbons; r++) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 1.35 + r * 0.3, 0.04),
        parchment,
      );
      strip.position.set(
        p.x + side * 0.12 + (r - 1) * 0.22,
        2.9 + r * 1.55,
        p.z + side * 1.18,
      );
      strip.rotation.z = side * (0.06 + r * 0.035);
      group.add(strip);

      const wax = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 6), waxRed);
      wax.position.set(
        p.x + side * 0.12 + (r - 1) * 0.22,
        3.55 + r * 1.55,
        p.z + side * 1.22,
      );
      group.add(wax);
    }

    // Hanging seal chain from mid shaft (shallow, on outer face)
    if (i % 2 === 0) {
      for (let h = 0; h < 4; h++) {
        const link = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.55, 0.035),
          parchment,
        );
        link.position.set(
          p.x - side * 0.05,
          6.2 - h * 0.62,
          p.z + side * 1.25,
        );
        link.rotation.z = side * (0.04 + h * 0.02);
        group.add(link);
        const blob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 5), waxRed);
        blob.position.set(
          p.x - side * 0.05,
          6.45 - h * 0.62,
          p.z + side * 1.28,
        );
        group.add(blob);
      }
    }

    // Mid-height Aquila / winged-skull relief on nave face of column
    const plaque = i % 2 === 0 ? makeAquila(0.55) : makeWingedSkull(0.5);
    // Sit on shaft surface toward nave; shallow so floaters clear
    plaque.position.set(p.x, 7.4, p.z - side * 1.35);
    plaque.rotation.y = side > 0 ? Math.PI : 0;
    group.add(plaque);
  }

  // Wall seals between bays (every bay) + Illustrator purity-seal plaques
  {
    const sealTex = loadHeraldryTexture('puritySeal');
    const sealMat = new THREE.MeshStandardMaterial({
      map: sealTex,
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < bays; i++) {
      const x = -halfL + bay * (i + 1);
      for (const side of [-1, 1]) {
        const z = side * (halfW + aisle * 0.05);
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.8, 0.05), parchment);
        strip.position.set(x + 1.2, 4.5, z - side * 0.02);
        group.add(strip);
        const wax = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), waxRed);
        wax.position.set(x + 1.2, 5.35, z - side * 0.06);
        group.add(wax);
        if (i % 2 === 0) {
          const strip2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.4, 0.04), parchment);
          strip2.position.set(x - 1.1, 3.8, z - side * 0.02);
          group.add(strip2);
          const wax2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 5), waxRed);
          wax2.position.set(x - 1.1, 4.45, z - side * 0.06);
          group.add(wax2);
          // Purity-seal plaque over selected ribbons
          const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), sealMat);
          plaque.position.set(x - 1.1, 4.55, z - side * 0.12);
          plaque.rotation.y = side > 0 ? Math.PI : 0;
          group.add(plaque);
        }
      }
    }
  }

  // Large Aquila wall plaques between bays (on nave-facing wall face)
  for (let i = 0; i < bays - 1; i++) {
    if (i % 2 !== 0) continue;
    const x = -halfL + bay * (i + 1.5);
    for (const side of [-1, 1]) {
      const z = side * (halfW + aisle * 0.05) - side * 0.25;
      const wallEagle = makeAquila(1.15);
      wallEagle.position.set(x, 9.5, z);
      wallEagle.rotation.y = side > 0 ? Math.PI : 0;
      group.add(wallEagle);
    }
  }

  // --- Skull niches in walls ---
  for (let i = 0; i < 5; i++) {
    const x = -halfL + 22 + i * ((length - 48) / 4);
    for (const side of [-1, 1]) {
      const z = side * (halfW + aisle * 0.05);
      const recess = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.6, 0.7),
        stoneDark,
      );
      recess.position.set(x, 3.4, z);
      group.add(recess);

      addSkull(group, x, 3.15, z - side * 0.15, 0.55);
    }
  }

  // Stacked skull piles near a few columns
  for (let i = 0; i < 4; i++) {
    const p = columnBases[i * 3 + 1];
    if (!p) continue;
    const side = p.z >= 0 ? 1 : -1;
    const ox = p.x + 1.6;
    const oz = p.z + side * 0.9;
    addSkull(group, ox, 0.45, oz, 0.5);
    addSkull(group, ox + 0.45, 0.4, oz + side * 0.35, 0.42);
    addSkull(group, ox + 0.2, 0.95, oz + side * 0.1, 0.48);
  }

  // --- Sarcophagus tombs along side aisles ---
  const tombXs = [-halfL + 30, -halfL + 55, halfL - 55, halfL - 32];
  for (let i = 0; i < tombXs.length; i++) {
    const x = tombXs[i];
    const side = i % 2 === 0 ? -1 : 1;
    const z = side * (halfW * 0.95);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.4, 2.4), stoneWarm);
    slab.position.set(x, 0.7, z);
    slab.castShadow = true;
    slab.receiveShadow = true;
    group.add(slab);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.35, 2.55), stone);
    lid.position.set(x, 1.55, z);
    lid.castShadow = true;
    group.add(lid);

    // Shallow Aquila lid relief
    const lidEagle = makeAquila(0.48);
    lidEagle.rotation.x = -Math.PI / 2;
    lidEagle.position.set(x, 1.82, z + side * 0.02);
    group.add(lidEagle);
  }

  // --- Grok Bot icon floaters: each on its own closed patrol path ---
  const iconNames = [
    'alnair.png', 'eggbot.png', 'unity.png', 'illustrator.png', 'atlas.png',
    'outlook.png', 'spark.png', 'sentry.png', 'azure.png', 'apple.png',
    'maverick.png', 'secretary.png', 'editor.png', 'career.png', 'diligence.png', 'dice.png',
  ];
  for (let i = 0; i < iconNames.length; i++) {
    const mesh = makeBotFloater(`./assets/bots/icons/${iconNames[i]}`);
    const path = buildFloaterPath(i, iconNames.length, halfL, halfW, height, length);
    const t0 = (i * 0.137) % 1;
    path.getPointAt(t0, mesh.position);
    group.add(mesh);
    floaters.push({
      mesh,
      path,
      t: t0,
      speed: 0.028 + (i % 5) * 0.007 + (i % 3) * 0.002,
      phase: i * 1.35,
      amp: 0.12 + (i % 3) * 0.03,
      radius: 0.9 + (i % 4) * 0.08,
    });
  }

  // Cable snakes near altar
  const ax = halfL - 10;
  for (let c = 0; c < 4; c++) {
    const segs = 5;
    let px = ax - 2 + c * 0.7;
    let py = 0.15;
    let pz = -2.8 + c * 0.9;
    for (let s = 0; s < segs; s++) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.85, 5),
        cableMat,
      );
      px += 0.35 + (c % 2) * 0.1;
      py += s === 0 ? 0.05 : 0.12;
      pz += (c % 2 === 0 ? 0.25 : -0.2) * (s % 2 === 0 ? 1 : -0.5);
      seg.position.set(px, py, pz);
      seg.rotation.z = Math.PI / 2 + (s - 2) * 0.2;
      seg.rotation.y = c * 0.3;
      group.add(seg);
    }
  }

  // --- Munition / relic crates ---
  const crateSpots = [
    [-halfL + 14, -1, halfW * 0.85],
    [-halfL + 16.2, -1, halfW * 0.85],
    [-halfL + 15, 0.9, halfW * 0.85],
    [halfL - 38, -1, -halfW * 0.9],
    [halfL - 35.5, -1, -halfW * 0.9],
    [halfL - 36.5, 0.85, -halfW * 0.88],
    [-20, -1, halfW * 1.05],
    [-17.5, -1, halfW * 1.05],
    [40, -1, -halfW * 1.05],
  ];
  for (let i = 0; i < crateSpots.length; i++) {
    const [cx, cyOff, cz] = crateSpots[i];
    const sx = 1.4 + (i % 3) * 0.2;
    const sy = 0.9 + (i % 2) * 0.15;
    const sz = 1.1 + (i % 2) * 0.2;
    const crate = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), crateWood);
    crate.position.set(cx, sy * 0.5 + (cyOff > 0 ? 0.95 : 0), cz);
    crate.rotation.y = (i % 5) * 0.15;
    crate.castShadow = true;
    crate.receiveShadow = true;
    group.add(crate);

    // Metal band
    const band = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.04, 0.12, sz + 0.04), metal);
    band.position.copy(crate.position);
    band.position.y += 0.05;
    band.rotation.y = crate.rotation.y;
    group.add(band);
  }

  // --- Extra hanging chains + censers (Illustrator emblem discs) ---
  {
    const censerTex = loadHeraldryTexture('censer');
    const censerDiscMat = new THREE.MeshStandardMaterial({
      map: censerTex,
      color: 0xffffff,
      roughness: 0.42,
      metalness: 0.45,
      emissive: 0x301040,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
    });
    const censerXs = [-halfL + 42, -5, halfL - 48, halfL - 22];
    for (let i = 0; i < censerXs.length; i++) {
      const x = censerXs[i];
      const side = i % 2 === 0 ? -1 : 1;
      const z = side * (halfW * 0.28);
      const chainLen = 7 + (i % 3);
      const chain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, chainLen, 5),
        metal,
      );
      const topY = height * 0.72;
      chain.position.set(x, topY - chainLen * 0.5, z);
      group.add(chain);

      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), metal);
      orb.position.set(x, topY - chainLen - 0.35, z);
      group.add(orb);

      const vent = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.35, 0.5, 6),
        metal,
      );
      vent.position.set(x, topY - chainLen - 0.75, z);
      group.add(vent);

      // Emblem disc facing nave on the censer body
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), censerDiscMat);
      disc.position.set(x, topY - chainLen - 0.35, z);
      disc.rotation.y = side > 0 ? -0.35 : 0.35;
      group.add(disc);

      // Emissive ember inside censer (no PointLight)
      const ember = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 6, 6),
        flameMat,
      );
      ember.position.set(x, topY - chainLen - 0.4, z);
      group.add(ember);
    }
  }

  // Aquila behind Bastion on apse face (facing nave); Bastion stays on altar top
  {
    const apseEagle = makeAquila(2.4);
    apseEagle.position.set(halfL - 5.35, 11.2, 0);
    apseEagle.rotation.y = -Math.PI / 2;
    group.add(apseEagle);
    const plaqueBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 5.2, 4.2),
      aquilaDark,
    );
    plaqueBack.position.set(halfL - 5.15, 11.0, 0);
    group.add(plaqueBack);
  }

  // Processional floor medallion (Illustrator) — replaces tiny Aquila floor eagle
  {
    const medTex = loadHeraldryTexture('floorMedallion');
    const medMat = new THREE.MeshStandardMaterial({
      map: medTex,
      color: 0xffffff,
      roughness: 0.62,
      metalness: 0.18,
      side: THREE.DoubleSide,
    });
    const medR = 4.2;
    const med = new THREE.Mesh(new THREE.CircleGeometry(medR, 48), medMat);
    med.rotation.x = -Math.PI / 2;
    med.position.set(0, 0.09, 0);
    group.add(med);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(medR - 0.05, 0.07, 6, 36), aquilaGold);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 0.11, 0);
    group.add(rim);
  }

  // Processional runner down center aisle (avoid altar / Bastion feet)
  {
    const runTex = loadHeraldryTexture('floorRunner', { rotation: Math.PI / 2 });
    const runMat = new THREE.MeshStandardMaterial({
      map: runTex,
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    // Altar front face ~ halfL-14; Bastion on altar top — stop runner short of altar
    const runLen = 88;
    const runW = 2.85;
    const runX = -halfL + 18 + runLen * 0.5; // start near west, end before altar
    const runner = new THREE.Mesh(new THREE.PlaneGeometry(runLen, runW), runMat);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(runX, 0.07, 0);
    group.add(runner);
  }

  // Flat Illustrator wall reliefs on a couple pier / wall faces
  {
    const reliefTex = loadHeraldryTexture('wallRelief');
    const reliefMat = new THREE.MeshStandardMaterial({
      map: reliefTex,
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0.22,
      side: THREE.DoubleSide,
    });
    const spots = [
      [-halfL + bay * 2.5, 8.8, 1],
      [halfL - bay * 3.2, 9.2, -1],
    ];
    for (const [x, y, side] of spots) {
      const z = side * (halfW + aisle * 0.05) - side * 0.28;
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 0.12), aquilaDark);
      back.position.set(x, y, z + side * 0.06);
      group.add(back);
      const relief = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), reliefMat);
      relief.position.set(x, y, z);
      relief.rotation.y = side > 0 ? Math.PI : 0;
      group.add(relief);
    }
  }

  // Servo-arm brackets on side walls (folded, clear of walkways)
  const servoXs = [-halfL + 28, 8, halfL - 42];
  for (let i = 0; i < servoXs.length; i++) {
    const side = i === 1 ? 1 : -1;
    const z = side * (halfW + aisle * 0.05) - side * 0.2;
    const arm = makeServoBracket(1.15);
    arm.position.set(servoXs[i], 6.8, z);
    arm.rotation.y = side > 0 ? Math.PI : 0;
    group.add(arm);
  }

  // Void-ship crest plaques on apse end wall (replace invented cross-circle icons)
  {
    const crestTex = loadHeraldryTexture('shipCrest');
    const crestMat = new THREE.MeshStandardMaterial({
      map: crestTex,
      color: 0xffffff,
      roughness: 0.48,
      metalness: 0.35,
      emissive: 0x201028,
      emissiveIntensity: 0.25,
      side: THREE.DoubleSide,
    });
    for (const [sz, y, z] of [[2.6, 8.6, halfW * 0.55], [2.2, 7.9, -halfW * 0.58]]) {
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.14, sz * 1.05, sz * 1.05), aquilaDark);
      back.position.set(halfL - 5.2, y, z);
      group.add(back);
      const crest = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), crestMat);
      crest.position.set(halfL - 5.32, y, z);
      crest.rotation.y = -Math.PI / 2;
      group.add(crest);
    }
    // Extra nave wall crest mid-bay (complements Aquila plaques)
    const naveCrest = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), crestMat);
    naveCrest.position.set(-halfL + bay * 3.5, 10.2, halfW + aisle * 0.05 - 0.3);
    naveCrest.rotation.y = Math.PI;
    group.add(naveCrest);
    const naveCrest2 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), crestMat);
    naveCrest2.position.set(-halfL + bay * 5.5, 10.2, -(halfW + aisle * 0.05 - 0.3));
    naveCrest2.rotation.y = 0;
    group.add(naveCrest2);
  }

  // Small side-chapel oculus (mid-nave wall) — clear of twin apse roses + main glass
  {
    const ocTex = loadHeraldryTexture('oculus');
    const ocMat = new THREE.MeshStandardMaterial({
      map: ocTex,
      emissiveMap: ocTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.85,
      color: 0xffffff,
      roughness: 0.48,
      metalness: 0.06,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    const ocR = 1.65;
    const ocX = -halfL + bay * 4;
    const ocY = 14.5;
    const ocZ = halfW + aisle * 0.05 - 0.2;
    const socket = new THREE.Mesh(
      new THREE.CircleGeometry(ocR + 0.35, 28),
      stoneDark,
    );
    socket.position.set(ocX, ocY, ocZ + 0.08);
    socket.rotation.y = Math.PI;
    group.add(socket);
    const oculus = new THREE.Mesh(new THREE.CircleGeometry(ocR, 36), ocMat);
    oculus.position.set(ocX, ocY, ocZ);
    oculus.rotation.y = Math.PI;
    group.add(oculus);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(ocR + 0.18, 0.12, 6, 28), aquilaGold);
    ring.position.set(ocX, ocY, ocZ - 0.02);
    ring.rotation.y = Math.PI;
    group.add(ring);
  }
}

/** @param {THREE.Group} group */
function addSkull(group, x, y, z, scale) {
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55 * scale, 8, 6), bone);
  head.position.set(x, y + 0.35 * scale, z);
  head.scale.set(1, 0.95, 1.15);
  group.add(head);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.7 * scale, 0.28 * scale, 0.55 * scale), bone);
  jaw.position.set(x, y + 0.02 * scale, z + 0.12 * scale);
  group.add(jaw);

  const socketL = new THREE.Mesh(new THREE.SphereGeometry(0.12 * scale, 5, 5), stoneDark);
  socketL.position.set(x - 0.18 * scale, y + 0.4 * scale, z + 0.42 * scale);
  group.add(socketL);
  const socketR = new THREE.Mesh(new THREE.SphereGeometry(0.12 * scale, 5, 5), stoneDark);
  socketR.position.set(x + 0.18 * scale, y + 0.4 * scale, z + 0.42 * scale);
  group.add(socketR);
}

/**
 * Column shafts as cylinders (match buildCathedral bay layout).
 * @returns {{ x: number, z: number, r: number, yMin: number, yMax: number }[]}
 */
function getColumnObstacles() {
  const { length, width, height, bays } = Spec;
  const halfL = length / 2;
  const halfW = width / 2;
  const bay = length / (bays + 1);
  const out = [];
  for (let i = 0; i < bays; i++) {
    const x = -halfL + bay * (i + 1);
    for (const side of [-1, 1]) {
      out.push({
        x,
        z: side * (halfW * 0.72),
        r: 1.85,
        yMin: 0,
        yMax: height * 0.72,
      });
    }
  }
  return out;
}

/**
 * Wall AABB + open-air envelope for floaters (inner nave volume).
 * @returns {{ xMin: number, xMax: number, yMin: number, yMax: number, zMin: number, zMax: number }}
 */
function getWallAABB() {
  const { length, width, height, aisle } = Spec;
  const halfL = length / 2;
  const halfW = width / 2;
  // Stay inside walls / facade / apse — leave margin from stone
  return {
    xMin: -halfL + 10,
    xMax: halfL - 18,
    yMin: 3.6,
    yMax: height * 0.55,
    zMin: -(halfW + aisle * 0.15) + 2.4,
    zMax: (halfW + aisle * 0.15) - 2.4,
  };
}

/**
 * Shared solid obstacles for floater clearance (columns + chandeliers + banners + walls).
 * Banner poles/cloth from getBannerLayout — must be excluded.
 * @returns {{ columns: any[], chandeliers: any[], banners: any[], walls: any }}
 */
function getBannerObstacles() {
  const { width } = Spec;
  const halfW = width / 2;
  const bannerXs = getSenpaiBannerXs();
  const { bannerPoleZ, bannerClothNudge } = getBannerLayout(halfW);
  const banners = [];
  for (let i = 0; i < bannerXs.length; i++) {
    const x = bannerXs[i];
    for (const side of [-1, 1]) {
      const zPole = side * bannerPoleZ;
      const zCloth = zPole - side * bannerClothNudge;
      // Pole + hanging cloth (front-facing; X footprint ~cloth half-width)
      banners.push({
        x,
        z: (zPole + zCloth) * 0.5,
        r: 2.35,
        yMin: 2.5,
        yMax: 12.5,
      });
    }
  }
  return banners;
}

function getFloaterObstacles() {
  return {
    columns: getColumnObstacles(),
    chandeliers: getChandelierObstacles(),
    banners: getBannerObstacles(),
    walls: getWallAABB(),
  };
}

/**
 * If pos is inside a solid, push out into open air (columns = cylinders,
 * chandeliers = XZ exclusion spheres near hang band, walls = AABB clamp).
 * @param {THREE.Vector3} pos
 * @param {{ columns: any[], chandeliers: any[], banners?: any[], walls: any }} obs
 * @returns {THREE.Vector3}
 */
function resolveFloaterPos(pos, obs) {
  const w = obs.walls;
  pos.x = Math.max(w.xMin, Math.min(w.xMax, pos.x));
  pos.y = Math.max(w.yMin, Math.min(w.yMax, pos.y));
  pos.z = Math.max(w.zMin, Math.min(w.zMax, pos.z));

  for (let i = 0; i < obs.columns.length; i++) {
    const c = obs.columns[i];
    if (pos.y < c.yMin - 0.5 || pos.y > c.yMax + 0.5) continue;
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const d = Math.hypot(dx, dz);
    if (d < c.r) {
      if (d < 1e-4) {
        // Prefer side-aisle push toward nearest open corridor
        pos.z += (pos.z >= 0 ? 1 : -1) * c.r;
      } else {
        const s = c.r / d;
        pos.x = c.x + dx * s;
        pos.z = c.z + dz * s;
      }
    }
  }

  // Banner poles + cloth along walkway
  const banners = obs.banners || [];
  for (let i = 0; i < banners.length; i++) {
    const b = banners[i];
    if (pos.y < b.yMin || pos.y > b.yMax) continue;
    const dx = pos.x - b.x;
    const dz = pos.z - b.z;
    const d = Math.hypot(dx, dz);
    if (d < b.r) {
      if (d < 1e-4) {
        // Push toward nave center (away from wall-side banners)
        pos.z = b.z >= 0 ? b.z - b.r : b.z + b.r;
      } else {
        const s = b.r / d;
        pos.x = b.x + dx * s;
        pos.z = b.z + dz * s;
      }
    }
  }

  // Chandelier rings: sphere / XZ exclusion near hang height
  for (let i = 0; i < obs.chandeliers.length; i++) {
    const c = obs.chandeliers[i];
    const clearR = (c.clearR || 3.6) + 0.35;
    const dx = pos.x - c.x;
    const dy = pos.y - c.y;
    const dz = pos.z - c.z;
    const d3 = Math.hypot(dx, dy, dz);
    const dXZ = Math.hypot(dx, dz);
    // Soft band around hang Y — drop under or push sideways
    if (Math.abs(dy) < 7.5 && dXZ < clearR) {
      if (pos.y < c.y) {
        pos.y = Math.min(pos.y, c.y - 6.2);
      } else if (dXZ < 1e-4) {
        pos.z += clearR;
      } else {
        const s = clearR / dXZ;
        pos.x = c.x + dx * s;
        pos.z = c.z + dz * s;
      }
    } else if (d3 < clearR * 0.85) {
      if (d3 < 1e-4) {
        pos.y = c.y - 6.2;
      } else {
        const s = (clearR * 0.85) / d3;
        pos.x = c.x + dx * s;
        pos.y = c.y + dy * s;
        pos.z = c.z + dz * s;
      }
    }
  }

  // Re-clamp after pushes
  pos.x = Math.max(w.xMin, Math.min(w.xMax, pos.x));
  pos.y = Math.max(w.yMin, Math.min(w.yMax, pos.y));
  pos.z = Math.max(w.zMin, Math.min(w.zMax, pos.z));
  return pos;
}

/**
 * Closed CatmullRom patrol in OPEN AIR corridors only:
 * center aisle / left aisle / right aisle — clear pews, avoid chandelier rings + column shafts.
 * Prefer designing clear paths; resolveFloaterPos is a safety net.
 * @param {number} i
 * @param {number} count
 * @param {number} halfL
 * @param {number} halfW
 * @param {number} height
 * @param {number} length
 * @returns {THREE.CatmullRomCurve3}
 */
function buildFloaterPath(i, count, halfL, halfW, height, length) {
  const obs = getFloaterObstacles();
  const { clothAbsZ } = getBannerLayout(halfW);
  // Banners at |z|≈clothAbsZ. Corridors miss that band:
  // 0 = inner nave, 1 = outer between banners & columns, 2 = other inner
  const corridor = i % 3;
  const bannerZ = clothAbsZ;
  let aisleZ;
  if (corridor === 0) {
    aisleZ = (i % 2 === 0 ? 1 : -1) * (1.8 + (i % 4) * 0.25);
  } else if (corridor === 1) {
    // Outer walk — past banners toward columns, but inside column line (~halfW*0.72)
    aisleZ = (i % 2 === 0 ? 1 : -1) * (bannerZ + 2.4 + (i % 4) * 0.2);
  } else {
    aisleZ = (i % 2 === 0 ? -1 : 1) * (2.4 + (i % 3) * 0.3);
  }
  // Cap outer aisle so we don't enter column shafts
  const colZ = halfW * 0.72;
  if (Math.abs(aisleZ) > colZ - 2.4) {
    aisleZ = Math.sign(aisleZ) * (colZ - 2.4);
  }
  const bandY = [4.8, 6.4, 8.0, 9.6, 11.2];
  const y0 = bandY[i % bandY.length] + (i % 3) * 0.15;
  const xStart = -halfL + 12;
  const xEnd = halfL - 22;
  const span = xEnd - xStart;
  const phase = (i / count) * Math.PI * 2;
  const ampX = span * 0.4;
  const baseX = xStart + span * 0.5 + Math.sin(phase * 0.5) * (span * 0.1);
  const ampZ = corridor === 1 ? 0.35 : 0.45;
  const ampY = 0.35 + (i % 3) * 0.12;
  const pts = [];
  const knots = 12;
  const tmp = new THREE.Vector3();
  for (let k = 0; k < knots; k++) {
    const a = (k / knots) * Math.PI * 2 + phase;
    let x = baseX + Math.cos(a) * ampX;
    let y = y0 + Math.sin(a * 1.2 + phase) * ampY;
    let z = aisleZ + Math.sin(a * 1.05) * ampZ;
    // Keep clear of banner Z band (~bannerZ ± 2.2)
    if (Math.abs(Math.abs(z) - bannerZ) < 2.2) {
      if (Math.abs(z) < bannerZ) {
        z = Math.sign(z || aisleZ || 1) * (bannerZ - 2.35);
      } else {
        z = Math.sign(z || aisleZ || 1) * (bannerZ + 2.35);
      }
    }
    const chXs = [-50, -26, -2, 22, 46];
    for (let c = 0; c < chXs.length; c++) {
      if (Math.abs(x - chXs[c]) < 4.2 && Math.abs(z) < 3.8) {
        z = (z >= 0 ? 1 : -1) * Math.max(Math.abs(z), 4.0);
        y = Math.min(y, 13.0);
      }
    }
    tmp.set(x, y, z);
    resolveFloaterPos(tmp, obs);
    pts.push(tmp.clone());
  }
  return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.35);
}

/**
 * Billboard circular bot icon with thin metal ring + soft halo.
 * @param {string} iconPath
 */
function makeBotFloater(iconPath) {
  const g = new THREE.Group();
  const loader = new THREE.TextureLoader();
  const tex = loader.load(iconPath);
  tex.colorSpace = THREE.SRGBColorSpace;

  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 24),
    new THREE.MeshBasicMaterial({
      color: 0x88aacc,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  halo.position.z = -0.04;
  g.add(halo);

  const back = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 28),
    new THREE.MeshBasicMaterial({
      color: 0x1a1c22,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  back.position.z = -0.02;
  g.add(back);

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 28),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  g.add(disc);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.035, 8, 32), ringMetal);
  g.add(ring);

  g.scale.setScalar(1.12);
  return g;
}

/**
 * Large void-cathedral stained glass on the apse: Illustrator tall window
 * (void-ship heraldry / leadwork) in a stone recess + outer pointed-arch frame,
 * plus twin rose oculi flanking the upper apse (arch-tip clearance too tight for one high rose).
 * @param {THREE.Group} group
 * @param {object} ctx
 */
function addApseStainedGlass(group, ctx) {
  const { halfL, height, glassPanes } = ctx;
  const winW = 22;
  const winH = 30;
  const cx = halfL - 5.15;
  const cy = height * 0.5;
  const depth = 0.28;

  const glassTex = loadApseGlassTexture();
  const glassMat = new THREE.MeshStandardMaterial({
    map: glassTex,
    emissiveMap: glassTex,
    emissive: 0xffffff,
    emissiveIntensity: 1.15,
    color: 0xffffff,
    roughness: 0.45,
    metalness: 0.05,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
  });
  glassPanes.push(glassMat);

  // Dark recess so panes read as a window opening
  const recess = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, winH + 2.5, winW + 2.5),
    stoneDark,
  );
  recess.position.set(halfL - 3.2, cy, 0);
  group.add(recess);

  // Outer lead frame
  const frameT = 0.72;
  const outer = [
    [winW + frameT * 2, frameT, 0, cy + winH * 0.5 + frameT * 0.5],
    [winW + frameT * 2, frameT, 0, cy - winH * 0.5 - frameT * 0.5],
    [frameT, winH, -(winW * 0.5 + frameT * 0.5), cy],
    [frameT, winH, winW * 0.5 + frameT * 0.5, cy],
  ];
  for (const [zw, yh, z, y] of outer) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(depth + 0.15, yh, zw), leadMat);
    bar.position.set(cx, y, z);
    group.add(bar);
  }

  // Pointed arch tip (two diagonal lead bars)
  for (const side of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(depth + 0.1, 0.4, 10.2), leadMat);
    tip.position.set(cx, cy + winH * 0.5 + 2.2, side * 4.5);
    tip.rotation.x = side * 0.55;
    group.add(tip);
  }

  // Textured emissive glass plane facing the nave (-X); matches glow orientation
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(winW, winH),
    glassMat,
  );
  glass.position.set(cx, cy, 0);
  glass.rotation.y = Math.PI / 2;
  group.add(glass);

  // Soft wash sheet toward nave (tuned low so Illustrator art stays readable)
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(winW * 0.9, winH * 0.9),
    new THREE.MeshBasicMaterial({
      color: 0xc090ff,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  glow.position.set(cx - 0.4, cy, 0);
  glow.rotation.y = Math.PI / 2;
  group.add(glow);

  // Twin rose oculi: arch tip ~41.2 vs ridge ~42.2 is too tight for one large rose above.
  addApseRoseOculi(group, { glassPanes, cx, winW });
}

/**
 * Twin Illustrator rose oculi flanking the upper apse glass (CircleGeometry + lead ring).
 * Kept clear of Bastion/Aquila (~y3–11) and ceremonial look (~y12.5).
 * @param {THREE.Group} group
 * @param {object} ctx
 */
function addApseRoseOculi(group, ctx) {
  const { glassPanes, cx, winW } = ctx;
  const roseR = 2.4;
  const roseY = 34.6;
  // Outside tall-glass lead (~±11.7), on apse face (half-width ~17)
  const roseZ = winW * 0.5 + roseR + 1.05;
  const roseTex = loadApseRoseTexture();
  const roseMat = new THREE.MeshStandardMaterial({
    map: roseTex,
    emissiveMap: roseTex,
    emissive: 0xffffff,
    emissiveIntensity: 1.1,
    color: 0xffffff,
    roughness: 0.45,
    metalness: 0.05,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
  });
  glassPanes.push(roseMat);

  for (const side of [-1, 1]) {
    const z = side * roseZ;
    // Shallow stone socket behind the oculus
    const socket = new THREE.Mesh(
      new THREE.CircleGeometry(roseR + 0.55, 40),
      stoneDark,
    );
    socket.position.set(cx + 0.22, roseY, z);
    socket.rotation.y = Math.PI / 2;
    group.add(socket);

    const rose = new THREE.Mesh(new THREE.CircleGeometry(roseR, 48), roseMat);
    rose.position.set(cx, roseY, z);
    rose.rotation.y = Math.PI / 2;
    group.add(rose);

    // Lead/stone ring frame
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(roseR + 0.28, 0.2, 8, 40),
      leadMat,
    );
    ring.position.set(cx - 0.02, roseY, z);
    ring.rotation.y = Math.PI / 2;
    group.add(ring);

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(roseR * 0.92, 32),
      new THREE.MeshBasicMaterial({
        color: 0xc090ff,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    glow.position.set(cx - 0.35, roseY, z);
    glow.rotation.y = Math.PI / 2;
    group.add(glow);
  }
}

/**
 * Chandelier hang centers — same Spec formula as buildCathedral (5 rings on center nave).
 * Hang Y = height*0.42 (~20.16); ring radius ~2.1. Camera must stay under or clear of these.
 * @returns {{ x: number, y: number, z: number, clearR: number }[]}
 */
function getChandelierObstacles() {
  const { length, height } = Spec;
  const halfL = length / 2;
  const hangY = height * 0.42;
  const out = [];
  for (let i = 0; i < 5; i++) {
    const x = -halfL + 20 + i * ((length - 44) / 4);
    out.push({ x, y: hangY, z: 0, clearR: 3.6 });
  }
  return out;
}

/**
 * Five sequential camera rails — each a FULL nave-length traversal (~45–55s),
 * then wrap to 0. Distinct angle/personality per rail. Clearance: Y under
 * chandelier hang (Y <= ~13–14) near ring Xs, or Z-offset; end back from glass (~halfL-16).
 * Facing apse (+X): viewer-left = +Z, viewer-right = −Z.
 * Side rails stay on the NAVE side of banners (|z| < clothAbsZ) so Senpai art faces the camera.
 */
function buildRails() {
  const { length, width, height } = Spec;
  const halfL = length / 2;
  const halfW = width / 2;
  const { clothAbsZ } = getBannerLayout(halfW);
  // Frame stained glass AND Bastion on the raised altar platform
  const glassLook = new THREE.Vector3(halfL - 7.2, 12.5, 0);
  // Chandeliers at x ≈ -50, -26, -2, 22, 46 — keep Y under ~14 near those Xs (or Z offset)
  const x0 = -halfL + 8;
  const x1 = halfL - 16;
  const chXs = [-50, -26, -2, 22, 46];
  // Side tours: inside banner cloth (|z| less than clothAbsZ ~4.65), gentle amp
  const sideZ = Math.min(2.35, clothAbsZ - 1.9);
  const tension = 0.18;
  const nPts = 22;
  void height;
  void halfW;

  /**
   * Dense even CatmullRom samples along +X with a personality sampler.
   * @param {(u: number, x: number) => THREE.Vector3} sample
   * @returns {THREE.Vector3[]}
   */
  function makePts(sample) {
    const pts = [];
    for (let i = 0; i < nPts; i++) {
      const u = i / (nPts - 1);
      const x = THREE.MathUtils.lerp(x0, x1, u);
      pts.push(sample(u, x));
    }
    return pts;
  }

  /** Soft Y rise; stay under ring belt near chandelier Xs. */
  function yCruise(u, base, rise, nearRingCap) {
    const y = base + rise * u + Math.sin(u * Math.PI) * 0.28;
    return Math.min(y, nearRingCap);
  }

  function nearChandelier(x) {
    for (let i = 0; i < chXs.length; i++) {
      if (Math.abs(x - chXs[i]) < 5.5) return true;
    }
    return false;
  }

  return [
    // 0 — Center low forward toward glass (classic full traversal)
    {
      points: makePts((u, x) => {
        const z = Math.sin(u * Math.PI * 2.2) * 0.35;
        const y = yCruise(u, 6.2, 2.7, 13.2);
        return new THREE.Vector3(x, y, z);
      }),
      durationSec: 50,
      speed: 1.0,
      holdSec: 0,
      lookGlass: false,
      lookAcross: null,
    },
    // 1 — Viewer-left (+Z) INSIDE banners, glance across to art / nave
    {
      points: makePts((u, x) => {
        const z = sideZ + Math.sin(u * Math.PI * 1.8) * 0.22;
        const y = yCruise(u, 6.7, 2.5, 12.8);
        return new THREE.Vector3(x, y, Math.min(z, clothAbsZ - 1.15));
      }),
      durationSec: 48,
      speed: 1.0,
      holdSec: 0,
      lookGlass: false,
      // Pull look toward nave center / opposite side so nearby +Z cloth faces camera
      lookAcross: -0.6,
    },
    // 2 — Viewer-right (−Z) mirror, INSIDE banners
    {
      points: makePts((u, x) => {
        const z = -sideZ + Math.sin(u * Math.PI * 1.8) * 0.22;
        const y = yCruise(u, 6.7, 2.5, 12.8);
        return new THREE.Vector3(x, y, Math.max(z, -(clothAbsZ - 1.15)));
      }),
      durationSec: 48,
      speed: 1.0,
      holdSec: 0,
      lookGlass: false,
      lookAcross: 0.6,
    },
    // 3 — Elevated under-chandelier weave (Y≤13–14); stay nave-side of cloth
    {
      points: makePts((u, x) => {
        // Gentler weave; near rings drift toward clearR without crossing cloth
        const nearRing = nearChandelier(x);
        const weave = Math.sin(u * Math.PI * 3.0) * (nearRing ? 2.55 : 1.7);
        let z = weave;
        const zMax = clothAbsZ - 1.0;
        z = Math.max(-zMax, Math.min(zMax, z));
        // Prefer |z|≈3.65 near rings when elevated (outside clearR≈3.6 if possible)
        if (nearRing && Math.abs(z) < 3.55) {
          z = Math.sign(z || 1) * 3.65;
          z = Math.max(-zMax, Math.min(zMax, z));
        }
        const y = Math.min(12.2 + u * 1.2 + Math.sin(u * Math.PI) * 0.35, 13.35);
        return new THREE.Vector3(x, y, z);
      }),
      durationSec: 52,
      speed: 1.0,
      holdSec: 0,
      lookGlass: false,
      lookAcross: 0,
      lookDown: 0.42,
    },
    // 4 — Slow ceremonial approach to glass + hold framing glass AND Bastion
    {
      points: makePts((u, x) => {
        const z = Math.sin(u * Math.PI * 1.6) * 0.45;
        let y = 7.0 + u * 5.4 + Math.sin(u * Math.PI) * 0.25;
        // Rise after last ring (~46); stay under belt until then
        if (x < 48) y = Math.min(y, 12.6);
        else y = Math.min(y, 12.9);
        // Slight side ease past last chandelier clearR while climbing
        let zz = z;
        if (x > 44 && x < 52) zz = THREE.MathUtils.lerp(z, 2.6, (x - 44) / 8);
        if (x >= 52) zz = THREE.MathUtils.lerp(2.6, 0, Math.min(1, (x - 52) / 6));
        return new THREE.Vector3(x, y, zz);
      }),
      durationSec: 55,
      speed: 0.92,
      holdSec: 5.8,
      lookGlass: true,
      lookAcross: null,
    },
  ].map((r) => ({
    ...r,
    glassLook,
    curve: new THREE.CatmullRomCurve3(r.points, false, 'catmullrom', tension),
  }));
}

/**
 * AABB + chandelier clearance. Prefer Y under hang rings; if near hang height,
 * push XZ away from each chandelier center to clearR (~3.6).
 */
function clampCameraPos(pos, halfL, halfW, chandeliers) {
  // Soft ceiling while still under the nave ring belt; glass rail may go higher past last ring
  const lastChX = chandeliers.length ? chandeliers[chandeliers.length - 1].x : 46;
  const underBelt = pos.x < lastChX + 6;
  const yMax = underBelt ? 14.0 : Spec.height * 0.48;
  pos.y = Math.max(5.5, Math.min(yMax, pos.y));
  pos.z = Math.max(-halfW * 0.55, Math.min(halfW * 0.55, pos.z));
  pos.x = Math.max(-halfL + 8, Math.min(halfL - 14, pos.x));

  const hangBand = 6.5; // if Y within this of hangY, enforce XZ clearance
  for (let i = 0; i < chandeliers.length; i++) {
    const c = chandeliers[i];
    if (pos.y < c.y - hangBand) continue; // safely under — no XZ push needed
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const d = Math.hypot(dx, dz);
    if (d < c.clearR) {
      if (d < 1e-4) {
        // Degenerate: nudge to side of nave
        pos.z = (pos.z >= 0 ? 1 : -1) * c.clearR;
      } else {
        const s = c.clearR / d;
        pos.x = c.x + dx * s;
        pos.z = c.z + dz * s;
      }
      // Prefer dropping under the ring rather than clipping through it
      if (pos.y > c.y - 5.5) {
        pos.y = Math.min(pos.y, c.y - 5.5);
      }
    }
  }
  // Re-clamp envelope after push
  pos.z = Math.max(-halfW * 0.55, Math.min(halfW * 0.55, pos.z));
  pos.x = Math.max(-halfL + 8, Math.min(halfL - 14, pos.x));
  return pos;
}

/**
 * Procedural full-body power-armored cathedral marine (Bastion / Three).
 * Stands on the raised altar/apse platform ("diocese") near the stained glass,
 * facing the nave (-X) so the ceremonial glass rail frames marine + glass.
 * @returns {{ group: THREE.Group, head: THREE.Object3D, update: (dt: number, t: number, cam: THREE.Camera) => void }}
 */
function makeCathedralMarine(halfL) {
  const gunmetal = new THREE.MeshStandardMaterial({
    color: 0x2a2e36,
    roughness: 0.55,
    metalness: 0.72,
  });
  const gunmetalDark = new THREE.MeshStandardMaterial({
    color: 0x1a1c22,
    roughness: 0.62,
    metalness: 0.78,
  });
  const visor = new THREE.MeshStandardMaterial({
    color: 0x40e8f8,
    emissive: 0x28c8e0,
    emissiveIntensity: 1.9,
    roughness: 0.25,
    metalness: 0.4,
  });
  const capeMat = new THREE.MeshStandardMaterial({
    color: 0x4a1820,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const root = new THREE.Group();
  // Raised altar top: altar mesh at (halfL-10, 1.6, 0), height 3.2 → top Y = 3.2
  const baseX = halfL - 10;
  const baseY = 3.2;
  const baseZ = 0;
  root.position.set(baseX, baseY, baseZ);
  // Model faces +Z by default; yaw -π/2 → face nave (-X)
  const faceYaw = -Math.PI / 2;

  // Small plinth on altar top (not mid-nave dais)
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.5, 0.4, 10), gunmetalDark);
  dais.position.y = 0.2;
  dais.castShadow = true;
  dais.receiveShadow = true;
  root.add(dais);
  const daisRim = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.6, 0.1, 10), gunmetal);
  daisRim.position.y = 0.42;
  root.add(daisRim);

  const body = new THREE.Group();
  body.position.y = 0.45;
  root.add(body);

  function part(geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    body.add(m);
    return m;
  }

  // Boots
  part(new THREE.BoxGeometry(0.42, 0.38, 0.55), gunmetalDark, -0.28, 0.22, 0.06);
  part(new THREE.BoxGeometry(0.42, 0.38, 0.55), gunmetalDark, 0.28, 0.22, 0.06);
  // Greaves
  part(new THREE.CylinderGeometry(0.2, 0.24, 0.85, 8), gunmetal, -0.28, 0.85, 0);
  part(new THREE.CylinderGeometry(0.2, 0.24, 0.85, 8), gunmetal, 0.28, 0.85, 0);
  // Thigh plates
  part(new THREE.BoxGeometry(0.48, 0.7, 0.5), gunmetalDark, -0.28, 1.55, 0);
  part(new THREE.BoxGeometry(0.48, 0.7, 0.5), gunmetalDark, 0.28, 1.55, 0);
  // Torso
  const torso = part(new THREE.BoxGeometry(1.15, 1.35, 0.7), gunmetal, 0, 2.55, 0);
  part(new THREE.BoxGeometry(0.95, 0.35, 0.78), gunmetalDark, 0, 3.15, 0.05); // chest ridge
  // Pauldrons
  part(new THREE.BoxGeometry(0.55, 0.4, 0.55), gunmetalDark, -0.78, 3.15, 0, 1, 1, 1);
  part(new THREE.BoxGeometry(0.55, 0.4, 0.55), gunmetalDark, 0.78, 3.15, 0, 1, 1, 1);
  // Arms
  part(new THREE.CylinderGeometry(0.16, 0.18, 0.9, 7), gunmetal, -0.95, 2.45, 0.05);
  part(new THREE.CylinderGeometry(0.16, 0.18, 0.9, 7), gunmetal, 0.95, 2.45, 0.05);
  part(new THREE.BoxGeometry(0.32, 0.35, 0.35), gunmetalDark, -0.95, 1.9, 0.1);
  part(new THREE.BoxGeometry(0.32, 0.35, 0.35), gunmetalDark, 0.95, 1.9, 0.1);

  // Helmet + cyan visor slit
  const head = new THREE.Group();
  head.position.set(0, 3.55, 0);
  body.add(head);
  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.55, 0.68), gunmetalDark);
  helm.castShadow = true;
  head.add(helm);
  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.5), gunmetal);
  crest.position.set(0, 0.35, -0.05);
  head.add(crest);
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.12), visor);
  slit.position.set(0, 0.05, 0.32);
  head.add(slit);

  // Cape plane
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.2), capeMat);
  cape.position.set(0, 2.4, -0.45);
  cape.rotation.x = 0.12;
  body.add(cape);

  // Tiny holographic cathedral trinket in right hand (wireframe boxes)
  const holo = new THREE.Group();
  holo.position.set(0.95, 1.85, 0.35);
  body.add(holo);
  const holoMat = new THREE.MeshBasicMaterial({
    color: 0x48e0f0,
    wireframe: true,
    transparent: true,
    opacity: 0.75,
  });
  const naveBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.22), holoMat);
  holo.add(naveBox);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.1), holoMat);
  tower.position.set(0, 0.32, 0);
  holo.add(tower);
  const spire = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.05), holoMat);
  spire.position.set(0, 0.5, 0);
  holo.add(spire);

  // Tiny idle patrol — stay on altar platform top (altar ~8 x 5)
  const patrol = {
    centerX: baseX,
    centerY: baseY,
    centerZ: baseZ,
    radius: 0.45,
    angle: 0,
    speed: 0.18,
  };
  const breathBase = body.scale.clone();
  let lookTimer = 0;
  let lookingAtCam = false;

  function update(dt, t, cam) {
    // Breathing
    const breath = 1 + Math.sin(t * 1.4) * 0.012;
    body.scale.set(breathBase.x, breathBase.y * breath, breathBase.z);

    // Slow micro-patrol on platform top
    patrol.angle += dt * patrol.speed;
    root.position.x = patrol.centerX + Math.cos(patrol.angle) * patrol.radius;
    root.position.y = patrol.centerY;
    root.position.z = patrol.centerZ + Math.sin(patrol.angle) * patrol.radius * 0.4;
    // Face nave (-X) with slight idle sway
    root.rotation.y = faceYaw + Math.sin(patrol.angle * 0.5) * 0.12;

    // Occasional head turn toward camera
    lookTimer -= dt;
    if (lookTimer <= 0) {
      lookingAtCam = !lookingAtCam;
      lookTimer = lookingAtCam ? 2.4 + Math.random() * 1.2 : 3.5 + Math.random() * 2.5;
    }
    if (lookingAtCam && cam) {
      const hx = cam.position.x - root.position.x;
      const hz = cam.position.z - root.position.z;
      const targetYaw = Math.atan2(hx, hz) - root.rotation.y;
      head.rotation.y += (Math.max(-0.55, Math.min(0.55, targetYaw)) - head.rotation.y) * Math.min(1, dt * 2.2);
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.08, dt * 1.5);
    } else {
      head.rotation.y += (0 - head.rotation.y) * Math.min(1, dt * 1.4);
      head.rotation.x += (0 - head.rotation.x) * Math.min(1, dt * 1.4);
    }

    // Soft holo pulse
    holo.rotation.y = t * 0.8;
    const pulse = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.2));
    holoMat.opacity = pulse;
  }

  void torso;

  return { group: root, head, update };
}
function main() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x100818);
  scene.fog = new THREE.FogExp2(0x1c1028, 0.0042);

  const camera = new THREE.PerspectiveCamera(
    58,
    window.innerWidth / window.innerHeight,
    0.3,
    420,
  );

  const { lights, flames, banners, floaters, glassPanes, shafts, dust } = buildCathedral(scene);
  const rails = buildRails();
  let railIndex = 0;
  let t = 0;
  let holding = false;
  let holdTimer = 0;

  const halfL = Spec.length / 2;
  const halfW = Spec.width / 2;
  const chandeliers = getChandelierObstacles();
  const floaterObs = getFloaterObstacles();
  const marine = makeCathedralMarine(halfL);
  scene.add(marine.group);

  const lookOffset = { yaw: 0, pitch: 0 };
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const canvas = renderer.domElement;

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointerup', (e) => {
    dragging = false;
    canvas.releasePointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    lookOffset.yaw -= (e.clientX - lastX) * 0.004;
    lookOffset.pitch = Math.max(-1.1, Math.min(1.1, lookOffset.pitch - (e.clientY - lastY) * 0.003));
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  });

  const lookTarget = new THREE.Vector3();
  const railPos = new THREE.Vector3();
  const floaterPos = new THREE.Vector3();
  const pushTmp = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const clock = new THREE.Clock();
  let frame = 0;

  for (const l of lights) l.userData.base = l.intensity;

  const smoothFwd = new THREE.Vector3(1, 0, 0);
  const desiredFwd = new THREE.Vector3(1, 0, 0);
  const lookScratch = new THREE.Vector3();
  let lookEase = 1; // 0 just after rail change → 1 settled

  function advanceRail() {
    holding = false;
    holdTimer = 0;
    t = 0;
    railIndex = (railIndex + 1) % rails.length;
    lookEase = 0; // soften orientation snap between rails
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    frame++;
    const elapsed = clock.elapsedTime;
    const rail = rails[railIndex];

    // Multi-rail sequence: finish rail → optional hold → next; wrap last → 0
    if (holding) {
      holdTimer += dt;
      if (holdTimer >= (rail.holdSec || 0)) {
        advanceRail();
      }
    } else {
      t += (dt * rail.speed) / rail.durationSec;
      if (t >= 1) {
        t = 1;
        if ((rail.holdSec || 0) > 0) {
          holding = true;
          holdTimer = 0;
        } else {
          advanceRail();
        }
      }
    }

    const tRail = Math.min(Math.max(t, 0), 0.999);
    rail.curve.getPointAt(tRail, railPos);
    clampCameraPos(railPos, halfL, halfW, chandeliers);

    // Longer look-ahead → steadier orientation, less twitch
    const ahead = Math.min(tRail + 0.075, 0.999);
    rail.curve.getPointAt(ahead, lookTarget);
    // Side rails: gentle pull toward nave / across so banners read front-on
    if (rail.lookAcross != null) {
      lookTarget.z = THREE.MathUtils.lerp(lookTarget.z, rail.lookAcross, 0.4);
    }
    if (rail.lookDown) {
      lookTarget.y -= rail.lookDown * 3.8;
    }
    // Glass rail: ease look to glass + Bastion (no hard snap)
    if (rail.lookGlass) {
      const endBias = holding
        ? 1
        : THREE.MathUtils.smoothstep(tRail, 0.4, 0.92);
      if (endBias > 0) {
        lookTarget.lerp(rail.glassLook, endBias * 0.88);
      }
    }

    desiredFwd.copy(lookTarget).sub(railPos);
    if (desiredFwd.lengthSq() < 1e-6) desiredFwd.set(1, 0, 0);
    else desiredFwd.normalize();

    lookEase = Math.min(1, lookEase + dt * 0.65);
    const follow = 0.1 + 0.22 * lookEase;
    smoothFwd.lerp(desiredFwd, follow);
    if (smoothFwd.lengthSq() < 1e-6) smoothFwd.set(1, 0, 0);
    else smoothFwd.normalize();

    const forward = smoothFwd;
    lookScratch.crossVectors(forward, up);
    if (lookScratch.lengthSq() < 1e-6) lookScratch.set(0, 0, 1);
    else lookScratch.normalize();
    const right = lookScratch;
    const trueUp = new THREE.Vector3().crossVectors(right, forward).normalize();
    const qYaw = new THREE.Quaternion().setFromAxisAngle(trueUp, lookOffset.yaw);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(right, lookOffset.pitch);
    const dir = forward.clone().applyQuaternion(qYaw).applyQuaternion(qPitch);

    camera.position.copy(railPos);
    lookTarget.copy(railPos).add(dir);
    camera.lookAt(lookTarget);

    if (frame % 2 === 0) {
      for (let i = 0; i < lights.length; i++) {
        if (lights[i].userData.steady) continue;
        lights[i].intensity = lights[i].userData.base * (0.94 + 0.06 * Math.sin(elapsed * 4.2 + i));
      }
      for (let i = 0; i < flames.length; i++) {
        flames[i].scale.y = 1.15 + 0.12 * Math.sin(elapsed * 6 + i);
      }
      for (let i = 0; i < banners.length; i++) {
        const b = banners[i];
        const ph = b.userData.swayPhase || i;
        b.rotation.y = b.userData.baseYaw || 0;
        b.rotation.z = (b.userData.swaySide || 1) * 0.04 + Math.sin(elapsed * 1.1 + ph) * 0.045;
        b.rotation.x = Math.sin(elapsed * 0.85 + ph * 0.7) * 0.03;
      }
      // Stained glass stays steady (no emissive pulse)
      // Subtle shaft opacity pulse
      for (let i = 0; i < shafts.length; i++) {
        const s = shafts[i];
        const base = s.userData.baseOpacity ?? 0.07;
        const ph = s.userData.pulsePhase ?? i;
        s.material.opacity = base * (0.82 + 0.18 * Math.sin(elapsed * 0.55 + ph));
      }
    }

    // Dust motes drift slowly in mid-nave / shaft volumes
    {
      const pos = dust.points.geometry.attributes.position;
      const vel = dust.velocities;
      const b = dust.points.userData.bounds;
      for (let i = 0; i < pos.count; i++) {
        const ix = i * 3;
        let x = pos.array[ix] + vel[ix] * dt;
        let y = pos.array[ix + 1] + vel[ix + 1] * dt;
        let z = pos.array[ix + 2] + vel[ix + 2] * dt;
        if (y > b.yMax) y = b.yMin;
        if (x > b.halfL || x < -b.halfL) {
          vel[ix] *= -1;
          x = Math.max(-b.halfL, Math.min(b.halfL, x));
        }
        if (z > b.halfW || z < -b.halfW) {
          vel[ix + 2] *= -1;
          z = Math.max(-b.halfW, Math.min(b.halfW, z));
        }
        pos.array[ix] = x;
        pos.array[ix + 1] = y;
        pos.array[ix + 2] = z;
      }
      pos.needsUpdate = true;
    }

    // Bot patrols: open-air paths + solid resolve + soft XZ separation
    {
      for (let i = 0; i < floaters.length; i++) {
        const s = floaters[i];
        s.t = (s.t + dt * s.speed) % 1;
        s.path.getPointAt(s.t, floaterPos);
        floaterPos.y += Math.sin(elapsed * 1.05 + s.phase) * s.amp;
        // If still inside a solid, push out or advance t until clear
        resolveFloaterPos(floaterPos, floaterObs);
        let guard = 0;
        while (guard < 6) {
          const before = floaterPos.clone();
          resolveFloaterPos(floaterPos, floaterObs);
          const moved = before.distanceTo(floaterPos);
          if (moved < 0.05) break;
          s.t = (s.t + 0.008) % 1;
          s.path.getPointAt(s.t, floaterPos);
          floaterPos.y += Math.sin(elapsed * 1.05 + s.phase) * s.amp;
          resolveFloaterPos(floaterPos, floaterObs);
          guard++;
        }
        s.mesh.position.copy(floaterPos);
      }
      // Pairwise push-apart on XZ (and slight curve skip if still close)
      for (let i = 0; i < floaters.length; i++) {
        for (let j = i + 1; j < floaters.length; j++) {
          const a = floaters[i];
          const b = floaters[j];
          const minD = (a.radius || 1) + (b.radius || 1);
          pushTmp.subVectors(a.mesh.position, b.mesh.position);
          pushTmp.y = 0;
          const d = pushTmp.length();
          if (d < minD && d > 1e-4) {
            const push = (minD - d) * 0.5;
            pushTmp.multiplyScalar(push / d);
            a.mesh.position.x += pushTmp.x;
            a.mesh.position.z += pushTmp.z;
            b.mesh.position.x -= pushTmp.x;
            b.mesh.position.z -= pushTmp.z;
            resolveFloaterPos(a.mesh.position, floaterObs);
            resolveFloaterPos(b.mesh.position, floaterObs);
            if (d < minD * 0.65) {
              a.t = (a.t + 0.004) % 1;
              b.t = (b.t + 0.002) % 1;
            }
          } else if (d <= 1e-4) {
            a.t = (a.t + 0.01) % 1;
          }
        }
        floaters[i].mesh.lookAt(camera.position);
      }
    }

    marine.update(dt, elapsed, camera);

    // Avoid unused glassPanes lint — kept for future emissive hooks
    void glassPanes;

    renderer.render(scene, camera);
  }

  animate();
}

main();
