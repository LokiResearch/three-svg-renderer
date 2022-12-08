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

import { Edge } from "../Edge";
import { Point, PointSingularity } from "../Point";
import { brute, bush } from 'isect';
import { Vector2, Vector3 } from "three";
import { hashVector2 } from "../../../utils";
import { Viewmap } from "../Viewmap";
import { splitEdgeAt2dPosition, 
  splitEdgeAt3dPosition 
} from "./splitEdge";

// const _u = new Vector2();
// const _v = new Vector2();

const _vec = new Vector2();



export function find2dSingularities_new(viewmap: Viewmap) {

  const {edges, 
    points
  } = viewmap;

  const interAlgorithm = brute([...edges]);
  let intersections = interAlgorithm.run() as Array<{
    segments: Edge[],
    point: {x: number, y: number}
  }>;

  // Keep only intersections of non connected edges
  intersections = intersections.filter(i => {
    const [a,b] = i.segments;
    return !(a).isConnectedToEdgeIn3D(b) ;//&& 
    //  (a.nature === EdgeNature.Silhouette || a.nature === EdgeNature.Boundary ||
    // b.nature === EdgeNature.Silhouette || b.nature === EdgeNature.Boundary ||
    // a.nature === EdgeNature.MeshIntersection || b.nature === EdgeNature.MeshIntersection);
  });

  const edgeCutsMap = new Map<Edge, Edge[]>();

  for (const edge of edges) {
    edgeCutsMap.set(edge, [edge]);
  }

  const pos1 = new Vector3();
  const pos2 = new Vector3();



  const splitEdge = (edge: Edge, pos3d: Vector3, cuts: Edge[]) => {

    const splitResult = splitEdgeAt3dPosition(viewmap, edge, pos3d);

    if (splitResult) {
      const {vertex, newEdge} = splitResult;
      if (!vertex.point) {
        vertex.point = new Point();
        vertex.point.position.copy(_vec);
        vertex.point.vertices.push(vertex);
        points.push(vertex.point);
      }
      vertex.point.singularity = PointSingularity.ImageIntersection;

      if (newEdge) {
        cuts.push(newEdge);
        edgeCutsMap.set(edge, cuts);
      }

    } else {
      console.error("Edge could not be splitted at pos", edge, pos3d);
    }

  }


  for (const intersection of intersections) {

    const {segments: edges, point} = intersection;

    _vec.set(point.x, point.y);

    const edgeCuts1 = edgeCutsMap.get(edges[0]);
    const edgeCuts2 = edgeCutsMap.get(edges[1]);

    if (!edgeCuts1 || !edgeCuts2) {
      console.error("Cuts array not initialized");
      continue;
    }
  
    let edge1 = null;
    let i = 0;
    while (i<edgeCuts1.length && edge1 === null) {
      const cut = edgeCuts1[i];
      const ratio = cut.contains2dPosition(_vec);
      if (ratio !== null) {
        edge1 = cut;
        pos1.lerpVectors(cut.a.position, cut.b.position, ratio);
      }
      i += 1;
    }

    let edge2 = null;
    i = 0;
    while (i<edgeCuts2.length && edge2 === null) {
      const cut = edgeCuts2[i];
      const ratio = cut.contains2dPosition(_vec);
      if (ratio !== null) {
        edge2 = cut;
        pos2.lerpVectors(cut.a.position, cut.b.position, ratio);
      }
      i += 1;
    }

    if (!edge1 || !edge2) {
      console.error("Could not find edges for intersection", edgeCuts1, edgeCuts2, _vec);
      continue;
    }

    // const d1 = pos1.distanceTo(viewmap.camera.position);
    // const d2 = pos2.distanceTo(viewmap.camera.position);

    splitEdge(edge1, pos1, edgeCuts1);
    splitEdge(edge2, pos2, edgeCuts2);
  
    // if (Math.abs(d1 - d2) < 1e-10) {
    //   splitEdge(edge1, pos1, edgeCuts1);
    //   splitEdge(edge2, pos2, edgeCuts2);

    // } else if (d1 > d2) {
    //   // nearEdge = edge2;
    //   splitEdge(edge1, pos1, edgeCuts1);

    // } else {
    //   // nearEdge = edge1;
    //   splitEdge(edge2, pos2, edgeCuts2);

    // }

    // if (nearEdge.nature === EdgeNature.Silhouette || 
    //   nearEdge.nature === EdgeNature.Boundary ||
    //     nearEdge.nature === EdgeNature.MeshIntersection) {

    
    // }

  }

}






