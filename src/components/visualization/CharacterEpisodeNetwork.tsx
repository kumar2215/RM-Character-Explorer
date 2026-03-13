import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as d3 from "d3";
import type { CharacterNetworkLink, CharacterNetworkNode } from "../../types";

interface CharacterEpisodeNetworkProps {
  nodes: CharacterNetworkNode[];
  links: CharacterNetworkLink[];
}

type SimNode = CharacterNetworkNode & d3.SimulationNodeDatum;
type SimLink = {
  source: number | SimNode;
  target: number | SimNode;
  sharedEpisodes: number;
  sharedEpisodeIds: number[];
};

function statusColor(status: CharacterNetworkNode["status"]): string {
  if (status === "Alive") return "#97ce4c";
  if (status === "Dead") return "#ef4444";
  return "#a78bfa";
}

function nodeRadius(d: SimNode): number {
  return Math.max(10, Math.min(14, 10 + Math.log2(d.episodeCount + 1)));
}

export default function CharacterEpisodeNetwork({
  nodes,
  links,
}: CharacterEpisodeNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const el = svgRef.current;
    const W = el.clientWidth || 900;
    const H = el.clientHeight || 680;

    d3.select(el).selectAll("*").remove();

    const simNodes: SimNode[] = nodes.map((node) => ({ ...node }));
    const simLinks: SimLink[] = links.map((link) => ({ ...link }));

    setIsRendering(true);
    let hasSettled = false;

    const linkForce = d3
      .forceLink<SimNode, SimLink>(simLinks)
      .id((d) => d.id)
      .distance((d) => 220 - Math.min(110, d.sharedEpisodes * 12))
      .strength((d) => Math.min(0.95, 0.25 + d.sharedEpisodes * 0.12));

    const chargeForce = d3.forceManyBody<SimNode>().strength(-260);
    const collisionForce = d3.forceCollide<SimNode>((d) => nodeRadius(d) + 8);

    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force("link", linkForce)
      .force("charge", chargeForce)
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", collisionForce);

    const svg = d3.select(el);
    const defs = svg.append("defs");
    const g = svg.append("g");
    const overlay = svg.append("g");

    const nodeClips = defs
      .selectAll<SVGClipPathElement, SimNode>("clipPath")
      .data(simNodes)
      .join("clipPath")
      .attr("id", (d) => `char-clip-${d.id}`);

    nodeClips
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data((d) => [d])
      .join("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", (d) => nodeRadius(d));

    const tooltip = overlay
      .append("g")
      .attr("display", "none")
      .attr("pointer-events", "none");

    const tooltipBg = tooltip
      .append("rect")
      .attr("fill", "#0b1020")
      .attr("stroke", "#27324d")
      .attr("rx", 8)
      .attr("ry", 8);

    const tooltipName = tooltip
      .append("text")
      .attr("x", 10)
      .attr("y", 16)
      .attr("fill", "#97ce4c")
      .attr("font-size", 12)
      .attr("font-weight", 700);

    const tooltipGender = tooltip
      .append("text")
      .attr("x", 10)
      .attr("y", 31)
      .attr("fill", "#cbd5e1")
      .attr("font-size", 11);

    const tooltipExtra = tooltip
      .append("text")
      .attr("x", 10)
      .attr("y", 46)
      .attr("fill", "#94a3b8")
      .attr("font-size", 10);

    const nodeById = new Map<number, SimNode>(
      simNodes.map((node) => [node.id, node]),
    );

    let lastZoomLevel = 1;
    const applyZoomSpacing = (zoomLevel: number) => {
      const clampedZoom = Math.max(0.5, Math.min(3.5, zoomLevel));
      const spacingFactor = 1 + Math.max(0, clampedZoom - 1) * 0.8;

      linkForce
        .distance(
          (d) => (220 - Math.min(110, d.sharedEpisodes * 12)) * spacingFactor,
        )
        .strength((d) => Math.min(0.98, 0.25 + d.sharedEpisodes * 0.12));

      chargeForce.strength(-260 * spacingFactor);
      collisionForce.radius((d) => nodeRadius(d) + 8 * spacingFactor);

      hasSettled = false;
      setIsRendering(true);
      simulation.alpha(0.35).restart();
    };

    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 5])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);

          const zoomLevel = event.transform.k;
          if (Math.abs(zoomLevel - lastZoomLevel) > 0.08) {
            lastZoomLevel = zoomLevel;
            applyZoomSpacing(zoomLevel);
          }
        }),
    );

    const link = g
      .append("g")
      .attr("stroke", "#25314f")
      .attr("stroke-opacity", 0.7)
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr(
        "stroke-width",
        (d) => 0.8 + Math.min(3, Math.log2(d.sharedEpisodes + 1)),
      )
      .on("mouseenter", (event: MouseEvent, d: SimLink) => {
        const [x, y] = d3.pointer(event, el);
        const sourceId =
          typeof d.source === "number" ? d.source : (d.source as SimNode).id;
        const targetId =
          typeof d.target === "number" ? d.target : (d.target as SimNode).id;
        const sourceName = nodeById.get(sourceId)?.name ?? `#${sourceId}`;
        const targetName = nodeById.get(targetId)?.name ?? `#${targetId}`;

        tooltipName.text(`${sourceName} <-> ${targetName}`);
        tooltipGender.text(`Shared episodes: ${d.sharedEpisodes}`);

        const episodeList = d.sharedEpisodeIds.slice(0, 8).join(", ");
        const suffix = d.sharedEpisodeIds.length > 8 ? " ..." : "";
        tooltipExtra.text(`Episodes: ${episodeList}${suffix}`);

        const nameBox = (tooltipName.node() as SVGTextElement).getBBox();
        const countBox = (tooltipGender.node() as SVGTextElement).getBBox();
        const episodeBox = (tooltipExtra.node() as SVGTextElement).getBBox();
        const tooltipWidth =
          Math.max(nameBox.width, countBox.width, episodeBox.width) + 20;
        tooltipBg.attr("width", tooltipWidth).attr("height", 52);
        tooltip.attr("transform", `translate(${x + 10}, ${y + 12})`);
        tooltip.attr("display", null);
        d3.select(event.currentTarget as Element)
          .attr("stroke", "#cbd5e1")
          .attr("stroke-opacity", 1);
      })
      .on("mousemove", (event: MouseEvent) => {
        const [x, y] = d3.pointer(event, el);
        tooltip.attr("transform", `translate(${x + 10}, ${y + 12})`);
      })
      .on("mouseleave", (event: MouseEvent) => {
        tooltip.attr("display", "none");
        d3.select(event.currentTarget as Element)
          .attr("stroke", "#25314f")
          .attr("stroke-opacity", 0.7);
      });

    const node = g
      .append("g")
      .selectAll<SVGGElement, SimNode>("g.node")
      .data(simNodes)
      .join("g")
      .attr("class", "node")
      .attr("cursor", "pointer")
      .each(function appendNodeVisuals(d) {
        const nodeGroup = d3.select(this);
        const radius = nodeRadius(d);

        nodeGroup
          .append("circle")
          .attr("class", "avatar-bg")
          .attr("r", radius)
          .attr("fill", "#1f2937");

        nodeGroup
          .append("image")
          .attr("href", d.image)
          .attr("x", -radius)
          .attr("y", -radius)
          .attr("width", radius * 2)
          .attr("height", radius * 2)
          .attr("preserveAspectRatio", "xMidYMid slice")
          .attr("clip-path", `url(#char-clip-${d.id})`);

        nodeGroup
          .append("circle")
          .attr("class", "ring")
          .attr("r", radius)
          .attr("fill", "none")
          .attr("stroke", statusColor(d.status))
          .attr("stroke-width", 1.8);
      })
      .on("mouseenter", (event: MouseEvent, d: SimNode) => {
        const [x, y] = d3.pointer(event, el);
        tooltipName.text(d.name);
        tooltipGender.text(`Gender: ${d.gender}`);
        tooltipExtra.text("");
        const nameBox = (tooltipName.node() as SVGTextElement).getBBox();
        const genderBox = (tooltipGender.node() as SVGTextElement).getBBox();
        const tooltipWidth = Math.max(nameBox.width, genderBox.width) + 20;
        tooltipBg.attr("width", tooltipWidth).attr("height", 38);
        tooltip.attr("transform", `translate(${x + 10}, ${y + 12})`);
        tooltip.attr("display", null);
        d3.select(event.currentTarget as SVGGElement)
          .select<SVGCircleElement>("circle.ring")
          .attr("stroke", "#f8fafc")
          .attr("stroke-width", 2.4);
      })
      .on("mousemove", (event: MouseEvent) => {
        const [x, y] = d3.pointer(event, el);
        tooltip.attr("transform", `translate(${x + 10}, ${y + 12})`);
      })
      .on("mouseleave", (event: MouseEvent, d: SimNode) => {
        tooltip.attr("display", "none");
        d3.select(event.currentTarget as SVGGElement)
          .select<SVGCircleElement>("circle.ring")
          .attr("stroke", statusColor(d.status))
          .attr("stroke-width", 1.8);
      })
      .on("click", (_event: MouseEvent, d: SimNode) => {
        navigate(`/character/${d.id}`);
      })
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.2).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    simulation.on("tick", () => {
      if (!hasSettled && simulation.alpha() < 0.12) {
        hasSettled = true;
        setIsRendering(false);
      }

      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [links, navigate, nodes]);

  if (nodes.length === 0) {
    return (
      <div className="h-170 bg-night rounded-xl border border-rim flex items-center justify-center text-sm text-slate-400">
        No characters match the selected filters.
      </div>
    );
  }

  return (
    <div className="relative">
      <h2 className="text-xl font-semibold mb-1 text-slate-100">
        Character Episode Network
      </h2>
      <p className="text-sm mb-4 mt-0 text-slate-500">
        Nodes are characters. Edges connect characters with shared episodes
        above the selected threshold. Hover for details, click to open profile.
      </p>
      <p className="text-xs mb-3 mt-0 text-slate-400">
        Showing only characters with at least one qualifying connection.
      </p>
      <p className="text-xs mb-4 mt-0 text-slate-300">
        Currently displayed: {nodes.length} character
        {nodes.length !== 1 ? "s" : ""}
      </p>

      <div className="flex gap-5 mb-4 flex-wrap text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-portal" />
          Alive
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-red-500" />
          Dead
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-violet-400" />
          Unknown
        </div>
      </div>

      <svg
        ref={svgRef}
        className="w-full h-170 bg-night rounded-xl border border-rim block"
      />

      {isRendering && (
        <div className="absolute right-3 top-3 rounded-md border border-rim bg-night/90 px-3 py-1 text-xs text-slate-300">
          Rendering network...
        </div>
      )}
    </div>
  );
}
