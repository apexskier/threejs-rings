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

function getClickPosition(ev) {
  return {
    x: threeSixty * (ev.offsetX / document.body.clientWidth),
    y: threeSixty * (ev.offsetY / document.body.clientWidth),
  };
}

function getTouchPosition(ev) {
  return {
    x: threeSixty * (ev.targetTouches[0].pageX / document.body.clientWidth),
    y: threeSixty * (ev.targetTouches[0].pageY / document.body.clientWidth),
  };
}

export function ignoreFromElement(el) {
  ignoredElements.push(el);
}

export function initControls(rootElement) {
  function handleInteractionStart(pos) {
    startInteractingTime = Date.now();
    currentPosition = pos;
    startInteractionPosition = pos;
    lastInteractionPosition = pos;
    isRotating = true;
  }

  rootElement.addEventListener("touchstart", ev => {
    if (ignoredElements.some(el => el.contains(ev.target))) {
      return;
    }
    ev.preventDefault();
    if (ev.touches.length === 1) {
      handleInteractionStart(getTouchPosition(ev));
    }
  });

  rootElement.addEventListener("mousedown", ev => {
    if (ignoredElements.some(el => el.contains(ev.target))) {
      return;
    }
    handleInteractionStart(getClickPosition(ev));
  });

  function handleInteractionEnd(pos) {
    const now = Date.now();
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
  }

  rootElement.addEventListener("touchend", ev => {
    if (ignoredElements.some(el => el.contains(ev.target))) {
      return;
    }
    ev.preventDefault();
    handleInteractionEnd(lastInteractionPosition);
  });

  rootElement.addEventListener("mouseup", ev => {
    if (ignoredElements.some(el => el.contains(ev.target))) {
      return;
    }
    handleInteractionEnd(getClickPosition(ev));
  });

  function handleInteractionMove(pos) {
    currentPosition = pos;
  }

  rootElement.addEventListener("touchmove", ev => {
    if (ignoredElements.some(el => el.contains(ev.target))) {
      return;
    }
    ev.preventDefault();
    if (ev.touches.length === 1) {
      handleInteractionMove(getTouchPosition(ev));
    }
  });

  rootElement.addEventListener("mousemove", ev => {
    if (ignoredElements.some(el => el.contains(ev.target))) {
      return;
    }
    handleInteractionMove(getClickPosition(ev));
  });
}

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
