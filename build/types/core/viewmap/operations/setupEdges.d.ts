import { Halfedge } from "three-mesh-halfedge";
import { ViewEdgeNature } from "../ViewEdge";
import { Viewmap } from "../Viewmap";
import { PerspectiveCamera } from "three";
export interface ViewEdgeNatureOptions {
    creaseAngle?: {
        min: number;
        max: number;
    };
}
/**
 * Returns the list
 * @param meshes
 * @param camera
 * @param options
 * @returns
 */
export declare function setupEdges(viewmap: Viewmap, options: ViewEdgeNatureOptions): void;
export declare function propsForViewEdge(halfedge: Halfedge, camera: PerspectiveCamera, options?: ViewEdgeNatureOptions): {
    nature: ViewEdgeNature;
    faceAngle: number;
    isConcave: boolean;
    isBack: boolean;
} | null;
//# sourceMappingURL=setupEdges.d.ts.map