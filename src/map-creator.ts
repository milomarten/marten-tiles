import { CellMap } from "./utils.js"

export enum CellLevel1 {
    VOID, // Represents the nothingness. Nothing should be able to travel on the void.
          // Strictly speaking, the void is an obstacle, but it is more convenient to have them separate.
    GROUND, // Represents the navigable area, where players can move.
    OBSTACLE, // Represents an obstacle, something the players can't move, i.e. a rock or a wall.
    SEMI_OBSTACLE // Represents a conditional obstacle, i.e a chasm or pool of water.
}

export interface Parameters {
    width: number;
    height: number;
}

export function createRandomMap(parameters: Parameters): CellMap<CellLevel1> {
    return new CellMap(parameters.width, parameters.height, CellLevel1.VOID);
}