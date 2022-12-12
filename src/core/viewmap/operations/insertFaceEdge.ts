/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Wed Nov 30 2022
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
import { ViewEdge } from "../ViewEdge";
import { Viewmap } from "../Viewmap";
import { ViewVertex } from "../ViewVertex";
import { createViewVertex } from "./createViewVertex";
import { splitViewEdge3d, 
  splitViewEdgeWithViewVertex
} from "./splitEdge";

const _line = new Line3();
const _vec = new Vector3();
const _lineDir = new Vector3();
const _dir = new Vector3();

export function insertFaceEdge(
    viewmap: Viewmap, 
    face: Face,
    line: Line3) {
  
  const split1 = splitFaceEdges(viewmap, face, line.start);
  let v1;
  if (split1) {
    v1 = split1.viewVertex;
  } else {
    v1 = createViewVertex(viewmap, line.start);
  }

  const split2 = splitFaceEdges(viewmap, face, line.end);
  let v2;
  if (split2) {
    v2 = split2.viewVertex;
  } else {
    v2 = createViewVertex(viewmap, line.end);
  }

  // By commenting this, we allow multiple view edges between a same pair of
  // viewvertices
  // const commonViewEdge = v1.commonViewEdgeWith(v2);
  // if (commonViewEdge !== null) {
  //   return [commonViewEdge];
  // }

  const viewEdge = new ViewEdge(v1, v2);
  v1.viewEdges.push(viewEdge);
  v2.viewEdges.push(viewEdge);

  // Check if the new edge intersects edges in the triangle area it is not
  // connected with yet and get all the intersection vertices
  const splitVertices = new Array<ViewVertex>();

  const faceEdgesCopy = [...face.edges];

  for (const faceEdge of faceEdgesCopy) {

    if (!viewEdge.isConnectedTo(faceEdge)) {

      _line.start.copy(faceEdge.a.pos3d);
      _line.end.copy(faceEdge.b.pos3d);
      
      if (intersectLines(_line, line, _vec)) {

        const splitResult = splitViewEdge3d(viewmap, faceEdge, _vec);

        if (splitResult) {

          const {viewVertex} = splitResult;
          
          // It possible that the inserted edge intersects multiple existing face 
          // edges on the same vertex, so we gather it only once
   
          if (!splitVertices.includes(viewVertex)) {
            splitVertices.push(viewVertex);
          }

        } else {
          console.error("Edges should intersect", [viewEdge, faceEdge], _vec);
        }
      }
    }
  }

  // Update face refs beforce spliting
  viewmap.viewEdges.push(viewEdge);
  face.edges.push(viewEdge);
  viewEdge.faces.push(face);

  // Order the vertices along the edge
  _lineDir.subVectors(viewEdge.b.pos3d, viewEdge.a.pos3d);
  splitVertices.sort((a: ViewVertex, b: ViewVertex) => {
    _dir.subVectors(b.pos3d, a.pos3d);
    return _lineDir.dot(_dir);
  });

  // Cut the new edge with the vertices
  // Since vertices are ordered from edge.a to edge.b, we only need to recursively
  // split the new edge from [splitVertex, b]
  const newEdges = [viewEdge];
  let workingEdge = viewEdge;
  for (const vertex of splitVertices) {
    workingEdge = splitViewEdgeWithViewVertex(viewmap, workingEdge, vertex);
    newEdges.push(workingEdge);
  }

  return newEdges; 
}

export function splitFaceEdges(
    viewmap: Viewmap,
    face: Face,
    position: Vector3) {
  // tolerance = 1e-10) {

  for (const edge of face.edges) {

    const splitResult = splitViewEdge3d(viewmap, edge, position);

    if (splitResult) {
      return splitResult;
    }
  }

  for (const halfedge of face.halfedge.nextLoop()) {

    const neighborFace = halfedge.twin.face;

    if (neighborFace) {

      for (const edge of neighborFace.edges) {

        const splitResult = splitViewEdge3d(viewmap, edge, position);
        
        if (splitResult) {
          return splitResult;
        }
      }
    }
  }

  return null;
}