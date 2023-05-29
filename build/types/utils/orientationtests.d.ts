import { Triangle, Vector3 } from "three";
/**
 * Determines whether the point `d` is to the left of, to the right of, or on
 * the oriented plane defined by triangle `abc` appearing in counter-clockwise
 * order when viewed from above the plane.
 *
 * See https://hal.inria.fr/hal-02189483 Appendix C.2 Orientation test
 *
 * @param a Triangle point
 * @param b Triangle point
 * @param c Triangle point
 * @param d Test point
 * @param epsilon Precision, default to `1e-10`
 * @returns `1` if on the right side, `-1` if left, `0` if coplanar
 */
export declare function orient3D(a: Vector3, b: Vector3, c: Vector3, d: Vector3, epsilon?: number): 1 | -1 | 0;
/**
 *
 * Determines whether the point `d` is to the left of, to the right of, or on
 * the oriented plane defined by triangle `abc` appearing in counter-clockwise
 * order when viewed from above the plane.
 *
 * See https://hal.inria.fr/hal-02189483 Appendix C.2 Orientation test
 *
 * @param tri Triangle
 * @param p Test point
 * @param epsilon Precision, default to `1e-10`
 * @returns `1` if on the right side, `-1` if left, `0` if coplanar
 */
export declare function triOrient3D(tri: Triangle, p: Vector3, epsilon?: number): 0 | 1 | -1;
/**
 * Returns whether the point `d` is front facing the triangle `abc`.
 *
 * See https://hal.inria.fr/hal-02189483 Appendix C.2 Orientation test
 *
 * @param a Triangle point
 * @param b Triangle point
 * @param c Triangle point
 * @param d Camera position
 * @param epsilon Precision, default to `1e-10`
 * @returns `True` if triangle if front facing, `False` otherwise
 */
export declare function frontSide(a: Vector3, b: Vector3, c: Vector3, d: Vector3, epsilon?: number): boolean;
/**
 * Returns whether the points `d` and `e` are on the same side of the triangle `abc`.
 *
 * See https://hal.inria.fr/hal-02189483 Appendix C.2 Orientation test
 *
 * @param a Triangle point
 * @param b Triangle point
 * @param c Triangle point
 * @param d Test point
 * @param e Test point
 * @param epsilon Precision, default to `1e-10`
 * @returns `True` if points are on the same side, `False` otherwise
 */
export declare function sameSide(a: Vector3, b: Vector3, c: Vector3, d: Vector3, e: Vector3, epsilon?: number): boolean;
/**
 * Rounds the number `num` with the given `divider`.
 * @param num Number to round
 * @param divider Value of the divider, default `100`.
 * @returns Rounded number
 */
export declare function round(num: number, divider?: number): number;
//# sourceMappingURL=orientationtests.d.ts.map