import React from "react";
import type { GlobalToken } from "antd";
import type { AreaData } from "./GridLayout";

type CellKey = string;
const cellKey = (r: number, c: number): CellKey => `${r}-${c}`;

interface GridFillProps {
  rows: number[];
  cols: number[];
  areas: Map<string, AreaData>;
  token: GlobalToken;
}

export const GridFill: React.FC<GridFillProps> = ({ rows, cols, areas, token }) => {
  if (areas.size > 0) {
    return (
      <>
        {Array.from(areas.values()).map((area) => (
          <div
            key={area.name}
            style={{
              gridArea: area.name,
              background: area.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 18,
              color: token.colorText,
              borderRadius: 6,
              margin: 2,
              padding: 12,
              pointerEvents: "none",
            }}
          >
            {area.name}
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {Array.from({ length: rows.length }, (_, r) =>
        Array.from({ length: cols.length }, (_, c) => (
          <div
            key={`u-${r}-${c}`}
            style={{
              border: `1px dashed ${token.colorBorderSecondary}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: token.colorTextQuaternary,
            }}
          >
            {`r${r}c${c}`}
          </div>
        )),
      )}
    </>
  );
};

export default GridFill;