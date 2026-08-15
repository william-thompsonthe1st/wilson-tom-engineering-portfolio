import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas = document.querySelector('#uav3d');
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 3.4, 7.3);
camera.lookAt(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xbceeff, 0x1a2731, 2.2));
const key = new THREE.DirectionalLight(0xe9f7ff, 2.7); key.position.set(-4, 6, 4); scene.add(key);
const rim = new THREE.PointLight(0x52d8ff, 14, 10); rim.position.set(3, 1, -3); scene.add(rim);

const aircraft = new THREE.Group();
const material = new THREE.MeshStandardMaterial({ color: 0x243641, metalness: 0.75, roughness: 0.34 });
const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x4e7584, metalness: 0.86, roughness: 0.24 });
const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x0a1117, metalness: 0.5, roughness: 0.42 });

function mesh(geometry, materialRef, x = 0, y = 0, z = 0) { const part = new THREE.Mesh(geometry, materialRef); part.position.set(x, y, z); aircraft.add(part); return part; }
const fuselage = mesh(new THREE.CylinderGeometry(0.23, 0.3, 2.48, 28), material); fuselage.rotation.x = Math.PI / 2;
const nose = mesh(new THREE.SphereGeometry(0.255, 28, 18), edgeMaterial, 0, 0, -1.24); nose.scale.set(1, 0.88, 1.52);
const canopy = mesh(new THREE.SphereGeometry(0.17, 24, 16), darkMaterial, 0, 0.17, -0.44); canopy.scale.set(0.95, 0.44, 1.48);
const wingGeometry = new THREE.BoxGeometry(1.78, 0.07, 0.67);
const wingL = mesh(wingGeometry, material, -1.05, 0, 0.06); wingL.rotation.y = -0.11;
const wingR = mesh(wingGeometry, material, 1.05, 0, 0.06); wingR.rotation.y = 0.11;
mesh(new THREE.BoxGeometry(2.75, 0.026, 0.1), edgeMaterial, 0, 0.035, -0.12);
const tailL = mesh(new THREE.BoxGeometry(0.06, 0.5, 0.54), edgeMaterial, -0.3, 0.23, 0.95); tailL.rotation.z = -0.31;
const tailR = mesh(new THREE.BoxGeometry(0.06, 0.5, 0.54), edgeMaterial, 0.3, 0.23, 0.95); tailR.rotation.z = 0.31;
mesh(new THREE.BoxGeometry(0.86, 0.055, 0.46), material, 0, 0, 1.08);
const prop = new THREE.Group(); prop.position.set(0, 0, 1.47); aircraft.add(prop);
for (let i = 0; i < 2; i += 1) { const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.76, 0.025), edgeMaterial); blade.rotation.z = i * Math.PI / 2; blade.position.y = i === 0 ? 0.25 : 0; prop.add(blade); }
const hub = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), darkMaterial); prop.add(hub);
const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.45, 42), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.27 })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.33; scene.add(shadow);

aircraft.position.set(0, 3.8, 10); aircraft.scale.setScalar(0.24); aircraft.rotation.x = -0.24; scene.add(aircraft);
let yaw = 0, pitch = -0.06, targetYaw = 0, targetPitch = -0.06, landingStart = performance.now() + 850, landed = false;
let pointerDown = false, moved = false, lastX = 0, lastY = 0;
function resize() { const { width, height } = canvas.getBoundingClientRect(); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }
window.addEventListener('resize', resize); resize();
canvas.addEventListener('pointerdown', (event) => { pointerDown = true; moved = false; lastX = event.clientX; lastY = event.clientY; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', (event) => { if (!pointerDown || !landed) return; const dx = event.clientX - lastX, dy = event.clientY - lastY; if (Math.abs(dx) + Math.abs(dy) > 2) moved = true; targetYaw += dx * 0.012; targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.006, -0.45, 0.24); lastX = event.clientX; lastY = event.clientY; });
canvas.addEventListener('pointerup', (event) => { pointerDown = false; if (!moved && landed) document.querySelector('.drone-hit')?.click(); if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); });

function frame(now) {
  const p = THREE.MathUtils.clamp((now - landingStart) / 2250, 0, 1);
  const eased = 1 - Math.pow(1 - p, 4);
  aircraft.position.set(0, THREE.MathUtils.lerp(3.8, -0.02, eased), THREE.MathUtils.lerp(10, 0, eased));
  aircraft.scale.setScalar(THREE.MathUtils.lerp(0.24, 1, eased));
  aircraft.rotation.x = THREE.MathUtils.lerp(-0.24, targetPitch, eased);
  targetYaw += landed ? 0 : 0.002;
  yaw += (targetYaw - yaw) * 0.09; pitch += (targetPitch - pitch) * 0.09;
  aircraft.rotation.y = yaw; if (p === 1) landed = true;
  prop.rotation.z += landed ? 0.09 : 0.28;
  shadow.scale.setScalar(THREE.MathUtils.lerp(0.3, 1, eased)); shadow.material.opacity = THREE.MathUtils.lerp(0.03, 0.27, eased);
  renderer.render(scene, camera); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
