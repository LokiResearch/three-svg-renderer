import { Vector2, Vector3 } from "three";
import { Vertex } from "three-mesh-halfedge";
import { ViewEdge } from "./ViewEdge";
export declare enum ViewVertexSingularity {
    None = "None",
    ImageIntersection = "ImageIntersection",
    MeshIntersection = "MeshIntersection",
    CurtainFold = "CurtainFold",
    Bifurcation = "Bifurcation"
}
export declare class ViewVertex {
    hash3d: string;
    hash2d: string;
    singularity: ViewVertexSingularity;
    readonly vertices: Set<Vertex>;
    readonly pos3d: Vector3;
    readonly pos2d: Vector2;
    readonly viewEdges: ViewEdge[];
    visible: boolean;
    commonViewEdgeWith(other: ViewVertex): ViewEdge | null;
    isConnectedTo(other: ViewVertex): boolean;
    matches3dPosition(position: Vector3, tolerance?: number): boolean;
    matches2dPosition(position: Vector2, tolerance?: number): boolean;
    get x(): number;
    get y(): number;
}
//# sourceMappingURL=ViewVertex.d.ts.map