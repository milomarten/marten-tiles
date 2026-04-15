import { CellLevel1 } from "./map-creator.js";
import { TileArea, TileId, Tileset } from "./tileset.js";
import { CellMap, Grid, pullWeighted, WeightedOrSingle } from "./utils.js";

export interface Parameters {
    tileset: Tileset;
}

export function refineMap(map: CellMap<CellLevel1>, params: Parameters): CellMap<TileId> {
    const outputMap = new CellMap(map.width, map.height, {tileX: 0, tileY: 0});
    for (let x = 0; x < map.width; x++) {
        for (let y = 0; y < map.width; y++) {
            const me = map.getItem(x, y) || CellLevel1.VOID;
            outputMap.setItem(
                x, y, determineTile(me, map.centerOn(x, y), determineOptions(me, params.tileset))
            )
        }
    }
    return outputMap;
}

function determineOptions(me: CellLevel1, tileset: Tileset): WeightedOrSingle<TileArea> {
    switch(me) {
        case CellLevel1.VOID: return tileset.base.void;
        case CellLevel1.GROUND: return tileset.base.ground;
        case CellLevel1.OBSTACLE: return tileset.base.obstacle;
        case CellLevel1.SEMI_OBSTACLE: return tileset.base.semiObstacle;
    }
}

function determineTile(me: CellLevel1, cell: Grid<CellLevel1>, opts: WeightedOrSingle<TileArea>): TileId {
    const select = pullWeighted(opts);
    if (select.type === "tile") {
        return select.tileId;
    } else {
        var surroundings = getSurroundingsMask(me, cell);
        if (select.type == "ninepatch") {
            // todo
            return select.tileId;
        } else {
            // todo
            return select.tileId;
        }
    }
}

function getSurroundingsMask(me: CellLevel1, surroundings: Grid<CellLevel1>): number {
    const matches = function(a: CellLevel1, x: number, y:number): boolean {
        return a == surroundings.getItem(x, y);
    }

    let returnValue = 0;
    returnValue += matches(me, -1, -1) ? 1 : 0;
    returnValue += matches(me, 0, -1) ? 2 : 0;
    returnValue += matches(me, 1, -1) ? 4 : 0;

    returnValue += matches(me, -1, 0) ? 8 : 0;
    returnValue += matches(me, 1, 0) ? 16 : 0;
    
    returnValue += matches(me, -1, 1) ? 32 : 0;
    returnValue += matches(me, 0, 1) ? 64 : 0;
    returnValue += matches(me, 1, 1) ? 128 : 0;

    return returnValue;
}