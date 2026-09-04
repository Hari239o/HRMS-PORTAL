const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, 'client');
const androidResDir = path.join(clientDir, 'android', 'app', 'src', 'main', 'res');
const iconSource = path.join(__dirname, 'public', 'ICON.png');

async function processImages() {
  console.log('Starting image processing...');
  
  // 1x1 transparent PNG base64
  const transparentPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const blankSplashBuffer = Buffer.from(transparentPngBase64, 'base64');

  const iconBuffer = await fs.promises.readFile(iconSource);

  const resDirs = await fs.promises.readdir(androidResDir);
  
  for (const dir of resDirs) {
    const dirPath = path.join(androidResDir, dir);
    const stat = await fs.promises.stat(dirPath);
    if (!stat.isDirectory()) continue;

    if (dir.startsWith('mipmap')) {
      const files = await fs.promises.readdir(dirPath);
      for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.webp')) {
          await fs.promises.writeFile(path.join(dirPath, file), iconBuffer);
          console.log(`Replaced icon in ${dirPath}/${file}`);
        }
      }
    }

    if (dir.startsWith('drawable')) {
      const splashPath = path.join(dirPath, 'splash.png');
      if (fs.existsSync(splashPath)) {
        await fs.promises.writeFile(splashPath, blankSplashBuffer);
        console.log(`Replaced splash in ${dirPath}/splash.png`);
      }
    }
  }
  console.log('Done processing images.');
}

processImages().catch(console.error);
