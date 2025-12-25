import * as THREE from 'three';

// --- Module Level Cache for Textures (Memory Optimization) ---
let cachedCircuitTextures = null;

// --- Helper: Procedural High-Tech Circuit Texture Generator ---
export function createCircuitTexture() {
  if (cachedCircuitTextures) {
    return cachedCircuitTextures;
  }

  const width = 1024;
  const height = 1024;

  const canvasDiffuse = document.createElement('canvas');
  const canvasRoughness = document.createElement('canvas');
  const canvasMetalness = document.createElement('canvas');
  const canvasEmissive = document.createElement('canvas');

  [canvasDiffuse, canvasRoughness, canvasMetalness, canvasEmissive].forEach(c => {
    c.width = width;
    c.height = height;
  });

  const ctxD = canvasDiffuse.getContext('2d');
  const ctxR = canvasRoughness.getContext('2d');
  const ctxM = canvasMetalness.getContext('2d');
  const ctxE = canvasEmissive.getContext('2d');

  // 1. Background (Dark Tech Material)
  ctxD.fillStyle = '#0a0a0F'; // Almost black blue
  ctxD.fillRect(0, 0, width, height);

  ctxR.fillStyle = '#202020'; // Matte base
  ctxR.fillRect(0, 0, width, height);

  ctxM.fillStyle = '#101010'; // Low metal base
  ctxM.fillRect(0, 0, width, height);

  ctxE.fillStyle = '#000000';
  ctxE.fillRect(0, 0, width, height);

  // 2. Grid Pattern (Subtle carbon fiber look)
  ctxR.fillStyle = '#151515';
  for (let i = 0; i < width; i += 32) {
    ctxR.fillRect(i, 0, 2, height);
    ctxR.fillRect(0, i, width, 2);
  }

  // 3. Data Lines (Traces)
  const numTracks = 500;
  ctxD.lineWidth = 3;
  ctxM.lineWidth = 3;
  ctxR.lineWidth = 3;
  ctxE.lineWidth = 3;

  for (let i = 0; i < numTracks; i++) {
    const x = Math.floor(Math.random() * (width / 32)) * 32;
    const y = Math.floor(Math.random() * (height / 32)) * 32;
    const len = Math.floor(Math.random() * 10 + 2) * 32;
    const dir = Math.random() > 0.5 ? 0 : 1;

    // Choose track type: Copper, Silver, or Optical (Emissive)
    const type = Math.random();

    if (type > 0.9) {
      // Optical / Emissive Line
      ctxD.strokeStyle = '#00ffff';
      ctxE.strokeStyle = '#00ffff';
      ctxM.strokeStyle = '#000000';
      ctxR.strokeStyle = '#000000';
    } else if (type > 0.6) {
      // Gold / Copper
      ctxD.strokeStyle = '#b8860b';
      ctxE.strokeStyle = '#000000';
      ctxM.strokeStyle = '#ffffff';
      ctxR.strokeStyle = '#000000';
    } else {
      // Grey / Dark Trace
      ctxD.strokeStyle = '#1e1e24';
      ctxE.strokeStyle = '#000000';
      ctxM.strokeStyle = '#404040';
      ctxR.strokeStyle = '#101010';
    }

    ctxD.beginPath(); ctxE.beginPath(); ctxM.beginPath(); ctxR.beginPath();
    ctxD.moveTo(x, y); ctxE.moveTo(x, y); ctxM.moveTo(x, y); ctxR.moveTo(x, y);

    let ex = x, ey = y;
    if (dir === 0) { ex = x + len; } else { ey = y + len; }

    ctxD.lineTo(ex, ey); ctxE.lineTo(ex, ey); ctxM.lineTo(ex, ey); ctxR.lineTo(ex, ey);

    ctxD.stroke(); ctxE.stroke(); ctxM.stroke(); ctxR.stroke();

    // Nodes at ends
    if (Math.random() > 0.5) {
      const r = 4;
      ctxD.fillStyle = ctxD.strokeStyle;
      ctxE.fillStyle = ctxE.strokeStyle;
      ctxD.beginPath(); ctxD.arc(ex, ey, r, 0, Math.PI * 2); ctxD.fill();
      ctxE.beginPath(); ctxE.arc(ex, ey, r, 0, Math.PI * 2); ctxE.fill();
    }
  }

  // 4. Tech Chips / Processing Units
  const numChips = 15;
  for (let i = 0; i < numChips; i++) {
    const w = Math.floor(Math.random() * 4 + 2) * 32; // Snap to grid
    const h = Math.floor(Math.random() * 4 + 2) * 32;
    const x = Math.floor(Math.random() * (width / 32)) * 32;
    const y = Math.floor(Math.random() * (height / 32)) * 32;

    // Base Chip
    ctxD.fillStyle = '#101010';
    ctxD.fillRect(x, y, w, h);

    ctxM.fillStyle = '#aaafff'; // Shiny top
    ctxM.fillRect(x + 2, y + 2, w - 4, h - 4);

    ctxR.fillStyle = '#101010'; // Glossy
    ctxR.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Center Glow branding
    if (Math.random() > 0.5) {
      ctxE.fillStyle = '#ff00ff';
      ctxE.fillRect(x + w / 2 - 4, y + h / 2 - 4, 8, 8);
      ctxD.fillStyle = '#ff00ff';
      ctxD.fillRect(x + w / 2 - 4, y + h / 2 - 4, 8, 8);
    }
  }

  // Cache the results
  cachedCircuitTextures = {
    map: new THREE.CanvasTexture(canvasDiffuse),
    roughnessMap: new THREE.CanvasTexture(canvasRoughness),
    metalnessMap: new THREE.CanvasTexture(canvasMetalness),
    emissiveMap: new THREE.CanvasTexture(canvasEmissive)
  };

  return cachedCircuitTextures;
}


