// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 23/02/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md

import {Vector2} from 'three';
import {ViewEdge} from './ViewEdge';
import {ViewPoint} from './ViewPoint';
import { SVGMesh } from '../SVGMesh';

export enum ChainVisibility {
  Unknown = "Unknown",
  Hidden = "Hidden",
  Visible = "Visible",
}

export class Chain {
  id: number;
  object: SVGMesh;
  raycastPoint = new Vector2();
  edges = new Array<ViewEdge>();
  points = new Array<ViewPoint>();
  visibility: ChainVisibility = ChainVisibility.Unknown;

  constructor(id: number, object: SVGMesh) {
    this.id = id;
    this.object = object;
  }

  get head(): ViewPoint {
    return this.points[0]
  }

  get tail(): ViewPoint {
    return this.points[this.points.length -1];
  }

  get size(): number {
    return this.points.length;
  }

  get nature() {
    return this.edges[0].nature;
  }

  middlePoint(): ViewPoint {
    return this.points[Math.floor(this.points.length/2)];
  }

  middleEdge(): ViewEdge | null {
    if (this.edges.length === 0) {
      return null;
    } else {
      return this.edges[Math.floor(this.edges.length/2)]
    }
  }

  addEdge(edge: ViewEdge): void {
    if (this.edges.length == 0) {
      this.edges.push(edge);
      this.points.push(edge.vertices[0].viewPoint);
      this.points.push(edge.vertices[1].viewPoint);
    } else {
      if (edge.hasPoint(this.head)) {
        // Put vertex and segment in the head of the lists
        this.points.unshift(edge.otherPoint(this.head));
        this.edges.unshift(edge);
      } else if (edge.hasPoint(this.tail)) {
        // Put vertex and segment in the tail of the lists
        this.points.push(edge.otherPoint(this.tail));
        this.edges.push(edge);
      }
    }
  }
}