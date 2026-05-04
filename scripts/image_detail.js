const zlib = require("zlib");

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function parsePng(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("Expected a PNG screenshot buffer.");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) throw new Error("Invalid PNG chunk length.");
    const data = buffer.subarray(dataStart, dataEnd);

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }

    offset = dataEnd + 4;
  }

  if (!width || !height || bitDepth !== 8) {
    throw new Error(`Unsupported PNG metadata: ${width}x${height}, bit depth ${bitDepth}.`);
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : null;
  if (!channels) throw new Error(`Unsupported PNG colour type ${colorType}.`);

  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * channels);
  let input = 0;
  let output = 0;
  let previous = Buffer.alloc(stride);

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[input];
    input += 1;
    const current = Buffer.alloc(stride);
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[input + x];
      const left = x >= channels ? current[x - channels] : 0;
      const up = previous[x] || 0;
      const upLeft = x >= channels ? previous[x - channels] || 0 : 0;
      current[x] = (raw + filterDelta(filter, left, up, upLeft)) & 0xff;
    }
    current.copy(pixels, output);
    input += stride;
    output += stride;
    previous = current;
  }

  return { width, height, channels, pixels };
}

function filterDelta(filter, left, up, upLeft) {
  if (filter === 0) return 0;
  if (filter === 1) return left;
  if (filter === 2) return up;
  if (filter === 3) return Math.floor((left + up) / 2);
  if (filter === 4) return paeth(left, up, upLeft);
  throw new Error(`Unsupported PNG filter ${filter}.`);
}

function paeth(left, up, upLeft) {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upLeft;
}

function imageDetail(buffer, options = {}) {
  const { width, height, channels, pixels } = parsePng(buffer);
  const step = Math.max(1, Number(options.step || 10));
  const unique = new Set();
  let count = 0;
  let luminanceSum = 0;
  let luminanceSumSquares = 0;
  let chromatic = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const offset = (y * width + x) * channels;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      luminanceSum += luminance;
      luminanceSumSquares += luminance * luminance;
      if (Math.max(r, g, b) - Math.min(r, g, b) > 10) chromatic += 1;
      unique.add(`${r >> 4},${g >> 4},${b >> 4}`);
      count += 1;
    }
  }

  const mean = luminanceSum / Math.max(1, count);
  return {
    width,
    height,
    samples: count,
    uniqueColours: unique.size,
    luminanceStdev: Math.sqrt(Math.max(0, luminanceSumSquares / Math.max(1, count) - mean * mean)),
    chromaticRatio: chromatic / Math.max(1, count),
  };
}

function assertDetailedPng(buffer, assert, label) {
  const detail = imageDetail(buffer);
  assert(detail.width >= 240 && detail.height >= 180, `${label} screenshot is too small to verify.`);
  assert(
    detail.uniqueColours >= 35 && detail.luminanceStdev >= 12 && detail.chromaticRatio >= 0.08,
    `${label} looks visually blank or low-detail: ${JSON.stringify(detail)}`
  );
  return detail;
}

module.exports = {
  imageDetail,
  assertDetailedPng,
};
