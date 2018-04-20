const objects = [];
const ignoredElements = [];
let isRotating = false;
let autoRotateSpeed = { x: 0.001, y: 0 };
let currentPosition;
let currentSpeed = { x: 0, y: 0 };
let lastInteractionPosition;
let lastUpdateTime = Date.now();
let startInteractionPosition;
let startInteractingTime;
const damping = 0.05;
const threeSixty = 2 * Math.PI;

function toRadians(angle) {
  return angle * (Math.PI / 180);
}

function toDegrees(angle) {
  return angle * (180 / Math.PI);
}

function getPosition(ev) {
  return {
    x: threeSixty * (ev.offsetX / document.body.clientWidth),
    y: threeSixty * (ev.offsetY / document.body.clientWidth),
  };
}

export function ignoreFromElement(el) {
  ignoredElements.push(el);
}

window.addEventListener("mousedown", ev => {
  if (ignoredElements.some(el => el.contains(ev.target))) {
    return;
  }
  startInteractingTime = Date.now();
  const pos = getPosition(ev);
  currentPosition = pos;
  startInteractionPosition = pos;
  isRotating = true;
});

window.addEventListener("mouseup", ev => {
  if (ignoredElements.some(el => el.contains(ev.target))) {
    return;
  }
  const now = Date.now();
  const pos = getPosition(ev);
  const deltaTime = now - startInteractingTime;
  if (deltaTime < 500) {
    const deltaMove = {
      x: pos.x - startInteractionPosition.x,
      y: pos.y - startInteractionPosition.y,
    };
    currentSpeed = {
      x: deltaMove.x / deltaTime * 50,
      y: deltaMove.y / deltaTime * 50,
    };
  }
  isRotating = false;
});

window.addEventListener("mousemove", ev => {
  if (ignoredElements.some(el => el.contains(ev.target))) {
    return;
  }
  currentPosition = getPosition(ev);
});

export function addObjectToControls(obj) {
  objects.push(obj);
}

export function controlsUpdate() {
  const now = Date.now();
  let deltaMove;
  if (isRotating) {
    const deltaTime = now - lastUpdateTime;
    deltaMove = {
      x: currentPosition.x - lastInteractionPosition.x,
      y: currentPosition.y - lastInteractionPosition.y,
    };
  } else {
    deltaMove = {
      x: currentSpeed.x + autoRotateSpeed.x,
      y: currentSpeed.y + autoRotateSpeed.y,
    };
    // slow speed down
    currentSpeed = {
      x: currentSpeed.x * (1 - damping),
      y: currentSpeed.y * (1 - damping),
    };
  }

  const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(deltaMove.y, deltaMove.x, 0, "XYZ"),
  );

  objects.forEach(obj => {
    obj.quaternion.multiplyQuaternions(deltaRotationQuaternion, obj.quaternion);
  });

  lastInteractionPosition = currentPosition;
  lastUpdateTime = now;
}
