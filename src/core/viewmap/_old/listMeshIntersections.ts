// /*
//  * Author: Axel Antoine
//  * mail: ax.antoine@gmail.com
//  * website: http://axantoine.com
//  * Created on Mon Nov 28 2022
//  *
//  * Loki, Inria project-team with Université de Lille
//  * within the Joint Research Unit UMR 9189 
//  * CNRS - Centrale Lille - Université de Lille, CRIStAL
//  * https://loki.lille.inria.fr
//  *
//  * Licence: Licence.md
//  */

// import { trianglesIntersect } from "fast-triangle-triangle-intersection";
// import { Line3, Matrix4, Triangle, Vector2, Vector3 } from "three";
// import { Face } from "three-mesh-halfedge";
// import { SVGMesh } from "../../SVGMesh";
// import { Edge } from "../Edge";

// const _line1 = new Line3();
// const _line2 = new Line3();
// const _inter = new Vector3();
// const _invertexMatrix = new Matrix4();
// const _n = new Vector3();
// const _u = new Vector3();
// const _v = new Vector3();
// const _affineMatrix = new Matrix4().set(
//   0,1,0,0,
//   0,0,1,0,
//   0,0,0,1,
//   1,1,1,1
// );



// export function listMeshIntersection(
//     faceMap: Map<Face, Edge[]>,
//     edges: Edge[], 
//     meshes: SVGMesh[]) {

//   const addEdgeToFace = (face: Face, edge: Edge) => {
//     let list = faceEdgeMap.get(face);
//     if (!list) {
//       list = [];
//       faceEdgeMap.set(face, list);
//     }
//     list.push(edge);
//   }

//   // Fill in the map
//   for (const edge of edges) {

//     if (edge.halfedge) {
//       if (edge.halfedge.face) {
//         addEdgeToFace(edge.halfedge.face, edge);
//       }
    
//       if (edge.halfedge.twin.face) {
//         addEdgeToFace(edge.halfedge.twin.face, edge);
//       }

//     } else {
//       console.error("edge has no halfedge");
//     }
//   }


 


  

// }

// export function cutFaceEdgesWithLine(
//     faceMap: Map<Face, Edge[]>,
//     line: Line3,
//     face: Face) {

//   let edges = faceMap.get(face);
//   if (!edges) {
//     edges = [];
//     faceMap.set(face, edges);
//   }

//   const intersections = listIntersectingEdgesWithLine(line, face, edges);

//   if (!edges) {

//     const e = new Edge();

//     faceMap.add()
//   }

// }

// export function splitEdgeAtPosition(
//     face: Face,
//     edge: Edge,
//     position: Vector3,
//     tolerance = 1e-10) {

//   const a = edge.a;
//   const b = edge.b;

//   if (a.matchesPosition(position, tolerance)) {
//     return a;
//   }

//   if (b.matchesPosition())

  


// }

// // function getVertexInFace(
// //     struct: HalfedgeDS,
// //     loop: Halfedge,
// //     position: Vector3) {

// //   /**
// //    * Check if position matches one loop vertex
// //    */
// //   for (const halfedge of loop.nextLoop()) {
// //     if (halfedge.vertex.matchesPosition(position)) {
// //       return halfedge.vertex;
// //     }
// //   }
  

// //   /**
// //    * Check if position can cut one loop halfedge in 2
// //    */
// //   for (const halfedge of loop.nextLoop()) {
// //     if (halfedge.containsPoint(position)) {
// //       return struct.splitEdge(halfedge, position);
// //     }
// //   }

// //   return null;
  
// // }




// export function listIntersectingEdgesWithLine(
//     line: Line3,
//     face: Face,
//     edges: Edge[]) {


//   // Convert 3D coordinates into triangle plane coordinates (so that z=0)

//   // Get the unit vectors of the plane basis
//   face.getNormal(_n);
//   const a = face.halfedge.vertex.position;
//   _u.subVectors(a, face.halfedge.next.vertex.position).normalize();
//   _v.crossVectors(_n, _u);

//   // Move basis to a
//   _u.add(a);
//   _v.add(a);
//   _n.add(a);

//   _matrix.set(
//     a.x, _u.x, _v.x, _n.x,
//     a.y, _u.y, _v.y, _n.y,
//     a.z, _u.z, _v.z, _n.z,
//     1, 1, 1, 1
//   );

//   _matrix.invert();
//   _matrix.premultiply(_affineMatrix);

//   const intersections = [];

//   _line1.copy(line);
//   _line1.applyMatrix4(_matrix);


//   for (const edge of edges) {

//     _line2.start.copy(edge.a.position);
//     _line2.end.copy(edge.b.position);
//     _line2.applyMatrix4(_matrix);

//     if (linesIntersect2d(_line1, _line2, _inter)) {

//       intersections.push({
//         edge: edge,
//         pos: new Vector2(_inter.x, _inter.y)
//       });
//     }
//   }

//   return intersections;
// }

// export function linesIntersect2d(
//     line1: Line3, line2: Line3,
//     target: Vector3, eps=1e-10) {

//   const dx1 = (line1.start.x-line1.end.x);
//   const dx2 = (line2.start.x-line2.end.x);
//   const dy1 = (line1.start.y-line1.end.y);
//   const dy2 = (line2.start.y-line2.end.y);

//   const D = dx1*dy2 - dx2*dy1;

//   if (D > -eps && D < eps) {
//     return false;
//   }

//   const n1 = line1.start.x*line1.end.y - line1.start.y*line1.end.x;
//   const n2 = line2.start.x*line2.end.y - line2.start.y*line2.end.x;

//   target.set((n1*dx2 - n2*dx1)/D, (n1*dy2 - n2*dy1)/D, 0);

//   return true;
// }




