import React, { useMemo } from 'react'
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

// HandPieChart.jsx
// Renders a pie chart showing distribution of nail-biting events by hand.
export default function HandPieChart({ logs }) {
    const COLORS = ['#7aff70', '#00C49F', '#808080']  // you can add more colors here

  // Aggregate counts for each hand
  const data = useMemo(() => {
    const counts = logs.reduce((acc, evt) => {
      const hand = evt.handedness || 'Unknown'
      acc[hand] = (acc[hand] || 0) + 1
      return acc
    }, {})
    return [
      { name: 'Left Hand',  value: counts.Left || 0 },
      { name: 'Right Hand', value: counts.Right || 0 },
      { name: 'Unknown', value: counts.Unknown || 0 },
    ]
  }, [logs])

  // add a conditional render, data = 0 : display "no data to render."

  return (
    <div className="w-1/2 h-64">
      <ResponsiveContainer>
        <PieChart className="flex">
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={40}
            label
            isAnimationActive={false}
          >
            {
              // 3) For each slice, render a <Cell> with the corresponding color
              data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))
            }
        </Pie>
          <Tooltip />
          <Legend 
            layout="vertical"         // stack items vertically
            // align="right"             // legend block on chart’s right edge
            // verticalAlign="middle"    // centered top-to-bottom
            />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}