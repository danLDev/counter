import { Controller, Get, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('countdown')
  async getCountdown(
    @Res() res: Response,
  ) {
    const gifBuffer = await this.appService.getCounter();

    res.set({
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, max-age=0',
    });

    res.send(gifBuffer);
  }
}