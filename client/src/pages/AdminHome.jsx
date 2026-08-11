import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../context/AuthContext.jsx";
import { getGames } from "../api/gameApi.js";

import AppShell from "../components/ui/AppShell.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import Badge from "../components/ui/Badge.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import LoadingScreen from "../components/ui/LoadingScreen.jsx";

const getGameId = (game) => {
  return game?.id || game?._id;
};

const formatDate = (
  dateValue
) => {
  if (!dateValue) {
    return "Unknown date";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
};

const formatStatus = (
  status
) => {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(
      /([A-Z])/g,
      " $1"
    )
    .replace(
      /^./,
      (character) =>
        character.toUpperCase()
    );
};

const getStatusVariant = (
  status
) => {
  switch (status) {
    case "attack":
      return "red";

    case "ready":
    case "waiting":
      return "cyan";

    case "roundComplete":
      return "violet";

    case "finished":
      return "green";

    case "paused":
    case "setup":
      return "amber";

    default:
      return "default";
  }
};

const AdminHome = () => {
  const navigate =
    useNavigate();

  const {
    admin,
    logout,
  } = useAuth();

  const [games, setGames] =
    useState([]);

  const [
    loadingGames,
    setLoadingGames,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const loadGames =
    useCallback(
      async ({
        showLoader = true,
      } = {}) => {
        try {
          if (showLoader) {
            setLoadingGames(
              true
            );
          } else {
            setRefreshing(
              true
            );
          }

          const data =
            await getGames();

          setGames(
            Array.isArray(
              data?.games
            )
              ? data.games
              : []
          );
        } catch (error) {
          toast.error(
            error.response
              ?.data?.message ||
              error.message ||
              "Could not load games."
          );
        } finally {
          setLoadingGames(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const statistics =
    useMemo(() => {
      const activeStatuses =
        new Set([
          "ready",
          "waiting",
          "attack",
          "roundComplete",
          "paused",
        ]);

      const totalRoundsPlayed =
        games.reduce(
          (
            total,
            game
          ) =>
            total +
            Number(
              game.currentRound ||
                0
            ),
          0
        );

      const activeGames =
        games.filter(
          (game) => {
            const state =
              game.phase ||
              game.status;

            return activeStatuses.has(
              state
            );
          }
        ).length;

      const finishedGames =
        games.filter(
          (game) => {
            const state =
              game.phase ||
              game.status;

            return (
              state ===
              "finished"
            );
          }
        ).length;

      return {
        total: games.length,
        active:
          activeGames,
        rounds:
          totalRoundsPlayed,
        finished:
          finishedGames,
      };
    }, [games]);

  const activeGame =
    useMemo(() => {
      return games.find(
        (game) =>
          game.phase ===
            "attack" ||
          game.status ===
            "attack"
      );
    }, [games]);

  const pendingPlacementGames =
    useMemo(() => {
      return games.filter(
        (game) =>
          game.placementMode ===
            "manual" &&
          !game.shipsPlaced
      );
    }, [games]);

  const handleLogout =
    async () => {
      try {
        await logout();

        toast.success(
          "Logged out."
        );

        navigate(
          "/admin/login",
          {
            replace: true,
          }
        );
      } catch (error) {
        toast.error(
          error.response
            ?.data?.message ||
            "Logout failed."
        );
      }
    };

  const handleOpenGame = (
    game
  ) => {
    const gameId =
      getGameId(game);

    if (!gameId) {
      toast.error(
        "Game ID is missing."
      );
      return;
    }

    navigate(
      `/admin/games/${gameId}`
    );
  };

  const handleShipPlacement = (
    game
  ) => {
    const gameId =
      getGameId(game);

    if (!gameId) {
      toast.error(
        "Game ID is missing."
      );
      return;
    }

    navigate(
      `/admin/games/${gameId}/ships`
    );
  };

  const handleSetupRound = (
    game
  ) => {
    const gameId =
      getGameId(game);

    if (!gameId) {
      toast.error(
        "Game ID is missing."
      );
      return;
    }

    if (
      game.placementMode ===
        "manual" &&
      !game.shipsPlaced
    ) {
      toast.error(
        "Complete ship placement first."
      );

      return;
    }

    navigate(
      `/admin/games/${gameId}/setup-round`
    );
  };

  const handleLaunchProjector = (
    game
  ) => {
    const gameId =
      getGameId(game);

    if (!gameId) {
      toast.error(
        "Game ID is missing."
      );
      return;
    }

    navigate(
      `/admin/games/${gameId}/attack`
    );
  };

  if (loadingGames) {
    return (
      <LoadingScreen message="Loading control center..." />
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Attackship"
        title="Control center"
        description={`Signed in as ${
          admin?.name ||
          "Administrator"
        }${
          admin?.email
            ? ` · ${admin.email}`
            : ""
        }`}
        actions={
          <>
            <Button
              onClick={() =>
                loadGames({
                  showLoader:
                    false,
                })
              }
              disabled={
                refreshing
              }
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </Button>

            <Button
              variant="primary"
              onClick={() =>
                navigate(
                  "/admin/games/new"
                )
              }
            >
              Create game
            </Button>

            <Button
              variant="danger"
              onClick={
                handleLogout
              }
            >
              Logout
            </Button>
          </>
        }
      />

      {/* STATISTICS */}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total games"
          value={
            statistics.total
          }
          description="All created games"
        />

        <StatCard
          label="Active games"
          value={
            statistics.active
          }
          description="Ready or in progress"
        />

        <StatCard
          label="Rounds played"
          value={
            statistics.rounds
          }
          description="Across all games"
        />

        <StatCard
          label="Finished"
          value={
            statistics.finished
          }
          description="Completed games"
        />
      </section>

      {/* QUICK ACTIONS */}

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <QuickActionCard
          title="Create a game"
          description="Create four teams and choose automatic or manual hidden ship placement."
          actionLabel="Create game"
          onAction={() =>
            navigate(
              "/admin/games/new"
            )
          }
        />

        <QuickActionCard
          title={
            pendingPlacementGames.length >
            0
              ? "Ship placement"
              : "Configure a round"
          }
          description={
            pendingPlacementGames.length >
            0
              ? `${pendingPlacementGames.length} game(s) still require manual ship placement.`
              : "Choose a game and assign the number of attacks earned by each team."
          }
          actionLabel="View games"
          onAction={() => {
            document
              .getElementById(
                "game-list"
              )
              ?.scrollIntoView({
                behavior:
                  "smooth",
              });
          }}
        />

        <QuickActionCard
          title="Projector screen"
          description={
            activeGame
              ? `Continue the active attack phase for ${activeGame.name}.`
              : "Start a round before launching projector mode."
          }
          actionLabel="Launch projector"
          disabled={
            !activeGame
          }
          onAction={() => {
            if (activeGame) {
              handleLaunchProjector(
                activeGame
              );
            }
          }}
        />
      </section>

      {/* GAMES */}

      <Card
        id="game-list"
        className="mt-6"
      >
        <div className="flex flex-col gap-4 border-b border-zinc-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Games
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Manage ship
              placement, configure
              rounds and launch
              projector mode.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() =>
              navigate(
                "/admin/games/new"
              )
            }
          >
            New game
          </Button>
        </div>

        {games.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No games created"
              description="Create your first Attackship game and choose random or manual ship placement."
              action={
                <Button
                  variant="primary"
                  onClick={() =>
                    navigate(
                      "/admin/games/new"
                    )
                  }
                >
                  Create first
                  game
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {games.map(
              (game) => (
                <GameCard
                  key={
                    getGameId(
                      game
                    )
                  }
                  game={game}
                  onOpen={() =>
                    handleOpenGame(
                      game
                    )
                  }
                  onShipPlacement={() =>
                    handleShipPlacement(
                      game
                    )
                  }
                  onSetupRound={() =>
                    handleSetupRound(
                      game
                    )
                  }
                  onLaunchProjector={() =>
                    handleLaunchProjector(
                      game
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </Card>
    </AppShell>
  );
};

const QuickActionCard = ({
  title,
  description,
  actionLabel,
  onAction,
  disabled = false,
}) => {
  return (
    <Card className="flex min-h-52 flex-col">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-sm font-semibold text-cyan-400">
        →
      </div>

      <h2 className="mt-5 text-lg font-semibold text-white">
        {title}
      </h2>

      <p className="mt-2 flex-1 text-sm leading-6 text-zinc-500">
        {description}
      </p>

      <Button
        className="mt-5 w-full"
        disabled={disabled}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </Card>
  );
};

const GameCard = ({
  game,
  onOpen,
  onShipPlacement,
  onSetupRound,
  onLaunchProjector,
}) => {
  const state =
    game.phase ||
    game.status ||
    "setup";

  const isFinished =
    state === "finished";

  const isAttackPhase =
    state === "attack";

  const needsManualPlacement =
    game.placementMode ===
      "manual" &&
    !game.shipsPlaced;

  const canSetupRound =
    !isFinished &&
    !isAttackPhase &&
    !needsManualPlacement;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">
              {game.name}
            </h3>

            <p className="mt-1 text-xs text-zinc-600">
              Created{" "}
              {formatDate(
                game.createdAt
              )}
            </p>
          </div>

          <Badge
            variant={getStatusVariant(
              state
            )}
          >
            {needsManualPlacement
              ? "Ship setup"
              : formatStatus(
                  state
                )}
          </Badge>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <GameInfo
            label="Board"
            value={`${
              game.boardSize ||
              0
            } × ${
              game.boardSize ||
              0
            }`}
          />

          <GameInfo
            label="Round"
            value={`${
              game.currentRound ||
              0
            }/${
              game.totalRounds ||
              0
            }`}
          />

          <GameInfo
            label="Teams"
            value={
              Array.isArray(
                game.teams
              )
                ? game.teams
                    .length
                : 4
            }
          />

          <GameInfo
            label="Placement"
            value={
              game.placementMode ===
              "manual"
                ? "Manual"
                : "Random"
            }
          />
        </div>

        {needsManualPlacement && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-300">
            Complete all four
            hidden boards before
            configuring Round 1.
          </div>
        )}

        {Array.isArray(
          game.teams
        ) &&
          game.teams.length >
            0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {game.teams.map(
                (team) => (
                  <span
                    key={
                      team.id ||
                      team._id
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          team.color ||
                          "#71717a",
                      }}
                    />

                    {team.name}
                  </span>
                )
              )}
            </div>
          )}
      </div>

      <footer className="flex flex-wrap gap-2 border-t border-zinc-800 bg-zinc-900/50 p-4">
        <Button
          size="sm"
          onClick={onOpen}
        >
          Details
        </Button>

        {game.placementMode ===
          "manual" && (
          <Button
            size="sm"
            variant={
              needsManualPlacement
                ? "primary"
                : "secondary"
            }
            disabled={
              isAttackPhase ||
              isFinished
            }
            onClick={
              onShipPlacement
            }
          >
            {needsManualPlacement
              ? "Place ships"
              : "View ships"}
          </Button>
        )}

        <Button
          size="sm"
          variant="primary"
          disabled={
            !canSetupRound
          }
          onClick={
            onSetupRound
          }
        >
          Set up round
        </Button>

        <Button
          size="sm"
          variant={
            isAttackPhase
              ? "danger"
              : "secondary"
          }
          disabled={
            !isAttackPhase
          }
          onClick={
            onLaunchProjector
          }
        >
          Launch projector
        </Button>
      </footer>
    </article>
  );
};

const GameInfo = ({
  label,
  value,
}) => {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <p className="text-xs text-zinc-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-zinc-200">
        {value}
      </p>
    </div>
  );
};

export default AdminHome;