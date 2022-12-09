/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Tue Nov 29 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { Line3, Vector3 } from "three";
import { Face } from "three-mesh-halfedge";
import { hashVector3, intersectLines } from "../../../utils";
import { SVGMesh } from "../../SVGMesh";
import { ViewEdge, ViewEdgeNature } from "../ViewEdge";
import { Viewmap } from "../Viewmap";
import { ViewVertex } from "../ViewVertex";
// import { insertFaceEdge, splitFaceEdges } from "./insertFaceEdge";
import { TriIntersectionInfo, meshIntersectionCb } from "./meshIntersectionCb";
import { splitEdgeAt3dPosition } from "./splitEdge";


export class MeshIntersectionInfo {
  details = new Array<TriIntersectionInfo>();
  nbTests = Infinity;
  nbIntersections = Infinity;
  nbMeshesTested = Infinity;
  nbEdgesAdded = Infinity;
}

export function computeMeshIntersections(
    viewmap: Viewmap,
    info = new MeshIntersectionInfo()) {

  const {meshes, viewVertexMap} = viewmap;

  info.nbMeshesTested = 0;
  info.nbIntersections = 0;
  info.nbTests = 0;
  info.nbEdgesAdded = 0;

  // const intersectCallback = (meshA: SVGMesh, meshB: SVGMesh, line: Line3, faceA: Face, faceB: Face) => {

  //   const edges = insertFaceEdge(viewmap, faceA, line);
  //   info.nbEdgesAdded += edges.length;

  //   for (const edge of edges) {
      
  //     if (edge.nature === EdgeNature.None) {
  //       edge.nature = EdgeNature.MeshIntersection;
  //     }
      
  //     if (!edge.meshes.includes(meshA)) {
  //       edge.meshes.push(meshA);
  //     }

  //     if (!edge.meshes.includes(meshB)) {
  //       edge.meshes.push(meshB);
  //     }

  //     splitFaceEdges(viewmap, faceB, edge.a.position);
  //     splitFaceEdges(viewmap, faceB, edge.b.position);
      
  //   }
  // }

  const _line = new Line3();
  const _inter = new Vector3();

  const intersectCallback = (
      meshA: SVGMesh, meshB: SVGMesh, line: Line3, 
      _faceA: Face, _faceB: Face) => {

    const hash1 = hashVector3(line.start);
    let v1 = viewVertexMap.get(hash1);
    if (!v1) {
      v1 = new ViewVertex();
      v1.position.copy(line.start);
      v1.hash = hash1;
      viewVertexMap.set(hash1, v1);
    }

    const hash2 = hashVector3(line.end);
    let v2 = viewVertexMap.get(hash2);
    if (!v2) {
      v2 = new ViewVertex();
      v2.position.copy(line.end);
      v2.hash = hash2;
      viewVertexMap.set(hash2, v2);
    }

    const edge = new ViewEdge(v1, v2);
    edge.nature = ViewEdgeNature.MeshIntersection;
    edge.meshes.push(meshA, meshB);
    v1.viewEdges.add(edge);
    v2.viewEdges.add(edge);
    
    viewmap.viewEdges.push(edge);

    for (const faceEdge of [..._faceA.edges, ..._faceB.edges]) {

      _line.set(faceEdge.a.position, faceEdge.b.position);

      if (intersectLines(_line, line, _inter)) {
        splitEdgeAt3dPosition(viewmap, faceEdge, _inter); 
        splitEdgeAt3dPosition(viewmap, edge, _inter);
        // const split = splitEdgeAt3dPosition(viewmap, faceEdge, _inter); 

        // if (split) {

        //   split.vertex


        // }

      }




    }


    // const edges = insertFaceEdge(viewmap, faceA, line);
    // info.nbEdgesAdded += edges.length;

    // for (const edge of edges) {
      
    //   if (edge.nature === EdgeNature.None) {
    //     edge.nature = EdgeNature.MeshIntersection;
    //   }
      
    //   if (!edge.meshes.includes(meshA)) {
    //     edge.meshes.push(meshA);
    //   }

    //   if (!edge.meshes.includes(meshB)) {
    //     edge.meshes.push(meshB);
    //   }

    //   splitFaceEdges(viewmap, faceB, edge.a.position);
    //   splitFaceEdges(viewmap, faceB, edge.b.position);
      
    // }
  }


  for (let i=0; i<meshes.length-1; i++) {
    for (let j=i+1; j<meshes.length; j++) {

      const meshA = meshes[i];
      const meshB = meshes[j];

      const triInfo = new TriIntersectionInfo();
      meshIntersectionCb(meshA, meshB, intersectCallback, triInfo);

      info.nbIntersections += triInfo.nbIntersections;
      info.nbTests += triInfo.nbTests;
      info.nbMeshesTested += 1;
      info.details.push(triInfo);
    }
  }
}

// export function mergeVertices(v1: Vertex, v2: Vertex) {

//   if (v1 === v2) {
//     return;
//   }

//   for (const edge of v2.edges) {
//     if (!v1.edges.includes(edge)) {
//       v1.edges.push(edge);
//     }
//     v2.edges = 
//   }


// }