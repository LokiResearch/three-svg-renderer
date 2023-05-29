import { Line3 } from "three";
import { Face } from "three-mesh-halfedge";
import { SVGMesh } from "../../SVGMesh";
export declare class TriIntersectionInfo {
    name: string;
    nbTests: number;
    nbIntersections: number;
    time: number;
}
/**
 * Run the specify callback for all
 * @param meshA
 * @param meshB
 * @param callback
 * @param info
 */
export declare function meshIntersectionCb(meshA: SVGMesh, meshB: SVGMesh, callback: (meshA: SVGMesh, meshB: SVGMesh, line: Line3, faceA: Face, faceB: Face) => void, info?: TriIntersectionInfo): void;
//# sourceMappingURL=meshIntersectionCb.d.ts.map