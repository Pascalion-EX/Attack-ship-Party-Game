const EmptyState = ({
  title,
  description,
  action,
}) => {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-lg text-zinc-400">
        —
      </div>

      <h3 className="mt-4 text-lg font-semibold text-white">
        {title}
      </h3>

      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;