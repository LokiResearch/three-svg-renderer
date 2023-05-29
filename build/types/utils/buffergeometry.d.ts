import { BufferGeometry, BufferAttribute, Mesh } from 'three';
/**
 * Types definitions are not up to date
 */
declare module 'three/examples/jsm/utils/BufferGeometryUtils' {
    function computeMorphedAttributes(object: Mesh): {
        positionAttribute: BufferAttribute;
        normalAttribute: BufferAttribute;
        morphedPositionAttribute: BufferAttribute;
        morphedNormalAttribute: BufferAttribute;
    };
}
export declare function triangleGeometry(size: number): BufferGeometry;
export declare function disposeMesh(mesh: Mesh): void;
export declare function disposeGeometry(geometry: BufferGeometry): void;
export declare function computeMorphedGeometry(source: Mesh, target: BufferGeometry): void;
//# sourceMappingURL=buffergeometry.d.ts.map