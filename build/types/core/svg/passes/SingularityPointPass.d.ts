import { DrawPass } from './DrawPass';
import { Viewmap } from '../../viewmap/Viewmap';
import { Svg } from '@svgdotjs/svg.js';
export interface SingularityPointPassOptions {
    drawLegend?: boolean;
    pointSize?: number;
    drawVisiblePoints?: boolean;
    drawHiddenPoints?: boolean;
}
export declare class SingularityPointPass extends DrawPass {
    readonly options: Required<SingularityPointPassOptions>;
    constructor(options?: SingularityPointPassOptions);
    draw(svg: Svg, viewmap: Viewmap): Promise<void>;
}
//# sourceMappingURL=SingularityPointPass.d.ts.map