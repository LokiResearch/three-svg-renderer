import { ColorRepresentation } from "three";
import { Viewmap } from "../Viewmap";
export interface AssignPolygonOptions {
    defaultMeshColor: ColorRepresentation;
}
export declare class AssignPolygonInfo {
    assigned: number;
    nonAssigned: number;
}
export declare function assignPolygons(viewmap: Viewmap, options?: AssignPolygonOptions, info?: AssignPolygonInfo): void;
//# sourceMappingURL=assignPolygons.d.ts.map