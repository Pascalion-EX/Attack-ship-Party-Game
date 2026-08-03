import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import { getGameById } from "../api/gameApi";
import {
  setupRound,
  startRound,
} from "../api/roundApi";

const RoundSetup = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [attacks, setAttacks] = useState({});
  const [configuredRound, setConfiguredRound] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const loadGame = async () => {
      try {
        const data = await getGameById(gameId);

        setGame(data.game);

        const initialAttacks = {};

        data.game.teams.forEach((team) => {
          initialAttacks[team._id || team.id] = 1;
        });

        setAttacks(initialAttacks);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Could not load game."
        );

        navigate("/admin", {
          replace: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId, navigate]);

  const nextRoundNumber = useMemo(() => {
    return (game?.currentRound || 0) + 1;
  }, [game]);

  const totalAttacks = useMemo(() => {
    return Object.values(attacks).reduce(
      (total, value) => total + Number(value || 0),
      0
    );
  }, [attacks]);

  const handleAttackChange = (teamId, value) => {
    const numericValue = Math.max(
      0,
      Math.min(20, Number(value))
    );

    setAttacks((previous) => ({
      ...previous,
      [teamId]: numericValue,
    }));

    setConfiguredRound(null);
  };

  const handleConfigureRound = async () => {
    if (!game) {
      return;
    }

    if (totalAttacks === 0) {
      toast.error(
        "At least one team must receive an attack."
      );
      return;
    }

    try {
      setConfiguring(true);

      const attackEntries = game.teams.map((team) => ({
        teamId: team._id || team.id,
        attacks: Number(
          attacks[team._id || team.id] || 0
        ),
      }));

      const data = await setupRound({
        gameId,
        attackEntries,
      });

      setConfiguredRound(data.round);
      setGame(data.game);

      toast.success(
        `Round ${data.round.roundNumber} configured.`
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not configure round."
      );
    } finally {
      setConfiguring(false);
    }
  };

  const handleStartRound = async () => {
    try {
      setStarting(true);

      const data = await startRound(gameId);

      toast.success(
        `Round ${data.game.currentRound} started.`
      );

      navigate(
        `/admin/games/${gameId}/attack`,
        {
          replace: true,
        }
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not start round."
      );
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p>Loading game...</p>
      </main>
    );
  }

  if (!game) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Round setup
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {game.name}
          </h1>

          <p className="mt-2 text-slate-400">
            Configure attacks for round{" "}
            {nextRoundNumber} of {game.totalRounds}.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Attacks earned
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Enter the reward earned by each team from
                the IRL minigames.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm">
              Total turns:{" "}
              <strong>{totalAttacks}</strong>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {game.teams.map((team) => {
              const teamId = team._id || team.id;

              return (
                <article
                  key={teamId}
                  className="rounded-2xl border border-slate-700 bg-slate-950 p-5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{
                        backgroundColor: team.color,
                      }}
                    />

                    <h3 className="font-semibold">
                      {team.name}
                    </h3>
                  </div>

                  <label
                    htmlFor={`attacks-${teamId}`}
                    className="mt-5 block text-sm text-slate-300"
                  >
                    Number of attacks
                  </label>

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleAttackChange(
                          teamId,
                          Number(attacks[teamId] || 0) - 1
                        )
                      }
                      disabled={
                        configuring ||
                        Number(attacks[teamId] || 0) <= 0
                      }
                      className="h-11 w-11 rounded-xl border border-slate-700 text-xl transition hover:bg-slate-800 disabled:opacity-40"
                    >
                      −
                    </button>

                    <input
                      id={`attacks-${teamId}`}
                      type="number"
                      min="0"
                      max="20"
                      value={attacks[teamId] ?? 0}
                      onChange={(event) =>
                        handleAttackChange(
                          teamId,
                          event.target.value
                        )
                      }
                      disabled={configuring}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 text-center text-lg font-semibold outline-none focus:border-cyan-500"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleAttackChange(
                          teamId,
                          Number(attacks[teamId] || 0) + 1
                        )
                      }
                      disabled={
                        configuring ||
                        Number(attacks[teamId] || 0) >= 20
                      }
                      className="h-11 w-11 rounded-xl border border-slate-700 text-xl transition hover:bg-slate-800 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Queue behavior
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Turns alternate between teams. A team only
            appears again after every other eligible team
            has received a turn.
          </p>

          <div className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-slate-300">
            Example: if teams receive 3, 2, 1 and 1
            attacks, the order becomes:
            <div className="mt-2 font-semibold text-white">
              Team 1 → Team 2 → Team 3 → Team 4 →
              Team 1 → Team 2 → Team 1
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(`/admin/games/${gameId}`)
            }
            disabled={configuring || starting}
            className="rounded-xl border border-slate-700 px-5 py-3 font-medium transition hover:bg-slate-800 disabled:opacity-50"
          >
            Back
          </button>

          {!configuredRound ? (
            <button
              type="button"
              onClick={handleConfigureRound}
              disabled={configuring || totalAttacks === 0}
              className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {configuring
                ? "Creating queue..."
                : "Configure round"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartRound}
              disabled={starting}
              className="rounded-xl bg-green-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starting
                ? "Starting..."
                : `Start round ${configuredRound.roundNumber}`}
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

export default RoundSetup;