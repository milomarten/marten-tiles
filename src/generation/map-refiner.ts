import { CellMap, Grid } from "./utils.js";

export interface RulePredicate<T> {
    matches(grid: Grid<T>): boolean;
}

export interface Rule<T, U> {
    rule: RulePredicate<T>;
    value: U
}

export class RuleBasedMapper<T, U> {
    private rules: Rule<T, U>[];
    private defaultValue: U;

    public constructor(defaultValue: U, rules: Rule<T, U>[]) {
        this.rules = rules;
        this.defaultValue = defaultValue;
    }

    matchAndReturn(input: Grid<T>): U {
        const matched = this.rules.find(rule => rule.rule.matches(input));
        console.log(JSON.stringify(matched))
        return matched ? matched.value : this.defaultValue;
    }

    matchAll(input: CellMap<T>): CellMap<U> {
        var newGrid = new CellMap(input.width, input.height, this.defaultValue);
        input.forEach((x, y) => {
            const newItem = this.matchAndReturn(input.centerOn(x, y));
            newGrid.setItem(x, y, newItem);
        });
        return newGrid;
    }
}

export type SurroundingsMatch<T> = T | T[] | "*";

export function surroundings9<T>(
    topLeft: SurroundingsMatch<T>, topMiddle: SurroundingsMatch<T>, topRight: SurroundingsMatch<T>,
    middleLeft: SurroundingsMatch<T>, center: SurroundingsMatch<T>, middleRight: SurroundingsMatch<T>,
    bottomLeft: SurroundingsMatch<T>, bottomMiddle: SurroundingsMatch<T>, bottomRight: SurroundingsMatch<T>,
    oob: T
): RulePredicate<T> {
    const match = function(item: T, check: SurroundingsMatch<T>): boolean {
        if (check === "*") return true;
        else if (Array.isArray(check)) return check.includes(item);
        else return check === item;
    }

    const getFromGrid = function(grid: Grid<T>, x: number, y: number): T {
        return grid.getItem(x, y) || oob;
    }

    return {
        matches: function (grid: Grid<T>): boolean {
            return match(getFromGrid(grid, -1, -1), topLeft) &&
            match(getFromGrid(grid, 0, -1), topMiddle) &&
            match(getFromGrid(grid, 1, -1), topRight) &&
            match(getFromGrid(grid, -1, 0), middleLeft) &&
            match(getFromGrid(grid, 0, 0), center) &&
            match(getFromGrid(grid, 0, 1), middleRight) &&
            match(getFromGrid(grid, -1, 1), bottomLeft) &&
            match(getFromGrid(grid, 0, 1), bottomMiddle) &&
            match(getFromGrid(grid, 1, 1), bottomRight)
        }
    }
}

export function surroundings4<T>(
    top: SurroundingsMatch<T>, left: SurroundingsMatch<T>, center: SurroundingsMatch<T>, bottom: SurroundingsMatch<T>, right: SurroundingsMatch<T>,
    oob: T
): RulePredicate<T> {
    const match = function(item: T, check: SurroundingsMatch<T>): boolean {
        if (check === "*") return true;
        else if (Array.isArray(check)) return check.includes(item);
        else return check === item;
    }

    const getFromGrid = function(grid: Grid<T>, x: number, y: number): T {
        const found = grid.getItem(x, y);
        return found == null ? oob : found;
    }

    return {
        matches: function (grid: Grid<T>): boolean {
            return match(getFromGrid(grid, 0, -1), top) &&
            match(getFromGrid(grid, -1, 0), left) &&
            match(getFromGrid(grid, 0, 0), center) &&
            match(getFromGrid(grid, 1, 0), right) &&
            match(getFromGrid(grid, 0, 1), bottom)
        }
    }
}

export function is<T>(value: T) {
    return {
        matches: function(grid: Grid<T>): boolean {
            return grid.getItem(0, 0) == value;
        }
    }
}