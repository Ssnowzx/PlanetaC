// Custom pseudo-random noise (simple hash)
function hash(x, y) {
  let h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return h - Math.floor(h);
}

// Simple Noise (kept for minimal variance if needed, or unused)
function noise(x, y) {
  return hash(Math.floor(x), Math.floor(y));
}

export function getGroundHeight(x, y) {
  // Standard Lunar Undulation (Smooth & Rolling)
  // Back to simple sine waves for that "classic" uneven moon surface
  let z = (Math.sin(x * 0.04) + Math.cos(y * 0.04)) * 2;
  z += Math.sin(x * 0.15) * Math.cos(y * 0.15) * 0.8;

  return z;
}
