// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 09/12/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md

import {PerspectiveCamera, Vector3, Vector2} from 'three';
import {Vertex, Face, HalfEdge} from 'three-mesh-halfedge'
import {Point} from './Point';
import {frontSide} from '../../utils/math';
import {SVGMesh} from '../svg/SVGMesh';

export enum EdgeNature {
  None = "None",
  Silhouette = "Silhouette",
  Boundary = "Boudary",
  SurfaceIntersection = "SurfaceIntersection",
  Crease = "Crease",
  Material = "Material",
}

const _vec2a = new Vector2();
const _vec2b = new Vector2();

const _u = new Vector3();
const _v = new Vector3();
const _cross = new Vector3();

export class Edge {
  readonly vertices: Array<Vertex>;
  readonly meshes: Array<SVGMesh>;
  readonly faces: Array<Face>;
  nature = EdgeNature.None;
  angle = Infinity;
  isBack = false;
  isConcave = false;

  constructor(meshes: Array<SVGMesh>, faces: Array<Face>, a: Vertex, b: Vertex) {
    this.meshes = meshes;
    this.vertices = [a,b];
    this.faces = faces;
  }

  updateNatureFromHalfEdge(halfEdge: HalfEdge, camera: PerspectiveCamera) {

    // this.halfEdge = halfEdge;

    if (halfEdge.twin) {

      this.isConcave = frontSide(
        halfEdge.vertex.position,
        halfEdge.next.vertex.position,
        halfEdge.prev.vertex.position,
        halfEdge.twin.prev.vertex.position) > 0;

      const faceAFront = halfEdge.face.isFront(camera.position);
      const faceBFront = halfEdge.twin.face.isFront(camera.position);

      // If edge is between two back faces, then it is a back edge
      this.isBack = !faceAFront && !faceBFront;

      // If edge is between front and back face, then it is a silhouette edge
      if (faceAFront !== faceBFront) {
        this.nature = EdgeNature.Silhouette;
      } else {

        const n1 = halfEdge.face.normal.normalize();
        const n2 = halfEdge.twin.face.normal.normalize();
        const angle = Math.acos(n1.dot(n2)) * 180 / Math.PI;
        if(80 < angle && angle < 100) {
          this.nature = EdgeNature.Crease;
        }
      }
    } else {
      // If edge only has one connected face, then it is a boundary
      this.nature = EdgeNature.Boundary;
    }
  }

  get points() {
    return [this.vertices[0].point, this.vertices[1].point];
  }

  get to(): {x: number, y: number} {
    return this.vertices[1].point.position;
  }

  get from(): {x: number, y: number} {
    return this.vertices[0].point.position;
  }

  clone(): Edge {
    return (new Edge([], [], this.vertices[0], this.vertices[1])).copy(this);
  }

  copy(source: Edge): Edge {
    this.meshes.clear();
    this.meshes.push(...source.meshes);
    this.faces.clear();
    this.faces.push(...source.faces);
    this.nature = source.nature;
    this.angle = source.angle;
    this.isBack = source.isBack;
    // this.halfEdge = source.halfEdge;
    this.replaceVertex(this.vertices[0], source.vertices[0]);
    this.replaceVertex(this.vertices[1], source.vertices[1]);
    this.isConcave = source.isConcave;
    return this;
  }

  replaceVertex(oldVertex: Vertex, newVertex: Vertex) {
    const index = this.vertices.indexOf(oldVertex);
    if (index !== -1) {
      this.vertices[index] = newVertex;
      return true;
    }
    return false;
  }

  otherVertex(vertex: Vertex) {
    if (vertex === this.vertices[0]) {
      return this.vertices[1];
    } else {
      return this.vertices[0];
    }
  }

  otherPoint(point: Point) {
    if (point === this.vertices[0].point) {
      return this.vertices[1].point;
    } else {
      return this.vertices[0].point;
    }
  }

  hasVertex(vertex: Vertex) {
    return this.vertices[0] === vertex || this.vertices[1] === vertex;
  }

  hasPoint(point: Point) {
    return this.vertices[0].point === point || this.vertices[1].point === point;
  }

  isConnectedToEdge(edge: Edge) {
    return this.hasPoint(edge.vertices[0].point) ||
           this.hasPoint(edge.vertices[1].point);
  }

  contains3dPosition(position: Vector3, tolerance = 1e-10) {

    _u.subVectors(this.vertices[0].position, position);
    _v.subVectors(this.vertices[1].position, position);
    _cross.crossVectors(_u, _v);

    return _cross.length() < tolerance && _u.dot(_v) < 0;
  }

  contains2dPosition(position: Vector2, tolerance = 1e-10) {
    _vec2a.subVectors(this.vertices[0].point.position, position);
    _vec2b.subVectors(this.vertices[1].point.position, position);

    return _vec2a.cross(_vec2b) < tolerance && _vec2a.dot(_vec2b) < 0;
  }

  normalAtPosition(point: Vector3, target: Vector3) {
    _u.subVectors(this.vertices[0].position, point);
    _v.subVectors(this.vertices[0].position, this.vertices[1].position);
    const ratio = _u.length() / _v.length();
    return target.lerpVectors(this.vertices[0].normal, this.vertices[1].normal, ratio);
  }

  position3dFromPosition2d(position: Vector2, target: Vector3) {
    _vec2a.subVectors(this.vertices[0].point.position, position);
    _vec2b.subVectors(this.vertices[0].point.position, this.vertices[1].point.position);
    const ratio = _vec2a.length() / _vec2b.length();
    return target.lerpVectors(this.vertices[0].position, this.vertices[1].position, ratio);
  }

}



