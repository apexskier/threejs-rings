import "three/examples/js/loaders/STLLoader";
import Stats from "three/examples/js/libs/stats.min";
import dat from "three/examples/js/libs/dat.gui.min";
import Detector from "three/examples/js/Detector";
import { CustomRingGeometry } from "./customRing";
import mountainPoints from "../scaledPoints.json";
import {
  addObjectToControls,
  controlsUpdate,
  ignoreFromElement,
} from "./controls";

if (!Detector.webgl) Detector.addGetWebGLMessage();

const camInnerRadiusMM = 17.5;
const aishaInnerRadiusMM = 16.57;
const thicknessMM = 1.7;
const heightMM = 6;
const togetherDistance = 2.3;

let stats;
let camera;
let scene;
let renderer;
let material;
let ambientLight;
let aishaRingMesh;
let cameronRingMesh;

const settings = {
  color: 0xdcd6bc,
  roughness: 0.85,
  refractionRatio: 0.47, // https://pixelandpoly.com/ior.html
  ambientIntensity: 0.2,
  aoMapIntensity: 1.0,
  envMapIntensity: 1.0,
  displacementScale: 2.436143, // from original model
  normalScale: 1.0,
  wireframe: false,
  ringDistance: 5,
};

init();
// initGui();
requestAnimationFrame(animate);

// https://github.com/mrdoob/three.js/pull/9746
function textureFromEquirectangular(source, size, detail) {
  const scene = new THREE.Scene();

  const gl = renderer.getContext();
  const maxSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);

  const camera = new THREE.CubeCamera(1, 100000, Math.min(size, maxSize));

  source.wrapS = source.wrapT = THREE.RepeatWrapping;

  const material = new THREE.MeshBasicMaterial({
    map: source,
    side: THREE.BackSide,
  });

  const mesh = new THREE.Mesh(
    new THREE.SphereBufferGeometry(100, 10 * (detail || 3), 10 * (detail || 3)),
    material,
  );

  scene.add(mesh);

  camera.updateCubeMap(renderer, scene);
  camera.renderTarget.texture.isRenderTargetCubeTexture = true;

  return camera.renderTarget.texture;
}

// Init gui
function initGui() {
  const gui = new dat.GUI();
  gui.addColor(settings, "color").onChange(value => {
    material.color.setHex(value);
  });
  gui
    .add(settings, "roughness")
    .min(0)
    .max(1)
    .onChange(value => {
      material.roughness = value;
    });
  gui
    .add(settings, "refractionRatio")
    .min(0)
    .max(1)
    .onChange(function(value) {
      material.refractionRatio = value;
    });
  gui
    .add(settings, "aoMapIntensity")
    .min(0)
    .max(1)
    .onChange(value => {
      material.aoMapIntensity = value;
    });
  gui
    .add(settings, "ambientIntensity")
    .min(0)
    .max(1)
    .onChange(value => {
      ambientLight.intensity = value;
    });
  gui
    .add(settings, "envMapIntensity")
    .min(0)
    .max(3)
    .onChange(value => {
      material.envMapIntensity = value;
    });
  gui
    .add(settings, "displacementScale")
    .min(0)
    .max(3.0)
    .onChange(value => {
      material.displacementScale = value;
    });
  gui
    .add(settings, "normalScale")
    .min(-1)
    .max(1)
    .onChange(value => {
      material.normalScale.set(1, -1).multiplyScalar(value);
    });
  gui
    .add(settings, "ringDistance")
    .min(0)
    .max(50)
    .onChange(value => {
      aishaRingMesh.position.setZ(value);
      cameronRingMesh.position.setZ(-value);
    });
  gui.add(settings, "wireframe").onChange(function(value) {
    material.wireframe = value;
  });
  ignoreFromElement(gui.domElement);
}

async function loadTexture(source) {
  return new Promise(resolve => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(source, resolve);
  });
}

async function loadEnvTexture() {
  const texture = await loadTexture(require("../reflection.jpg"));
  return textureFromEquirectangular(texture, 2048);
}

function init() {
  const container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    1000,
  );
  camera.position.set(10, 30, 200);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();

  // var axesHelper = new THREE.AxesHelper(100);
  // scene.add(axesHelper);

  // scene.background = new THREE.Color(0x72645b);

  var ringGroup = new THREE.Group();
  ringGroup.rotateX(-Math.PI / 2);
  scene.add(ringGroup);
  addObjectToControls(ringGroup);

  const aishaRingGeometry = new CustomRingGeometry({
    innerRadius: aishaInnerRadiusMM,
    outerRadius: aishaInnerRadiusMM + thicknessMM,
    thetaSegments: 64,
    height: heightMM,
    points: mountainPoints,
    pointsEdgeHeightPercent: 0.1,
    invert: true,
  });
  aishaRingGeometry.computeVertexNormals();

  const cameronRingGeometry = new CustomRingGeometry({
    innerRadius: camInnerRadiusMM,
    outerRadius: camInnerRadiusMM + thicknessMM,
    thetaSegments: 64,
    height: heightMM,
    pointsEdgeHeightPercent: 0.2,
    points: mountainPoints,
  });
  cameronRingGeometry.computeVertexNormals();

  (async () => {
    const [envMap, normalMap] = await Promise.all([
      loadEnvTexture(),
      loadTexture(require("../normalMap.png")),
    ]);

    const cameronMaterial = new THREE.MeshStandardMaterial({
      color: settings.color,
      roughness: settings.roughness,
      metalness: 1,
      normalMap,
      envMap,
      envMapIntensity: settings.envMapIntensity,
    });
    cameronMaterial.refractionRatio = settings.refractionRatio;
    material = cameronMaterial;
    material.wireframe = settings.wireframe;

    cameronRingMesh = new THREE.Mesh(cameronRingGeometry, cameronMaterial);
    cameronRingMesh.translateZ(-settings.ringDistance);

    ringGroup.add(cameronRingMesh);

    const aishaMaterial = new THREE.MeshStandardMaterial({
      color: 0xdcd6bc,
      roughness: 0.1,
      metalness: 1,
      envMap,
      envMapIntensity: settings.envMapIntensity,
    });
    aishaMaterial.refractionRatio = settings.refractionRatio;

    aishaRingMesh = new THREE.Mesh(aishaRingGeometry, aishaMaterial);
    aishaRingMesh.translateZ(settings.ringDistance);

    ringGroup.add(aishaRingMesh);
  })();

  // Lights

  ambientLight = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
  scene.add(ambientLight);

  addShadowedLight(1, 1, 1, 0xffffff, 1.35);

  // renderer

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  renderer.shadowMap.enabled = true;

  container.appendChild(renderer.domElement);

  stats = new Stats();
  // container.appendChild(stats.dom);

  window.addEventListener("resize", onWindowResize, false);
}

function addShadowedLight(x, y, z, color, intensity) {
  var directionalLight = new THREE.DirectionalLight(color, intensity);
  directionalLight.position.set(x, y, z);
  scene.add(directionalLight);

  directionalLight.castShadow = true;

  var d = 1;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;

  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 4;

  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;

  directionalLight.shadow.bias = -0.002;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  render();
  stats.update();
}

function render() {
  controlsUpdate();

  if (aishaRingMesh && cameronRingMesh) {
    const distance =
      (Math.sin(Date.now() / 1000) + 1) / 2 * 10 + togetherDistance;
    aishaRingMesh.position.setZ(distance);
    cameronRingMesh.position.setZ(-distance);
  }

  renderer.render(scene, camera);
}
