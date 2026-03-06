export default function QrPreview({ data }) {
  if (!data) return null;

  return (
    <div className="mt-4 card bg-base-100 shadow border border-base-300">
      <div className="card-body py-3 px-4">
        <div className="flex items-center gap-2">
          {/* ícono check */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="text-success shrink-0"
          >
            <path
              d="M20 6 9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs font-semibold text-success uppercase tracking-wide">
            QR leído
          </span>
        </div>

        <div className="mt-1 font-mono text-sm break-all text-base-content bg-base-200 rounded-lg px-3 py-2">
          {data}
        </div>
      </div>
    </div>
  );
}