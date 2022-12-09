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
import { frontSide, hashVector3 } from "../../../utils";
import { ViewEdge, ViewEdgeNature } from "../ViewEdge";
import { Viewmap } from "../Viewmap";
import { ViewVertex } from "../ViewVertex";
import { PerspectiveCamera, Vector3 } from "three";


export interface ViewEdgeNatureOptions {
  creaseAngle?: {min: number, max: number};
}

const _u = new Vector3();
const _v = new Vector3();

/**
 * Returns the list
 * @param meshes 
 * @param camera 
 * @param options 
 * @returns 
 */
export function setupEdges(
    viewmap: Viewmap,
    options: ViewEdgeNatureOptions) {
  
  const {viewEdges, camera, meshes, viewVertexMap} = viewmap;
  const handledHalfedges = new Set<Halfedge>();

  const _viewVertices = new Array<ViewVertex>(2);
  const _vertices = new Array<Vertex>(2);

  for (const mesh of meshes) {

    for (const face of mesh.hes.faces) {
      face.edges = new Array<ViewEdge>();
    }

    for (const halfedge of mesh.hes.halfedges) {

      if (!handledHalfedges.has(halfedge.twin)) {

        handledHalfedges.add(halfedge);

        const props = propsForViewEdge(halfedge, camera, options);

        if (props.nature !== ViewEdgeNature.None) {

          _vertices[0] = halfedge.vertex;
          _vertices[1] = halfedge.twin.vertex;

          // Get the viewmap points from the vertices or create them
          for (let i=0; i<2; i++) {

            const hash = hashVector3(_vertices[i].position);
            let viewVertex = viewVertexMap.get(hash);
            if (!viewVertex) {
              viewVertex = new ViewVertex();
              viewVertex.position.copy(_vertices[i].position);
              viewVertex.hash = hash;
              viewVertexMap.set(hash, viewVertex);
            }
            _viewVertices[i] = viewVertex;
          }

          // Point stores a set of vertices, so unicity is guaranted
          _viewVertices[0].vertices.add(_vertices[0]);
          _viewVertices[1].vertices.add(_vertices[1]);

    
          const viewEdge = new ViewEdge(_viewVertices[0], _viewVertices[1], halfedge);
          viewEdge.nature = props.nature;
          viewEdge.faceAngle = props.faceAngle;
          viewEdge.isConcave = props.isConcave;
          viewEdge.isBack = props.isBack;
          viewEdge.meshes.push(mesh);
          
          _viewVertices[0].viewEdges.add(viewEdge);
          _viewVertices[1].viewEdges.add(viewEdge);

          if (halfedge.face) {
            halfedge.face.edges.push(viewEdge);
            viewEdge.faces.push(halfedge.face);
          }

          if (halfedge.twin.face) {
            halfedge.twin.face.edges.push(viewEdge);
            viewEdge.faces.push(halfedge.twin.face);
          }

          viewEdges.push(viewEdge);
        }
      }
    }
  }
}

export function propsForViewEdge(
    halfedge: Halfedge,
    camera: PerspectiveCamera,
    options?: ViewEdgeNatureOptions) {

  const props = {
    nature: ViewEdgeNature.None,
    faceAngle: 0,
    isConcave: false,
    isBack: false,
  }

  const opt = {
    creaseAngle: {min: 80, max: 100},
    ...options
  }

  // If halfedge only has one connected face, then it is a boundary
  if (!halfedge.face || !halfedge.twin.face) {
    props.nature = ViewEdgeNature.Boundary;
  } else {
    const faceAFront = halfedge.face.isFront(camera.position);
    const faceBFront = halfedge.twin.face.isFront(camera.position);

    // If edge is between two back faces, then it is a back edge
    props.isBack = !faceAFront && !faceBFront;

    // Compute the angle between the 2 connected face
    halfedge.face.getNormal(_u);
    halfedge.twin.face.getNormal(_v);
    props.faceAngle = Math.acos(_u.dot(_v)) * 180 / Math.PI;

    // Concavity is determined by an orientation test
    props.isConcave = frontSide(
      halfedge.prev.vertex.position,
      halfedge.vertex.position,
      halfedge.next.vertex.position,
      halfedge.twin.prev.vertex.position);

    // If edge is between front and back face, then it is a silhouette edge
    if (faceAFront !== faceBFront) {
      
      props.nature = ViewEdgeNature.Silhouette;
    
    } else if(opt.creaseAngle.min <= props.faceAngle && 
              props.faceAngle <= opt.creaseAngle.max) {
      props.nature = ViewEdgeNature.Crease;
    }
  }

  return props;
}