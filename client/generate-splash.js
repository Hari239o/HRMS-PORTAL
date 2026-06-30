const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'public/geonixa-logo.png');
const outputPath = path.join(__dirname, 'public/maskable-full-logo.png');

sharp(inputPath)
  .flatten({ background: { r: 255, g: 255, b: 255 } }) // Replace transparent with white
  .resize(512, 512, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 } // Add padding if needed
  })
  .toFile(outputPath)
  .then(info => console.log('Successfully generated maskable full logo:', info))
  .catch(err => console.error('Error generating logo:', err));
