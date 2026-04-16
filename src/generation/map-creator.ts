import { CellMap, Point } from "./utils.js"

export enum CellLevel1 {
    GROUND, // Represents the navigable area, where players can move.
    OBSTACLE, // Represents an obstacle, something the players can't move, i.e. a rock or a wall.
}

export interface CreateParameters {
    width: number;
    height: number;
}

function random(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min));
}

export function createRandomMap(parameters: CreateParameters): CellMap<CellLevel1> {
    const map = new CellMap(parameters.width, parameters.height, CellLevel1.OBSTACLE);

    const corners: Point[] = [];
    // Step 1: generate 4 random corners
    corners.push([random(1, 4), random(1, 4)]); // TL
    corners.push([random(parameters.width - 5, parameters.width - 2), random(1, 4)]); //TR
    corners.push([random(1, 4), random(parameters.height - 5, parameters.height - 2)]); //BL
    corners.push([random(parameters.width - 5, parameters.width - 2), random(parameters.height - 5, parameters.height - 2)]); //BR
    
    // Step 2: connect the corners
    alongHorizontalishLine(corners[0], corners[1], coords => map.setItem(coords[0], coords[1], CellLevel1.GROUND));
    alongHorizontalishLine(corners[2], corners[3], coords => map.setItem(coords[0], coords[1], CellLevel1.GROUND));
    alongVerticalishLine(corners[0], corners[2], coords => map.setItem(coords[0], coords[1], CellLevel1.GROUND));
    alongVerticalishLine(corners[1], corners[3], coords => map.setItem(coords[0], coords[1], CellLevel1.GROUND));

    // Paint the middle
    map.flood([parameters.width / 2, parameters.height / 2], CellLevel1.GROUND);

    return map;
}

// suitable for lines that don't have large jumps in y (angles <= 45 degrees)
// misusing this is a great way to have gaps in your map.
export function alongHorizontalishLine(start: Point, end: Point, action: (coord: Point) => void) : void {
    const slope = (end[1] - start[1]) / (end[0] - start[0]);
    const yIntercept = start[1];

    for (let x = start[0]; x <= end[0]; x++) {
        const y = (x * slope) + yIntercept;
        action([x, Math.round(y)]);
    }
}

// suitable for lines that don't have large jumps in x (angles >= 45 degrees)
// misusing this is a great way to have gaps in your map.
export function alongVerticalishLine(start: Point, end: Point, action: (coord: Point) => void) : void {
    if (end[0] == start[0]) {
        for (let y = start[1]; y <= end[1]; y++) {
            action([start[0], y]);
        }
    } else {
        const slope = (end[1] - start[1]) / (end[0] - start[0]);
        const yIntercept = start[1];

        for (let y = start[1]; y <= end[1]; y++) {
            const x = ((y - yIntercept) / slope) + start[0];
            action([Math.round(x), y]);
        }
    }
}