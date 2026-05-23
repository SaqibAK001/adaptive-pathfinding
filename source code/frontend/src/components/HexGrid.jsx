import React from "react";

const HEX_SIZE = 30;

const axialToPixel = (q, r) => {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * ((3 / 2) * r);
  return { x, y };
};

const hexPoints = (x, y) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const px = x + HEX_SIZE * Math.cos(angle);
    const py = y + HEX_SIZE * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  return points.join(" ");
};

const normalizeCoord = (p) => {
  if (!p) return null;

  if (Array.isArray(p) && p.length >= 2) {
    return { q: p[0], r: p[1] };
  }

  if (typeof p === "object" && "q" in p && "r" in p) {
    return { q: p.q, r: p.r };
  }

  return null;
};

const HexGrid = ({
  hexes,
  path = [],
  explored = [],
  onHexClick,
  editable,
  showExplored,
}) => {
  if (!hexes || hexes.length === 0) return null;

  const pixels = hexes.map((h) => axialToPixel(h.q, h.r));
  const xs = pixels.map((p) => p.x);
  const ys = pixels.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = maxX - minX + HEX_SIZE * 4;
  const height = maxY - minY + HEX_SIZE * 4;

  const offsetX = -minX + HEX_SIZE * 2;
  const offsetY = -minY + HEX_SIZE * 2;

  const normalizedPath = path.map(normalizeCoord).filter(Boolean);
  const normalizedExplored = explored.map(normalizeCoord).filter(Boolean);

  const pathSet = new Set(normalizedPath.map((p) => `${p.q},${p.r}`));
  const exploredSet = new Set(
    normalizedExplored.map((p) => `${p.q},${p.r}`)
  );

  return (
    <svg width={width} height={height}>
      {hexes.map((hex, idx) => {
        const { x, y } = axialToPixel(hex.q, hex.r);
        const px = x + offsetX;
        const py = y + offsetY;

        const key = `${hex.q},${hex.r}`;

        let fill = "#f8fafc";
        let stroke = "#cbd5e1";

        if (hex.weight === 0) {
          fill = "#0f172a";
          stroke = "#0f172a";
        } else if (hex.weight > 1) {
          fill = "#fde68a";
        }

        if (showExplored && exploredSet.has(key)) {
          fill = "#bbf7d0";
        }

        if (pathSet.has(key)) {
          fill = "#93c5fd";
        }

        if (hex.is_start) {
          fill = "#2563eb";
        }

        if (hex.is_goal) {
          fill = "#dc2626";
        }

        return (
          <g key={idx} onClick={() => editable && onHexClick(hex.q, hex.r)}>
            <polygon
              points={hexPoints(px, py)}
              fill={fill}
              stroke={stroke}
              strokeWidth="2"
              style={{ cursor: editable ? "pointer" : "default" }}
            />

            {hex.weight !== 0 && (
              <text
                x={px}
                y={py + 4}
                textAnchor="middle"
                fontSize="12"
                fill="#0f172a"
                fontWeight="bold"
              >
                {hex.weight}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default HexGrid;