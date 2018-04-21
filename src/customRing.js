import {
  Geometry,
  BufferGeometry,
  Float32BufferAttribute,
  Vector2,
  Vector3,
} from "three";
import { POINT_CONVERSION_HYBRID } from "constants";

// TODO the normals I'm generating here end up being recomputed later. I'd like
// to add a custom computation, especially for the top and bottom faces

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

  const pointHeightFactor = 5;
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
    let zMidTop;
    let zMidBot;
    if (invert) {
      zTop = maxHeight;
      zBot = zTop - pointHeight;
      zMidBot = zTop - pointHeightOffset
      zMidTop = zBot + pointHeightOffset;
    } else {
      zBot = 0;
      zTop = zBot + pointHeight;
      zMidBot = zBot + pointHeightOffset
      zMidTop = zTop - pointHeightOffset;
    }

    const uvMidTop = (pointHeight - pointHeightOffset) / maxHeight / 2;
    const uvTop = pointHeight / maxHeight / 2;
    const outerNormal = new Vector3(cosAngle, sinAngle, 0).normalize();
    const innerNormal = new Vector3(-cosAngle, -sinAngle, 0).normalize();

    // NOTE: not dealing with uvs for inverted, since my inverted ring doesn't
    // use texture maps

    // bottom outer
    vertices.push(x, y, zBot);
    normals.push(0, 0, 1);
    uvs.push(1 - percent, 0.5);
    // mid bot outer
    vertices.push(x, y, zMidBot);
    normals.push(outerNormal.x, outerNormal.y, outerNormal.z);
    uvs.push(1 - percent, 0.5 + pointsEdgeHeightPercent / 2);
    // mid top outer
    vertices.push(x, y, zMidTop);
    normals.push(outerNormal.x, outerNormal.y, outerNormal.z);
    uvs.push(1 - percent, 0.5 + uvMidTop);
    // top outer
    vertices.push(x, y, zTop);
    normals.push(0, 0, -1);
    uvs.push(1 - percent, 0.5 + uvTop);

    x = innerRadius * cosAngle;
    y = innerRadius * sinAngle;

    // bottom inner
    vertices.push(x, y, zBot);
    normals.push(0, 0, 1);
    uvs.push(1 - percent, 0);
    // mid bot inner
    vertices.push(x, y, zMidBot);
    normals.push(innerNormal.x, innerNormal.y, innerNormal.z);
    uvs.push(1 - percent, pointsEdgeHeightPercent / 2);
    // mid top inner
    vertices.push(x, y, zMidTop);
    normals.push(innerNormal.x, innerNormal.y, innerNormal.z);
    uvs.push(1 - percent, 0.5 - uvMidTop);
    // top inner
    vertices.push(x, y, zTop);
    normals.push(0, 0, -1);
    uvs.push(1 - percent, 0.5 - uvTop);
  }

  for (let thetaIndex = 0; thetaIndex < thetaSegments; thetaIndex++) {
    const botOut = 8 * thetaIndex;
    const midBotOut = botOut + 1;
    const midTopOut = botOut + 2;
    const topOut = botOut + 3;
    const botIn = botOut + 4;
    const midBotIn = botOut + 5;
    const midTopIn = botOut + 6;
    const topIn = botOut + 7;
    let nextBotOut;
    if (thetaIndex === thetaSegments - 1) {
      // last should be connected with first
      nextBotOut = 0;
    } else {
      nextBotOut = 8 * (thetaIndex + 1);
    }
    const nextMidBotOut = nextBotOut + 1;
    const nextMidTopOut = nextBotOut + 2;
    const nextTopOut = nextBotOut + 3;
    const nextBotIn = nextBotOut + 4;
    const nextMidBotIn = nextBotOut + 5;
    const nextMidTopIn = nextBotOut + 6;
    const nextTopIn = nextBotOut + 7;

    // faces

    // base
    indices.push(botOut, botIn, nextBotOut);
    indices.push(nextBotOut, botIn, nextBotIn);

    // top
    indices.push(topOut, nextTopOut, topIn);
    indices.push(nextTopOut, nextTopIn, topIn);

    // inside
    indices.push(botIn, midTopIn, nextMidTopIn);
    indices.push(nextMidTopIn, nextBotIn, botIn);

    // outside
    indices.push(botOut, nextMidTopOut, midTopOut);
    indices.push(nextMidTopOut, botOut, nextBotOut);

    // inside top
    indices.push(midTopIn, topIn, nextTopIn);
    indices.push(nextTopIn, nextMidTopIn, midTopIn);

    // outside top
    indices.push(midTopOut, nextTopOut, topOut);
    indices.push(nextTopOut, midTopOut, nextMidTopOut);

    // inside bot
    indices.push(midBotIn, botIn, nextBotIn);
    indices.push(nextBotIn, nextMidBotIn, midBotIn);

    // outside bot
    indices.push(midBotOut, nextBotOut, botOut);
    indices.push(nextBotOut, midBotOut, nextMidBotOut);
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
