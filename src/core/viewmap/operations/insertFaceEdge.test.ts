/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Mon Dec 05 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { Line3, Vector3 } from "three";
import { Face, Halfedge, Vertex } from "three-mesh-halfedge";
import { ViewEdge } from "../ViewEdge";
import { Viewmap } from "../Viewmap";
import { insertFaceEdge, splitFaceEdges } from "./insertFaceEdge";


const viewmap = new Viewmap();

/*
 * 
 *      v2 ----- v3
 *     /  \      /
 *    / f0 \ f1 /
 *   /      \  /
 *  v0 ----- v1
 * 
 */

const _v = new Vertex();
const _h = new Halfedge(_v);

let v0: Vertex, v1: Vertex, v2: Vertex, v3: Vertex;
let e0_1: ViewEdge, e1_2: ViewEdge, e2_0: ViewEdge, e1_3: ViewEdge, e3_2: ViewEdge;
let f0: Face, f1: Face;

beforeEach(() => {

  v0 = new Vertex(); v0.position.set(0,0,0); v0.id = 0;
  v1 = new Vertex(); v1.position.set(2,0,0); v1.id = 1;
  v2 = new Vertex(); v2.position.set(1,2,0); v2.id = 2;
  v3 = new Vertex(); v3.position.set(3,2,0); v3.id = 3;
  
  e0_1 = new ViewEdge(v0, v1);
  e1_2 = new ViewEdge(v1, v2);
  e2_0 = new ViewEdge(v2, v0);
  e1_3 = new ViewEdge(v1, v3);
  e3_2 = new ViewEdge(v3, v2);

  v0.edges = [e0_1, e2_0];
  v1.edges = [e0_1, e1_2, e1_3];
  v2.edges = [e2_0, e1_2, e3_2];
  v3.edges = [e1_3, e3_2];

  f0 = new Face(_h);
  f1 = new Face(_h);

  f0.edges = [e0_1, e1_2, e2_0];
  f1.edges = [e1_2, e1_3, e3_2];

  e0_1.faces.push(f0);
  e1_2.faces.push(f0, f1);
  e2_0.faces.push(f0);
  e1_3.faces.push(f1);
  e3_2.faces.push(f1);

  viewmap.clear();
  viewmap.edges.push(e0_1, e1_2, e2_0, e1_3, e3_2);
});

