// gif.worker.ts

import { parentPort } from 'worker_threads';
// @ts-ignore
import GIFEncoder from 'gif-encoder-2';
import { PassThrough } from 'stream';
import { renderFrame } from './utils/render-frame';
import * as path from 'path';
import * as PImage from 'pureimage';

const sizeMultiplier = 2;
const width = 800 * sizeMultiplier;
const height = 250 * sizeMultiplier;
const toDate = new Date('2026-04-20T13:00:00');

const visibleFrames = 60;

const generate = () => {
  console.log('Worker: Generating image buffer')
  const encoder = new GIFEncoder(width, height);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(1000);
  encoder.setQuality(10);
  const now = new Date();
  const totalSeconds = Math.floor((toDate.getTime() - now.getTime()) / 1000);

  const stream = new PassThrough();
  encoder.createReadStream().pipe(stream);

  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => chunks.push(chunk));


  for (let i = 0; i < visibleFrames; i++) {
    const frame = renderFrame(totalSeconds - i);
    encoder.addFrame(frame.data);
  }

  encoder.finish();

  stream.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log('Worker: Generated Image buffer')
    parentPort!.postMessage(buffer);
    setTimeout(() => generate(), 2000);
  });
}




const run = async () => {

  const fontPath = path.join(process.cwd(), 'assets', 'PTSans-Regular.ttf');
  const font = PImage.registerFont(fontPath, 'PTSans');

  await font.load();

  generate();
}

run()