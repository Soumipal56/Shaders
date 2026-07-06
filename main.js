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

       vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

       varying vec2 vUv;

       void main(){

          vec2 uv = vUv;

          vec2 dir = normalize(vec2(0.0,1.0));

          float ripple = sin(uProgress * 3.14) * 0.05;

          float gradient = dot(uv - 0.5, dir) + 0.5;

          float n = snoise(uv * 6.0) * 0.25;

          float localGradient = gradient + n;

          float edge = 0.15;

          float sweep = uProgress * (1.0 + edge * 2.0) - edge;

          float mixer = smoothstep(localGradient - edge, localGradient + edge, sweep); 

          vec2 uvA = uv - dir * ripple;
          vec2 uvB = uv + dir * ripple;
          
          vec4 col1 = texture2D(uTexture1, uvA);
          vec4 col2 = texture2D(uTexture2, uvB);
          vec4 finalColor = mix(col1, col2, mixer);

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
