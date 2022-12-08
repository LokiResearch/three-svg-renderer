/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Tue Nov 22 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { DoubleSide, Material, Mesh, PerspectiveCamera, Raycaster, Side, Vector3 } from "three";
import { Chain, ChainVisibility } from "../Chain";
import { Viewmap } from "../Viewmap";

const _raycaster = new Raycaster();
const _rayDirection = new Vector3();
const _rayOrigin = new Vector3();
const _rayOriginProj = new Vector3();

export class ChainVisibilityInfo {
  nbTests = Infinity;
  nbRaycasts = Infinity;
}

export function computeChainsVisibility(
    viewmap: Viewmap,
    info = new ChainVisibilityInfo()) {

  const {chains, meshes, camera} = viewmap;
  const threeMeshes = meshes.map(obj => obj.threeMesh);

  info.nbRaycasts = 0;
  info.nbTests = 0;

  // As we cast rays from object to the camera, we want rays to intersect only
  // on the backside face. So we need to change material sideness
  const materialSidenessMap = new Map<Material, Side>();

  for (const mesh of meshes) {
    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) {
        materialSidenessMap.set(material, material.side);
        material.side = DoubleSide;
      }
    } else {
      materialSidenessMap.set(mesh.material, mesh.material.side);
      mesh.material.side = DoubleSide;
    }
  }

  // Compute chain visibility
  for (const chain of chains) {

    info.nbTests += 1;

    // if (!chainVisibilityWithGeometry(chain)) {
    chainVisibilityWithRaycasting(chain, camera, threeMeshes);
    info.nbRaycasts += 1;
    // }
  }

  // Restaure the sideness of material
  for (const mesh of meshes) {
    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) {
        material.side = materialSidenessMap.get(material) ?? material.side;
      }
    } else {
      mesh.material.side = materialSidenessMap.get(mesh.material) ?? mesh.material.side;
    }
  }

}


export function chainVisibilityWithGeometry(chain: Chain) {

  // Search for an edge that is not obvisouly hidden by geometry
  // (i.e. not back and not concave
  // see paper https://hal.inria.fr/hal-02189483)
  let i = 0;
  let hiddenByGeometry = false;
  do {
    hiddenByGeometry = chain.edges[i].isConcave || chain.edges[i].isBack;
    i += 1;
  } while(!hiddenByGeometry && i < chain.edges.length);

  for (const edge of chain.edges) {
    if (edge.isConcave || edge.isBack) {
      chain.visibility = ChainVisibility.Hidden;
      return true;
    }
  }

  return false;
}


/**
 * Return contour visibility via raycasting. If contour is empty, returns hidden
 * @param contour 
 * @param camera 
 * @param objects 
 * @param tolerance 
 * @returns 
 */
export function chainVisibilityWithRaycasting(
    chain: Chain,
    camera: PerspectiveCamera,
    objects: Array<Mesh>,
    tolerance = 1e-5) {

  // const testRatios = [2/5, 3/5, 4/5];

  // for (const ratio of testRatios) {

  //   const edge = chain.edges[Math.floor(ratio*chain.edges.length)];

  const ratio = 0.5;

  // Get the middle segment from the contour
  const edge = chain.middleEdge();

  if (!edge) {
    console.error("Contour has no edges");
    return false;
  }

  // Cast a ray from the middle of the segment to the camera
  _rayOrigin.lerpVectors(edge.vertices[0].position, edge.vertices[1].position, ratio);
  _rayDirection.subVectors(camera.position, _rayOrigin).normalize();
  _raycaster.firstHitOnly = false;
  _raycaster.set(_rayOrigin, _rayDirection);

  // Get the projection of the origin of the ray cast
  _rayOriginProj.copy(_rayOrigin).project(camera);
  chain.raycastPoint.set(_rayOriginProj.x, _rayOriginProj.y);

  // Compute total distance in case of mathematical imprecision
  const intersections = _raycaster.intersectObjects(objects, false);

  let totalDistance = 0;
  for (const intersection of intersections) {
    totalDistance += intersection.distance;
  }

  if (totalDistance < tolerance) {
    chain.visibility = ChainVisibility.Visible;
    // return true;
  } else {
    chain.visibility = ChainVisibility.Hidden;
  }
  // }
  return true;

}
