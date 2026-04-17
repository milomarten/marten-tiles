export type Point = [number, number];

/**
 * Some value with a certain amount of weight to it.
 * The weight is some number which represents how likely this value is.
 * It may be relative to some standard weight, or it may only be meaningful
 * when compared to other Weighted items.
 */
export type Weighted<T> = {
    value: T;
    weight: number;
};

/**
 * Utility class which represents either a pool of weighted, random items; or just one.
 * This allows for the tileset spec to support having multiple random options in a logical set, while also
 * easily supporting just having one basic option.
 * 
 * The contents can be resolved with pullWeighted, which will return a single T from the pool (if it is
 * a pool), or else returning just the one.
 */
export type WeightedOrSingle<T> = Weighted<T>[] | T;

/**
 * Unified methods of manipulating a 2D grid
 */
export interface Grid<T> {
    getItem(x: number, y: number): T | null;
    setItem(x: number, y: number, item: T): void;
    /**
     * Move the grid such that the supplied coordinate is the new origin.
     * The returned grid should be intrinsically tied to this one, such that changing it will change
     * this original Grid.
     * @param dx The X coordinate of the point to center on
     * @param dy The Y coordinate of the point to center on
     */
    centerOn(dx: number, dy: number): Grid<T>;
    /**
     * Move the grid such that the origin returns to absolute (0, 0)
     */
    centerOnOrigin(): Grid<T>;

    width: number;
    height: number;
}

/**
 * Basic 2D array. 
 * The top-left corner is (0, 0); all retrievals are relative to that point.
 * Retrievals that are out of bounds return null.
 */
export class CellMap<T> implements Grid<T> {
    private contents: T[];
    public readonly width: number;
    public readonly height: number;

    public constructor(width: number, height: number, defaultValue: T) {
        this.contents = new Array<T>(width * height)
        this.width = width;
        this.height = height;
        
        for (let i = 0; i < this.contents.length; i++) {
            this.contents[i] = defaultValue;
        }
    }

    private normalizeXYForWrap(x: number, y: number): [number, number] {
        if (x < 0) {
            x = this.width + x;
        }
        if (y < 0) {
            y = this.height + y;
        }
        return [x, y];
    }

    getItem(x: number, y: number): T | null {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return null;
        }
        return this.contents[y * this.width + x];
    }

    getItemWithWrap(x: number, y: number): T {
        [x, y] = this.normalizeXYForWrap(x, y);
        return this.contents[y * this.width + x];
    }

    setItem(x: number, y: number, item: T): void {
        this.contents[y * this.width + x] = item;
    }

    setItemWithWrap(x: number, y: number, item: T): void {
        [x, y] = this.normalizeXYForWrap(x, y);
        this.contents[y * this.width + x] = item;
    }

    centerOn(dx: number, dy: number): Grid<T> {
        return new CellMapOffset<T>(this, dx, dy);
    }

    centerOnOrigin(): Grid<T> {
        return this;
    }

    forEach(func: (x: number, y: number, item: T) => void): void {
        for (let i = 0; i < this.contents.length; i++) {
            const resolvedY = Math.floor(i / this.width);
            const resolvedX = i % this.width;
            func(resolvedX, resolvedY, this.contents[i])
        }
    }

    /**
     * Flood paint the cells, starting at some point.
     * Every cell with the same "color" as the starting point is affected; reaching a different
     * "color", or the edge, will cause the flood to stop moving in that direction.
     * Formally, this algorithm only floods up, down, left, and right. Thus, it will not cross diagonals.
     * @param start The starting point
     * @param paintWith The color to paint with.
     */
    flood(start: Point, paintWith: T): void {
        const toPaint: Point[] = [];
    
        toPaint.push(start);
        const startingColor = this.getItem(start[0], start[1])!;

        while (toPaint.length > 0) {
            const visiting = toPaint.pop()!;
            this.setItem(visiting[0], visiting[1], paintWith);
    
            const left: Point = [visiting[0]-1, visiting[1]];
            const right: Point = [visiting[0]+1, visiting[1]];
            const up: Point = [visiting[0], visiting[1]-1];
            const down: Point = [visiting[0], visiting[1]+1];
    
            if (this.getItem(left[0], left[1]) === startingColor) { toPaint.push(left); }
            if (this.getItem(right[0], right[1]) === startingColor) { toPaint.push(right); }
            if (this.getItem(up[0], up[1]) === startingColor) { toPaint.push(up); }
            if (this.getItem(down[0], down[1]) === startingColor) { toPaint.push(down); }
        }
    }
}

class CellMapOffset<T> implements Grid<T>{
    private map: CellMap<T>;
    private originX: number;
    private originY: number;

    public constructor(map: CellMap<T>, originX: number, originY: number) {
        this.map = map;
        this.originX = originX;
        this.originY = originY;
    }
    
    get width(): number {
        return this.map.width;
    }

    get height(): number {
        return this.map.height;
    }

    getItem(x: number, y: number): T | null {
        return this.map.getItem(x + this.originX, y + this.originY);
    }

    setItem(x: number, y: number, item: T): void {
        this.map.setItem(x + this.originX, y + this.originY, item);
    }

    centerOn(dx: number, dy: number): Grid<T> {
        return new CellMapOffset(this.map, this.originX + dx, this.originY + dy);
    }

    centerOnOrigin(): Grid<T> {
        return this.map;
    }
}

/**
 * Resolve a WeightedOrSingle instance into exactly one constituent.
 * If WeightedOrSingle is a pool of Weighted options, one is selected at random, respecting its
 * weight. If WeightedOrSingle is just one normal option, it is returned directly.
 * @param item The item to resolve
 * @returns An item from the pool
 */
export function pullWeighted<T>(item: WeightedOrSingle<T> ): T {
    if (Array.isArray(item)) {
        const roll = getTotalWeights(item) * Math.random();
        let counter = 0;
        for (const i of item) {
            if (roll >= counter && roll < counter + i.weight) {
                return i.value;
            } else {
                counter += i.weight;
            }
        }
        throw new Error("Reached unexpended end of weighted loop")
    } else {
        return item;
    }
}

function getTotalWeights<T>(items: Weighted<T>[]): number {
    return items
        .reduce((a, b) => a + b.weight, 0);
}