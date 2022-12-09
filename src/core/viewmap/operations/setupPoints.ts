/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Thu Nov 24 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { hashVector2, projectPoint } from "../../../utils";
import { ViewPoint } from "../ViewPoint";
import { Viewmap } from "../Viewmap";
import { DefaultViewPoint, ViewVertex } from "../ViewVertex";
import { Vector2 } from "three";

const _vec = new Vector2();

/**
 * Assign a new {@link ViewPoint} to each vertex of the given edges if it hasn't one
 * @param edges 
 * @param camera 
 * @returns The new created points
 */
export function setupPoints(viewmap: Viewmap) {

  const {viewEdges} = viewmap;

  for (const edge of viewEdges) {
    for (const vertex of edge.vertices) {
      setupViewPoint(viewmap, vertex);
    }
  }
}

export function setupViewPoint(viewmap: Viewmap, vertex: ViewVertex) {

  const {viewPointMap, camera, renderSize} = viewmap;

  if (vertex.viewPoint === DefaultViewPoint) {

    projectPoint(vertex.position, _vec, camera, renderSize);

    const hash = hashVector2(_vec);
    let viewPoint = viewPointMap.get(hash);

    if (!viewPoint) {

      viewPoint = new ViewPoint();
      viewPoint.position.copy(_vec);
      viewPoint.hash = hash;
      viewPointMap.set(hash, viewPoint);
      
    }

    vertex.viewPoint = viewPoint;
    viewPoint.vertices.add(vertex);

  }

  return vertex.viewPoint;

}