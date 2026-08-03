import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import { getGameById } from "../api/gameApi";

const GameSetupResult = () => {
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [game, setGame] = useState(
    location.state?.createdGame || null
  );

  const [fleet] = useState(
    location.state?.fleet || []
  );

  const [loading, setLoading] = useState(!game);

  useEffect(() => {
    if (game) {
      return;
    }

    const loadGame = async () => {
      try {
        const data = await getGameById(gameId);
        setGame(data.game);
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
  }, [game, gameId, navigate]);

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
      <div className="mx-auto max-w-6xl">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Game ready
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {game.name}
          </h1>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="rounded-full bg-slate-800 px-4 py-2">
              {game.boardSize} × {game.boardSize} boards
            </span>

            <span className="rounded-full bg-slate-800 px-4 py-2">
              {game.totalRounds} rounds
            </span>

            <span className="rounded-full bg-slate-800 px-4 py-2">
              {game.turnDurationSeconds} seconds per turn
            </span>

            <span className="rounded-full bg-slate-800 px-4 py-2 capitalize">
              {game.status}
            </span>
          </div>
        </header>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Teams
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {game.teams.map((team) => (
              <article
                key={team._id || team.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div
                  className="mb-4 h-3 rounded-full"
                  style={{
                    backgroundColor: team.color,
                  }}
                />

                <h3 className="text-lg font-semibold">
                  {team.name}
                </h3>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">
                      Score
                    </dt>
                    <dd>{team.score}</dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-slate-400">
                      Ships
                    </dt>
                    <dd>{team.shipsRemaining}</dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-slate-400">
                      Attacks
                    </dt>
                    <dd>{team.attacksRemaining}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        {fleet.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Fleet configuration
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Each team has the same fleet. Ship positions remain hidden.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {fleet.map((ship) => (
                <div
                  key={ship.name}
                  className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3"
                >
                  <span>{ship.name}</span>

                  <span className="text-sm text-slate-400">
                    {ship.size} cells
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="rounded-xl border border-slate-700 px-5 py-3 font-medium transition hover:bg-slate-800"
          >
            Admin home
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(`/admin/games/${game.id}/setup-round`)
            }
            className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Set up first round
          </button>
        </div>
      </div>
    </main>
  );
};

export default GameSetupResult;