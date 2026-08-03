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
  attackCoordinate,
  getProjectorState,
  skipTurn,
} from "../api/attackApi";

import PublicBoard from "../components/PublicBoard";
import AttackResultModal from "../components/AttackResultModal";
import useCountdown from "../hooks/userCountdown.js";

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(remainingSeconds).padStart(
    2,
    "0"
  )}`;
};

const AttackScreen = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState(null);
  const [selectedTargetId, setSelectedTargetId] =
    useState(null);

  const [pendingCoordinate, setPendingCoordinate] =
    useState(null);

  const [attackResult, setAttackResult] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const loadState = useCallback(async () => {
    try {
      const data =
        await getProjectorState(gameId);

      setState(data);

      if (data.game.phase !== "attack") {
        setSelectedTargetId(null);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not load projector state."
      );
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadState();

    const interval = window.setInterval(
      loadState,
      5000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [loadState]);

  const remainingSeconds = useCountdown(
    state?.game?.turnEndsAt
  );

  const currentTeamId =
    state?.game?.currentTurnTeam?._id ||
    state?.game?.currentTurnTeam?.id;

  const targetBoards = useMemo(() => {
    if (!state) {
      return [];
    }

    return state.boards.filter(
      (board) =>
        String(board.team._id || board.team.id) !==
        String(currentTeamId)
    );
  }, [state, currentTeamId]);

  const selectedBoard = useMemo(() => {
    return targetBoards.find(
      (board) =>
        String(board.team._id || board.team.id) ===
        String(selectedTargetId)
    );
  }, [targetBoards, selectedTargetId]);

  const handleCellSelection = (coordinate) => {
    if (!selectedBoard || submitting) {
      return;
    }

    setPendingCoordinate(coordinate);
  };

  const confirmAttack = async () => {
    if (
      !selectedTargetId ||
      !pendingCoordinate
    ) {
      return;
    }

    try {
      setSubmitting(true);

      const data = await attackCoordinate({
        gameId,
        targetTeamId: selectedTargetId,
        coordinate: pendingCoordinate,
      });

      setAttackResult(data.attack);
      setPendingCoordinate(null);
      setSelectedTargetId(null);

      await loadState();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Attack failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipTurn = async () => {
    const confirmed = window.confirm(
      "Skip the current team's turn?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);

      await skipTurn(gameId);

      setPendingCoordinate(null);
      setSelectedTargetId(null);

      await loadState();

      toast.success("Turn skipped.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not skip turn."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading attack screen...
      </main>
    );
  }

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Game state unavailable.
      </main>
    );
  }

  const { game, recentAttacks } = state;

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white">
      <div className="mx-auto max-w-[1800px]">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Attackship
              </p>

              <h1 className="mt-1 text-3xl font-bold">
                {game.name}
              </h1>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-400">
                Round
              </p>

              <p className="text-2xl font-bold">
                {game.currentRound}/
                {game.totalRounds}
              </p>
            </div>

            <div
              className={`rounded-xl px-6 py-3 text-center ${
                remainingSeconds <= 10
                  ? "bg-red-500/20 text-red-300"
                  : "bg-slate-950 text-white"
              }`}
            >
              <p className="text-sm text-slate-400">
                Time
              </p>

              <p className="font-mono text-3xl font-bold">
                {formatTime(
                  remainingSeconds
                )}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {game.teams.map((team) => {
            const teamId =
              team._id || team.id;

            const isCurrent =
              String(teamId) ===
              String(currentTeamId);

            return (
              <article
                key={teamId}
                className={`rounded-2xl border p-4 ${
                  isCurrent
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-slate-800 bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{
                      backgroundColor:
                        team.color,
                    }}
                  />

                  <h2 className="font-semibold">
                    {team.name}
                  </h2>
                </div>

                <div className="mt-4 flex justify-between">
                  <span className="text-slate-400">
                    Score
                  </span>

                  <strong className="text-xl">
                    {team.score}
                  </strong>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-slate-400">
                    Attacks left
                  </span>

                  <span>
                    {team.attacksRemaining}
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        {game.phase === "roundComplete" ? (
          <section className="mt-6 rounded-3xl border border-green-500/40 bg-green-500/10 p-10 text-center">
            <h2 className="text-4xl font-bold text-green-300">
              Round {game.currentRound} complete
            </h2>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/games/${gameId}/setup-round`
                )
              }
              className="mt-6 rounded-xl bg-green-500 px-7 py-3 font-semibold text-slate-950"
            >
              Set up next round
            </button>
          </section>
        ) : (
          <>
            <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Current turn
              </p>

              <h2
                className="mt-2 text-4xl font-black"
                style={{
                  color:
                    game.currentTurnTeam
                      ?.color || "white",
                }}
              >
                {game.currentTurnTeam
                  ?.name || "No active team"}
              </h2>

              <p className="mt-2 text-slate-400">
                Select one of the other three
                teams to attack.
              </p>
            </section>

            <section className="mt-5">
              <div className="grid gap-5 xl:grid-cols-3">
                {targetBoards.map((board) => {
                  const teamId =
                    board.team._id ||
                    board.team.id;

                  const selected =
                    String(teamId) ===
                    String(selectedTargetId);

                  return (
                    <div key={board.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTargetId(
                            teamId
                          );

                          setPendingCoordinate(
                            null
                          );
                        }}
                        className={`mb-3 w-full rounded-xl border px-4 py-3 font-semibold transition ${
                          selected
                            ? "border-cyan-400 bg-cyan-500 text-slate-950"
                            : "border-slate-700 bg-slate-900 hover:bg-slate-800"
                        }`}
                      >
                        {selected
                          ? `Attacking ${board.team.name}`
                          : `Select ${board.team.name}`}
                      </button>

                      <PublicBoard
                        board={board}
                        selected={selected}
                        disabled={
                          !selected ||
                          submitting
                        }
                        onSelectCoordinate={
                          handleCellSelection
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div>
                <p className="text-sm text-slate-400">
                  Selected attack
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {selectedBoard
                    ? selectedBoard.team.name
                    : "No target"}
                  {pendingCoordinate
                    ? ` — ${pendingCoordinate}`
                    : ""}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSkipTurn}
                  disabled={submitting}
                  className="rounded-xl border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  Skip turn
                </button>

                <button
                  type="button"
                  onClick={confirmAttack}
                  disabled={
                    submitting ||
                    !selectedTargetId ||
                    !pendingCoordinate
                  }
                  className="rounded-xl bg-red-500 px-7 py-3 font-bold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Attacking..."
                    : "Confirm attack"}
                </button>
              </div>
            </section>
          </>
        )}

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-semibold">
            Recent attacks
          </h2>

          <div className="mt-4 space-y-2">
            {recentAttacks.length === 0 ? (
              <p className="text-slate-400">
                No attacks have been made.
              </p>
            ) : (
              recentAttacks.map((attack) => (
                <div
                  key={attack.id}
                  className="grid gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  <span>
                    {attack.attackingTeam.name}
                    {" → "}
                    {attack.targetTeam.name}
                  </span>

                  <strong>
                    {attack.coordinate}
                  </strong>

                  <span
                    className={
                      attack.result === "hit"
                        ? "font-bold text-red-400"
                        : "text-slate-400"
                    }
                  >
                    {attack.result.toUpperCase()}
                    {attack.shipSunk
                      ? " — SUNK"
                      : ""}
                  </span>

                  <span className="text-right text-cyan-300">
                    +{attack.pointsAwarded}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <AttackResultModal
        attack={attackResult}
        onClose={() =>
          setAttackResult(null)
        }
      />
    </main>
  );
};

export default AttackScreen;