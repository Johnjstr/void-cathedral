import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { createHolographicRelics } from '../holographic-relics.js';

test('wall projections remain shallow and compact while animated', () => {
  const kit = createHolographicRelics();
  const seals = [0, 1, 2].map((variant) => kit.seal(1, variant));
  for (let t = 0; t <= 600; t += 3) {
    kit.update(t);
    for (const seal of seals) {
      const bounds = new THREE.Box3().setFromObject(seal, true);
      assert.ok(bounds.min.z >= -0.025, 'projection must not penetrate its wall');
      assert.ok(bounds.max.z < 0.5, 'projection must remain shallow');
      assert.ok(bounds.min.x > -1.15 && bounds.max.x < 1.15);
      assert.ok(bounds.min.y > -1.15 && bounds.max.y < 1.15);
    }
  }
  kit.dispose();
});

test('relics and guardian remain inside their assigned envelopes', () => {
  const kit = createHolographicRelics();
  const relics = [kit.relic(1, 0), kit.relic(1, 1)];
  const guardian = kit.sentinel(70);
  for (let t = 0; t <= 600; t += 3) {
    kit.update(t);
    guardian.update(0.05, t, null);
    for (const relic of relics) {
      const b = new THREE.Box3().setFromObject(relic, true);
      for (const axis of ['x', 'y', 'z']) assert.ok(b.min[axis] > -0.9 && b.max[axis] < 0.9);
    }
    const b = new THREE.Box3().setFromObject(guardian.group, true);
    assert.ok(b.min.x > 58.5 && b.max.x < 61.5, 'altar footprint X');
    assert.ok(b.min.z > -1.5 && b.max.z < 1.5, 'altar footprint Z');
    assert.ok(b.min.y >= 3.19 && b.max.y < 8.0, 'clear of altar surface and Orrery');
  }
  kit.dispose();
});

test('decoration uses shared resources, adds no boxes/lights, and honors reduced motion', () => {
  const kit = createHolographicRelics();
  const roots = Array.from({ length: 30 }, (_, i) => kit.seal(0.55, i % 3));
  roots.push(kit.relic(), kit.sentinel(70).group);
  const geometries = new Set();
  const materials = new Set();
  for (const root of roots) root.traverse((o) => {
    assert.ok(!o.isLight);
    if (o.geometry) {
      assert.notEqual(o.geometry.type, 'BoxGeometry');
      assert.ok(o.geometry.getAttribute('position').array.every(Number.isFinite));
      geometries.add(o.geometry);
    }
    if (o.material) {
      materials.add(o.material);
      if (o.material.transparent) assert.equal(o.material.depthWrite, false);
    }
  });
  assert.ok(geometries.size <= 8);
  assert.ok(materials.size <= 5);
  const snapshot = () => roots.flatMap((root) => {
    root.updateMatrixWorld(true);
    const values = [];
    root.traverse((o) => values.push(...o.matrixWorld.elements));
    return values;
  });
  kit.update(0, true); const still = snapshot();
  kit.update(200, true); assert.deepEqual(snapshot(), still);
  kit.update(200, false); assert.notDeepEqual(snapshot(), still);
  const resources = [...geometries, ...materials];
  const counts = resources.map(() => 0);
  resources.forEach((r, i) => r.addEventListener('dispose', () => counts[i]++));
  kit.dispose();
  assert.ok(counts.every((n) => n === 1), 'shared resources dispose exactly once');
});
