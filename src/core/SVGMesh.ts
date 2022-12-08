// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 09/12/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md

import {Mesh, Material, Color, Vector3} from 'three';
import {HalfedgeDS} from 'three-mesh-halfedge';
import {MeshBVH, MeshBVHOptions, acceleratedRaycast, SAH} from 'three-mesh-bvh';
import {computeMorphedGeometry, disposeMesh} from '../utils/trigeometry';

type ColorMaterial = Material & {color: Color};

export interface SVGMeshOptions {
  bvhOptions?: MeshBVHOptions;
}

/**
 * SVGTexture allows to add a texture to a SVGMesh.
 * Raster image (.jpeg, .png) or vector graphics (.svg) are supported.
 */
export interface SVGTexture {
  /**
   * Name of the texture
   */
  name: string;
  /**
   * DataUrl to the image and vector graphics texture
   */
  url: string;
}

/**
 * Mesh object that can be rendered as SVG.
 * Wrapper class around three mesh object that duplicates geometry if needed (i.e.
 * for SkinnedMesh) and computes BVH and HalfEdgeStructure on demand)
 */
export class SVGMesh {

  readonly sourceMesh: Mesh;
  readonly threeMesh = new Mesh();
  readonly hes: HalfedgeDS;
  readonly bvh: MeshBVH;
  drawFills = true;
  drawVisibleContours = true;
  drawHiddenContours = true;
  isUsingBVHForRaycasting = false;
  texture?: SVGTexture;

  constructor(mesh: Mesh, options: SVGMeshOptions = {}) {
    this.sourceMesh = mesh;
    this.threeMesh.copy(mesh);
    this.threeMesh.geometry = this.sourceMesh.geometry.clone();

    // Setup HES
    this.hes = new HalfedgeDS();

    // Setup BVH
    const bvhOptions = {
      maxLeafTris: 1,
      strategy: SAH,
      ...options?.bvhOptions
    }

    this.bvh = new MeshBVH(this.threeMesh.geometry, bvhOptions);
    this.threeMesh.raycast = acceleratedRaycast;
    this.threeMesh.geometry.boundsTree = this.bvh;
  }

  /**
   * Adds a SVGtexture to the mesh.
   * 
   * @param texture The image or vector graphics texture to use.
   */
  addTexture(texture: SVGTexture) {
    this.texture = texture;
  }

  updateMorphGeometry() {
    computeMorphedGeometry(this.sourceMesh, this.threeMesh.geometry);
  }

  updateBVH(updateMorphGeometry = true) {
    updateMorphGeometry && this.updateMorphGeometry();
    this.bvh.refit();
  }

  updateHES(updateMorphGeometry = true) {
    updateMorphGeometry && this.updateMorphGeometry();
    this.hes.setFromGeometry(this.threeMesh.geometry);
  }

  localToWorld(target: Vector3): Vector3 {
    return this.threeMesh.localToWorld(target);
  }

  colorForFaceIndex(faceIndex: number): null | Color {

    if (Array.isArray(this.material)) {
      for (const group of this.threeMesh.geometry.groups) {
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
    disposeMesh(this.threeMesh);
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

