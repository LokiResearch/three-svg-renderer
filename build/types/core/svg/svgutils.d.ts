import { Polygon as SVGPolygon, Rect as SVGRect, Circle as SVGCircle, Ellipse as SVGEllipse, Path as SVGPath, Image as SVGImage, NumberAlias as SVGNumberAlias, Text as SVGText, StrokeData, FillData, FontData } from '@svgdotjs/svg.js';
import { PointLike, RectLike } from '../../utils';
export declare function getSVGImage(url: string, rect: RectLike): SVGImage;
export declare function getSVGText(text: string, x: number, y: number, fontStyle?: FontData, strokeStyle?: StrokeData, fillStyle?: FillData): SVGText;
export declare function getSVGPath(contour: PointLike[], holes: PointLike[][], closed: boolean, strokeStyle?: StrokeData, fillStyle?: FillData): SVGPath;
export declare function getSVGCircle(cx: number, cy: number, radius: number, strokeStyle?: StrokeData, fillStyle?: FillData): SVGCircle;
export declare function replaceShapeByPath(shape: SVGPolygon | SVGRect | SVGEllipse | SVGCircle): SVGPath;
export declare function NumberAliasToNumber(n: SVGNumberAlias): number;
//# sourceMappingURL=svgutils.d.ts.map