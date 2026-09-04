const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const androidResDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const iconSource = path.join(__dirname, '..', 'public', 'ICON.png');

async function processImages() {
  console.log('Starting image processing...');
  
  // Read original icon
  const originalBuffer = await fs.promises.readFile(iconSource);
  
  // Create a padded version: We'll put the original image inside a larger white canvas
  // First, get original metadata
  const metadata = await sharp(originalBuffer).metadata();
  
  // We want the icon to have padding. Let's make a new canvas that is 30% larger.
  // E.g., if original is 1000x1000, we make canvas 1400x1400, so it appears smaller.
  const paddingFactor = 1.6; 
  const newWidth = Math.round(metadata.width * paddingFactor);
  const newHeight = Math.round(metadata.height * paddingFactor);

  const paddedIconBuffer = await sharp({
    create: {
      width: newWidth,
      height: newHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
    }
  })
  .composite([
    { input: originalBuffer, gravity: 'center' }
  ])
  .png()
  .toBuffer();

  const resDirs = await fs.promises.readdir(androidResDir);
  
  for (const dir of resDirs) {
    const dirPath = path.join(androidResDir, dir);
    const stat = await fs.promises.stat(dirPath);
    if (!stat.isDirectory()) continue;

    if (dir.startsWith('mipmap')) {
      const files = await fs.promises.readdir(dirPath);
      for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.webp')) {
          await fs.promises.writeFile(path.join(dirPath, file), paddedIconBuffer);
          console.log(`Replaced padded icon in ${dirPath}/${file}`);
        }
      }
    }
  }
  console.log('Done processing padded images.');
}

processImages().catch(console.error);
