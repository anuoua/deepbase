import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Button, Input, Space, Tooltip, message, Modal, Tag, theme } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  MergeCellsOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { GridLayout } from "./GridLayout";
import { GridFill } from "./GridFill";
import { GridPreview } from "./GridPreview";
import type { AreaData } from "./GridLayout";

type CellKey = string;
const cellKey = (r: number, c: number): CellKey => `${r}-${c}`;

const PRESET_COLORS = [
  "#e6f7ff", "#d9f7be", "#fff7e6", "#fff1f0", "#f9f0ff",
  "#e6fffb", "#fff0f6", "#f0f5ff", "#fcffe6", "#f5f5f5",
];

const MAX_HISTORY = 100;

interface HistoryEntry {
  rows: number[];
  cols: number[];
  areas: [string, string, string[]][];
}

export const GridEditor: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { token } = theme.useToken();

  const [rows, setRows] = useState<number[]>([1, 1]);
  const [cols, setCols] = useState<number[]>([1, 1]);
  const [areas, setAreas] = useState<Map<string, AreaData>>(new Map());
  const [selectedCells, setSelectedCells] = useState<Set<CellKey>>(new Set());
  const [areaNameInput, setAreaNameInput] = useState("");
  const [inputVisible, setInputVisible] = useState(false);
  const [mode, setMode] = useState<"layout" | "fill" | "preview">("layout");

  const nextColorIdx = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HistoryEntry[]>([]);
  const rowsRef = useRef(rows);
  const colsRef = useRef(cols);
  const areasRef = useRef(areas);

  rowsRef.current = rows;
  colsRef.current = cols;
  areasRef.current = areas;

  const saveSnapshot = useCallback(() => {
    const r = rowsRef.current;
    const c = colsRef.current;
    const a = areasRef.current;
    historyRef.current.push({
      rows: [...r],
      cols: [...c],
      areas: Array.from(a.entries()).map(([name, data]) => [
        name,
        data.color,
        Array.from(data.cells),
      ]),
    });
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
  }, []);

  const undo = useCallback(() => {
    const entry = historyRef.current.pop();
    if (!entry) return;
    setRows(entry.rows);
    setCols(entry.cols);
    const newAreas = new Map<string, AreaData>();
    entry.areas.forEach(([name, color, cells]) => {
      newAreas.set(name, { name, color, cells: new Set(cells) });
    });
    setAreas(newAreas);
    setSelectedCells(new Set());
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo]);

  const cellAreaMap = useMemo(() => {
    const map = new Map<CellKey, { name: string; color: string }>();
    areas.forEach((area) => {
      area.cells.forEach((key) => {
        map.set(key, { name: area.name, color: area.color });
      });
    });
    return map;
  }, [areas]);

  const gridTemplateRows = rows.map((r) => `${r}fr`).join(" ");
  const gridTemplateCols = cols.map((c) => `${c}fr`).join(" ");

  const gridTemplateAreas = useMemo(() => {
    if (areas.size === 0) return undefined;

    const validAreas = new Set<string>();
    areas.forEach((data, name) => {
      let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
      data.cells.forEach((key) => {
        const [r, c] = key.split("-").map(Number) as [number, number];
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      });
      if (data.cells.size === (maxR - minR + 1) * (maxC - minC + 1)) validAreas.add(name);
    });

    const grid: string[][] = [];
    for (let r = 0; r < rows.length; r++) {
      const rowArr: string[] = [];
      for (let c = 0; c < cols.length; c++) {
        const area = cellAreaMap.get(`${r}-${c}`);
        rowArr.push(area && validAreas.has(area.name) ? area.name : ".");
      }
      grid.push(rowArr);
    }
    return grid.map((r) => `"${r.join(" ")}"`).join(" ");
  }, [rows, cols, cellAreaMap, areas]);

  const assignAreaName = useCallback(
    (name: string) => {
      if (!name.trim()) return;
      const trimmed = name.trim();
      saveSnapshot();

      const existing = areas.get(trimmed);
      const newAreas = new Map(areas);

      if (existing) {
        const merged = new Set(existing.cells);
        selectedCells.forEach((k) => merged.add(k));
        newAreas.set(trimmed, { ...existing, cells: merged });
      } else {
        const color = PRESET_COLORS[nextColorIdx.current % PRESET_COLORS.length]!;
        nextColorIdx.current++;
        newAreas.set(trimmed, { name: trimmed, color, cells: new Set(selectedCells) });
      }

      setAreas(newAreas);
      setSelectedCells(new Set());
      setInputVisible(false);
      setAreaNameInput("");
    },
    [areas, selectedCells, saveSnapshot],
  );

  const removeArea = useCallback(
    (name: string) => {
      saveSnapshot();
      const newAreas = new Map(areas);
      newAreas.delete(name);
      setAreas(newAreas);
    },
    [areas, saveSnapshot],
  );

  const showNameInput = useCallback(() => {
    if (selectedCells.size === 0) {
      message.info("请先按住 Ctrl 点击格子来选中区域");
      return;
    }
    setAreaNameInput("");
    setInputVisible(true);
  }, [selectedCells]);

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 工具栏 */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Tooltip title="撤销 (Ctrl+Z)">
          <Button size="small" icon={<UndoOutlined />} onClick={undo}>
            撤销
          </Button>
        </Tooltip>

        {selectedCells.size > 0 && (
          <Space>
            <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
              已选 {selectedCells.size} 个格子
            </span>
            <Button size="small" type="primary" icon={<MergeCellsOutlined />} onClick={showNameInput}>
              定义区域
            </Button>
            <Button size="small" icon={<CloseOutlined />} onClick={clearSelection}>
              取消选择
            </Button>
          </Space>
        )}

        <div style={{ flex: 1 }} />

        <Space>
          {(["layout", "fill", "preview"] as const).map((m) => (
            <Button
              key={m}
              size="small"
              type={mode === m ? "primary" : "default"}
              onClick={() => setMode(m)}
            >
              {m === "layout" ? "布局" : m === "fill" ? "填空" : "预览"}
            </Button>
          ))}
        </Space>
      </div>

      {/* 区域图例 */}
      {areas.size > 0 && (
        <div
          style={{
            padding: "4px 16px",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, color: token.colorTextTertiary }}>区域：</span>
          {Array.from(areas.values()).map((area) => (
            <Tag
              key={area.name}
              color={area.color}
              closable
              onClose={() => removeArea(area.name)}
              style={{ marginRight: 0, cursor: "default", color: "black" }}
            >
              {area.name}
            </Tag>
          ))}
        </div>
      )}

      {/* 画布 */}
      <div
        style={{
          flex: 1,
          padding: 16,
          overflow: "hidden",
          background: token.colorFillSecondary,
        }}
      >
        <div
          ref={gridRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            minHeight: 400,
            display: "grid",
            gridTemplateRows,
            gridTemplateColumns: gridTemplateCols,
            gridTemplateAreas: mode !== "layout" ? gridTemplateAreas : undefined,
            gap: 0,
            background: token.colorBgContainer,
            border: `2px solid ${token.colorBorder}`,
            borderRadius: token.borderRadiusLG,
            overflow: "hidden",
          }}
        >
          {mode === "layout" && (
            <GridLayout
              gridRef={gridRef}
              rows={rows}
              cols={cols}
              areas={areas}
              selectedCells={selectedCells}
              token={token}
              saveSnapshot={saveSnapshot}
              onRowsChange={setRows}
              onColsChange={setCols}
              onAreasChange={setAreas}
              onSelectedCellsChange={setSelectedCells}
            />
          )}
          {mode === "fill" && <GridFill rows={rows} cols={cols} areas={areas} token={token} />}
          {mode === "preview" && <GridPreview>{children}</GridPreview>}
        </div>
      </div>

      {/* 分割线 hover */}
      <style>{`.divider-line:hover { opacity: 0.8 !important; }`}</style>

      {/* 边缘拖拽 hover */}
      <style>{`
        .edge-grab-top:hover { height: 14px !important; background: rgba(22,119,255,0.08) !important; }
        .edge-grab-left:hover { width: 14px !important; background: rgba(22,119,255,0.08) !important; }
      `}</style>

      {/* 区域命名弹窗 */}
      <Modal
        title="定义区域名称"
        open={inputVisible}
        onOk={() => assignAreaName(areaNameInput)}
        onCancel={() => { setInputVisible(false); setAreaNameInput(""); }}
        okText="确认"
        cancelText="取消"
        destroyOnClose
        width={360}
      >
        <div style={{ padding: "8px 0" }}>
          <div style={{ marginBottom: 12, fontSize: 13, color: token.colorTextSecondary }}>
            已选中 {selectedCells.size} 个格子，输入区域名称：
          </div>
          <Input
            autoFocus
            placeholder="例如：header, sidebar, main"
            value={areaNameInput}
            onChange={(e) => setAreaNameInput(e.target.value)}
            onPressEnter={() => assignAreaName(areaNameInput)}
          />
          {areas.size > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: token.colorTextTertiary }}>
              已有区域：{Array.from(areas.keys()).join("、")}
              <br />
              输入已有名称可将选中格子合并到该区域
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default GridEditor;