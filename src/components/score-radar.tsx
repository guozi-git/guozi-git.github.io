import { scoreDimensions } from '@/lib/score-dimensions';
import s from './factory-preview.module.css';

export function ScoreRadar({
  scores,
  id,
  maxScore = 100,
  theme = 'default',
}: {
  scores: readonly number[];
  id: string;
  maxScore?: number;
  theme?: 'default' | 'gold';
}) {
  const formatScore = (value: number) => (maxScore === 5 ? value.toFixed(1) : String(value));
  const center = { x: 200, y: 163 };
  const point = (index: number, radius: number) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / 5;
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  };
  const polygon = (values: readonly number[]) =>
    values
      .map((value, index) => {
        const p = point(index, (value / maxScore) * 98);
        return `${p.x},${p.y}`;
      })
      .join(' ');
  return (
    <figure
      className={`${s.radar} ${theme === 'gold' ? s.goldRadar : ''}`}
      data-radar-theme={theme}
    >
      <svg viewBox="0 0 400 335" role="img" aria-labelledby={`radar-title-${id} radar-desc-${id}`}>
        <title id={`radar-title-${id}`}>五维评分雷达图</title>
        <desc id={`radar-desc-${id}`}>
          {scoreDimensions
            .map(
              (dimension, index) => `${dimension.name} ${formatScore(scores[index])} / ${maxScore}`,
            )
            .join('；')}
        </desc>
        {[1, 2, 3, 4, 5].map((level) => (
          <polygon
            key={level}
            points={polygon(Array(5).fill((level * maxScore) / 5))}
            className={s.radarGrid}
          />
        ))}
        {scoreDimensions.map((dimension, index) => {
          const p = point(index, 98);
          return (
            <line
              key={dimension.name}
              x1={center.x}
              y1={center.y}
              x2={p.x}
              y2={p.y}
              className={s.radarAxis}
            />
          );
        })}
        {[1, 3, 5].map((level) => (
          <text
            key={level}
            x={center.x + 6}
            y={center.y - (level / 5) * 98 - 4}
            className={s.radarScale}
          >
            {(level * maxScore) / 5}
          </text>
        ))}
        <polygon points={polygon(scores)} className={s.radarValue} />
        {scoreDimensions.map((dimension, index) => {
          const p = point(index, (scores[index] / maxScore) * 98);
          const label = point(index, 137);
          return (
            <g key={dimension.name}>
              <circle cx={p.x} cy={p.y} r="3" className={s.radarPoint} />
              <text x={label.x} y={label.y - 3} textAnchor="middle" className={s.radarLabel}>
                {dimension.name}
                <tspan x={label.x} dy="19" className={s.radarNumber}>
                  {formatScore(scores[index])}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
