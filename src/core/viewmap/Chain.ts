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
import {Edge} from './Edge';
import {Point} from './Point';
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
  edges = new Array<Edge>();
  points = new Array<Point>();
  visibility: ChainVisibility = ChainVisibility.Unknown;

  constructor(id: number, object: SVGMesh) {
    this.id = id;
    this.object = object;
  }

  get head(): Point {
    return this.points[0]
  }

  get tail(): Point {
    return this.points[this.points.length -1];
  }

  get size(): number {
    return this.points.length;
  }

  get nature() {
    return this.edges[0].nature;
  }

  middlePoint(): Point {
    return this.points[Math.floor(this.points.length/2)];
  }

  middleEdge(): Edge | null {
    if (this.edges.length === 0) {
      return null;
    } else {
      return this.edges[Math.floor(this.edges.length/2)]
    }
  }

  addEdge(edge: Edge): void {
    if (this.edges.length == 0) {
      this.edges.push(edge);
      this.points.push(edge.vertices[0].point);
      this.points.push(edge.vertices[1].point);
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