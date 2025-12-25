import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { getGroundHeight } from '../utils/Terrain.js';

export class Cybertruck {
  constructor(envMap, shipGltf) {
    this.mesh = new THREE.Group();
    this.velocity = 0;
    this.steerValue = 0;
    this.boundingBox = new THREE.Box3();
    this.wheels = [];

    this.build(envMap, shipGltf);
  }

  build(envMap, shipGltf) {
    this.visualGroup = new THREE.Group();

    if (shipGltf) {
      // Clone the GLB scene to allow multiple instances if needed
      const model = shipGltf.clone();

      // Traverse to apply envMap if materials support it
      model.traverse((child) => {
        if (child.isMesh) {
          if (child.material) {
            // Handle both single material and array of materials
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(material => {
              if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                material.envMap = envMap;
                material.envMapIntensity = 2.0; // Enhance reflections
                material.needsUpdate = true; // Ensure material updates
              }
            });
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Add to visual group
      this.visualGroup.add(model);

      // Adjust Transform (Scale/Rotation) to fit game logic
      // Game logic assumes +Z is forward movement (which is actually backward in ThreeJS coords usually)
      // Adjust these values based on the specific 'nave.glb' orientation
      this.visualGroup.scale.set(0.5, 0.5, 0.5);
      this.visualGroup.rotation.y = Math.PI; // Face "Forward" relative to camera

      // Center the model vertically if needed
      this.visualGroup.position.y = 0.5;

    } else {
      // Fallback placeholder if failed to load
      const geometry = new THREE.BoxGeometry(2, 1, 4);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(geometry, material);
      this.visualGroup.add(cube);
    }

    this.mesh.add(this.visualGroup);


    // --- DUST SYSTEM ---
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(dustCount * 3);
    const lives = new Float32Array(dustCount);
    const sizes = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      positions[i * 3 + 1] = -5000;
      lives[i] = 0;
      sizes[i] = 1.0;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    dustGeo.setAttribute('life', new THREE.BufferAttribute(lives, 1));
    dustGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const dustShaderMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        color: { value: new THREE.Color(0x00ffff) }
      },
      vertexShader: `
            attribute float life;
            attribute float size;
            varying float vAlpha;
            void main() {
                vAlpha = life;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
      fragmentShader: `
            uniform vec3 color;
            varying float vAlpha;
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                if(dist > 0.5) discard;
                float strength = 1.0 - (dist * 2.0);
                strength = pow(strength, 2.0);
                gl_FragColor = vec4(color, vAlpha * strength);
            }
        `,
      blending: THREE.AdditiveBlending
    });

    this.dustSystem = new THREE.Points(dustGeo, dustShaderMat);
    this.dustSystem.renderOrder = 1;
    this.dustSystem.userData = {
      velocities: new Float32Array(dustCount * 3),
      nextIdx: 0
    };
    this.mesh.add(this.dustSystem);

    this.mesh.position.set(0, 0, 10);
  }

  update(delta, inputManager, collidables) {
    // Movement Logic
    if (inputManager.isPressed("KeyW") || inputManager.isPressed("ArrowUp"))
      this.velocity = -CONFIG.vehicle.speed;
    else if (inputManager.isPressed("KeyS") || inputManager.isPressed("ArrowDown"))
      this.velocity = CONFIG.vehicle.speed * 0.6;
    else this.velocity = THREE.MathUtils.lerp(this.velocity, 0, 0.1);

    if (inputManager.isPressed("KeyA") || inputManager.isPressed("ArrowLeft"))
      this.steerValue = CONFIG.vehicle.steerSpeed;
    else if (inputManager.isPressed("KeyD") || inputManager.isPressed("ArrowRight"))
      this.steerValue = -CONFIG.vehicle.steerSpeed;
    else this.steerValue = THREE.MathUtils.lerp(this.steerValue, 0, 0.1);

    if (Math.abs(this.velocity) > 0.1) {
      this.mesh.rotation.y += this.steerValue * delta;
    }

    // Physics
    // Physics
    const moveDistance = this.velocity * delta;

    // Update Box (Ensure World Matrix is fresh)
    this.mesh.updateMatrixWorld(true);
    // this.boundingBox.setFromObject(this.mesh); <--- This was including Camera/Lights (huge box)

    // Manual Tight Hitbox for Cybertruck (approx 3m wide, 3m tall, 6m long)
    // We lift center slightly (+1.5y) because position is at ground level
    const boxCenter = this.mesh.position.clone();
    boxCenter.y += 1.5;
    this.boundingBox.setFromCenterAndSize(boxCenter, new THREE.Vector3(3.5, 3.0, 7.0));

    // DEBUG: Visualize Ship Box
    if (!this.debugBoxMesh) {
      const geom = new THREE.BoxGeometry(1, 1, 1);
      // Hidden by default
      const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, visible: false });
      this.debugBoxMesh = new THREE.Mesh(geom, mat);
      // We add it to the scene parent if possible, or just hack it
      if (this.mesh.parent) this.mesh.parent.add(this.debugBoxMesh);
    }
    if (this.debugBoxMesh) {
      const center = new THREE.Vector3();
      this.boundingBox.getCenter(center);
      const size = new THREE.Vector3();
      this.boundingBox.getSize(size);
      this.debugBoxMesh.position.copy(center);
      this.debugBoxMesh.scale.copy(size);
    }

    const moveVector = new THREE.Vector3(0, 0, moveDistance);
    moveVector.applyQuaternion(this.mesh.quaternion);

    const nextBoundingBox = this.boundingBox.clone().translate(moveVector);
    let collision = false;

    // Debug Log freq
    if (!this.debugFrame) this.debugFrame = 0;
    this.debugFrame++;
    if (this.debugFrame % 500 === 0) {
      if (!collidables || collidables.length === 0) {
        console.warn("Cybertruck: No collidables found!");
      }
    }

    if (collidables) {
      if (this.debugFrame % 100 === 0) console.log(`[Physics] Checking ${collidables.length} objects...`);

      for (const collidable of collidables) {
        // 1. Distance optimization (and failsafe)
        // Ensure collider has a position we can measure
        const colPos = collidable.position || new THREE.Vector3();
        const dist = this.mesh.position.distanceTo(colPos);

        if (dist > 300) continue; // Re-enable optimizations once fixed

        // If proper box exists, try it
        const targetBox = collidable.boundingBox || (collidable instanceof THREE.Box3 ? collidable : null);
        let boxHit = false;

        if (targetBox) {
          if (nextBoundingBox.intersectsBox(targetBox)) {
            boxHit = true;
            console.log("[Physics] BOX HIT DETECTED!");
          }

          // DEBUG: Log coordinates if close but no hit
          if (!boxHit && dist < 50 && this.debugFrame % 100 === 0) {
            console.log(`[Physics Debug] Close to object (Dist: ${dist.toFixed(2)})`);
            console.log(`-- Ship Box: Y[${nextBoundingBox.min.y.toFixed(0)} to ${nextBoundingBox.max.y.toFixed(0)}]`);
            console.log(`-- Targ Box: Y[${targetBox.min.y.toFixed(0)} to ${targetBox.max.y.toFixed(0)}]`);
            if (nextBoundingBox.intersectsBox(targetBox)) console.log("--- MATH SAYS INTERSECT!");
            else console.log("--- Math says NO intersect.");
          }
        }

        // 2. Failsafe: Hard Radius Limit (e.g., if we are basically inside the object center)
        let radiusHit = false;
        if (dist < 10.0) { // Very close center-to-center
          // console.log("[Physics] RADIUS HIT (Failsafe)!");
          // radiusHit = true; 
        }

        if (boxHit || radiusHit) {
          collision = true;
          this.velocity = -this.velocity * 0.8; // Hard bounce
          const pushDir = this.mesh.position.clone().sub(colPos).normalize();
          this.mesh.position.add(pushDir.multiplyScalar(2.0));
          break;
        }
      }
    }

    if (!collision) this.mesh.position.add(moveVector);

    // Hover Animation
    const groundH = getGroundHeight(this.mesh.position.x, this.mesh.position.z);
    const time = performance.now() * 0.0015;
    const hoverOffset = Math.sin(time * 3) * 0.2;
    const hoverHeight = 3.5 + hoverOffset;
    const targetY = groundH + hoverHeight;
    this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, targetY, 0.15);

    // Tilt
    if (this.visualGroup) {
      const tiltZ = -this.steerValue * 0.6 * (Math.abs(this.velocity) / CONFIG.vehicle.speed);
      const tiltX = this.velocity * 0.005;
      this.visualGroup.rotation.z = THREE.MathUtils.lerp(this.visualGroup.rotation.z, tiltZ, 0.1);
      this.visualGroup.rotation.y = Math.PI;
      this.visualGroup.rotation.x = THREE.MathUtils.lerp(this.visualGroup.rotation.x, tiltX, 0.1);
    }

    // Dust Update
    const positions = this.dustSystem.geometry.attributes.position.array;
    const lives = this.dustSystem.geometry.attributes.life.array;
    const sizes = this.dustSystem.geometry.attributes.size.array;
    const vels = this.dustSystem.userData.velocities;
    const count = lives.length;
    let nextIdx = this.dustSystem.userData.nextIdx;

    const spawnCount = 5;
    const speedRatio = Math.abs(this.velocity) / CONFIG.vehicle.speed;
    const speedFactor = Math.max(0.1, speedRatio);

    for (let k = 0; k < spawnCount; k++) {
      const i = nextIdx;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 3.5;
      const lx = Math.cos(angle) * radius;
      const lz = Math.sin(angle) * radius;
      const biasZ = (Math.random() * 2.0) * speedRatio;

      positions[i * 3] = lx;
      positions[i * 3 + 1] = -3.5;
      positions[i * 3 + 2] = lz + biasZ;

      lives[i] = 1.0;
      sizes[i] = 2.0 + Math.random();

      const blastForce = 6.0 + (speedRatio * 5.0);
      vels[i * 3] = (lx / Math.max(0.1, radius)) * blastForce;
      vels[i * 3 + 1] = Math.random() * 2.0;
      vels[i * 3 + 2] = (lz / Math.max(0.1, radius)) * blastForce + (Math.abs(this.velocity) * 0.5);

      nextIdx = (nextIdx + 1) % count;
    }
    this.dustSystem.userData.nextIdx = nextIdx;

    for (let i = 0; i < count; i++) {
      if (lives[i] > 0) {
        lives[i] -= delta * 2.0;
        positions[i * 3] += vels[i * 3] * delta;
        positions[i * 3 + 1] += vels[i * 3 + 1] * delta;
        positions[i * 3 + 2] += vels[i * 3 + 2] * delta;
        sizes[i] += delta * 15.0;
      } else {
        positions[i * 3 + 1] = -5000;
      }
    }

    this.dustSystem.geometry.attributes.position.needsUpdate = true;
    this.dustSystem.geometry.attributes.life.needsUpdate = true;
    this.dustSystem.geometry.attributes.size.needsUpdate = true;
  }
}
