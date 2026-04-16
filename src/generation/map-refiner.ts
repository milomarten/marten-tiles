import { Grid } from "./utils.js";

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
        return matched?.value || this.defaultValue;
    }
}

export type SurroundingsMatch<T> = T | T[] | "*";

export function surroundings<T>(
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