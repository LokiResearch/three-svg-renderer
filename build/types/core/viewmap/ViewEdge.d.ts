import { Vector2 } from 'three';
import { Face, Halfedge } from 'three-mesh-halfedge';
import { SVGMesh } from '../SVGMesh';
import { ViewVertex } from './ViewVertex';
/**
 * Possible values for the edge nature in the viemap.
 */
export declare enum ViewEdgeNature {
    /** Edge is connected to front-facing and a back-facing face */
    Silhouette = "Silhouette",
    /** Edge is only connected to one face */
    Boundary = "Boundary",
    /** Edge is on the intersection between two meshes */
    MeshIntersection = "MeshIntersection",
    /** Edge is connected to two faces where the angle between normals is acute */
    Crease = "Crease",
    /** Edge is connected to two faces using a different material/vertex color */
    Material = "Material"
}
export declare const VisibilityIndicatingNatures: Set<ViewEdgeNature>;
export declare class ViewEdge {
    /**
     * Halfedge on which the edge is based on
     * @defaultValue null
     */
    halfedge?: Halfedge;
    /**
     * List of the meshes the Edge belongs to
     */
    readonly meshes: SVGMesh[];
    /**
     * Nature of the edge
     * @defautValue EdgeNature.None
     */
    nature: ViewEdgeNature;
    /**
     * Angle between to the connected faces.
     * @defaultValue Infinity */
    faceAngle: number;
    /**
     * Indicates whether the edge is connected to back-facing faces only
     * *Note: this makes only sense with 2 connected faces.*
     * @defaultValue false
    */
    isBack: boolean;
    /**
     * Indicates wheter the edge is concave.
     * *Note: this makes only sense with 2 connected faces.*
     * @defaultValue false
     */
    isConcave: boolean;
    faces: Face[];
    a: ViewVertex;
    b: ViewVertex;
    constructor(a: ViewVertex, b: ViewVertex, nature: ViewEdgeNature, halfedge?: Halfedge);
    get vertices(): ViewVertex[];
    get from(): Vector2;
    get to(): Vector2;
    toJSON(): {
        id: string;
    };
    clone(): ViewEdge;
    otherVertex(vertex: ViewVertex): ViewVertex;
    hasVertex(vertex: ViewVertex): boolean;
    isConnectedTo(edge: ViewEdge): boolean;
}
//# sourceMappingURL=ViewEdge.d.ts.map