export function DashboardMockup() {
  return (
    <div className="relative mx-auto mt-12 max-w-4xl lg:mt-16">
      {/* Perspective container */}
      <div
        className="rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden"
        style={{
          transform: "perspective(2000px) rotateX(4deg) rotateY(-2deg)",
        }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="mx-auto rounded-md bg-white px-12 py-1 text-xs text-slate-400 ring-1 ring-slate-200">
            tne.badev.tools/dashboard
          </div>
        </div>

        {/* Dashboard content */}
        <div className="grid grid-cols-12 gap-4 p-5">
          {/* Left sidebar mock */}
          <div className="col-span-2 hidden space-y-3 lg:block">
            <div className="h-4 w-20 rounded bg-brand-100" />
            <div className="space-y-2 pt-2">
              {[80, 60, 70, 50, 65].map((w, i) => (
                <div
                  key={i}
                  className="h-3 rounded bg-slate-100"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="col-span-12 space-y-4 lg:col-span-10">
            {/* Top row: gauge + stats */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {/* Gauge card */}
              <div className="col-span-1 rounded-lg bg-white p-3 ring-1 ring-slate-100">
                <div className="relative mx-auto h-16 w-16 sm:h-20 sm:w-20">
                  <svg viewBox="0 0 80 50" className="h-full w-full">
                    <path
                      d="M 5 45 A 35 35 0 0 1 75 45"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 5 45 A 35 35 0 0 1 75 45"
                      fill="none"
                      stroke="url(#mockGauge)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray="110"
                      strokeDashoffset="24"
                    />
                    <defs>
                      <linearGradient id="mockGauge" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                    <text
                      x="40"
                      y="44"
                      textAnchor="middle"
                      className="fill-slate-800 text-[13px] font-bold"
                    >
                      78%
                    </text>
                  </svg>
                </div>
                <p className="mt-1 text-center text-[10px] font-medium text-slate-500">
                  Overall Score
                </p>
              </div>

              {/* Theme score cards */}
              {[
                { label: "Teaching", score: 82, color: "bg-indigo-500" },
                { label: "Student Exp", score: 75, color: "bg-emerald-500" },
                { label: "Governance", score: 80, color: "bg-amber-500" },
              ].map((theme) => (
                <div
                  key={theme.label}
                  className="rounded-lg bg-white p-3 ring-1 ring-slate-100"
                >
                  <p className="text-[10px] font-medium text-slate-500">
                    {theme.label}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-800 sm:text-xl">
                    {theme.score}
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-1.5 rounded-full ${theme.color}`}
                      style={{ width: `${theme.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="rounded-lg bg-white p-3 ring-1 ring-slate-100">
              <div className="mb-2 flex items-center justify-between">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="flex gap-2">
                  <div className="h-2 w-10 rounded bg-slate-100" />
                  <div className="h-2 w-10 rounded bg-slate-100" />
                </div>
              </div>
              {/* Bar chart mock */}
              <div className="flex items-end gap-2 h-20 sm:h-24">
                {[65, 82, 75, 80, 70, 85, 78, 72, 88, 76, 82, 79].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-brand-600 to-brand-400 opacity-80"
                      style={{ height: `${h}%` }}
                    />
                  )
                )}
              </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white p-3 ring-1 ring-slate-100">
                <div className="h-3 w-16 rounded bg-slate-200" />
                <div className="mt-3 space-y-2">
                  {[90, 70, 55].map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full bg-brand-200"
                        style={{ width: `${w}%` }}
                      />
                      <span className="text-[9px] text-slate-400">
                        {w}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-white p-3 ring-1 ring-slate-100">
                <div className="h-3 w-20 rounded bg-slate-200" />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { n: "12", l: "Active" },
                    { n: "8", l: "Scored" },
                    { n: "3", l: "Review" },
                    { n: "1", l: "Draft" },
                  ].map((s) => (
                    <div key={s.l} className="text-center">
                      <p className="text-sm font-bold text-slate-700">
                        {s.n}
                      </p>
                      <p className="text-[9px] text-slate-400">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ambient glow */}
      <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-r from-brand-200/30 via-transparent to-blue-200/30 blur-2xl" />
    </div>
  );
}
