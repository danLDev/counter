// gif.worker.ts

import { parentPort } from 'worker_threads';
// @ts-ignore
import GIFEncoder from 'gif-encoder-2';
import { PassThrough } from 'stream';

parentPort!.on('message', async ({ frames, width, height }) => {

  const encoder = new GIFEncoder(width, height);

  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(1000);
  encoder.setQuality(10);

  const stream = new PassThrough();
  encoder.createReadStream().pipe(stream);

  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => chunks.push(chunk));

  for (const frame of frames) {
    encoder.addFrame(frame);
  }

  encoder.finish();

  stream.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log('RETURNING BUFFER')
    parentPort!.postMessage(buffer);
  });
});