

import {Vector2, Vector3, PerspectiveCamera} from 'three';

const _u = new Vector3();

export interface PointLike {
  x: number;
  y: number;
}

export interface SizeLike {
  w: number;
  h: number;
}

export interface RectLike extends PointLike, SizeLike {}

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
    renderSize: SizeLike): Vector2 {

  projectPointNDC(point, target, camera);
  NDCPointToImage(target, renderSize);
  return target;
}

/**
 * Converts a point from the NDC coordinates to the image coordinates
 * @param point Point in NDC to be converted
 * @param size Size of the render
 * @returns 
 */
export function NDCPointToImage(point: Vector2, size: SizeLike): Vector2 {
  return point.set(
    (point.x + 1)/2 * size.w,
    (1 - point.y)/2 * size.h
  );
}

/**
 * Converts a point from the image coordinates to the NDC coordinates
 * @param point Point in the image coordinates
 * @param size Size of the render
 * @returns 
 */
export function imagePointToNDC(point: Vector2, size: SizeLike): Vector2 {
  return point.set(
    2/size.w*point.x - 1,
    1 - 2/size.h*point.y
  );
}