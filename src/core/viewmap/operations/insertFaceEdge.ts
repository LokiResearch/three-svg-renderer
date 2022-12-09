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
import { Face, Vertex } from "three-mesh-halfedge";
import { intersectLines } from "../../../utils";
import { ViewEdge } from "../ViewEdge";
import { Viewmap } from "../Viewmap";
import { splitEdgeAt3dPosition, 
  splitEdgeWithVertex
} from "./splitEdge";

const _line = new Line3();
const _vec = new Vector3();
const _edgeDir = new Vector3();
const _dir = new Vector3();

export function insertFaceEdge(
    viewmap: Viewmap, 
    face: Face,
    line: Line3,
    tolerance = 1e-10) {
  
  const split1 = splitFaceEdges(viewmap, face, line.start, tolerance);
  let v1;
  if (split1) {
    v1 = split1.vertex;
  } else {
    v1 = createVertex(line.start);
  }

  const split2 = splitFaceEdges(viewmap, face, line.end, tolerance);
  let v2;
  if (split2) {
    v2 = split2.vertex;
  } else {
    v2 = createVertex(line.end);
  }

  // Check if v1 and v2 are already connected
  for (const e of v1.edges) {
    if (e.hasVertex(v2)) {
      // console.log("Already connected");
      return [e];
    }
  }

  const edge = new ViewEdge(v1, v2);
  v1.edges.push(edge);
  v2.edges.push(edge);

  // Check if the new edge intersects edges in the triangle area it is not
  // connected with yet and get all the intersection vertices
  const splitVertices = new Array<Vertex>();

  const faceEdgesCopy = [...face.edges];

  for (const faceEdge of faceEdgesCopy) {

    if (!edge.isConnectedToEdgeIn3D(faceEdge)) {

      _line.start.copy(faceEdge.a.position);
      _line.end.copy(faceEdge.b.position);
      
      if (intersectLines(_line, line, _vec)) {

        const splitResult = splitEdgeAt3dPosition(viewmap, faceEdge, _vec, tolerance);

        if (splitResult) {

          const {vertex} = splitResult;
          
          // It possible that the inserted edge intersects multiple existing face 
          // edges on the same vertex, so we gather it only once
          if (!splitVertices.includes(vertex)) {
            splitVertices.push(vertex);
          }

        } else {
          console.error("Edges should intersect", [edge, faceEdge], _vec);
        }
      }
    }
  }

  // Update face refs beforce spliting
  viewmap.edges.push(edge);
  face.edges.push(edge);
  edge.faces.push(face);

  // Order the vertices along the edge
  _edgeDir.subVectors(edge.b.position, edge.a.position);
  splitVertices.sort((a: Vertex, b: Vertex) => {
    _dir.subVectors(b.position, a.position);
    return _edgeDir.dot(_dir);
  });

  // Cut the new edge with the vertices
  // Since vertices are ordered from edge.a to edge.b, we only need to recursively
  // split the new edge from [splitVertex, b]
  const newEdges = [edge];
  let workingEdge = edge;
  for (const vertex of splitVertices) {
    workingEdge = splitEdgeWithVertex(viewmap, workingEdge, vertex);
    newEdges.push(workingEdge);
  }

  return newEdges; 
}

export function createVertex(position: Vector3) {
  const v = new Vertex();
  v.edges = new Array<ViewEdge>();
  v.position.copy(position);
  return v;
}


export function splitFaceEdges(
    viewmap: Viewmap,
    face: Face,
    position: Vector3,
    tolerance = 1e-10) {

  for (const edge of face.edges) {

    const splitResult = splitEdgeAt3dPosition(viewmap, edge, position, tolerance);

    if (splitResult) {
      return splitResult;
    }
  }

  for (const halfedge of face.halfedge.nextLoop()) {

    const neighborFace = halfedge.twin.face;

    if (neighborFace) {

      for (const edge of neighborFace.edges) {

        const splitResult = splitEdgeAt3dPosition(viewmap, edge, position, tolerance);
        
        if (splitResult) {
          return splitResult;
        }
      }
    }
  }


  for (const edge of face.edges) {

    if (edge.a.matchesPosition(position) || 
      edge.b.matchesPosition(position)) {
      console.log("MATCHES BUT NULL WTF");
    }


  }


  return null;
}