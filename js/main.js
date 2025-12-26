import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CONFIG } from './config.js';
import { InputManager } from './utils/InputManager.js';
import { createOrbitScene } from './scenes/OrbitSceneTech.js?v=ORBIT_ROTATION_FIX_V34';
import { createSurfaceScene } from './scenes/SurfaceSceneV2.js?v=HOTFIX_CASE_SENSITIVE_V2';

class App {
  constructor() {
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.inputManager = new InputManager();
    this.loadingManager = new THREE.LoadingManager();

    this.viewMode = "orbit"; // "orbit" or "surface"

    // Scene Objects
    this.orbitData = null; // { scene, camera, controls, planet, stars }
    this.surfaceData = null; // { scene, camera, rover, antennaLight, collidableObjects }

    // Assets
    this.moonTexture = null;
    this.moonNormalMap = null;
    this.adrenaTexture = null;
    this.envMap = null;
    this.shipModel = null;

    // UI
    this.ui = {
      loadingScreen: document.getElementById("loading-screen"),
      infoText: document.getElementById("info-text"),
      backButton: document.getElementById("backButton"),
      mobileBackButton: document.getElementById("mobile-backButton"),
      colonyLabel: document.getElementById("colony-label"),
      mobileControls: document.getElementById("mobile-controls")
    };

    this.init();
  }

  init() {
    try {
      const canvas = document.getElementById("main-canvas");
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.loadAssets(() => {
        this.setupScenes();
        this.setupEvents();
        this.onResize();
        this.animate();
      });

    } catch (e) {
      console.error("CRITICAL ERROR:", e);
      document.body.innerHTML = `<div style="background:black; color:red; font-size:20px; padding:40px; font-family:monospace;">CRITICAL ERROR INITIALIZING:<br>${e.message}</div>`;
    }
  }

  loadAssets(onComplete) {
    this.loadingManager.onLoad = () => {
      setTimeout(() => {
        this.ui.loadingScreen.style.opacity = "0";
        setTimeout(() => {
          this.ui.loadingScreen.style.display = "none";
        }, 800);
      }, 500);
      onComplete();
    };

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const percentage = Math.round((itemsLoaded / itemsTotal) * 100);
      const text = this.ui.loadingScreen.querySelector('.loading-text');
      if (text) text.innerText = `CARREGANDO SISTEMAS... ${percentage}%`;
      // console.log(`Loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
    };

    this.loadingManager.onError = (url) => {
      console.error('There was an error loading ' + url);
      const text = this.ui.loadingScreen.querySelector('.loading-text');
      if (text) text.innerText = `ERRO NO RECURSO: ${url.split('/').pop()}`;
      if (text) text.style.color = 'red';
    };

    // Safety Timeout: Force start after 15 seconds if stuck
    setTimeout(() => {
      if (this.ui.loadingScreen.style.display !== "none") {
        console.warn("Loading taking too long. Forcing start...");
        const text = this.ui.loadingScreen.querySelector('.loading-text');
        if (text) {
          text.innerText = "INICIALIZAÇÃO FORÇADA...";
          text.style.color = "orange";
        }
        setTimeout(() => {
          this.ui.loadingScreen.style.opacity = "0";
          setTimeout(() => {
            this.ui.loadingScreen.style.display = "none";
            onComplete();
          }, 800);
        }, 1000);
      }
    }, 15000);

    const textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.moonTexture = textureLoader.load(CONFIG.textures.moon);
    if (CONFIG.textures.moonNormal) {
      this.moonNormalMap = textureLoader.load(CONFIG.textures.moonNormal);
    }
    this.adrenaTexture = textureLoader.load(CONFIG.textures.adrena);

    // Load Ship GLB
    const gltfLoader = new GLTFLoader(this.loadingManager);

