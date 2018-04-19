const fs = require("fs");
const points = require("./points.json");

const xs = points.map(([x]) => x);
const ys = points.map(([, y]) => y);
const maxX = Math.max(...xs);
const maxY = Math.max(...ys);
const minX = Math.min(...xs);
const minY = Math.min(...ys);

fs.writeFileSync(
  "scaledPoints.json",
  JSON.stringify(
    points
      .map(([x, y]) => [(x - minX) / (maxX - minX), (y - minY) / (maxY - minY)])
      .sort(([ax, ay], [bx, by]) => (ax < bx ? -1 : ax > bx ? 1 : 0)),
    null,
    2,
  ),
);
