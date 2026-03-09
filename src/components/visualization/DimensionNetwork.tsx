import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { Location } from "../../types";

interface Props {
  locations: Location[];
}

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  type: "dimension" | "location";
  residentCount: number;
  color: string;
}

interface LinkDatum {
  source: string | NodeDatum;
  target: string | NodeDatum;
}

interface TooltipState {
  x: number;
  y: number;
  name: string;
  type: string;
  residents: number;
}

// Deterministic color from string
function strColor(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) & 0xffffffff;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue},60%,55%)`;
}

export default function DimensionNetwork({ locations }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    if (!svgRef.current || locations.length === 0) return;

    const el = svgRef.current;
    const W = el.clientWidth || 800;
    const H = el.clientHeight || 580;

    d3.select(el).selectAll("*").remove();

    // Build nodes & links
    const dimensionSet = new Map<string, number>();
    locations.forEach((loc) => {
      const dim = loc.dimension || "unknown";
      dimensionSet.set(
        dim,
        (dimensionSet.get(dim) ?? 0) + loc.residents.length,
      );
    });

    const nodes: NodeDatum[] = [];
    dimensionSet.forEach((residents, dim) => {
      nodes.push({
        id: `dim::${dim}`,
        type: "dimension",
        residentCount: residents,
        color: strColor(dim),
      });
    });
    locations.forEach((loc) => {
      nodes.push({
        id: `loc::${loc.id}`,
        type: "location",
        residentCount: loc.residents.length,
        color: "#4a5568",
      });
    });

    const links: LinkDatum[] = locations.map((loc) => ({
      source: `dim::${loc.dimension || "unknown"}`,
      target: `loc::${loc.id}`,
    }));

    const sim = d3
      .forceSimulation<NodeDatum>(nodes)
      .force(
        "link",
        d3
          .forceLink<NodeDatum, LinkDatum>(links)
          .id((d) => d.id)
          .distance(60)
          .strength(0.4),
      )
      .force("charge", d3.forceManyBody().strength(-80))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force(
        "collision",
        d3.forceCollide<NodeDatum>((d) => (d.type === "dimension" ? 22 : 10)),
      );

    const svg = d3.select(el);

    // Zoom container
    const g = svg.append("g");
    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        }),
    );

    // Links
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#2a3050")
      .attr("stroke-width", 1);

    // Nodes
    const node = g
      .append("g")
      .selectAll<SVGCircleElement, NodeDatum>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) =>
        d.type === "dimension"
          ? 18
          : Math.max(4, Math.sqrt(d.residentCount) * 2.5),
      )
      .attr("fill", (d) => d.color)
      .attr("stroke", (d) => (d.type === "dimension" ? "#fff" : "transparent"))
      .attr("stroke-width", (d) => (d.type === "dimension" ? 1.5 : 0))
      .attr("cursor", "pointer")
      .on("mouseenter", (event: MouseEvent, d: NodeDatum) => {
        const svgRect = el.getBoundingClientRect();
        setTooltip({
          x: event.clientX - svgRect.left,
          y: event.clientY - svgRect.top,
          name: d.id.replace(/^(dim|loc)::/, ""),
          type: d.type,
          residents: d.residentCount,
        });
        d3.select(event.currentTarget as Element)
          .attr("stroke", "#97ce4c")
          .attr("stroke-width", 2);
      })
      .on("mousemove", (event: MouseEvent) => {
        const svgRect = el.getBoundingClientRect();
        setTooltip(
          (t) =>
            t && {
              ...t,
              x: event.clientX - svgRect.left,
              y: event.clientY - svgRect.top,
            },
        );
      })
      .on("mouseleave", (event: MouseEvent, d: NodeDatum) => {
        setTooltip(null);
        d3.select(event.currentTarget as Element)
          .attr("stroke", d.type === "dimension" ? "#fff" : "transparent")
          .attr("stroke-width", d.type === "dimension" ? 1.5 : 0);
      })
      .call(
        d3
          .drag<SVGCircleElement, NodeDatum>()
          .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    // Labels for dimension nodes only
    const label = g
      .append("g")
      .selectAll<SVGTextElement, NodeDatum>("text")
      .data(nodes.filter((n) => n.type === "dimension"))
      .join("text")
      .text((d) => {
        const name = d.id.replace("dim::", "");
        return name.length > 18 ? name.slice(0, 16) + "…" : name;
      })
      .attr("font-size", 9)
      .attr("fill", "#94a3b8")
      .attr("text-anchor", "middle")
      .attr("dy", () => 18 + 11)
      .attr("pointer-events", "none");

    sim.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NodeDatum).x ?? 0)
        .attr("y1", (d) => (d.source as NodeDatum).y ?? 0)
        .attr("x2", (d) => (d.target as NodeDatum).x ?? 0)
        .attr("y2", (d) => (d.target as NodeDatum).y ?? 0);
      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
      label.attr("x", (d) => d.x ?? 0).attr("y", (d) => d.y ?? 0);
    });

    return () => {
      sim.stop();
    };
  }, [locations]);

  return (
    <div className="relative">
      <h2 className="text-xl font-semibold mb-1 text-slate-100">
        Dimension Network
      </h2>
      <p className="text-sm mb-4 mt-0 text-slate-500">
        Force-directed graph: large colored nodes = dimensions, small nodes =
        locations within that dimension. Drag nodes, scroll to zoom.
      </p>

      {/* Legend */}
      <div className="flex gap-6 mb-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-3.5 h-3.5 rounded-full bg-portal border border-white" />
          Dimension node (colored by name)
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
          Location node (size = residents)
        </div>
      </div>

      <svg
        ref={svgRef}
        className="w-full h-145 bg-night rounded-xl border border-rim block"
      />

      {tooltip && (
        <div
          className="absolute bg-night border border-rim rounded-lg px-3 py-2 text-xs text-slate-200 pointer-events-none whitespace-nowrap z-10"
          style={{
            top: tooltip.y + 112,
            left: tooltip.x,
            transform: "translateX(-50%)",
          }}
        >
          <p
            className={`m-0 font-semibold ${tooltip.type === "dimension" ? "text-portal" : "text-slate-400"}`}
          >
            {tooltip.type === "dimension" ? "⬡ " : "○ "}
            {tooltip.name}
          </p>
          <p className="m-0 mt-1 text-slate-500">
            {tooltip.residents} resident{tooltip.residents !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
