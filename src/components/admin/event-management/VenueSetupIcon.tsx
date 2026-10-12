const GOLD = '#7c3aed'
const SEAT = '#a1a1aa'

type VenueSetupIconProps = {
  setupId: string
  className?: string
}

export function VenueSetupIcon({ setupId, className = 'h-14 w-20' }: VenueSetupIconProps) {
  return (
    <svg
      viewBox="0 0 80 52"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderSetup(setupId)}
    </svg>
  )
}

function renderSetup(setupId: string) {
  switch (setupId) {
    case 'theater':
      return <TheaterIcon />
    case 'banquet':
      return <BanquetIcon rows={[3, 2, 1]} />
    case 'ballroom':
      return <BanquetIcon rows={[4, 3, 2, 1]} />
    case 'classroom':
      return <ClassroomIcon />
    case 'cocktail':
      return <CocktailIcon />
    case 'ushape':
      return <UShapeIcon />
    case 'boardroom':
      return <BoardroomIcon />
    case 'banquet-stage':
      return <BanquetStageIcon />
    case 'coworking':
      return <CoworkingIcon />
    case 'private-studio':
      return <PrivateStudioIcon />
    default:
      return <TheaterIcon />
  }
}

function SeatDot({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r="2" fill={SEAT} />
}

function TableDot({ cx, cy, r = 5 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={GOLD} />
}

function SeatsAround(cx: number, cy: number, radius = 8, count = 8) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2
        return (
          <SeatDot
            key={i}
            cx={cx + Math.cos(angle) * radius}
            cy={cy + Math.sin(angle) * radius}
          />
        )
      })}
    </>
  )
}

function StageBar({ y = 6 }: { y?: number }) {
  return <rect x="10" y={y} width="60" height="5" rx="2.5" fill={GOLD} />
}

function TheaterIcon() {
  const cols = 10
  const rows = 5
  const startX = 14
  const startY = 18
  const gapX = 5.2
  const gapY = 5

  return (
    <>
      <StageBar />
      {Array.from({ length: rows }, (_row, row) =>
        Array.from({ length: cols }, (_col, col) => (
          <SeatDot
            key={`${row}-${col}`}
            cx={startX + col * gapX}
            cy={startY + row * gapY}
          />
        )),
      )}
    </>
  )
}

function BanquetIcon({ rows }: { rows: Array<number> }) {
  const rowY = [14, 26, 38, 48]
  const centers: Array<{ x: number; y: number }> = []

  rows.forEach((count, rowIndex) => {
    const y = rowY[rowIndex] ?? 14 + rowIndex * 12
    const span = Math.min(count, 4) * 14
    const startX = 40 - span / 2 + 7
    for (let i = 0; i < count; i++) {
      centers.push({ x: startX + i * 14, y })
    }
  })

  return (
    <>
      {centers.map((center, index) => (
        <g key={index}>
          <TableDot cx={center.x} cy={center.y} />
          {SeatsAround(center.x, center.y, 7, 6)}
        </g>
      ))}
    </>
  )
}

function ClassroomIcon() {
  const desks = [
    { x: 24, y: 22 },
    { x: 24, y: 32 },
    { x: 24, y: 42 },
    { x: 52, y: 22 },
    { x: 52, y: 32 },
    { x: 52, y: 42 },
  ]

  return (
    <>
      <StageBar y={5} />
      {desks.map((desk, index) => (
        <g key={index}>
          <SeatDot cx={desk.x - 8} cy={desk.y} />
          <SeatDot cx={desk.x - 5} cy={desk.y} />
          <rect x={desk.x - 3} y={desk.y - 2} width="12" height="4" rx="1" fill={GOLD} />
          <SeatDot cx={desk.x + 10} cy={desk.y} />
        </g>
      ))}
    </>
  )
}

