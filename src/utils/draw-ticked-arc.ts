import * as PImage from 'pureimage';
import { ARC_CACHE } from '../constants';

export const drawTickedArc = (
    ctx: PImage.Context,
    cx: number,
    cy: number,
    radius: number,
    val: number,
    total: number,
) => {
    const { ticks } = ARC_CACHE.get(total)!
    const filledTicks = val;

    ctx.strokeStyle = '#7FA6BE';
    ctx.lineWidth = val < 70 ? 12 : 1;

    for (let i = 0; i < filledTicks; i++) {
        const { angleStart, angleEnd } = ticks[i];
        // console.log('drawing arc ', i, ' of ', total, angleStart, angleEnd)

        if (angleStart !== angleEnd) {
            try {

                const angle = (angleStart + angleEnd) / 2;

                const innerRadius = radius - 10; // length of tick
                const outerRadius = radius;

                const x1 = cx + innerRadius * Math.cos(angle);
                const y1 = cy + innerRadius * Math.sin(angle);
                const x2 = cx + outerRadius * Math.cos(angle);
                const y2 = cy + outerRadius * Math.sin(angle);


                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            } catch { }
        };
    }

}