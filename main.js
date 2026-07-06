import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

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

// ─── Textures ────────────────────────────────────────────────────────────────
const textureLoader = new THREE.TextureLoader();

const texture1 = textureLoader.load('https://threejs.org/examples/textures/crate.gif');
const texture2 = textureLoader.load('https://threejs.org/examples/textures/uv_grid_opengl.jpg');

// ─── Objects ─────────────────────────────────────────────────────────────────
const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
const material = new THREE.ShaderMaterial({
    uniforms: {
        uTime:     { value: 0.0 },
        uTexture1: { value: texture1 },
        uTexture2: { value: texture2 },
        uProgress: {value: 0},
    },
    vertexShader: `

    uniform float uTime;
    varying vec2 vUv;

    void main(){
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vUv = uv;
    }
    `,
    fragmentShader: `

       uniform sampler2D uTexture1;
       uniform sampler2D uTexture2;
       uniform float uTime;
       uniform float uProgress;

       varying vec2 vUv;

       void main(){

          vec2 dir = normalize(vec2(0.0,1.0));

          float ripple = sin(uProgress * 3.14) * 0.05;

          vec2 uv = vUv;
          vec2 uvA = uv - dir * ripple;
          vec2 uvB = uv + dir * ripple;

          

          vec4 col1 = texture2D(uTexture1, uvA);
          vec4 col2 = texture2D(uTexture2, uvB);
          vec4 finalColor = mix(col1, col2, uProgress);

          gl_FragColor = finalColor;
       }
    `,
});
const mesh = new THREE.Mesh(geometry, material);
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

// ─── Clock ───────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

// ─── Render Loop ─────────────────────────────────────────────────────────────
function animate() {
    material.uniforms.uTime.value = clock.getElapsedTime();
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// ─── Raycaster + Click → GSAP tween uProgress ────────────────────────────────
const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2();

window.addEventListener('click', (event) => {
    // Convert screen coords to NDC
    pointer.x =  (event.clientX / window.innerWidth)  * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(mesh);

    if (intersects.length > 0) {
        // Toggle between 0 and 1 on each click
        const target = material.uniforms.uProgress.value < 0.5 ? 1 : 0;
        gsap.to(material.uniforms.uProgress, {
            value: target,
            duration: 1.2,
            ease: 'power2.inOut',
        });
    }
});
