import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { toast } from "react-toastify";

import {
  getGameById,
  getManualBoard,
  getPlacementStatus,
  saveManualBoard,
} from "../api/gameApi.js";

const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const getId = (item) =>
  item?.id || item?._id;

const createCoordinate = (
  row,
  column
) => {
  return `${alphabet[row]}${
    column + 1
  }`;
};

const ManualShipPlacement = () => {
  const { gameId } = useParams();

  const navigate = useNavigate();

  const [game, setGame] =
    useState(null);

  const [fleet, setFleet] =
    useState([]);

  const [ships, setShips] =
    useState([]);

  const [placementStatus, setPlacementStatus] =
    useState(null);

  const [selectedTeamId, setSelectedTeamId] =
    useState(null);

  const [selectedShipIndex, setSelectedShipIndex] =
    useState(null);

  const [orientation, setOrientation] =
    useState("horizontal");

  const [loading, setLoading] =
    useState(true);

  const [loadingBoard, setLoadingBoard] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  /*
   * Load game + overall placement status.
   */
  const loadGame = useCallback(
    async () => {
      try {
        setLoading(true);

        const [
          gameData,
          statusData,
        ] = await Promise.all([
          getGameById(gameId),
          getPlacementStatus(
            gameId
          ),
        ]);

        const loadedGame =
          gameData.game;

        setGame(loadedGame);

        setPlacementStatus(
          statusData
        );

        if (
          loadedGame
            ?.placementMode !==
          "manual"
        ) {
          toast.error(
            "This game does not use manual ship placement."
          );

          navigate(
            `/admin/games/${gameId}`,
            {
              replace: true,
            }
          );

          return;
        }

        const firstIncompleteTeam =
          statusData.teams?.find(
            (team) =>
              !team.placementComplete
          );

        const firstTeam =
          firstIncompleteTeam ||
          statusData.teams?.[0] ||
          loadedGame.teams?.[0];

        if (firstTeam) {
          setSelectedTeamId(
            getId(firstTeam)
          );
        }
      } catch (error) {
        toast.error(
          error.response?.data
            ?.message ||
            error.message ||
            "Could not load ship placement."
        );
      } finally {
        setLoading(false);
      }
    },
    [gameId, navigate]
  );

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  /*
   * Load selected team's hidden board.
   */
  const loadSelectedBoard =
    useCallback(async () => {
      if (!selectedTeamId) {
        return;
      }

      try {
        setLoadingBoard(true);

        const data =
          await getManualBoard(
            gameId,
            selectedTeamId
          );

        setFleet(
          Array.isArray(data.fleet)
            ? data.fleet
            : []
        );

        setShips(
          Array.isArray(
            data.board?.ships
          )
            ? data.board.ships.map(
                (ship) => ({
                  name:
                    ship.name,

                  size:
                    ship.size,

                  orientation:
                    ship.orientation,

                  coordinates: [
                    ...(ship.coordinates ||
                      []),
                  ],
                })
              )
            : []
        );

        setSelectedShipIndex(
          null
        );
      } catch (error) {
        toast.error(
          error.response?.data
            ?.message ||
            error.message ||
            "Could not load team board."
        );
      } finally {
        setLoadingBoard(false);
      }
    }, [
      gameId,
      selectedTeamId,
    ]);

  useEffect(() => {
    loadSelectedBoard();
  }, [loadSelectedBoard]);

  const currentTeam =
    useMemo(() => {
      return game?.teams?.find(
        (team) =>
          getId(team) ===
          selectedTeamId
      );
    }, [
      game,
      selectedTeamId,
    ]);

  /*
   * Find a placed ship corresponding
   * to one fleet definition.
   */
  const getPlacedShip = (
    fleetShip
  ) => {
    return ships.find(
      (ship) =>
        ship.name ===
        fleetShip.name
    );
  };

  /*
   * Coordinates occupied by ships.
   */
  const occupiedCoordinates =
    useMemo(() => {
      const map = new Map();

      ships.forEach(
        (ship, shipIndex) => {
          ship.coordinates?.forEach(
            (coordinate) => {
              map.set(
                coordinate,
                {
                  ship,
                  shipIndex,
                }
              );
            }
          );
        }
      );

      return map;
    }, [ships]);

  /*
   * Produce candidate coordinates
   * when a board cell is clicked.
   */
  const buildCoordinates = (
    row,
    column,
    shipSize
  ) => {
    const coordinates = [];

    for (
      let offset = 0;
      offset < shipSize;
      offset += 1
    ) {
      const nextRow =
        orientation ===
        "vertical"
          ? row + offset
          : row;

      const nextColumn =
        orientation ===
        "horizontal"
          ? column + offset
          : column;

      if (
        nextRow < 0 ||
        nextRow >=
          game.boardSize ||
        nextColumn < 0 ||
        nextColumn >=
          game.boardSize
      ) {
        return null;
      }

      coordinates.push(
        createCoordinate(
          nextRow,
          nextColumn
        )
      );
    }

    return coordinates;
  };

  const handleCellClick = (
    row,
    column
  ) => {
    if (
      selectedShipIndex ===
      null
    ) {
      return;
    }

    const fleetShip =
      fleet[selectedShipIndex];

    if (!fleetShip) {
      return;
    }

    const coordinates =
      buildCoordinates(
        row,
        column,
        fleetShip.size
      );

    if (!coordinates) {
      toast.error(
        "The ship would extend outside the board."
      );

      return;
    }

    /*
     * Allow moving an already
     * placed ship.
     */
    const otherShips =
      ships.filter(
        (ship) =>
          ship.name !==
          fleetShip.name
      );

    const occupiedByOthers =
      new Set(
        otherShips.flatMap(
          (ship) =>
            ship.coordinates ||
            []
        )
      );

    const overlaps =
      coordinates.some(
        (coordinate) =>
          occupiedByOthers.has(
            coordinate
          )
      );

    if (overlaps) {
      toast.error(
        "Ships cannot overlap."
      );

      return;
    }

    const newShip = {
      name: fleetShip.name,
      size: fleetShip.size,
      orientation,
      coordinates,
    };

    setShips([
      ...otherShips,
      newShip,
    ]);

    /*
     * Automatically select next
     * unplaced ship.
     */
    const nextIndex =
      fleet.findIndex(
        (
          candidate,
          index
        ) =>
          index >
            selectedShipIndex &&
          candidate.name !==
            fleetShip.name &&
          !otherShips.some(
            (ship) =>
              ship.name ===
              candidate.name
          )
      );

    setSelectedShipIndex(
      nextIndex === -1
        ? null
        : nextIndex
    );
  };

  const removeShip = (
    shipName
  ) => {
    setShips((previous) =>
      previous.filter(
        (ship) =>
          ship.name !==
          shipName
      )
    );
  };

  const resetBoard = () => {
    setShips([]);
    setSelectedShipIndex(
      fleet.length > 0
        ? 0
        : null
    );
  };

  const selectShip = (
    index
  ) => {
    const fleetShip =
      fleet[index];

    /*
     * If already placed, clicking
     * it selects it for repositioning.
     */
    setSelectedShipIndex(
      index
    );

    const placed =
      getPlacedShip(
        fleetShip
      );

    if (placed?.orientation) {
      setOrientation(
        placed.orientation
      );
    }
  };

  const orderedShips =
    useMemo(() => {
      /*
       * Backend validation expects
       * fleet ordering.
       */
      return fleet
        .map((fleetShip) =>
          ships.find(
            (ship) =>
              ship.name ===
              fleetShip.name
          )
        )
        .filter(Boolean);
    }, [fleet, ships]);

  const boardComplete =
    fleet.length > 0 &&
    orderedShips.length ===
      fleet.length;

  const handleSave = async () => {
    if (!boardComplete) {
      toast.error(
        "Place every ship before saving this board."
      );

      return;
    }

    try {
      setSaving(true);

      const result =
        await saveManualBoard({
          gameId,
          teamId:
            selectedTeamId,
          ships:
            orderedShips,
        });

      toast.success(
        result.message ||
          "Board saved."
      );

      const status =
        await getPlacementStatus(
          gameId
        );

      setPlacementStatus(
        status
      );

      /*
       * All four teams done.
       */
      if (
        status.allBoardsComplete
      ) {
        toast.success(
          "All four boards are ready."
        );

        return;
      }

      /*
       * Move automatically to the
       * next incomplete team.
       */
      const nextTeam =
        status.teams?.find(
          (team) =>
            !team.placementComplete
        );

      if (nextTeam) {
        setSelectedTeamId(
          getId(nextTeam)
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data
          ?.message ||
          error.message ||
          "Could not save board."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="text-lg font-semibold">
            Loading placement...
          </div>

          <div className="mt-2 text-sm text-slate-500">
            Preparing hidden
            boards
          </div>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Game not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Attackship
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Manual Ship
              Placement
            </h1>

            <p className="mt-2 text-slate-400">
              {game.name} ·{" "}
              {game.boardSize} ×{" "}
              {game.boardSize} board
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/games/${gameId}`
                )
              }
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-900"
            >
              Game details
            </button>

            <button
              type="button"
              disabled={
                !placementStatus?.allBoardsComplete
              }
              onClick={() =>
                navigate(
                  `/admin/games/${gameId}/setup-round`
                )
              }
              className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue to round
              setup
            </button>
          </div>
        </header>

        {/* PROGRESS */}

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-slate-400">
                Placement
                progress
              </div>

              <div className="mt-1 text-2xl font-bold">
                {placementStatus?.completedBoards ||
                  0}
                /
                {placementStatus?.totalBoards ||
                  4}{" "}
                teams
              </div>
            </div>

            {placementStatus?.allBoardsComplete && (
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
                All boards ready
              </div>
            )}
          </div>
        </section>

        {/* TEAM TABS */}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {game.teams?.map(
            (team) => {
              const teamId =
                getId(team);

              const teamStatus =
                placementStatus?.teams?.find(
                  (
                    statusTeam
                  ) =>
                    getId(
                      statusTeam
                    ) === teamId
                );

              const selected =
                selectedTeamId ===
                teamId;

              return (
                <button
                  key={teamId}
                  type="button"
                  onClick={() =>
                    setSelectedTeamId(
                      teamId
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-cyan-400 bg-cyan-400/10"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            team.color,
                        }}
                      />

                      <span className="font-semibold">
                        {team.name}
                      </span>
                    </div>

                    <span
                      className={
                        teamStatus?.placementComplete
                          ? "text-emerald-400"
                          : "text-slate-600"
                      }
                    >
                      {teamStatus?.placementComplete
                        ? "✓"
                        : "○"}
                    </span>
                  </div>
                </button>
              );
            }
          )}
        </section>

        {loadingBoard ? (
          <div className="mt-12 text-center text-slate-400">
            Loading board...
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            {/* BOARD */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    {currentTeam?.name ||
                      "Team"}{" "}
                    board
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select a ship,
                    choose its
                    orientation, then
                    click its starting
                    cell.
                  </p>
                </div>

                <div className="flex rounded-xl border border-slate-700 bg-slate-950 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setOrientation(
                        "horizontal"
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-sm ${
                      orientation ===
                      "horizontal"
                        ? "bg-cyan-500 font-semibold text-slate-950"
                        : "text-slate-400"
                    }`}
                  >
                    Horizontal
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setOrientation(
                        "vertical"
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-sm ${
                      orientation ===
                      "vertical"
                        ? "bg-cyan-500 font-semibold text-slate-950"
                        : "text-slate-400"
                    }`}
                  >
                    Vertical
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="mx-auto w-fit">
                  {/* COLUMN NUMBERS */}

                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `36px repeat(${game.boardSize}, minmax(42px, 56px))`,
                    }}
                  >
                    <div />

                    {Array.from(
                      {
                        length:
                          game.boardSize,
                      },
                      (
                        _,
                        column
                      ) => (
                        <div
                          key={
                            column
                          }
                          className="flex h-8 items-center justify-center text-xs font-semibold text-slate-500"
                        >
                          {column +
                            1}
                        </div>
                      )
                    )}

                    {Array.from(
                      {
                        length:
                          game.boardSize,
                      },
                      (_, row) => (
                        <>
                          <div
                            key={`label-${row}`}
                            className="flex items-center justify-center text-xs font-semibold text-slate-500"
                          >
                            {
                              alphabet[
                                row
                              ]
                            }
                          </div>

                          {Array.from(
                            {
                              length:
                                game.boardSize,
                            },
                            (
                              __,
                              column
                            ) => {
                              const coordinate =
                                createCoordinate(
                                  row,
                                  column
                                );

                              const occupied =
                                occupiedCoordinates.get(
                                  coordinate
                                );

                              return (
                                <button
                                  key={
                                    coordinate
                                  }
                                  type="button"
                                  title={
                                    occupied
                                      ? `${coordinate} · ${occupied.ship.name}`
                                      : coordinate
                                  }
                                  onClick={() =>
                                    handleCellClick(
                                      row,
                                      column
                                    )
                                  }
                                  className={`flex aspect-square min-h-11 min-w-11 items-center justify-center rounded-md border text-xs font-semibold transition ${
                                    occupied
                                      ? "border-cyan-400 bg-cyan-500 text-slate-950"
                                      : selectedShipIndex !==
                                          null
                                        ? "border-slate-700 bg-slate-950 text-slate-600 hover:border-cyan-500 hover:bg-cyan-500/10"
                                        : "border-slate-800 bg-slate-950 text-slate-700"
                                  }`}
                                >
                                  {occupied
                                    ? "■"
                                    : ""}
                                </button>
                              );
                            }
                          )}
                        </>
                      )
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* FLEET */}

            <aside className="space-y-5">
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">
                    Fleet
                  </h2>

                  <span className="text-xs text-slate-500">
                    {
                      orderedShips.length
                    }
                    /{fleet.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {fleet.map(
                    (
                      ship,
                      index
                    ) => {
                      const placed =
                        getPlacedShip(
                          ship
                        );

                      const selected =
                        selectedShipIndex ===
                        index;

                      return (
                        <div
                          key={
                            ship.name
                          }
                          className={`rounded-xl border p-4 ${
                            selected
                              ? "border-cyan-400 bg-cyan-400/10"
                              : "border-slate-800 bg-slate-950"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              selectShip(
                                index
                              )
                            }
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">
                                  {
                                    ship.name
                                  }
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {
                                    ship.size
                                  }{" "}
                                  cells
                                </div>
                              </div>

                              <span
                                className={
                                  placed
                                    ? "text-emerald-400"
                                    : "text-slate-600"
                                }
                              >
                                {placed
                                  ? "✓"
                                  : "○"}
                              </span>
                            </div>
                          </button>

                          {placed && (
                            <div className="mt-3 border-t border-slate-800 pt-3">
                              <div className="text-xs text-slate-500">
                                {placed.coordinates.join(
                                  ", "
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeShip(
                                    ship.name
                                  )
                                }
                                className="mt-2 text-xs font-medium text-red-400 hover:text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={
                      resetBoard
                    }
                    disabled={
                      saving
                    }
                    className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                  >
                    Reset board
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleSave
                    }
                    disabled={
                      saving ||
                      !boardComplete
                    }
                    className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving
                      ? "Saving..."
                      : `Save ${
                          currentTeam?.name ||
                          "team"
                        }`}
                  </button>
                </div>

                {!boardComplete && (
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Place all{" "}
                    {fleet.length}{" "}
                    ships before
                    saving.
                  </p>
                )}
              </section>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
};

export default ManualShipPlacement;