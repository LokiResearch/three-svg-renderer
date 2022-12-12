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
import { intersectLines } from "../../../utils";
import { SVGMesh } from "../../SVGMesh";
import { ViewEdge, ViewEdgeNature } from "../ViewEdge";
import { Viewmap } from "../Viewmap";
import { createViewVertex } from "./createViewVertex";
import { TriIntersectionInfo, meshIntersectionCb } from "./meshIntersectionCb";
import { splitViewEdge3d } from "./splitEdge";


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

  const {meshes} = viewmap;

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
  const _lineDir = new Vector3();
  const _dir = new Vector3();

  const intersectCallback = (
      meshA: SVGMesh, meshB: SVGMesh, line: Line3, 
      faceA: Face, faceB: Face) => {
  
    const faceEdges = new Set([...faceA.edges, ...faceB.edges]);


    const v1 = createViewVertex(viewmap, line.start);
    const v2 = createViewVertex(viewmap, line.end);

    const intersectVertices = [v1, v2];
 
    for (const e of faceEdges) {

      _line.set(e.a.pos3d, e.b.pos3d);

      if (intersectLines(_line, line, _inter)) {
        const splitResult = splitViewEdge3d(viewmap, e, _inter);

        if (splitResult) {
          if (!intersectVertices.includes(splitResult.viewVertex)) {
            intersectVertices.push(splitResult.viewVertex);
          }
        } else {
          console.error("Intersection but split failed");
        }

      }
    }

    // Sort point along the line
    _dir.subVectors(line.end, line.start);
    intersectVertices.sort((a,b) => {
      _dir.subVectors(b.pos3d, a.pos3d);
      return _dir.dot(_lineDir)
    });

    // Create new edges
    for (let i = 0; i<intersectVertices.length-1; i++) {

      const v1 = intersectVertices[i];
      const v2 = intersectVertices[i+1];

      const viewEdge = new ViewEdge(v1, v2);
      viewEdge.nature = ViewEdgeNature.MeshIntersection;
      viewEdge.meshes.push(meshA, meshB);
      viewEdge.faces.push(faceA, faceB);

      v1.viewEdges.push(viewEdge);
      v2.viewEdges.push(viewEdge);

      faceA.edges.push(viewEdge);
      faceB.edges.push(viewEdge);

      viewmap.viewEdges.push(viewEdge);
    }
     
  }





  // const intersectCallback_old = (
  //     meshA: SVGMesh, meshB: SVGMesh, line: Line3, 
  //     faceA: Face, faceB: Face) => {

  //   const v1 = createViewVertex(viewmap, line.start);
  //   const v2 = createViewVertex(viewmap, line.end);

  //   const edge = new ViewEdge(v1, v2);
  //   edge.nature = ViewEdgeNature.MeshIntersection;
  //   edge.meshes.push(meshA, meshB);
  //   v1.viewEdges.push(edge);
  //   v2.viewEdges.push(edge);
    
  //   viewmap.viewEdges.push(edge);

  //   for (const faceEdge of [...faceA.edges, ...faceB.edges]) {

  //     _line.set(faceEdge.a.pos3d, faceEdge.b.pos3d);

  //     if (intersectLines(_line, line, _inter)) {
  //       splitViewEdge3d(viewmap, faceEdge, _inter); 
  //       splitViewEdge3d(viewmap, edge, _inter);
  //       // const split = splitEdgeAt3dPosition(viewmap, faceEdge, _inter); 

  //       // if (split) {

  //       //   split.vertex


  //       // }

  //     }
  //   }

  //   edge.faces.push(faceA, faceB);
  //   faceA.edges.push(edge);
  //   faceB.edges.push(edge);


  //   // const edges = insertFaceEdge(viewmap, faceA, line);
  //   // info.nbEdgesAdded += edges.length;

  //   // for (const edge of edges) {
      
  //   //   if (edge.nature === EdgeNature.None) {
  //   //     edge.nature = EdgeNature.MeshIntersection;
  //   //   }
      
  //   //   if (!edge.meshes.includes(meshA)) {
  //   //     edge.meshes.push(meshA);
  //   //   }

  //   //   if (!edge.meshes.includes(meshB)) {
  //   //     edge.meshes.push(meshB);
  //   //   }

  //   //   splitFaceEdges(viewmap, faceB, edge.a.position);
  //   //   splitFaceEdges(viewmap, faceB, edge.b.position);
      
  //   // }
  // }


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