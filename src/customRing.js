import {
  Geometry,
  BufferGeometry,
  Float32BufferAttribute,
  Vector2,
  Vector3,
} from "three";
// import {  } from '../core/BufferGeometry.js';
// import { } from '../core/BufferAttribute.js';
// import { } from '../math/Vector2.js';
// import { } from '../math/Vector3.js';

// CustomRingGeometry

function CustomRingGeometry({
  innerRadius,
  outerRadius,
  thetaSegments,
  thetaLength,
  height,
  pointsEdgeHeightPercent,
  points,
  invert,
}) {
  Geometry.call(this);

  this.type = "CustomRingGeometry";

  this.parameters = {
    innerRadius,
    outerRadius,
    thetaSegments,
    thetaLength,
    height,
    pointsEdgeHeightPercent,
    points,
    invert,
  };

  this.fromBufferGeometry(new CustomRingBufferGeometry(this.parameters));
  this.mergeVertices();
}

CustomRingGeometry.prototype = Object.create(Geometry.prototype);
CustomRingGeometry.prototype.constructor = CustomRingGeometry;

// CustomRingBufferGeometry

function CustomRingBufferGeometry({
  innerRadius = 0.5,
  outerRadius = 1,
  thetaSegments = 8,
  thetaLength = Math.PI * 2,
  height = 1,
  pointsEdgeHeightPercent = 0.2,
  points,
  invert = false,
}) {
  BufferGeometry.call(this);

  this.type = "CustomRingBufferGeometry";

  this.parameters = {
    innerRadius,
    outerRadius,
    thetaSegments,
    thetaLength,
    height,
    pointsEdgeHeightPercent,
    points,
    invert,
  };

  if (thetaSegments < 3) {
    console.warn("thetaSegments too low");
  }

  // buffers

  const indices = [];
  const vertices = [];
  const normals = [];
  const uvs = [];

  let radius = innerRadius;
  const uv = new Vector2();

  // generate vertices, normals and uvs

  function pointForTheta(thetaPercent) {
    const i = points.findIndex(([x, y]) => thetaPercent <= x);
    let preX;
    let preY;
    let postX;
    let postY;
    if (i > 0) {
      [preX, preY] = points[i];
      [postX, postY] = points[i - 1];
    } else {
      [preX, preY] = points[0];
      [postX, postY] = points[points.length - 1];
      preX += 1;
    }
    return preY;
    // const percentThrough = (thetaPercent - preX) / (postX - preX);
    // return postY * percentThrough + preY * percentThrough;
  }

  const pointHeightFactor = 3;
  const maxHeight = height + pointHeightFactor / 2;
  const pointHeightOffset = pointsEdgeHeightPercent * height;

  for (let thetaIndex = 0; thetaIndex <= thetaSegments; thetaIndex++) {
    // values are generate from the inside of the ring to the outside

    const percent = thetaIndex / thetaSegments;
    const segment = percent * thetaLength;

    const cosAngle = Math.cos(segment);
    const sinAngle = Math.sin(segment);

    let x = outerRadius * cosAngle;
    let y = outerRadius * sinAngle;

    let pointHeight;
    if (invert) {
      pointHeight = height + (0.5 - pointForTheta(percent)) * pointHeightFactor;
    } else {
      pointHeight = height + (pointForTheta(percent) - 0.5) * pointHeightFactor;
    }

    let zBot;
    let zTop;
    let zMid;
    if (invert) {
      zTop = maxHeight;
      zBot = zTop - pointHeight;
      zMid = zBot + pointHeightOffset;
    } else {
      zBot = 0;
      zTop = zBot + pointHeight;
      zMid = zTop - pointHeightOffset;
    }

    const uvMid = (pointHeight - pointHeightOffset) / maxHeight / 2;
    const uvTop = pointHeight / maxHeight / 2;

    // bottom outer
    vertices.push(x, y, zBot);
    normals.push(0, 0, 1);
    uvs.push(percent, 0.5);
    // mid outer
    vertices.push(x, y, zMid);
    const outerNormal = new Vector3(cosAngle, sinAngle, 0).normalize();
    normals.push(outerNormal.x, outerNormal.y, outerNormal.z);
    uvs.push(percent, 0.5 + uvMid);
    // top outer
    vertices.push(x, y, zTop);
    normals.push(0, 0, -1);
    uvs.push(percent, 0.5 + uvTop);

    x = innerRadius * cosAngle;
    y = innerRadius * sinAngle;

    // bottom inner
    vertices.push(x, y, zBot);
    normals.push(0, 0, 1);
    uvs.push(percent, 0);
    // mid inner
    vertices.push(x, y, zMid);
    const innerNormal = new Vector3(-cosAngle, -sinAngle, 0).normalize();
    normals.push(innerNormal.x, innerNormal.y, innerNormal.z);
    uvs.push(percent, 0.5 - uvMid);
    // top inner
    vertices.push(x, y, zTop);
    normals.push(0, 0, -1);
    uvs.push(percent, 0.5 - uvTop);
  }

  for (let thetaIndex = 0; thetaIndex < thetaSegments; thetaIndex++) {
    const botOut = 6 * thetaIndex;
    const midOut = botOut + 1;
    const topOut = botOut + 2;
    const botIn = botOut + 3;
    const midIn = botOut + 4;
    const topIn = botOut + 5;
    let nextBotOut;
    if (thetaIndex === thetaSegments - 1) {
      // last should be connected with first
      nextBotOut = 0;
    } else {
      nextBotOut = 6 * (thetaIndex + 1);
    }
    const nextMidOut = nextBotOut + 1;
    const nextTopOut = nextBotOut + 2;
    const nextBotIn = nextBotOut + 3;
    const nextMidIn = nextBotOut + 4;
    const nextTopIn = nextBotOut + 5;

    // faces

    // base
    indices.push(botOut, botIn, nextBotOut);
    indices.push(nextBotOut, botIn, nextBotIn);

    // top
    indices.push(topOut, nextTopOut, topIn);
    indices.push(nextTopOut, nextTopIn, topIn);

    // inside
    indices.push(botIn, midIn, nextMidIn);
    indices.push(nextMidIn, nextBotIn, botIn);

    // outside
    indices.push(botOut, nextMidOut, midOut);
    indices.push(nextMidOut, botOut, nextBotOut);

    // inside top
    indices.push(midIn, topIn, nextTopIn);
    indices.push(nextTopIn, nextMidIn, midIn);

    // outside top
    indices.push(midOut, nextTopOut, topOut);
    indices.push(nextTopOut, midOut, nextMidOut);
  }

  // build geometry

  this.setIndex(indices);
  this.addAttribute("position", new Float32BufferAttribute(vertices, 3));
  this.addAttribute("normal", new Float32BufferAttribute(normals, 3));
  this.addAttribute("uv", new Float32BufferAttribute(uvs, 2));
}

CustomRingBufferGeometry.prototype = Object.create(BufferGeometry.prototype);
CustomRingBufferGeometry.prototype.constructor = CustomRingBufferGeometry;

export { CustomRingGeometry, CustomRingBufferGeometry };
