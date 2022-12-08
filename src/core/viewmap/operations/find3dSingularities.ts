/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Tue Nov 22 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { PerspectiveCamera } from "three";
import { Vertex } from "three-mesh-halfedge";
import { sameSide } from "../../../utils";
import { EdgeNature } from "../Edge";
import { Point, PointSingularity } from "../Point";
import { Viewmap } from "../Viewmap";

export function find3dSingularities(viewmap: Viewmap) {
  
  const {points, camera} = viewmap;

  for (const point of points) {
    point.singularity = singularityForPoint(point, camera);
  }
}

/**
 * 
 * @ref https://hal.inria.fr/hal-02189483/file/contour_tutorial.pdf Section 4.3
 *
 * @param point 
 * @param camera 
 * @returns 
 */
export function singularityForPoint(
    point: Point, camera: PerspectiveCamera) {

  const natures = new Set<EdgeNature>();

  let concaveSilhouetteEdgeFound = false;
  let convexSilhouetteEdgeFound = false;

  const edges = point.edges.filter(e => e.nature !== EdgeNature.None);

  // Count the number of different natures connected to the vertex
  for (const edge of edges) {

    natures.add(edge.nature);

    if (edge.faces.length > 1 && edge.nature === EdgeNature.Silhouette) {
      concaveSilhouetteEdgeFound ||= edge.isConcave;
      convexSilhouetteEdgeFound ||= !edge.isConcave;
    }
  }

  if (natures.size === 0) {
    console.error("No natures found around point", point);
  }

  // If the number of segment natures is 1 and there is more than 2 segments
  // connected to the point, then there is a bifurcation singularity
  else if (natures.size === 1) {
    if(edges.length > 2 && (
      natures.has(EdgeNature.Silhouette) || natures.has(EdgeNature.Boundary)
    )) {
      return PointSingularity.Bifurcation; 
    }
  }

  // If there are at least 2 edges of different natures connected to the vertex,
  // then there is a mesh intersection singularity
  else if (natures.size > 1) {
    if (natures.has(EdgeNature.Silhouette) && natures.has(EdgeNature.Boundary) ||
      natures.has(EdgeNature.Silhouette) && natures.has(EdgeNature.MeshIntersection) ||
      natures.has(EdgeNature.Boundary) && natures.has(EdgeNature.MeshIntersection)) {
      return PointSingularity.MeshIntersection;
    }
  }

  // Curtains folds:

  // Curtain fold singularity can occur on a non-boundary segment where
  // there are at least one concave and one convex edges connected
  // if (!natures.has(EdgeNature.Boundary) &&
  if (concaveSilhouetteEdgeFound && convexSilhouetteEdgeFound) {
    return PointSingularity.CurtainFold;
  }
  
  // Curtain fold singularity can also occur on a Boundary edge where
  // one of the connected face overlaps the boundary edge
  // Note that at this stage of the pipeline, each point should only have
  // one associated vertex, hence the index 0
  else if (natures.has(EdgeNature.Boundary) &&
      isAnyFaceOverlappingBoundary(point.vertices[0], camera)) {
    return PointSingularity.CurtainFold;
  }

  return PointSingularity.None;

}

export function *listBoundaryHalfedgesInOut(vertex: Vertex) {
  yield* vertex.boundaryHalfedgesInLoop();
  yield* vertex.boundaryHalfedgesOutLoop();
}

/**
 * Checks if face adjacent to a boundary vertex overlap in image-space.
 * 
 * @ref https://hal.inria.fr/hal-02189483/file/contour_tutorial.pdf Appendix C.2.1
 * 
 * @param vertex 
 * @param camera 
 * @returns 
 */
export function isAnyFaceOverlappingBoundary(vertex: Vertex, camera: PerspectiveCamera) {

  // Get the farthest boundary halfedge from the camera and connected to the
  // vertex
  let farthestHalfedge = null;
  let otherVertex = null;
  let distance = -Infinity;
  
  for (const halfedge of listBoundaryHalfedgesInOut(vertex)) {

    let other;
    if (halfedge.vertex === vertex) {
      // Halfedge is starting from vertex
      other = halfedge.next.vertex;
    } else {
      // Halfedge is arriving to vertex
      other = halfedge.vertex;
    }
    const d = other.position.distanceTo(camera.position);
    if (d > distance) {
      distance = d;
      farthestHalfedge = halfedge;
      otherVertex = other;
    }
  }

  if (farthestHalfedge && otherVertex) {

    // Iterate on each connected faces to vertex and check if it overlaps
    // the farthest halfedge
    const c = camera.position;
    const p = vertex.position;
    const e = otherVertex.position;

    const boundaryFace = farthestHalfedge.twin.face;

    if (boundaryFace) {
      for (const halfedge of vertex.loopCW()) {
        if (halfedge.face !== boundaryFace) {

          const q = halfedge.next.vertex.position;
          const r = halfedge.next.vertex.position;

          if (!sameSide(p,q,r,c,e) && sameSide(c,p,q,e,r) && sameSide(c,p,r,e,q)) {
            return true;
          }
        }
      }
    } else {
      console.error("Boundary halfedge twin has no connected face");
    }
  }
  return false;
}
