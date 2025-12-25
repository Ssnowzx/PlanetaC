import * as THREE from 'three';

export const CONFIG = {
  textures: {
    moon: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg",
    moon: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg",
    moonNormal: null, // Disabled to fix saturation/lighting issues
    adrena: "./adrena.jpg"
  },
  colors: {
    ambient: 0x404040,
    sun: 0xffffff,
    cybertruck: 0x888888,
    glass: 0x222222,
    antennaLight: 0xff0000,
    colonyMetal: 0xaaaaaa,
    colonyDark: 0x222222,
    colonyWindow: 0xffffaa,
  },
  orbit: {
    arcRadius: 8,
    tubeRadius: 3.5,
    arcAngle: Math.PI * 1.75,
  },
  vehicle: {
    speed: 35,
    steerSpeed: 1.6,
  },
};
