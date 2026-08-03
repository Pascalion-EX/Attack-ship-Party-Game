import api from "../utils/axios";

export const createGame = async (gameData) => {
  const { data } = await api.post(
    "/api/games",
    gameData
  );

  return data;
};

export const getGames = async () => {
  const { data } = await api.get("/api/games");

  return data;
};

export const getGameById = async (gameId) => {
  const { data } = await api.get(
    `/api/games/${gameId}`
  );

  return data;
};

export const getPublicBoards = async (gameId) => {
  const { data } = await api.get(
    `/api/games/${gameId}/public-boards`
  );

  return data;
};