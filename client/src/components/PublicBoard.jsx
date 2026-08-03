const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const PublicBoard = ({
  board,
  selected,
  disabled,
  onSelectCoordinate,
}) => {
  const attackedCells = new Map(
    board.attackedCells.map((cell) => [
      cell.coordinate,
      cell.result,
    ])
  );

  const getCellClass = (status) => {
    if (status === "hit") {
      return "border-red-400 bg-red-500 text-white";
    }

    if (status === "miss") {
      return "border-slate-500 bg-slate-700 text-slate-200";
    }

    return "border-slate-700 bg-slate-900 text-slate-400 hover:border-cyan-400 hover:bg-slate-800";
  };

  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        selected
          ? "border-cyan-400 bg-slate-900"
          : "border-slate-800 bg-slate-900/70"
      }`}
    >
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="h-4 w-4 rounded-full"
            style={{
              backgroundColor: board.team.color,
            }}
          />

          <h2 className="text-lg font-semibold">
            {board.team.name}
          </h2>
        </div>

        <span className="text-sm text-slate-400">
          {board.team.shipsRemaining} ships
        </span>
      </header>

      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `28px repeat(${board.size}, minmax(32px, 1fr))`,
        }}
      >
        <div />

        {Array.from(
          { length: board.size },
          (_, columnIndex) => (
            <div
              key={`column-${columnIndex}`}
              className="flex h-7 items-center justify-center text-xs font-semibold text-slate-400"
            >
              {columnIndex + 1}
            </div>
          )
        )}

        {Array.from(
          { length: board.size },
          (_, rowIndex) => {
            const rowLetter =
              alphabet[rowIndex];

            return (
              <div
                key={`row-${rowLetter}`}
                className="contents"
              >
                <div className="flex items-center justify-center text-xs font-semibold text-slate-400">
                  {rowLetter}
                </div>

                {Array.from(
                  { length: board.size },
                  (_, columnIndex) => {
                    const coordinate = `${rowLetter}${
                      columnIndex + 1
                    }`;

                    const status =
                      attackedCells.get(coordinate);

                    const alreadyAttacked =
                      Boolean(status);

                    return (
                      <button
                        key={coordinate}
                        type="button"
                        disabled={
                          disabled ||
                          alreadyAttacked
                        }
                        onClick={() =>
                          onSelectCoordinate(
                            coordinate
                          )
                        }
                        className={`aspect-square min-h-8 rounded border text-xs font-bold transition disabled:cursor-not-allowed ${getCellClass(
                          status
                        )}`}
                        title={
                          alreadyAttacked
                            ? `${coordinate}: ${status}`
                            : coordinate
                        }
                      >
                        {status === "hit"
                          ? "X"
                          : status === "miss"
                            ? "•"
                            : ""}
                      </button>
                    );
                  }
                )}
              </div>
            );
          }
        )}
      </div>
    </article>
  );
};

export default PublicBoard;