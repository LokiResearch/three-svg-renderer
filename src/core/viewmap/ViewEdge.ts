// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 09/12/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md

import { Vector2, Vector3 } from 'three';
import { Face, Halfedge } from 'three-mesh-halfedge';
import { SVGMesh } from '../SVGMesh';
import { ViewPoint } from './ViewPoint';
import { ViewVertex } from './ViewVertex';

/**
 * Possible values for the edge nature in the viemap.
 */
export enum ViewEdgeNature {
  /** Edge is standard */
  None = "None",
  /** Edge is connected to front-facing and a back-facing face */
  Silhouette = "Silhouette",
  /** Edge is only connected to one face */
  Boundary = "Boundary",
  /** Edge is on the intersection between two meshes */
  MeshIntersection = "MeshIntersection",
  /** Edge is connected to two faces where the angle between normals is acute */
  Crease = "Crease",
  /** Edge is connected to two faces using a different material/vertex color */
  Material = "Material",
}

const _u2 = new Vector2();
const _v2 = new Vector2();

const _u = new Vector3();
const _v = new Vector3();
// const _cross = new Vector3();

export class ViewEdge {

  /**
   * Halfedge on which the edge is based on
   * @defaultValue null
   */
  halfedge: Halfedge | null;

  /**
   * List of the meshes the Edge belongs to
   */
  readonly meshes = new Array<SVGMesh>();
  
  /** 
   * Nature of the edge
   * @defautValue EdgeNature.None 
   */
  nature = ViewEdgeNature.None;

  /** 
   * Angle between to the connected faces.
   * @defaultValue Infinity */
  faceAngle = Infinity;

  /**
   * Indicates whether the edge is connected to back-facing faces only 
   * *Note: this makes only sense with 2 connected faces.*
   * @defaultValue false
  */
  isBack = false;
  
  /**
   * Indicates wheter the edge is concave. 
   * *Note: this makes only sense with 2 connected faces.*
   * @defaultValue false
   */
  isConcave = false;


  faces = new Array<Face>();

  a: ViewVertex;
  b: ViewVertex;

  constructor(a: ViewVertex, b: ViewVertex, halfedge?: Halfedge) {
    this.a = a;
    this.b = b;
    this.halfedge = halfedge ?? null;
  }

  get vertices() {
    return [this.a, this.b];
  }

  get points() {
    return [this.a.viewPoint, this.b.viewPoint];
  }

  get from(): Vector2 {
    return this.a.viewPoint.position;
  }

  get to(): Vector2 {
    return this.b.viewPoint.position;
  }

  // get faces(): Face[] {
  //   const faces = [];
  //   if (this.halfedge?.face) {
  //     faces.push(this.halfedge.face);
  //   }
  //   if (this.halfedge?.twin.face) {
  //     faces.push(this.halfedge.twin.face);
  //   }
  //   return faces;
  // }

  toJSON() {

    return {
      id: [...this.a.vertices].map(v => v.id).join(',') + '-' + 
          [...this.b.vertices].map(v => v.id).join(','),
    }
  }

  clone() {
    const edge =  new ViewEdge(this.a, this.b);
    edge.nature = this.nature;
    edge.faceAngle = this.faceAngle;
    edge.isBack = this.isBack;
    edge.isConcave = this.isConcave;
    edge.meshes.push(...this.meshes);
    edge.halfedge = this.halfedge;
    edge.faces.push(...this.faces);
    return edge;
  }


  otherVertex(vertex: ViewVertex) {
    if (vertex === this.a) {
      return this.b;
    } else {
      return this.a;
    }
  }

  otherPoint(point: ViewPoint) {
    if (point === this.a.viewPoint) {
      return this.b.viewPoint;
    } else {
      return this.a.viewPoint;
    }
  }

  hasVertex(vertex: ViewVertex) {
    return this.a === vertex || this.b === vertex;
  }

  hasPoint(point: ViewPoint) {
    return this.a.viewPoint === point || this.b.viewPoint === point;
  }

  isConnectedToEdgeIn3D(edge: ViewEdge) {
    return this.hasVertex(edge.a) || this.hasVertex(edge.b);
  }

  isConnectedToEdgeIn2D(edge: ViewEdge) {
    return this.hasPoint(edge.a.viewPoint) || this.hasPoint(edge.b.viewPoint);
  }



  // contains3dPosition(position: Vector3, tolerance = 1e-10) {

  //   _u.subVectors(this.b.position, this.a.position);
  //   _v.subVectors(position, this.a.position);
  //   // _cross.crossVectors(_u, _v);
  //   const r = _u.dot(_v)/_v.length();
  //   return tolerance <= r && r <= 1-tolerance; 
  //   // return _cross.length() < tolerance && _u.dot(_v)/dot < 0;
  // }



  contains2dPosition(position: Vector2, tolerance = 1e-10) {
    
    if (this.a.viewPoint.matchesPosition(position, tolerance)) {
      return 0;
    }
    if (this.b.viewPoint.matchesPosition(position, tolerance)) {
      return 1;
    }
  
    _u2.subVectors(position, this.a.viewPoint.position);
    _v2.subVectors(this.b.viewPoint.position, this.a.viewPoint.position);
  
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

    return lengthU/lengthV;
  }

  // normalAtPosition(point: Vector3, target: Vector3) {
  //   _u.subVectors(this.vertices[0].position, point);
  //   _v.subVectors(this.vertices[0].position, this.vertices[1].position);
  //   const ratio = _u.length() / _v.length();
  //   return target.lerpVectors(this.vertices[0].normal, this.vertices[1].normal, ratio);
  // }

  // position3dFromPosition2d(position: Vector2, target: Vector3) {
  //   _vec2a.subVectors(this.a.point.position, position);
  //   _vec2b.subVectors(this.b.point.position, this.a.point.position);
  //   const ratio = _vec2a.length() / _vec2b.length();
  //   return target.lerpVectors(this.a.position, this.b.position, ratio);
  // }

}



