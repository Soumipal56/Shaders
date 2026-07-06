import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Renderer ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// ─── Scene & Camera ──────────────────────────────────────────────────────────
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 0, 3);

// ─── Controls ────────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// ─── Objects ─────────────────────────────────────────────────────────────────
const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
const material = new THREE.ShaderMaterial({
    vertexShader: `

    uniform float uTime;

    void main(){
      vec3 pos = position;
      pos.z += sin(pos.x * 10.0 + uTime);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
    `,
    fragmentShader: `
       void main(){
          gl_FragColor = vec4(1.0,0.0,0.0,1.0);
       }
    `,

    uniforms:{
        uTime : {value : 0},
    },


})
const mesh = new THREE.Mesh(geometry, material);
mesh.rotation.x = -Math.PI * 0.3;
scene.add(mesh);

// ─── Lights ──────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 80);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const fillLight = new THREE.PointLight(0xa78bfa, 40);
fillLight.position.set(-5, -3, -3);
scene.add(fillLight);

// ─── Resize ──────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ─── Render Loop ─────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
    const delta = clock.getDelta();

    material.uniforms.uTime.value += delta;

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
