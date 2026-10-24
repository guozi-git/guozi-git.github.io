import sharp from 'sharp';
import console from 'node:console';
import { stat } from 'node:fs/promises';

// Preserve the approved SVG crop exactly; retain the full original as source material.
const source = 'public/interests/1023-concept-photos-v1.png';
let total = 0;
for (const [name, top] of Object.entries({ badminton: 234, swimming: 486, gaming: 738 })) {
  const output = `public/interests/1024-${name}-v1.webp`;
  await sharp(source)
    .extract({ left: 96, top, width: 474, height: 198 })
    .webp({ quality: 94 })
    .toFile(output);
  const bytes = (await stat(output)).size;
  total += bytes;
  console.log(`${output}: ${bytes} bytes`);
}
console.log(`Total: ${total}; source: ${(await stat(source)).size} bytes`);
