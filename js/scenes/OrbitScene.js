import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from '../config.js';

export function createOrbitScene(renderer, moonTexture, moonNormalMap) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 8000);
  camera.position.z = 50;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxDistance = 600;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(100, 100, 150);
  scene.add(sun);

  // Planet
  const moonTex = moonTexture.clone();
  moonTex.repeat.set(4, 2);

  let moonNorm = null;
  if (moonNormalMap) {
    moonNorm = moonNormalMap.clone();
    moonNorm.repeat.set(4, 2);
  }

  const arcRadius = 8;
  const tubeRadius = 3.5;
  const arcAngle = Math.PI * 1.75;

  const baseGeometry = new THREE.CylinderGeometry(tubeRadius, tubeRadius, arcRadius * arcAngle, 64, 128, false);
  const pos = baseGeometry.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const angle = (v.y / (arcRadius * arcAngle)) * arcAngle - arcAngle / 2;
    const radius = arcRadius + v.x;
    pos.setXYZ(i, Math.cos(angle) * radius, Math.sin(angle) * radius, v.z);
  }
  baseGeometry.computeVertexNormals();

  const planet = new THREE.Mesh(
    baseGeometry,
    new THREE.MeshStandardMaterial({
      map: moonTex,
      normalMap: moonNorm,
      roughness: 0.8,
    })
  );
  planet.rotation.z = Math.PI / 2;
  scene.add(planet);

  // Stars
  const starVerts = [];
  for (let i = 0; i < 20000; i++) {
    const v = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2)
    );
    v.normalize().multiplyScalar(4000);
    starVerts.push(v.x, v.y, v.z);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 2, transparent: true, opacity: 0.8 })
  );
  scene.add(stars);

  return { scene, camera, controls, planet, stars };
}
console.log('OrbitScene loaded v2');
