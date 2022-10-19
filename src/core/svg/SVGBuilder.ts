// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 23/02/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md 

import {Viewmap} from '../viewmap/Viewmap';
import {Size} from '../../utils/math';
import {Svg} from '@svgdotjs/svg.js';
import '@svgdotjs/svg.topath.js';
import { DrawPass } from './passes/DrawPass';

export interface SVGDrawPassInfo {
  name: string;
  order: number;
  time: number;
}

export class SVGBuildInfo {
  totalTime = Infinity;
  passesInfo = new Array<SVGDrawPassInfo>();
}

export interface SVGBuildOptions {
  prettifySVG: boolean;
}

export class SVGBuilder {
  readonly options: SVGBuildOptions;
  readonly drawPasses = new Array<DrawPass>;

  constructor(options: Partial<SVGBuildOptions> = {}) {
    this.options = {
      prettifySVG: false,
      ...options
    };
  }

  async buildSVG(
      viewmap: Viewmap, 
      size: Size,
      info = new SVGBuildInfo()
  ): Promise<Svg> {

    const buildStartTime = Date.now();

    const svg = new Svg();
    svg.width(size.w);
    svg.height(size.h);

    // Call the draw passes
    for (let i=0; i<this.drawPasses.length; i++) {
      const pass = this.drawPasses[i];
      if (pass.enabled) {
        const passStartTime = Date.now();
        await pass.draw(svg, viewmap);
        
        info.passesInfo.push({
          name: pass.name,
          order: i,
          time: Date.now() - passStartTime,
        });
      }
    }

    info.totalTime = Date.now() - buildStartTime;
    return svg;
  }
}
 

 

 