import api from "../utils/axios.js";

export const setupRound = async ({
  gameId,
  attackEntries,
}) => {
  const { data } = await api.post(
    `/api/rounds/games/${gameId}/setup`,
    {
      attackEntries,
    }
  );

  return data;
};

export const startRound = async (gameId) => {
  const { data } = await api.post(
    `/api/rounds/games/${gameId}/start`
  );

  return data;
};