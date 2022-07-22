

import {Matrix4, Vector2, Vector3, Triangle, PerspectiveCamera} from 'three';

const _u = new Vector3();
const _matrix = new Matrix4();


export interface Point {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Rect extends Point, Size {}


export function projectPointNDC(
    point: Vector3,
    target: Vector2,
    camera: PerspectiveCamera
): Vector2 {

  _u.copy(point).project(camera);
  return target.set(_u.x, _u.y);
}

export function projectPointImage(
    point: Vector3,
    target: Vector2,
    camera: PerspectiveCamera,
    renderSize: Size): Vector2 {

  projectPointNDC(point, target, camera);
  NDCPointToImage(target, renderSize);
  return target;
}

export function NDCPointToImage(point: Vector2, renderSize: Size): Vector2 {
  return point.set(
    (point.x + 1)/2 * renderSize.w,
    (1 - point.y)/2 * renderSize.h
  );
}

export function imagePointToNDC(point: Vector2, renderSize: Size): Vector2 {
  return point.set(
    2/renderSize.w*point.x - 1,
    1 - 2/renderSize.h*point.y
  );
}


// See https://hal.inria.fr/hal-02189483 appendix C.2 Orientation test
export function orient3D(a: Vector3, b: Vector3, c: Vector3, d: Vector3, epsilon = 1e-10) {
  _matrix.set(
    a.x, a.y, a.z, 1,
    b.x, b.y, b.z, 1,
    c.x, c.y, c.z, 1,
    d.x, d.y, d.z, 1
  );
  const det = _matrix.determinant();

  if (det > epsilon) {
    return 1;
  } else if (det < -epsilon) {
    return -1;
  }
  return 0;
}

// See https://hal.inria.fr/hal-02189483 appendix C.2 Orientation test
export function frontSide(a: Vector3, b: Vector3, c: Vector3, d: Vector3) {
  return orient3D(d, b, c, a);
}

// See https://hal.inria.fr/hal-02189483 appendix C.2 Orientation test
export function sameSide(a: Vector3, b: Vector3, c: Vector3, d: Vector3, e: Vector3) {
  return (orient3D(a,b,c,d) > 0) === (orient3D(a,b,c,e) > 0);
}

export function triangleOrientation3D(tri: Triangle, p: Vector3, epsilon = 1e-10) {
  return orient3D(tri.a, tri.b, tri.c, p, epsilon);
}

export function round(num: number) {
  return Math.round(num * 100)/100;
}
