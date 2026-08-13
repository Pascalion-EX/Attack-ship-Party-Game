const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const PublicBoard = ({
  board,
  selected,
  disabled,
  onSelectCoordinate,
}) => {
  /*
   * Stores attacked coordinates:
   *
   * A1 -> hit
   * B3 -> miss
   */
  const attackedCells = new Map(
    board.attackedCells.map((cell) => [
      cell.coordinate,
      cell.result,
    ])
  );

  /*
   * Coordinates belonging to ships
   * that have been completely sunk.
   *
   * Example:
   * ["B2", "B3", "B4"]
   */
  const sunkCoordinates = new Set(
    board.sunkCoordinates || []
  );

  const getCellClass = (
    status,
    coordinate
  ) => {
    /*
     * Fully sunk ship cell.
     *
     * Purple overrides normal hit red.
     */
    if (
      status === "hit" &&
      sunkCoordinates.has(coordinate)
    ) {
      return "border-violet-400 bg-violet-600 text-white";
    }

    /*
     * Normal hit.
     */
    if (status === "hit") {
      return "border-red-400 bg-red-500 text-white";
    }

    /*
     * Miss.
     */
    if (status === "miss") {
      return "border-slate-500 bg-slate-700 text-slate-200";
    }

    /*
     * Empty / untouched cell.
     */
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
              backgroundColor:
                board.team.color,
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
          {
            length: board.size,
          },
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
          {
            length: board.size,
          },
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
                  {
                    length: board.size,
                  },
                  (_, columnIndex) => {
                    const coordinate =
                      `${rowLetter}${
                        columnIndex + 1
                      }`;

                    const status =
                      attackedCells.get(
                        coordinate
                      );

                    const alreadyAttacked =
                      Boolean(status);

                    const isSunkCell =
                      status === "hit" &&
                      sunkCoordinates.has(
                        coordinate
                      );

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
                          status,
                          coordinate
                        )}`}
                        title={
                          isSunkCell
                            ? `${coordinate}: sunk ship`
                            : alreadyAttacked
                              ? `${coordinate}: ${status}`
                              : coordinate
                        }
                      >
                        {status === "hit"
                          ? "X"
                          : status ===
                              "miss"
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

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-red-500" />
          Hit
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-violet-600" />
          Sunk ship
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-slate-700" />
          Miss
        </div>
      </div>
    </article>
  );
};

export default PublicBoard;