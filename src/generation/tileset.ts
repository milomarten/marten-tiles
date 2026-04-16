import { WeightedOrSingle } from "./utils.js";

export type TileId = {
    tileX: number,
    tileY: number
};

export interface Tileset {
    version: string;
    tiles: StaticImageMap;
    base: {
        ground: WeightedOrSingle<OneTile>;
        obstacle: WeightedOrSingle<OneTile | NinePatch | Autotile3>;
        void: WeightedOrSingle<OneTile | NinePatch | Autotile3>;
        semiObstacle: WeightedOrSingle<OneTile | NinePatch | Autotile3>;
    }
}

export interface ImageMap {
    tileWidth: number;
    tileHeight: number;
    marginWidth: number;
    marginHeight: number;
}

export interface StaticImageMap extends ImageMap {
    data: ImageData;
}

export type TileArea = OneTile | Autotile3 | NinePatch;

export interface OneTile {
    type: "tile";
    tileId: TileId;
}

export interface Autotile3 {
    type: "autotile3";
    tileId: TileId;
}

export interface NinePatch {
    type: "ninepatch";
    tileId: TileId;
}