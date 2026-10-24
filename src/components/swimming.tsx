'use client';
import { useEffect, useRef, useState } from 'react';
import { swims as sourceSwims, paceLabel } from '@/lib/swimming';

const swims = [...sourceSwims].sort((a, b) => a.date.localeCompare(b.date));

export function Swimming() {
  return swims.length ? (
    <SwimmingRecords />
  ) : (
    <section className="swim-page">
      <h3>我的游泳记录</h3>
      <p>暂时还没有记录。</p>
    </section>
  );
}

function SwimmingRecords() {
  const [metric, setMetric] = useState<'pace' | 'distance' | 'seconds' | 'strokes'>('pace');
  const [selected, setSelected] = useState(swims.length - 1);
  const chartRef = useRef<SVGSVGElement>(null);
  const [chartWidth, setChartWidth] = useState(620);
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const observer = new ResizeObserver(([entry]) =>
      setChartWidth(Math.max(1, entry.contentRect.width)),
    );
    observer.observe(chart);
    return () => observer.disconnect();
  }, []);
  const left = 55;
  const right = chartWidth - 24;
  const dateCount = Math.min(swims.length, chartWidth < 480 ? 3 : 6);
  const dateIndices = new Set(
    Array.from({ length: dateCount }, (_, i) =>
      Math.round((i * (swims.length - 1)) / Math.max(1, dateCount - 1)),
    ),
  );
  const current = swims[selected];
  const records = swims.map((entry) => ({
    ...entry,
    seconds: Number(entry.duration.split(':')[0]) * 60 + Number(entry.duration.split(':')[1]),
  }));
  const totalSeconds = records.reduce((sum, entry) => sum + entry.seconds, 0);
  const captions = {
    pace: '平均配速 · 用时越少，配速越快',
    distance: '单次距离 · 米',
    seconds: '单次时长 · 分:秒',
    strokes: '总划水数 · 次',
  };
  const values = records.map((entry) => entry[metric]);
  const step =
    metric === 'pace'
      ? 30
      : metric === 'seconds'
        ? 120
        : Math.max(100, Math.ceil(Math.max(...values) / 400) * 100);
  const min =
    metric === 'pace' || metric === 'seconds'
      ? Math.max(0, Math.floor(Math.min(...values) / step) * step - step)
      : 0;
  const max = Math.max(min + step, Math.ceil(Math.max(...values) / step) * step + step);
  const ticks = Array.from(
    { length: Math.round((max - min) / step) + 1 },
    (_, i) => min + i * step,
  );
  const start = Date.parse(swims[0].date);
  const span = Date.parse(swims.at(-1)!.date) - start;
  const points = records.map((entry) => ({
    x: span
      ? left + ((Date.parse(entry.date) - start) / span) * (right - left)
      : (left + right) / 2,
    y: 205 - ((entry[metric] - min) / (max - min)) * 170,
  }));
  const value = (n: number) =>
    metric === 'pace'
      ? paceLabel(n)
      : metric === 'seconds'
        ? `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
        : String(n);
  return (
    <section className="swim-page" aria-labelledby="swim-title">
      <div className="swim-heading">
        <p className="eyebrow">IN THE WATER</p>
        <h3 id="swim-title">我的游泳记录</h3>
        <p>以蛙泳为主 · 一般每周二、周四各游一次</p>
      </div>
      <div className="swim-stats">
        <div>
          <span>已记录</span>
          <strong>
            {swims.length}
            <small> 次</small>
          </strong>
        </div>
        <div>
          <span>累计距离</span>
          <strong>
            {(swims.reduce((sum, entry) => sum + entry.distance, 0) / 1000).toFixed(1)}
            <small> km</small>
          </strong>
        </div>
        <div>
          <span>记录内最佳平均配速</span>
          <strong>
            {paceLabel(Math.min(...swims.map((entry) => entry.pace)))}
            <small> /100m</small>
          </strong>
        </div>
        <div>
          <span>累计时长</span>
          <strong>
            {Math.floor(totalSeconds / 3600)}
            <small>时 </small>
            {Math.floor((totalSeconds % 3600) / 60)}
            <small>分 </small>
            {totalSeconds % 60}
            <small>秒</small>
          </strong>
        </div>
        <div>
          <span>单次平均距离</span>
          <strong>
            {Math.round(swims.reduce((sum, e) => sum + e.distance, 0) / swims.length)}
            <small> m</small>
          </strong>
        </div>
        <div>
          <span>单次最长距离</span>
          <strong>
            {Math.max(...swims.map((e) => e.distance))}
            <small> m</small>
          </strong>
        </div>
      </div>
      <div className="swim-chart-card">
        <div className="swim-chart-heading">
          <div>
            <h4>水里的足迹</h4>
            <p>{captions[metric]}</p>
          </div>
          <div className="swim-toggle" role="group" aria-label="图表指标">
            <button aria-pressed={metric === 'pace'} onClick={() => setMetric('pace')}>
              配速
            </button>
            <button aria-pressed={metric === 'distance'} onClick={() => setMetric('distance')}>
              距离
            </button>
            <button aria-pressed={metric === 'seconds'} onClick={() => setMetric('seconds')}>
              时长
            </button>
            <button aria-pressed={metric === 'strokes'} onClick={() => setMetric('strokes')}>
              划水数
            </button>
          </div>
        </div>
        <svg
          className="swim-chart"
          ref={chartRef}
          viewBox={`0 0 ${chartWidth} 245`}
          role="img"
          aria-label={`${captions[metric]}，按日期排列，下方可选择记录查看数值`}
        >
          {ticks
            .filter((_, i) => i === ticks.length - 1 || i % Math.ceil((ticks.length - 1) / 4) === 0)
            .map((tick) => {
              const y = 205 - ((tick - min) / (max - min)) * 170;
              return (
                <g key={tick}>
                  <line x1={left} y1={y} x2={right} y2={y} stroke="#dce8e8" strokeDasharray="3 6" />
                  <text x={left - 10} y={y + 4} textAnchor="end">
                    {value(tick)}
                  </text>
                </g>
              );
            })}
          <path
            d={`M${points.map((p) => `${p.x},${p.y}`).join(' L')}`}
            fill="none"
            stroke="#528e9a"
            strokeWidth="2.5"
          />
          {points.map((p, i) => (
            <g key={swims[i].date}>
              <circle
                cx={p.x}
                cy={p.y}
                r={i === selected ? 6 : 4}
                fill={i === selected ? '#315f6c' : '#fff'}
                stroke="#528e9a"
                strokeWidth="2"
              />
              {dateIndices.has(i) && (
                <text x={p.x} y="233" textAnchor="middle">
                  {swims[i].date.slice(5).replace('-', '/')}
                </text>
              )}
            </g>
          ))}
        </svg>
        <div className="swim-dates" role="group" aria-label="选择游泳记录">
          {swims.map((entry, i) => (
            <button key={entry.date} aria-pressed={selected === i} onClick={() => setSelected(i)}>
              {entry.date.slice(5).replace('-', '/')}
            </button>
          ))}
        </div>
        <div className="swim-selected" aria-live="polite">
          <time dateTime={current.date}>{current.date}</time>
          <span>{current.distance} m</span>
          <span>{current.duration}</span>
          <strong>
            {metric === 'seconds'
              ? `时长 ${current.duration}`
              : metric === 'strokes'
                ? `${current.strokes} 次划水`
                : `${paceLabel(current.pace)} /100m`}
          </strong>
        </div>
      </div>
      <div className="swim-record-heading">
        <h4>游泳记录</h4>
        <span>
          {swims[0].date} — {swims.at(-1)!.date}
        </span>
      </div>
      <div className="swim-records">
        {[...swims].reverse().map((entry) => (
          <details key={entry.date} className="swim-record">
            <summary>
              <time dateTime={entry.date}>{entry.date.slice(5).replace('-', '/')}</time>
              <strong>{entry.distance} m</strong>
              <span>{entry.duration}</span>
              <span>{paceLabel(entry.pace)} /100m</span>
              <span className="swim-expand" aria-hidden="true">
                ＋
              </span>
            </summary>
            <dl>
              <div>
                <dt>主泳姿</dt>
                <dd>蛙泳</dd>
              </div>
              <div>
                <dt>趟数</dt>
                <dd>{entry.laps}</dd>
              </div>
              <div>
                <dt>总划水数</dt>
                <dd>{entry.strokes}</dd>
              </div>
              <div>
                <dt>设备记录最快配速</dt>
                <dd>{paceLabel(entry.fastest)} /100m</dd>
              </div>
              <div>
                <dt>活动热量</dt>
                <dd>{entry.activeCalories} kcal</dd>
              </div>
            </dl>
          </details>
        ))}
      </div>
    </section>
  );
}
