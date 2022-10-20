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
import {Svg, G as SVGGroup} from '@svgdotjs/svg.js';
import {ContourVisibility} from '../../viewmap/Contour';
import {getSVGCircle, getSVGText} from '../svgutils';
import {PointSingularity} from '../../viewmap/Point';

const PointSingularities = Object.values(PointSingularity)
  .filter(singularity => singularity !== PointSingularity.None);

const PointSingularityColor = {
  [PointSingularity.None]: "",
  [PointSingularity.ImageIntersection]: "green",
  [PointSingularity.MeshIntersection]: "red",
  [PointSingularity.CurtainFold]: "blue",
  [PointSingularity.Bifurcation]: "orange",
}

export interface SingularityPointPassOptions {
  drawLegend?: boolean;
  pointSize?: number;
  drawVisiblePoints?: boolean;
  drawHiddenPoints?: boolean;
}

export class SingularityPointPass extends DrawPass {
  readonly options: Required<SingularityPointPassOptions> = {
    drawVisiblePoints: true,
    drawHiddenPoints: false,
    drawLegend: true,
    pointSize: 2,
  };

  constructor(options: SingularityPointPassOptions = {}) {
    super();
    Object.assign(this.options, options);
  }

  async draw(svg: Svg, viewmap: Viewmap) {
    // Update point visibility to avoid drawing point on hidden contours if only
    // visible contours are drawn
    for (const contour of viewmap.contours) {
      for (const p of contour.points) {
        p.visible = p.visible || contour.visibility === ContourVisibility.Visible;
      }
    }

    const visibilities = [];
    if (this.options.drawVisiblePoints) {
      visibilities.push(true);
    }
    if (this.options.drawHiddenPoints) {
      visibilities.push(false);
    }

    const group = new SVGGroup({id: "singularity-points"});
    svg.add(group);


    const strokeStyle = {
      color: 'black'
    };
    const fillStyle = {
      color: "",
    };

    for (const visibility of visibilities) {

      const visibilityGroup = new SVGGroup({id: visibility? "visible" : "hidden"})
      group.add(visibilityGroup);

      for (const singularity of PointSingularities) {
        
        const points = viewmap.singularityPoints
          .filter(p => p.singularity === singularity && p.visible === visibility);

        const singularityGroup = new SVGGroup({id: singularity});
        visibilityGroup.add(singularityGroup);

        fillStyle.color = PointSingularityColor[singularity];
        for (const p of points) {
          const svgPoint = getSVGCircle(p.x, p.y, this.options.pointSize, strokeStyle, fillStyle);
          singularityGroup.add(svgPoint);
        }
      }
    }

    if (this.options.drawLegend &&
      (this.options.drawVisiblePoints || this.options.drawHiddenPoints)) {
      group.add(getLegend());
    }
  }
}

function getLegend() {
  const legend = new SVGGroup({id: "singularity-legend"});
  
  legend.add(getSVGText("Singularities", 10, 10, {size: 15, anchor: 'start'}))

  let y = 40;
  for (const singularity of PointSingularities) {
    const fillColor = PointSingularityColor[singularity];
    
    legend.add(getSVGCircle(15, y, 8, {color: "black"}, {color: fillColor}));
    legend.add(getSVGText(singularity, 30, y-10, {size: 15, anchor: 'start'}));

    y += 20;
  }

  return legend;
}
