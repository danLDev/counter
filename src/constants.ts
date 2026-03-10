

export const SIZE_MULTIPLIER = 2;
export const WIDTH = 800 * SIZE_MULTIPLIER;
export const HEIGHT = 250 * SIZE_MULTIPLIER;
export const ARC_CACHE = new Map<number, { segmentAngle: number, tickAngle: number, ticks: { angleEnd: number, angleStart: number }[] }>()

const buildArcSegments = (maxTicks: number) => {
    const segmentAngle = (2 * Math.PI) / maxTicks;
    const tickAngle = segmentAngle * 0.7; // 30% of segment
    const startAngle: number = -Math.PI / 2

    const ticks = [];

    for (let i = 0; i < maxTicks; i++) {
        const angleStart = startAngle + i * segmentAngle;
        const angleEnd = angleStart + tickAngle;
        ticks.push({ angleEnd, angleStart })
    }

    return { segmentAngle, tickAngle, ticks }
}


ARC_CACHE.set(365, buildArcSegments(365));
ARC_CACHE.set(60, buildArcSegments(60));
ARC_CACHE.set(24, buildArcSegments(24));

