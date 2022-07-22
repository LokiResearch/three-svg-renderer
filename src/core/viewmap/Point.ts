import {Vector2} from 'three';
import {Edge} from './Edge';
import {Vertex} from 'three-mesh-halfedge';

export enum PointSingularity {
  None = "None",
  ImageIntersection = "ImageIntersection",
  MeshIntersection = "MeshIntersection",
  CurtainFold = "CurtainFold",
  Bifurcation = "Bifurcation",
}

const _u = new Vector2();

export class Point {

  readonly position: Vector2;
  visible = false;
  singularity = PointSingularity.None;

  vertices: Array<Vertex>;

  constructor(position: Vector2, vertices: Array<Vertex>) {
    this.position = position;
    this.vertices = vertices;
  }

  get x() {
    return this.position.x;
  }

  get y() {
    return this.position.y;
  }

  get edges() {
    const set = new Set<Edge>();
    for (const v of this.vertices) {
      for(const e of v.edges) {
        set.add(e);
      }
    }
    return Array.from(set);
  }

  matchPosition(position: Vector2, tolerance = 1e-10) {
    _u.subVectors(position, this.position);
    return _u.length() < tolerance;
  }
}