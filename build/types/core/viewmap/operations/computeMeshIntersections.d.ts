import { Viewmap } from "../Viewmap";
import { TriIntersectionInfo } from "./meshIntersectionCb";
export declare class MeshIntersectionInfo {
    details: TriIntersectionInfo[];
    nbTests: number;
    nbIntersections: number;
    nbMeshesTested: number;
    nbEdgesAdded: number;
}
export declare function computeMeshIntersections(viewmap: Viewmap, info?: MeshIntersectionInfo): void;
//# sourceMappingURL=computeMeshIntersections.d.ts.map