const Select = ({
  label,
  children,
  id,
  className = "",
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

      <select
        id={id}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;