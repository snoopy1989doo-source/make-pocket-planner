const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputJpg = "C:/Users/HUAWEI/.gemini/antigravity/brain/279d48ca-da7f-4d32-859a-c733d598127f/.user_uploaded/media_1788137487154.jpg";
const publicDir = path.join(__dirname, 'public');
const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

async function processBranding() {
  if (!fs.existsSync(inputJpg)) {
    console.error(`Input logo image not found at ${inputJpg}`);
    process.exit(1);
  }

  console.log('🎨 Starting regeneration of app icons with new logo...');

  // --- 1. Generate PWA Icons ---
  // Favicon (64x64)
  await sharp(inputJpg)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  // Apple Touch Icon (180x180)
  await sharp(inputJpg)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Icon 192 (192x192)
  await sharp(inputJpg)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // Icon 512 (512x512)
  await sharp(inputJpg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // Maskable 512 (512x512 with safe margin)
  // For maskable icon, we scale the logo slightly (e.g. 80%) and place it inside a solid background,
  // or we can just use the full image since the uploaded image has a clean dark green rounded shape already!
  // Let's use the full logo resized to 512x512 since it's already perfectly designed for an app icon.
  await sharp(inputJpg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));

  console.log('✅ Generated all PWA icons.');

  // --- 2. Generate Android Launcher Icons ---
  const mipmaps = [
    { name: 'mipmap-mdpi', iconSize: 48, foregroundSize: 108 },
    { name: 'mipmap-hdpi', iconSize: 72, foregroundSize: 162 },
    { name: 'mipmap-xhdpi', iconSize: 96, foregroundSize: 216 },
    { name: 'mipmap-xxhdpi', iconSize: 144, foregroundSize: 324 },
    { name: 'mipmap-xxxhdpi', iconSize: 192, foregroundSize: 432 }
  ];

  for (const m of mipmaps) {
    const destFolder = path.join(resDir, m.name);
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    // A. ic_launcher.png (Standard square icon)
    await sharp(inputJpg)
      .resize(m.iconSize, m.iconSize)
      .png()
      .toFile(path.join(destFolder, 'ic_launcher.png'));

    // B. ic_launcher_round.png (Circular masked icon)
    const radius = m.iconSize / 2;
    const circleSvg = Buffer.from(
      `<svg><circle cx="${radius}" cy="${radius}" r="${radius}" /></svg>`
    );
    await sharp(inputJpg)
      .resize(m.iconSize, m.iconSize)
      .composite([{
        input: circleSvg,
        blend: 'dest-in'
      }])
      .png()
      .toFile(path.join(destFolder, 'ic_launcher_round.png'));

    // C. ic_launcher_foreground.png (Adaptive foreground with transparent background)
    // The squirrel artwork can be extracted or centered. Since the artwork has a solid dark green background,
    // we can either use the artwork itself centered or cut out. The user's new logo has a cute squirrel.
    // Let's create an adaptive foreground where the squirrel artwork is centered at 70% of the adaptive size.
    const logoSize = Math.round(m.foregroundSize * 0.75);
    const logoResized = await sharp(inputJpg)
      .resize(logoSize, logoSize)
      .toBuffer();

    await sharp({
      create: {
        width: m.foregroundSize,
        height: m.foregroundSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{
      input: logoResized,
      gravity: 'center'
    }])
    .png()
    .toFile(path.join(destFolder, 'ic_launcher_foreground.png'));

    console.log(`✅ Generated Android launcher icons for ${m.name}`);
  }

  console.log('🎉 All branding assets updated successfully!');
}

processBranding().catch(err => {
  console.error('Error processing branding assets:', err);
});
