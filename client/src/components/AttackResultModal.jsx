const AttackResultModal = ({
  attack,
  onClose,
}) => {
  if (!attack) {
    return null;
  }

  const wasHit = attack.result === "hit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-10 text-center text-white shadow-2xl">
        <p className="text-5xl font-black">
          {attack.coordinate}
        </p>

        <h2
          className={`mt-6 text-6xl font-black ${
            wasHit
              ? "text-red-400"
              : "text-slate-300"
          }`}
        >
          {wasHit ? "HIT" : "MISS"}
        </h2>

        {attack.shipSunk && (
          <p className="mt-5 text-3xl font-bold text-orange-400">
            SHIP SUNK
          </p>
        )}

        {attack.allShipsSunk && (
          <p className="mt-4 text-2xl font-bold text-yellow-400">
            ALL SHIPS DESTROYED
          </p>
        )}

        <p className="mt-6 text-xl text-slate-300">
          +{attack.pointsAwarded} points
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 rounded-xl bg-cyan-500 px-8 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default AttackResultModal;