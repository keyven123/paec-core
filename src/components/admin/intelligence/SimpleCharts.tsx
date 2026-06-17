type BarChartItem = { name: string; value: number }

type BarChartProps = {
  data: BarChartItem[]
  color?: string
  height?: number
}

export function VerticalBarChart({
  data,
  color = '#7c3aed',
  height = 220,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const barWidth = 100 / data.length

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        {data.map((item, index) => {
          const barHeight = (item.value / max) * 82
          const x = index * barWidth + barWidth * 0.15
          const width = barWidth * 0.7
          return (
            <rect
              key={item.name}
              x={x}
              y={100 - barHeight - 8}
              width={width}
              height={barHeight}
              fill={color}
              rx={0.8}
              opacity={0.85}
            />
          )
        })}
      </svg>
      <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((item) => (
          <p
            key={item.name}
            className="truncate text-center text-[9px] text-muted-foreground"
            title={item.name}
          >
            {item.name.split(' ').slice(0, 2).join(' ')}
          </p>
        ))}
      </div>
    </div>
  )
}

type PieSegment = { label: string; value: number; color: string }

export function PieChart({ data, size = 140 }: { data: PieSegment[]; size?: number }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1
  let cumulative = 0
  const radius = 16
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex min-w-0 flex-col items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        className="mx-auto shrink-0 -rotate-90"
      >
        <circle cx="20" cy="20" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        {data.map((segment) => {
          const portion = segment.value / total
          const dash = portion * circumference
          const offset = cumulative * circumference
          cumulative += portion
          return (
            <circle
              key={segment.label}
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="8"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          )
        })}
      </svg>
      <ul className="flex w-full flex-wrap justify-center gap-x-4 gap-y-2">
        {data.map((segment) => {
          const percent = Math.round((segment.value / total) * 100)
          return (
            <li key={segment.label} className="flex min-w-0 items-center gap-2 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-foreground">{segment.label}</span>
              <span className="font-semibold whitespace-nowrap text-muted-foreground">
                {percent}% ({segment.value.toLocaleString()})
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type LineSeries = { label: string; value: number }

export function LineChart({
  data,
  color = '#7c3aed',
  height = 200,
}: {
  data: LineSeries[]
  color?: string
  height?: number
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const points = data
    .map((item, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100
      const y = 100 - (item.value / max) * 75 - 10
      return `${x},${y}`
    })
    .join(' ')

  const areaPoints = `0,100 ${points} 100,100`

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <polygon points={areaPoints} fill={`${color}22`} />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((item) => (
          <p key={item.label} className="text-center text-[10px] text-muted-foreground">
            {item.label}
          </p>
        ))}
      </div>
    </div>
  )
}

type StackedSegment = { name: string; value: number; color: string }

type StackedBar = { label: string; segments: StackedSegment[] }

export function StackedBarChart({ data, height = 220 }: { data: StackedBar[]; height?: number }) {
  const totals = data.map((bar) =>
    bar.segments.reduce((sum, segment) => sum + segment.value, 0),
  )
  const max = Math.max(...totals, 1)
  const barWidth = 100 / data.length

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        {data.map((bar, barIndex) => {
          const x = barIndex * barWidth + barWidth * 0.15
          const width = barWidth * 0.7
          let yOffset = 100 - 8

          return bar.segments.map((segment) => {
            const segmentHeight = (segment.value / max) * 82
            yOffset -= segmentHeight
            const rect = (
              <rect
                key={`${bar.label}-${segment.name}`}
                x={x}
                y={yOffset}
                width={width}
                height={segmentHeight}
                fill={segment.color}
                opacity={0.9}
              />
            )
            return rect
          })
        })}
      </svg>
      <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((bar) => (
          <p key={bar.label} className="text-center text-[10px] text-muted-foreground">
            {bar.label}
          </p>
        ))}
      </div>
    </div>
  )
}

export function formatPeso(value: number) {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatCompactPeso(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}K`
  return formatPeso(value)
}
