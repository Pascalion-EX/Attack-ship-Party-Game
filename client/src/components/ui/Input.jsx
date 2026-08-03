const Input = ({
  label,
  error,
  hint,
  className = "",
  id,
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        className={`w-full rounded-xl border bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 ${
          error
            ? "border-red-500 focus:border-red-400"
            : "border-zinc-800 focus:border-cyan-400"
        }`}
        {...props}
      />

      {error && (
        <p className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {!error && hint && (
        <p className="mt-2 text-xs text-zinc-500">
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;