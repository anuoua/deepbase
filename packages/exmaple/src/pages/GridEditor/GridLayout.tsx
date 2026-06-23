import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { CheckOutlined } from "@ant-design/icons";
import type { GlobalToken } from "antd";

const MIN_FR = 0.01;
const DIVIDER_HIT_SIZE = 8;

type CellKey = string;
const cellKey = (r: number, c: number): CellKey => `${r}-${c}`;
const parseKey = (key: CellKey): [number, number] =>
  key.split("-").map(Number) as [number, number];

export interface AreaData {
  name: string;
  color: string;
  cells: Set<CellKey>;
}

function shiftKeysAfter(
  keys: Set<CellKey>,
  axis: "row" | "col",
  index: number,
  delta: number,
  removeIndex?: number,
): Set<CellKey> {
  const next = new Set<CellKey>();
  keys.forEach((key) => {
    const [r, c] = parseKey(key);
    if (axis === "row") {
      if (removeIndex !== undefined && r === removeIndex) return;
      next.add(cellKey(r >= index ? r + delta : r, c));
    } else {
      if (removeIndex !== undefined && c === removeIndex) return;
      next.add(cellKey(r, c >= index ? c + delta : c));
    }
  });
  return next;
}

function shiftAreaCells(
  areas: Map<string, AreaData>,
  axis: "row" | "col",
  index: number,
  delta: number,
  removeIndex?: number,
): Map<string, AreaData> {
  const next = new Map<string, AreaData>();
  areas.forEach((area) => {
    next.set(area.name, {
      ...area,
      cells: shiftKeysAfter(area.cells, axis, index, delta, removeIndex),
    });
  });
  return next;
}

