import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const val = payload[0]?.value
  const color = val >= 7 ? '#FF2D55' : val >= 5 ? '#FF6B35' : val >= 3 ? '#FFCC00' : '#34C759'
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: 'rgba(13,13,26,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="text-white/40 mb-1">Ticket {label}</div>
      <div className="font-bold" style={{ color }}>Score: {val?.toFixed(1)}</div>
    </div>
  )
}

export function FrustrationChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div className="flex items-center justify-center h-24 text-white/25 text-xs text-center px-4">
        Need at least 2 interactions to show trajectory
      </div>
    )
  }

  const data = history.map((h, i) => ({
    tick: i + 1,
    score: h.frustration_score || 0,
    emotion: h.emotion_label,
  }))

  const maxScore = Math.max(...data.map(d => d.score))
  const gradColor = maxScore >= 7 ? '#FF2D55' : maxScore >= 5 ? '#FF6B35' : maxScore >= 3 ? '#FFCC00' : '#34C759'

  return (
    <ResponsiveContainer width="100%" height={100}>
      <AreaChart data={data} margin={{ top: 5, right: 8, left: -30, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={gradColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={gradColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="tick"
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="score"
          stroke={gradColor}
          strokeWidth={2}
          fill="url(#scoreGrad)"
          dot={{ fill: gradColor, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: gradColor, stroke: 'rgba(0,0,0,0.5)', strokeWidth: 1 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
