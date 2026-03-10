

export const SIZE_MULTIPLIER = 2;
export const WIDTH = 800 * SIZE_MULTIPLIER;
export const HEIGHT = 250 * SIZE_MULTIPLIER;
export const ARC_CACHE = new Map<number, { segmentAngle: number, tickAngle: number, ticks: { angleEnd: number, angleStart: number }[] }>()
export const TO_DATE = new Date('2026-04-20T13:00:00');
export const FROM_DATE = new Date('2026-03-09T13:00:00');
export const TOTAL_SECONDS = Math.floor((TO_DATE.getTime() - FROM_DATE.getTime()) / 1000);
export const TOTAL_DAYS = Math.floor((TO_DATE.getTime() - FROM_DATE.getTime()) / (1000 * 60 * 60 * 24))

console.log('totalDays', TOTAL_DAYS)

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


ARC_CACHE.set(TOTAL_DAYS, buildArcSegments(TOTAL_DAYS));
ARC_CACHE.set(60, buildArcSegments(60));
ARC_CACHE.set(24, buildArcSegments(24));

