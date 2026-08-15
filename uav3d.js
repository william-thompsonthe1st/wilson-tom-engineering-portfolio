import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas = document.querySelector('#uav3d');
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
camera.position.set(0, 3.5, 7.5);
camera.lookAt(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xbfeaff, 0x101922, 1.8));
const key = new THREE.DirectionalLight(0xdff6ff, 2.5); key.position.set(-4, 6, 4); scene.add(key);
const rim = new THREE.PointLight(0x38b9ff, 11, 10); rim.position.set(2.7, 1.8, -3); scene.add(rim);

const cadUav = new THREE.Group();
const modelScale = 1.14;
cadUav.scale.setScalar(modelScale);

const texture = new THREE.TextureLoader().load('uav-topdown.png');
texture.colorSpace = THREE.SRGBColorSpace;
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

// This is intentionally the same art board used in the overhead inspection.
// It keeps the hangar model's silhouette one-to-one with the blueprint view.
const planform = new THREE.Mesh(
  new THREE.PlaneGeometry(4.05, 4.05),
  new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.98, depthWrite: false, side: THREE.DoubleSide }),
);
planform.rotation.x = -Math.PI / 2;
planform.position.y = 0.06;
cadUav.add(planform);

const wireMaterial = new THREE.LineBasicMaterial({ color: 0xa6efff, transparent: true, opacity: 0.82 });
const dimWireMaterial = new THREE.LineBasicMaterial({ color: 0x4c9ebc, transparent: true, opacity: 0.7 });
function line(points, material = wireMaterial) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, z]) => new THREE.Vector3(x, 0.09, z)));
  cadUav.add(new THREE.Line(geometry, material));
}

// A restrained technical overlay: planform, spar, and datum lines echo a CAD viewport
// without inventing a different UAV shape.
line([[0, -1.82], [0, 1.58]], dimWireMaterial);
line([[-1.58, -0.07], [1.58, -0.07]], dimWireMaterial);
line([[-1.52, 0.18], [-0.22, 0.18], [-0.14, 1.1], [-0.54, 1.5]], wireMaterial);
line([[1.52, 0.18], [0.22, 0.18], [0.14, 1.1], [0.54, 1.5]], wireMaterial);
line([[-1.14, -0.28], [1.14, -0.28]], dimWireMaterial);
line([[-0.94, 0.43], [0.94, 0.43]], dimWireMaterial);

const datum = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.PlaneGeometry(4.14, 4.14)),
  new THREE.LineBasicMaterial({ color: 0x68cbeb, transparent: true, opacity: 0.2 }),
);
datum.rotation.x = -Math.PI / 2;
datum.position.y = 0.02;
cadUav.add(datum);

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.58, 44),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }),
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = -0.18;
scene.add(shadow);

cadUav.position.set(0, 3.8, 10);
cadUav.rotation.set(-0.22, 0, 0);
scene.add(cadUav);

let yaw = 0;
let pitch = -0.035;
let targetYaw = 0;
let targetPitch = -0.035;
let landingStart = performance.now() + 850;
let landed = false;
let pointerDown = false;
let moved = false;
let lastX = 0;
let lastY = 0;

function resize() {
  const { width, height } = canvas.getBoundingClientRect();
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

canvas.addEventListener('pointerdown', (event) => {
  pointerDown = true;
  moved = false;
  lastX = event.clientX;
  lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!pointerDown || !landed) return;
  const dx = event.clientX - lastX;
  const dy = event.clientY - lastY;
  if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
  targetYaw += dx * 0.012;
  targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.005, -0.34, 0.14);
  lastX = event.clientX;
  lastY = event.clientY;
});

canvas.addEventListener('pointerup', (event) => {
  pointerDown = false;
  if (!moved && landed) document.querySelector('.drone-hit')?.click();
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});

function frame(now) {
  const progress = THREE.MathUtils.clamp((now - landingStart) / 2200, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 4);
  cadUav.position.set(0, THREE.MathUtils.lerp(3.8, -0.01, eased), THREE.MathUtils.lerp(10, 0, eased));
  cadUav.scale.setScalar(THREE.MathUtils.lerp(modelScale * 0.24, modelScale, eased));
  if (!landed) targetYaw += 0.0018;
  yaw += (targetYaw - yaw) * 0.085;
  pitch += (targetPitch - pitch) * 0.085;
  cadUav.rotation.set(pitch, yaw, 0);
  if (progress === 1) landed = true;
  shadow.scale.setScalar(THREE.MathUtils.lerp(0.25, 1, eased));
  shadow.material.opacity = THREE.MathUtils.lerp(0.02, 0.25, eased);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