export function find2dSingularities(viewmap: Viewmap) {

  const {edges, points} = viewmap;

  const hashPointMap = new Map<string, Point>();
  
  for (const point of points) {
    const hash = hashVector2(point.position);
    hashPointMap.set(hash, point);
  }

  
  const interAlgorithm = bush([...edges]);
  let intersections = interAlgorithm.run();

  // Keep only intersections of non connected edges
  intersections = intersections.filter(i => 
    !(i.segments[0] as Edge).isConnectedToEdgeIn3D(i.segments[1] as Edge)
  );


  const edgeCutsMap = new Map<Edge, Edge[]>();

  for (const intersection of intersections) {

    const splitVertices = [];
    const edges = intersection.segments as Edge[];

    _vec.set(intersection.point.x, intersection.point.y);

    for (const edge of edges) {

      // Setup edge cuts if needed
      let edgeCuts = edgeCutsMap.get(edge);
      if (!edgeCuts) {
        edgeCuts = [edge];
        edgeCutsMap.set(edge, edgeCuts);
      }

      let i = 0;
      let splitResult = null;
      do {
        splitResult = splitEdgeAt2dPosition(viewmap, edgeCuts[i], _vec);
        i += 1;
      } while(i < edgeCuts.length && splitResult === null);

   
      if (splitResult) {
        splitVertices.push(splitResult.vertex);

        if (splitResult.newEdge) {
          edgeCuts.push(splitResult.newEdge);
        }

      } else {
        console.error("Could not split the edge", edge, _vec, edgeCuts);
      }
    }

    // Get the vertices points if they exist
    const points = new Array<Point>();
    for (const v of splitVertices) {
      if (v.point && !points.includes(v.point)) {
        points.push(v.point);
      }
    }


    // Check if there is an existing point at that position
    const hash = hashVector2(_vec);
    const p = hashPointMap.get(hash);
    if (p && !points.includes(p)) {
      points.push(p);
    }

    let newPoint;
    if (points.length === 0) {
      newPoint = new Point();
      newPoint.position.copy(_vec);
      viewmap.points.push(newPoint);
    } else {
      newPoint = mergePoints(viewmap, points);
    }

    for (const v of splitVertices) {
      v.point = newPoint;
      if (!newPoint.vertices.includes(v)) {
        newPoint.vertices.push(v);
      }
    }

    newPoint.singularity = PointSingularity.ImageIntersection;
    hashPointMap.set(hash, newPoint);
  }
}

function mergePoints(viewmap: Viewmap, points: Array<Point>) {

  const pointKept = points[0];

  for (let i=1; i<points.length; i++) {
    
    const p = points[i];

    for (const vertex of p.vertices) {
      vertex.point = pointKept;

      if (!pointKept.vertices.includes(vertex)) {
        pointKept.vertices.push(vertex);
      }
    }

    viewmap.points.remove(p);
  }

  return pointKept;
}

// export function find2dSingularities_old(
//     viewmap: Viewmap){

//   const {edges, points} = viewmap;
  
//   const splitMap = new Map<Edge, Edge[]>();
//   const intersections = getIntersectingEdges(edges);
//   const hashPointMap = new Map<string, Point>();

//   for (const intersection of intersections) {
    
//     // const points = [];
//     const vertices = [];

//     // Cut the edges intersecting
//     for (const edge of intersection.edges) {

//       // Cut the existing cuts of the intersection edge
//       let subEdges = splitMap.get(edge);
//       if (!subEdges) {
//         subEdges = [edge];
//         splitMap.set(edge, subEdges);
//       }

