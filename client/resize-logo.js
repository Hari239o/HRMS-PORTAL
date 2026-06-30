const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'public/logo-only.png');
const outputPath = path.join(__dirname, 'public/maskable-logo.png');

sharp(inputPath)
  .resize(300, 300, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  })
  .extend({
    top: 106,
    bottom: 106,
    left: 106,
    right: 106,
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  })
  .toFile(outputPath)
  .then(() => {
    console.log('Successfully created maskable-logo.png with white padding.');
  })
  .catch(err => {
    console.error('Error generating image:', err);
  });
