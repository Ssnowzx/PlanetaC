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
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    planet.userData.shaderUniforms = shader.uniforms;
    shader.fragmentShader = `uniform float uTime;\n` + shader.fragmentShader;
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
    shipIndex: 0, // Sequential Index

    update: function (delta) {
      if (!delta) delta = 0.016;
      this.time += delta;

      // 1. STRICT CHECK: If any ship is active, DO NOT spawn another.
      if (this.activeShips.length > 0) {
        // Just update the active ship(s)
        // (Loop logic below handles movement)
      } else {
        // Only if NO ships are active, check timer
        if (this.time > this.nextSpawn) {
          this.spawnNextShip();
          // Set delay for NEXT spawn after this one finishes
          // Actual delay is handled when ship dies, this is just a safety fallback
          this.nextSpawn = this.time + 999; // Lock spawner until ship dies
        }
      }

      // Move Active Ships
      for (let i = this.activeShips.length - 1; i >= 0; i--) {
        const item = this.activeShips[i];
        item.life += delta * item.speed;

        if (item.life > 1.0) {
          scene.remove(item.mesh);
          this.activeShips.splice(i, 1);
          // Ship Finished! Set timer for next sequential spawn
          // Short interval: 2 to 4 seconds
          this.nextSpawn = this.time + 2.0 + Math.random() * 2.0;
        } else {
          item.mesh.position.lerpVectors(item.start, item.end, item.life);
          item.mesh.lookAt(item.end);

          if (item.speed < 0.03) {
            // Roll only for slower/majestic ships
            item.mesh.rotation.z += delta * 0.1;
          }

          // Gentle Floating (Y-axis only)
          item.mesh.position.y += Math.sin(this.time * 1.5) * 0.2;
        }
      }
    },

    spawnNextShip: function () {
      const validShips = this.ships.filter(s => s !== null);
      if (validShips.length === 0) return;

      // 1. Pick Next Ship in Sequence
      const shipTemplate = validShips[this.shipIndex % validShips.length];
      this.shipIndex++;

      // Clone
      const mesh = shipTemplate.clone();

      // ROTATION FIX: 
      // User reported "Sideways" -> Model is likely X-axis aligned. 
      // We rotate -90 degrees Y to align X to Z (Forward).
      mesh.rotation.set(0, -Math.PI / 2, 0);

      const anchor = new THREE.Group();
      anchor.add(mesh);

      // 2. Apply Scene Scale
      const s = 1.5 + Math.random() * 1.5; // Slightly smaller to avoid clutter
      anchor.scale.set(s, s, s);

      // 3. Depth: Safe Zone
      const zDepth = 40 + Math.random() * 40;

      // Pick Start Edge (Random direction is fine, sequential ships can come from anywhere)
      const edge = Math.floor(Math.random() * 4);
      const start = new THREE.Vector3();
      const end = new THREE.Vector3();

      const spread = 60; // Tighter spread
      const rangeX = 350;
      const rangeY = 250;

      switch (edge) {
        case 0: // Left -> Right
          start.set(-rangeX, (Math.random() - 0.5) * spread, zDepth);
          end.set(rangeX, (Math.random() - 0.5) * spread, zDepth);
          break;
        case 1: // Right -> Left
          start.set(rangeX, (Math.random() - 0.5) * spread, zDepth);
          end.set(-rangeX, (Math.random() - 0.5) * spread, zDepth);
          break;
        case 2: // Top -> Bottom
          start.set((Math.random() - 0.5) * spread, rangeY, zDepth);
          end.set((Math.random() - 0.5) * spread, -rangeY, zDepth);
          break;
        case 3: // Bottom -> Top
          start.set((Math.random() - 0.5) * spread, -rangeY, zDepth);
          end.set((Math.random() - 0.5) * spread, rangeY, zDepth);
          break;
      }

      // Position Anchor
      anchor.position.copy(start);
      anchor.lookAt(end);

      // Force Matrix Update
      anchor.updateMatrix();
      anchor.updateMatrixWorld(true);

      scene.add(anchor);

      // 4. Constant Speed (Standardized)
      const speed = 0.015; // Consistent majestic speed

      // We track the ANCHOR now
      this.activeShips.push({ mesh: anchor, start, end, life: 0, speed, rollSpeed: 0 });
      console.log("Spawned Single Ship Sequence:", this.shipIndex, edge);
    },
  };

  // Combine Updates (Shader + Physics)
  const shaderUpdate = planet.userData.update;
  planet.userData.update = (time, delta) => {
    // PULSE SPEED (time * 0.2)
    if (shaderUpdate) shaderUpdate(time * 0.2);

    // Flyby Update
    flybyManager.update(delta);

    // SLOW DOWN STARS
    if (stars.rotation) stars.rotation.y += (delta || 0.01) * 0.01;
  };

  return { scene, camera, controls, planet, stars };
}
console.log('OrbitSceneTech DARK_PULSE loaded!');
