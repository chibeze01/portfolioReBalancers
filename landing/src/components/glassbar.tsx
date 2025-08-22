interface GlassBarProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  className?: string;
  status?: { state: "idle" | "loading" | "success" | "error"; message: string };
}

function GlassBar({
  onSubmit,
  email,
  setEmail,
  className = "",
  status,
}: GlassBarProps) {
  return (
    <div
      className={`rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xl shadow-2xl ${className}`}
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <span className="text-sm font-medium text-white/90">
          Join the waitlist for early access
        </span>
        <form
          onSubmit={onSubmit}
          className="flex w-full max-w-md items-center gap-2"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            className="flex-1 rounded-xl border border-white/10 bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            type="submit"
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
            disabled={status?.state === "loading"}
          >
            {status?.state === "loading" ? "…" : "Join"}
          </button>
        </form>
      </div>
      {status && status.state !== "idle" && (
        <p
          className={`mt-2 text-xs ${
            status.state === "success"
              ? "text-emerald-400"
              : status.state === "error"
              ? "text-rose-400"
              : "text-gray-400"
          }`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}

export default GlassBar;
