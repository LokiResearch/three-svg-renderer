import { ColorRepresentation, PerspectiveCamera } from 'three';
import { SizeLike } from '../../utils';
import { SVGMesh } from '../SVGMesh';
import { Chain } from './Chain';
import { ViewEdge } from './ViewEdge';
import { Polygon } from './Polygon';
import { MeshIntersectionInfo } from './operations/computeMeshIntersections';
import { ViewVertex } from './ViewVertex';
declare module 'three-mesh-halfedge' {
    interface Face {
        viewEdges: ViewEdge[];
    }
    interface Vertex {
        viewVertex: ViewVertex;
    }
}
export interface ViewmapOptions {
    updateMeshes?: boolean;
    ignoreVisibility?: boolean;
    defaultMeshColor?: ColorRepresentation;
    creaseAngle: {
        min: number;
        max: number;
    };
}
export declare class ViewmapBuildInfo {
    totalTime: number;
    /** Record or times in ms */
    times: {
        updateGeometries: number;
        updateBVH: number;
        updateHES: number;
        setupEdges: number;
        find3dSingularities: number;
        find2dSingularities: number;
        computeChains: number;
        visibility: number;
        computePolygons: number;
        assignPolygons: number;
        worldTransform: number;
        meshIntersections: number;
        setupPoints: number;
        setupFaceMap: number;
    };
    intersections: MeshIntersectionInfo;
    visibility: {
        nbTests: number;
        nbRaycasts: number;
    };
    polygons: {
        smallAreaIgnored: number;
        insidePointErrors: number;
        assigned: number;
        nonAssigned: number;
    };
}
export interface ProgressInfo {
    currentStepName: string;
    currentStep: number;
    totalSteps: number;
}
export declare class Viewmap {
    readonly meshes: SVGMesh[];
    readonly viewEdges: ViewEdge[];
    readonly viewVertexMap: Map<string, ViewVertex>;
    readonly chains: Chain[];
    readonly polygons: Polygon[];
    readonly camera: PerspectiveCamera;
    readonly renderSize: {
        w: number;
        h: number;
    };
    readonly options: Required<ViewmapOptions>;
    constructor(options?: ViewmapOptions);
    clear(): void;
    build(meshes: SVGMesh[], camera: PerspectiveCamera, renderSize: SizeLike, info?: ViewmapBuildInfo, progressCallback?: (progress: ProgressInfo) => void): Promise<void>;
    private buildAsync;
    private setupActions;
    visibleChains(): Chain[];
    hiddenChains(): Chain[];
}
//# sourceMappingURL=Viewmap.d.ts.map