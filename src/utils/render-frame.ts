
import * as PImage from 'pureimage';
import { HEIGHT, WIDTH, SIZE_MULTIPLIER } from '../constants';
import { drawTickedArc } from './draw-ticked-arc';



export const renderFrame = (secondsRemaining: number) => {
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
        [days, 60],
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

    return img;
}
