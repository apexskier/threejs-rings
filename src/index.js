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

let stats;
let camera;
let scene;
let renderer;
let material;
let ambientLight;

const settings = {
  metalness: 1.0,
  roughness: 0.4,
  refractionRatio: 0.470, // https://pixelandpoly.com/ior.html
  ambientIntensity: 0.2,
  aoMapIntensity: 1.0,
  envMapIntensity: 1.0,
  displacementScale: 2.436143, // from original model
  normalScale: 1.0,
  wireframe: false,
};

init();
initGui();
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
  gui
    .add(settings, "metalness")
    .min(0)
    .max(1)
    .onChange(function(value) {
      material.metalness = value;
    });
  gui
    .add(settings, "roughness")
    .min(0)
    .max(1)
    .onChange(function(value) {
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
    .onChange(function(value) {
      material.aoMapIntensity = value;
    });
  gui
    .add(settings, "ambientIntensity")
    .min(0)
    .max(1)
    .onChange(function(value) {
      ambientLight.intensity = value;
    });
  gui
    .add(settings, "envMapIntensity")
    .min(0)
    .max(3)
    .onChange(function(value) {
      material.envMapIntensity = value;
    });
  gui
    .add(settings, "displacementScale")
    .min(0)
    .max(3.0)
    .onChange(function(value) {
      material.displacementScale = value;
    });
  gui
    .add(settings, "normalScale")
    .min(-1)
    .max(1)
    .onChange(function(value) {
      material.normalScale.set(1, -1).multiplyScalar(value);
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
  // scene.background = new THREE.Color(0x72645b);
  // scene.fog = new THREE.Fog(0x72645b, 2, 15);

  // Ground

  // var plane = new THREE.Mesh(
  //   new THREE.PlaneBufferGeometry(40, 40),
  //   new THREE.MeshPhongMaterial({ color: 0x999999, specular: 0x101010 }),
  // );
  // plane.rotation.x = -Math.PI / 2;
  // plane.position.y = -0.5;
  // scene.add(plane);

  // plane.receiveShadow = true;

  // ASCII file

  var loader = new THREE.STLLoader();

  var ringGroup = new THREE.Group();
  ringGroup.rotateX(-Math.PI / 2);
  scene.add(ringGroup);
  addObjectToControls(ringGroup);

  // Binary files

  const aishaMaterial = new THREE.MeshPhongMaterial({
    color: 0xfffdf4,
    specular: 0xfffae8,
    shininess: 600,
  });

  // loader.load(require("../aisha.stl"), function(geometry) {
  //   const mesh = new THREE.Mesh(geometry, aishaMaterial);

  //   mesh.position.set(0, 0, 0);
  //   mesh.scale.set(0.009, 0.009, 0.009);

  //   mesh.castShadow = true;
  //   mesh.receiveShadow = true;

  //   ringGroup.add(mesh);
  // });

  const ringGeometry = new CustomRingGeometry({
    innerRadius: camInnerRadiusMM,
    outerRadius: camInnerRadiusMM + thicknessMM,
    thetaSegments: 64,
    height: heightMM,
    points: mountainPoints,
  });
  ringGeometry.computeVertexNormals();

  (async () => {
    const [envMap, normalMap] = await Promise.all([
      loadEnvTexture(),
      loadTexture(require("../normalMap.png")),
    ]);

    const cameronMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffdf4,
      roughness: settings.roughness,
      metalness: settings.metalness,
      normalMap,
      normalScale: new THREE.Vector2(1, 0.5), // why does the normal map require negation in this case?
      // aoMap: aoMap,
      // aoMapIntensity: 1,
      // displacementMap: displacementMap,
      // displacementScale: settings.displacementScale,
      // displacementBias: - 0.428408, // from original model
      envMap,
      envMapIntensity: settings.envMapIntensity,
    });
    cameronMaterial.refractionRatio = settings.refractionRatio;
    material = cameronMaterial;
    material.wireframe = settings.wireframe;

    // loader.load(require("../cameron.stl"), function(geometry) {
    //   const mesh = new THREE.Mesh(geometry, cameronMaterial);

    //   mesh.position.set(0, 0, 0);
    //   mesh.scale.set(0.009, 0.009, 0.009);

    //   mesh.castShadow = true;
    //   mesh.receiveShadow = true;

    //   geometry.computeVertexNormals();

    //   ringGroup.add(mesh);
    // });

    // const wireframeMaterial = new THREE.MeshBasicMaterial({
    //   color: 0x00a5ff,
    //   side: THREE.DoubleSide,
    // });
    // wireframeMaterial.wireframe = true;
    // const ringMesh = new THREE.Mesh(ringGeometry, wireframeMaterial);
    const ringMesh = new THREE.Mesh(ringGeometry, cameronMaterial);

    // var helper = new THREE.VertexNormalsHelper(ringMesh, 2, 0x00ff00, 1);
    // ringGroup.add(helper);

    ringGroup.add(ringMesh);
  })();

  var axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);

  // Lights

  // scene.add(new THREE.HemisphereLight(0x443333, 0x111122));

  ambientLight = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
  scene.add(ambientLight);

  addShadowedLight(1, 1, 1, 0xffffff, 1.35);
  // addShadowedLight(0.5, -2, 3, 0xffaa00, 1);

  // renderer

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  renderer.shadowMap.enabled = true;

  container.appendChild(renderer.domElement);

  stats = new Stats();
  container.appendChild(stats.dom);

  // controls.autoRotate = true;
  // controls.autoRotateSpeed = 0.2;
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.1;
  // controls.enablePan = false;
  // controls.maxDistance = 8;
  // controls.minDistance = 1.5;

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

  renderer.render(scene, camera);
}
