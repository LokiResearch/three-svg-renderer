import { Vector2, Vector3, PerspectiveCamera, Line3 } from 'three';
export interface PointLike {
    x: number;
    y: number;
}
export interface SizeLike {
    w: number;
    h: number;
}
export interface RectLike extends PointLike, SizeLike {
}
export declare function projectPointNDC(point: Vector3, target: Vector2, camera: PerspectiveCamera): Vector2;
export declare function projectPoint(point: Vector3, target: Vector2, camera: PerspectiveCamera, renderSize: SizeLike): Vector2;
/**
 * Converts a point from the NDC coordinates to the image coordinates
 * @param point Point in NDC to be converted
 * @param size Size of the render
 * @returns
 */
export declare function NDCPointToImage(point: Vector2, target: Vector2, size: SizeLike): Vector2;
/**
 * Converts a point from the image coordinates to the NDC coordinates
 * @param point Point in the image coordinates
 * @param size Size of the render
 * @returns
 */
export declare function imagePointToNDC(point: Vector2, target: Vector2, size: SizeLike): Vector2;
export declare function hashVector3(vec: Vector3, multiplier?: number): string;
export declare function hashVector2(vec: Vector2, multiplier?: number): string;
/**
 * Checks wether lines intersect and computes the intersection point.
 *
 * Adapted from mathjs
 *
 * @param line1 First segment/line
 * @param line2 Second segment/line
 * @param target Destination of the intersection point
 * @param infiniteLine Wether to consider segments as infinite lines. Default, false
 * @param tolerance Tolerance from which points are considred equal
 * @returns true if lines intersect, false otherwise
 */
export declare function intersectLines(line1: Line3, line2: Line3, target: Vector3, infiniteLine?: boolean, tolerance?: number): boolean;
export declare function vectors3Equal(a: Vector3, b: Vector3, tolerance?: number): boolean;
export declare function vectors2Equal(a: Vector2, b: Vector2, tolerance?: number): boolean;
//# sourceMappingURL=geometry.d.ts.map