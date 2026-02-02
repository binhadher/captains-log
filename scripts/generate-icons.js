#!/usr/bin/env node
/**
 * PWA Icon Generator for Captain's Log
 * Creates nautical-themed icons with teal color scheme
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for the icon - a ship's wheel / helm design
function createIconSVG(size, isMaskable = false) {
  const padding = isMaskable ? size * 0.1 : 0;
  const center = size / 2;
  const radius = (size / 2) - padding - (size * 0.08);
  const innerRadius = radius * 0.35;
  const handleRadius = radius * 0.15;
  const spokeCount = 8;
  
  // Generate spokes
  let spokes = '';
  let handles = '';
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2 - Math.PI / 2;
    const x1 = center + Math.cos(angle) * innerRadius;
    const y1 = center + Math.sin(angle) * innerRadius;
    const x2 = center + Math.cos(angle) * (radius - handleRadius);
    const y2 = center + Math.sin(angle) * (radius - handleRadius);
    const hx = center + Math.cos(angle) * radius;
    const hy = center + Math.sin(angle) * radius;
    
    spokes += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0d9488" stroke-width="${size * 0.035}" stroke-linecap="round"/>`;
    handles += `<circle cx="${hx}" cy="${hy}" r="${handleRadius}" fill="#0d9488"/>`;
  }

  const bgColor = isMaskable ? '#0d9488' : '#f0fdfa';
  const strokeColor = isMaskable ? '#f0fdfa' : '#0d9488';

  if (isMaskable) {
    // Maskable icon - solid teal background with white wheel
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="${bgColor}"/>
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="${size * 0.04}"/>
      <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="none" stroke="${strokeColor}" stroke-width="${size * 0.035}"/>
      ${spokes.replace(/#0d9488/g, strokeColor)}
      ${handles.replace(/#0d9488/g, strokeColor)}
      <circle cx="${center}" cy="${center}" r="${size * 0.06}" fill="${strokeColor}"/>
    </svg>`;
  }
  
  // Regular icon - light background with teal wheel
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f0fdfa"/>
        <stop offset="100%" style="stop-color:#ccfbf1"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bgGrad)"/>
    <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="${size * 0.04}"/>
    <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="none" stroke="${strokeColor}" stroke-width="${size * 0.035}"/>
    ${spokes}
    ${handles}
    <circle cx="${center}" cy="${center}" r="${size * 0.06}" fill="${strokeColor}"/>
  </svg>`;
}

async function generateIcons() {
  console.log('Generating PWA icons for Captain\'s Log...\n');

  // Generate regular icons
  for (const size of sizes) {
    const svg = createIconSVG(size, false);
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    fs.writeFileSync(svgPath, svg);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(pngPath);
    
    console.log(`✓ Created icon-${size}x${size}.png`);
  }

  // Generate maskable icons
  for (const size of [192, 512]) {
    const svg = createIconSVG(size, true);
    const svgPath = path.join(iconsDir, `icon-maskable-${size}x${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-maskable-${size}x${size}.png`);
    
    fs.writeFileSync(svgPath, svg);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(pngPath);
    
    console.log(`✓ Created icon-maskable-${size}x${size}.png`);
  }

  // Apple touch icon (180x180)
  const appleTouchSvg = createIconSVG(180, false);
  fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleTouchSvg);
  await sharp(Buffer.from(appleTouchSvg))
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // Favicon (32x32)
  const faviconSvg = createIconSVG(32, false);
  fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSvg);
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(path.join(iconsDir, 'favicon-32x32.png'));
  console.log('✓ Created favicon-32x32.png');

  // Favicon 16x16
  const favicon16Svg = createIconSVG(16, false);
  await sharp(Buffer.from(favicon16Svg))
    .png()
    .toFile(path.join(iconsDir, 'favicon-16x16.png'));
  console.log('✓ Created favicon-16x16.png');

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
