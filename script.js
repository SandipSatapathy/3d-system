import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// ==========================================
// 1. CONFIGURATION & STATE
// ==========================================
const PARTICLE_COUNT = 15000;
const BASE_RADIUS = 12;

// Physics / Particle State Arrays
const positions = new Float32Array(PARTICLE_COUNT * 3);
const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
const velocities = new Float32Array(PARTICLE_COUNT * 3);
const baseColors = new Float32Array(PARTICLE_COUNT * 3);
const targetColors = new Float32Array(PARTICLE_COUNT * 3);

let currentShapeIndex = 0;
let currentColorIndex = 0;

// Interaction Variables
let pinchExpansion = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let globalScale = 1.0;
let targetGlobalScale = 1.0;
let isBlackHole = false;

// Dual Hand Pointer State
let pointers = [
  { isPointing: false, x: 0, y: 0 },
  { isPointing: false, x: 0, y: 0 },
];

// Colors - Now using Gradients!
const THEMES = [
  { c1: 0x00ffcc, c2: 0x0022ff }, // Cyan to Deep Blue
  { c1: 0xff0077, c2: 0xffaa00 }, // Cyberpunk Pink to Gold
  { c1: 0xffbb00, c2: 0xff0000 }, // Gold to Fire Red
  { c1: 0xaa00ff, c2: 0x00ffcc }, // Purple to Cyan
  { c1: 0xffffff, c2: 0x444444 }, // White to Silver
];

// ==========================================
// 2. THREE.JS SETUP
// ==========================================
const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.02);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 40;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// POST-PROCESSING (BLOOM)
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85,
);
bloomPass.threshold = 0;
bloomPass.strength = 1.2;
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Particle Texture (Soft Glowing Dot)
function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.8)");
  gradient.addColorStop(0.7, "rgba(255,255,255,0.2)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
// We will assign base color variations per particle
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const intensity = 0.5 + Math.random() * 0.5;
  baseColors[i * 3] = intensity;
  baseColors[i * 3 + 1] = intensity;
  baseColors[i * 3 + 2] = intensity;
}
geometry.setAttribute("color", new THREE.BufferAttribute(baseColors, 3));

const material = new THREE.PointsMaterial({
  size: 0.6,
  map: createGlowTexture(),
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  vertexColors: true,
  color: new THREE.Color(0xffffff), // Pure white tint to let vertex gradients shine
});

const particleSystem = new THREE.Points(geometry, material);
scene.add(particleSystem);

// Ambient movement group
const group = new THREE.Group();
group.add(particleSystem);
scene.add(group);