describe("function splitFaceEdges", () => {

  const pos = new Vector3();

  test("Existing vertices", () => {

    // Testing position n°1

    pos.set(1,2,0);
    let result = splitFaceEdges(viewmap, f0, pos);
    expect(result).not.toBeNull();

    if (!result) return;
    expect(result.vertex).toBeVertex(v2);
    expect(result.vertex.edges).toHaveLength(3);

    // Testing position n°2

    pos.set(3, 1.99999999999999, 0);
    result = splitFaceEdges(viewmap, f1, pos);
    expect(result).not.toBeNull();

    if (!result) return;
    expect(result.vertex).toBeVertex(v3);
    expect(result.vertex.edges).toHaveLength(2);

  });

  test("Splitting edge with one connected face", () => {
    
    // Split v0v1
    pos.set(1,0,0);
    const result = splitFaceEdges(viewmap, f0, pos);
    expect(result).not.toBeNull();
    if (!result) return;

    const {vertex, newEdge} = result;
    for (const vtest of [v0, v1, v2, v3]) {
      expect(vertex).not.toBeVertex(vtest);
    }
    
    expect(newEdge).not.toBeNull();
    if(!newEdge) return;
  
    // Check ref are updated for face
    expect(f0.edges).toHaveLength(4);
    for (const e of [e0_1, e1_2, e2_0, newEdge]) {
      expect(f0.edges).toContain(e);
    }

    //Check splitted edge ref
    expect(e0_1.faces).toHaveLength(1);
    expect(e0_1.faces).toContain(f0);
    expect(e0_1.a).toBeVertex(v0);
    expect(e0_1.b).toBeVertex(vertex);

    //Check new edge ref
    expect(newEdge.faces).toHaveLength(1);
    expect(newEdge.faces).toContain(f0);
    expect(newEdge.a).toBeVertex(vertex);
    expect(newEdge.b).toBeVertex(v1);

    // Check ref around new vertex
    expect(vertex.edges).toHaveLength(2);
    expect(vertex.edges).toContain(newEdge);
    expect(vertex.edges).toContain(e0_1);

    // Check ref arount v0
    expect(v0.edges).toHaveLength(2);
    expect(v0.edges).toContain(e2_0);
    expect(v0.edges).toContain(e0_1);

    // Check ref arount v1
    expect(v1.edges).toHaveLength(3);
    expect(v1.edges).toContain(newEdge);
    expect(v1.edges).toContain(e1_2);
    expect(v1.edges).toContain(e1_3);

  });

  test("Splitting edge with two connected faces", () => {

    // Split v1v2
    pos.set(1.5,1,0);
    const result = splitFaceEdges(viewmap, f0, pos);
    expect(result).not.toBeNull();
    if (!result) return;

    const {vertex, newEdge} = result;
    for (const vtest of [v0, v1, v2, v3]) {
      expect(vertex).not.toBeVertex(vtest);
    }
    
    expect(newEdge).not.toBeNull();
    if(!newEdge) return;
  
    // Check ref are updated for face f0
    expect(f0.edges).toHaveLength(4);
    for (const e of [e0_1, e1_2, e2_0, newEdge]) {
      expect(f0.edges).toContain(e);
    }

    // Check ref are updated for face f1
    expect(f1.edges).toHaveLength(4);
    for (const e of [e1_3, e3_2, e1_2, newEdge]) {
      expect(f1.edges).toContain(e);
    }

    //Check splitted edge ref
    expect(e1_2.faces).toHaveLength(2);
    expect(e1_2.faces).toContain(f0);
    expect(e1_2.faces).toContain(f1);
    expect(e1_2.a).toBeVertex(v1);
    expect(e1_2.b).toBeVertex(vertex);

    //Check new edge ref
    expect(newEdge.faces).toHaveLength(2);
    expect(newEdge.faces).toContain(f0);
    expect(newEdge.faces).toContain(f1);
    expect(newEdge.a).toBeVertex(vertex);
    expect(newEdge.b).toBeVertex(v2);

    // Check ref around new vertex
    expect(vertex.edges).toHaveLength(2);
    expect(vertex.edges).toContain(newEdge);
    expect(vertex.edges).toContain(e1_2);

    // Check ref arount v1
    expect(v1.edges).toHaveLength(3);
    expect(v1.edges).toContain(e1_2);
    expect(v1.edges).toContain(e0_1);
    expect(v1.edges).toContain(e1_3);

    // Check ref arount v2
    expect(v2.edges).toHaveLength(3);
    expect(v2.edges).toContain(newEdge);
    expect(v2.edges).toContain(e3_2);
    expect(v2.edges).toContain(e2_0);
  });


});

