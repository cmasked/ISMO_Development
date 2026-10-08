const moduleValue = require('image-size');
const imageSize = moduleValue.imageSize || moduleValue.default;
if (typeof imageSize !== 'function') throw new Error('Unsupported patched image-size API.');
module.exports = Object.assign(imageSize, moduleValue, { default: imageSize, imageSize });
