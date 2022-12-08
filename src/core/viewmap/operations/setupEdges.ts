/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Wed Nov 16 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { Halfedge, Vertex } from "three-mesh-halfedge";
import { hashVector3 } from "../../../utils";
import { Edge, EdgeNature, HalfedgeNatureOptions } from "../Edge";
import { Point } from "../Point";
import { Viewmap } from "../Viewmap";

/**
 * Returns the list
 * @param meshes 
 * @param camera 
 * @param options 
 * @returns 
 */
export function setupEdges(
    viewmap: Viewmap,
    options: HalfedgeNatureOptions) {
  
  const {edges, camera, meshes, pointMap} = viewmap;
  const handledHalfedges = new Set<Halfedge>();
  const handledVertices = new Set<Vertex>();


  for (const mesh of meshes) {

    for (const face of mesh.hes.faces) {
      face.edges = new Array<Edge>();
    }

    for (const halfedge of mesh.hes.halfedges) {

      if (!handledHalfedges.has(halfedge.twin)) {

        handledHalfedges.add(halfedge);

        const v1 = halfedge.vertex;
        const v2 = halfedge.twin.vertex;
        const hash1 = hashVector3(v1.position);
        const hash2 = hashVector3(v2.position);

        let p1 = pointMap.get(hash1);
        if (!p1) {
          p1 = new Point();
          p1.pos3d.copy(v1.position);
          p1.hash3d = hash1;
          pointMap.set(hash1, p1);
        }

        let p2 = pointMap.get(hash2);
        if (!p2) {
          p2 = new Point();
          p2.pos3d.copy(v2.position);
          p2.hash3d = hash2;
          pointMap.set(hash1, p2);
        }

        p1.vertices.add(v1);
        p2.vertices.add(v2);

        let edge = p1.connectedTo(p2);
        if (!edge) {
          edge = new Edge(p1, p2);
          edge.updateFromHalfedge(halfedge, camera, options);
          
        
        }




        // Setup the edge
        

        // Keep edge if its nature is of interest
        if (edge.nature != EdgeNature.None) {
        
          for (const vertex of edge.vertices) {
            
            if (!handledVertices.has(vertex)) {
              vertex.edges = new Array<Edge>();
              handledVertices.add(vertex);
            }
            vertex.edges.push(edge);
          }

          edge.meshes.push(mesh);
          edges.push(edge);

          if (halfedge.face) {
            halfedge.face.edges.push(edge);
            edge.faces.push(halfedge.face);
          }

          if (halfedge.twin.face) {
            halfedge.twin.face.edges.push(edge);
            edge.faces.push(halfedge.twin.face);
          }
        }
      }
    }
  }
}
