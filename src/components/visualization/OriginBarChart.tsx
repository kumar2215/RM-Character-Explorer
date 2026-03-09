import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Location } from "../../types";

interface Props {
  locations: Location[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { name: string; residents: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-night border border-rim rounded-lg px-3.5 py-2.5 text-sm text-slate-200">
      <p className="font-semibold m-0 mb-1">{d.name}</p>
      <p className="m-0 text-portal">
        {d.residents} resident{d.residents !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function OriginBarChart({ locations }: Props) {
  const data = locations
    .map((l) => ({ name: l.name, residents: l.residents.length }))
    .sort((a, b) => b.residents - a.residents)
    .slice(0, 20);

  const maxVal = data[0]?.residents ?? 1;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1 text-slate-100">
        Top 20 Locations by Residents
      </h2>
      <p className="text-sm mb-6 mt-0 text-slate-500">
        How many characters originate from each location.
      </p>
      <ResponsiveContainer width="100%" height={480}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            domain={[0, maxVal]}
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={{ stroke: "#2a3050" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(151,206,76,0.07)" }}
          />
          <Bar dataKey="residents" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => {
              const ratio = 1 - index / data.length;
              const r = Math.round(151 * ratio + 42 * (1 - ratio));
              const g = Math.round(206 * ratio + 48 * (1 - ratio));
              const b = Math.round(76 * ratio + 100 * (1 - ratio));
              return <Cell key={index} fill={`rgb(${r},${g},${b})`} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