    // Setup Draco
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load('./assets/models/nave.glb', (gltf) => {
      this.shipModel = gltf.scene;
      this.shipAnimations = gltf.animations; // Capture animations
      // Traverse to enable shadows if needed
      this.shipModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Ensure materials are envMap compliant
          if (child.material) {
            child.material.envMapIntensity = 1.0;
          }
        }
      });
    });

    // Load Temple C GLB (Replaces CursoC)
    gltfLoader.load('./assets/models/templeC.glb', (gltf) => {
      console.log("TempleC Loaded!");
      this.templeCModel = gltf.scene;
      this.templeAnimations = gltf.animations;

      this.templeCModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.envMapIntensity = 1.0;
          }
        }
      });
    });

    // Load Alien Creature GLB (Replaces PerfilWeb)
    gltfLoader.load('./assets/models/alien_creature.glb?v=NEW_ALIEN_UPDATE', (gltf) => {
      console.log("Alien Creature Loaded Successfully!");
      this.alienCreatureModel = gltf.scene;
      this.alienAnimations = gltf.animations; // Capture animations

      this.alienCreatureModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.envMapIntensity = 1.0;
          }
        }
      });
    }, undefined, (error) => {
      console.error("ERROR LOADING ALIEN CREATURE:", error);
    });

    // Load Transition Loop GLB
    gltfLoader.load('./assets/models/loops.glb', (gltf) => {
      console.log("Transition Loops Loaded!");
      this.transitionModel = gltf.scene;
      this.transitionAnimations = gltf.animations;
    });

    // Load Alien Sci-Fi Adrena (REMOVED REQUEST)
    // gltfLoader.load('./assets/models/alien_sci_fi_adrena.glb', ...);

    // Load Planetary Ships for Orbit flyby
    this.planetShips = [null, null, null, null, null, null];
    const shipFiles = [
      'navePlanetaria1.glb', 'navePlanetaria2.glb',
      'navePlanetaria5.glb', 'navePlanetaria6.glb'
    ];
    shipFiles.forEach((file, index) => {
      gltfLoader.load(`./assets/models/${file}`, (gltf) => {
        console.log(`Planet Ship ${index + 1} Loaded!`);
        const ship = gltf.scene;

        // --- NORMALIZE GEOMETRY (Fix Offsets & Sizes) ---
        const box = new THREE.Box3().setFromObject(ship);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // 1. Center the Mesh
        // We move the whole scene content so (0,0,0) is the center
        ship.position.sub(center);

        // Wrap in a parent to freeze this centering
        const wrapper = new THREE.Group();
        wrapper.add(ship);

        // 2. Normalize Scale (Target Size = 10 units)
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scaleFactor = 10.0 / maxDim;
          wrapper.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }

        // Optimize Materials
        wrapper.traverse((c) => {
          if (c.isMesh) {
            c.castShadow = true;
            if (c.material) c.material.envMapIntensity = 1.0;
          }
        });

        this.planetShips[index] = wrapper;
      }, undefined, (err) => console.error(`Error loading ${file}`, err));
    });

    this.moonTexture.wrapS = this.moonTexture.wrapT = THREE.RepeatWrapping;
    if (this.moonNormalMap) {
      this.moonNormalMap.wrapS = this.moonNormalMap.wrapT = THREE.RepeatWrapping;
    }

    const cubeLoader = new THREE.CubeTextureLoader(this.loadingManager);
    this.envMap = cubeLoader.load([
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/Bridge2/posx.jpg",
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/Bridge2/negx.jpg",
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/Bridge2/posy.jpg",
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/Bridge2/negy.jpg",
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/Bridge2/posz.jpg",
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/Bridge2/negz.jpg",
    ]);
    this.envMap.colorSpace = THREE.SRGBColorSpace;
  }

  setupScenes() {
    this.orbitData = createOrbitScene(this.renderer, this.moonTexture, this.moonNormalMap, this.planetShips);
    this.surfaceData = createSurfaceScene(
      this.renderer,
      this.envMap,
      this.moonTexture,
      this.moonNormalMap,
      this.adrenaTexture,
      this.shipModel,
      this.shipAnimations,
      this.templeCModel,
      this.templeAnimations,
      this.alienCreatureModel,
      this.alienAnimations
      // this.adrenaAlienModel,      // New Prop (REMOVED)
      // this.adrenaAlienAnimations  // New Prop (REMOVED)
    );

    // Initial View State
    this.showOrbitView();
  }

  setupEvents() {
    if (this.ui.backButton) this.ui.backButton.addEventListener("click", () => this.showOrbitView());
    if (this.ui.mobileBackButton) this.ui.mobileBackButton.addEventListener("click", () => this.showOrbitView());

    window.addEventListener("resize", () => this.onResize());

    // Raycasting for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener("click", (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.viewMode === "orbit") {
        raycaster.setFromCamera(mouse, this.orbitData.camera);
        // Recursive check in case 'planet' is a Group
        const intersects = raycaster.intersectObject(this.orbitData.planet, true);

        if (intersects.length > 0) {
          console.log("Planet Clicked. Transitioning to Surface View.");
          this.showSurfaceView();
        }
      } else {
        raycaster.setFromCamera(mouse, this.surfaceData.camera);
        const intersects = raycaster.intersectObjects(this.surfaceData.scene.children, true);
        if (intersects.length > 0) {
          // Link Logic
          let target = intersects[0].object;

          // Traverse up to find the object holding the userdata
          while (target && !target.userData.isLink && !target.userData.isAlienLink && target.parent) {
            target = target.parent;
          }

          if (target) {
            // Special Alien Transition Link
            if (target.userData.isAlienLink) {
              this.playTransitionAndRedirect(target.userData.url);
            }
            // Standard Link
            else if (target.userData.isLink) {
              window.open(target.userData.url, "_blank");
            }
          }
        }
      }
    });
  }

  showOrbitView() {
    this.viewMode = "orbit";
    this.ui.infoText.innerText = "Clique no planeta para aterrizar.";
    this.ui.backButton.style.display = "none";
    this.ui.colonyLabel.style.display = "none";
    if (this.ui.mobileControls) this.ui.mobileControls.style.display = "none";
  }

  showSurfaceView() {
    this.viewMode = "surface";
    this.ui.infoText.innerText = "Mova o Cybertruck pelas crateras.";
    this.ui.backButton.style.display = "block";
    if (this.ui.mobileControls) this.ui.mobileControls.style.display = "flex";
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);

    if (this.orbitData) {
      this.orbitData.camera.aspect = w / h;
      this.orbitData.camera.updateProjectionMatrix();
    }
    if (this.surfaceData) {
      this.surfaceData.camera.aspect = w / h;
      this.surfaceData.camera.updateProjectionMatrix();
    }
  }

  playTransitionAndRedirect(url) {
    console.log("Starting Transition to:", url);

    // 1. Check if model is loaded
    if (!this.transitionModel) {
      console.warn("Transition Model not loaded yet. Redirecting immediately.");
      window.location.href = url;
      return;
    }

    // 2. Setup Transition Scene (Quick and Dirty: Overlay Scene)
    this.viewMode = "transition";
    this.transitionScene = new THREE.Scene();
    this.transitionScene.background = new THREE.Color(0x000000);

    // Camera for transition (Fixed)
    const aspect = window.innerWidth / window.innerHeight;
    this.transitionCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    this.transitionCamera.position.set(0, 0, 5); // Adjust based on model size

    // Add Model
    const model = this.transitionModel.clone();

    // Auto-Scale Model to fit screen??? 
    // Let's assume model is centered.
    model.position.set(0, -1, 0); // Center?
    // model.scale.set(1, 1, 1);

    this.transitionScene.add(model);

    // Add Lights
    const ambient = new THREE.AmbientLight(0xffffff, 2.0);
    this.transitionScene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 3.0);
    dirLight.position.set(0, 2, 5);
    this.transitionScene.add(dirLight);

    // Animation
    this.transitionMixer = new THREE.AnimationMixer(model);
    if (this.transitionAnimations && this.transitionAnimations.length > 0) {
      console.log("Playing Transition Animation...");
      const action = this.transitionMixer.clipAction(this.transitionAnimations[0]);
      action.setLoop(THREE.LoopOnce); // Play ONCE
      action.clampWhenFinished = true;
      action.play();

      // Redirect on Finish
      this.transitionMixer.addEventListener('finished', () => {
        console.log("Animation Finished. Redirecting...");
        window.location.href = url;
      });
    } else {
      // No animation? Just show for 2 seconds then redirect
      setTimeout(() => {
        window.location.href = url;
      }, 2000);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    try {
      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime();

      if (this.viewMode === "transition") {
        if (this.transitionMixer) {
          this.transitionMixer.update(delta);
        }
        this.renderer.render(this.transitionScene, this.transitionCamera);
      }
      else if (this.viewMode === "orbit") {
        if (this.orbitData) {
          this.orbitData.planet.rotation.y += 0.002;
          this.orbitData.planet.rotation.x += 0.0005;
          this.orbitData.stars.rotation.y += 0.0001;
          if (this.orbitData.planet.userData.update) {
            // Pass delta (approx 1/60) for physics
            this.orbitData.planet.userData.update(time, 0.016);
          }
          this.orbitData.controls.update();
          this.renderer.render(this.orbitData.scene, this.orbitData.camera);
        }
      } else {
        if (this.surfaceData) {
          // Update Rover
          this.surfaceData.rover.update(delta, this.inputManager, this.surfaceData.collidableObjects);

          // Camera Follow
          const roverMesh = this.surfaceData.rover.mesh;
          const offset = new THREE.Vector3(0, 5, 12).applyQuaternion(roverMesh.quaternion);
          const lookat = new THREE.Vector3(0, 2, 0).applyQuaternion(roverMesh.quaternion);

          this.surfaceData.camera.position.lerp(roverMesh.position.clone().add(offset), 0.1);
          this.surfaceData.camera.lookAt(roverMesh.position.clone().add(lookat));

          // Animate Antenna
          if (this.surfaceData.antennaLight) {
            this.surfaceData.antennaLight.material.opacity = (Math.sin(time * 5) + 1) / 2;
          }

          // Update animated objects in scene (like AdrenaSign)
          this.surfaceData.scene.children.forEach(child => {
            if (child.userData && typeof child.userData.update === 'function') {
              child.userData.update(delta, time);
            }
          });

          // Update Alien Animation
          if (this.surfaceData.alienMixer) {
            this.surfaceData.alienMixer.update(delta);
          }

          // Update Temple Animation
          if (this.surfaceData.templeMixer) {
            this.surfaceData.templeMixer.update(delta);
          }

          // Update Ship Animation
          if (this.surfaceData.shipMixer) {
            this.surfaceData.shipMixer.update(delta);
          }

          this.renderer.render(this.surfaceData.scene, this.surfaceData.camera);
        }
      }
    } catch (e) {
      console.error("ANIMATION LOOP ERROR:", e);
      // Only show error once to avoid flooding
      if (!this.hasShownError) {
        this.ui.infoText.innerHTML = `ERROR: ${e.message}`;
        this.ui.infoText.style.color = 'red';
        this.hasShownError = true;
      }
    }
  }
}

// Start App
new App();
