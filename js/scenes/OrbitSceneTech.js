import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Procedural Tech Texture Generator (Darker & Sharper) ---
function createPlanetTechTexture() {
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

  // Background (Deep Dark Void)
  ctxD.fillStyle = '#050510';
  ctxD.fillRect(0, 0, width, height);

  ctxR.fillStyle = '#222'; // Glossy
  ctxR.fillRect(0, 0, width, height);

  ctxM.fillStyle = '#333'; // Dark Metal
  ctxM.fillRect(0, 0, width, height);

  ctxE.fillStyle = '#000'; // No emission by default
  ctxE.fillRect(0, 0, width, height);

  // function to draw glowing line
  const drawLine = (x, y, w, h, color, isBright) => {
    ctxD.fillStyle = '#111'; ctxD.fillRect(x, y, w, h);
    ctxR.fillStyle = '#000'; ctxR.fillRect(x, y, w, h);
    ctxM.fillStyle = '#fff'; ctxM.fillRect(x, y, w, h);
    if (isBright) {
      ctxE.fillStyle = color;
      ctxE.fillRect(x, y, w, h);
    }
  };

  const numLines = 600;

  for (let i = 0; i < numLines; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const len = Math.random() * 100 + 20;
    const thick = Math.random() * 4 + 2;
    const horizontal = Math.random() > 0.5;
    const colors = ['#0088ff', '#00ffaa', '#8800ff'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const isLit = Math.random() > 0.8;

    if (horizontal) {
      drawLine(x, y, len, thick, color, isLit);
    } else {
      drawLine(x, y, thick, len, color, isLit);
    }
  }

  // Nodes
  for (let i = 0; i < 30; i++) {
    const w = 40 + Math.random() * 60;
    const h = 40 + Math.random() * 60;
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctxD.fillStyle = '#050505'; ctxD.fillRect(x, y, w, h);
    ctxM.fillStyle = '#aaa'; ctxM.fillRect(x, y, w, h);
    ctxR.fillStyle = '#101'; ctxR.fillRect(x, y, w, h);
    ctxE.strokeStyle = '#00aaaa';
    ctxE.lineWidth = 2;
    ctxE.strokeRect(x, y, w, h);
  }

  return {
    map: new THREE.CanvasTexture(canvasDiffuse),
    roughnessMap: new THREE.CanvasTexture(canvasRoughness),
    metalnessMap: new THREE.CanvasTexture(canvasMetalness),
    emissiveMap: new THREE.CanvasTexture(canvasEmissive)
  };
}

// --- Main Scene Creator ---
export function createOrbitScene(renderer, moonTexture, moonNormalMap, planetShips = []) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 8000);
  camera.position.z = 140;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.zoomSpeed = 4.0;
  controls.maxDistance = 600;

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(100, 100, 150);
  scene.add(sun);

  // Generate High Tech Texture
  const techTex = createPlanetTechTexture();
  [techTex.map, techTex.roughnessMap, techTex.metalnessMap, techTex.emissiveMap].forEach(t => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(10, 5);
  });

  // Geometry
  const arcRadius = 12;
  const tubeRadius = 4.5;
  const arcAngle = Math.PI * 1.8;

  const baseGeometry = new THREE.CylinderGeometry(tubeRadius, tubeRadius, arcRadius * arcAngle, 128, 128, false);
  const pos = baseGeometry.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const angle = (v.y / (arcRadius * arcAngle)) * arcAngle - arcAngle / 2;
    const radius = arcRadius + v.x;
    pos.setXYZ(i, Math.cos(angle) * radius, Math.sin(angle) * radius, v.z);
  }
  baseGeometry.computeVertexNormals();

  // Material: Darker Base, controlled Emissive
  const material = new THREE.MeshStandardMaterial({
    map: techTex.map,
    roughnessMap: techTex.roughnessMap,
    metalnessMap: techTex.metalnessMap,
    emissiveMap: techTex.emissiveMap,
    emissive: 0xffffff,
    emissiveIntensity: 1.0,
    roughness: 0.4,
    metalness: 0.8,
    color: 0x222222
  });

  // Hook into Shader to animate texture
  // Hook into Shader to animate texture
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    planet.userData.shaderUniforms = shader.uniforms;
    shader.fragmentShader = `uniform float uTime;` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `
        #include <emissivemap_fragment>
        float flow = sin(vMapUv.x * 30.0 + uTime * 3.0) + sin(vMapUv.y * 30.0 - uTime * 2.0);
        float pulse = smoothstep(0.5, 0.6, flow) - smoothstep(0.6, 0.7, flow);
        vec3 pulseColor = vec3(0.0, 1.0, 1.0) * pulse * 2.0;
        totalEmissiveRadiance += pulseColor; 
        `
    );
  };

  const planet = new THREE.Mesh(baseGeometry, material);
  planet.rotation.z = Math.PI / 2;
  scene.add(planet);

  // Simple fallback to ensure uniforms exist for update loop
  planet.userData.shaderUniforms = { uTime: { value: 0 } };

  planet.userData.update = (time) => {
    if (planet.userData.shaderUniforms) {
      planet.userData.shaderUniforms.uTime.value = time;
    }
  };

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

  // --- Flyby System ---
  const flybyManager = {
    time: 0,
    ships: planetShips,
    activeShips: [],
    spawned: [false, false, false],
    nextSpawn: 0.5,

    update: function (delta) {
      if (!delta) delta = 0.016;
      this.time += delta;

      // Spawner Logic
      if (this.time > this.nextSpawn) {
        this.spawnRandomShip();
        this.nextSpawn = this.time + 3 + Math.random() * 5;
      }

      // Move Active Ships
      for (let i = this.activeShips.length - 1; i >= 0; i--) {
        const item = this.activeShips[i];
        item.life += delta * item.speed;

        if (item.life > 1.0) {
          scene.remove(item.mesh);
          this.activeShips.splice(i, 1);
        } else {
          item.mesh.position.lerpVectors(item.start, item.end, item.life);
          item.mesh.lookAt(item.end);
          if (item.rollSpeed) item.mesh.rotation.z += delta * item.rollSpeed;
          item.mesh.position.y += Math.sin(this.time * 2.0) * 0.1;
        }
      }
    },

    spawnRandomShip: function () {
      const validShips = this.ships.filter(s => s !== null);
      if (validShips.length === 0) return;

      // 1. Pick Random Ship (Template is Normalized Group from main.js)
      const shipTemplate = validShips[Math.floor(Math.random() * validShips.length)];

      // Clone the wrapper. This clone HAS the normalization scale (e.g. 0.01) from main.js.
      const mesh = shipTemplate.clone();

      // --- FIX: USE ANCHOR TO PRESERVE NORMALIZATION ---
      // We wrap the normalized mesh in an 'anchor' to apply scene-level scaling.
      // If we scaled 'mesh' directly, we would lost the normalization factor.

      // ROTATION FIX: Rotate internal mesh to face forward (if sideways)
      // Assuming 'Native' model faces +Z, but lookAt points +Z.
      // If user says "sideways", it might need 90 deg rotation.
      mesh.rotation.y = Math.PI / 2; // Try 90 degrees correction

      const anchor = new THREE.Group();
      anchor.add(mesh);

      // 2. Apply Scene Scale to Anchor (2.0 to 4.0)
      const s = 2.0 + Math.random() * 2.0;
      anchor.scale.set(s, s, s);

      // ... (keep middle lines same) ...

      // 4. Randomize Speed (Adjusted: 0.05 to 0.10)
      const speed = 0.05 + Math.random() * 0.05;

      // We track the ANCHOR now
      this.activeShips.push({ mesh: anchor, start, end, life: 0, speed, rollSpeed: 0 });
      console.log("Spawned Anchored Ship:", edge, zDepth);
    },
  };

  // Combine Updates (Shader + Physics)
  const shaderUpdate = planet.userData.update;
  planet.userData.update = (time, delta) => {
    // SLOW DOWN PULSE (time * 0.2)
    if (shaderUpdate) shaderUpdate(time * 0.2);
    flybyManager.update(delta);
    // SLOW DOWN STARS
    if (stars.rotation) stars.rotation.y += (delta || 0.01) * 0.01;
  };

  return { scene, camera, controls, planet, stars };
}
console.log('OrbitSceneTech DARK_PULSE loaded!');
