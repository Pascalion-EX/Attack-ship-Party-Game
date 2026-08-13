import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { createGame } from "../api/gameApi.js";

const defaultTeams = [
  {
    name: "Red Team",
    color: "#ef4444",
  },
  {
    name: "Blue Team",
    color: "#3b82f6",
  },
  {
    name: "Green Team",
    color: "#22c55e",
  },
  {
    name: "Yellow Team",
    color: "#eab308",
  },
];

const CreateGame = () => {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      name: "",
      boardSize: 6,
      totalRounds: 6,
      turnDurationSeconds: 60,

      placementMode: "random",

      scoreRules: {
        hitPoints: 10,
        sunkPoints: 20,
        finalShipPoints: 40,
      },

      teams: defaultTeams,
    });

  const [submitting, setSubmitting] =
    useState(false);

  const handleBasicChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,

      [name]:
        name === "name"
          ? value
          : Number(value),
    }));
  };

  const handleScoreRuleChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,

      scoreRules: {
        ...previous.scoreRules,
        [name]: Number(value),
      },
    }));
  };

  const handleTeamChange = (
    teamIndex,
    field,
    value
  ) => {
    setFormData((previous) => {
      const updatedTeams =
        previous.teams.map(
          (team, index) => {
            if (
              index !== teamIndex
            ) {
              return team;
            }

            return {
              ...team,
              [field]: value,
            };
          }
        );

      return {
        ...previous,
        teams: updatedTeams,
      };
    });
  };

  const selectPlacementMode = (
    placementMode
  ) => {
    setFormData((previous) => ({
      ...previous,
      placementMode,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Enter a game name.";
    }

    const teamNames =
      formData.teams.map((team) =>
        team.name
          .trim()
          .toLowerCase()
      );

    if (
      teamNames.some(
        (name) => !name
      )
    ) {
      return "Every team must have a name.";
    }

    if (
      new Set(teamNames).size !==
      4
    ) {
      return "Every team must have a unique name.";
    }

    return null;
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const data = await createGame({
        ...formData,

        name:
          formData.name.trim(),

        teams:
          formData.teams.map(
            (team) => ({
              name:
                team.name.trim(),

              color:
                team.color,
            })
          ),
      });

      toast.success(
        data.message ||
          "Game created successfully."
      );

      /*
       * Manual games go directly to
       * ship placement.
       */
      if (
        formData.placementMode ===
        "manual"
      ) {
        navigate(
          `/admin/games/${data.game.id}/ships`,
          {
            replace: true,
          }
        );

        return;
      }

      /*
       * Random games behave like before.
       */
      navigate(
        `/admin/games/${data.game.id}`,
        {
          replace: true,

          state: {
            createdGame:
              data.game,

            fleet:
              data.fleet,
          },
        }
      );
    } catch (error) {
      toast.error(
        error.response?.data
          ?.message ||
          error.message ||
          "Could not create game."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Attackship
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Create Game
          </h1>

          <p className="mt-2 text-slate-400">
            Configure the game,
            teams and hidden ship
            boards.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* GENERAL SETTINGS */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              General settings
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Game name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={
                    formData.name
                  }
                  onChange={
                    handleBasicChange
                  }
                  placeholder="Camp Attackship 2026"
                  disabled={
                    submitting
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-500"
                />
              </div>

              <div>
                <label
                  htmlFor="boardSize"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Board size
                </label>

                <select
                  id="boardSize"
                  name="boardSize"
                  value={
                    formData.boardSize
                  }
                  onChange={
                    handleBasicChange
                  }
                  disabled={
                    submitting
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                >
                  <option value={6}>
                    6 × 6
                  </option>

                  <option value={8}>
                    8 × 8
                  </option>

                  <option value={10}>
                    10 × 10
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="totalRounds"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Total rounds
                </label>

                <input
                  id="totalRounds"
                  name="totalRounds"
                  type="number"
                  min="1"
                  max="5000"
                  value={
                    formData.totalRounds
                  }
                  onChange={
                    handleBasicChange
                  }
                  disabled={
                    submitting
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label
                  htmlFor="turnDurationSeconds"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Turn duration in
                  seconds
                </label>

                <input
                  id="turnDurationSeconds"
                  name="turnDurationSeconds"
                  type="number"
                  min="10"
                  max="3600"
                  value={
                    formData.turnDurationSeconds
                  }
                  onChange={
                    handleBasicChange
                  }
                  disabled={
                    submitting
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </section>

          {/* SHIP PLACEMENT MODE */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Ship placement
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Choose how the hidden
              ships will be positioned
              for the four teams.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                disabled={
                  submitting
                }
                onClick={() =>
                  selectPlacementMode(
                    "random"
                  )
                }
                className={`rounded-2xl border p-5 text-left transition ${
                  formData.placementMode ===
                  "random"
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-slate-700 bg-slate-950 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    Random placement
                  </div>

                  <div
                    className={`h-4 w-4 rounded-full border ${
                      formData.placementMode ===
                      "random"
                        ? "border-cyan-400 bg-cyan-400"
                        : "border-slate-600"
                    }`}
                  />
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Attackship
                  automatically
                  generates a hidden
                  fleet for every
                  team.
                </p>
              </button>

              <button
                type="button"
                disabled={
                  submitting
                }
                onClick={() =>
                  selectPlacementMode(
                    "manual"
                  )
                }
                className={`rounded-2xl border p-5 text-left transition ${
                  formData.placementMode ===
                  "manual"
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-slate-700 bg-slate-950 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    Manual placement
                  </div>

                  <div
                    className={`h-4 w-4 rounded-full border ${
                      formData.placementMode ===
                      "manual"
                        ? "border-cyan-400 bg-cyan-400"
                        : "border-slate-600"
                    }`}
                  />
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Place every ship
                  manually on each
                  team's hidden
                  board.
                </p>
              </button>
            </div>
          </section>

          {/* TEAMS */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Teams
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {formData.teams.map(
                (team, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={
                          team.color
                        }
                        onChange={(
                          event
                        ) =>
                          handleTeamChange(
                            index,
                            "color",
                            event
                              .target
                              .value
                          )
                        }
                        disabled={
                          submitting
                        }
                        className="h-12 w-14 cursor-pointer rounded border-0 bg-transparent"
                        aria-label={`Team ${
                          index +
                          1
                        } color`}
                      />

                      <div className="flex-1">
                        <label
                          htmlFor={`team-${index}`}
                          className="mb-2 block text-sm font-medium text-slate-300"
                        >
                          Team{" "}
                          {index +
                            1}
                        </label>

                        <input
                          id={`team-${index}`}
                          type="text"
                          value={
                            team.name
                          }
                          onChange={(
                            event
                          ) =>
                            handleTeamChange(
                              index,
                              "name",
                              event
                                .target
                                .value
                            )
                          }
                          disabled={
                            submitting
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* SCORING */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Scoring
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <div>
                <label
                  htmlFor="hitPoints"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Points per hit
                </label>

                <input
                  id="hitPoints"
                  name="hitPoints"
                  type="number"
                  min="0"
                  value={
                    formData.scoreRules
                      .hitPoints
                  }
                  onChange={
                    handleScoreRuleChange
                  }
                  disabled={
                    submitting
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label
                  htmlFor="sunkPoints"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Sunk ship bonus
                </label>

                <input
                  id="sunkPoints"
                  name="sunkPoints"
                  type="number"
                  min="0"
                  value={
                    formData.scoreRules
                      .sunkPoints
                  }
                  onChange={
                    handleScoreRuleChange
                  }
                  disabled={
                    submitting
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label
                  htmlFor="finalShipPoints"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Final ship bonus
                </label>

                <input
                  id="finalShipPoints"
                  name="finalShipPoints"
                  type="number"
                  min="0"
                  value={
                    formData.scoreRules
                      .finalShipPoints
                  }
                  onChange={
                    handleScoreRuleChange
                  }
                  disabled={
                    submitting
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </section>

          {/* BUTTONS */}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              disabled={
                submitting
              }
              className="rounded-xl border border-slate-700 px-5 py-3 font-medium transition hover:bg-slate-800 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Creating game..."
                : formData.placementMode ===
                    "manual"
                  ? "Create & place ships"
                  : "Create game"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default CreateGame;