// ==========================================
// 3. SHAPE GENERATORS
// ==========================================
const Shapes = {
  Sphere: () => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
      const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
      const r = BASE_RADIUS + (Math.random() * 2 - 1);
      arr[i * 3] = r * Math.cos(theta) * Math.sin(phi);
      arr[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  },
  Heart: () => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = Math.random() * Math.PI * 2;
      const scale = 0.8 + Math.random() * 0.4;
      // Heart math equation
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      arr[i * 3] = x * 0.6 * scale;
      arr[i * 3 + 1] = y * 0.6 * scale;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  },
  Flower: () => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = Math.random() * Math.PI * 2;
      const petals = 5;
      // Rose curve
      const r =
        BASE_RADIUS *
        Math.abs(Math.cos((petals * t) / 2)) *
        (0.5 + Math.random() * 0.5);
      arr[i * 3] = r * Math.cos(t);
      arr[i * 3 + 1] = r * Math.sin(t);
      arr[i * 3 + 2] = Math.sin(petals * t) * 4 + (Math.random() - 0.5) * 2;
    }
    return arr;
  },
  Saturn: () => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (Math.random() < 0.25) {
        // Center Planet
        const phi = Math.acos(-1 + 2 * Math.random());
        const theta = 2 * Math.PI * Math.random();
        const r = 5 * Math.cbrt(Math.random());
        arr[i * 3] = r * Math.cos(theta) * Math.sin(phi);
        arr[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
        arr[i * 3 + 2] = r * Math.cos(phi);
      } else {
        // Ring
        const t = Math.random() * Math.PI * 2;
        const r = 8 + Math.random() * 8;
        arr[i * 3] = r * Math.cos(t);
        arr[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
        arr[i * 3 + 2] = r * Math.sin(t);
      }
    }
    // Tilt Saturn slightly
    const tilt = 0.4;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y = arr[i * 3 + 1];
      const z = arr[i * 3 + 2];
      arr[i * 3 + 1] = y * Math.cos(tilt) - z * Math.sin(tilt);
      arr[i * 3 + 2] = y * Math.sin(tilt) + z * Math.cos(tilt);
    }
    return arr;
  },
  Fireworks: () => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    const bursts = [
      { x: -10, y: 8, z: -5 },
      { x: 10, y: 10, z: 2 },
      { x: 0, y: -5, z: 8 },
      { x: -8, y: -10, z: -2 },
      { x: 12, y: -2, z: -8 },
    ];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const burst = bursts[Math.floor(Math.random() * bursts.length)];
      const phi = Math.acos(-1 + 2 * Math.random());
      const theta = 2 * Math.PI * Math.random();
      // concentrate more particles at edges of bursts
      const r = 6 * Math.pow(Math.random(), 0.3);
      arr[i * 3] = burst.x + r * Math.cos(theta) * Math.sin(phi);
      arr[i * 3 + 1] = burst.y + r * Math.sin(theta) * Math.sin(phi);
      arr[i * 3 + 2] = burst.z + r * Math.cos(phi);
    }
    return arr;
  },
  Galaxy: () => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const arms = 3;
      const armOffset = (i % arms) * ((Math.PI * 2) / arms);
      const distance = Math.pow(Math.random(), 2) * 25; // Concentrate near center
      const angle = distance * 0.5 + armOffset;

      const randomOffsetX = (Math.random() - 0.5) * (2 + distance * 0.1);
      const randomOffsetY = (Math.random() - 0.5) * (2 + distance * 0.1);
      const randomOffsetZ = (Math.random() - 0.5) * 4;

      arr[i * 3] = Math.cos(angle) * distance + randomOffsetX;
      arr[i * 3 + 1] = Math.sin(angle) * distance + randomOffsetY;
      arr[i * 3 + 2] = randomOffsetZ * Math.exp(-distance * 0.05); // Flatter at edges
    }
    return arr;
  },
  DNA: () => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = (i / PARTICLE_COUNT) * Math.PI * 10 - Math.PI * 5; // Height
      const radius = 6;
      const isStrandA = Math.random() > 0.5;
      const isBridge = Math.random() > 0.8;

      if (isBridge) {
        const bridgeT =
          (Math.floor((i / PARTICLE_COUNT) * 40) / 40) * Math.PI * 10 -
          Math.PI * 5;
        const lerp = Math.random() * 2 - 1; // -1 to 1
        arr[i * 3] = Math.cos(bridgeT) * radius * lerp;
        arr[i * 3 + 1] = bridgeT * 3;
        arr[i * 3 + 2] = Math.sin(bridgeT) * radius * lerp;
      } else {
        const offset = isStrandA ? 0 : Math.PI;
        arr[i * 3] =
          Math.cos(t + offset) * radius + (Math.random() - 0.5) * 0.5;
        arr[i * 3 + 1] = t * 3 + (Math.random() - 0.5) * 0.5;
        arr[i * 3 + 2] =
          Math.sin(t + offset) * radius + (Math.random() - 0.5) * 0.5;
      }
    }
    return arr;
  },
  Tesseract: () => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let x = (Math.random() - 0.5) * 20;
      let y = (Math.random() - 0.5) * 20;
      let z = (Math.random() - 0.5) * 20;
      // Push points out towards the surface of the cube
      const max = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
      x *= 10 / max;
      y *= 10 / max;
      z *= 10 / max;

      // Add some inner volume dust
      if (Math.random() > 0.8) {
        x *= Math.random();
        y *= Math.random();
        z *= Math.random();
      }

      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    return arr;
  },
  Vortex: () => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = Math.random() * Math.PI * 10;
      const r = 1 + t * 0.8 + (Math.random() - 0.5) * 3;
      arr[i * 3] = Math.cos(t * 2.5) * r;
      arr[i * 3 + 1] = t * 2.5 - 12;
      arr[i * 3 + 2] = Math.sin(t * 2.5) * r;
    }
    return arr;
  },
};

