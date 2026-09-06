import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import sharp from 'sharp';
import { preparePhoto } from '../scripts/prepare-restaurant-photo.mjs';

test('normalizes orientation and metadata while preserving the source and existing outputs', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'photo-test-'));
  try {
    const source = join(directory, 'camera.jpeg');
    const destination = join(directory, 'photo.png');
    const original = await sharp({ create: { width: 30, height: 20, channels: 3, background: 'red' } })
      .withMetadata({ orientation: 6 }).jpeg().toBuffer();
    await writeFile(source, original);
    await preparePhoto(source, destination);
    const png = await readFile(destination);
    const metadata = await sharp(png).metadata();
    assert.equal(metadata.format, 'png');
    assert.equal(metadata.width, 20);
    assert.equal(metadata.height, 30);
    assert.equal(metadata.space, 'srgb');
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.icc, undefined);
    assert.deepEqual(await readFile(source), original);
    await preparePhoto(source, destination);
    assert.deepEqual(await readFile(destination), png);
    await assert.rejects(preparePhoto(source, source), /separate output/);
    await writeFile(destination, 'existing output');
    await assert.rejects(preparePhoto(source, destination), /different contents/);
    assert.equal(await readFile(destination, 'utf8'), 'existing output');
    await writeFile(source, 'invalid image');
    const failedOutput = join(directory, 'failed.png');
    await assert.rejects(preparePhoto(source, failedOutput));
    await assert.rejects(readFile(failedOutput), { code: 'ENOENT' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
