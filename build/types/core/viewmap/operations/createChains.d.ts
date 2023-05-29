import { SVGMesh } from "../../SVGMesh";
import { ViewEdge } from "../ViewEdge";
import { Viewmap } from "../Viewmap";
import { ViewVertex } from "../ViewVertex";
export declare function createChains(viewmap: Viewmap): void;
export declare function nextChainEdge(currentEdge: ViewEdge, viewVertex: ViewVertex, remainingEdges: Set<ViewEdge>, obj: SVGMesh): ViewEdge | null;
//# sourceMappingURL=createChains.d.ts.map