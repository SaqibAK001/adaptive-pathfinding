import React from "react";

const HexGrid = ({
  hexes,
  path = [],
  explored = [],
  onHexClick,
  editable,
  showExplored,
}) => {
  const HEX_SIZE = 32;

  const isInPath = (q, r) => path.some((p) => p.q === q && p.r === r);
  const isExplored = (q, r) => explored.some((e) => e.q === q && e.r === r);

  // axial to pixel conversion (pointy-top hex)
  const axialToPixel = (q, r) => {
    const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
    const y = HEX_SIZE * (3 / 2) * r;
    return { x, y };
  };

  // hex polygon points
  const hexPoints = (cx, cy) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const x = cx + HEX_SIZE * Math.cos(angle);
      const y = cy + HEX_SIZE * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(" ");
  };

  const getFill = (hex) => {
    if (hex.is_start) return "#2563EB"; // blue
    if (hex.is_goal) return "#DC2626"; // red
    if (isInPath(hex.q, hex.r)) return "#22C55E"; // green
    if (showExplored && isExplored(hex.q, hex.r)) return "#E0E7FF"; // explored
    if (hex.weight === 0) return "#0F172A"; // obstacle
    if (hex.weight > 1) return "#FEF3C7"; // weighted
    return "#FFFFFF";
  };

  const getStroke = (hex) => {
    if (hex.is_start) return "#1D4ED8";
    if (hex.is_goal) return "#B91C1C";
    if (isInPath(hex.q, hex.r)) return "#16A34A";
    if (hex.weight === 0) return "#0F172A";
    return "#CBD5E1";
  };

  const getTextColor = (hex) => {
    if (hex.weight === 0) return "#F8FAFC";
    if (hex.is_start || hex.is_goal) return "#FFFFFF";
    if (isInPath(hex.q, hex.r)) return "#052E16";
    return "#334155";
  };

  // center grid in svg
  const coords = hexes.map((h) => axialToPixel(h.q, h.r));
  const minX = Math.min(...coords.map((c) => c.x));
  const maxX = Math.max(...coords.map((c) => c.x));
  const minY = Math.min(...coords.map((c) => c.y));
  const maxY = Math.max(...coords.map((c) => c.y));

  const width = maxX - minX + HEX_SIZE * 4;
  const height = maxY - minY + HEX_SIZE * 4;

  return (
    <div className="w-full flex justify-center overflow-auto">
      <div className="p-3">
        <svg
          width={width}
          height={height}
          style={{
            background: "#F8FAFC",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
          }}
        >
          {hexes.map((hex, idx) => {
            const { x, y } = axialToPixel(hex.q, hex.r);

            // shift all to positive space
            const cx = x - minX + HEX_SIZE * 2;
            const cy = y - minY + HEX_SIZE * 2;

            return (
              <g
                key={idx}
                onClick={() => onHexClick(hex.q, hex.r)}
                style={{
                  cursor: editable ? "pointer" : "default",
                }}
              >
                <polygon
                  points={hexPoints(cx, cy)}
                  fill={getFill(hex)}
                  stroke={getStroke(hex)}
                  strokeWidth="2"
                  style={{
                    transition: "0.2s ease",
                    filter:
                      hex.is_start || hex.is_goal || isInPath(hex.q, hex.r)
                        ? "drop-shadow(0px 2px 3px rgba(0,0,0,0.15))"
                        : "none",
                  }}
                />

                {/* label */}
                {hex.is_start && (
                  <text
                    x={cx}
                    y={cy + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="800"
                    fill="#FFFFFF"
                  >
                    S
                  </text>
                )}

                {hex.is_goal && (
                  <text
                    x={cx}
                    y={cy + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="800"
                    fill="#FFFFFF"
                  >
                    G
                  </text>
                )}

                {hex.weight === 0 && (
                  <text
                    x={cx}
                    y={cy + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="800"
                    fill="#FFFFFF"
                  >
                    X
                  </text>
                )}

                {hex.weight > 1 && hex.weight !== 0 && !hex.is_start && !hex.is_goal && (
                  <text
                    x={cx}
                    y={cy + 5}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="800"
                    fill={getTextColor(hex)}
                  >
                    {hex.weight}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-blue-600"></span>
            <span>Start</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-red-600"></span>
            <span>Goal</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-green-500"></span>
            <span>Path</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-slate-900"></span>
            <span>Obstacle</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-yellow-200 border border-yellow-300"></span>
            <span>Weighted</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-indigo-100 border border-indigo-200"></span>
            <span>Explored</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HexGrid;