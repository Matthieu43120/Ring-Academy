import React from 'react';

interface RadarChartData {
  accroche: number;
  ecoute: number;
  objections: number;
  clarte: number;
  conclusion: number;
}

interface RadarChartProps {
  data: RadarChartData;
  size?: number;
  color?: string;
}

const labels: Record<keyof RadarChartData, string> = {
  accroche: 'Accroche',
  ecoute: 'Écoute',
  objections: 'Objections',
  clarte: 'Clarté',
  conclusion: 'Conclusion'
};

export function RadarChart({
  data,
  size = 300,
  color = '#3b82f6'
}: RadarChartProps) {
  const center = size / 2;
  const maxRadius = (size / 2) - 60;
  const angleStep = (2 * Math.PI) / 5;

  const getPoint = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };

  const keys = Object.keys(data) as Array<keyof RadarChartData>;
  const dataPoints = keys.map((key, index) => ({
    ...getPoint(data[key], index),
    value: data[key],
    label: labels[key]
  }));

  const gridLevels = [20, 40, 60, 80, 100];
  const axisPoints = keys.map((_, index) => getPoint(100, index));

  const dataPath = dataPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ') + ' Z';

  return (
    <svg width={size} height={size} className="mx-auto">
      <defs>
        <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={keys
            .map((_, index) => {
              const point = getPoint(level, index);
              return `${point.x},${point.y}`;
            })
            .join(' ')}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}

      {axisPoints.map((point, index) => (
        <line
          key={index}
          x1={center}
          y1={center}
          x2={point.x}
          y2={point.y}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}

      <polygon
        points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="url(#radarGradient)"
        stroke={color}
        strokeWidth="2"
      />

      {dataPoints.map((point, index) => {
        const labelPoint = getPoint(110, index);
        return (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="white"
              stroke={color}
              strokeWidth="2"
            />
            <text
              x={labelPoint.x}
              y={labelPoint.y + 4}
              textAnchor="middle"
              className="text-sm font-medium fill-gray-700"
            >
              {point.label}
            </text>
            <text
              x={labelPoint.x}
              y={labelPoint.y + 20}
              textAnchor="middle"
              className="text-xs font-semibold"
              fill={color}
            >
              {point.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
