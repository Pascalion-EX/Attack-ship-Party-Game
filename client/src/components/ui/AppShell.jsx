const AppShell = ({
  children,
  maxWidth = "max-w-7xl",
  className = "",
}) => {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div
        className={`mx-auto w-full ${maxWidth} px-4 py-6 sm:px-6 lg:px-8 ${className}`}
      >
        {children}
      </div>
    </main>
  );
};

export default AppShell;