describe("InsertFaceEdge", () => {

  const line = new Line3();
  const pos = new Vector3();

  test("Cut face with one line", () => {

    // mid v1V2
    line.start.set(1.5,1,0);
    // v3
    line.end.set(3, 2, 0);

    const edges = insertFaceEdge(viewmap, f1, line);

    expect(edges).toHaveLength(1);
    
    const e = edges[0];

    expect(e.b).toBe(v3);

    expect(f0.edges).toHaveLength(4);
    expect(f1.edges).toHaveLength(5);

    // Check topology around v3
    expect(v3.edges).toHaveLength(3);
    expect(v3.edges).toContain(e);
    expect(v3.edges).toContain(e1_3);
    expect(v3.edges).toContain(e3_2);

  });

  test("Cut face with two lines", () => {

    // mid v1V2
    line.start.set(1.5,1,0);
    // v3
    line.end.set(3, 2, 0);

    let edges = insertFaceEdge(viewmap, f1, line);

    expect(edges).toHaveLength(1);
    
    const e = edges[0];

    expect(e.b).toBe(v3);

    expect(f0.edges).toHaveLength(4);
    expect(f1.edges).toHaveLength(5);

    // Check topology around v3
    expect(v3.edges).toHaveLength(3);
    expect(v3.edges).toContain(e);
    expect(v3.edges).toContain(e1_3);
    expect(v3.edges).toContain(e3_2);


    // mid v1V3
    line.start.set(2.5,1,0);
    // mid v2v3
    line.end.set(2, 2, 0);
    
    edges = insertFaceEdge(viewmap, f1, line);

    expect(edges).toHaveLength(2);

    expect(f0.edges).toHaveLength(4);
    expect(f1.edges).toHaveLength(10);

  });

  test("Line should merge vertices", () => {

    // mid v1V2
    pos.set(1.5, 1, 0);
    let split = splitFaceEdges(viewmap, f0, pos);

    expect(split).not.toBeNull();
    if (!split) return;

    const v12 = split.vertex;
    const e12_2 = split.newEdge;

    expect(e12_2).not.toBeNull();
    if (!e12_2) return;

    expect(e12_2.a).toBe(v12);

    
    // mid v2v3
    pos.set(2, 2, 0);
    split = splitFaceEdges(viewmap, f1, pos);

    expect(split).not.toBeNull();
    if (!split) return;

    const v23 = split.vertex;
    const e23_2 = split.newEdge;

    expect(e23_2).not.toBeNull();
    if (!e23_2) return;

    expect(e23_2.a).toBe(v23);

    // Insert Line between mid 3-2 and mid 1-2
    line.start.set(1.5, 1, 0);
    line.end.set(2, 2, 0);

    const edges = insertFaceEdge(viewmap, f1, line);

    expect(edges).toHaveLength(1);

    // Check topology of new edge 
    const e12_23 = edges[0];
    expect(e12_23.a).toBe(v12);
    expect(e12_23.b).toBe(v23);
    expect(e12_23.faces).toContain(f1);

    // Check topology around v12
    expect(v12.edges).toHaveLength(3);
    expect(v12.edges).toContain(e1_2);
    expect(v12.edges).toContain(e12_2);
    expect(v12.edges).toContain(e12_23);

    // Check topology around v23
    expect(v23.edges).toHaveLength(3);
    expect(v23.edges).toContain(e3_2);
    expect(v23.edges).toContain(e23_2);
    expect(v23.edges).toContain(e12_23);

  });

  test("Cut 2 faces in middle", () => {

    // mid v1V2
    pos.set(1.5, 1, 0);
    const split = splitFaceEdges(viewmap, f0, pos);

    expect(split).not.toBeNull();
    if (!split) return;

    const v12 = split.vertex;
    v12.id = 12;
    const e12_2 = split.newEdge;

    expect(e12_2).not.toBeNull();
    if (!e12_2) return;

    expect(e12_2.a).toBe(v12);

    // Insert Line between mid 1-2 and mid f0
    line.start.set(1.5, 1, 0);
    line.end.set(1, 1, 0);
    let edges = insertFaceEdge(viewmap, f0, line);

    expect(edges).toHaveLength(1);

    const e12_midf0 = edges[0];
    const vmidf0 = e12_midf0.b;
    vmidf0.id = 990;

    // Insert Line between mid 1-2 and mid f1
    line.start.set(1.5, 1, 0);
    line.end.set(2, 1, 0);
    edges = insertFaceEdge(viewmap, f1, line);

    expect(edges).toHaveLength(1);

    const e12_midf1 = edges[0];
    const vmidf1 = e12_midf1.b;
    vmidf1.id = 991;

    // Insert Line between mid f0 and v0
    line.start.set(1, 1, 0);
    line.end.set(0, 0, 0);
    edges = insertFaceEdge(viewmap, f0, line);

    expect(edges).toHaveLength(1);

    const e0_midf0 = edges[0];

    // Insert Line between mid f1 and v3
    line.start.set(2, 1, 0);
    line.end.set(3, 2, 0);
    edges = insertFaceEdge(viewmap, f1, line);

    expect(edges).toHaveLength(1);

    const e3_midf1 = edges[0];

    // Check topology around v12
    expect(v12.edges).toHaveLength(4);
    expect(v12.edges).toContain(e1_2);
    expect(v12.edges).toContain(e12_2);
    expect(v12.edges).toContain(e12_midf0);
    expect(v12.edges).toContain(e12_midf1);
   
    // Check topology around v0
    expect(v0.edges).toHaveLength(3);
    expect(v0.edges).toContain(e0_midf0);
    expect(v0.edges).toContain(e0_1);
    expect(v0.edges).toContain(e2_0);
    
    // Check topology around vmidf0
    expect(vmidf0.edges).toHaveLength(2);
    expect(vmidf0.edges).toContain(e12_midf0);
    expect(vmidf0.edges).toContain(e0_midf0);
      
    // Check topology around v3
    expect(v3.edges).toHaveLength(3);
    expect(v3.edges).toContain(e3_midf1);
    expect(v3.edges).toContain(e1_3);
    expect(v3.edges).toContain(e3_2);
    
    // Check topology around vmidf1
    expect(vmidf1.edges).toHaveLength(2);
    expect(vmidf1.edges).toContain(e12_midf1);
    expect(vmidf1.edges).toContain(e3_midf1);

    expect(f0.edges).toHaveLength(6);
    expect(f1.edges).toHaveLength(6);
      
  });

});

