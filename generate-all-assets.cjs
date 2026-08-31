const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputJpg = "C:/Users/HUAWEI/.gemini/antigravity/brain/279d48ca-da7f-4d32-859a-c733d598127f/.user_uploaded/media_1788137487154.jpg";
const publicDir = path.join(__dirname, 'public');
const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

async function processAllAssets() {
  if (!fs.existsSync(inputJpg)) {
    console.error(`Input logo image not found at ${inputJpg}`);
    process.exit(1);
  }

  console.log('🎨 Generating all branding assets from uploaded squirrel logo...');

  // 1. PWA & Web Icons
  await sharp(inputJpg).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));
  await sharp(inputJpg).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(inputJpg).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(inputJpg).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(inputJpg).resize(512, 512).png().toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('✅ Generated all public/ Web & PWA icons.');

  // 2. Android Mipmap Launcher Icons
  const mipmaps = [
    { name: 'mipmap-mdpi', iconSize: 48, foregroundSize: 108 },
    { name: 'mipmap-hdpi', iconSize: 72, foregroundSize: 162 },
    { name: 'mipmap-xhdpi', iconSize: 96, foregroundSize: 216 },
    { name: 'mipmap-xxhdpi', iconSize: 144, foregroundSize: 324 },
    { name: 'mipmap-xxxhdpi', iconSize: 192, foregroundSize: 432 }
  ];

  for (const m of mipmaps) {
    const destFolder = path.join(resDir, m.name);
    if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });

    // ic_launcher.png (square with subtle rounded corners)
    await sharp(inputJpg).resize(m.iconSize, m.iconSize).png().toFile(path.join(destFolder, 'ic_launcher.png'));

    // ic_launcher_round.png (perfect circle)
    const radius = m.iconSize / 2;
    const circleSvg = Buffer.from(`<svg><circle cx="${radius}" cy="${radius}" r="${radius}" /></svg>`);
    await sharp(inputJpg)
      .resize(m.iconSize, m.iconSize)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toFile(path.join(destFolder, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png (safe zone centered on 108dp canvas)
    // In Android Adaptive Icons, foreground size has standard size with artwork within 66-72dp center
    const artworkSize = Math.round(m.foregroundSize * 0.72);
    const artworkBuf = await sharp(inputJpg).resize(artworkSize, artworkSize).toBuffer();

    await sharp({
      create: {
        width: m.foregroundSize,
        height: m.foregroundSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{ input: artworkBuf, gravity: 'center' }])
    .png()
    .toFile(path.join(destFolder, 'ic_launcher_foreground.png'));

    console.log(`✅ Generated launcher icons for ${m.name}`);
  }

  // 3. Android Splash Screens
  const splashes = [
    { folder: 'drawable', w: 480, h: 800 },
    { folder: 'drawable-port-mdpi', w: 320, h: 480 },
    { folder: 'drawable-port-hdpi', w: 480, h: 800 },
    { folder: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { folder: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { folder: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { folder: 'drawable-land-mdpi', w: 480, h: 320 },
    { folder: 'drawable-land-hdpi', w: 800, h: 480 },
    { folder: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { folder: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { folder: 'drawable-land-xxxhdpi', w: 1920, h: 1280 }
  ];

  for (const s of splashes) {
    const destFolder = path.join(resDir, s.folder);
    if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });

    const logoDimension = Math.round(Math.min(s.w, s.h) * 0.45);
    const splashLogo = await sharp(inputJpg).resize(logoDimension, logoDimension).png().toBuffer();

    await sharp({
      create: {
        width: s.w,
        height: s.h,
        channels: 4,
        background: { r: 25, g: 87, b: 72, alpha: 1 } // #195748 Dark Emerald Green
      }
    })
    .composite([{ input: splashLogo, gravity: 'center' }])
    .png()
    .toFile(path.join(destFolder, 'splash.png'));

    console.log(`✅ Generated splash screen for ${s.folder}`);
  }

  console.log('🎉 ALL BRANDING & LOGO ASSETS HAVE BEEN FULLY UPDATED!');
}

processAllAssets().catch(console.error);
