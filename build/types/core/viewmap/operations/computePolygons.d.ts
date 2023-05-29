import Arrangement2D from 'arrangement-2d-js';
import { Vector2 } from 'three';
import { Viewmap } from '../Viewmap';
export declare class PolygonsInfo {
    smallAreaIgnored: number;
    insidePointErrors: number;
}
/**
 * Computes the polygons formed by the projection of the ViewEdges on the image
 * plane
 * @param viewmap
 * @param info
 */
export declare function computePolygons(viewmap: Viewmap, info?: PolygonsInfo): Promise<void>;
export declare function convertContourList(vector: Arrangement2D.ContourList): Array<Array<Vector2>>;
export declare function convertContour(contour: Arrangement2D.Contour): Array<Vector2>;
//# sourceMappingURL=computePolygons.d.ts.map