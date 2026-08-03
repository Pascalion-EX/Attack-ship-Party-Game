const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
  children,
}) => {
  return (
    <header className="border-b border-zinc-800 pb-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
              {eyebrow}
            </p>
          )}

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              {description}
            </p>
          )}

          {children}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;