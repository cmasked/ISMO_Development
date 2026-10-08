const fs = require('fs');
const path = require('path');
const assert = require('assert');
const file = path.join(path.dirname(require.resolve('metro/package.json')), 'src/Assets.js');
const source = fs.readFileSync(file, 'utf8');
if (!source.includes('ISMO_PATCHED_IMAGE_SIZE')) {
  let count = 0;
  const patched = source.replace(/require\((['"])image-size\1\)/g, () => { count++; return "require('../../../scripts/image-size-bridge.cjs')"; });
  if (!count) throw new Error('Metro image-size integration changed; review compatibility before building.');
  fs.writeFileSync(file, '// ISMO_PATCHED_IMAGE_SIZE: preserve Metro CommonJS API with patched image-size 2.x.\n' + patched);
}
const imageSize = require('./image-size-bridge.cjs');
const dimensions = imageSize(fs.readFileSync('assets/icon.png'));
assert.equal(dimensions.width, 1024); assert.equal(dimensions.height, 1024);
