// /*
//  * Author: Axel Antoine
//  * mail: ax.antoine@gmail.com
//  * website: http://axantoine.com
//  * Created on Wed Nov 16 2022
//  *
//  * Loki, Inria project-team with Université de Lille
//  * within the Joint Research Unit UMR 9189 
//  * CNRS - Centrale Lille - Université de Lille, CRIStAL
//  * https://loki.lille.inria.fr
//  *
//  * Licence: Licence.md
//  */

// import { trianglesIntersect } from "fast-triangle-triangle-intersection";
// import { Line3, Matrix4, Triangle, Vector3 } from "three";
// import { Face, Halfedge, HalfedgeDS } from "three-mesh-halfedge";
// import { SVGMesh } from "../../SVGMesh"
// import { Edge } from "../Edge";

// const matrix_ = new Matrix4();
// const line_ = new Line3();
// const cutLine_ = new Line3();

// export class MeshIntersectionInfo {
//   mesh = "";
//   nbTests = Infinity;
//   nbIntersections = Infinity;
//   nbMeshesTested = Infinity;
//   time = Infinity;
//   intersectionEdges = new Array<Edge>();
// }

// export function computeMeshesIntersections(meshes: SVGMesh[]) {
  
//   const infos = new Array<MeshIntersectionInfo>();

//   for (let i=0; i<meshes.length; i++) {
//     const others = [];
//     for (let j=i+1; j<meshes.length; j++) {
//       others.push(meshes[j]);
//     }
//     infos.push(computeMeshIntersections(meshes[i], others));
//   }

//   return infos;
  
// }

// export function computeMeshIntersections(mesh: SVGMesh, others: SVGMesh[]) {

//   const startTime = Date.now();
//   const info = new MeshIntersectionInfo();
//   info.mesh = mesh.name;

//   // Save the original mapping of face indices
//   const loopsMap = new Map<number, Halfedge[]>();
//   for (const face of mesh.hes.faces) {
//     loopsMap.set(face.id, [face.halfedge]);
//   }

//   info.nbTests = 0;
//   info.nbIntersections = 0;
//   info.nbMeshesTested = 0;

//   const interPoints = new Array<Vector3>();
//   // const vertices = new Array<Vertex>();

//   for (const otherMesh of others) {

//     info.nbMeshesTested += 1;

//     matrix_.copy(mesh.matrixWorld).invert().multiply(otherMesh.matrixWorld);

//     mesh.bvh.bvhcast(otherMesh.bvh, matrix_, {

//       intersectsTriangles: (
//           triangleA: Triangle, triangleB: Triangle, index: number) => {
        
//         info.nbTests += 1;

//         const loops = loopsMap.get(index);

//         if (loops) {

//           if (trianglesIntersect(triangleA, triangleB, interPoints) !== null) {

//             // We're ignoring intersection on single points as there is no triangle
//             // cuts to perform
//             if (interPoints.length > 1) {
              
//               info.nbIntersections += 1;

//               /**
//                * Link successive vertices in the Halfedge structure.
//                */
//               let i = 0;
//               if (interPoints.length === 2) {
//                 i = 1;
//               }

//               for (;i<interPoints.length; i++) {
       

//                 line_.start.copy(interPoints[i]);
//                 line_.end.copy(interPoints[(i+1)%interPoints.length]);

//                 cutLoops(mesh.hes, loops, line_);
//               }
//             }
//           }
//         } else {
//           console.error(`No faces at face index ${index} for mesh ${mesh.name}`);
//         }
//         return false;
//       }
//     });
//   }
  

//   info.time = Date.now() - startTime;

//   return info;
// }



// function getVertexInLoop(
//     struct: HalfedgeDS,
//     loop: Halfedge,
//     position: Vector3) {

//   /**
//    * Check if position matches one loop vertex
//    */
//   for (const halfedge of loop.nextLoop()) {
//     if (halfedge.vertex.matchesPosition(position)) {
//       return halfedge.vertex;
//     }
//   }
  

//   /**
//    * Check if position can cut one loop halfedge in 2
//    */
//   for (const halfedge of loop.nextLoop()) {
//     if (halfedge.containsPoint(position)) {
//       return struct.splitEdge(halfedge, position);
//     }
//   }

//   return null;
  
// }

// function cutLoops(
//     struct: HalfedgeDS,
//     loops: Halfedge[],
//     line: Line3) {

//   const no_face_loops = [];
//   const face_loops = new Array<Halfedge & {face: Face}>;

//   for (const loop of loops) {
//     if (loop.face) {
//       face_loops.push(loop as Halfedge & {face: Face});
//     } else {
//       no_face_loops.push(loop);
//     }
//   }
  
//   loops.filter(loop => loop.face === null);

//   for (const loop of face_loops) {

//     intersectLineFace(loop, cutLine_, line);

//     /**
//      * Get v1
//      */
//     let v1New = false;
//     let v1 = getVertexInLoop(struct, loop, cutLine_.start);
//     let i = 0;
//     while (i<no_face_loops.length && v1===null) {
//       v1 = getVertexInLoop(struct, no_face_loops[i], cutLine_.start);
//       i++;
//     }
//     if (!v1) {
//       v1 = struct.addVertex(cutLine_.start);
//       v1New = true;
//     }

//     /**
//      * Get v2
//      */
//     let v2New = false;
//     let v2 = getVertexInLoop(struct, loop, cutLine_.end);
//     i = 0;
//     while (i < no_face_loops.length && v2 === null) {
//       v2 = getVertexInLoop(struct, no_face_loops[i], cutLine_.end);
//       i++;
//     }
//     if (!v2) {
//       v2 = struct.addVertex(cutLine_.start);
//       v2New = true;
//     }

//     /**
//      * Cut halfedge between v1 and v2
//      */
//     const halfedge = struct.cutFace(loop.face, v1, v2, true);

//     if (v1New && v2New) {
//       // A new halfedge has been created but is not linked to any face yet
//       loops.push(halfedge);
//     } else if (halfedge.face !== halfedge.twin.face) {
//       // A new face has been created
//       loops.push(halfedge.twin);
//     }
//   }

//   // Remove old no face halfedge that are now linked
//   for (const halfedge of no_face_loops) {
//     if (halfedge.face) {
//       loops.remove(halfedge);
//     }
//   }
// }


// function intersectLineFace(loop: Halfedge, target: Line3, line: Line3) {
//   return null;
// }