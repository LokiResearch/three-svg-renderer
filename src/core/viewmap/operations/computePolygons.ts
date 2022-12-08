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

import Arrangement2D from 'arrangement-2d-js';
import {Vector2} from 'three';
import { ChainVisibility } from '../Chain';
import {Polygon} from '../Polygon';
import { Viewmap } from '../Viewmap';

// Make the wrapper a global promise so it is load once
const Arr2DPromise = Arrangement2D();

export class PolygonsInfo{
  smallAreaIgnored = Infinity;
  insidePointErrors = Infinity;
}

export async function computePolygons(
    viewmap: Viewmap,
    info = new PolygonsInfo()) {

  const {chains, polygons} = viewmap;
  const Arr2D = await Arr2DPromise;

  const visibleChains = chains.filter(c => c.visibility === ChainVisibility.Visible);

  const points = new Arr2D.PointList();
  let a, b;
  for (const chain of visibleChains) {
    a = new Arr2D.Point(chain.points[0].x, chain.points[0].y);
    for (let i=1; i<chain.points.length; i++) {
      b = new Arr2D.Point(chain.points[i].x, chain.points[i].y);
      points.push_back(a);
      points.push_back(b);
      a = b;
    }
  }

  const builder = new Arr2D.ArrangementBuilder();
  const arr2DPolygonlist = builder.getPolygons(points);

  const p = new Arr2D.Point();
  info.smallAreaIgnored = 0;
  info.insidePointErrors = 0;

  for (let i=0; i<arr2DPolygonlist.size(); i++) {
    const arr2DPolygon = arr2DPolygonlist.at(i);

    const area = arr2DPolygon.getPolyTristripArea();

    if (area > 1e-10) {

      // Transform types from the Arrangement2D to more friendly three types
      const contour = convertContour(arr2DPolygon.contour);
      const holes = convertContourList(arr2DPolygon.holes);
      const polygon = new Polygon(i, contour, holes);

      if (arr2DPolygon.getInsidePoint(p)) {
        polygon.insidePoint.set(p.x, p.y);
        polygons.push(polygon);
      } else {
        info.insidePointErrors += 1;
      }

    } else {
      info.smallAreaIgnored += 1;
    }
    
    Arr2D.destroy(arr2DPolygon);
  }
  Arr2D.destroy(arr2DPolygonlist);
  Arr2D.destroy(p);
}

export function convertContourList(
    vector: Arrangement2D.ContourList) : Array<Array<Vector2>> {

  const array = new Array<Array<Vector2>>();
  for (let i=0; i<vector.size(); i++) {
    array.push(convertContour(vector.at(i)));
  }
  return array;
}

export function convertContour(
    contour: Arrangement2D.Contour) : Array<Vector2> {
  
  const array = new Array<Vector2>();
  for (let i=0; i<contour.size(); i++) {
    const p = contour.at(i);
    array.push(new Vector2(p.x, p.y));
  }
  return array;
}
