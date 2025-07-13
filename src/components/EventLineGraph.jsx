// EventLineChart.jsx
import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function EventLineChart({ logs }) {
  // Build a time-bucketed series, formatted as "H:MM"
  const data = useMemo(() => { // useMemo, improves performance by skipping this, until logs changes
    const buckets = {}
    logs.forEach(({ timestamp }) => {
      const minute = Math.floor(timestamp / 60000) * 60000
      buckets[minute] = (buckets[minute] || 0) + 1
    })
    return Object.entries(buckets)
      .sort(([a], [b]) => a - b)
      .map(([time, count]) => {
        const d = new Date(+time)
        const h = d.getHours() % 12 || 12
        const m = String(d.getMinutes()).padStart(2, '0')
        return { time: `${h}:${m}`, count }
      })
  }, [logs])

  return (
    <div className="w-full h-34 lg:h-38 lg:mb-2">
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{right: 20, left: 0}}
          isAnimationActive={false}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" 
          domain={['auto', 'auto']}
          />
          <YAxis allowDecimals={false} width={27} />
          <Tooltip
            contentStyle={{ color: '#000' }}
            itemStyle={{ color: '#000' }}
            labelStyle={{ color: '#000' }}
          />
          <Line
            dataKey="count"
            stroke="#7aff70"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default EventLineChart;
