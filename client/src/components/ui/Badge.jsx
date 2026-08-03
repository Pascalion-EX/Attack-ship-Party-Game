const variants = {
  default:
    "border-zinc-700 bg-zinc-800 text-zinc-300",
  cyan:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  green:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  red:
    "border-red-500/30 bg-red-500/10 text-red-300",
  amber:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  violet:
    "border-violet-500/30 bg-violet-500/10 text-violet-300",
};

const Badge = ({
  children,
  variant = "default",
}) => {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
};

export default Badge;