/**
 * scripts/generate-apple-splash.ts
 *
 * Générateur effectif des 12 écrans de démarrage Apple iOS via Sharp.
 * Compose le logo au centre d'un fond teinté aux couleurs du restaurant.
 *
 * Évite définitivement l'écran blanc au lancement PWA sur iPad et iPhone.
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export interface AppleSplashConfig {
  device: string;
  width: number;
  height: number;
  scale: number;
  orientation: 'portrait' | 'landscape';
}

export const APPLE_SPLASH_DEVICES: AppleSplashConfig[] = [
  // iPhone 16 Pro Max / 17 Pro Max (6.9")
  { device: 'iPhone 17 Pro Max / 16 Pro Max (6.9")', width: 1320, height: 2868, scale: 3, orientation: 'portrait' },
  // iPhone 16 Pro / 17 Pro (6.3")
  { device: 'iPhone 17 Pro / 16 Pro (6.3")', width: 1206, height: 2622, scale: 3, orientation: 'portrait' },
  // iPhone 15 Pro Max / 14 Pro Max / 16 Plus (6.7")
  { device: 'iPhone 15 Pro Max / 14 Pro Max / 16 Plus', width: 1290, height: 2796, scale: 3, orientation: 'portrait' },
  // iPhone 15 Pro / 14 Pro (6.1" Dynamic Island)
  { device: 'iPhone 15 Pro / 14 Pro', width: 1179, height: 2556, scale: 3, orientation: 'portrait' },
  // iPhone 16 / 15 / 14 / 13 / 12 (6.1")
  { device: 'iPhone 16 / 15 / 14 / 13 / 12', width: 1170, height: 2532, scale: 3, orientation: 'portrait' },
  // iPhone 11 Pro Max / XS Max
  { device: 'iPhone 11 Pro Max / XS Max', width: 1242, height: 2688, scale: 3, orientation: 'portrait' },
  // iPhone 11 Pro / XS / X
  { device: 'iPhone 11 Pro / XS / X', width: 1125, height: 2436, scale: 3, orientation: 'portrait' },
  // iPhone 11 / XR
  { device: 'iPhone 11 / XR', width: 828, height: 1792, scale: 2, orientation: 'portrait' },
  // iPhone SE (3rd/2nd gen) / 8 / 7
  { device: 'iPhone SE (3rd/2nd gen)', width: 750, height: 1334, scale: 2, orientation: 'portrait' },
  // iPad Pro 13" M4 (2024-2026)
  { device: 'iPad Pro 13" M4', width: 2064, height: 2752, scale: 2, orientation: 'portrait' },
  // iPad Pro 11" M4 (2024-2026)
  { device: 'iPad Pro 11" M4', width: 1668, height: 2420, scale: 2, orientation: 'portrait' },
  // iPad Pro 12.9" (Gen 3-6)
  { device: 'iPad Pro 12.9"', width: 2048, height: 2732, scale: 2, orientation: 'portrait' },
  // iPad Pro 11" (Gen 1-4)
  { device: 'iPad Pro 11"', width: 1668, height: 2388, scale: 2, orientation: 'portrait' },
  // iPad 10.9" / 10.2" / Air
  { device: 'iPad 10.9" / 10.2" / Air', width: 1620, height: 2160, scale: 2, orientation: 'portrait' },
  // iPad Mini
  { device: 'iPad Mini', width: 1536, height: 2048, scale: 2, orientation: 'portrait' },
  // iPad Pro 13" M4 (Landscape)
  { device: 'iPad Pro 13" M4 (Landscape)', width: 2752, height: 2064, scale: 2, orientation: 'landscape' },
  // iPad Pro 11" M4 (Landscape)
  { device: 'iPad Pro 11" M4 (Landscape)', width: 2420, height: 1668, scale: 2, orientation: 'landscape' },
  // iPad Pro 12.9" (Landscape)
  { device: 'iPad Pro 12.9" (Landscape)', width: 2732, height: 2048, scale: 2, orientation: 'landscape' },
  // iPad Pro 11" (Landscape)
  { device: 'iPad Pro 11" (Landscape)', width: 2388, height: 1668, scale: 2, orientation: 'landscape' },
];


export async function generateAppleSplashScreens(options?: {
  outputDir?: string;
  backgroundColor?: string;
  logoPath?: string;
  accentColor?: string;
}) {
  const outputDir = options?.outputDir ?? path.resolve(process.cwd(), 'public/icons/splash');
  const backgroundColor = options?.backgroundColor ?? '#0B0B0C';
  const accentColor = options?.accentColor ?? '#C5A059';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Parse Hex color to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 11;
  const g = parseInt(hex.substring(2, 4), 16) || 11;
  const b = parseInt(hex.substring(4, 6), 16) || 12;

  // Création d'un buffer de logo SVG vectoriel élégant si aucun fichier fourni
  const defaultLogoSvg = Buffer.from(`
    <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <circle cx="200" cy="200" r="160" fill="none" stroke="${accentColor}" stroke-width="6" opacity="0.3"/>
      <circle cx="200" cy="200" r="130" fill="${accentColor}" fill-opacity="0.1" stroke="${accentColor}" stroke-width="3"/>
      <path d="M 140 180 Q 200 130 260 180 L 250 250 Q 200 280 150 250 Z" fill="${accentColor}"/>
      <text x="200" y="320" font-family="serif" font-size="28" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">RESTAURANT OS</text>
    </svg>
  `);

  const logoBuffer = options?.logoPath && fs.existsSync(options.logoPath)
    ? fs.readFileSync(options.logoPath)
    : defaultLogoSvg;

  console.log(`🚀 [Apple Splash] Génération des 12 résolutions iOS dans ${outputDir}...`);

  for (const config of APPLE_SPLASH_DEVICES) {
    const filename = `apple-splash-${config.width}x${config.height}.png`;
    const targetPath = path.join(outputDir, filename);

    // Calcul de la taille du logo proportionnelle à l'écran (25% du petit côté)
    const minDim = Math.min(config.width, config.height);
    const logoTargetSize = Math.round(minDim * 0.35);

    const resizedLogo = await sharp(logoBuffer)
      .resize(logoTargetSize, logoTargetSize, { fit: 'inside' })
      .toBuffer();

    const logoMetadata = await sharp(resizedLogo).metadata();
    const logoWidth = logoMetadata.width ?? logoTargetSize;
    const logoHeight = logoMetadata.height ?? logoTargetSize;

    const left = Math.round((config.width - logoWidth) / 2);
    const top = Math.round((config.height - logoHeight) / 2);

    await sharp({
      create: {
        width: config.width,
        height: config.height,
        channels: 4,
        background: { r, g, b, alpha: 1 },
      },
    })
      .composite([
        {
          input: resizedLogo,
          left,
          top,
        },
      ])
      .png({ quality: 90, compressionLevel: 8 })
      .toFile(targetPath);

    console.log(`  ✓ ${filename} (${config.device})`);
  }

  console.log(`✅ [Apple Splash] 12 images de démarrage iOS générées avec succès.`);

  // 🤖 Génération des icônes PWA Android (Standard & Maskable pour Adaptive Icons)
  const iconsDir = path.resolve(outputDir, '..');
  console.log(`🤖 [Android PWA] Génération des icônes Android dans ${iconsDir}...`);

  // 192x192 Standard
  await sharp(logoBuffer)
    .resize(192, 192, { fit: 'inside' })
    .png({ quality: 95 })
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log(`  ✓ icon-192.png (Standard Android/Chrome)`);

  // 512x512 Standard
  await sharp(logoBuffer)
    .resize(512, 512, { fit: 'inside' })
    .png({ quality: 95 })
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log(`  ✓ icon-512.png (Standard Android/WebAPK)`);

  // 192x192 Maskable (avec 20% safe-zone padding pour les découpes Pixel / Samsung)
  const maskableLogo192 = await sharp(logoBuffer)
    .resize(150, 150, { fit: 'inside' })
    .toBuffer();
  await sharp({
    create: { width: 192, height: 192, channels: 4, background: { r, g, b, alpha: 1 } }
  })
    .composite([{ input: maskableLogo192, left: 21, top: 21 }])
    .png({ quality: 95 })
    .toFile(path.join(iconsDir, 'icon-maskable-192.png'));
  console.log(`  ✓ icon-maskable-192.png (Adaptive Icon Pixel/Samsung)`);

  // 512x512 Maskable
  const maskableLogo512 = await sharp(logoBuffer)
    .resize(400, 400, { fit: 'inside' })
    .toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r, g, b, alpha: 1 } }
  })
    .composite([{ input: maskableLogo512, left: 56, top: 56 }])
    .png({ quality: 95 })
    .toFile(path.join(iconsDir, 'icon-maskable-512.png'));
  console.log(`  ✓ icon-maskable-512.png (WebAPK Splash Icon Android)`);

  // Badge notifications 72x72
  await sharp(logoBuffer)
    .resize(72, 72, { fit: 'inside' })
    .png({ quality: 90 })
    .toFile(path.join(iconsDir, 'badge-72.png'));
  console.log(`  ✓ badge-72.png (Push Notifications Android Status Bar)`);

  console.log(`✅ [Android PWA] Icônes universelles Android générées avec succès.`);
}


export function getAppleSplashLinkTags(baseUrl: string = '/icons/splash') {
  return APPLE_SPLASH_DEVICES.map((config) => {
    const filename = `apple-splash-${config.width}x${config.height}.png`;
    const media = `(device-width: ${config.width / config.scale}px) and (device-height: ${config.height / config.scale}px) and (-webkit-device-pixel-ratio: ${config.scale}) and (orientation: ${config.orientation})`;
    return {
      rel: 'apple-touch-startup-image',
      href: `${baseUrl}/${filename}`,
      media,
    };
  });
}

// Exécution directe via CLI
if (process.argv[1]?.includes('generate-apple-splash')) {
  generateAppleSplashScreens().catch((err) => {
    console.error('❌ Erreur génération splash iOS:', err);
    process.exit(1);
  });
}
