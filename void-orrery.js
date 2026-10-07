import * as THREE from './vendor/three.module.js';

/**
 * An open celestial reliquary suspended in front of the apse glass.
 * All surfaces are real geometry/shaders: no image downloads, lights or bloom pass.
 * The complete animated envelope fits inside a 3.5-unit radius around `center`.
 */
export function createVoidOrrery(center) {
  const group = new THREE.Group();
  group.name = 'Void Orrery';
  group.position.copy(center);

  const brass = new THREE.MeshStandardMaterial({
    color: 0xc6a46b, metalness: 0.72, roughness: 0.34,
    emissive: 0x7c491a, emissiveIntensity: 0.32,
  });
  const gold = new THREE.MeshBasicMaterial({
    color: 0xffd99b, transparent: true, opacity: 0.72,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const cyan = new THREE.MeshBasicMaterial({
    color: 0x8edfff, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });

  // A sparse, translucent shell. A face-on view retains the glass behind it;
  // the bright curved limb and latitude/longitude contours establish volume.
  const shellMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    toneMapped: false,
    vertexShader: `
      varying vec3 vSphere;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vSphere = normalize(position);
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = -viewPosition.xyz;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vSphere;
      varying vec3 vNormal;
      varying vec3 vView;

      // Derivative-smoothed lines stay quiet during the moving camera rails.
      float contour(float phase) {
        float wave = sin(phase);
        return 1.0 - smoothstep(0.015, 0.015 + max(fwidth(wave), 0.025), abs(wave));
      }
      void main() {
        vec3 p = normalize(vSphere);
        float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.0);
        float latitude = asin(clamp(p.y, -1.0, 1.0));
        float longitude = atan(p.z, p.x);
        float grid = max(contour(latitude * 9.0),
          contour(longitude * 12.0) * (1.0 - smoothstep(0.88, 0.99, abs(p.y))));
        float folds = sin(p.x * 5.0 + sin(p.z * 4.0) + uTime * 0.09);
        float bandPhase = p.y * 19.0 + folds * 1.8 + sin(p.z * 7.0) * 0.6;
        float bands = pow(0.5 + 0.5 * sin(bandPhase), 5.0);
        float sweep = pow(0.5 + 0.5 * sin(latitude * 3.0 - uTime * 0.28), 12.0);
        vec3 violet = vec3(0.27, 0.12, 0.56);
        vec3 ice = vec3(0.47, 0.86, 1.0);
        vec3 color = mix(violet, ice, clamp(rim + grid * 0.7 + sweep * 0.25, 0.0, 1.0));
        color += vec3(0.28, 0.13, 0.35) * bands;
        float alpha = clamp(0.055 + rim * 0.68 + grid * 0.25 + bands * 0.16, 0.0, 0.88);
        gl_FragColor = vec4(color, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(2.22, 64, 40), shellMaterial);
  globe.name = 'Translucent celestial shell';
  globe.rotation.z = 0.22;
  group.add(globe);

  // Nested gimbals, primarily facing the nave (-X). Their tilt shows depth
  // from the side rails without filling the silhouette with a solid plaque.
  const rings = [];
  function addOrbit(radius, tiltY, tiltZ, speed, material) {
    const pivot = new THREE.Group();
    pivot.rotation.set(0, tiltY, tiltZ);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.026, 6, 128), material);
    ring.rotation.y = Math.PI / 2;
    pivot.add(ring);
    group.add(pivot);
    rings.push({ pivot, tiltY, tiltZ, speed });
    return pivot;
  }
  addOrbit(2.70, 0.28, 0.42, 0.055, brass);
  addOrbit(3.02, -0.55, -0.44, -0.038, brass);
  const outerOrbit = addOrbit(3.32, 0.14, 0.12, 0.022, gold);
  addOrbit(2.45, 1.14, 0.64, -0.065, cyan);

  // One instanced mesh for all the fine radial calibration marks.
  const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.018, 0.10, 0.022), brass, 72);
  const transform = new THREE.Object3D();
  for (let i = 0; i < 72; i++) {
    const angle = i / 72 * Math.PI * 2;
    transform.position.set(0, Math.cos(angle) * 3.32, Math.sin(angle) * 3.32);
    transform.rotation.set(angle, 0, 0);
    transform.scale.set(1, i % 6 === 0 ? 2.2 : 1, 1);
    transform.updateMatrix();
    marks.setMatrixAt(i, transform.matrix);
  }
  marks.instanceMatrix.needsUpdate = true;
  outerOrbit.add(marks);

  // Thin crescent arcs imply a projection field, without a wireframe triangle cage.
  const arcs = new THREE.Group();
  arcs.rotation.set(0.3, 0.4, -0.2);
  for (let i = 0; i < 3; i++) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(2.32, 0.012, 4, 72, Math.PI * 1.25), cyan);
    arc.rotation.set(i * 0.72, Math.PI / 2 + i * 0.45, i * 2.1);
    arcs.add(arc);
  }
  group.add(arcs);

  // Deterministic points on an inner sphere: a faint star atlas inside the shell.
  const positions = new Float32Array(144 * 3);
  const colors = new Float32Array(144 * 3);
  for (let i = 0; i < 144; i++) {
    const y = 1 - 2 * (i + 0.5) / 144;
    const theta = i * Math.PI * (3 - Math.sqrt(5));
    const radius = 1.90 * Math.sqrt(1 - y * y);
    positions.set([Math.cos(theta) * radius, y * 1.90, Math.sin(theta) * radius], i * 3);
    colors.set(i % 7 === 0 ? [1, 0.76, 0.42] : [0.45, 0.75, 1], i * 3);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
    size: 0.038, vertexColors: true, transparent: true, opacity: 0.52,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }));
  group.add(stars);

  // A single satellite travels in the plane of the middle gimbal.
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), gold);
  rings[1].pivot.add(moon);

  function update(elapsed, reducedMotion = false) {
    const t = reducedMotion ? 0 : elapsed;
    shellMaterial.uniforms.uTime.value = t;
    globe.rotation.y = t * 0.075;
    stars.rotation.y = -t * 0.025;
    arcs.rotation.x = 0.3 + t * 0.035;
    for (const ring of rings) {
      ring.pivot.rotation.y = ring.tiltY + Math.sin(t * ring.speed) * 0.32;
      ring.pivot.rotation.z = ring.tiltZ + Math.sin(t * ring.speed * 0.7) * 0.12;
    }
    moon.position.set(0, Math.cos(t * 0.16) * 3.02, Math.sin(t * 0.16) * 3.02);
  }

  function dispose() {
    const geometries = new Set();
    const materials = new Set();
    group.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
      if (object.isInstancedMesh) object.dispose();
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    group.removeFromParent();
  }

  update(0);
  return { group, update, dispose };
}
