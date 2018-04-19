import "three/examples/js/loaders/STLLoader";
import "three/examples/js/controls/OrbitControls";
import Stats from "three/examples/js/libs/stats.min";
import Detector from "three/examples/js/Detector";
import { CustomRingGeometry } from "./customRing";
import mountainPoints from "../scaledPoints.json";

// if (!Detector.webgl) Detector.addGetWebGLMessage();

var container, stats;

var camera, scene, renderer, controls;

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    15,
  );
  camera.position.set(3, 0.15, 3);

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
  scene.add(ringGroup);

  // Binary files

  var goldMaterial = new THREE.MeshPhongMaterial({
    color: 0xfffdf4,
    specular: 0xfffae8,
    shininess: 600,
  });

  loader.load(require("../aisha.stl"), function(geometry) {
    var mesh = new THREE.Mesh(geometry, goldMaterial);

    mesh.position.set(0, 0, 0);
    mesh.scale.set(0.009, 0.009, 0.009);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    ringGroup.add(mesh);
  });

  var goldMaterial = new THREE.MeshPhongMaterial({
    color: 0xfffdf4,
    specular: 0xfffae8,
    shininess: 400,
  });

  loader.load(require("../cameron.stl"), function(geometry) {
    var mesh = new THREE.Mesh(geometry, goldMaterial);

    mesh.position.set(0, 0, 0);
    mesh.scale.set(0.009, 0.009, 0.009);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    geometry.computeVertexNormals();

    ringGroup.add(mesh);
  });

  const ringGeometry = new CustomRingGeometry({
    innerRadius: 0.3,
    outerRadius: 0.35,
    thetaSegments: 32,
    height: 0.1,
    points: mountainPoints,
  });
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x00a5ff,
    side: THREE.DoubleSide,
  });
  wireframeMaterial.wireframe = true;
  // const ringMesh = new THREE.Mesh(ringGeometry, wireframeMaterial);
  const ringMesh = new THREE.Mesh(ringGeometry, goldMaterial);

  // ringGeometry.computeVertexNormals();

  var helper = new THREE.VertexNormalsHelper(ringMesh, 2, 0x00ff00, 1);
  ringGroup.add(helper);

  ringGroup.add(ringMesh);

  // Lights

  scene.add(new THREE.HemisphereLight(0x443333, 0x111122));

  addShadowedLight(1, 1, 1, 0xffffff, 1.35);
  addShadowedLight(0.5, 1, -1, 0xffaa00, 1);
  // renderer

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  renderer.shadowMap.enabled = true;

  container.appendChild(renderer.domElement);

  // stats

  stats = new Stats();
  container.appendChild(stats.dom);

  controls = new THREE.OrbitControls(camera);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.2;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.enablePan = false;
  controls.maxDistance = 8;
  controls.minDistance = 1.5;
  controls.update();

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
  var timer = Date.now() * 0.0005;

  controls.update();

  renderer.render(scene, camera);
}
