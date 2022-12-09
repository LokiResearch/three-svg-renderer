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
import {Chain, ChainVisibility} from '../../viewmap/Chain';
import {ViewEdgeNature} from '../../viewmap/ViewEdge';
import {getSVGPath, getSVGCircle, getSVGText} from '../svgutils';
import { SVGMesh } from '../../SVGMesh';

const EdgeNatures = Object.values(ViewEdgeNature)
  .filter(nature => nature !== ViewEdgeNature.None);

const EdgeNatureColor = {
  [ViewEdgeNature.None]: "",
  [ViewEdgeNature.Silhouette]: "red",
  [ViewEdgeNature.MeshIntersection]: "green",
  [ViewEdgeNature.Crease]: "violet",
  [ViewEdgeNature.Boundary]: "blue",
  [ViewEdgeNature.Material]: "Orange",
}

export interface ChainPassOptions {
  /** 
   * Draw each chains in the svg with random colors. 
   * @defaultValue `false`
   */
  useRandomColors?: boolean;
  /**
   * Group chains by their {@link ViewEdgeNature} in  different svg groups.
   * @defaultValue `true`.
   */
  groupByNature?: boolean;
  /**
   * Draw the chain id next to the associated contour in the svg.
   * @defaultValue `false`
   */
  drawChainId?: boolean; 
  /**
   * Draw the raycasting point used to determine visibility in the svg.
   * @defaultValue `false`
   */
  drawRaycastPoint?: boolean;
  /**
   * Draw the chains using color depending on their nature
   */
  colorByNature?: boolean;

  /**
   * Draw the legend showing the mapping between color and nature for chains.
   * Useful only if {@link colorByNature} is true.
   */
  drawLegend?: boolean;

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

export abstract class ChainPass extends DrawPass {
  /** Options of the draw pass */
  readonly options: Required<ChainPassOptions> = {
    drawChainId: false,
    drawRaycastPoint: false,
    useRandomColors: false,
    groupByNature: true,
    colorByNature: false,
    drawLegend: false,
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
      options: ChainPassOptions = {}, 
  ) {
    super();

    Object.assign(this.strokeStyle, strokeStyle);
    Object.assign(this.options, options);
  }
}

export class VisibleChainPass extends ChainPass {

  constructor(
      strokeStyle: StrokeStyle = {},
      options: Partial<ChainPassOptions> = {}, 
  ) {
    super(strokeStyle, options);
  }

  async draw(svg: Svg, viewmap: Viewmap) {

    const chains = viewmap.chains
      .filter(c => c.visibility === ChainVisibility.Visible);

    const meshes = Array.from(viewmap.meshes).filter(m => m.drawVisibleContours);

    const group = new SVGGroup({id: "visible-contours"});
    drawChains(group, meshes, chains, this.options, this.strokeStyle);
    svg.add(group);
  }
}

export class HiddenChainPass extends ChainPass {

  constructor(
      strokeStyle: StrokeStyle = {},
      options: Partial<ChainPassOptions> = {}, 
  ) {
    super({color: "#FF0000", dasharray: "2,2", ...strokeStyle}, options);
  }

  async draw(svg: Svg, viewmap: Viewmap) {
 
    const chains = viewmap.chains
      .filter(c => c.visibility === ChainVisibility.Hidden);

    const meshes = Array.from(viewmap.meshes).filter(m => m.drawHiddenContours);

    const group = new SVGGroup({id: "hidden-contours"});
    svg.add(group);

    drawChains(group, meshes, chains, this.options, this.strokeStyle);
  }
}

function drawChains(
    parent: SVGElement,
    meshes: SVGMesh[],
    chains: Chain[],
    options: ChainPassOptions,
    style: StrokeStyle = {},
) {
  // Group the contours by mesh
  for (const mesh of meshes) {
    const objectChains = chains.filter(c => c.object === mesh);
    const objectGroup = new SVGGroup({id: mesh.name});
    parent.add(objectGroup);

    // Group the contours by nature if required
    if (options.groupByNature) {
      for (const nature of EdgeNatures) {
        const natureChains = objectChains.filter(c => c.nature === nature);
        const natureGroup = new SVGGroup({id: nature});
        objectGroup.add(natureGroup);

        for (const chain of natureChains) {
          drawChain(natureGroup, chain, options, style);
        }
      }
    } else {
      for (const chain of objectChains) {
        drawChain(objectGroup, chain, options, style);
      }
    }
  }

  if (options.drawLegend) {
    parent.add(getLegend());
  }

}

function drawChain(
    parent: SVGElement, 
    chain: Chain,
    options: ChainPassOptions,
    style: StrokeStyle = {}
) {

  // Make a copy of the style so we can modify it
  style = {...style};

  if (options.useRandomColors) {
    style.color = SVGColor.random().toString();
  }

  if (options.colorByNature) {
    style.color = EdgeNatureColor[chain.nature];
  }

  const path = getSVGPath(chain.points, [], false, style);
  parent.add(path);

  if (options.drawRaycastPoint) {
    drawContourRaycastPoint(parent, chain);
  }

  if (options.drawChainId) {
    drawContourId(parent, chain, style);
  }
}

function drawContourRaycastPoint(parent: SVGElement, chain: Chain) {
  const strokeStyle = {color: "black"};
  const fillStyle = {color: "white"};
  const cx = chain.raycastPoint.x;
  const cy = chain.raycastPoint.y;
  const point = getSVGCircle(cx, cy, 2, strokeStyle, fillStyle);
  point.id('raycast-point');
  parent.add(point);
}

function drawContourId(parent: SVGElement, chain: Chain, style: StrokeStyle) {
  const fontStyle = {size: 8};
  const delta = 10;
  const x = chain.raycastPoint.x + delta;
  const y = chain.raycastPoint.y + delta;

  const text = getSVGText(String(chain.id), x, y, fontStyle)
  const box = text.bbox();

  const cx = x + box.width/2;
  const cy = y + box.height/2;
  const circle = getSVGCircle(cx, cy, 0.85*box.width, {}, style);
  circle.id('contour-id');
  circle.add(text);

  parent.add(circle);
}

function getLegend() {
  const legend = new SVGGroup({id: "edges-nature-legend"});
  
  legend.add(getSVGText("Natures", 10, 140, {size: 15, anchor: 'start'}))

  let y = 170;
  for (const nature of EdgeNatures) {
    const fillColor = EdgeNatureColor[nature];
    
    legend.add(getSVGCircle(15, y, 8, {color: "black"}, {color: fillColor}));
    legend.add(getSVGText(nature, 30, y-10, {size: 15, anchor: 'start'}));

    y += 20;
  }

  return legend;
}

