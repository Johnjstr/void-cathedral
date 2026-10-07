import * as THREE from './vendor/three.module.js';

/** Shared projection materials/geometry for the cathedral's decorative objects. */
export function createHolographicRelics() {
  const roots = [];
  const motion = [];
  const time = { value: 0 };
  const shell = new THREE.ShaderMaterial({
    uniforms: { uTime: time }, transparent: true, depthWrite: false,
    toneMapped: false,
    vertexShader: `
      varying vec3 vNormal; varying vec3 vView; varying vec3 vLocal;
      void main() {
        vLocal = position;
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal); vView = -p.xyz;
        gl_Position = projectionMatrix * p;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormal; varying vec3 vView; varying vec3 vLocal;
      void main() {
        float edge = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.2);
        float wave = sin(vLocal.y * 42.0 - uTime * 0.6);
        float scan = 1.0 - smoothstep(0.025, 0.025 + max(fwidth(wave), 0.04), abs(wave));
        vec3 color = mix(vec3(0.28, 0.14, 0.63), vec3(0.51, 0.86, 1.0), edge);
        color += scan * vec3(0.06, 0.16, 0.19);
        gl_FragColor = vec4(color, 0.11 + edge * 0.50 + scan * 0.15);
        #include <colorspace_fragment>
      }
    `,
  });
  const light = (color, opacity) => new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, blending: THREE.AdditiveBlending,
    depthWrite: false, toneMapped: false,
  });
  const cyan = light(0x8bdfff, 0.65);
  const gold = light(0xffd093, 0.65);
  const violet = light(0xb193ff, 0.40);
  const geometries = {
    sphere: new THREE.SphereGeometry(1, 24, 16),
    crystal: new THREE.OctahedronGeometry(1, 0),
    ring: new THREE.TorusGeometry(1, 0.014, 4, 64),
    arc: new THREE.TorusGeometry(1, 0.012, 4, 48, Math.PI * 1.42),
    limb: new THREE.CapsuleGeometry(0.16, 0.65, 5, 12),
    pedestal: new THREE.CylinderGeometry(1.25, 1.4, 0.24, 48),
    torso: new THREE.LatheGeometry([
      new THREE.Vector2(0.36, 0), new THREE.Vector2(0.48, 0.15),
      new THREE.Vector2(0.44, 0.45), new THREE.Vector2(0.58, 0.85),
      new THREE.Vector2(0.53, 1.1), new THREE.Vector2(0.20, 1.23),
    ], 32),
  };
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x20172c, metalness: 0.7, roughness: 0.4,
    emissive: 0x482968, emissiveIntensity: 0.22,
  });
  function mesh(parent, geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
    const m = new THREE.Mesh(geometries[geometry], material);
    m.position.set(...position); m.scale.set(...scale); parent.add(m);
    return m;
  }
  function root(name, scale) {
    const g = new THREE.Group(); g.name = name; g.scale.setScalar(scale);
    roots.push(g); return g;
  }

  /** Shallow +Z-facing celestial emblem: fits wall/column relief clearances. */
  function seal(scale = 1, variant = 0) {
    const g = root(['Astral seal', 'Lunar seal', 'Prismatic seal'][variant % 3], scale);
    const outer = mesh(g, 'ring', gold, [0, 0, 0.12], [1.05, 1.05, 0.5]);
    const inner = mesh(g, 'arc', cyan, [0, 0, 0.16], [0.81, 0.81, 0.45]);
    inner.rotation.z = variant * 1.8;
    const core = mesh(g, variant === 2 ? 'crystal' : 'sphere', shell,
      [0, 0, 0.20], variant === 2 ? [0.42, 0.7, 0.20] : [0.54, 0.54, 0.22]);
    const sweep = mesh(g, 'ring', violet, [0, 0, 0.24], [0.69, 0.24, 0.20]);
    sweep.rotation.z = 0.45 + variant * 0.7;
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3 + variant;
      mesh(g, 'sphere', cyan, [Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0.14], [0.045, 0.045, 0.045]);
    }
    // Only rotate within the relief plane; never swing the glyph into the wall.
    motion.push((t) => { inner.rotation.z = variant * 1.8 + t * 0.10; outer.rotation.z = -t * 0.025; });
    return g;
  }

  /** Compact floating crystal/orb, bounded by radius 0.9 * scale. */
  function relic(scale = 1, variant = 0) {
    const g = root(variant % 2 ? 'Luminous memory orb' : 'Suspended crystal', scale);
    const core = mesh(g, variant % 2 ? 'sphere' : 'crystal', shell, [0, 0, 0],
      variant % 2 ? [0.46, 0.46, 0.46] : [0.33, 0.73, 0.33]);
    const orbit = mesh(g, 'ring', variant % 2 ? cyan : gold, [0, 0, 0], [0.77, 0.77, 0.77]);
    orbit.rotation.set(0.9, 0.35, 0.25);
    const arc = mesh(g, 'arc', violet, [0, 0, 0], [0.62, 0.62, 0.62]);
    arc.rotation.set(-0.3, 1.0, 0);
    mesh(g, 'sphere', cyan, [0, 0, 0], [0.09, 0.09, 0.09]);
    motion.push((t) => {
      core.rotation.y = t * 0.22 + variant;
      orbit.rotation.z = t * 0.07 + variant;
      arc.rotation.z = -t * 0.11;
    });
    return g;
  }

  /** Smooth, translucent Bastion projection, within the original altar footprint. */
  function sentinel(halfL) {
    const g = root('Bastion — spectral guardian', 1);
    g.position.set(halfL - 10, 3.2, 0); g.rotation.y = -Math.PI / 2;
    mesh(g, 'pedestal', pedestalMat, [0, 0.12, 0]);
    const baseRing = mesh(g, 'ring', gold, [0, 0.255, 0], [1.26, 1.26, 1.26]);
    baseRing.rotation.x = -Math.PI / 2;
    const body = new THREE.Group(); body.position.y = 0.45; g.add(body);
    for (const side of [-1, 1]) {
      mesh(body, 'sphere', shell, [side * 0.27, 0.12, 0.12], [0.23, 0.15, 0.38]);
      mesh(body, 'limb', shell, [side * 0.27, 0.67, 0], [1.2, 1.0, 1.2]);
      mesh(body, 'limb', shell, [side * 0.27, 1.47, 0], [1.4, 0.85, 1.4]);
      mesh(body, 'sphere', shell, [side * 0.73, 2.83, 0], [0.37, 0.30, 0.37]);
      const arm = mesh(body, 'limb', shell, [side * 0.86, 2.26, 0], [1.0, 1.1, 1.0]);
      arm.rotation.z = side * 0.14;
      mesh(body, 'sphere', cyan, [side * 0.94, 1.75, 0.06], [0.13, 0.15, 0.13]);
    }
    mesh(body, 'torso', shell, [0, 1.8, 0]);
    const head = new THREE.Group(); head.position.y = 3.32; body.add(head);
    mesh(head, 'sphere', shell, [0, 0, 0], [0.32, 0.4, 0.33]);
    const visor = mesh(head, 'arc', cyan, [0, 0.015, 0.06], [0.32, 0.32, 0.32]);
    visor.rotation.set(Math.PI / 2, 0, 0.3);
    const halo = mesh(body, 'ring', gold, [0, 3.35, -0.16], [0.57, 0.57, 0.57]);
    const chest = seal(0.24, 2); chest.position.set(0, 2.52, 0.48); body.add(chest);
    const held = relic(0.30, 1); held.position.set(0.95, 2.02, 0.25); body.add(held);
    const footHalo = mesh(g, 'arc', cyan, [0, 0.34, 0], [1.06, 1.06, 1.06]);
    footHalo.rotation.x = -Math.PI / 2;
    function update(dt, elapsed, camera, reducedMotion = false) {
      const t = reducedMotion ? 0 : elapsed;
      body.position.y = 0.45 + Math.sin(t * 0.7) * 0.035;
      head.rotation.y = Math.sin(t * 0.20) * 0.18;
      halo.rotation.z = t * 0.06;
      footHalo.rotation.z = -t * 0.08;
    }
    return { group: g, head, update };
  }

  function update(elapsed, reducedMotion = false) {
    const t = reducedMotion ? 0 : elapsed;
    time.value = t;
    for (const animate of motion) animate(t);
  }
  function dispose() {
    roots.forEach((g) => g.removeFromParent());
    Object.values(geometries).forEach((geometry) => geometry.dispose());
    [shell, cyan, gold, violet, pedestalMat].forEach((material) => material.dispose());
    roots.length = 0; motion.length = 0;
  }
  return { seal, relic, sentinel, update, dispose };
}
