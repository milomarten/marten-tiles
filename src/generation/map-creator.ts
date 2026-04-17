import { CellMap, Point } from "./utils.js"

export enum CellLevel1 {
    GROUND, // Represents the navigable area, where players can move.
    OBSTACLE, // Represents an obstacle, something the players can't move, i.e. a rock or a wall.
}

export interface CreateParameters {
    width: number;
    height: number;
    margin: number
    extremeness: number;
}

function random(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min));
}

export function createRandomMap(parameters: CreateParameters): CellMap<CellLevel1> {
    const map = new CellMap(parameters.width, parameters.height, CellLevel1.OBSTACLE);

    // Step 1: generate 4 random corners
    const tl: Point = [
        random(0, parameters.extremeness), 
        random(0, parameters.extremeness)
    ]; // TL
    const tr: Point = [
        random(parameters.width - 1 - parameters.extremeness, parameters.width - 1), 
        random(0, parameters.extremeness)
    ]; //TR
    const br: Point = [
        random(parameters.width - 1 - parameters.extremeness, parameters.width - 1), 
        random(parameters.height - 1 - parameters.extremeness, parameters.height - 1)
    ]; //BR
    const bl: Point = [
        random(0, parameters.extremeness), 
        random(parameters.height - 1 - parameters.extremeness, parameters.height - 1)
    ]; //BL
    const corners: Point[] = [
        tl, 
        ...createRandomMidpoints(tl, tr, parameters.extremeness, "n"), 
        tr, 
        ...createRandomMidpoints(tr, br, parameters.extremeness, "e"),
        br, 
        ...createRandomMidpoints(br, bl, parameters.extremeness, "s"),
        bl,
        ...createRandomMidpoints(bl, tl, parameters.extremeness, "w"),
    ];

    clampPoints(corners, parameters.width, parameters.height);
    
    // Step 2: connect the corners
    corners.forEach((point, idx, points) => {
        const nextPoint = points[(idx + 1) % points.length];
        console.log(point, nextPoint);
        alongLine(point, nextPoint, coords => map.setItem(coords[0], coords[1], CellLevel1.GROUND));
    })

    // Paint the middle
    map.flood(findFillStartPoint(map), CellLevel1.GROUND);

    return map;
}

function clampPoints(points: Point[], width: number, height: number) {
    const maxX = width - 1;
    const maxY = height - 1;
    points.forEach(point => {
        const clamped = clampPoint(point, 0, maxX, 0, maxY);
        point[0] = clamped[0];
        point[1] = clamped[1];
    })
}

function clamp(n: number, min: number, max: number): number {
    if (n < min) return min;
    if (n > max) return max;
    return n;
}

function clampPoint(point: Point, minX: number, maxX: number, minY: number, maxY: number): Point {
    return [
        clamp(point[0], 0, maxX),
        clamp(point[1], 0, maxY)
    ]
}

function createRandomCorner(centeredOn: Point, extremeness: number, edge: "n" | "s" | "e" | "w"): Point {
    let dx, dy;
    const scale = function(desired: "n" | "s" | "e" | "w"): number {
        return edge == desired ? 2 : 1;
    };

    dx = random(-extremeness * scale("s"), extremeness * scale("n") + 1);
    dy = random(-extremeness * scale("w"), extremeness * scale("e") + 1);
    return [centeredOn[0] + dx, centeredOn[1] + dy];
}

function createRandomMidpoints(start: Point, end: Point, extremeness: number, edge: "n" | "s" | "e" | "w"): Point[] {
    return getMidpoints(start, end)
        .map(mp => createRandomCorner(mp, extremeness, edge));
}

/**
 * Traverse a line discretely between two points.
 * For near-horizontal lines (less than or equal to 45 degrees), X increases by 1 each time, and Y is computed from that X. 
 * For near-vertical lines (greater than 45 degrees), Y increases by 1 each step, and X is computed from that Y.
 * Fully-vertical lines are supported as well, purely by iteration.
 * 
 * Iteration may go from end to start, or start to end, depending on convenience. For near-horizontal lines, iteration will
 * always travel in increasing X. For near-vertical lines, iteration will always travel in increasing Y.
 * @param start The starting point
 * @param end The ending point
 * @param action The action to perform for each step on the line
 */
function alongLine(start: Point, end: Point, action: (coord: Point) => void): boolean {
    const original = action;
    action = (coord: Point) => {
        // console.log(coord);
        original(coord);
    }
    console.log(start, end);
    if (end[0] == start[0]) {
        const [startY, endY] = [Math.min(start[1], end[1]), Math.max(start[1], end[1])];
        for (let y = startY; y <= endY; y++) {
            action([start[0], y]);
        }
        return startY == start[1];
    } else {
        const slope = (end[1] - start[1]) / (end[0] - start[0]);

        if (slope >= -1 && slope <= 1) {
            const [startByX, endByX] = orderPoints(start, end, 0);
            for (let x = startByX[0]; x <= endByX[0]; x++) {
                // (y-y1) = m(x - x1) -> y = m(x - x1) + y1
                const y = slope * (x - startByX[0]) + startByX[1];
                action([x, Math.round(y)]);
            }
            return startByX == start;
        } else {
            const [startByY, endByY] = orderPoints(start, end, 1);
            for (let y = startByY[1]; y <= endByY[1]; y++) {
                //  m(x - x1) = (y-y1) -> x = (y-y1)/m + x1
                const x = ((y - startByY[1]) / slope) + startByY[0];
                action([Math.round(x), y]);
            }
            return startByY == start;
        }
    }
}

function orderPoints(one: Point, two: Point, by: 0 | 1): [Point, Point] {
    if (one[by] <= two[by]) { return [one, two]; }
    else { return [two, one]; }
}

function getMidpoints(start: Point, end: Point, qty?: number): Point[] {
    const points: Point[] = [];
    const inOrder = alongLine(start, end, (point) => points.push(point));
    if (!inOrder) {
        points.reverse();
    }

    if (!qty) {
        qty = Math.round(points.length / 20);
        if (qty == 0) { return []; }
    }
    
    console.log("requested", qty, "endpoints between", start, "and", end);

    const step = Math.round(points.length / (qty + 1));
    const returnPoints: Point[] = [];

    for (let i = 0; i < qty; i++) {
        returnPoints.push(points[step * (i + 1)])
    }
    console.log(returnPoints);
    return returnPoints;
}

function findFillStartPoint<T>(grid: CellMap<T>): Point {
    return [grid.width / 2, grid.height / 2];
}