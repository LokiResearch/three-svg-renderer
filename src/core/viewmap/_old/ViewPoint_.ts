import {Vector2} from 'three';
import {ViewEdge} from '../ViewEdge';
import { vectors2Equal } from '../../../utils';
import { ViewVertex } from '../ViewVertex';

export enum ViewPointSingularity {
  None = "None",
  ImageIntersection = "ImageIntersection",
  MeshIntersection = "MeshIntersection",
  CurtainFold = "CurtainFold",
  Bifurcation = "Bifurcation",
}

export class ViewPoint {

  hash = "";

  readonly position = new Vector2();
  readonly vertices = new Set<ViewVertex>();

  visible = false;
  singularity = ViewPointSingularity.None;

  get x() {
    return this.position.x;
  }

  get y() {
    return this.position.y;
  }

  // /**
  //  * Return the common edge between this point and the other if any, otherwise 
  //  * returns null.
  //  */
  // connectedTo(other: ViewPoint) {
  //   for (const edge of this.edges) {
  //     for (const v of this.vertices) {

  //     }
  //     if (other.edges.has(edge)) {
  //       return edge;
  //     }
  //   }
  //   return null;
  // }

  get edges() {

    // Todo use array

    const set = new Set<ViewEdge>();

    for (const v of this.vertices) {
      for(const e of v.viewEdges) {
        set.add(e);
      }
    }
    return Array.from(set);
  }

  matchesPosition(position: Vector2, tolerance = 1e-10) {
    return vectors2Equal(this.position, position, tolerance);
  }


}