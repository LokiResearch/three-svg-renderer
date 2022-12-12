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

import { 
  Vector2, 
  Vector3 } from "three";
// import { Vertex } from "three-mesh-halfedge";
import { hashVector2, hashVector3 } from "../../../utils";
import { ViewEdge } from "../ViewEdge";
import { Viewmap } from "../Viewmap";
import { ViewVertex } from "../ViewVertex";
import { createViewVertex } from "./createViewVertex";

const _u = new Vector3();
const _v = new Vector3();

const _vec3 = new Vector3();
const _u2 = new Vector2();
const _v2 = new Vector2();

export function splitViewEdge3d(
    viewmap: Viewmap,
    edge: ViewEdge,
    position: Vector3,
    // tolerance = 1e-10
) {

  /**
   *  We consider that position is on the infinite line formed by a and b
   * 
   *            p?          p?           p?
   *            x--a--------x---------b--x
   *                  edge 
   */

  const hash = hashVector3(position);
  
  if (edge.a.hash3d === hash) {
    return {
      viewVertex: edge.a,
      viewEdge: null
    };
  }
  if (edge.b.hash3d === hash) {
    return {
      viewVertex: edge.b,
      viewEdge: null
    };
  }

  _u.subVectors(position, edge.a.pos3d);
  _v.subVectors(edge.b.pos3d, edge.a.pos3d);


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

  const viewVertex = createViewVertex(viewmap, position);
  const viewEdge = splitViewEdgeWithViewVertex(viewmap, edge, viewVertex);

  return {
    viewVertex: viewVertex,
    viewEdge: viewEdge
  };
}

export function splitViewEdge2d(
    viewmap: Viewmap,
    edge: ViewEdge,
    position: Vector2) {
  // tolerance = 1e-10) {

  const hash = hashVector2(position);
  
  if (edge.a.hash2d === hash) {
    return {
      viewVertex: edge.a,
      viewEdge: null
    };
  }
  if (edge.b.hash2d === hash) {
    return {
      viewVertex: edge.b,
      viewEdge: null
    };
  }

  _u2.subVectors(position, edge.a.pos2d);
  _v2.subVectors(edge.b.pos2d, edge.a.pos2d);

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

  _vec3.lerpVectors(edge.a.pos3d, edge.b.pos3d, lengthU/lengthV);
  const viewVertex = createViewVertex(viewmap, _vec3);
  const viewEdge = splitViewEdgeWithViewVertex(viewmap, edge, viewVertex);

  return {
    viewVertex: viewVertex,
    viewEdge: viewEdge
  };
}

export function splitViewEdgeWithViewVertex(
    viewmap: Viewmap,
    edge: ViewEdge,
    vertex: ViewVertex) {

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

  vertex.viewEdges.push(edge);
  vertex.viewEdges.push(newEdge);

  b.viewEdges.remove(edge);
  b.viewEdges.push(newEdge);

  for (const face of newEdge.faces) {
    face.edges.push(newEdge);
  }

  viewmap.viewEdges.push(newEdge);

  return newEdge;
}
