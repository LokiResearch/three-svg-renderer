import { Mesh, Material, Color, Vector3 } from 'three';
import { HalfedgeDS } from 'three-mesh-halfedge';
import { MeshBVH, MeshBVHOptions } from 'three-mesh-bvh';
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
export declare class SVGMesh {
    readonly sourceMesh: Mesh;
    readonly threeMesh: Mesh<import("three").BufferGeometry, Material | Material[]>;
    readonly hes: HalfedgeDS;
    readonly bvh: MeshBVH;
    drawFills: boolean;
    drawVisibleContours: boolean;
    drawHiddenContours: boolean;
    isUsingBVHForRaycasting: boolean;
    texture?: SVGTexture;
    constructor(mesh: Mesh, options?: SVGMeshOptions);
    /**
     * Adds a SVGtexture to the mesh.
     *
     * @param texture The image or vector graphics texture to use.
     */
    addTexture(texture: SVGTexture): void;
    updateMorphGeometry(): void;
    updateBVH(updateMorphGeometry?: boolean): void;
    updateHES(updateMorphGeometry?: boolean): void;
    localToWorld(target: Vector3): Vector3;
    colorForFaceIndex(faceIndex: number): null | Color;
    dispose(): void;
    get material(): Material | Material[];
    get matrixWorld(): import("three").Matrix4;
    get name(): string;
    set name(name: string);
}
//# sourceMappingURL=SVGMesh.d.ts.map