const fs = require('fs');
const zlib = require('zlib');
const size = 1024; const stride = 1 + size * 4; const pixels = Buffer.alloc(size * stride);
for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  let color = [245, 240, 232]; const distance = (x - 246) ** 2 + (y - 512) ** 2;
  if (distance <= 110 ** 2) color = distance >= 104 ** 2 ? [26, 26, 26] : [230, 59, 46];
  if (y >= 402 && y <= 616 && Math.abs(x - 512) <= (y - 402) * .52) color = [255, 204, 0];
  if (x >= 680 && x <= 884 && y >= 410 && y <= 614) color = x < 686 || x > 878 || y < 416 || y > 608 ? [26, 26, 26] : [0, 85, 255];
  const offset = y * stride + 1 + x * 4; pixels[offset] = color[0]; pixels[offset + 1] = color[1]; pixels[offset + 2] = color[2]; pixels[offset + 3] = 255;
}
function crc(buffer) { let crc = -1; for (const value of buffer) { crc ^= value; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ -1) >>> 0; }
function chunk(type, data) { const name = Buffer.from(type); const length = Buffer.alloc(4); length.writeUInt32BE(data.length); const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc(Buffer.concat([name, data]))); return Buffer.concat([length, name, data, checksum]); }
const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
fs.mkdirSync('assets', { recursive: true }); fs.writeFileSync('assets/icon.png', png);
