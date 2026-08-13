export const generateAlternatingTurnQueue = (teamAttackEntries) => {
  if (!Array.isArray(teamAttackEntries)) {
    throw new Error("Team attack entries must be an array.");
  }

  const normalizedEntries = teamAttackEntries.map((entry) => ({
    teamId: String(entry.teamId),
    attacks: Number(entry.attacks),
    turnPosition: Number(entry.turnPosition ?? 0),
  }));

  for (const entry of normalizedEntries) {
    if (!entry.teamId) {
      throw new Error("Every attack entry requires a team ID.");
    }

    if (
      !Number.isInteger(entry.attacks) ||
      entry.attacks < 0
    ) {
      throw new Error(
        "Attacks must be non-negative whole numbers."
      );
    }

    if (entry.attacks > 3) {
      throw new Error(
        "A team cannot receive more than 3 attacks per round."
      );
    }
  }

  normalizedEntries.sort(
    (first, second) =>
      first.turnPosition - second.turnPosition
  );

  const queue = [];

  /*
   * Put all attacks for one team together.
   *
   * Example:
   *
   * Red = 3
   * Blue = 2
   * Green = 1
   * Yellow = 2
   *
   * Queue:
   * Red, Red, Red,
   * Blue, Blue,
   * Green,
   * Yellow, Yellow
   */
  for (const entry of normalizedEntries) {
    for (
      let attackNumber = 0;
      attackNumber < entry.attacks;
      attackNumber += 1
    ) {
      queue.push(entry.teamId);
    }
  }

  return queue;
};
