import * as THREE from 'three';

// Procedural Smoke Texture Generator
function createSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.4, 'rgba(200, 200, 200, 0.5)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createToxicLab() {
  const group = new THREE.Group();

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.7,
    metalness: 0.6
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.4
  });

  const hazardMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    emissive: 0xaa4400,
    emissiveIntensity: 0.2,
    roughness: 0.4
  });

  // --- Industrial Complex ---

  // Main Factory Building
  const mainBldg = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 30), metalMat);
  mainBldg.position.y = 5;
  group.add(mainBldg);

  // Hazard Stripes / Details
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(21, 1, 31), hazardMat);
  stripe.position.y = 9;
  group.add(stripe);

  // Storage Tanks
  const tankGeo = new THREE.CylinderGeometry(4, 4, 12, 16);
  for (let i = 0; i < 3; i++) {
    const tank = new THREE.Mesh(tankGeo, metalMat);
    tank.position.set(-15, 6, -10 + (i * 10));
    group.add(tank);

    // Pipes connecting to main bldg
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6), darkMetalMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(-10, 8, -10 + (i * 10));
    group.add(pipe);
  }

  // Tall Smokestacks
  const stacks = [];
  const stackGeo = new THREE.CylinderGeometry(1.5, 2.5, 25, 16);
  // Stack 1
  const s1 = new THREE.Mesh(stackGeo, darkMetalMat);
  s1.position.set(5, 12, 5);
  group.add(s1);
  stacks.push(s1);

  // Stack 2
  const s2 = new THREE.Mesh(stackGeo, darkMetalMat);
  s2.position.set(5, 12, -5);
  group.add(s2);
  stacks.push(s2);

  // Warning Lights on stacks
  stacks.forEach(s => {
    const lightGeo = new THREE.SphereGeometry(0.5);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.y = 12.5; // Top of stack (25 height / 2)
    s.add(light);
  });

  // Hitbox for interaction
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(40, 30, 40),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitbox.position.y = 15;
  hitbox.userData = { isLink: true, url: "https://link-tree-snows.vercel.app" };
  group.add(hitbox);

  // --- Realistic Smoke System ---
  const smokeTexture = createSmokeTexture();
  const smokeMaterial = new THREE.SpriteMaterial({
    map: smokeTexture,
    color: 0x44ff44, // Toxic Green tint
    transparent: true,
    opacity: 0.4,
    depthWrite: false, // Soft blending
  });

  const particles = [];
  const particleCount = 100; // More particles for realism

  // Pool of particles
  for (let i = 0; i < particleCount; i++) {
    const p = new THREE.Sprite(smokeMaterial);
    p.visible = false; // Start hidden
    group.add(p);
    particles.push({
      mesh: p,
      life: 0,
      maxLife: 2 + Math.random() * 3, // Random life 2-5s
      velocity: new THREE.Vector3(0, 0, 0),
      delay: Math.random() * 5 // Random start delay
    });
  }

  // Position far away (-200, -2, -200)
  group.position.set(-200, -2, -200);
  group.rotation.y = Math.PI / 4; // Angled view

  // Update Logic
  group.userData.update = (delta, time) => {
    // Find which stack to emit from (alternate or random)

    particles.forEach((p, idx) => {
      if (p.delay > 0) {
        p.delay -= delta;
        return;
      }

      if (!p.mesh.visible) {
        // Respawn
        p.mesh.visible = true;
        p.life = p.maxLife;

        // Randomly pick one of the two stacks
        const stack = stacks[Math.floor(Math.random() * stacks.length)];
        // Stack world position relative to group needs calculation or just manual offset
        // Group is at 0,0,0 local. Stacks are at local coords.
        // We add local offsets + jitter
        const offsetX = stack.position.x + (Math.random() - 0.5) * 2;
        const offsetZ = stack.position.z + (Math.random() - 0.5) * 2;
        const startY = 25; // Top of stack approx relative to group floor (12 + 12.5)

        p.mesh.position.set(offsetX, startY, offsetZ);
        p.mesh.scale.setScalar(4 + Math.random() * 2); // Start size

        // Upward velocity with wind drift
        p.velocity.set(
          0.5 + (Math.random() - 0.5), // slight wind X
          5 + Math.random() * 2,       // Fast up
          0.5 + (Math.random() - 0.5)  // slight wind Z
        );
      }

      // Update Physics
      p.life -= delta;
      if (p.life <= 0) {
        p.mesh.visible = false;
        p.delay = Math.random() * 0.5; // Short delay before reuse
        return;
      }

      p.mesh.position.addScaledVector(p.velocity, delta);

      // Smoke spreads and slows down vertically
      p.velocity.y *= 0.98;
      p.mesh.scale.addScalar(2.0 * delta); // Grow

      // Fade out based on life
      const lifeRatio = p.life / p.maxLife;
      p.mesh.material.opacity = 0.4 * lifeRatio;
    });
  };

  return group;
}
