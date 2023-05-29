import { Vector2, Color } from 'three';
import { SVGMesh } from '../SVGMesh';
export declare class Polygon {
    id: number;
    mesh?: SVGMesh;
    color: Color;
    insidePoint: Vector2;
    contour: Vector2[];
    holes: Vector2[][];
    constructor(id: number, contour: Vector2[], holes: Vector2[][]);
}
//# sourceMappingURL=Polygon.d.ts.map