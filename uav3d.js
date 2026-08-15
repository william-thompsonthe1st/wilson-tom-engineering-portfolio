import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas = document.querySelector('#uav3d');
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
camera.position.set(0, 3.5, 7.5);
camera.lookAt(0, 0, 0);
const hangarCamera = camera.position.clone();
const inspectionCamera = new THREE.Vector3(0, 7.25, 0.18);
const inspectionPath = new THREE.CatmullRomCurve3([
  hangarCamera.clone(),
  new THREE.Vector3(0, 2.85, 5.35),
  new THREE.Vector3(0, 4.55, 2.8),
  inspectionCamera,
]);
scene.add(new THREE.HemisphereLight(0xd9f7ff, 0x0a1218, 2.1));
const key = new THREE.DirectionalLight(0xf4fbff, 3.3); key.position.set(-4, 6, 4); scene.add(key);
const rim = new THREE.PointLight(0x62d7ff, 10, 11); rim.position.set(3, 3, -3); scene.add(rim);

const uav = new THREE.Group();
uav.scale.setScalar(1.12);

function brushedMetalTexture() {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 128; textureCanvas.height = 128;
  const context = textureCanvas.getContext('2d');
  context.fillStyle = '#6c7173'; context.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 3) {
    const shade = 92 + ((y * 17) % 17);
    context.fillStyle = `rgba(${shade + 22},${shade + 24},${shade + 25},.13)`;
    context.fillRect(0, y, 128, 1);
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(5, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const sheetMetal = brushedMetalTexture();
const airframe = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: sheetMetal, metalness: 0.62, roughness: 0.34, clearcoat: 0.16, clearcoatRoughness: 0.28, side: THREE.DoubleSide });
const panel = new THREE.MeshPhysicalMaterial({ color: 0x73787a, metalness: 0.5, roughness: 0.4, clearcoat: 0.14, side: THREE.DoubleSide });
const dark = new THREE.MeshPhysicalMaterial({ color: 0x171b1d, metalness: 0.45, roughness: 0.22, clearcoat: 0.45, clearcoatRoughness: 0.16 });

