import { Svg } from '@svgdotjs/svg.js';
import { Viewmap } from '../../viewmap/Viewmap';
export declare abstract class DrawPass {
    /**
     * Name of the draw pass
     */
    readonly name: string;
    /**
     * Enables/Disables draw pass.
     * @defaultValue `true`
    */
    enabled: boolean;
    constructor();
    /**
     * Function automatically called by the `SVGDrawHandler`
     * @param svg The svg tree being built
     * @param viewmap The viewmap data structure
     */
    abstract draw(svg: Svg, viewmap: Viewmap): Promise<void>;
}
//# sourceMappingURL=DrawPass.d.ts.map