import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function normalize(input) {
  // Decode the primary still; autoOrient applies EXIF before metadata is stripped.
  return sharp(input).autoOrient().toColourspace('srgb').png().toBuffer();
}

export async function preparePhoto(source, destination) {
  if (resolve(source) === resolve(destination) || extname(destination).toLowerCase() !== '.png') {
    throw new Error('Choose a separate output path ending in .png.');
  }
  const original = await readFile(source);
  let png;
  try {
    png = await normalize(original);
  } catch (error) {
    // macOS supplies the HEIC decoder absent from common prebuilt Sharp packages.
    if (process.platform !== 'darwin' || !/\.hei[cf]$/i.test(source)) throw error;
    const temporary = await mkdtemp(join(tmpdir(), 'restaurant-photo-'));
    try {
      const decoded = join(temporary, 'decoded.png');
      await run('/usr/bin/sips', ['-s', 'format', 'png', resolve(source), '--out', decoded]);
      png = await normalize(decoded);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }
  const metadata = await sharp(png).metadata();
  await mkdir(dirname(resolve(destination)), { recursive: true });
  try {
    await writeFile(destination, png, { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (!(await readFile(destination)).equals(png)) {
      throw new Error(`Output already exists with different contents: ${destination}. Choose a new filename.`);
    }
  }
  if (hash(await readFile(source)) !== hash(original)) throw new Error('Source changed during conversion.');
  return { source, destination, width: metadata.width, height: metadata.height, sourceSha256: hash(original) };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args.includes('--help')) {
    console.log('Usage: pnpm photo:prepare <camera-file> <output.png>\nPreserves the source; writes a full-resolution, oriented sRGB PNG without metadata.\nJPEG/MPO and PNG use Sharp. HEIC/HEIF can also use macOS sips.');
    process.exitCode = args.includes('--help') ? 0 : 1;
  } else {
    try {
      console.log(JSON.stringify(await preparePhoto(...args), null, 2));
    } catch (error) {
      console.error(`Photo preparation failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
