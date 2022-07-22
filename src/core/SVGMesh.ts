// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 09/12/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md

import {Mesh, Material, BufferGeometry, Color, Vector3, Raycaster, Intersection} from 'three';
import {HalfEdgeStructure, HalfEdgeStructureOptions} from 'three-mesh-halfedge';
import {MeshBVH, CENTER, MeshBVHOptions, acceleratedRaycast} from 'three-mesh-bvh';
import {computeMorphedGeometry} from '../utils/geometry';

type ColorMaterial = Material & {color: Color};

export interface SVGMeshOptions {
  bvhOptions?: MeshBVHOptions;
  hesOptions?: HalfEdgeStructureOptions;
  replaceMeshRaycastFunc?: boolean;
}

/**
 * Mesh object that can be rendered as SVG.
 * Wrapper class around three mesh object that duplicates geometry if needed (i.e.
 * for SkinnedMesh) and computes BVH and HalfEdgeStructure on demand)
 */
export class SVGMesh {

  readonly threeMesh: Mesh;
  readonly morphGeometry: BufferGeometry;
  readonly hes: HalfEdgeStructure;
  readonly bvh: MeshBVH;
  isUsingBVHForRaycasting = false;
  private readonly _originalRaycastFunc: typeof Mesh.prototype.raycast;

  constructor(mesh: Mesh, options: SVGMeshOptions = {}) {
    this.threeMesh = mesh;
    this.morphGeometry = new BufferGeometry();
    this._originalRaycastFunc = mesh.raycast;
    this.updateMorphGeometry();
    
    if (options.replaceMeshRaycastFunc) {
      this.useBVHRaycast(true);
    }

    // Setup HES
    const hesOptions = {
      hashNormals: false,
      ...options?.hesOptions
    };
    this.hes = new HalfEdgeStructure(this.morphGeometry, hesOptions);

    // Setup BVH
    const bvhOptions = {
      maxLeafTris: 1,
      strategy: CENTER,
      ...options?.bvhOptions
    }

    this.bvh = new MeshBVH(this.morphGeometry, bvhOptions);
  }

  updateMorphGeometry() {
    computeMorphedGeometry(this.threeMesh, this.morphGeometry);
  }

  updateBVH(updateMorphGeometry = true) {
    updateMorphGeometry && this.updateMorphGeometry();
    this.bvh.refit();
  }

  updateHES(updateMorphGeometry = true) {
    updateMorphGeometry && this.updateMorphGeometry();
    this.hes.build();
  }

  localToWorld(target: Vector3): Vector3 {
    return this.threeMesh.localToWorld(target);
  }

  colorForFaceIndex(faceIndex: number): null | Color {

    if (Array.isArray(this.material)) {
      for (const group of this.morphGeometry.groups) {
        if (group.start <= faceIndex &&
            faceIndex < (group.start + group.count) &&
            group.materialIndex != undefined &&
            group.materialIndex < this.material.length) {
          return colorForMaterial(this.material[group.materialIndex]);
        }
      }
      return null;
    }
    return colorForMaterial(this.material);
  }

  dispose() {
    this.morphGeometry.dispose();
    this.useBVHRaycast(false);
  }

  useBVHRaycast(use: boolean) {

    this.isUsingBVHForRaycasting = use;

    if (use) {

      const bvh = this.bvh;

      this.threeMesh.raycast = function(raycaster: Raycaster, intersects: Intersection[]) {
        const oldBVH = this.geometry.boundsTree;
        this.geometry.boundsTree = bvh;
        acceleratedRaycast.call(this, raycaster, intersects);
        this.geometry.boundsTree = oldBVH;
      }
    } else {
      this.threeMesh.raycast = this._originalRaycastFunc;
    }
  }

  get material() { return this.threeMesh.material; }
  get matrixWorld() { return this.threeMesh.matrixWorld; }
  get name() { return this.threeMesh.name; }
  set name(name: string) { this.threeMesh.name = name; }

}

function colorForMaterial(material: Material) {

  const colorMaterial = material as ColorMaterial;
  return colorMaterial.color;
}

