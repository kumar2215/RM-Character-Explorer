interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const btnCls =
  "bg-card border border-rim rounded-lg text-slate-200 text-sm px-4 py-2 cursor-pointer transition-colors hover:border-portal disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-rim";

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <button
        className={btnCls}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Prev
      </button>

      <span className="text-slate-400 text-sm">
        Page <strong className="text-portal">{page}</strong> of{" "}
        <strong className="text-slate-200">{totalPages}</strong>
      </span>

      <button
        className={btnCls}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
}
