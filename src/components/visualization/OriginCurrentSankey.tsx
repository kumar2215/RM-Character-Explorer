import { useMemo, useState } from "react";
import { ResponsiveContainer, Sankey, Tooltip } from "recharts";
import type { OriginCurrentSankeyData } from "../../types";

interface OriginCurrentSankeyProps {
  data: OriginCurrentSankeyData;
}

type DisplayMode = "count" | "percentage";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: unknown; name?: unknown; value?: unknown }>;
  mode: DisplayMode;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function formatCount(count: number): string {
  return `${count} character${count !== 1 ? "s" : ""}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function SankeyTooltip({ active, payload, mode }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const rawContainer = payload[0];
  const raw = asRecord(rawContainer.payload) ?? asRecord(rawContainer);
  if (!raw) return null;

  const sourceRecord = asRecord(raw.source);
  const targetRecord = asRecord(raw.target);

  const sourceName =
    readString(sourceRecord?.name) ??
    readString(raw.sourceName) ??
    readString(raw.name);
  const targetName =
    readString(targetRecord?.name) ?? readString(raw.targetName);
  const count = readNumber(raw.value) ?? readNumber(raw.count);
  const rawValue = readNumber(raw.rawValue);
  const percentFromSource = readNumber(raw.percentFromSource);

  const isLink = Boolean(sourceName && targetName);
  if (isLink && count !== null) {
    const mainValue =
      mode === "percentage"
        ? formatPercent(percentFromSource ?? count)
        : formatCount(rawValue ?? count);

    return (
      <div className="bg-night border border-rim rounded-lg px-3.5 py-2.5 text-sm text-slate-200">
        <p className="m-0 font-semibold text-slate-100">
          {sourceName}
          {" -> "}
          {targetName}
        </p>
        <p className="m-0 mt-1 text-portal">{mainValue}</p>
        {mode === "percentage" && rawValue !== null && (
          <p className="m-0 mt-1 text-xs text-slate-400">
            {formatCount(rawValue)}
          </p>
        )}
      </div>
    );
  }

  const nodeName =
    readString(raw.name) ?? readString(rawContainer.name) ?? "Node";
  const nodeCount = readNumber(raw.value) ?? readNumber(raw.count);
  const nodeRawValue = readNumber(raw.rawValue);

  const nodeMainValue =
    nodeCount !== null
      ? mode === "percentage"
        ? formatPercent(nodeCount)
        : formatCount(nodeCount)
      : null;

  return (
    <div className="bg-night border border-rim rounded-lg px-3.5 py-2.5 text-sm text-slate-200">
      <p className="m-0 font-semibold text-slate-100">{nodeName}</p>
      {nodeMainValue && <p className="m-0 mt-1 text-portal">{nodeMainValue}</p>}
      {mode === "percentage" && nodeRawValue !== null && (
        <p className="m-0 mt-1 text-xs text-slate-400">
          {formatCount(nodeRawValue)}
        </p>
      )}
    </div>
  );
}

export default function OriginCurrentSankey({
  data,
}: OriginCurrentSankeyProps) {
  const [mode, setMode] = useState<DisplayMode>("count");

  const displayData = useMemo(() => {
    if (mode === "count") return data;

    const sourceTotals = new Map<number, number>();
    for (const link of data.links) {
      sourceTotals.set(
        link.source,
        (sourceTotals.get(link.source) ?? 0) + link.value,
      );
    }

    return {
      nodes: data.nodes,
      links: data.links.map((link) => {
        const sourceTotal = sourceTotals.get(link.source) ?? 0;
        const percent = sourceTotal > 0 ? (link.value / sourceTotal) * 100 : 0;
        return {
          ...link,
          rawValue: link.value,
          percentFromSource: percent,
          value: Math.max(0.001, percent),
        };
      }),
    };
  }, [data, mode]);

  if (data.links.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-1 text-slate-100">
          Origin to Current Location Flow
        </h2>
        <p className="text-sm mb-4 mt-0 text-slate-500">
          Tracks how characters move from their origin to their latest known
          location.
        </p>
        <div className="h-110 bg-night rounded-xl border border-rim flex items-center justify-center text-sm text-slate-400">
          No flow data available for the current filters.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="text-xl font-semibold m-0 text-slate-100">
          Origin to Current Location Flow
        </h2>
        <div className="inline-flex border border-rim rounded-lg overflow-hidden">
          <button
            type="button"
            className={`px-3 py-1 text-xs transition-colors ${mode === "count" ? "bg-portal text-night font-semibold" : "bg-night text-slate-300 hover:text-slate-100"}`}
            onClick={() => setMode("count")}
          >
            Count
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-xs transition-colors ${mode === "percentage" ? "bg-portal text-night font-semibold" : "bg-night text-slate-300 hover:text-slate-100"}`}
            onClick={() => setMode("percentage")}
          >
            % by Origin
          </button>
        </div>
      </div>
      <p className="text-sm mb-4 mt-0 text-slate-500">
        Left nodes are origins and right nodes are current locations. Link width
        shows
        {mode === "count"
          ? " how many characters follow each path."
          : " each path as a percentage of that origin's total."}
      </p>
      <ResponsiveContainer width="100%" height={460}>
        <Sankey
          data={displayData}
          nodePadding={16}
          nodeWidth={14}
          sort
          margin={{ left: 18, right: 18, top: 10, bottom: 10 }}
          node={{ stroke: "#0f172a", fill: "#334155", strokeWidth: 1 }}
          link={{ stroke: "#97ce4c", strokeOpacity: 0.35 }}
        >
          <Tooltip content={<SankeyTooltip mode={mode} />} />
        </Sankey>
      </ResponsiveContainer>
      <p className="text-xs mt-3 mb-0 text-slate-500">
        Displaying top 12 origins and top 12 current locations; remaining groups
        are bucketed as "Other".
      </p>
    </div>
  );
}
