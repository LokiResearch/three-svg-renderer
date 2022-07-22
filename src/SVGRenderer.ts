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
import {Viewmap, ViewmapBuildInfo, ViewmapBuildOptions} from './core/viewmap/Viewmap';
import {SVGMesh} from './core/SVGMesh';
import {SVGBuilder, SVGBuildInfo, SVGBuildOptions} from './core/svg/SVGBuilder';
import {DrawPass} from './core/svg/passes/DrawPass';
import {Svg} from '@svgdotjs/svg.js';

export interface SVGRenderOptions {
  updateMeshes?: boolean;
  viewmap?: ViewmapBuildOptions;
  svg?: SVGBuildOptions;
}

export class SVGRenderInfo {
  resolution = {w: Infinity, h: Infinity};
  renderingTime = Infinity;
  viewmapBuildInfo = new ViewmapBuildInfo();
  svgBuildInfo = new SVGBuildInfo();
}

export class SVGRenderer {

  readonly viewmap = new Viewmap ();
  readonly svgBuilder = new SVGBuilder();

  async generateSVG(
      meshes: Array<SVGMesh>,
      camera: PerspectiveCamera,
      size: {w: number, h: number},
      options: SVGRenderOptions = {},
      info = new SVGRenderInfo(),
  ): Promise<Svg> {

    const renderStartTime = Date.now();

    // Setup camera
    const renderSize = {
      w: size.w,
      h: size.w/camera.aspect
    };
    info.resolution = renderSize;

    // Viewmap Build
    await this.viewmap.build(
      meshes, camera, renderSize, options.viewmap, info.viewmapBuildInfo
    );

    // SVG Buid
    const svg = await this.svgBuilder.buildSVG(
      this.viewmap, renderSize, info.svgBuildInfo
    );

    info.renderingTime = Date.now() - renderStartTime;

    return svg;
  }

  addDrawPass(pass: DrawPass) {
    if (!this.svgBuilder.drawPasses.includes(pass)) {
      this.svgBuilder.drawPasses.push(pass);
    }
  }

  removeDrawPass(pass: DrawPass) {
    this.svgBuilder.drawPasses.remove(pass);
  }

  clearDrawPasses() {
    this.svgBuilder.drawPasses.clear();
  }


  

}