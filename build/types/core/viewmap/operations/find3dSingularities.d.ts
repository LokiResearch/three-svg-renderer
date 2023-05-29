import { PerspectiveCamera } from "three";
import { Vertex } from "three-mesh-halfedge";
import { Viewmap } from "../Viewmap";
import { ViewVertex, ViewVertexSingularity } from "../ViewVertex";
export declare function find3dSingularities(viewmap: Viewmap): void;
/**
 *
 * @ref https://hal.inria.fr/hal-02189483/file/contour_tutorial.pdf Section 4.3
 *
 * @param point
 * @param camera
 * @returns
 */
export declare function singularityForPoint(viewVertex: ViewVertex, camera: PerspectiveCamera): ViewVertexSingularity.None | ViewVertexSingularity.MeshIntersection | ViewVertexSingularity.CurtainFold | ViewVertexSingularity.Bifurcation;
export declare function listBoundaryHalfedgesInOut(vertex: Vertex): Generator<import("three-mesh-halfedge").Halfedge, void, unknown>;
/**
 * Checks if face adjacent to a boundary vertex overlap in image-space.
 *
 * @ref https://hal.inria.fr/hal-02189483/file/contour_tutorial.pdf Appendix C.2.1
 *
 * @param vertex
 * @param camera
 * @returns
 */
export declare function isAnyFaceOverlappingBoundary(viewVertex: ViewVertex, camera: PerspectiveCamera): boolean;
//# sourceMappingURL=find3dSingularities.d.ts.map