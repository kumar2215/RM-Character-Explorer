import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OriginCurrentSankey from "../../../components/visualization/OriginCurrentSankey";
import type { OriginCurrentSankeyData } from "../../../types";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Sankey: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sankey">{children}</div>
  ),
  Tooltip: () => <div data-testid="tooltip" />,
}));

const data: OriginCurrentSankeyData = {
  nodes: [
    { name: "Earth", kind: "origin", count: 2 },
    { name: "Mars", kind: "origin", count: 1 },
    { name: "Citadel", kind: "location", count: 3 },
  ],
  links: [
    { source: 0, target: 2, value: 2 },
    { source: 1, target: 2, value: 1 },
  ],
};

describe("OriginCurrentSankey", () => {
  it("renders empty state when no links are available", () => {
    render(<OriginCurrentSankey data={{ nodes: [], links: [] }} />);

    expect(
      screen.getByText("No flow data available for the current filters."),
    ).toBeInTheDocument();
  });

  it("toggles from count mode to percentage mode", () => {
    render(<OriginCurrentSankey data={data} />);

    expect(
      screen.getByText("how many characters follow each path.", {
        exact: false,
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "% by Origin" }));

    expect(
      screen.getByText("each path as a percentage of that origin's total.", {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("sankey")).toBeInTheDocument();
  });
});