const shapeKeys = Object.keys(Shapes);

function applyTheme() {
  const theme = THEMES[currentColorIndex];
  const color1 = new THREE.Color(theme.c1);
  const color2 = new THREE.Color(theme.c2);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;
    // Determine gradient mix based on distance from center
    const dist = Math.sqrt(
      targetPositions[idx] ** 2 +
        targetPositions[idx + 1] ** 2 +
        targetPositions[idx + 2] ** 2,
    );
    const normalizedDist = Math.min(dist / 20, 1);

    const mixed = color1.clone().lerp(color2, normalizedDist);
    const intensity = 0.4 + Math.random() * 0.6; // Preserves twinkling noise

    targetColors[idx] = mixed.r * intensity;
    targetColors[idx + 1] = mixed.g * intensity;
    targetColors[idx + 2] = mixed.b * intensity;
  }
}

function setShape(index) {
  const newPositions = Shapes[shapeKeys[index]]();
  for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
    targetPositions[i] = newPositions[i];
  }
  applyTheme();
}

// Init initial shape
setShape(0);
// Start particles randomly so they fly into the first shape
for (let i = 0; i < PARTICLE_COUNT * 3; i++)
  positions[i] = (Math.random() - 0.5) * 100;

// UI Feedback
function showFeedback(text) {
  const el = document.getElementById("action-feedback");
  el.innerText = text;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1500);
}

// ==========================================
// 4. ANIMATION & PHYSICS LOOP
// ==========================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  const time = clock.getElapsedTime();

  // Global scale smoothing (for dual pinch zoom)
  globalScale += (targetGlobalScale - globalScale) * 0.1;

  // Smooth camera rotation based on hand position
  group.rotation.x += (targetRotationX - group.rotation.x) * 0.05;
  group.rotation.y += (targetRotationY - group.rotation.y) * 0.05;

  // Slow ambient rotation
  particleSystem.rotation.y = time * 0.1;
  particleSystem.rotation.z = time * 0.05;

  // Physics Loop for Particles
  const posArray = geometry.attributes.position.array;
  const colorArray = geometry.attributes.color.array;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;

    let tx = targetPositions[idx] * globalScale;
    let ty = targetPositions[idx + 1] * globalScale;
    let tz = targetPositions[idx + 2] * globalScale;

    let cx = posArray[idx];
    let cy = posArray[idx + 1];
    let cz = posArray[idx + 2];

    // Smoothly lerp vertex colors to target theme colors
    colorArray[idx] += (targetColors[idx] - colorArray[idx]) * 0.05;
    colorArray[idx + 1] += (targetColors[idx + 1] - colorArray[idx + 1]) * 0.05;
    colorArray[idx + 2] += (targetColors[idx + 2] - colorArray[idx + 2]) * 0.05;

    // Black Hole Effect Override
    if (isBlackHole) {
      // Pull to center and swirl rapidly
      tx = -cy * 0.5;
      ty = cx * 0.5;
      tz = 0;
      // Increase speed slightly during blackhole
      tx *= 1.5;
      ty *= 1.5;
    }

    // Apply Pinch Expansion (Push outwards from center)
    if (pinchExpansion > 0.01 && !isBlackHole) {
      const dist = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
      const expansionFactor = pinchExpansion * 30; // Max push distance
      tx += (tx / dist) * expansionFactor;
      ty += (ty / dist) * expansionFactor;
      tz += (tz / dist) * expansionFactor;
    }

    // Apply Pointer Repulsors (Two Hands Support)
    for (let p = 0; p < pointers.length; p++) {
      if (pointers[p].isPointing) {
        const dx = cx - pointers[p].x;
        const dy = cy - pointers[p].y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 200) {
          // Repulsion radius
          const force = 200 / (distSq + 1);
          tx += dx * force * 0.15;
          ty += dy * force * 0.15;
        }
      }
    }

    // Add slight organic noise
    tx += Math.sin(time * 2 + i) * 0.2;
    ty += Math.cos(time * 2.5 + i) * 0.2;

    let vx = velocities[idx];
    let vy = velocities[idx + 1];
    let vz = velocities[idx + 2];

    // Spring force towards target
    vx += (tx - cx) * 0.02;
    vy += (ty - cy) * 0.02;
    vz += (tz - cz) * 0.02;

    // Damping / Friction
    vx *= 0.85;
    vy *= 0.85;
    vz *= 0.85;

    posArray[idx] = cx + vx;
    posArray[idx + 1] = cy + vy;
    posArray[idx + 2] = cz + vz;

    velocities[idx] = vx;
    velocities[idx + 1] = vy;
    velocities[idx + 2] = vz;
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true; // Tell GPU colors changed
  composer.render();
}

