import { Vector2, Vector3 } from "three";
import { ViewEdge } from "../ViewEdge";
import { Viewmap } from "../Viewmap";
import { ViewVertex } from "../ViewVertex";
export declare function splitViewEdge3d(viewmap: Viewmap, edge: ViewEdge, position: Vector3): {
    viewVertex: ViewVertex;
    viewEdge: null;
} | {
    viewVertex: ViewVertex;
    viewEdge: ViewEdge;
} | null;
export declare function splitViewEdge2d(viewmap: Viewmap, edge: ViewEdge, position: Vector2): {
    viewVertex: ViewVertex;
    viewEdge: null;
} | {
    viewVertex: ViewVertex;
    viewEdge: ViewEdge;
} | null;
export declare function splitViewEdgeWithViewVertex(viewmap: Viewmap, edge: ViewEdge, vertex: ViewVertex): ViewEdge;
//# sourceMappingURL=splitEdge.d.ts.map