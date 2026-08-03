const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const shipConfigurations = {
  6: [
    {
      name: "Command Ship",
      size: 4,
    },
    {
      name: "Battleship",
      size: 3,
    },
    {
      name: "Patrol Ship",
      size: 2,
    },
    {
      name: "Scout Ship",
      size: 2,
    },
  ],

  8: [
    {
      name: "Command Ship",
      size: 5,
    },
    {
      name: "Battleship",
      size: 4,
    },
    {
      name: "Cruiser",
      size: 3,
    },
    {
      name: "Patrol Ship",
      size: 2,
    },
    {
      name: "Scout Ship",
      size: 2,
    },
  ],

  10: [
    {
      name: "Carrier",
      size: 5,
    },
    {
      name: "Command Ship",
      size: 4,
    },
    {
      name: "Battleship",
      size: 4,
    },
    {
      name: "Cruiser",
      size: 3,
    },
    {
      name: "Patrol Ship",
      size: 2,
    },
  ],
};

const getRandomInteger = (maximum) => {
  return Math.floor(Math.random() * maximum);
};

const createCoordinate = (row, column) => {
  return `${alphabet[row]}${column + 1}`;
};

const createShipCoordinates = ({
  startRow,
  startColumn,
  size,
  orientation,
}) => {
  const coordinates = [];

  for (let offset = 0; offset < size; offset += 1) {
    const row =
      orientation === "vertical"
        ? startRow + offset
        : startRow;

    const column =
      orientation === "horizontal"
        ? startColumn + offset
        : startColumn;

    coordinates.push(createCoordinate(row, column));
  }

  return coordinates;
};

const canPlaceShip = ({
  coordinates,
  occupiedCoordinates,
}) => {
  return coordinates.every(
    (coordinate) => !occupiedCoordinates.has(coordinate)
  );
};

const placeSingleShip = ({
  shipDefinition,
  boardSize,
  occupiedCoordinates,
}) => {
  const maximumAttempts = 1000;

  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    const orientation =
      Math.random() < 0.5 ? "horizontal" : "vertical";

    const maximumStartRow =
      orientation === "vertical"
        ? boardSize - shipDefinition.size
        : boardSize - 1;

    const maximumStartColumn =
      orientation === "horizontal"
        ? boardSize - shipDefinition.size
        : boardSize - 1;

    const startRow = getRandomInteger(maximumStartRow + 1);
    const startColumn = getRandomInteger(maximumStartColumn + 1);

    const coordinates = createShipCoordinates({
      startRow,
      startColumn,
      size: shipDefinition.size,
      orientation,
    });

    const placementIsValid = canPlaceShip({
      coordinates,
      occupiedCoordinates,
    });

    if (!placementIsValid) {
      continue;
    }

    coordinates.forEach((coordinate) => {
      occupiedCoordinates.add(coordinate);
    });

    return {
      name: shipDefinition.name,
      size: shipDefinition.size,
      orientation,
      coordinates,
      hits: [],
      sunk: false,
    };
  }

  throw new Error(
    `Could not place ${shipDefinition.name} after ${maximumAttempts} attempts.`
  );
};

export const generateShipLayout = (boardSize) => {
  const shipDefinitions = shipConfigurations[boardSize];

  if (!shipDefinitions) {
    throw new Error(
      `Unsupported board size: ${boardSize}.`
    );
  }

  const occupiedCoordinates = new Set();
  const ships = [];

  for (const shipDefinition of shipDefinitions) {
    const ship = placeSingleShip({
      shipDefinition,
      boardSize,
      occupiedCoordinates,
    });

    ships.push(ship);
  }

  return ships;
};

export const getShipConfiguration = (boardSize) => {
  const configuration = shipConfigurations[boardSize];

  if (!configuration) {
    throw new Error(
      `Unsupported board size: ${boardSize}.`
    );
  }

  return configuration.map((ship) => ({
    ...ship,
  }));
};