import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas = document.querySelector('#uav3d');
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
camera.position.set(0, 3.5, 7.5);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xd2f5ff, 0x091118, 2.1));
const key = new THREE.DirectionalLight(0xf2fbff, 3.3); key.position.set(-4, 6, 4); scene.add(key);
const rim = new THREE.PointLight(0x50cbff, 9, 10); rim.position.set(3, 2, -3); scene.add(rim);

const uav = new THREE.Group();
const modelScale = 1.14;
uav.scale.setScalar(modelScale);

// A new smooth shell, proportioned from the inspection view rather than assembled from boxes.
const shellShape = new THREE.Shape();
shellShape.moveTo(0, 1.78);
shellShape.bezierCurveTo(0.08, 1.78, 0.16, 1.62, 0.19, 1.42);
shellShape.lineTo(0.26, 0.48);
shellShape.bezierCurveTo(0.28, 0.39, 0.4, 0.35, 0.58, 0.34);
shellShape.lineTo(1.8, 0.24);
shellShape.bezierCurveTo(1.96, 0.23, 2.0, 0.12, 1.98, -0.05);
shellShape.bezierCurveTo(1.98, -0.11, 1.92, -0.14, 1.8, -0.16);
shellShape.lineTo(0.37, -0.32);
shellShape.lineTo(0.28, -0.96);
shellShape.bezierCurveTo(0.3, -1.08, 0.57, -1.3, 0.7, -1.43);
shellShape.lineTo(0.64, -1.7);
shellShape.lineTo(0.25, -1.55);
shellShape.lineTo(0.16, -1.78);
shellShape.lineTo(0, -1.84);
shellShape.lineTo(-0.16, -1.78);
shellShape.lineTo(-0.25, -1.55);
shellShape.lineTo(-0.64, -1.7);
shellShape.lineTo(-0.7, -1.43);
shellShape.bezierCurveTo(-0.57, -1.3, -0.3, -1.08, -0.28, -0.96);
shellShape.lineTo(-0.37, -0.32);
shellShape.lineTo(-1.8, -0.16);
shellShape.bezierCurveTo(-1.92, -0.14, -1.98, -0.11, -1.98, -0.05);
shellShape.bezierCurveTo(-2.0, 0.12, -1.96, 0.23, -1.8, 0.24);
shellShape.lineTo(-0.58, 0.34);
shellShape.bezierCurveTo(-0.4, 0.35, -0.28, 0.39, -0.26, 0.48);
shellShape.lineTo(-0.19, 1.42);
shellShape.bezierCurveTo(-0.16, 1.62, -0.08, 1.78, 0, 1.78);

const shellGeometry = new THREE.ExtrudeGeometry(shellShape, {
  depth: 0.3,
  bevelEnabled: true,
  bevelSegments: 6,
  bevelSize: 0.08,
  bevelThickness: 0.08,
  curveSegments: 32,
});
const shellMaterial = new THREE.MeshPhysicalMaterial({ color: 0x173b48, metalness: 0.62, roughness: 0.27, clearcoat: 0.4, clearcoatRoughness: 0.25 });
const shell = new THREE.Mesh(shellGeometry, shellMaterial);
shell.rotation.x = -Math.PI / 2;
uav.add(shell);

const inspectionTexture = new THREE.TextureLoader().load('uav-topdown.png');
inspectionTexture.colorSpace = THREE.SRGBColorSpace;
inspectionTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
// The precise inspection asset becomes the upper skin, so the CAD model stays one-to-one in plan view.
const upperSkin = new THREE.Mesh(
  new THREE.PlaneGeometry(4.05, 4.05),
  new THREE.MeshStandardMaterial({ map: inspectionTexture, transparent: true, opacity: 0.98, metalness: 0.34, roughness: 0.39, depthWrite: false, side: THREE.DoubleSide }),
);
upperSkin.rotation.x = -Math.PI / 2;
upperSkin.position.y = 0.39;
uav.add(upperSkin);

const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.58, 48), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = -0.16;
scene.add(shadow);

uav.position.set(0, 3.8, 10);
uav.rotation.set(-0.22, 0, 0);
scene.add(uav);

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
  pointerDown = true; moved = false; lastX = event.clientX; lastY = event.clientY; canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!pointerDown || !landed) return;
  const dx = event.clientX - lastX; const dy = event.clientY - lastY;
  if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
  targetYaw += dx * 0.012;
  targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.005, -0.34, 0.14);
  lastX = event.clientX; lastY = event.clientY;
});
canvas.addEventListener('pointerup', (event) => {
  pointerDown = false;
  if (!moved && landed) document.querySelector('.drone-hit')?.click();
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});

function frame(now) {
  const progress = THREE.MathUtils.clamp((now - landingStart) / 2200, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 4);
  uav.position.set(0, THREE.MathUtils.lerp(3.8, -0.01, eased), THREE.MathUtils.lerp(10, 0, eased));
  uav.scale.setScalar(THREE.MathUtils.lerp(modelScale * 0.24, modelScale, eased));
  if (!landed) targetYaw += 0.0018;
  yaw += (targetYaw - yaw) * 0.085;
  pitch += (targetPitch - pitch) * 0.085;
  uav.rotation.set(pitch, yaw, 0);
  if (progress === 1) landed = true;
  shadow.scale.setScalar(THREE.MathUtils.lerp(0.25, 1, eased));
  shadow.material.opacity = THREE.MathUtils.lerp(0.02, 0.25, eased);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
