import React, { useMemo } from 'react'
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

// HandPieChart.jsx
// Renders a pie chart showing distribution of nail-biting events by hand.
export default function HandPieChart({ logs }) {
    const COLORS = ['#7aff70', '#00C49F', '#808080']  // you can add more colors here

  // Aggregate counts for each hand
  const data = useMemo(() => {
    // formats logs into js objects that are structured by name, value
    const counts = logs.reduce((acc, evt) => {
      const hand = evt.handedness || 'Unknown'
      acc[hand] = (acc[hand] || 0) + 1
      return acc
    }, {})
    return [
      { name: 'Left Hand',  value: counts.Left || 0 },
      { name: 'Right Hand', value: counts.Right || 0 },
    ]
  }, [logs]) // dont recompute unless logs changes

  // Decide if there is anything to chart
  const total = data.reduce((sum, { value }) => sum + value, 0)
  const hasData = total > 0

  if (!hasData) {
    return (
      <div className="w-full h-20 lg:h-32 flex items-center justify-center text-gray-500">
        No nail-biting events to display.
      </div>
    )
  }

  return (
 <div className="flex items-center">
  {/* 75% width for the chart */}
  <div className="w-1/2 h-32">
    <ResponsiveContainer>
      <PieChart> {/* leave room for our legend */}
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={30}
          label
          isAnimationActive={false}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>

  <div className="w-1/2 flex flex-wrap items-center gap-2 justify-center">
    {data.map((entry, i) => (
      <div key={i} className="flex items-center m-1">
        <div
          className="w-3 h-3 rounded-lg"
          style={{ backgroundColor: COLORS[i % COLORS.length] }}
        />
        <span className="ml-2 text-sm text-right">{entry.name}</span>
      </div>
    ))}
  </div>
</div>

  )
}