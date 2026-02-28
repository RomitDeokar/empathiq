import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  const color =
    val >= 7 ? '#FF453A' :
    val >= 5 ? '#FF6B35' :
    val >= 3 ? '#FFD60A' : '#30D158'
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: 'rgba(10,10,18,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div className="text-white/35 mb-0.5">Interaction #{label}</div>
      <div className="font-bold" style={{ color }}>Score: {Number(val).toFixed(1)}</div>
    </div>
  )
}

export const FrustrationChart = React.memo(function FrustrationChart({ history = [] }) {
  if (!history || history.length < 2) {
    return (
      <div className="flex items-center justify-center h-20 text-white/20 text-xs text-center">
        Need 2+ interactions to show trajectory
      </div>
    )
  }

  const data = history.map((h, i) => ({
    n: i + 1,
    score: Number((h.frustration_score ?? 0).toFixed(1)),
  }))

  const maxScore = Math.max(...data.map((d) => d.score), 0)
  const lineColor =
    maxScore >= 7 ? '#FF453A' :
    maxScore >= 5 ? '#FF6B35' :
    maxScore >= 3 ? '#FFD60A' : '#30D158'

  return (
    <ResponsiveContainer width="100%" height={90}>
      <AreaChart data={data} margin={{ top: 4, right: 6, left: -32, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor={lineColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.035)" />
        <XAxis
          dataKey="n"
          tick={{ fill: 'rgba(255,255,255,0.22)', fontSize: 9 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          tick={{ fill: 'rgba(255,255,255,0.22)', fontSize: 9 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="score"
          stroke={lineColor}
          strokeWidth={2}
          fill="url(#areaFill)"
          dot={{ fill: lineColor, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: lineColor, stroke: 'rgba(0,0,0,0.4)', strokeWidth: 1 }}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  )
})
