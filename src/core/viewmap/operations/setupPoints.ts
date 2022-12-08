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

import { projectPoint } from "../../../utils";
import { Point } from "../Point";
import { Viewmap } from "../Viewmap";

/**
 * Assign a new {@link Point} to each vertex of the given edges if it hasn't one
 * @param edges 
 * @param camera 
 * @returns The new created points
 */
export function setupPoints(viewmap: Viewmap) {

  const {points, edges, camera, renderSize} = viewmap;

  for (const edge of edges) {
    for (const vertex of edge.vertices) {
      if (!vertex.point) {
        
        vertex.point = new Point();
        projectPoint(vertex.position, vertex.point.position, camera, renderSize);
        vertex.point.vertices.push(vertex);

        points.push(vertex.point);      
      }
    }
  }
}