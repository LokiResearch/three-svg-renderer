import { Vector2 } from 'three';
import { ViewEdge } from './ViewEdge';
import { SVGMesh } from '../SVGMesh';
import { ViewVertex } from './ViewVertex';
export declare enum ChainVisibility {
    Unknown = "Unknown",
    Hidden = "Hidden",
    Visible = "Visible"
}
export declare class Chain {
    id: number;
    object: SVGMesh;
    raycastPoint: Vector2;
    edges: ViewEdge[];
    vertices: ViewVertex[];
    visibility: ChainVisibility;
    constructor(id: number, object: SVGMesh);
    get head(): ViewVertex;
    get tail(): ViewVertex;
    get size(): number;
    get nature(): import("./ViewEdge").ViewEdgeNature;
    middlePoint(): ViewVertex;
    middleEdge(): ViewEdge | null;
    addEdge(edge: ViewEdge): void;
}
//# sourceMappingURL=Chain.d.ts.map