function fuselageGeometry() {
  const rings = [
    [-1.75, 0.015, 0.015], [-1.64, 0.1, 0.09], [-1.44, 0.17, 0.14], [-1.08, 0.205, 0.17],
    [-0.35, 0.225, 0.19], [0.38, 0.22, 0.185], [0.88, 0.19, 0.16], [1.25, 0.145, 0.125],
    [1.56, 0.1, 0.095], [1.73, 0.045, 0.045],
  ];
  const radial = 32;
  const vertices = [];
  const uvs = [];
  const indices = [];
  rings.forEach(([z, rx, ry], ring) => {
    for (let i = 0; i < radial; i += 1) {
      const theta = (i / radial) * Math.PI * 2;
      vertices.push(Math.cos(theta) * rx, 0.18 + Math.sin(theta) * ry, z);
      uvs.push(i / radial, ring / (rings.length - 1));
    }
  });
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let i = 0; i < radial; i += 1) {
      const next = (i + 1) % radial;
      const a = ring * radial + i;
      const b = ring * radial + next;
      const c = (ring + 1) * radial + next;
      const d = (ring + 1) * radial + i;
      indices.push(a, b, d, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const fuselage = new THREE.Mesh(fuselageGeometry(), airframe);
uav.add(fuselage);

function airfoilWingGeometry(stations) {
  const chordSteps = 10;
  const vertices = [];
  const uvs = [];
  const indices = [];
  const addSurface = (top) => {
    stations.forEach(([x, leading, trailing, baseY, thickness], stationIndex) => {
      for (let j = 0; j <= chordSteps; j += 1) {
        const t = j / chordSteps;
        const camber = Math.sin(Math.PI * t) * thickness * 0.3;
        const profile = Math.sin(Math.PI * t) * thickness;
        vertices.push(x, baseY + camber + (top ? profile : -profile), THREE.MathUtils.lerp(leading, trailing, t));
        uvs.push(stationIndex / (stations.length - 1), t);
      }
    });
  };
  addSurface(true);
  addSurface(false);
  const row = chordSteps + 1;
  const half = stations.length * row;
  for (let i = 0; i < stations.length - 1; i += 1) {
    for (let j = 0; j < chordSteps; j += 1) {
      const a = i * row + j;
      const b = a + 1;
      const c = a + row + 1;
      const d = a + row;
      indices.push(a, b, d, b, c, d);
      indices.push(half + a, half + d, half + b, half + b, half + d, half + c);
    }
  }
  for (let j = 0; j < chordSteps; j += 1) {
    const a = j; const b = j + 1; const c = half + j + 1; const d = half + j;
    indices.push(a, d, b, b, d, c);
    const end = (stations.length - 1) * row;
    indices.push(end + b, half + end + b, end + a, end + a, half + end + b, half + end + a);
  }
  for (let i = 0; i < stations.length - 1; i += 1) {
    const a = i * row; const b = a + row; const c = half + b; const d = half + a;
    indices.push(a, b, d, b, c, d);
    const trailing = i * row + chordSteps; const trailingNext = trailing + row;
    indices.push(trailingNext, trailing, half + trailingNext, trailing, half + trailing, half + trailingNext);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const mainWingGeometry = airfoilWingGeometry([
  [0.18, -0.42, 0.37, 0.17, 0.06], [0.55, -0.38, 0.35, 0.17, 0.07],
  [1.1, -0.31, 0.31, 0.16, 0.06], [1.63, -0.24, 0.27, 0.15, 0.045], [1.98, -0.18, 0.21, 0.14, 0.025],
]);
const rightWing = new THREE.Mesh(mainWingGeometry, airframe);
const leftWing = rightWing.clone(); leftWing.scale.x = -1;
uav.add(rightWing, leftWing);

const tailGeometry = airfoilWingGeometry([
  [0.1, 1.18, 1.58, 0.23, 0.04], [0.36, 1.42, 1.76, 0.37, 0.045], [0.72, 1.55, 1.88, 0.56, 0.035],
]);
const rightTail = new THREE.Mesh(tailGeometry, panel);
const leftTail = rightTail.clone(); leftTail.scale.x = -1;
uav.add(rightTail, leftTail);

const seamMaterial = new THREE.MeshStandardMaterial({ color: 0x303638, metalness: 0.62, roughness: 0.33 });
[-0.92, -0.25, 0.46].forEach((z) => {
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.008, 8, 32), seamMaterial);
  seam.scale.y = 0.82; seam.position.set(0, 0.18, z); uav.add(seam);
});
function controlSurfaceLine(side) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.34, 0.25, 0.24), new THREE.Vector3(side * 0.86, 0.24, 0.21),
    new THREE.Vector3(side * 1.42, 0.21, 0.17), new THREE.Vector3(side * 1.84, 0.18, 0.12),
  ]);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.008, 8, false), seamMaterial);
}
uav.add(controlSurfaceLine(1), controlSurfaceLine(-1));
const accessHatch = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), dark);
accessHatch.scale.set(1, 0.12, 2.1); accessHatch.position.set(0, 0.39, -0.58); uav.add(accessHatch);
const fastenerGeometry = new THREE.SphereGeometry(0.018, 12, 10);
[[-0.11, -0.77], [0.11, -0.77], [-0.11, -0.39], [0.11, -0.39]].forEach(([x, z]) => {
  const fastener = new THREE.Mesh(fastenerGeometry, panel); fastener.position.set(x, 0.415, z); uav.add(fastener);
});
[-1, 1].forEach((side) => {
  [0.45, 0.78, 1.12, 1.46].forEach((distance) => {
    [-0.22, 0.2].forEach((z) => {
      const rivet = new THREE.Mesh(fastenerGeometry, panel);
      rivet.position.set(side * distance, 0.255 - distance * 0.025, z); uav.add(rivet);
    });
  });
  const wingPanel = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), dark);
  wingPanel.scale.set(1.15, 0.09, 1.65); wingPanel.position.set(side * 0.92, 0.245, 0.03); uav.add(wingPanel);
});

