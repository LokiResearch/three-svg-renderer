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

import { Vector2, Vector3 } from "three";
import { Vertex } from "three-mesh-halfedge";
import { Edge } from "../Edge";
import { Viewmap } from "../Viewmap";

const _u = new Vector3();
const _v = new Vector3();

const _vec3 = new Vector3();
const _u2 = new Vector2();
const _v2 = new Vector2();

export function splitEdgeAt3dPosition(
    viewmap: Viewmap,
    edge: Edge,
    position: Vector3,
    tolerance = 1e-10) {

  /**
   *  We consider that position is on the infinite line formed by a and b
   * 
   *            p?          p?           p?
   *            x--a--------x---------b--x
   *                  edge 
   */   
  
  if (edge.a.matchesPosition(position, tolerance)) {
    return {
      vertex: edge.a,
      newEdge: null
    };
  }
  if (edge.b.matchesPosition(position, tolerance)) {
    return {
      vertex: edge.b,
      newEdge: null
    };
  }

  _u.subVectors(position, edge.a.position);
  _v.subVectors(edge.b.position, edge.a.position);


  const cross = _u.cross(_v);
  const v = cross.x + cross.y + cross.z;
  if (v > 1e-10 || v < -1e-10) {
    return null;
  }

  if (_u.dot(_v) < -1e-10) {
    return null;
  }

  const lengthU = _u.length();
  const lengthV = _v.length();

  if (lengthU > lengthV) {
    return null;
  }

  // Now that we know point is between a and b, we can find the 3d position
  // of the new vertex that cuts the edge
  const vertex = new Vertex();
  vertex.edges = new Array<Edge>();
  vertex.position.copy(position);

  const newEdge = splitEdgeWithVertex(viewmap, edge, vertex);

  return {
    vertex: vertex,
    newEdge: newEdge
  };
}

export function splitEdgeAt2dPosition(
    viewmap: Viewmap,
    edge: Edge,
    position: Vector2,
    tolerance = 1e-10) {

  
  if (edge.a.point.matchesPosition(position, tolerance)) {
    return {
      vertex: edge.a,
      newEdge: null
    };
  }
  if (edge.b.point.matchesPosition(position, tolerance)) {
    return {
      vertex: edge.b,
      newEdge: null
    };
  }

  _u2.subVectors(position, edge.a.point.position);
  _v2.subVectors(edge.b.point.position, edge.a.point.position);

  // Check points are aligned
  const cross = _u2.cross(_v2);
  if (cross > 1e-10 || cross < -1e-10) {
    return null;
  }

  const lengthU = _u2.length();
  const lengthV = _v2.length();

  if (lengthU > lengthV) {
    return null;
  }

  // Check points order
  if (_u.dot(_v) < -1e10) {
    return null;
  }

  _vec3.lerpVectors(edge.a.position, edge.b.position, lengthU/lengthV);
  
  // Now that we know point is between a and b, we can find the 3d position
  // of the new vertex that cuts the edge
  const vertex = new Vertex();
  vertex.edges = new Array<Edge>();
  vertex.position.copy(_vec3);

  const newEdge = splitEdgeWithVertex(viewmap, edge, vertex);

  return {
    vertex: vertex,
    newEdge: newEdge
  };
}

export function splitEdgeWithVertex(
    viewmap: Viewmap,
    edge: Edge,
    vertex: Vertex) {

  /**
   *  Update the references around the new vertex
   *            
   *                       vertex
   *            ---a--------x---------b--
   *                  edge      newedge
   */

  const b = edge.b;

  const newEdge = edge.clone();
  edge.b = vertex;
  newEdge.a = vertex;
  newEdge.b = b;

  vertex.edges.push(edge, newEdge);

  b.edges.remove(edge);
  b.edges.push(newEdge);

  for (const face of newEdge.faces) {
    face.edges.push(newEdge);
  }

  viewmap.edges.push(newEdge);

  return newEdge;
}