//       // Find the sub-edge to cut
//       let i = 0;
//       let cutResult;
//       do {
//         cutResult = splitEdge(subEdges[i], intersection.pos);
//         i+=1;
//       } while (!cutResult && i<subEdges.length);

//       if(!cutResult) {
//         console.error("Could not split edge", edge, intersection.pos);
//       } else {

//         // Store the vertex at the cut
//         const {vertex, newEdge} = cutResult;

//         // cutVertices.push(vertex);
//         if (vertex.point) {
//           points.push(vertex.point);
//         }

//         if (newEdge) {
//           subEdges.push(newEdge);
//           edges.push(newEdge);
//         }

//         vertices.push(vertex);
     
//       }
//     }


//     // Check if a point already exist for the vertices
//     let point = null;
//     for (const vertex of vertices) {
//       point = vertex.point;
//     }

//     if (!point) {
//       // Check if a point already exist at that coordinate
//       const hash = hashVector2(intersection.pos); 
//       point = hashPointMap.get(hash);
//       if (!point) {
//         point = new Point();
//         point.position.copy(intersection.pos);
//         hashPointMap.set(hash, point);
//         points.push(point);
//       }
//     }

//     point.singularity = PointSingularity.ImageIntersection;


//     // Set the point on the vertices

//     for (const vertex of vertices) {

//       if (!vertex.point) {
//         vertex.point = point;
//         point.vertices.push(vertex);
//       } else if (vertex.point !== point) {
//         for (const v of vertex.point.vertices) {
//           v.point = point;
//           point.vertices.push(v);
//         }
//         points.remove(vertex.point);
//       }
//     }
//   }
// }


// export function getIntersectingEdges(edges: Edge[]) {

//   if (edges.length === 0) {
//     return [];
//   }

//   const array = [];
//   const intersectionAlgorithm = bush(edges, {});
//   const intersections = intersectionAlgorithm.run();

//   for (const intersection of intersections) {

//     const interEdges = intersection.segments as Edge[];
//     const pos = new Vector2(intersection.point.x, intersection.point.y);

//     if(!interEdges[0].isConnectedToEdgeIn3D(interEdges[1])) {
//       array.push({
//         edges: interEdges,
//         pos: pos
//       })
//     }
//   }

//   return array;

// }

// /**
//  * 
//  * @param edge 
//  * @param position 
//  * @param tolerance 
//  * @returns 
//  */
// export function splitEdge(edge: Edge, position: Vector2, tolerance = 1e-10) {

//   /**
//    *  We consider that position is on the infinite line formed by a and b
//    * 
//    *            p?          p?           p?
//    *            x--a--------x---------b--x
//    *                  edge 
//    */                     

//   _u.subVectors(edge.a.point.position, position);
//   _v.subVectors(edge.a.point.position, edge.b.point.position);
//   const ratio = _u.length() / _v.length();

//   // Outside of [a,b]
//   if (ratio < -tolerance || ratio > 1+tolerance) {
//     return null;
//   }

//   // Close to a within tolerance
//   if (ratio <= tolerance) {
//     return {
//       vertex: edge.a,
//       newEdge: null
//     };
//   }

//   // Close to b within tolerance
//   if (ratio >= 1-tolerance) {
//     return {
//       vertex: edge.b,
//       newEdge: null
//     };
//   }

//   // Now that we know point is between a and b, we can find the 3d position
//   // of the new vertex that cuts the edge
//   const vertex = new Vertex();
//   vertex.edges = new Array<Edge>();
//   vertex.position.lerpVectors(edge.a.position, edge.b.position, ratio);

//   /**
//    *  Update the references around the new vertex
//    *            
//    *                       vertex
//    *            ---a--------x---------b--
//    *                  edge      newedge
//    */

//   const b = edge.b;

//   const newEdge = edge.clone();
//   edge.b = vertex;
//   newEdge.a = vertex;
//   newEdge.b = b;

//   vertex.edges.push(edge, newEdge);

//   b.edges.remove(edge);
//   b.edges.push(newEdge);

//   return {
//     vertex: vertex,
//     newEdge: newEdge
//   };
// }