import AppShell from "./AppShell.jsx";

const LoadingScreen = ({
  message = "Loading...",
}) => {
  return (
    <AppShell className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-400" />

        <p className="mt-4 text-sm text-zinc-400">
          {message}
        </p>
      </div>
    </AppShell>
  );
};

export default LoadingScreen;