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
import {Svg, StrokeData, G as SVGGroup, Element as SVGElement, Color as SVGColor,
} from '@svgdotjs/svg.js';
import {Contour, ContourVisibility} from '../../viewmap/Contour';
import {EdgeNature} from '../../viewmap/Edge';
import {getSVGPath, getSVGCircle, getSVGText} from '../svgutils';

const EdgeNatures = Object.values(EdgeNature)
  .filter(nature => nature !== EdgeNature.None);

export interface ContoursDrawPassOptions {
  useRandomColors: boolean;
  groupByNature: boolean;
  drawContourId: boolean; 
  drawRaycastPoint: boolean;
}

export abstract class ContoursDrawPass extends DrawPass {
  readonly options: ContoursDrawPassOptions;
  readonly strokeStyle: StrokeData;

  constructor(
      strokeStyle: StrokeData = {},
      options: Partial<ContoursDrawPassOptions> = {}, 
  ) {
    super();

    this.options = {
      drawContourId: false,
      drawRaycastPoint: false,
      useRandomColors: false,
      groupByNature: true,
      ...options
    }

    this.strokeStyle = {
      color: "#000000",
      width: 1,
      dasharray: "",
      linecap: "butt",
      linejoin: "miter",
      opacity: 1,
      dashoffset: 0,
      ...strokeStyle
    }
  }
}

export class VisibleContoursDrawPass extends ContoursDrawPass {

  constructor(
      strokeStyle: StrokeData = {},
      options: Partial<ContoursDrawPassOptions> = {}, 
  ) {
    super(strokeStyle, options);
  }

  async draw(svg: Svg, viewmap: Viewmap) {
    const contours = viewmap.contours.filter(
      contour => contour.visibility === ContourVisibility.Visible
    );

    const group = new SVGGroup({id: "visible-contours"});
    drawContours(group, viewmap, contours, this.options, this.strokeStyle);
    svg.add(group);
  }
}


export class HiddenContoursDrawPass extends ContoursDrawPass {

  constructor(
      strokeStyle: StrokeData = {},
      options: Partial<ContoursDrawPassOptions> = {}, 
  ) {
    super({color: "#FF0000", dasharray: "2,2", ...strokeStyle}, options);
  }

  async draw(svg: Svg, viewmap: Viewmap) {
    const contours = viewmap.contours.filter(
      contour => contour.visibility === ContourVisibility.Hidden
    );

    const group = new SVGGroup({id: "hidden-contours"});
    svg.add(group);

    drawContours(group, viewmap, contours, this.options, this.strokeStyle);
  }
}

function drawContours(
    parent: SVGElement,
    viewmap: Viewmap,
    contours: Contour[],
    options: ContoursDrawPassOptions,
    strokeStyle: StrokeData = {},
) {


  // Group the contours by mesh
  for (const mesh of viewmap.meshes) {
    const objectContours = contours.filter(c => c.object === mesh);
    const objectGroup = new SVGGroup({id: mesh.name});
    parent.add(objectGroup);

    // Group the contours by nature if required
    if (options.groupByNature) {
      for (const nature of EdgeNatures) {
        const natureContours = objectContours.filter(c => c.nature === nature);
        const natureGroup = new SVGGroup({id: nature});
        objectGroup.add(natureGroup);

        for (const contour of natureContours) {
          drawContour(natureGroup, contour, options, strokeStyle);
        }
      }
    } else {
      for (const contour of objectContours) {
        drawContour(objectGroup, contour, options, strokeStyle);
      }
    }
  }
}

function drawContour(
    parent: SVGElement, 
    contour: Contour,
    options: ContoursDrawPassOptions,
    strokeStyle: StrokeData = {}
) {

  if (options.useRandomColors) {
    strokeStyle = {...strokeStyle};
    strokeStyle.color = SVGColor.random().toString();
  }

  const path = getSVGPath(contour.points, [], false, strokeStyle);
  parent.add(path);


  if (options.drawRaycastPoint) {
    drawContourRaycastPoint(path, contour);
  }

  if (options.drawContourId) {
    drawContourId(path, contour, strokeStyle);
  }
}

function drawContourRaycastPoint(parent: SVGElement, contour: Contour) {
  const strokeStyle = {color: "black"};
  const fillStyle = {color: "white"};
  const cx = contour.raycastPoint.x;
  const cy = contour.raycastPoint.y;
  const point = getSVGCircle(cx, cy, 2, strokeStyle, fillStyle);
  point.id('raycast-point');
  parent.add(point);
}

function drawContourId(parent: SVGElement, contour: Contour, strokeStyle: StrokeData) {
  const fontStyle = {size: 8};
  const delta = 10;
  const x = contour.raycastPoint.x + delta;
  const y = contour.raycastPoint.y + delta;

  const text = getSVGText(String(contour.id), x, y, fontStyle)
  const box = text.bbox();

  const cx = x + box.width/2;
  const cy = y + box.height/2;
  const circle = getSVGCircle(cx, cy, 0.85*box.width, {}, strokeStyle);
  circle.id('contour-id');
  circle.add(text);

  parent.add(circle);
}

