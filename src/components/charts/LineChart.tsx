import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
}

export function LineChart({
  data,
  height = 200,
  color = '#3b82f6',
  showGrid = true
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-400"
        style={{ height }}
      >
        Aucune donnée disponible
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 100);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  const padding = 40;
  const chartHeight = height - padding * 2;
  const chartWidth = 100;
  const pointSpacing = chartWidth / (data.length - 1 || 1);

  const points = data.map((point, index) => {
    const x = index * pointSpacing;
    const y = chartHeight - ((point.value - minValue) / range) * chartHeight;
    return { x, y, value: point.value, label: point.label };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPathData = `${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="w-full" style={{ height }}>
      <svg
        viewBox={`-${padding} -${padding} ${chartWidth + padding * 2} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {showGrid && (
          <g className="grid">
            {[0, 25, 50, 75, 100].map((value) => {
              const y = chartHeight - ((value - minValue) / range) * chartHeight;
              return (
                <g key={value}>
                  <line
                    x1="0"
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="0.5"
                  />
                  <text
                    x="-10"
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-500"
                    style={{ fontSize: '10px' }}
                  >
                    {value}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        <path
          d={areaPathData}
          fill="url(#lineGradient)"
        />

        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill="white"
              stroke={color}
              strokeWidth="2"
            />
            <text
              x={point.x}
              y={chartHeight + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600"
              style={{ fontSize: '9px' }}
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
