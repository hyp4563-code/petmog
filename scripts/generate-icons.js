import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicIconsDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  if (!fs.existsSync(publicIconsDir)) {
    fs.mkdirSync(publicIconsDir, { recursive: true });
  }

  const svg192 = path.join(publicIconsDir, 'icon-192x192.svg');
  const svg512 = path.join(publicIconsDir, 'icon-512x512.svg');

  const png192 = path.join(publicIconsDir, 'icon-192x192.png');
  const png512 = path.join(publicIconsDir, 'icon-512x512.png');

  try {
    if (fs.existsSync(svg192)) {
      await sharp(svg192)
        .png()
        .toFile(png192);
      console.log('Generated icon-192x192.png');
    }

    if (fs.existsSync(svg512)) {
      await sharp(svg512)
        .png()
        .toFile(png512);
      console.log('Generated icon-512x512.png');
    }
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
