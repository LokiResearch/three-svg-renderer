import { PerspectiveCamera } from 'three';
import { Viewmap, ViewmapBuildInfo, ViewmapOptions, SVGDrawHandler, SVGDrawInfo, SVGDrawOptions, DrawPass } from './core';
import { SVGMesh } from './core/SVGMesh';
import { Svg } from '@svgdotjs/svg.js';
export interface ExportOptions {
    prettify?: boolean;
}
export declare class SVGRenderInfo {
    resolution: {
        w: number;
        h: number;
    };
    renderingTime: number;
    readonly svgDrawInfo: SVGDrawInfo;
    readonly viewmapInfo: ViewmapBuildInfo;
}
export interface ProgressInfo {
    currentStepName: string;
    currentStep: number;
    totalSteps: number;
}
/**
 *
 */
export declare class SVGRenderer {
    readonly viewmap: Viewmap;
    readonly drawHandler: SVGDrawHandler;
    constructor(vOptions?: ViewmapOptions, sOptions?: SVGDrawOptions);
    /**
     * Render a SVG file from the given meshes and returns it.
     * @param meshes Mehses to render
     * @param camera Camera used to compute the perspective
     * @param size Size of the render (will be scaled by camera aspect ratio)
     * @param options Options to customize the render
     * @param info Object containing info (e.g. times) on the rendering process
     * @returns SVG object from the Svgdotjs lib
     */
    generateSVG(meshes: Array<SVGMesh>, camera: PerspectiveCamera, size: {
        w: number;
        h: number;
    }, info?: SVGRenderInfo): Promise<Svg>;
    /**
     * Adds a pass to the SVG rendering pipeline.
     * @param pass
     */
    addPass(pass: DrawPass): void;
    /**
     * Removes a pass from the SVG rendering pipeline
     * @param pass
     */
    removePass(pass: DrawPass): void;
    /**
     * Removes all the passes from the SVG rendering pipeline.
     */
    clearPasses(): void;
    static exportSVG(svg: Svg, filename: string, options?: ExportOptions): void;
}
//# sourceMappingURL=SVGRenderer.d.ts.map