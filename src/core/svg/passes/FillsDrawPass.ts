// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 16/06/2022

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md 

import {DrawPass} from './DrawPass';
import {Viewmap} from '../../viewmap/Viewmap';
import {Svg, StrokeData, FillData, Element as SVGElement, Color as SVGColor,
  G as SVGGroup} from '@svgdotjs/svg.js';
import {getSVGPath, getSVGCircle, getSVGText} from '../svgutils';
import {Polygon} from '../../viewmap/Polygon';

export interface FillsDrawPassOptions {
  drawRaycastPoint: boolean;
  drawPolygonId: boolean;
  useRandomColors: boolean;
  useFixedFillColor: boolean;
}

export class FillsDrawPass extends DrawPass {
  readonly options: FillsDrawPassOptions;
  readonly fillStyle: FillData;

  constructor(
    options: Partial<FillsDrawPassOptions> = {}, 
    fillStyle: FillData = {}
  ) {
    super();

    this.options = {
      drawRaycastPoint: false,
      drawPolygonId: false,
      useRandomColors: false,
      useFixedFillColor: false,
      ...options
    };

    this.fillStyle = {
      color: "#333333",
      opacity: 1,
      ...fillStyle
    };
  }

  async draw(svg: Svg, viewmap: Viewmap) {

    const group = new SVGGroup({id: "fills"});
    svg.add(group);

    for (const mesh of viewmap.meshes) {

      const polygons = viewmap.polygons.filter(p => p.mesh === mesh);
      const objectGroup = new SVGGroup({id: mesh.name});
      group.add(objectGroup);

      for (const polygon of polygons) {
        drawPolygon(group, polygon, this.options, undefined, this.fillStyle);
      }
    }
  }
}

function drawPolygon(
  parent: SVGElement, 
  polygon: Polygon,
  options: FillsDrawPassOptions,
  strokeStyle: StrokeData = {},
  fillStyle: FillData = {}
) {

  // Make a copy of the style so we can modify it
  fillStyle = {...fillStyle};

  // If not using fixed color through the style, use the object color
  if (!options.useFixedFillColor) {
    fillStyle.color = '#'+polygon.color.getHexString();
  }
  
  if (options.useRandomColors) {
    fillStyle.color = SVGColor.random().toString();
  }

  const path = getSVGPath(polygon.contour, polygon.holes, true, strokeStyle, fillStyle);
  path.id("fill-"+polygon.id);
  parent.add(path);

  if (options.drawRaycastPoint) {
    drawPolygonRaycastPoint(path, polygon);
  }

  if (options.drawPolygonId) {
    drawPolygonId(path, polygon, fillStyle);
  }

}

function drawPolygonRaycastPoint(parent: SVGElement, polygon: Polygon) {
  const strokeStyle = {color: "black"};
  const fillStyle = {color: "white"};
  const cx = polygon.insidePoint.x;
  const cy = polygon.insidePoint.y;
  const point = getSVGCircle(cx, cy, 2, strokeStyle, fillStyle);
  point.id('raycast-point');
  parent.add(point);
}

function drawPolygonId(parent: SVGElement, polygon: Polygon, fillStyle: FillData) {
  const fontStyle = {size: 8};
  const delta = 10;
  const x = polygon.insidePoint.x + delta;
  const y = polygon.insidePoint.y + delta;

  const text = getSVGText(String(polygon.id), x, y, fontStyle)
  const box = text.bbox();

  const cx = x + box.width/2;
  const cy = y + box.height/2;

  const circle = getSVGCircle(cx, cy, 0.85*box.width, {}, fillStyle);
  circle.id('polygon-id');
  circle.add(text);

  parent.add(circle);
}