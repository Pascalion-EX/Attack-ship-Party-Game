const variants = {
  primary:
    "border-cyan-400 bg-cyan-400 text-zinc-950 hover:bg-cyan-300",

  secondary:
    "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800",

  danger:
    "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",

  ghost:
    "border-transparent bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white",

  success:
    "border-emerald-400 bg-emerald-400 text-zinc-950 hover:bg-emerald-300",
};

const sizes = {
  sm: "min-h-9 px-3 py-2 text-sm",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-base",
};

const Button = ({
  children,
  variant = "secondary",
  size = "md",
  type = "button",
  className = "",
  disabled = false,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;