// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 14/06/2022

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md

import {PerspectiveCamera} from 'three';
import {
  Viewmap, ViewmapBuildInfo, ViewmapBuildOptions,
  SVGDrawHandler, SVGDrawInfo, SVGDrawOptions, DrawPass
} from './core';
import {SVGMesh} from './core/SVGMesh';
import {Svg} from '@svgdotjs/svg.js';

export interface SVGRenderOptions {
  updateMeshes?: boolean;
  viewmap?: ViewmapBuildOptions;
  svg?: SVGDrawOptions;
}

export class SVGRenderInfo {
  resolution = {w: Infinity, h: Infinity};
  renderingTime = Infinity;
  readonly viewmapBuildInfo = new ViewmapBuildInfo();
  readonly svgDrawInfo = new SVGDrawInfo();
}

/**
 * 
 */
export class SVGRenderer {

  readonly viewmap = new Viewmap ();
  readonly drawHandler = new SVGDrawHandler();

  /**
   * Render a SVG file from the given meshes and returns it.
   * @param meshes Mehses to render
   * @param camera Camera used to compute the perspective
   * @param size Size of the render (will be scaled by camera aspect ratio)
   * @param options Options to customize the render
   * @param info Object containing info (e.g. times) on the rendering process
   * @returns SVG object from the Svgdotjs lib
   */
  async generateSVG(
      meshes: Array<SVGMesh>,
      camera: PerspectiveCamera,
      size: {w: number, h: number},
      options: SVGRenderOptions = {},
      info = new SVGRenderInfo(),
  ): Promise<Svg> {

    const renderStartTime = Date.now();

    // Setup camera keeping
    const renderSize = {w: size.w, h: size.w/camera.aspect};
    info.resolution = renderSize;

    // Viewmap Build
    await this.viewmap.build(
      meshes, camera, renderSize, options.viewmap, info.viewmapBuildInfo
    );

    // SVG Buid
    const svg = await this.drawHandler.drawSVG(
      this.viewmap, renderSize, info.svgDrawInfo
    );

    info.renderingTime = Date.now() - renderStartTime;

    return svg;
  }

  /**
   * Adds a pass to the SVG rendering pipeline.
   * @param pass 
   */
  addPass(pass: DrawPass) {
    if (!this.drawHandler.passes.includes(pass)) {
      this.drawHandler.passes.push(pass);
    }
  }

  /**
   * Removes a pass from the SVG rendering pipeline
   * @param pass 
   */
  removePass(pass: DrawPass) {
    this.drawHandler.passes.remove(pass);
  }

  /**
   * Removes all the passes from the SVG rendering pipeline.
   */
  clearPasses() {
    this.drawHandler.passes.clear();
  }


  

}