import { Viewmap } from '../viewmap/Viewmap';
import { SizeLike } from '../../utils/geometry';
import { Svg } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.topath.js';
import { DrawPass } from './passes/DrawPass';
export interface SVGDrawPassInfo {
    name: string;
    order: number;
    time: number;
}
export declare class SVGDrawInfo {
    totalTime: number;
    passesInfo: SVGDrawPassInfo[];
}
export interface SVGDrawOptions {
    prettifySVG?: boolean;
}
export declare class SVGDrawHandler {
    readonly options: Required<SVGDrawOptions>;
    readonly passes: DrawPass[];
    constructor(options?: SVGDrawOptions);
    drawSVG(viewmap: Viewmap, size: SizeLike, info?: SVGDrawInfo): Promise<Svg>;
}
//# sourceMappingURL=SVGDrawHandler.d.ts.map