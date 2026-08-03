import api from "../utils/axios";

export const getProjectorState = async (
  gameId
) => {
  const { data } = await api.get(
    `/api/attacks/games/${gameId}/state`
  );

  return data;
};

export const attackCoordinate = async ({
  gameId,
  targetTeamId,
  coordinate,
}) => {
  const { data } = await api.post(
    `/api/attacks/games/${gameId}`,
    {
      targetTeamId,
      coordinate,
    }
  );

  return data;
};

export const skipTurn = async (gameId) => {
  const { data } = await api.post(
    `/api/attacks/games/${gameId}/skip`
  );

  return data;
};