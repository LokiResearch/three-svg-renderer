import { Mesh, PerspectiveCamera } from "three";
import { Chain } from "../Chain";
import { Viewmap } from "../Viewmap";
export declare class ChainVisibilityInfo {
    nbTests: number;
    nbRaycasts: number;
}
export declare function computeChainsVisibility(viewmap: Viewmap, info?: ChainVisibilityInfo): void;
export declare function chainVisibilityWithGeometry(chain: Chain): boolean;
/**
 * Determines chain visibility via casting a rayfrom the chain to the camera
 * @param contour
 * @param camera
 * @param objects
 * @param tolerance
 * @returns
 */
export declare function chainVisibilityWithRaycasting(chain: Chain, camera: PerspectiveCamera, objects: Array<Mesh>, tolerance?: number): void;
//# sourceMappingURL=computeChainsVisibility.d.ts.map