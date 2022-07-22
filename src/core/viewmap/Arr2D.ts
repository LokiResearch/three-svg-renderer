// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 23/01/2022

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md

import Arrangement2D from 'arrangement-2d-js';
import {Vector2} from 'three';
import {Contour} from './Contour';
import {Polygon} from './Polygon';

// Make the wrapper a global promise so it is load once
const Arr2DPromise = Arrangement2D();

export async function computePolygons(contours: Array<Contour>) {

  const Arr2D = await Arr2DPromise;

  const points = new Arr2D.PointList();
  let a, b;
  for (const contour of contours) {
    a = new Arr2D.Point(contour.points[0].x, contour.points[0].y);
    for (let i=1; i<contour.points.length; i++) {
      b = new Arr2D.Point(contour.points[i].x, contour.points[i].y);
      points.push_back(a);
      points.push_back(b);
      a = b;
    }
  }

  const builder = new Arr2D.ArrangementBuilder();
  const arr2DPolygonlist = builder.getPolygons(points);

  const p = new Arr2D.Point();
  const polygons = new Array<Polygon>();
  let nbIgnored = 0;
  let nbErrors = 0;

  for (let i=0; i<arr2DPolygonlist.size(); i++) {
    const arr2DPolygon = arr2DPolygonlist.at(i);

    const area = arr2DPolygon.getPolyTristripArea();

    if (area > 1e-10) {

      // Transform contour and holes from the Arrangement2D to more friendly three types
      const contour = convertContour(arr2DPolygon.contour);
      const holes = convertContourList(arr2DPolygon.holes);
      const insidePoint = new Vector2();

      if (arr2DPolygon.getInsidePoint(p)) {
        insidePoint.set(p.x, p.y);
        const polygon = new Polygon(i, contour, holes, insidePoint);
        polygons.push(polygon);

      } else {
        console.error("Could not obtain a point inside a CGAL region.");
        nbErrors += 1;
      }

    } else {
      nbIgnored += 1;
    }
    
    Arr2D.destroy(arr2DPolygon);
  }
  Arr2D.destroy(arr2DPolygonlist);
  Arr2D.destroy(p);

  return {
    polygons: polygons,
    nbErrors: nbErrors,
    nbIgnored: nbIgnored
  };
}

export function convertContourList(
    vector: Arrangement2D.ContourList
) : Array<Array<Vector2>> {

  const array = new Array<Array<Vector2>>();
  for (let i=0; i<vector.size(); i++) {
    array.push(convertContour(vector.at(i)));
  }
  return array;
}

export function convertContour(
    contour: Arrangement2D.Contour
) : Array<Vector2> {
  const array = new Array<Vector2>();
  for (let i=0; i<contour.size(); i++) {
    const p = contour.at(i);
    array.push(new Vector2(p.x, p.y));
  }
  return array;
}
