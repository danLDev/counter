import { Injectable } from '@nestjs/common';
import * as PImage from 'pureimage';
// @ts-ignore
import GIFEncoder from 'gif-encoder-2';
import { PassThrough } from 'stream';
import * as path from 'path';

@Injectable()
export class AppService {
  private fontLoaded = false;

  private async ensureFontLoaded() {
    if (this.fontLoaded) return;

    const fontPath = path.join(process.cwd(), 'assets', 'PTSans-Regular.ttf');
    const font = PImage.registerFont(fontPath, 'PTSans');

    await font.load();

    this.fontLoaded = true;
  }

  async getCounter(toParam: string): Promise<Buffer> {
    await this.ensureFontLoaded();

    const to = new Date(toParam);
    if (isNaN(to.getTime())) {
      throw new Error('Invalid "to" date');
    }

    const now = new Date();
    const diffMs = to.getTime() - now.getTime();
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

    const width = 500;
    const height = 150;

    const encoder = new GIFEncoder(width, height);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(1000);
    encoder.setQuality(10);

    const stream = new PassThrough();
    encoder.createReadStream().pipe(stream);

    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));

    for (let i = 0; i < 10; i++) {
      const remaining = Math.max(0, totalSeconds - i);

      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      const formatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const img = PImage.make(width, height);
      const ctx = img.getContext('2d');

      // Background
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, width, height);

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = "40pt PTSans";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatted, width / 2, height / 2);

      encoder.addFrame(ctx);
    }

    encoder.finish();

    return new Promise((resolve) => {
      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }
}