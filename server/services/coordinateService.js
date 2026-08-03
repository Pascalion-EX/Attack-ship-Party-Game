const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const normalizeCoordinate = (coordinate) => {
  return String(coordinate || "")
    .trim()
    .toUpperCase();
};

export const isCoordinateValid = ({
  coordinate,
  boardSize,
}) => {
  const normalizedCoordinate =
    normalizeCoordinate(coordinate);

  const match =
    normalizedCoordinate.match(/^([A-Z])(\d+)$/);

  if (!match) {
    return false;
  }

  const rowLetter = match[1];
  const columnNumber = Number(match[2]);

  const rowIndex = alphabet.indexOf(rowLetter);

  return (
    rowIndex >= 0 &&
    rowIndex < boardSize &&
    Number.isInteger(columnNumber) &&
    columnNumber >= 1 &&
    columnNumber <= boardSize
  );
};