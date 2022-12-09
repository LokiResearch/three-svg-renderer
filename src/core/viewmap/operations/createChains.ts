/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Tue Nov 22 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { SVGMesh } from "../../SVGMesh";
import { Chain } from "../Chain";
import { ViewEdge } from "../ViewEdge";
import { ViewPoint, ViewPointSingularity } from "../ViewPoint";
import { Viewmap } from "../Viewmap";


// See chaining section of https://hal.inria.fr/hal-02189483
export function createChains(viewmap: Viewmap) {

  console.log(viewmap);
  const {viewEdges, chains} = viewmap;
  const remainingEdges = new Set(viewEdges);

  let chainId = 0;
  while(remainingEdges.size > 0) {
    const [startEdge] = remainingEdges;
    const currentObject = startEdge.meshes[0];
    const chain = new Chain(chainId, currentObject);

    remainingEdges.delete(startEdge);
    chain.addEdge(startEdge);

    // Search for connected edges from one direction
    for (const startPoint of startEdge.points) {
      let point = startPoint;
      let edge = nextChainEdgeFromPoint(startEdge, point, remainingEdges, currentObject);

      while (edge) {
        remainingEdges.delete(edge);
        chain.addEdge(edge);
        point = edge.otherPoint(point);
        edge = nextChainEdgeFromPoint(edge, point, remainingEdges, currentObject);
      }
    }
    chains.push(chain);
    chainId += 1;
  }
}

export function nextChainEdgeFromPoint(
    currentEdge: ViewEdge,
    point: ViewPoint,
    remainingEdges: Set<ViewEdge>,
    obj: SVGMesh) : ViewEdge | null {

  // If point is a singularity, chaining stops
  if (point.singularity !== ViewPointSingularity.None) {
    return null;
  }

  // TODO: Taking into account the nature of the current segment and geometric
  // properties to build longer chains
  for (const edge of point.edges) {

    const takeEdge = 
      // Take edge only if it has not been assigned yet
      remainingEdges.has(edge) &&
      // Next edge must have the same nature of the current edge
      edge.nature === currentEdge.nature &&
      // Next edge must be part of the same object
      edge.meshes.includes(obj);

    if (takeEdge) {
      return edge;
    }
  }
  return null;
}