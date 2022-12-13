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
import {Svg, Element as SVGElement, Color as SVGColor,
  G as SVGGroup} from '@svgdotjs/svg.js';
import {getSVGPath, getSVGCircle} from '../svgutils';
import {Polygon} from '../../viewmap/Polygon';

export interface FillPassOptions {
  drawRaycastPoint?: boolean;

  /** 
   * Use a random color for each polygon in the svg. Overwrites 
   * {@link useFixedColor} if `true`. 
   * @defaultValue `false`
   */
  useRandomColors?: boolean;
  /** 
   * Use a fixed `color` and/or `opacity` provided by {@link FillStyle} instead of 
   * mesh material. 
   * @defaultValue `false`
   */
  useFixedColor?: boolean;
}

export interface FillStyle {
  /** 
   * Color of the polygons.
   * Must be used with {@link FillPassOptions.useFixedColor} option to be effective.
   * @defaultValue `"#333333"`
   */
  color?: string;
  /** 
   * Opacity of the polygons.
   * Must be used with {@link FillPassOptions.useFixedColor} option to be effective.
   * @defaultValue `1`
   */
  opacity?: number;
}

export class FillPass extends DrawPass {
  readonly options: Required<FillPassOptions> = {
    drawRaycastPoint: false,
    useRandomColors: false,
    useFixedColor: false,
  };
  readonly fillStyle: FillStyle = {
    color: "#333333",
    opacity: 1,
  };

  constructor(fillStyle: FillStyle = {}, options: FillPassOptions = {}) {
    super();

    Object.assign(this.options, options);
    Object.assign(this.fillStyle, fillStyle);
  }

  async draw(svg: Svg, viewmap: Viewmap) {

    const group = new SVGGroup({id: "fills"});
    svg.add(group);

    for (const mesh of viewmap.meshes) {

      if (mesh.drawFills) {
        const polygons = viewmap.polygons.filter(p => p.mesh === mesh);
        const objectGroup = new SVGGroup({id: mesh.name});
        group.add(objectGroup);

        for (const polygon of polygons) {
          drawPolygon(group, polygon, this.options, this.fillStyle);
        }
      }
    }
  }
}

function drawPolygon(
    parent: SVGElement, 
    polygon: Polygon,
    options: FillPassOptions,
    style: FillStyle = {}
) {

  // Make a copy of the style so we can modify it
  style = {...style};

  // If not using fixed color through the style, use the object color
  if (!options.useFixedColor) {
    style.color = '#'+polygon.color.getHexString();
  }
  
  if (options.useRandomColors) {
    style.color = SVGColor.random().toString();
  }

  const path = getSVGPath(polygon.contour, polygon.holes, true, {}, style);
  path.id("fill-"+polygon.id);
  parent.add(path);

  if (options.drawRaycastPoint) {
    drawPolygonRaycastPoint(parent, polygon);
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