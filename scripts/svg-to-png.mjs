// scripts/svg-to-png.mjs
import sharp from 'sharp'

await sharp('public/eastun-icon-light.svg')
  .resize(1024, 1024)
  .png()
  .toFile('build/icon-1024.png')