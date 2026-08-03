const StatCard = ({
  label,
  value,
  description,
}) => {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>

      {description && (
        <p className="mt-2 text-xs text-zinc-600">
          {description}
        </p>
      )}
    </article>
  );
};

export default StatCard;