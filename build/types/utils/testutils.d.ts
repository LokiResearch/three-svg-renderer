/// <reference types="jest" />
import { Vector3 } from 'three';
import { Vertex } from 'three-mesh-halfedge';
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeVertex(expected: Vertex): CustomMatcherResult;
        }
    }
}
export declare function vecToStr(v: Vector3): string;
export declare function generatorSize(g: Generator): number;
export declare function generatorToArray<T>(g: Generator<T>): T[];
//# sourceMappingURL=testutils.d.ts.map