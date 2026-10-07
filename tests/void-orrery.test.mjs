import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from '../vendor/three.module.js';
import { createVoidOrrery } from '../void-orrery.js';

test('animated sculpture clears the glass, camera envelope and altar figure', () => {
  const orrery = createVoidOrrery(new THREE.Vector3(60.8, 12.5, 0));
  const box = new THREE.Box3();
  const vertex = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  for (let seconds = 0; seconds <= 600; seconds += 2) {
    orrery.update(seconds);
    orrery.group.updateMatrixWorld(true);
    // Box3's instanced-mesh path rotates the aggregate box, overestimating
    // thin circular rings. Check actual transformed vertices per instance.
    box.makeEmpty();
    orrery.group.traverse((object) => {
      if (!object.geometry) return;
      const positions = object.geometry.getAttribute('position');
      const count = object.isInstancedMesh ? object.count : 1;
      for (let instance = 0; instance < count; instance++) {
        if (object.isInstancedMesh) {
          object.getMatrixAt(instance, matrix);
          matrix.premultiply(object.matrixWorld);
        } else matrix.copy(object.matrixWorld);
        for (let i = 0; i < positions.count; i++) {
          vertex.fromBufferAttribute(positions, i).applyMatrix4(matrix);
          box.expandByPoint(vertex);
        }
      }
    });
    assert.ok(box.max.x < 64.45, `glass clearance at ${seconds}s`);
    assert.ok(box.min.x > 56, `camera clearance at ${seconds}s`);
    assert.ok(box.min.y > 8.0, `Bastion clearance at ${seconds}s`);
    assert.ok(box.max.y < 16.1);
    assert.ok(box.min.z > -3.5 && box.max.z < 3.5);
  }
  orrery.dispose();
});

test('geometry is finite, bounded in cost and adds no lights or textures', () => {
  const orrery = createVoidOrrery(new THREE.Vector3());
  let draws = 0;
  let triangles = 0;
  orrery.group.traverse((object) => {
    assert.ok(!object.isLight);
    if (object.geometry) {
      draws++;
      const positions = object.geometry.getAttribute('position').array;
      assert.ok(positions.every(Number.isFinite));
      if (object.isMesh) triangles += object.geometry.index.count / 3 * (object.count ?? 1);
    }
    if (object.material) {
      assert.ok(!object.material.map);
      if (object.material.transparent) assert.equal(object.material.depthWrite, false);
    }
  });
  assert.ok(draws <= 12, `${draws} draw objects`);
  assert.ok(triangles < 18000, `${triangles} triangles`);
  orrery.dispose();
});

test('reduced motion freezes the new sculpture and shared resources dispose once', () => {
  const orrery = createVoidOrrery(new THREE.Vector3());
  const snapshot = () => {
    orrery.group.updateMatrixWorld(true);
    const transforms = [];
    orrery.group.traverse((object) => transforms.push(...object.matrixWorld.elements));
    return transforms;
  };
  orrery.update(0, true);
  const still = snapshot();
  orrery.update(300, true);
  assert.deepEqual(snapshot(), still);
  orrery.update(300, false);
  assert.notDeepEqual(snapshot(), still);

  const resources = new Set();
  orrery.group.traverse((object) => {
    if (object.geometry) resources.add(object.geometry);
    if (object.material) resources.add(object.material);
  });
  const counts = new Map();
  for (const resource of resources) {
    counts.set(resource, 0);
    resource.addEventListener('dispose', () => counts.set(resource, counts.get(resource) + 1));
  }
  const scene = new THREE.Scene();
  scene.add(orrery.group);
  orrery.dispose();
  assert.equal(orrery.group.parent, null);
  for (const count of counts.values()) assert.equal(count, 1);
});
