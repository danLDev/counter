import { Injectable, OnModuleInit } from '@nestjs/common';
import * as PImage from 'pureimage';
import * as path from 'path';
import { Worker } from 'worker_threads';

const sizeMultiplier = 2;
const width = 800 * sizeMultiplier;
const height = 250 * sizeMultiplier;


@Injectable()
export class AppService implements OnModuleInit {
  private fontLoaded = false;
  private latestGifBuffer: Buffer;
  private worker: Worker;


  async onModuleInit() {
    console.log('INIT M8')
    await this.ensureFontLoaded();
    this.worker = new Worker(path.join(__dirname, 'gif.worker.js'));

    this.worker.on('message', (buffer: Buffer) => {
      console.log('Main: Received new buffer')
      this.latestGifBuffer = buffer;
    });

    this.worker.on('exit', console.log);
    this.worker.on('error', console.log);
    this.worker.on('messageerror', console.log);


  }


  private async ensureFontLoaded() {
    if (this.fontLoaded) return;

    const fontPath = path.join(process.cwd(), 'assets', 'PTSans-Regular.ttf');
    const font = PImage.registerFont(fontPath, 'PTSans');

    await font.load();
    this.fontLoaded = true;
  }


  async getCounter(): Promise<Buffer> {
    return this.latestGifBuffer
  }
}