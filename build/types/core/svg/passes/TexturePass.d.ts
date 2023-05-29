import { DrawPass } from "./DrawPass";
import { Svg } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.topath.js';
import { Viewmap } from "../../viewmap/Viewmap";
/**
 * SVGTexturePass used to draw image or vector graphics textures on mesh in the
 * final SVG.
 *
 * Note that only `PlaneGeometry` is supported for now. Textures set on
 * geometries other than plane will be ignored.
 */
export declare class TexturePass extends DrawPass {
    draw(svg: Svg, viewmap: Viewmap): Promise<void>;
}
//# sourceMappingURL=TexturePass.d.ts.map