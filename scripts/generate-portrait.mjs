import sharp from 'sharp';
import { fileURLToPath, URL } from 'node:url';

// Next.js already installs sharp through the locked dependency tree.
const source = fileURLToPath(new URL('../public/guozi.jpg', import.meta.url));
for (const width of [320, 640]) {
  await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 95, effort: 6 })
    .toFile(fileURLToPath(new URL(`../public/portrait-${width}.webp`, import.meta.url)));
}
