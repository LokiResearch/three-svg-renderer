import { DrawPass } from './DrawPass';
import { Viewmap } from '../../viewmap/Viewmap';
import { Svg } from '@svgdotjs/svg.js';
import { ViewEdgeNature } from '../../viewmap/ViewEdge';
export interface StrokeNatureOptions {
    enable?: boolean;
    renderOrder?: number;
}
export interface ChainPassOptions {
    /**
     * Draw each chains in the svg with random colors.
     * @defaultValue `false`
     */
    useRandomColors?: boolean;
    /**
     * Draw the raycasting point used to determine visibility in the svg.
     * @defaultValue `false`
     */
    drawRaycastPoint?: boolean;
    /**
     * Draw the legend showing the mapping between color and nature for chains.
     * Useful only if {@link colorByNature} is true.
     */
    drawLegend?: boolean;
    /**
     * Default style applied to strokes
     */
    defaultStyle?: StrokeStyle;
    /**
     * Customize stroke styles depending on their nature, if value are set,
     * they overide default style
     */
    styles?: {
        [ViewEdgeNature.Silhouette]: PassStrokeStyle;
        [ViewEdgeNature.MeshIntersection]: PassStrokeStyle;
        [ViewEdgeNature.Crease]: PassStrokeStyle;
        [ViewEdgeNature.Boundary]: PassStrokeStyle;
        [ViewEdgeNature.Material]: PassStrokeStyle;
    };
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
/**
 * Stroke Style interface with options specific to the Chain Pass
 */
export interface PassStrokeStyle extends StrokeStyle {
    /**
     * Draw order of the stroke in the svg. High order are drawn on top
     * @defaultValue Silhouette 5, Boundary 4, MeshIntersection 3, Crease 2, Material 1
     *
     */
    drawOrder?: number;
    /**
     * Enable the edge nature type to be drawn in the svg
     */
    enabled?: boolean;
}
export declare abstract class ChainPass extends DrawPass {
    /** Options of the draw pass */
    readonly options: Required<ChainPassOptions>;
    /**
     *
     * @param strokeStyle Default style applied to the strokes
     * @param options
     */
    constructor(options?: ChainPassOptions);
}
export declare class VisibleChainPass extends ChainPass {
    constructor(options?: Partial<ChainPassOptions>);
    draw(svg: Svg, viewmap: Viewmap): Promise<void>;
}
export declare class HiddenChainPass extends ChainPass {
    constructor(options?: Partial<ChainPassOptions>);
    draw(svg: Svg, viewmap: Viewmap): Promise<void>;
}
//# sourceMappingURL=ChainPass.d.ts.map