// ==========================================
// 5. MEDIAPIPE HAND TRACKING & GESTURES
// ==========================================
const videoElement = document.getElementById("webcam");
const canvasElement = document.getElementById("video-preview");
const canvasCtx = canvasElement.getContext("2d");
const statusText = document.getElementById("status-text");
const loader = document.getElementById("loader");

const startOverlay = document.getElementById("start-overlay");
const startBtn = document.getElementById("start-btn");
const errorMsg = document.getElementById("error-msg");

let lastGestureTime = 0;
const GESTURE_COOLDOWN = 1200; // ms

// Utility: Distance between two 3D landmarks
function getDistance(l1, l2) {
  const dx = l1.x - l2.x;
  const dy = l1.y - l2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Hand posture heuristics
function analyzeHand(landmarks) {
  const wrist = landmarks[0];

  // Check if fingers are extended (Tip distance to wrist > PIP distance to wrist)
  const isThumbExt =
    getDistance(landmarks[4], wrist) > getDistance(landmarks[2], wrist);
  const isIndexExt =
    getDistance(landmarks[8], wrist) > getDistance(landmarks[6], wrist);
  const isMiddleExt =
    getDistance(landmarks[12], wrist) > getDistance(landmarks[10], wrist);
  const isRingExt =
    getDistance(landmarks[16], wrist) > getDistance(landmarks[14], wrist);
  const isPinkyExt =
    getDistance(landmarks[20], wrist) > getDistance(landmarks[18], wrist);

  // Pinch calculation (Thumb tip to Index tip)
  const pinchDist = getDistance(landmarks[4], landmarks[8]);

  // Gestures
  const isFist = !isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt;
  const isPeace = isIndexExt && isMiddleExt && !isRingExt && !isPinkyExt;
  const isPointing = isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt;

  return { isFist, isPeace, isPointing, pinchDist };
}

function onResults(results) {
  // Draw Preview
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height,
  );

  // Reset frame state
  let maxPinchThisFrame = 0;
  let avgWristX = 0;
  let avgWristY = 0;
  let numHands = 0;
  let fistCount = 0;
  let anyPeace = false;

  let isPinching1 = false;
  let isPinching2 = false;
  let wrist1 = null;
  let wrist2 = null;

  pointers[0].isPointing = false;
  pointers[1].isPointing = false;

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];

      // Draw skeleton on preview - different colors for each hand
      const handColor = i === 0 ? "#00ffcc" : "#ff0077";
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: handColor,
        lineWidth: 2,
      });
      drawLandmarks(canvasCtx, landmarks, {
        color: "#ffffff",
        lineWidth: 1,
        radius: 2,
      });

      const handState = analyzeHand(landmarks);
      numHands++;
      avgWristX += landmarks[0].x;
      avgWristY += landmarks[0].y;

      if (handState.isFist) fistCount++;
      if (handState.isPeace) anyPeace = true;

      // 1. Pinch to Expand (single hand) & Pinch Tracking
      if (!handState.isFist && !handState.isPeace) {
        let targetPinch = Math.max(0, (0.15 - handState.pinchDist) * 10);
        targetPinch = Math.min(1.5, targetPinch);
        if (targetPinch > maxPinchThisFrame) maxPinchThisFrame = targetPinch;

        // Track pinches specifically for scaling
        if (handState.pinchDist < 0.06) {
          if (i === 0) {
            isPinching1 = true;
            wrist1 = landmarks[0];
          }
          if (i === 1) {
            isPinching2 = true;
            wrist2 = landmarks[0];
          }
        }
      }

      // 3. Pointing Repulsor
      if (handState.isPointing && i < 2) {
        pointers[i].isPointing = true;
        pointers[i].x = (landmarks[8].x - 0.5) * 60;
        pointers[i].y = -(landmarks[8].y - 0.5) * 60; // Invert Y
      }
    }

    pinchExpansion += (maxPinchThisFrame - pinchExpansion) * 0.1; // Smooth lerp
    isBlackHole = fistCount === 2;

    // Dual Pinch Scale/Zoom Tracking
    if (isPinching1 && isPinching2 && wrist1 && wrist2 && numHands === 2) {
      const handsDist = getDistance(wrist1, wrist2);
      // Map screen distance (0.1 to ~0.8) to scale multiplier (0.3x to 2.5x)
      targetGlobalScale = Math.max(0.3, handsDist * 2.5);
    } else {
      targetGlobalScale = 1.0; // Return to normal scale if not pinching with both
    }

    // 2. Map Hand Position to Scene Rotation (Average of visible hands)
    avgWristX /= numHands;
    avgWristY /= numHands;
    targetRotationY = (avgWristX - 0.5) * Math.PI * 1.5;
    targetRotationX = (avgWristY - 0.5) * Math.PI;

    // 4. Discrete Gestures (Debounced)
    const now = performance.now();
    if (now - lastGestureTime > GESTURE_COOLDOWN) {
      if (anyPeace) {
        currentShapeIndex = (currentShapeIndex + 1) % shapeKeys.length;
        setShape(currentShapeIndex);
        showFeedback(`Shape: ${shapeKeys[currentShapeIndex]}`);
        lastGestureTime = now;
      } else if (fistCount === 1) {
        // Only change color on single fist, to prevent overlap with blackhole
        currentColorIndex = (currentColorIndex + 1) % THEMES.length;
        applyTheme();
        showFeedback("Color Changed!");
        lastGestureTime = now;
      }
    }
  } else {
    // Decay interactions if hand lost
    pinchExpansion *= 0.9;
    targetRotationX *= 0.95;
    targetRotationY *= 0.95;
    targetGlobalScale = 1.0;
    isBlackHole = false;
  }
  canvasCtx.restore();
}

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  },
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6,
});
hands.onResults(onResults);

