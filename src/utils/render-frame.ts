
import * as PImage from 'pureimage';
import { HEIGHT, WIDTH, SIZE_MULTIPLIER, TOTAL_SECONDS, FROM_DATE, TO_DATE, TOTAL_DAYS } from '../constants';
import { drawTickedArc } from './draw-ticked-arc';
import fs from 'fs';
import path from 'path';

const planePath = path.join(process.cwd(), 'assets', 'plane.png');


export const renderFrame = async (secondsRemaining: number) => {
    const img = PImage.make(WIDTH, HEIGHT);
    const ctx = img.getContext('2d');

    const days = Math.floor(secondsRemaining / 86400);
    const hours = Math.floor((secondsRemaining % 86400) / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    const seconds = secondsRemaining % 60;

    // Background
    ctx.fillStyle = '#F2F2F2';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const values = [
        [days, TOTAL_DAYS],
        [hours, 24],
        [minutes, 60],
        [seconds, 60],
    ];

    const labels = ['DAYS', 'HOURS', 'MINUTES', 'SECONDS'];

    const circleRadius = 90 * SIZE_MULTIPLIER;
    const startX = 100 * SIZE_MULTIPLIER;
    const gap = 200 * SIZE_MULTIPLIER;
    const centerY = 120 * SIZE_MULTIPLIER;

    values.forEach(([val, total], index) => {
        const cx = startX + index * gap;

        // White circle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx, centerY, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw ticked arc
        drawTickedArc(ctx, cx, centerY, circleRadius - 3, val, total);
        // Number
        ctx.fillStyle = '#6C94AC';
        ctx.font = `${50 * SIZE_MULTIPLIER}pt PTSans`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(val), cx, centerY - (10 * SIZE_MULTIPLIER));

        // Label
        ctx.font = `${20 * SIZE_MULTIPLIER}pt PTSans`;
        ctx.fillText(labels[index], cx, centerY + (40 * SIZE_MULTIPLIER));
    });


    const lineStart = startX - 50

    const lineEnd = WIDTH - lineStart;

    const lineY = 230 * SIZE_MULTIPLIER;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath()
    ctx.moveTo(lineStart, lineY);
    ctx.lineTo(lineEnd, lineY);
    ctx.stroke()

    const length = lineEnd - lineStart;


    const percentCompleted = 1 - (secondsRemaining / TOTAL_SECONDS);

    console.log('percentCompleted')

    ctx.strokeStyle = '#7FA6BE';
    ctx.beginPath()
    ctx.moveTo(lineStart, lineY);
    ctx.lineTo(lineStart + length * percentCompleted, lineY);
    ctx.stroke()




    // ---- Draw plane at end of progress bar ----
    const planeImg = await PImage.decodePNGFromStream(fs.createReadStream(planePath));
    const planeWidth = 30 * SIZE_MULTIPLIER;
    const planeHeight = 20 * SIZE_MULTIPLIER;

    // X position: progress bar start + progress length
    const planeX = lineStart + length * percentCompleted + 5;
    const planeY = lineY - planeHeight / 2;

    ctx.drawImage(planeImg, planeX, planeY, planeWidth, planeHeight);

    return img;
}
