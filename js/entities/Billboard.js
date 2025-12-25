import * as THREE from 'three';

export function createBillboard() {
  const boardGroup = new THREE.Group();

  // Base Feet
  const footGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
  const footMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const foot1 = new THREE.Mesh(footGeo, footMat);
  foot1.position.set(-1.8, 0.2, 0);
  boardGroup.add(foot1);
  const foot2 = foot1.clone();
  foot2.position.set(1.8, 0.2, 0);
  boardGroup.add(foot2);

  // Taller Posts
  const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 7);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.3 });
  const postLeft = new THREE.Mesh(postGeo, postMat);
  postLeft.position.set(-1.8, 3.5, 0);
  boardGroup.add(postLeft);

  const postRight = postLeft.clone();
  postRight.position.set(1.8, 3.5, 0);
  boardGroup.add(postRight);

  // High-tech Frame
  const frameGeo = new THREE.BoxGeometry(6.4, 3.8, 0.3);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, 7, 0);
  boardGroup.add(frame);

  // Canvas Texture - High Res & Better Art
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1024;
  canvas.height = 512;

  // Gradient Background
  const grd = ctx.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, "#0a1a2a");
  grd.addColorStop(1, "#000000");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 1024, 512);

  // Neon Border
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#00ffff";
  ctx.strokeRect(10, 10, 1004, 492);

  // Text Settings
  ctx.textAlign = "center";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#00ffff";

  // Header
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 50px Arial";
  ctx.fillText("CENTRO DE TREINAMENTO", 512, 100);

  // Main Title
  ctx.fillStyle = "#00ffff";
  ctx.font = "900 140px Arial";
  ctx.fillText("CURSO C", 512, 260);

  // Subtext
  ctx.fillStyle = "#cccccc";
  ctx.font = "italic 40px Arial";
  ctx.fillText("APRENDA A PROGRAMAR DO ZERO", 512, 350);

  // CTA
  ctx.fillStyle = "#ffff00";
  ctx.font = "bold 50px Arial";
  ctx.fillText(">>> CLIQUE PARA ACESSAR <<<", 512, 440);

  const tex = new THREE.CanvasTexture(canvas);
  const screenGeo = new THREE.PlaneGeometry(6, 3.4);
  const screenMat = new THREE.MeshBasicMaterial({ map: tex });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 7, 0.16);
  screen.userData = { isLink: true, url: "https://cursoc.vercel.app/" };
  boardGroup.add(screen);

  const signLight = new THREE.PointLight(0x00ffff, 4, 10);
  signLight.position.set(0, 8, 3);
  boardGroup.add(signLight);

  boardGroup.position.set(15, 0, -10);
  boardGroup.rotation.y = -Math.PI / 8;

  return boardGroup;
}
