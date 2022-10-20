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
import {Svg, G as SVGGroup, Element as SVGElement, Color as SVGColor,
} from '@svgdotjs/svg.js';
import {Contour, ContourVisibility} from '../../viewmap/Contour';
import {EdgeNature} from '../../viewmap/Edge';
import {getSVGPath, getSVGCircle, getSVGText} from '../svgutils';
import { SVGMesh } from '../../SVGMesh';

const EdgeNatures = Object.values(EdgeNature)
  .filter(nature => nature !== EdgeNature.None);

export interface ContourPassOptions {
  /** 
   * Draw each contours in the svg with random colors. 
   * @defaultValue `false`
   */
  useRandomColors?: boolean;
  /**
   * Group contours by their {@link EdgeNature} in  different svg groups.
   * @defaultValue `true`.
   */
  groupByNature?: boolean;
  /**
   * Draw the contour id next to the associated contour in the svg.
   * @defaultValue `false`
   */
  drawContourId?: boolean; 
  /**
   * Draw the raycasting point used to determine visibility in the svg.
   * @defaultValue `false`
   */
  drawRaycastPoint?: boolean;
}

export interface StrokeStyle {
  /**
   * Color of the stroke in hex format.
   * @defaultValue `"#000000"'
   */
  color?: string;
  /**
   * Width of the stroke
   * @defaultValue `1`
   */
  width?: number;
  /**
   * Opacity of the stroke
   * @defaultValue `1`
   */
  opacity?: number;
  /**
   * Pattern of dashes and gaps used for the stroke e.g. `"2,2"`
   * @defaultValue `""`
   */
  dasharray?: string;
  /**
   * Shape to be used at the ends of stroke
   * @defaultValue `"butt"`
   */
  linecap?: 'butt' | 'round' | 'square';
  /**
   * Shape to use at the corners of stroke
   * @defaultValue `"miter"`
   */
  linejoin?: 'arcs' | 'bevel' | 'miter' | 'miter-clip' | 'round';
  /**
   * Offset to use before starting dash-array
   * @defaultValue `0`
   */
  dashoffset?: number;
}

export abstract class ContourPass extends DrawPass {
  /** Options of the draw pass */
  readonly options: Required<ContourPassOptions> = {
    drawContourId: false,
    drawRaycastPoint: false,
    useRandomColors: false,
    groupByNature: true,
  }
  /** Style to apply to the strokes */
  readonly strokeStyle: StrokeStyle = {
    color: "#000000",
    width: 1,
    dasharray: "",
    linecap: "butt",
    linejoin: "miter",
    opacity: 1,
    dashoffset: 0,
  };

  constructor(
      strokeStyle: StrokeStyle = {},
      options: ContourPassOptions = {}, 
  ) {
    super();

    Object.assign(this.strokeStyle, strokeStyle);
    Object.assign(this.options, options);
  }
}

export class VisibleContourPass extends ContourPass {

  constructor(
      strokeStyle: StrokeStyle = {},
      options: Partial<ContourPassOptions> = {}, 
  ) {
    super(strokeStyle, options);
  }

  async draw(svg: Svg, viewmap: Viewmap) {

    const contours = viewmap.contours
      .filter(c => c.visibility === ContourVisibility.Visible);

    const meshes = Array.from(viewmap.meshes).filter(m => m.drawVisibleContours);

    const group = new SVGGroup({id: "visible-contours"});
    drawContours(group, meshes, contours, this.options, this.strokeStyle);
    svg.add(group);
  }
}

export class HiddenContourPass extends ContourPass {

  constructor(
      strokeStyle: StrokeStyle = {},
      options: Partial<ContourPassOptions> = {}, 
  ) {
    super({color: "#FF0000", dasharray: "2,2", ...strokeStyle}, options);
  }

  async draw(svg: Svg, viewmap: Viewmap) {
 
    const contours = viewmap.contours
      .filter(c => c.visibility === ContourVisibility.Hidden);

    const meshes = Array.from(viewmap.meshes).filter(m => m.drawHiddenContours);

    const group = new SVGGroup({id: "hidden-contours"});
    svg.add(group);

    drawContours(group, meshes, contours, this.options, this.strokeStyle);
  }
}

function drawContours(
    parent: SVGElement,
    meshes: SVGMesh[],
    contours: Contour[],
    options: ContourPassOptions,
    style: StrokeStyle = {},
) {
  // Group the contours by mesh
  for (const mesh of meshes) {
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
          drawContour(natureGroup, contour, options, style);
        }
      }
    } else {
      for (const contour of objectContours) {
        drawContour(objectGroup, contour, options, style);
      }
    }
  }
}

function drawContour(
    parent: SVGElement, 
    contour: Contour,
    options: ContourPassOptions,
    style: StrokeStyle = {}
) {

  // Make a copy of the style so we can modify it
  style = {...style};

  if (options.useRandomColors) {
    style.color = SVGColor.random().toString();
  }

  const path = getSVGPath(contour.points, [], false, style);
  parent.add(path);

  if (options.drawRaycastPoint) {
    drawContourRaycastPoint(path, contour);
  }

  if (options.drawContourId) {
    drawContourId(path, contour, style);
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

function drawContourId(parent: SVGElement, contour: Contour, style: StrokeStyle) {
  const fontStyle = {size: 8};
  const delta = 10;
  const x = contour.raycastPoint.x + delta;
  const y = contour.raycastPoint.y + delta;

  const text = getSVGText(String(contour.id), x, y, fontStyle)
  const box = text.bbox();

  const cx = x + box.width/2;
  const cy = y + box.height/2;
  const circle = getSVGCircle(cx, cy, 0.85*box.width, {}, style);
  circle.id('contour-id');
  circle.add(text);

  parent.add(circle);
}

