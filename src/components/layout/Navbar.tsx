import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between bg-surface border-b-2 border-portal">
      <NavLink to="/" className="flex items-center gap-2 no-underline">
        <span className="text-2xl font-bold tracking-tight text-portal">
          ☿ Rick &amp; Morty
        </span>
        <span className="text-slate-400 text-sm hidden sm:inline">
          Universe Explorer
        </span>
      </NavLink>

      <div className="flex gap-6">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `no-underline text-sm transition-colors ${
              isActive ? "text-portal font-semibold" : "text-slate-400"
            }`
          }
        >
          Characters
        </NavLink>
        <NavLink
          to="/visualization"
          className={({ isActive }) =>
            `no-underline text-sm transition-colors ${
              isActive ? "text-portal font-semibold" : "text-slate-400"
            }`
          }
        >
          Visualizations
        </NavLink>
      </div>
    </nav>
  );
}
