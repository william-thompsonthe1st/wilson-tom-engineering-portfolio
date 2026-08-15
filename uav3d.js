import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas = document.querySelector('#uav3d');
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
camera.position.set(0, 3.5, 7.5);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xc9efff, 0x0a121b, 2.0));
const key = new THREE.DirectionalLight(0xe9f8ff, 2.9); key.position.set(-4, 6, 4); scene.add(key);
const rim = new THREE.PointLight(0x52cfff, 12, 11); rim.position.set(3.2, 2.8, -3); scene.add(rim);

const cadUav = new THREE.Group();
const modelScale = 1.14;
cadUav.scale.setScalar(modelScale);

const cadBody = new THREE.MeshStandardMaterial({ color: 0x153746, metalness: 0.58, roughness: 0.32, transparent: true, opacity: 0.94 });
const cadPanel = new THREE.MeshStandardMaterial({ color: 0x2c6579, metalness: 0.48, roughness: 0.4, transparent: true, opacity: 0.88 });
const cadDark = new THREE.MeshStandardMaterial({ color: 0x07141d, metalness: 0.52, roughness: 0.28 });
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xa6efff, transparent: true, opacity: 0.76 });
const guideMaterial = new THREE.LineBasicMaterial({ color: 0x53b9dd, transparent: true, opacity: 0.58 });

// This outline follows the inspection silhouette, but is extruded into a shallow CAD solid.
const planformOutline = [
  [0, -1.82], [0.19, -1.54], [0.23, -0.44], [1.62, -0.08], [1.7, 0.15],
  [0.34, 0.33], [0.26, 1.04], [0.61, 1.48], [0.46, 1.64], [0, 1.34],
  [-0.46, 1.64], [-0.61, 1.48], [-0.26, 1.04], [-0.34, 0.33], [-1.7, 0.15],
  [-1.62, -0.08], [-0.23, -0.44], [-0.19, -1.54],
];

function shapeFrom(points) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], -points[0][1]);
  points.slice(1).forEach(([x, z]) => shape.lineTo(x, -z));
  shape.closePath();
  return shape;
}

function extrudedPlate(points, depth, material, y = 0) {
  const geometry = new THREE.ExtrudeGeometry(shapeFrom(points), { depth, bevelEnabled: false, curveSegments: 1 });
  const plate = new THREE.Mesh(geometry, material);
  plate.rotation.x = -Math.PI / 2;
  plate.position.y = y;
  cadUav.add(plate);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
  edges.rotation.x = -Math.PI / 2;
  edges.position.y = y + 0.004;
  cadUav.add(edges);
  return plate;
}

extrudedPlate(planformOutline, 0.1, cadBody);
extrudedPlate([[0, -1.66], [0.13, -1.43], [0.16, 0.93], [0.38, 1.31], [0, 1.14], [-0.38, 1.31], [-0.16, 0.93], [-0.13, -1.43]], 0.055, cadPanel, 0.104);

// Raised components make the body read as an actual, rotatable technical model.
const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.9, 4, 14), cadBody);
fuselage.rotation.x = Math.PI / 2;
fuselage.position.set(0, 0.25, -0.1);
cadUav.add(fuselage);
const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 12), cadDark);
canopy.scale.set(0.85, 0.42, 1.48);
canopy.position.set(0, 0.42, -0.48);
cadUav.add(canopy);
const nose = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.45, 14), cadPanel);
nose.rotation.x = -Math.PI / 2;
nose.position.set(0, 0.25, -1.53);
cadUav.add(nose);
const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.2, 14), cadDark);
motor.rotation.x = Math.PI / 2;
motor.position.set(0, 0.27, 1.47);
cadUav.add(motor);
const propHub = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), cadPanel);
propHub.position.set(0, 0.27, 1.63);
cadUav.add(propHub);

function addLine(points, material = guideMaterial, height = 0.19) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, z]) => new THREE.Vector3(x, height, z)));
  cadUav.add(new THREE.Line(geometry, material));
}

addLine([[0, -1.77], [0, 1.58]]);
addLine([[-1.6, -0.06], [1.6, -0.06]]);
addLine([[-1.22, -0.28], [1.22, -0.28]]);
addLine([[-0.98, 0.45], [0.98, 0.45]]);
addLine([[-1.58, 0.15], [-0.34, 0.33], [-0.26, 1.04], [-0.61, 1.48]], edgeMaterial, 0.2);
addLine([[1.58, 0.15], [0.34, 0.33], [0.26, 1.04], [0.61, 1.48]], edgeMaterial, 0.2);

const texture = new THREE.TextureLoader().load('uav-topdown.png');
texture.colorSpace = THREE.SRGBColorSpace;
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
// A light surface reference keeps the hangar model tied to the inspection drawing,
// while the extruded mesh remains visible from every angle.
const referenceDecal = new THREE.Mesh(
  new THREE.PlaneGeometry(4.05, 4.05),
  new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }),
);
referenceDecal.rotation.x = -Math.PI / 2;
referenceDecal.position.y = 0.205;
cadUav.add(referenceDecal);

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.58, 44),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.27, depthWrite: false }),
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = -0.16;
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
  cadUav.position.set(0, THREE.MathUtils.lerp(3.8, -0.01, eased), THREE.MathUtils.lerp(10, 0, eased));
  cadUav.scale.setScalar(THREE.MathUtils.lerp(modelScale * 0.24, modelScale, eased));
  if (!landed) targetYaw += 0.0018;
  yaw += (targetYaw - yaw) * 0.085;
  pitch += (targetPitch - pitch) * 0.085;
  cadUav.rotation.set(pitch, yaw, 0);
  if (progress === 1) landed = true;
  shadow.scale.setScalar(THREE.MathUtils.lerp(0.25, 1, eased));
  shadow.material.opacity = THREE.MathUtils.lerp(0.02, 0.27, eased);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