interface GridLayoutProps {
  gridRef: React.RefObject<HTMLDivElement | null>;
  rows: number[];
  cols: number[];
  areas: Map<string, AreaData>;
  selectedCells: Set<CellKey>;
  token: GlobalToken;
  saveSnapshot: () => void;
  onRowsChange: React.Dispatch<React.SetStateAction<number[]>>;
  onColsChange: React.Dispatch<React.SetStateAction<number[]>>;
  onAreasChange: React.Dispatch<React.SetStateAction<Map<string, AreaData>>>;
  onSelectedCellsChange: React.Dispatch<React.SetStateAction<Set<CellKey>>>;
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  gridRef,
  rows,
  cols,
  areas,
  selectedCells,
  token,
  saveSnapshot,
  onRowsChange,
  onColsChange,
  onAreasChange,
  onSelectedCellsChange,
}) => {
  const dragRef = useRef<{
    type: "row" | "col";
    index: number;
    startMouse: number;
    startSizes: number[];
    totalFr: number;
  } | null>(null);
  const ctrlRef = useRef(false);
  const edgeDragRef = useRef<{ type: "row" | "col" } | null>(null);
  const rowsRef = useRef(rows);
  const colsRef = useRef(cols);
  const areasRef = useRef(areas);
  const [edgeGhost, setEdgeGhost] = useState<{
    type: "row" | "col";
    pos: number;
  } | null>(null);

  rowsRef.current = rows;
  colsRef.current = cols;
  areasRef.current = areas;

  const cellAreaMap = useMemo(() => {
    const map = new Map<CellKey, { name: string; color: string }>();
    areas.forEach((area) => {
      area.cells.forEach((key) => {
        map.set(key, { name: area.name, color: area.color });
      });
    });
    return map;
  }, [areas]);

  const totalRows = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
  const totalCols = useMemo(() => cols.reduce((a, b) => a + b, 0), [cols]);

  const rowPositions = useMemo(() => {
    const pos: number[] = [];
    let acc = 0;
    for (let i = 0; i < rows.length - 1; i++) {
      acc += rows[i]!;
      pos.push((acc / totalRows) * 100);
    }
    return pos;
  }, [rows, totalRows]);

  const colPositions = useMemo(() => {
    const pos: number[] = [];
    let acc = 0;
    for (let i = 0; i < cols.length - 1; i++) {
      acc += cols[i]!;
      pos.push((acc / totalCols) * 100);
    }
    return pos;
  }, [cols, totalCols]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control") ctrlRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") ctrlRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();

      const edge = edgeDragRef.current;
      if (edge) {
        const pos =
          edge.type === "row"
            ? Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
            : Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        setEdgeGhost({ type: edge.type, pos });
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;

      const delta =
        drag.type === "row"
          ? e.clientY - drag.startMouse
          : e.clientX - drag.startMouse;
      const gridSize = drag.type === "row" ? rect.height : rect.width;
      if (gridSize <= 0) return;

      const deltaFr = (delta / gridSize) * drag.totalFr;
      const newSizes = [...drag.startSizes];
      newSizes[drag.index] = Math.max(MIN_FR, drag.startSizes[drag.index]! + deltaFr);
      newSizes[drag.index + 1] = Math.max(MIN_FR, drag.startSizes[drag.index + 1]! - deltaFr);

      if (drag.type === "row") onRowsChange(newSizes);
      else onColsChange(newSizes);
    };

    const onMouseUp = (e: MouseEvent) => {
      const edge = edgeDragRef.current;
      if (edge && gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const curRows = rowsRef.current;
        const curCols = colsRef.current;

        if (edge.type === "row") {
          addRowSplitAt((e.clientY - rect.top) / rect.height, curRows);
        } else {
          addColSplitAt((e.clientX - rect.left) / rect.width, curCols);
        }

        edgeDragRef.current = null;
        setEdgeGhost(null);
        return;
      }

      dragRef.current = null;
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function addRowSplitAt(pct: number, curRows: number[]) {
    saveSnapshot();
    const total = curRows.reduce((a, b) => a + b, 0);
    let cum = 0, idx = 0;
    for (let i = 0; i < curRows.length; i++) {
      cum += curRows[i]!;
      if (pct * total < cum) { idx = i; break; }
      idx = i;
    }
    const rowFr = curRows[idx]!;
    const rowPctStart = idx === 0 ? 0 : curRows.slice(0, idx).reduce((a, b) => a + b, 0) / total;
    const rowPctEnd = curRows.slice(0, idx + 1).reduce((a, b) => a + b, 0) / total;
    const ratio = Math.max(0.1, Math.min(0.9, (pct - rowPctStart) / (rowPctEnd - rowPctStart)));
    const newRows = [...curRows];
    newRows[idx] = rowFr * ratio;
    newRows.splice(idx + 1, 0, rowFr * (1 - ratio));
    onRowsChange(newRows);
    onSelectedCellsChange((prev) => shiftKeysAfter(prev, "row", idx + 1, 1));
    onAreasChange((prev) => shiftAreaCells(prev, "row", idx + 1, 1));
  }

  function addColSplitAt(pct: number, curCols: number[]) {
    saveSnapshot();
    const total = curCols.reduce((a, b) => a + b, 0);
    let cum = 0, idx = 0;
    for (let i = 0; i < curCols.length; i++) {
      cum += curCols[i]!;
      if (pct * total < cum) { idx = i; break; }
      idx = i;
    }
    const colFr = curCols[idx]!;
    const colPctStart = idx === 0 ? 0 : curCols.slice(0, idx).reduce((a, b) => a + b, 0) / total;
    const colPctEnd = curCols.slice(0, idx + 1).reduce((a, b) => a + b, 0) / total;
    const ratio = Math.max(0.1, Math.min(0.9, (pct - colPctStart) / (colPctEnd - colPctStart)));
    const newCols = [...curCols];
    newCols[idx] = colFr * ratio;
    newCols.splice(idx + 1, 0, colFr * (1 - ratio));
    onColsChange(newCols);
    onSelectedCellsChange((prev) => shiftKeysAfter(prev, "col", idx + 1, 1));
    onAreasChange((prev) => shiftAreaCells(prev, "col", idx + 1, 1));
  }

  const handleDividerMouseDown = useCallback(
    (e: React.MouseEvent, type: "row" | "col", index: number) => {
      e.preventDefault();
      e.stopPropagation();
      saveSnapshot();
      const sizes = type === "row" ? rows : cols;
      const totalFr = sizes.reduce((a, b) => a + b, 0);
      dragRef.current = {
        type,
        index,
        startMouse: type === "row" ? e.clientY : e.clientX,
        startSizes: [...sizes],
        totalFr,
      };
    },
    [rows, cols],
  );

  const handleEdgeMouseDown = useCallback(
    (e: React.MouseEvent, type: "row" | "col") => {
      e.preventDefault();
      e.stopPropagation();
      edgeDragRef.current = { type };
      const rect = gridRef.current!.getBoundingClientRect();
      const pos =
        type === "row"
          ? ((e.clientY - rect.top) / rect.height) * 100
          : ((e.clientX - rect.left) / rect.width) * 100;
      setEdgeGhost({ type, pos });
    },
    [],
  );

  const removeDivider = useCallback(
    (type: "row" | "col", index: number) => {
      if (type === "row" && rows.length <= 1) return;
      if (type === "col" && cols.length <= 1) return;
      saveSnapshot();

      if (type === "row") {
        const newRows = [...rows];
        newRows[index]! += newRows[index + 1]!;
        newRows.splice(index + 1, 1);
        onRowsChange(newRows);
        onSelectedCellsChange((prev) => shiftKeysAfter(prev, "row", index + 1, -1, index + 1));
        onAreasChange((prev) => shiftAreaCells(prev, "row", index + 1, -1, index + 1));
      } else {
        const newCols = [...cols];
        newCols[index]! += newCols[index + 1]!;
        newCols.splice(index + 1, 1);
        onColsChange(newCols);
        onSelectedCellsChange((prev) => shiftKeysAfter(prev, "col", index + 1, -1, index + 1));
        onAreasChange((prev) => shiftAreaCells(prev, "col", index + 1, -1, index + 1));
      }
    },
    [rows, cols],
  );

  const handleCellClick = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      if (!ctrlRef.current) return;
      e.stopPropagation();
      const key = cellKey(row, col);
      onSelectedCellsChange((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [],
  );

  return (
    <>
      {Array.from({ length: rows.length }, (_, r) =>
        Array.from({ length: cols.length }, (_, c) => {
          const key = cellKey(r, c);
          const area = cellAreaMap.get(key);
          const isSelected = selectedCells.has(key);

          return (
            <div
              key={key}
              data-row={r}
              data-col={c}
              onClick={(e) => handleCellClick(e, r, c)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: isSelected
                  ? `2px solid ${token.colorPrimary}`
                  : `1px dashed ${token.colorBorderSecondary}`,
                background: area
                  ? area.color
                  : isSelected
                    ? `${token.colorPrimary}15`
                    : "transparent",
                cursor: ctrlRef.current ? "pointer" : "default",
                userSelect: "none",
                position: "relative",
                transition: "background 0.15s, border-color 0.15s",
                fontSize: 13,
                color: token.colorTextSecondary,
              }}
            >
              <span style={{ fontSize: 11, color: token.colorTextQuaternary }}>
                {ctrlRef.current && isSelected ? "✓" : `r${r}c${c}`}
              </span>
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    right: -1,
                    width: 16,
                    height: 16,
                    background: token.colorPrimary,
                    borderRadius: "0 0 0 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckOutlined style={{ fontSize: 10, color: "#fff" }} />
                </div>
              )}
            </div>
          );
        }),
      )}

      {/* 水平分割线 */}
      {rowPositions.map((pos, i) => (
        <div
          key={`row-divider-${i}`}
          onMouseDown={(e) => handleDividerMouseDown(e, "row", i)}
          onContextMenu={(e) => { e.preventDefault(); removeDivider("row", i); }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `calc(${pos}% - ${DIVIDER_HIT_SIZE / 2}px)`,
            height: DIVIDER_HIT_SIZE,
            cursor: "row-resize",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="拖动调整行高 | 右键删除"
        >
          <div
            style={{
              width: "100%",
              height: 2,
              background: token.colorPrimary,
              opacity: 0.4,
              transition: "opacity 0.15s",
            }}
            className="divider-line"
          />
        </div>
      ))}

      {/* 垂直分割线 */}
      {colPositions.map((pos, i) => (
        <div
          key={`col-divider-${i}`}
          onMouseDown={(e) => handleDividerMouseDown(e, "col", i)}
          onContextMenu={(e) => { e.preventDefault(); removeDivider("col", i); }}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `calc(${pos}% - ${DIVIDER_HIT_SIZE / 2}px)`,
            width: DIVIDER_HIT_SIZE,
            cursor: "col-resize",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
          title="拖动调整列宽 | 右键删除"
        >
          <div
            style={{
              width: 2,
              height: "100%",
              background: token.colorPrimary,
              opacity: 0.4,
              transition: "opacity 0.15s",
            }}
            className="divider-line"
          />
        </div>
      ))}

      {/* 边缘拖拽手柄 - 顶部 */}
      <div
        onMouseDown={(e) => handleEdgeMouseDown(e, "row")}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 6,
          zIndex: 30,
          cursor: "row-resize",
          transition: "height 0.15s, background 0.15s",
        }}
        title="从顶部拖拽添加新行"
        className="edge-grab-top"
      />

      {/* 边缘拖拽手柄 - 左侧 */}
      <div
        onMouseDown={(e) => handleEdgeMouseDown(e, "col")}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: 6,
          zIndex: 30,
          cursor: "col-resize",
          transition: "width 0.15s, background 0.15s",
        }}
        title="从左侧拖拽添加新列"
        className="edge-grab-left"
      />

      {/* 鬼影线 */}
      {edgeGhost?.type === "row" && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `calc(${edgeGhost.pos}% - 1px)`,
            height: 2,
            background: token.colorPrimary,
            zIndex: 35,
            pointerEvents: "none",
          }}
        />
      )}
      {edgeGhost?.type === "col" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `calc(${edgeGhost.pos}% - 1px)`,
            width: 2,
            background: token.colorPrimary,
            zIndex: 35,
            pointerEvents: "none",
          }}
        />
      )}

      {/* 交叉点标记 */}
      {rowPositions.map((rowPos, ri) =>
        colPositions.map((colPos, ci) => (
          <div
            key={`cross-${ri}-${ci}`}
            style={{
              position: "absolute",
              left: `calc(${colPos}% - 3px)`,
              top: `calc(${rowPos}% - 3px)`,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: token.colorPrimary,
              zIndex: 11,
              pointerEvents: "none",
            }}
          />
        )),
      )}
    </>
  );
};

export default GridLayout;