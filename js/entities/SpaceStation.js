import * as THREE from 'three';

export function createSpaceStation() {
  const colonyGroup = new THREE.Group();

  // Materials
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    roughness: 0.4,
    metalness: 0.6,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2,
  });
  const windowMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaddff,
    metalness: 0.9,
    roughness: 0.05,
    transmission: 0.9,
    transparent: true,
    opacity: 0.7,
  });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

  // 1. Central Command Hub (Large Octagon + Dome)
  const hubGeo = new THREE.CylinderGeometry(12, 14, 8, 8); // Octagon
  const hub = new THREE.Mesh(hubGeo, baseMat);
  hub.position.y = 4;
  hub.castShadow = true;
  hub.receiveShadow = true;

  // Strip lighting on Hub
  const stripeGeo = new THREE.CylinderGeometry(12.1, 12.1, 0.5, 8);
  const stripe = new THREE.Mesh(stripeGeo, glowMat);
  stripe.position.y = 2;
  hub.add(stripe);

  // Huge Dome on top
  const domeGeo = new THREE.SphereGeometry(10, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, windowMat);
  dome.position.y = 4;
  hub.add(dome);

  // Hub Interior light
  const innerLight = new THREE.PointLight(0x00ffff, 20, 30);
  innerLight.position.y = 8;
  hub.add(innerLight);

  colonyGroup.add(hub);

  // 2. Corridors and Labs
  const corridorGeo = new THREE.CylinderGeometry(2.5, 2.5, 18, 8);
  corridorGeo.rotateZ(Math.PI / 2);

  const labGeo = new THREE.CylinderGeometry(6, 6, 12, 16);
  labGeo.rotateZ(Math.PI / 2);

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const armGroup = new THREE.Group();

    // Corridor
    const corr = new THREE.Mesh(corridorGeo, darkMat);
    corr.position.set(12, 2, 0);
    armGroup.add(corr);

    // Lab Module
    const lab = new THREE.Mesh(labGeo, baseMat);
    lab.position.set(24, 4, 0);
    lab.castShadow = true;
    lab.receiveShadow = true;

    // Lab details
    const ventGeo = new THREE.BoxGeometry(3, 1, 8);
    const vent = new THREE.Mesh(ventGeo, darkMat);
    vent.position.y = 6.2;
    lab.add(vent);

    const sideWinGeo = new THREE.PlaneGeometry(1.5, 3);
    const sideWin = new THREE.Mesh(sideWinGeo, windowMat);
    sideWin.position.set(3, 1, 5.8);
    sideWin.rotation.x = -Math.PI / 6;
    lab.add(sideWin);
    const sideWin2 = sideWin.clone();
    sideWin2.position.z = -5.8;
    sideWin2.rotation.x = Math.PI / 6;
    sideWin2.rotation.y = Math.PI;
    lab.add(sideWin2);

    armGroup.add(lab);

    // Supports
    const legGeo = new THREE.CylinderGeometry(0.5, 0.5, 8);
    const leg = new THREE.Mesh(legGeo, darkMat);
    leg.position.set(24, 0, 0);
    armGroup.add(leg);

    armGroup.rotation.y = angle;
    colonyGroup.add(armGroup);
  }

  // 3. Comms Tower
  const towerGroup = new THREE.Group();
  const mastGeo = new THREE.CylinderGeometry(0.8, 2, 35, 8);
  const mast = new THREE.Mesh(mastGeo, baseMat);
  mast.position.y = 17.5;
  towerGroup.add(mast);

  const dishGeo = new THREE.ConeGeometry(5, 2, 32, 1, true);
  const dish1 = new THREE.Mesh(dishGeo, baseMat);
  dish1.position.set(0, 32, 2);
  dish1.rotation.x = -Math.PI / 4;

  const dishCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2), darkMat);
  dishCenter.rotation.x = -Math.PI / 2;
  dishCenter.position.y = -1;
  dish1.add(dishCenter);

  towerGroup.add(dish1);

  const dish2 = dish1.clone();
  dish2.position.set(0, 26, -2);
  dish2.rotation.x = Math.PI / 5;
  dish2.scale.set(0.6, 0.6, 0.6);
  towerGroup.add(dish2);

  const antennaLight = new THREE.Mesh(
    new THREE.SphereGeometry(1),
    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true })
  );
  antennaLight.position.y = 35;
  towerGroup.add(antennaLight);

  const towerBase = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 6), darkMat);
  towerBase.position.y = 1;
  towerGroup.add(towerBase);

  towerGroup.position.set(-35, 0, -35);
  colonyGroup.add(towerGroup);

  colonyGroup.position.set(30, -1, -60);

  // Return both group and light so we can animate it
  return { mesh: colonyGroup, antennaLight };
}