// Cleaned Version: No Alien Model Logic
export function createAdrenaSign(texture) {
  const rootGroup = new THREE.Group();
  const shopGroup = new THREE.Group();

  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  // --- Materials ---
  const circuitTextures = createCircuitTexture();
  // Improve repeating for scale
  [circuitTextures.map, circuitTextures.roughnessMap, circuitTextures.metalnessMap, circuitTextures.emissiveMap].forEach(t => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2); // Repeat texture 2x on each face for density
    t.needsUpdate = true;
  });

  const blackStone = new THREE.MeshStandardMaterial({
    map: circuitTextures.map,
    roughnessMap: circuitTextures.roughnessMap,
    metalnessMap: circuitTextures.metalnessMap,
    emissiveMap: circuitTextures.emissiveMap,
    emissive: 0xffffff,
    emissiveIntensity: 1.2,
    roughness: 0.4,
    metalness: 0.8
  });

  // --- Architecture ---

  // 1. Main Cube Shop
  const shopSize = 15;
  const shopGeo = new THREE.BoxGeometry(shopSize, shopSize, shopSize);
  const shopBody = new THREE.Mesh(shopGeo, blackStone);
  shopBody.position.set(0, shopSize / 2, 0); // Sit on ground
  shopGroup.add(shopBody);

  // 2. Entrance (Simple Arch for Particle anchoring)
  const archW = 6;
  const archH = 8;
  const entranceGroup = new THREE.Group();

  // --- Portal Shader: Digital Vortex Tunnel (Refined) ---
  const portalVertexShader = [
    "varying vec2 vUv;",
    "varying vec3 vPosition;",
    "void main() {",
    "  vUv = uv;",
    "  vPosition = position;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
  ].join("\n");

  const portalFragmentShader = [
    "uniform float uTime;",
    "varying vec2 vUv;",
    "#define PI 3.14159265359",
    "void main() {",
    "  vec2 uv = vUv - 0.5;",
    "  uv.y *= 0.75; // Elliptical aspect",
    "  float r = length(uv);",
    "  float a = atan(uv.y, uv.x);",
    "  ",
    "  // Tunnel Depth with less infinity blowout",
    "  float depth = 0.3 / (r + 0.05);",
    "  ",
    "  // Texture",
    "  float grid = sin(depth * 25.0 - uTime * 8.0) * sin(a * 20.0);",
    "  float beam = smoothstep(0.8, 1.0, grid);",
    "  ",
    "  // Spiral",
    "  float spiral = sin(r * 40.0 - uTime * 4.0 + a * 5.0);",
    "  ",
    "  // Colors",
    "  vec3 col = vec3(0.0);",
    "  // Deep Blue/Cyan Base",
    "  col += vec3(0.0, 0.2, 0.4) * (depth * 0.5);",
    "  // Grid Lines",
    "  col += vec3(0.0, 0.8, 1.0) * beam * (depth * 0.3);",
    "  // Spiral Energy",
    "  col += vec3(0.5, 0.0, 1.0) * spiral * 0.3;",
    "  ",
    "  // Rim Glow (Defined Edge)",
    "  float ring = smoothstep(0.45, 0.48, r); // Sharp cutoff",
    "  float hole = smoothstep(0.48, 0.5, r);",
    "  col *= (1.0 - hole); // Cut hole",
    "  col += vec3(0.0, 1.0, 1.0) * ring * 2.0; // Glowing Ring",
    "  ",
    "  gl_FragColor = vec4(col, 1.0 - hole);",
    "}"
  ].join("\n");

  const portalMaterial = new THREE.ShaderMaterial({
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
    uniforms: {
      uTime: { value: 0 }
    },
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  // Door Mesh (The Portal Plane)
  const doorGeo = new THREE.PlaneGeometry(archW, archH);
  const door = new THREE.Mesh(doorGeo, portalMaterial);
  door.position.set(0, archH / 2, 0);
  entranceGroup.add(door);

  // --- Tech Border Frame ---
  // Create a heavy metallic frame to ground the portal
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, // Dark Grey
    roughness: 0.3,
    metalness: 0.9,
    emissive: 0x001133,
    emissiveIntensity: 0.5
  });

  const frameThick = 0.8;
  const frameDepth = 0.8;

  // Frame Group
  const frameGroup = new THREE.Group();

  // Left Pillar
  const fLeft = new THREE.Mesh(new THREE.BoxGeometry(frameThick, archH + 1, frameDepth), frameMat);
  fLeft.position.set(-(archW / 2 + frameThick / 2), archH / 2, 0);
  frameGroup.add(fLeft);

  // Right Pillar
  const fRight = new THREE.Mesh(new THREE.BoxGeometry(frameThick, archH + 1, frameDepth), frameMat);
  fRight.position.set((archW / 2 + frameThick / 2), archH / 2, 0);
  frameGroup.add(fRight);

  // Top Lintel (Arch)
  const fTop = new THREE.Mesh(new THREE.BoxGeometry(archW + frameThick * 2 + 2, frameThick, frameDepth + 0.2), frameMat);
  fTop.position.set(0, archH + frameThick / 2, 0.1); // Slightly protruding
  frameGroup.add(fTop);

  // Bottom Threshold
  const fBot = new THREE.Mesh(new THREE.BoxGeometry(archW + frameThick * 2, frameThick, frameDepth), frameMat);
  fBot.position.set(0, -frameThick / 2, 0);
  frameGroup.add(fBot);

  // Detail: Emissive studs/lights on frame
  const studGeo = new THREE.BoxGeometry(0.2, 0.8, 0.1);
  const studMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const studL = new THREE.Mesh(studGeo, studMat);
  studL.position.set(-(archW / 2 + frameThick / 2), archH * 0.75, frameDepth / 2 + 0.05);
  frameGroup.add(studL);

  const studR = new THREE.Mesh(studGeo, studMat);
  studR.position.set((archW / 2 + frameThick / 2), archH * 0.75, frameDepth / 2 + 0.05);
  frameGroup.add(studR);

  entranceGroup.add(frameGroup);

  // --- Real Light Source (Glow) ---
  const portalLight = new THREE.PointLight(0x00ffff, 2, 10);
  portalLight.position.set(0, archH / 2, 2);
  entranceGroup.add(portalLight);

  // --- Particle System (Vortex Particles) ---
  const particlesCount = 400; // More particles
  const pPos = new Float32Array(particlesCount * 3);
  const pSizes = new Float32Array(particlesCount);
  const pData = []; // Store angle/radius for spiral math

  for (let i = 0; i < particlesCount; i++) {
    // Initial random positions in a cloud
    pPos[i * 3] = (Math.random() - 0.5) * archW;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * archH + (archH / 2);
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
    pSizes[i] = Math.random() * 0.2 + 0.05;

    // Custom data for spiral movement: radius, angle, speed
    const r = Math.random() * 3.0 + 1.0; // Start further out
    const angle = Math.random() * Math.PI * 2;
    pData.push({ r: r, angle: angle, speed: Math.random() * 2.0 + 1.0, zOffset: (Math.random() - 0.5) });
  }

  const pGeoSys = new THREE.BufferGeometry();
  pGeoSys.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeoSys.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));

  const pMat = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.2,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    map: null // Default square particles fit the digital theme
  });

  const particleSystem = new THREE.Points(pGeoSys, pMat);
  entranceGroup.add(particleSystem);

  // Particle Update Logic (Vortex)
  particleSystem.userData = {
    data: pData,
    update: function (time) {
      const positions = particleSystem.geometry.attributes.position.array;
      const dt = 0.016; // Approx delta

      for (let i = 0; i < particlesCount; i++) {
        const d = this.data[i];

        // Decrease radius (suck in)
        d.r -= d.speed * dt;
        // Increase angle (spin faster as you get close)
        d.angle += (2.0 / (d.r + 0.1)) * dt;

        // Reset if sucked in too much
        if (d.r < 0.2) {
          d.r = 4.0; // Respawn outside
          d.angle = Math.random() * Math.PI * 2;
        }

        // Convert Polar to Cartesian
        // Elliptical path to match door
        const x = Math.cos(d.angle) * d.r;
        const y = Math.sin(d.angle) * d.r * 1.3 + (archH / 2); // Stretch Y
        // Use passed time variable instead of global uTime
        const z = Math.sin(d.angle * 3.0 + time) * 0.5; // Wobbly Z

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;
    }
  };
  particleSystem.geometry.userData = particleSystem.userData; // Link to geo for easy access? No just handle in group.

  entranceGroup.position.set(0, 0, halfSize + 0.1); // Slightly in front
  shopGroup.add(entranceGroup);

  // Add Hitbox for link properly sized to the building
  // Raycaster ignores visible:false, so we use opacity:0
  const buildingHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(shopSize + 2, shopSize, shopSize + 2),
    new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.0 })
  );
  buildingHitbox.position.set(0, shopSize / 2, 0);
  buildingHitbox.userData = { isAlienLink: true, url: "https://gameofskate.vercel.app/" };
  shopGroup.add(buildingHitbox);

  rootGroup.add(shopGroup);


  // --- The Rotating Logo (On Top) ---
  const signGroup = new THREE.Group();

  const cutoutMaterial = new THREE.ShaderMaterial({
    uniforms: { map: { value: texture } },
    vertexShader: [
      "varying vec2 vUv;",
      "void main() {",
      "  vUv = uv;",
      "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
      "}"
    ].join("\n"),
    fragmentShader: [
      "uniform sampler2D map;",
      "varying vec2 vUv;",
      "void main() {",
      "  vec4 texColor = texture2D(map, vUv);",
      "  float threshold = 0.8;",
      "  // Simple Chroma Key for white bg",
      "  if (texColor.r > 0.8 && texColor.g > 0.8 && texColor.b > 0.8) discard;",
      "  gl_FragColor = texColor;",
      "}"
    ].join("\n"),
    side: THREE.DoubleSide,
    transparent: true
  });

  const pGeo = new THREE.PlaneGeometry(10, 10); // Bigger Logo
  const logoMesh = new THREE.Mesh(pGeo, cutoutMaterial);
  signGroup.add(logoMesh);

  // Position high above center
  signGroup.position.set(0, 22, 0);
  rootGroup.add(signGroup);


  // Initial Transform
  rootGroup.position.set(-80, -1.0, 80); // Adjusted height for new building base

  // Propagate Link Data to Root so clicks on visible parts work too
  rootGroup.userData.isAlienLink = true;
  rootGroup.userData.url = "https://gameofskate.vercel.app/";

  // Animation Loop
  rootGroup.userData.update = (delta, time) => {
    // Spin the logo on top
    signGroup.rotation.y -= 1.5 * delta;

    // Float effect
    signGroup.position.y = 22 + Math.sin(time * 2) * 1.0;

    // Update Portal Shader
    portalMaterial.uniforms.uTime.value = time;

    // Update Particles
    if (particleSystem.userData.update) {
      particleSystem.userData.update(time);
    }
  };

  return rootGroup;
}
