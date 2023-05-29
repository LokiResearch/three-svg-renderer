import { DrawPass } from './DrawPass';
import { Viewmap } from '../../viewmap/Viewmap';
import { Svg } from '@svgdotjs/svg.js';
export interface FillPassOptions {
    drawRaycastPoint?: boolean;
    /**
     * Use a random color for each polygon in the svg. Overwrites
     * {@link useFixedStyle} if `true`.
     * @defaultValue `false`
     */
    useRandomColors?: boolean;
    /**
     * Use a fixed style ()`color` and/or `opacity`) provided by {@link fillStyle}
     * instead of mesh material.
     * @defaultValue `false`
     */
    useFixedStyle?: boolean;
    /**
     * Fixed style to apply to polygons
     */
    fillStyle?: FillStyle;
}
export interface FillStyle {
    /**
     * Color of the polygons.
     * @defaultValue `"#333333"`
     */
    color?: string;
    /**
     * Opacity of the polygons.
     * @defaultValue `1`
     */
    opacity?: number;
}
export declare class FillPass extends DrawPass {
    readonly options: Required<FillPassOptions>;
    constructor(options?: FillPassOptions);
    draw(svg: Svg, viewmap: Viewmap): Promise<void>;
}
//# sourceMappingURL=FillPass.d.ts.map