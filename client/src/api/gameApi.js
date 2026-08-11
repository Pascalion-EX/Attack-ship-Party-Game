import api from "../utils/axios.js";

export const createGame = async (gameData) => {
  const { data } = await api.post(
    "/api/games",
    gameData
  );

  return data;
};

export const getGames = async () => {
  const { data } = await api.get(
    "/api/games"
  );

  return data;
};

export const getGameById = async (
  gameId
) => {
  const { data } = await api.get(
    `/api/games/${gameId}`
  );

  return data;
};

export const getPublicBoards = async (
  gameId
) => {
  const { data } = await api.get(
    `/api/games/${gameId}/public-boards`
  );

  return data;
};

/*
 * Returns the hidden board for one team.
 *
 * Admin-only.
 */
export const getManualBoard = async (
  gameId,
  teamId
) => {
  const { data } = await api.get(
    `/api/games/${gameId}/teams/${teamId}/board`
  );

  return data;
};

/*
 * Save all ships for one team's board.
 */
export const saveManualBoard = async ({
  gameId,
  teamId,
  ships,
}) => {
  const { data } = await api.put(
    `/api/games/${gameId}/teams/${teamId}/board`,
    {
      ships,
    }
  );

  return data;
};

/*
 * Used by the manual placement page
 * to determine how many teams are complete.
 */
export const getPlacementStatus = async (
  gameId
) => {
  const { data } = await api.get(
    `/api/games/${gameId}/placement-status`
  );

  return data;
};