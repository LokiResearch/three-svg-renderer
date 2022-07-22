// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 24/11/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md

import {Mesh, BoxGeometry, MeshStandardMaterial, PerspectiveCamera, Vector3
} from 'three';
import {Edge} from './Edge';
import {Vertex} from 'three-mesh-halfedge';
import {triangleGeometry} from '../../utils/geometry';
import {createFaceEdges, computeSurfaceIntersections, SurfaceIntersectionInfo,
  splitEdge
} from './Viewmap';
import {SVGMesh} from '../SVGMesh';

// jest seems to not support WASM files, use a mock
// jest.mock('./viewmap/CGALHandler');

let cube: SVGMesh;
let tri: SVGMesh;
let camera: PerspectiveCamera;

beforeAll(() => {

  const material = new MeshStandardMaterial();

  cube = new SVGMesh(new Mesh(new BoxGeometry(1,1,1), material));
  tri = new SVGMesh(new Mesh(triangleGeometry(10), material));
  cube.updateMorphGeometry();
  cube.updateBVH();
  cube.updateHES();
  tri.updateMorphGeometry();
  tri.updateBVH();
  tri.updateHES();

  camera = new PerspectiveCamera();
  camera.position.set(10,10,10);
  camera.updateProjectionMatrix();

});

describe("Function createFaceEdges", () => {

  beforeAll(() => {
    createFaceEdges(cube, camera);
  })

  test("Expect each face to be connected to 3 edges", () => {
    for (const face of cube.hes.faces) {
      expect(face.edges.size).toBe(3);
    }
  })

  test("Check the number of edges", () => {

    const edges = new Set<Edge>();
    for (const face of cube.hes.faces) {
      for (const edge of face.edges) {
        edges.add(edge);
      }
    }
    expect(edges.size).toBe(18);
  });

});

describe("Function splitEdge", () => {

  let edge: Edge;

  beforeAll(() => {
    createFaceEdges(cube, camera);
    [edge] = cube.hes.faces[0].edges;
  })

  test("Expect edge not to be splited for point outside", () => {

    const vertex = splitEdge(edge, new Vector3(10,10,10));
    expect(vertex).toBeNull();

  });

  test("Expect edge not to be splited", () => {

    let split = splitEdge(edge, edge.vertices[0].position);
    expect(split).not.toBeNull();
    expect(split!.vertex).toBe(edge.vertices[0]);
    expect(split!.cut).not.toBeTruthy();

    split = splitEdge(edge, edge.vertices[1].position);
    expect(split).not.toBeNull();
    expect(split!.vertex).toBe(edge.vertices[1]);
    expect(split!.cut).not.toBeTruthy();
  });

  test("Expect edge to be splited in the middle", () => {
    const pos = new Vector3()
      .addVectors(edge.vertices[0].position, edge.vertices[1].position)
      .divideScalar(2);

    const split = splitEdge(edge, pos);
    expect(split).not.toBeNull();
    expect(split!.vertex.matchesPosition(pos)).toBeTruthy();
    expect(split!.cut).toBeTruthy();
  });

  test("Expect the adjacent faces to be updated", () => {
    for (const face of edge.faces) {
      expect(face.edges.size).toBe(4);
    }
  });

  test("Expect the cube edges to have 9 unique vertices", () => {
    const vertices = new Set<Vertex>();
    for (const face of cube.hes.faces) {
      for (const edge of face.edges) {
        for (const vertex of edge.vertices) {
          vertices.add(vertex);
        }
      }
    }
    expect(vertices.size).toBe(9);

  });

  test("Expect only the new vertex to be connected to 2 edges", () => {

    const vertices = new Set<Vertex>();
    for (const face of cube.hes.faces) {
      for (const edge of face.edges) {
        for (const vertex of edge.vertices) {
          vertices.add(vertex);
        }
      }
    }
    let cpt = 0;
    for (const vertex of vertices) {
      if (vertex.edges.size === 2) {
        cpt += 1;
      }
    }
    expect(cpt).toBe(1);

  });

});



describe("Function computeSurfaceIntersections", () => {

  // The goal here is to cut the cube in 2 with the big triangle geometry
  let info: SurfaceIntersectionInfo;

  beforeAll(() => {
    createFaceEdges(cube, camera);
    createFaceEdges(tri, camera);
    info = computeSurfaceIntersections(cube, tri);
  });

  test("Check sizes", () => {
    expect(info.nbIntersections).toBe(8);
    expect(info.intersectionEdges.length).toBe(8);
  });

  test("Check the total number edges after intersection", () => {
    // 8 original edges should have been cut in 2 new edges (+8)
    // 8 intersection edges should have been added (+8)
    // Furthermore, we should have 8 faces with 6 edges

    let nbFaceWith6Edges = 0;
    let uniqueEdges = new Set<Edge>();
    for (const face of cube.hes.faces) {
      if (face.edges.size === 6) {
        nbFaceWith6Edges += 1;
      }

      for (const edge of face.edges) {
        uniqueEdges.add(edge);
      }
    }

    expect(nbFaceWith6Edges).toBe(8);
    expect(uniqueEdges.size).toBe(18+8+8);
  })

  test("Expect intersection edges to be link between each others", () => {

    const edges = new Set<Edge>(info.intersectionEdges);

    // If edges are linked, they should share a vertex
    const vertices = new Set<Vertex>();
    for (const edge of edges) {
      for (const vertex of edge.vertices) {
        vertices.add(vertex)
      }
    }
    expect(vertices.size).toBe(8);

    for(const vertex of vertices) {
      let numberOfInterEdgesConnected = 0;
      for(const edge of vertex.edges) {
        if (edges.has(edge)) {
          numberOfInterEdgesConnected += 1;
        }
      }
      expect(numberOfInterEdgesConnected).toBe(2);
    }

  });

});

