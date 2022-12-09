/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Fri Dec 09 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { Vector3 } from "three";
import { Vertex } from "three-mesh-halfedge";
import { ViewEdge } from "./ViewEdge";
import { ViewPoint } from "./ViewPoint";

export const DefaultViewPoint = new ViewPoint();

export class ViewVertex {

  hash = "";

  viewPoint = DefaultViewPoint;

  readonly vertices = new Set<Vertex>();
  
  readonly position = new Vector3();

  readonly viewEdges = new Set<ViewEdge>();

}
