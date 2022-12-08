import {Vector2, Vector3} from 'three';
import {Edge} from './Edge';
import {Vertex} from 'three-mesh-halfedge';
import { vectors2Equal } from '../../utils';

export enum PointSingularity {
  None = "None",
  ImageIntersection = "ImageIntersection",
  MeshIntersection = "MeshIntersection",
  CurtainFold = "CurtainFold",
  Bifurcation = "Bifurcation",
}

export class Point {

  hash3d = "";

  readonly pos3d = new Vector3();
  readonly pos2d = new Vector2();
  readonly vertices = new Set<Vertex>();
  readonly edges = new Set<Edge>();

  visible = false;
  singularity = PointSingularity.None;

  get x() {
    return this.position.x;
  }

  get y() {
    return this.position.y;
  }

  /**
   * Return the common edge between this point and the other if any, otherwise 
   * returns null.
   */
  connectedTo(other: Point) {
    for (const edge of this.edges) {
      if (other.edges.has(edge)) {
        return edge;
      }
    }
    return null;
  }

  // get edges() {
  //   const set = new Set<Edge>();
  //   for (const v of this.vertices) {
  //     for(const e of v.edges) {
  //       set.add(e);
  //     }
  //   }
  //   return Array.from(set);
  // }

  matchesPosition(position: Vector2, tolerance = 1e-10) {
    return vectors2Equal(this.position, position, tolerance);
  }


}