function CocktailIcon() {
  const tables = [
    { x: 18, y: 16, r: 4 },
    { x: 38, y: 12, r: 5 },
    { x: 58, y: 18, r: 3.5 },
    { x: 26, y: 30, r: 3 },
    { x: 48, y: 28, r: 4.5 },
    { x: 64, y: 34, r: 3 },
    { x: 14, y: 40, r: 3.5 },
    { x: 34, y: 42, r: 4 },
    { x: 54, y: 40, r: 3.5 },
  ]

  return (
    <>
      {tables.map((table, index) => (
        <g key={index}>
          <TableDot cx={table.x} cy={table.y} r={table.r} />
          {SeatsAround(table.x, table.y, table.r + 4, 6)}
        </g>
      ))}
    </>
  )
}

function UShapeIcon() {
  const seats = [
    [22, 14], [30, 14], [38, 14], [46, 14], [54, 14],
    [18, 22], [18, 30], [18, 38],
    [58, 22], [58, 30], [58, 38],
    [22, 44], [30, 44], [38, 44], [46, 44], [54, 44],
  ]

  return (
    <>
      <path
        d="M 22 18 L 22 38 Q 22 44 28 44 L 52 44 Q 58 44 58 38 L 58 18"
        stroke={GOLD}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {seats.map(([x, y], index) => (
        <SeatDot key={index} cx={x} cy={y} />
      ))}
    </>
  )
}

function BoardroomIcon() {
  const seats = [
    [28, 14], [34, 14], [40, 14], [46, 14], [52, 14],
    [22, 20], [22, 26], [22, 32],
    [58, 20], [58, 26], [58, 32],
    [28, 38], [34, 38], [40, 38], [46, 38], [52, 38],
  ]

  return (
    <>
      <rect x="28" y="20" width="24" height="16" rx="2" fill={GOLD} />
      {seats.map(([x, y], index) => (
        <SeatDot key={index} cx={x} cy={y} />
      ))}
    </>
  )
}

function BanquetStageIcon() {
  const tables = [
    [24, 28], [40, 28], [56, 28],
    [24, 40], [40, 40], [56, 40],
  ]

  return (
    <>
      <StageBar y={8} />
      {tables.map(([x, y], index) => (
        <g key={index}>
          <TableDot cx={x} cy={y} r={4.5} />
          {SeatsAround(x, y, 7, 6)}
        </g>
      ))}
    </>
  )
}

function CoworkingIcon() {
  const desks = [
    { x: 12, y: 10 },
    { x: 30, y: 10 },
    { x: 48, y: 10 },
    { x: 12, y: 24 },
    { x: 30, y: 24 },
    { x: 48, y: 24 },
    { x: 12, y: 38 },
    { x: 30, y: 38 },
    { x: 48, y: 38 },
  ]

  return (
    <>
      {desks.map((desk, index) => (
        <g key={index}>
          <rect x={desk.x} y={desk.y} width="12" height="5" rx="1.5" fill={GOLD} />
          <SeatDot cx={desk.x + 6} cy={desk.y + 9} />
        </g>
      ))}
      <TableDot cx={70} cy={26} r={4} />
      {SeatsAround(70, 26, 7, 4)}
    </>
  )
}

function PrivateStudioIcon() {
  return (
    <>
      {/* Room outline */}
      <rect
        x="12"
        y="6"
        width="56"
        height="40"
        rx="4"
        stroke={GOLD}
        strokeWidth="2.5"
        fill="none"
      />
      {/* Console / work desk */}
      <rect x="24" y="28" width="32" height="6" rx="1.5" fill={GOLD} />
      {/* Operator seats */}
      <SeatDot cx={32} cy={40} />
      <SeatDot cx={40} cy={40} />
      <SeatDot cx={48} cy={40} />
      {/* Accent / backdrop bar */}
      <rect x="22" y="12" width="36" height="4" rx="2" fill={GOLD} />
      {/* Soft seating along sides */}
      <SeatDot cx={18} cy={22} />
      <SeatDot cx={62} cy={22} />
    </>
  )
}
