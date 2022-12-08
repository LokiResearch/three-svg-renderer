/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Thu Nov 24 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { trianglesIntersect } from "fast-triangle-triangle-intersection";
import {  Matrix4, Triangle, Vector3 } from "three";
import { Vertex } from "three-mesh-halfedge";
import { hashVector3 } from "../../../utils";
import { SVGMesh } from "../../SVGMesh"
import { Edge, EdgeNature } from "../Edge";

const matrix_ = new Matrix4();

export class MeshIntersectionInfo {
  name = "";
  nbTests = Infinity;
  nbIntersections = Infinity;
  nbMeshesTested = Infinity;
  time = Infinity;
}

export function computeIntersectionEdges(
    meshA: SVGMesh,
    meshB: SVGMesh,
    info = new MeshIntersectionInfo()) {

  const startTime = Date.now();
  info.name = meshA.name + '-' + meshB.name;

  info.nbTests = 0;
  info.nbIntersections = 0;

  const newEdges = new Array<Edge>();
  const intersectionPoints = new Array<Vector3>();
  const hashVertexMap = new Map<string, Vertex>();
  const intersectionVertices = new Array<Vertex>();

  matrix_.copy(meshA.matrixWorld).invert().multiply(meshB.matrixWorld);

  meshA.bvh.bvhcast(meshB.bvh, matrix_, {

    intersectsTriangles: (t1: Triangle, t2: Triangle) => {
      
      info.nbTests += 1;
      
      if (trianglesIntersect(t1, t2, intersectionPoints) !== null) {

        // We're ignoring intersection on single points as there is no triangle
        // cuts to perform
        if (intersectionPoints.length > 1) {
          
          info.nbIntersections += 1;

          intersectionVertices.clear();
          
          // Get the vertex for each point
          for (const p of intersectionPoints) {
            p.applyMatrix4(meshA.matrixWorld);
            const hash = hashVector3(p);
            let vertex = hashVertexMap.get(hash);
            if (!vertex) {
              vertex = new Vertex();
              vertex.edges = new Array<Edge>();
              vertex.position.copy(p);
              hashVertexMap.set(hash, vertex);
            }
            intersectionVertices.push(vertex);
          }

          // Push back the first vertex in case there is a loop (coplanar)
          if (intersectionVertices.length > 2) {
            intersectionVertices.push(intersectionVertices[0]);
          }

          // Create edges for each pair of vertices
          for (let i=0; i<intersectionVertices.length-1; i++) {

            const v1 = intersectionVertices[i];
            const v2 = intersectionVertices[i+1];

            const edge = new Edge(v1, v2);
            edge.nature = EdgeNature.MeshIntersection;
            v1.edges.push(edge);
            v2.edges.push(edge);
            edge.meshes.push(meshA, meshB);
            newEdges.push(edge);            
          }
        }
      } 
      return false;
    }
  });
  
  info.time = Date.now() - startTime;

  return newEdges;
}