const cameraFeed = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});

// Initialize Camera on Button Click to handle Autoplay/Permission policies gracefully
startBtn.addEventListener("click", () => {
  startBtn.innerText = "Starting Camera...";
  startBtn.disabled = true;
  errorMsg.style.display = "none";
  statusText.innerText = "Requesting Camera Access...";

  cameraFeed
    .start()
    .then(() => {
      startOverlay.style.display = "none";
      loader.style.display = "none";
      statusText.innerText = "Camera Active - Tracking Ready";
      statusText.classList.add("ready");
    })
    .catch((err) => {
      startBtn.innerText = "Enable Camera & Start";
      startBtn.disabled = false;
      errorMsg.style.display = "block";

      if (
        err.name === "NotAllowedError" ||
        err.message.includes("Permission denied")
      ) {
        errorMsg.innerHTML =
          "<strong>Permission Denied:</strong> Camera access was blocked. Please allow camera access in your browser settings (look for a camera icon in your URL bar) and try again.";
      } else {
        errorMsg.innerText = "Failed to access camera: " + err.message;
      }
      console.error("Camera Init Error: ", err);
      statusText.innerText = "Camera access failed.";
    });
});

// ==========================================
// 6. RESIZE HANDLER
// ==========================================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Start 3D Loop immediately behind the overlay
animate();
