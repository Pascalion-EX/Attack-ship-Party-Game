export const generateAlternatingTurnQueue = (teamAttackEntries) => {
  if (!Array.isArray(teamAttackEntries)) {
    throw new Error("Team attack entries must be an array.");
  }

  const normalizedEntries = teamAttackEntries.map((entry) => ({
    teamId: String(entry.teamId),
    attacksRemaining: Number(entry.attacks),
    turnPosition: Number(entry.turnPosition ?? 0),
  }));

  for (const entry of normalizedEntries) {
    if (!entry.teamId) {
      throw new Error("Every attack entry requires a team ID.");
    }

    if (
      !Number.isInteger(entry.attacksRemaining) ||
      entry.attacksRemaining < 0
    ) {
      throw new Error("Attacks must be non-negative whole numbers.");
    }
  }

  normalizedEntries.sort(
    (first, second) => first.turnPosition - second.turnPosition
  );

  const queue = [];

  let attacksStillAvailable = true;

  while (attacksStillAvailable) {
    attacksStillAvailable = false;

    for (const entry of normalizedEntries) {
      if (entry.attacksRemaining > 0) {
        queue.push(entry.teamId);
        entry.attacksRemaining -= 1;
        attacksStillAvailable = true;
      }
    }
  }

  return queue;
};