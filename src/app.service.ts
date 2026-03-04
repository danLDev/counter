import { Injectable, OnModuleInit } from '@nestjs/common';
import * as PImage from 'pureimage';
// @ts-ignore
import GIFEncoder from 'gif-encoder-2';
import { PassThrough } from 'stream';
import * as path from 'path';
import { setInterval } from 'timers';
import { performance } from 'perf_hooks'
import { parentPort } from 'worker_threads';
import { Worker } from 'worker_threads';

const sizeMultiplier = 2;
const width = 800 * sizeMultiplier;
const height = 250 * sizeMultiplier;


@Injectable()
export class AppService implements OnModuleInit {
  private fontLoaded = false;
  private arcCache = new Map<number, { segmentAngle: number, tickAngle: number, ticks: { angleEnd: number, angleStart: number }[] }>()
  private toDate = new Date('2026-04-20T13:00:00');
  private frameBuffer: { frame: PImage.Bitmap, secondsRemaining: number }[] = [];
  private maxFrames = 80;
  private visibleFrames = 60;
  private latestGifBuffer: Buffer;
  private isEncoding = false;
  private worker: Worker;

  private async buildInitialFrames(to: Date) {
    const now = new Date();
    const totalSeconds = Math.floor((to.getTime() - now.getTime()) / 1000);

    for (let i = 0; i < this.maxFrames; i++) {
      const frame = this.renderFrame(totalSeconds - i);
      this.frameBuffer.push({ frame, secondsRemaining: totalSeconds - i });
    }
  }

  private rotateFrames() {
    this.frameBuffer.shift(); // remove oldest
    const latest = this.frameBuffer[this.frameBuffer.length - 1];

    console.log(this.frameBuffer)
    const frame = this.renderFrame(latest.secondsRemaining - 1);

    this.frameBuffer.push({ frame, secondsRemaining: latest.secondsRemaining - 1 });
  }


  private renderFrame = (secondsRemaining: number) => {
    const img = PImage.make(width, height);
    const ctx = img.getContext('2d');

    const days = Math.floor(secondsRemaining / 86400);
    const hours = Math.floor((secondsRemaining % 86400) / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    const seconds = secondsRemaining % 60;

    // Background
    ctx.fillStyle = '#F2F2F2';
    ctx.fillRect(0, 0, width, height);


    const values = [
      [days, 365],
      [hours, 24],
      [minutes, 60],
      [seconds, 60],
    ];

    const labels = ['DAYS', 'HOURS', 'MINUTES', 'SECONDS'];

    const circleRadius = 90 * sizeMultiplier;
    const startX = 100 * sizeMultiplier;
    const gap = 200 * sizeMultiplier;
    const centerY = 120 * sizeMultiplier;

    values.forEach(([val, total], index) => {
      const cx = startX + index * gap;

      // White circle
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx, centerY, circleRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw ticked arc
      this.drawTickedArc(ctx, cx, centerY, circleRadius - 3, val, total);

      // Number
      ctx.fillStyle = '#6C94AC';
      ctx.font = `${50 * sizeMultiplier}pt PTSans`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), cx, centerY - (10 * sizeMultiplier));

      // Label
      ctx.font = `${20 * sizeMultiplier}pt PTSans`;
      ctx.fillText(labels[index], cx, centerY + (40 * sizeMultiplier));
    });

    return img;
  }

  private buildArcSegments(maxTicks: number) {
    const segmentAngle = (2 * Math.PI) / maxTicks;
    const tickAngle = segmentAngle * (maxTicks >= 100 ? 0.3 : 0.7); // 30% of segment
    const startAngle: number = -Math.PI / 2

    const ticks = [];
    for (let i = 0; i < maxTicks; i++) {

      const angleStart = startAngle + i * segmentAngle;
      const angleEnd = angleStart + tickAngle;
      ticks.push({ angleEnd, angleStart })
    }

    this.arcCache.set(maxTicks, { segmentAngle, tickAngle, ticks })
  }

  async onModuleInit() {
    await this.ensureFontLoaded();
    this.worker = new Worker(path.join(__dirname, 'gif.worker.js'));


    // @ts-ignore
    this.worker!.on('message', (buffer: Buffer) => {
      console.log('WORKER MESSAGE')
      this.latestGifBuffer = buffer;
      this.isEncoding = false;
    });


    [365, 24, 60].forEach(total => this.buildArcSegments(total));

    await this.buildInitialFrames(this.toDate)


    this.encodeInBackground();

    setInterval(() => {
      this.rotateFrames();
      this.encodeInBackground();
    }, 1000);

    console.log('built segments')
  }

  private encodeInBackground() {
    if (this.isEncoding) return;

    this.isEncoding = true;

    const frames = this.frameBuffer
      .slice(0, this.visibleFrames)
      .map(f => f.frame.data);

    this.worker.postMessage({
      frames,
      width,
      height,
    });
  }

  private async ensureFontLoaded() {
    if (this.fontLoaded) return;

    const fontPath = path.join(process.cwd(), 'assets', 'PTSans-Regular.ttf');
    const font = PImage.registerFont(fontPath, 'PTSans');

    await font.load();
    this.fontLoaded = true;
  }

  /**
   * Draws evenly spaced ticked arcs for a circular counter.
   * Each tick represents one unit (e.g., second, minute, hour, day)
   */
  private drawTickedArc(
    ctx: PImage.Context,
    cx: number,
    cy: number,
    radius: number,
    val: number,
    total: number,
  ) {

    const { ticks } = this.arcCache.get(total)!
    const filledTicks = val;



    ctx.strokeStyle = '#7FA6BE';
    ctx.lineWidth = 6;

    for (let i = 0; i < filledTicks; i++) {
      const { angleStart, angleEnd } = ticks[i];

      ctx.beginPath();
      ctx.arc(cx, cy, radius, angleStart, angleEnd);
      ctx.stroke();
    }
  }

  async getCounter(toParam: string): Promise<Buffer> {
    return this.latestGifBuffer
  }
}