import { is, RuleBasedMapper, surroundings4 } from "./map-refiner.js";
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

/**
 * Generate a random integer between min and max
 * The return of this method will always be a whole number greater than or
 * equal to min, and strictly less than max. 
 * @param min The minimum value (incl)
 * @param max The maximum value (excl)
 * @returns A number, randomly generated, between min and max
 */
function random(min: number, max: number): number {
    return Math.floor(min + Math.random() * (max - min));
}

/**
 * An additional multiplicative factor fow how much the corners can vary.
 */
const CORNER_FACTOR = 1.2;
/**
 * An additional multiplicative factor for how far edge points can vary in their opposite direction.
 */
const EDGE_BIAS_FACTOR = 1.5;

/**
 * Generates a random map given the provided parameters.
 * The created map is a polygon with, at minimum, 4 points, with additional points added for bigger maps.
 * @param parameters 
 * @returns 
 */
export function createRandomMap(parameters: CreateParameters): CellMap<CellLevel1> {
    const map = new CellMap(parameters.width, parameters.height, CellLevel1.OBSTACLE);

    // Step 1: generate 4 random corners
    const tl: Point = [
        random(0, parameters.extremeness * CORNER_FACTOR), 
        random(0, parameters.extremeness * CORNER_FACTOR)
    ]; // TL
    const tr: Point = [
        random(parameters.width - 1 - parameters.extremeness * CORNER_FACTOR, parameters.width - 1), 
        random(0, parameters.extremeness * CORNER_FACTOR)
    ]; //TR
    const br: Point = [
        random(parameters.width - 1 - parameters.extremeness * CORNER_FACTOR, parameters.width - 1), 
        random(parameters.height - 1 - parameters.extremeness * CORNER_FACTOR, parameters.height - 1)
    ]; //BR
    const bl: Point = [
        random(0, parameters.extremeness * CORNER_FACTOR), 
        random(parameters.height - 1 - parameters.extremeness * CORNER_FACTOR, parameters.height - 1)
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
        alongLine(point, nextPoint, coords => map.setItem(coords[0], coords[1], CellLevel1.GROUND));
    })

    // The middle is almost certainly safe to paint at thie time.
    // to do: stronger initial fill algorithm
    map.flood(findFillStartPoint(map), CellLevel1.GROUND);

    return map;
}

/**
 * Clamp all points such that they are between (0, 0) and (width, height)
 * Input points is mutated
 * @param points The points to clamp
 * @param width The width of the map
 * @param height The height of the map
 */
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
        clamp(point[0], minX, maxX),
        clamp(point[1], minY, maxY)
    ]
}

/**
 * Create a point within some distance of an input point.
 * The generated point will be within ± extremeness on the centeredOn point, in X and Y directions.
 * If an edge is specified, the generated point may be twice the extremeness in the opposite direction. For example,
 * if "n" is provided, and extremeness is 1, the point's Y coordinate may range from -1 to +2. Conversely, if "s" is provided
 * for the same scenario, the point's Y coordinate may range from -2 to +1.
 * @param centeredOn The point to center on when generating this new point
 * @param extremeness The "radius" around centeredOn from which to pick the new point
 * @param edge A directional bias to change the size of the window in certain directions.
 * @returns A randomly generated point near this one.
 */
function createRandomNearbyPoint(centeredOn: Point, extremeness: number, edge?: "n" | "s" | "e" | "w"): Point {
    let dx, dy;
    const scale = function(value: number, desired: "n" | "s" | "e" | "w"): number {
        return Math.round(value * (edge == desired ? EDGE_BIAS_FACTOR : 1));
    };

    dx = random(scale(-extremeness, "s"), scale(extremeness, "n") + 1);
    dy = random(scale(-extremeness, "w"), scale(extremeness, "e") + 1);
    return [centeredOn[0] + dx, centeredOn[1] + dy];
}

/**
 * Split a line segment into multiple points, and varies those points randomly.
 * @param start The start point of the line segment
 * @param end The end point of the line segment
 * @param extremeness The "radius" around each point with which to move the point
 * @param edge A directional bias to change the size of the window in certain directions.
 * @returns A list of randomly generated points between start and end.
 */
function createRandomMidpoints(start: Point, end: Point, extremeness: number, edge?: "n" | "s" | "e" | "w"): Point[] {
    return getMidpoints(start, end)
        .map(mp => createRandomNearbyPoint(mp, extremeness, edge));
}

/**
 * Split this line segment into some number of segments.
 * Returns qty endpoints, equally spaced between start and end. If qty is
 * not provided, the algorithm will make its best effort to deduce based on
 * how far apart the points are.
 * @param start The starting point
 * @param end The ending point
 * @param qty The number of points to get
 * @returns A list of points, equally spaced between start and end
 */
function getMidpoints(start: Point, end: Point, qty?: number): Point[] {
    const points: Point[] = [];
    const inOrder = alongLine(start, end, (point) => points.push(point));
    if (!inOrder) {
        points.reverse();
    }

    if (!qty) {
        qty = Math.round(points.length / 15);
        if (qty == 0) { return []; }
    }

    const step = Math.round(points.length / (qty + 1));
    const returnPoints: Point[] = [];

    for (let i = 0; i < qty; i++) {
        returnPoints.push(points[step * (i + 1)])
    }

    return returnPoints;
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
 * @returns True if function went start -> end, false if end -> start
 */
export function alongLine(start: Point, end: Point, action: (coord: Point) => void): boolean {
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

/**
 * Order two points in ascending order, depending on a specified field
 * @param one The first point
 * @param two The second point
 * @param by 0 to compare using x, 1 to compare using y
 * @returns The two points, in ascending order
 */
function orderPoints(one: Point, two: Point, by: 0 | 1): [Point, Point] {
    if (one[by] <= two[by]) { return [one, two]; }
    else { return [two, one]; }
}

/**
 * Find the start point for the final fill operation.
 * At this time, it's assumed the center point of the grid is safe. This may be made to be more
 * intelligent later.
 * @param grid The grid
 * @returns The point to begin the fill process.
 */
function findFillStartPoint<T>(grid: CellMap<T>): Point {
    return [grid.width / 2, grid.height / 2];
}

/**
 * Modify the contents of each item in an array based on the surrounding items.
 * For each element in the array, func is applied with it, the element to its left, and
 * the element to its right. left and right will wrap around, when mid is the beginning or
 * end of the array. 
 * 
 * If the array is of length 2, left and right will be the same. If the array is length 1, all
 * three values will be the same.
 * 
 * The current element is replaced with whatever elements are returned from func(). Returning
 * an empty array will delete it, an array of one element will do a 1-to-1 replace, and an array of
 * two or more elements will add additional elements between mid and right. 
 * 
 * These additional elements may be modified in turn by subsequent iterations. As such, exercise
 * caution on returning arrays of length 2 or greater, since it could cause this array to grow infinitely.
 * 
 * contents is mutated when calling this method.
 * @param contents The contents to adjust
 * @param func The replacement function to apply
 */
function triWindowReplace<T>(contents: T[], func: (left: T, mid: T, right:T) => T[]): void {
    if (contents.length > 0) {
        for (let i = 0; i < contents.length; i++) {
            const left = i == 0 ? contents[contents.length - 1] : contents[i - 1];
            const right = contents[(i + 1) % contents.length];

            const replacements = func(left, contents[i], right);
            contents.splice(i, 1, ...replacements);
        }
    }
}