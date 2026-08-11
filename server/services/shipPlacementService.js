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

  for (
    let offset = 0;
    offset < size;
    offset += 1
  ) {
    const row =
      orientation === "vertical"
        ? startRow + offset
        : startRow;

    const column =
      orientation === "horizontal"
        ? startColumn + offset
        : startColumn;

    coordinates.push(
      createCoordinate(row, column)
    );
  }

  return coordinates;
};

const canPlaceShip = ({
  coordinates,
  occupiedCoordinates,
}) => {
  return coordinates.every(
    (coordinate) =>
      !occupiedCoordinates.has(
        coordinate
      )
  );
};

const placeSingleShip = ({
  shipDefinition,
  boardSize,
  occupiedCoordinates,
}) => {
  const maximumAttempts = 1000;

  for (
    let attempt = 0;
    attempt < maximumAttempts;
    attempt += 1
  ) {
    const orientation =
      Math.random() < 0.5
        ? "horizontal"
        : "vertical";

    const maximumStartRow =
      orientation === "vertical"
        ? boardSize -
          shipDefinition.size
        : boardSize - 1;

    const maximumStartColumn =
      orientation === "horizontal"
        ? boardSize -
          shipDefinition.size
        : boardSize - 1;

    const startRow =
      getRandomInteger(
        maximumStartRow + 1
      );

    const startColumn =
      getRandomInteger(
        maximumStartColumn + 1
      );

    const coordinates =
      createShipCoordinates({
        startRow,
        startColumn,
        size: shipDefinition.size,
        orientation,
      });

    const placementIsValid =
      canPlaceShip({
        coordinates,
        occupiedCoordinates,
      });

    if (!placementIsValid) {
      continue;
    }

    coordinates.forEach(
      (coordinate) => {
        occupiedCoordinates.add(
          coordinate
        );
      }
    );

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

export const generateShipLayout = (
  boardSize
) => {
  const shipDefinitions =
    shipConfigurations[boardSize];

  if (!shipDefinitions) {
    throw new Error(
      `Unsupported board size: ${boardSize}.`
    );
  }

  const occupiedCoordinates =
    new Set();

  const ships = [];

  for (
    const shipDefinition of
    shipDefinitions
  ) {
    const ship =
      placeSingleShip({
        shipDefinition,
        boardSize,
        occupiedCoordinates,
      });

    ships.push(ship);
  }

  return ships;
};

export const getShipConfiguration = (
  boardSize
) => {
  const configuration =
    shipConfigurations[boardSize];

  if (!configuration) {
    throw new Error(
      `Unsupported board size: ${boardSize}.`
    );
  }

  return configuration.map(
    (ship) => ({
      ...ship,
    })
  );
};

export const validateManualShipLayout = ({
  boardSize,
  ships,
}) => {
  const expectedShips =
    getShipConfiguration(boardSize);

  if (!Array.isArray(ships)) {
    throw new Error(
      "Ships are required."
    );
  }

  if (
    ships.length !==
    expectedShips.length
  ) {
    throw new Error(
      `Exactly ${expectedShips.length} ships are required.`
    );
  }

  const occupiedCoordinates =
    new Set();

  const normalizedShips =
    ships.map(
      (ship, index) => {
        const expectedShip =
          expectedShips[index];

        if (!ship) {
          throw new Error(
            `Placement for ${expectedShip.name} is missing.`
          );
        }

        if (
          ship.name !==
          expectedShip.name
        ) {
          throw new Error(
            `Expected ${expectedShip.name}.`
          );
        }

        if (
          Number(ship.size) !==
          expectedShip.size
        ) {
          throw new Error(
            `${expectedShip.name} must have size ${expectedShip.size}.`
          );
        }

        if (
          ship.orientation !==
            "horizontal" &&
          ship.orientation !==
            "vertical"
        ) {
          throw new Error(
            `Invalid orientation for ${expectedShip.name}.`
          );
        }

        if (
          !Array.isArray(
            ship.coordinates
          ) ||
          ship.coordinates.length !==
            expectedShip.size
        ) {
          throw new Error(
            `${expectedShip.name} must occupy ${expectedShip.size} cells.`
          );
        }

        const coordinates =
          ship.coordinates.map(
            (coordinate) =>
              String(
                coordinate
              )
                .trim()
                .toUpperCase()
          );

        const parsedCoordinates =
          coordinates.map(
            (coordinate) => {
              const match =
                coordinate.match(
                  /^([A-Z])(\d+)$/
                );

              if (!match) {
                throw new Error(
                  `Invalid coordinate ${coordinate}.`
                );
              }

              const row =
                match[1].charCodeAt(
                  0
                ) -
                "A".charCodeAt(
                  0
                );

              const column =
                Number(
                  match[2]
                ) - 1;

              if (
                row < 0 ||
                row >=
                  boardSize ||
                column < 0 ||
                column >=
                  boardSize
              ) {
                throw new Error(
                  `${coordinate} is outside the board.`
                );
              }

              return {
                coordinate,
                row,
                column,
              };
            }
          );

        /*
         * Check that the ship is straight
         * and continuous.
         */
        if (
          ship.orientation ===
          "horizontal"
        ) {
          const row =
            parsedCoordinates[0]
              .row;

          if (
            !parsedCoordinates.every(
              (cell) =>
                cell.row ===
                row
            )
          ) {
            throw new Error(
              `${expectedShip.name} must be horizontal.`
            );
          }

          const columns =
            parsedCoordinates
              .map(
                (cell) =>
                  cell.column
              )
              .sort(
                (a, b) =>
                  a - b
              );

          for (
            let i = 1;
            i < columns.length;
            i += 1
          ) {
            if (
              columns[i] !==
              columns[i - 1] +
                1
            ) {
              throw new Error(
                `${expectedShip.name} cells must be continuous.`
              );
            }
          }
        } else {
          const column =
            parsedCoordinates[0]
              .column;

          if (
            !parsedCoordinates.every(
              (cell) =>
                cell.column ===
                column
            )
          ) {
            throw new Error(
              `${expectedShip.name} must be vertical.`
            );
          }

          const rows =
            parsedCoordinates
              .map(
                (cell) =>
                  cell.row
              )
              .sort(
                (a, b) =>
                  a - b
              );

          for (
            let i = 1;
            i < rows.length;
            i += 1
          ) {
            if (
              rows[i] !==
              rows[i - 1] + 1
            ) {
              throw new Error(
                `${expectedShip.name} cells must be continuous.`
              );
            }
          }
        }

        /*
         * Check for overlapping ships.
         */
        for (
          const coordinate of
          coordinates
        ) {
          if (
            occupiedCoordinates.has(
              coordinate
            )
          ) {
            throw new Error(
              `Ships cannot overlap at ${coordinate}.`
            );
          }

          occupiedCoordinates.add(
            coordinate
          );
        }

        return {
          name:
            expectedShip.name,

          size:
            expectedShip.size,

          orientation:
            ship.orientation,

          coordinates,

          hits: [],

          sunk: false,
        };
      }
    );

  return normalizedShips;
};