const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 18), dark);
sensor.scale.set(1, 0.72, 1.1); sensor.position.set(0, 0.02, -0.48); uav.add(sensor);
const antennaGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.28, 14);
[-0.86, 0.86].forEach((x) => { const antenna = new THREE.Mesh(antennaGeometry, dark); antenna.position.set(x, 0.33, -0.06); uav.add(antenna); });

const pusher = new THREE.Group();
pusher.position.set(0, 0.18, 1.78);
const hub = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16), dark); pusher.add(hub);
const bladeGeometry = new THREE.CapsuleGeometry(0.028, 0.72, 6, 14);
const bladeA = new THREE.Mesh(bladeGeometry, panel); bladeA.rotation.z = 0.52; pusher.add(bladeA);
const bladeB = bladeA.clone(); bladeB.rotation.z += Math.PI / 2; pusher.add(bladeB);
uav.add(pusher);

const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.62, 48), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.26, depthWrite: false }));
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
let inspectionStart = null;
let orbitMode = false;

window.addEventListener('uav:inspect', () => { inspectionStart = performance.now(); });
window.addEventListener('uav:return', () => { inspectionStart = null; camera.position.copy(hangarCamera); camera.lookAt(0, 0, 0); });
window.addEventListener('uav:orbit', () => { orbitMode = !orbitMode; });
window.addEventListener('uav:reset', () => { orbitMode = false; targetYaw = 0; targetPitch = -0.035; yaw = 0; pitch = -0.035; });

function resize() {
  const { width, height } = canvas.getBoundingClientRect();
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

canvas.addEventListener('pointerdown', (event) => { orbitMode = false; pointerDown = true; moved = false; lastX = event.clientX; lastY = event.clientY; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', (event) => {
  if (!pointerDown || !landed) return;
  const dx = event.clientX - lastX; const dy = event.clientY - lastY;
  if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
  targetYaw += dx * 0.012;
  targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.005, -0.34, 0.14);
  lastX = event.clientX; lastY = event.clientY;
});
canvas.addEventListener('pointerup', (event) => { pointerDown = false; if (!moved && landed) document.querySelector('.drone-hit')?.click(); if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); });

function frame(now) {
  const progress = THREE.MathUtils.clamp((now - landingStart) / 2200, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 4);
  uav.position.set(0, THREE.MathUtils.lerp(3.8, -0.01, eased), THREE.MathUtils.lerp(10, 0, eased));
  uav.scale.setScalar(THREE.MathUtils.lerp(0.27, 1.12, eased));
  if (!landed) targetYaw += 0.0018;
  if (landed && orbitMode && inspectionStart === null) targetYaw += 0.0022;
  yaw += (targetYaw - yaw) * 0.085;
  pitch += (targetPitch - pitch) * 0.085;
  const inspectionProgress = inspectionStart === null ? 0 : 1 - Math.pow(1 - THREE.MathUtils.clamp((now - inspectionStart) / 1450, 0, 1), 3);
  uav.rotation.set(THREE.MathUtils.lerp(pitch, 0, inspectionProgress), THREE.MathUtils.lerp(yaw, 0, inspectionProgress), 0);
  camera.position.copy(inspectionPath.getPointAt(inspectionProgress));
  camera.lookAt(0, 0.1, 0);
  if (progress === 1) landed = true;
  pusher.rotation.z += landed ? 0.025 : 0.23;
  shadow.scale.setScalar(THREE.MathUtils.lerp(0.25, 1, eased));
  shadow.material.opacity = THREE.MathUtils.lerp(0.02, 0.26, eased);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
