import { Injectable } from '@nestjs/common';
import * as PImage from 'pureimage';
// @ts-ignore
import GIFEncoder from 'gif-encoder-2';
import { PassThrough } from 'stream';
import * as path from 'path';

const sizeMultiplier = 1.5;
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
    maxTicks: number = 60,
    startAngle: number = -Math.PI / 2
  ) {
    const filledTicks = Math.round((val / total) * maxTicks);
    const segmentAngle = (2 * Math.PI) / maxTicks;
    const tickAngle = segmentAngle * 0.7; // 70% of segment
    const gapAngle = segmentAngle - tickAngle;

    ctx.strokeStyle = '#7FA6BE';
    ctx.lineWidth = 6;

    for (let i = 0; i < filledTicks; i++) {
      const angleStart = startAngle + i * segmentAngle;
      const angleEnd = angleStart + tickAngle;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, angleStart, angleEnd);
      ctx.stroke();
    }
  }


  async getCounter(toParam: string): Promise<Buffer> {
    await this.ensureFontLoaded();

    const to = new Date(toParam);
    if (isNaN(to.getTime())) {
      throw new Error('Invalid "to" date');
    }

    const now = new Date();
    const totalSeconds = Math.max(0, Math.floor((to.getTime() - now.getTime()) / 1000));

    const width = 800 * sizeMultiplier;
    const height = 250 * sizeMultiplier;

    const encoder = new GIFEncoder(width, height);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(1000); // 1 second per frame
    encoder.setQuality(10);

    const stream = new PassThrough();
    encoder.createReadStream().pipe(stream);

    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));

    // Generate one frame per second (or limit for very long countdowns)
    const frames = Math.min(totalSeconds, 60);

    for (let i = 0; i < frames; i++) {
      const remaining = Math.max(0, totalSeconds - i);

      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      const img = PImage.make(width, height);
      const ctx = img.getContext('2d');

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
        ctx.font = '50pt PTSans';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(val), cx, centerY);

        // Label
        ctx.font = '24pt PTSans';
        ctx.fillText(labels[index], cx, centerY + 40);
      });

      encoder.addFrame(ctx);
    }

    encoder.finish();

    return new Promise((resolve) => {
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}