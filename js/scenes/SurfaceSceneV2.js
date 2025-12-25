import * as THREE from 'three';
import { Cybertruck } from '../entities/Cybertruck.js';
import { createAdrenaSign } from '../entities/AdrenaSign.js';
import { createToxicLab } from '../entities/ToxicLab.js';
import { getGroundHeight } from '../utils/Terrain.js';
import { CONFIG } from '../config.js';

// --- Local Texture Generator to force update ---
function createGroundCircuitTexture() {
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

  // 1. Background (Dark Tech / Motherboard)
  ctxD.fillStyle = '#050505';
  ctxD.fillRect(0, 0, width, height);
  ctxR.fillStyle = '#222';
  ctxR.fillRect(0, 0, width, height); // Mostly matte
  ctxM.fillStyle = '#111';
  ctxM.fillRect(0, 0, width, height);
  ctxE.fillStyle = '#000';
  ctxE.fillRect(0, 0, width, height);

  // 2. Circuit Lines
  ctxE.strokeStyle = '#00ffaa'; // Cyan/Green Glow
  ctxD.strokeStyle = '#004444';
  ctxM.strokeStyle = '#aaaaaa'; // Metal traces
  ctxR.strokeStyle = '#000'; // Shiny traces

  const numLines = 400;
  for (let i = 0; i < numLines; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const len = Math.random() * 200;
    const horizontal = Math.random() > 0.5;

    ctxD.beginPath(); ctxM.beginPath(); ctxE.beginPath(); ctxR.beginPath();

    if (horizontal) {
      ctxD.rect(x, y, len, 4);
      ctxM.rect(x, y, len, 4);
      ctxR.rect(x, y, len, 4);
      // Random emissive
      if (Math.random() > 0.8) ctxE.rect(x, y, len, 4);
    } else {
      ctxD.rect(x, y, 4, len);
      ctxM.rect(x, y, 4, len);
      ctxR.rect(x, y, 4, len);
      // Random emissive
      if (Math.random() > 0.8) ctxE.rect(x, y, 4, len);
    }

    ctxD.fillStyle = '#222'; ctxD.fill();
    ctxM.fillStyle = '#888'; ctxM.fill();
    ctxR.fillStyle = '#000'; ctxR.fill();
    ctxE.fillStyle = '#00ffaa'; ctxE.fill();
  }

  // 3. Tech Blocks / Nodes
  for (let i = 0; i < 50; i++) {
    const w = 32 + Math.random() * 64;
    const h = 32 + Math.random() * 64;
    const x = Math.random() * width;
    const y = Math.random() * height;

    ctxD.fillStyle = '#111'; ctxD.fillRect(x, y, w, h);
    ctxM.fillStyle = '#fff'; ctxM.fillRect(x + 2, y + 2, w - 4, h - 4); // Shiny Metal Plate
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

export function createSurfaceScene(renderer, envMap, moonTexture, moonNormalMap, adrenaTexture, shipGltf, shipAnimations, templeCModel, templeAnimations, alienCreatureModel, alienAnimations) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 8000);
  const collidableObjects = [];

  // Atmosphere
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.003);

  // Terrain
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  // Generate Circuit Texture LOCALLY
  console.log("GENERATING NEW GROUND TEXTURE...");
  const groundTextures = createGroundCircuitTexture();
  [groundTextures.map, groundTextures.roughnessMap, groundTextures.metalnessMap, groundTextures.emissiveMap].forEach(t => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(50, 50); // Scale it visible
    t.anisotropy = maxAnisotropy;
  });

  const groundGeo = new THREE.PlaneGeometry(3000, 3000, 200, 200);
  const pos = groundGeo.attributes.position;

  // Keep the terrain height heightmap
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = getGroundHeight(x, y);
    pos.setZ(i, z);
  }
  groundGeo.computeVertexNormals();

  const groundMesh = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({
      map: groundTextures.map,
      roughnessMap: groundTextures.roughnessMap,
      metalnessMap: groundTextures.metalnessMap,
      emissiveMap: groundTextures.emissiveMap,
      emissive: 0xffffff,
      emissiveIntensity: 0.8, // Brighter
      roughness: 0.3,
      metalness: 0.9,
      vertexColors: false,
      color: 0xffffff,
    })
  );
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // Create Main Rover
  const rover = new Cybertruck(envMap, shipGltf);

  // Setup Ship Animation Mixer
  let shipMixer = null;
  if (shipAnimations && shipAnimations.length > 0) {
    console.log("Initializing Ship Animation...");
    shipMixer = new THREE.AnimationMixer(rover.mesh); // IMPORTANT: Rover mesh is the GLTF scene
    const action = shipMixer.clipAction(shipAnimations[0]);
    action.play();
  }
  scene.add(rover.mesh);

  // --- 1. Create All Objects ---

  // Replace Space Station & Billboard with CursoC  // Temple C (Training Center)
  let templeCInstance = null;
  let templeMixer = null;

  if (templeCModel) {
    console.log("Adding TempleC Model (Auto-Align & Brighten)...");
    templeCInstance = templeCModel.clone();

    const cx = -200;
    const cz = -200;
    const cy = getGroundHeight(cx, cz);

    // Initial Scale
    templeCInstance.scale.set(5.0, 5.0, 5.0);
    // Rotation: Flipped 180 degrees as requested (was Math.PI, now 0)
    templeCInstance.rotation.y = 0;

    // Material: Reverting to natural/darker state
    templeCInstance.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.envMap = envMap;
        child.material.envMapIntensity = 1.0; // Standard
        child.material.emissive = new THREE.Color(0x000000); // No extra glow
      }
    });

    // Auto-Align to Ground (Fix Buried Issue)
    templeCInstance.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(templeCInstance);
    const yOffset = -box.min.y; // Distance to lift bottom to 0
    console.log("Temple Lift Offset:", yOffset);

    // Sink slightly (-16.0) to ground the ramp without burying the pillars
    templeCInstance.position.set(cx, cy + yOffset - 16.0, cz);

    scene.add(templeCInstance);

    // Add Local Light for Visibility (Standard)
    const templeLight = new THREE.PointLight(0xffaa00, 100, 200);
    templeLight.position.set(cx, cy + 20, cz + 20);
    scene.add(templeLight);

    // Setup Animation Mixer for Temple
    if (templeAnimations && templeAnimations.length > 0) {
      console.log("Initializing Temple Animation...");
      templeMixer = new THREE.AnimationMixer(templeCInstance);
      const action = templeMixer.clipAction(templeAnimations[0]);
      action.play();
    }
  }

  // Integrate Alien Creature INDEPENDENTLY (To ensure position/visibility)
  // Integrate Alien Creature INDEPENDENTLY (To ensure position/visibility)
  let mixer = null;
  let alienInstance = null;
  if (alienCreatureModel) {
    console.log("Auto-Scaling Alien to Target Height (15m)...");
    alienInstance = alienCreatureModel.clone();

    alienInstance.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.envMap = envMap;
          child.material.envMapIntensity = 2.0;
        }
      }
    });

    // 1. Reset Scale to Baseline
    alienInstance.scale.set(1, 1, 1);
    alienInstance.updateMatrixWorld(true);

    // 2. Measure Baseline
    const rawBox = new THREE.Box3().setFromObject(alienInstance);
    const rawSize = new THREE.Vector3();
    rawBox.getSize(rawSize);

    // 3. Calculate Scale Factor for Target Height (18m - 20% bigger)
    // If raw height is 0 (broken model), fallback to use 1.0 scale.
    const targetHeight = 18.0; // Desired Height in world units
    let s = 1.0;
    if (rawSize.y > 0.001) {
      s = targetHeight / rawSize.y;
    } else {
      console.warn("Alien Model seems empty/flat. Using scale 100.0 as fallback.");
      s = 100.0;
    }

    console.log(`Alien Raw Height: ${rawSize.y}, Scale Factor Applied: ${s}`);
    alienInstance.scale.set(s, s, s);

    // 4. Re-calculate bounds for Ground Positioning
    alienInstance.updateMatrixWorld(true);
    const finalBox = new THREE.Box3().setFromObject(alienInstance);
    const yOffset = -finalBox.min.y; // Shift up so bottom touches 0

    // Move slightly further away (was 50,50 -> now 80,80)
    const cx = 80;
    const cz = 80;
    const cy = getGroundHeight(cx, cz);

    alienInstance.position.set(cx, cy + yOffset, cz);
    alienInstance.rotation.y = -Math.PI / 4;

    // Interaction Logic
    alienInstance.userData.isAlienLink = true;
    alienInstance.userData.url = "https://link-tree-snows.vercel.app/";

    // Propagate to internal meshes to ensure click detection works
    alienInstance.traverse((c) => {
      if (c.isMesh) {
        c.userData.isAlienLink = true;
        c.userData.url = alienInstance.userData.url;
      }
    });

    scene.add(alienInstance);

    // Setup Animation Mixer
    if (alienAnimations && alienAnimations.length > 0) {
      console.log("Initializing Alien Animation:", alienAnimations[0].name);
      mixer = new THREE.AnimationMixer(alienInstance);
      const action = mixer.clipAction(alienAnimations[0]);
      action.play();
    }
  }

  // Adrena Sign
  let adrenaSign = null;
  if (adrenaTexture) {
    adrenaSign = createAdrenaSign(adrenaTexture);
    scene.add(adrenaSign);
  }

  // --- 2. Update Physics World State ---
  scene.updateMatrixWorld(true);

  // --- 3. Generate Collisions ---
  // Replaced colonyGroup/billboard with cursoCInstance
  // --- 3. Generate Collisions (COMPOUND AUTOMATIC MAPPING) ---
  // Efficiently maps the actual parts of the model (Walls, Pillars) instead of guessing.

  function generateCompoundColliders(rootObject) {
    if (!rootObject) return;

    rootObject.updateMatrixWorld(true);

    rootObject.traverse((child) => {
      if (child.isMesh && child.visible) {
        // 1. Get tight box for this specific part
        // Note: setFromObject on a single mesh is usually accurate
        const box = new THREE.Box3().setFromObject(child);
        const size = new THREE.Vector3();
        box.getSize(size);

        // 2. Filter out Noise
        // Ignore huge things (like sky domes if any) or tiny details
        if (size.x > 300 || size.z > 300) return; // Too big (Ground?)
        if (size.lengthSq() < 1.0) return; // Too small

        // 3. Create Collider Box
        const center = new THREE.Vector3();
        box.getCenter(center);

        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true, visible: false }); // Debug Hidden
        const collider = new THREE.Mesh(geometry, material);
        collider.position.copy(center);

        // Static Box for Physics
        collider.updateMatrixWorld(true);
        collider.boundingBox = new THREE.Box3().setFromCenterAndSize(center, size);

        // TRANSITION LINK SUPPORT: Inherit from root object
        if (rootObject.userData && rootObject.userData.isAlienLink) {
          collider.userData.isAlienLink = true;
          collider.userData.url = rootObject.userData.url;
        }

        scene.add(collider);
        collidableObjects.push(collider);
      }
    });
  }

  function createManualBox(x, z, width, depth) {
    const height = 50;
    const y = height / 2;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true, visible: false }); // Debug Hidden
    const collider = new THREE.Mesh(geometry, material);
    collider.position.set(x, y, z);
    collider.updateMatrixWorld(true);
    collider.boundingBox = new THREE.Box3();
    collider.boundingBox.setFromCenterAndSize(collider.position, new THREE.Vector3(width, height, depth));
    scene.add(collider);
    collidableObjects.push(collider);
  }

  // 1. Temple: Use Compound Mapping and Link Setup
  console.log("Generating Temple Colliders...");
  if (templeCInstance) {
    // Setup Interaction (Click -> Transition -> URL)
    // IMPORTANT: Set this BEFORE generating colliders so they inherit the link!
    templeCInstance.userData.isAlienLink = true; // Use same transition logic as Alien
    templeCInstance.userData.url = "https://cursoc.vercel.app/";

    templeCInstance.traverse((c) => {
      if (c.isMesh) {
        c.userData.isAlienLink = true;
        c.userData.url = templeCInstance.userData.url;
      }
    });

    // Generate Colliders (Automatic Voxelization)
    generateCompoundColliders(templeCInstance);
  }

  // 2. Alien Collider (Manual is fine for simple shape)
  createManualBox(80, 80, 6, 6);

  // 3. Adrena Sign (At -80, 80)
  // Wide but flat.
  createManualBox(-80, 80, 25, 8);

  // Stars
  const starVerts = [];
  for (let i = 0; i < 15000; i++) {
    const v = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2)
    );
    v.normalize().multiplyScalar(5000);
    starVerts.push(v.x, v.y, v.z);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
  scene.add(new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 2, transparent: true, opacity: 0.9 })
  ));

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(200, 400, 200);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 4096;
  sun.shadow.mapSize.height = 4096;
  sun.shadow.camera.left = -500;
  sun.shadow.camera.right = 500;
  sun.shadow.camera.top = 500;
  sun.shadow.camera.bottom = -500;
  scene.add(sun);

  return { scene, camera, rover, antennaLight: null, collidableObjects, groundMesh, alienMixer: mixer, templeMixer: templeMixer, shipMixer: shipMixer };
}
