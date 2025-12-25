import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from '../config.js';

// --- Local Texture Generator (Matches SurfaceScene) ---
function createPlanetTexture() {
  const width = 1024;
  const height = 1024;

  const canvasDiffuse = document.createElement('canvas');
  const canvasRoughness = document.createElement('canvas');
  const canvasMetalness = document.createElement('canvas');
  const canvasEmissive = document.createElement('canvas');

  [canvasDiffuse, canvasRoughness, canvasMetalness, canvasEmissive].forEach(c => { c.width = width; c.height = height; });

  const ctxD = canvasDiffuse.getContext('2d');
  const ctxR = canvasRoughness.getContext('2d');
  const ctxM = canvasMetalness.getContext('2d');
  const ctxE = canvasEmissive.getContext('2d');

  // Background
  ctxD.fillStyle = '#050505'; ctxD.fillRect(0, 0, width, height);
  ctxR.fillStyle = '#222'; ctxR.fillRect(0, 0, width, height);
  ctxM.fillStyle = '#111'; ctxM.fillRect(0, 0, width, height);
  ctxE.fillStyle = '#000'; ctxE.fillRect(0, 0, width, height);

  // Circuit Lines
  ctxE.strokeStyle = '#00ffaa'; // Cyan/Green Glow
  ctxD.strokeStyle = '#004444';
  ctxM.strokeStyle = '#aaaaaa';
  ctxR.strokeStyle = '#000';

  const numLines = 400;
  for (let i = 0; i < numLines; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const len = Math.random() * 200;
    const horizontal = Math.random() > 0.5;

    ctxD.beginPath(); ctxM.beginPath(); ctxE.beginPath(); ctxR.beginPath();

    if (horizontal) {
      ctxD.rect(x, y, len, 4); ctxM.rect(x, y, len, 4); ctxR.rect(x, y, len, 4);
      if (Math.random() > 0.8) ctxE.rect(x, y, len, 4);
    } else {
      ctxD.rect(x, y, 4, len); ctxM.rect(x, y, 4, len); ctxR.rect(x, y, 4, len);
      if (Math.random() > 0.8) ctxE.rect(x, y, 4, len);
    }

    ctxD.fillStyle = '#222'; ctxD.fill();
    ctxM.fillStyle = '#888'; ctxM.fill();
    ctxR.fillStyle = '#000'; ctxR.fill();
    ctxE.fillStyle = '#00ffaa'; ctxE.fill();
  }

  // Chips
  for (let i = 0; i < 50; i++) {
    const w = 32 + Math.random() * 64;
    const h = 32 + Math.random() * 64;
    const x = Math.random() * width;
    const y = Math.random() * height;

    ctxD.fillStyle = '#111'; ctxD.fillRect(x, y, w, h);
    ctxM.fillStyle = '#fff'; ctxM.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctxR.fillStyle = '#000'; ctxR.fillRect(x + 2, y + 2, w - 4, h - 4);

    if (Math.random() > 0.7) {
      ctxE.fillStyle = '#ff00ff'; // Magenta Lights
      ctxE.fillRect(x + w / 2 - 4, y + h / 2 - 4, 8, 8);
    }
  }

  return {
    map: new THREE.CanvasTexture(canvasDiffuse),
    roughnessMap: new THREE.CanvasTexture(canvasRoughness),
    metalnessMap: new THREE.CanvasTexture(canvasMetalness),
    emissiveMap: new THREE.CanvasTexture(canvasEmissive)
  };
}

export function createOrbitScene(renderer) {
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

  // Planet Texture
  console.log('OrbitScene: Generating procedural planet texture...');
  const pTex = createPlanetTexture();
  [pTex.map, pTex.roughnessMap, pTex.metalnessMap, pTex.emissiveMap].forEach(t => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(20, 10); // Scale for planet
  });

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
      map: pTex.map,
      roughnessMap: pTex.roughnessMap,
      metalnessMap: pTex.metalnessMap,
      emissiveMap: pTex.emissiveMap,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.9,
      color: 0xff0000, // DEBUG RED
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
console.log('OrbitScene loaded v4_DEBUG_RED');
