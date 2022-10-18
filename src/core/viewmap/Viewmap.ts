// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 23/02/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md 

import {Vector2, Vector3, Raycaster, Material, Mesh, Side, DoubleSide,
  Matrix3, Matrix4, Line3, PerspectiveCamera, ColorRepresentation, Color} from 'three';
import {Vertex, HalfEdge, Face} from 'three-mesh-halfedge';
import {bush} from 'isect';
import {Edge, EdgeNature} from './Edge';
import {Point, PointSingularity} from './Point';
import {Contour, ContourVisibility} from './Contour';
import {Polygon} from './Polygon';
import {computePolygons} from './Arr2D';
import {sameSide, Size, NDCPointToImage} from '../../utils/math';
import {trianglesIntersect} from 'fast-triangle-triangle-intersection';
import { SVGMesh } from '../svg/SVGMesh';

/**
 * Add an array of ViewEdge property for each halfedge. At the begining of the
 * viewmap creation, each HalfEdge is associated with one ViewEdge, but with
 * surface and image intersections, ViewEdges are cut in pieces, and so HalfEdges
 * can refer to multiple ViewEdges
 */

declare module 'three-mesh-halfedge' {
  export interface Face {
    edges: Set<Edge>;
  }

  export interface Vertex {
    point: Point;
    edges: Set<Edge>;
  }
}

export interface ViewmapBuildOptions {
  meshesNeedUpdate?: boolean;
  ignoreContoursVisibility?: boolean;
  defaultMeshColor?: ColorRepresentation;
}

export class ViewmapBuildInfo {
  totalTime = Infinity;

  times = {

    updateMeshes: Infinity,
    createFaceEdges: Infinity,
    filterEdges: Infinity,
    singularities3D: Infinity,
    singularities2D: Infinity,
    chaining: Infinity,
    visibility: Infinity,
    polygonsRetrieval: Infinity,
    NDCConversion: Infinity,
    assignPolygons: Infinity,
    RENAME_ME: Infinity
  };

  extra = {
    intersections: new Array<SurfaceIntersectionInfo>(),
    visibility: {
      numberOfRaycast: Infinity,
    },
    polygons: {
      numberOfIgnoredPolygons: Infinity,
      numberOfErrorPolygons: Infinity,
      numberOfAssignedPolygons: Infinity,
      numberOfNonAssignedPolygons: Infinity,
    }
  }
}

const _raycaster = new Raycaster();
const _proj = new Vector3();

export class Viewmap {

  readonly camera = new PerspectiveCamera;
  meshes = new Set<SVGMesh>();
  edges = new Set<Edge>();
  points = new Set<Point>();
  singularityPoints = new Array<Point>();
  contours = new Array<Contour>();
  polygonsRaycastPoints = new Array<Vector2>();
  polygons = new Array<Polygon>();

  clear() {
    this.edges.clear();
    this.points.clear();
    this.singularityPoints.clear();
    this.contours.clear();
    this.polygonsRaycastPoints.clear();
    this.polygons.clear();
  }

  async build(
      meshes: SVGMesh[],
      camera: PerspectiveCamera,
      renderSize: Size,
      buildOptions: ViewmapBuildOptions = {},
      info = new ViewmapBuildInfo()
  ) {

    this.clear();
    

    const buildStartTime = Date.now();
    let stepStartTime;

    const options = {
      meshesNeedUpdate: true,
      ignoreContoursVisibility: false,
      ...buildOptions
    }

    this.meshes = new Set(meshes);

    // Step:
    // Prepare camera
    this.camera.copy(camera);
    this.camera.getWorldPosition(this.camera.position);

    // Step:
    // Update render meshes
    if (options.meshesNeedUpdate) {
      stepStartTime = Date.now();
      for (const mesh of this.meshes) {
        mesh.updateMorphGeometry();
        mesh.updateBVH(false);
        mesh.updateHES(false);
      }
      info.times.updateMeshes = Date.now() - stepStartTime;
    }
  
    // Step:
    // Update world position
    stepStartTime = Date.now();
    const normalMatrix = new Matrix3();
    for (const mesh of this.meshes) {

      normalMatrix.getNormalMatrix(mesh.matrixWorld);

      if (mesh.hes) {
        // Update vertices
        for (const vertex of mesh.hes.vertices) {
          vertex.position.applyMatrix4(mesh.matrixWorld);
          vertex.normal.applyMatrix3(normalMatrix).normalize();
        }

        // Update Faces
        for (const face of mesh.hes.faces) {
          face.midpoint.applyMatrix4(mesh.matrixWorld);
          face.normal.applyMatrix3(normalMatrix).normalize();
        }
      }
    }
    info.times.RENAME_ME = Date.now() - stepStartTime;


    const bvhRaycastUseMap = new Map<SVGMesh, boolean>();
    for (const mesh of meshes) {
      bvhRaycastUseMap.set(mesh, mesh.isUsingBVHForRaycasting);
      mesh.useBVHRaycast(true);
    }

    
    // Step:
    // Create view edges
    stepStartTime = Date.now();
    for (const mesh of this.meshes) {
      createFaceEdges(mesh, this.camera);
    }
    info.times.createFaceEdges = Date.now() - stepStartTime;


    // Step:
    // compute meshes surface intersections
    stepStartTime = Date.now();
    for (let i=0; i<meshes.length; i++) {
      for (let j=i+1; j<meshes.length; j++) {
        const interInfo = computeSurfaceIntersections(meshes[i], meshes[j]);
        info.extra.intersections.push(interInfo);
      }
    }
    info.times.RENAME_ME = Date.now() - stepStartTime;


    // Step:
    // Extract the unique set of edges
    stepStartTime = Date.now();
    this.edges = gatherEdges(meshes);
    info.times.RENAME_ME = Date.now() - stepStartTime;


    // Step:
    // Setup points for each vertex
    stepStartTime = Date.now();
    this.points = initPoints(this.edges, this.camera);
    info.times.RENAME_ME = Date.now() - stepStartTime;


    // Step:
    // Find singularity points in the 3D space (curtain folds, mesh intersections
    // or bifurcations)
    stepStartTime = Date.now();
    this.singularityPoints = findSingularityPointsIn3D(this.points, this.camera);
    info.times.singularities3D = Date.now() - stepStartTime;


    // Step:
    // Find singularity points in the 3D space (image place intersections)
    // This step creates new points and segments on-the-fly
    stepStartTime = Date.now();
    const interPoints = computeImageIntersections(this.edges);
    this.singularityPoints.push(...interPoints);
    interPoints.forEach(p => this.points.add(p));
    // this.points.push(...interPoints);
    info.times.singularities2D = Date.now() - stepStartTime;


    // Step:
    // Compute contours from the set of segments: link segments depending
    // of their connexity and nature
    stepStartTime = Date.now();
    this.contours = createChainedContours(this.edges);
    info.times.chaining = Date.now() - stepStartTime;


    // Step:
    // Compute contours visibility using geometry's topology or
    // raycasting if needed
    // If ignore visibility is set, set all contours to be visible
    if (!options.ignoreContoursVisibility) {
      stepStartTime = Date.now();

      const visInfo = computeContoursVisibility(this.contours, this.camera, meshes);
      info.extra.visibility.numberOfRaycast = visInfo.numberOfRaycasts;
      info.times.visibility = Date.now() - stepStartTime;

    } else {
      this.contours.map(contour => contour.visibility = ContourVisibility.Visible);
    }


    // Step:
    // Compute the polygons formed by the visible subset of contours
    stepStartTime = Date.now();
    const visibleContours = this.contours.filter(
      contour => contour.visibility === ContourVisibility.Visible);
    const polygonsInfo = await computePolygons(visibleContours)
    this.polygons = polygonsInfo.polygons;
    info.extra.polygons.numberOfErrorPolygons = polygonsInfo.nbErrors;
    info.extra.polygons.numberOfIgnoredPolygons = polygonsInfo.nbIgnored;
    info.times.polygonsRetrieval = Date.now() - stepStartTime;


    // Step:
    //
    stepStartTime = Date.now();
    const assignInfo =  assignPolygons(this.polygons, this.camera, meshes, options.defaultMeshColor);
    info.extra.polygons.numberOfAssignedPolygons = assignInfo.assigned;
    info.extra.polygons.numberOfNonAssignedPolygons = assignInfo.nonAssigned;
    info.times.assignPolygons = Date.now() - stepStartTime;


    // Step:
    // Convert Vector2 in the image space (NDC coordinates) to pixels coordinates
    // using the render resolution

    stepStartTime = Date.now();
    for (const point of this.points) {
      NDCPointToImage(point.position, renderSize);
    }

    // Arr2D polygons have their own points
    for (const polygon of this.polygons) {
      for (const p of polygon.contour) {
        NDCPointToImage(p, renderSize);
      }
      for (const hole of polygon.holes) {
        for (const p of hole) {
          NDCPointToImage(p, renderSize);
        }
      }
      NDCPointToImage(polygon.insidePoint, renderSize);
    }

    // Contour raycast points
    for (const contour of this.contours) {
      NDCPointToImage(contour.raycastPoint, renderSize);
    }
    info.times.NDCConversion = Date.now() - stepStartTime;

    // Put back the bvh raycast acceleration status
    for (const mesh of meshes) {
      const oldValue = bvhRaycastUseMap.get(mesh);
      if (oldValue !== undefined) {
        mesh.useBVHRaycast(oldValue);
      }
    }

    info.totalTime = Date.now() - buildStartTime;

    return info;
  }
}

export function createFaceEdges(mesh: SVGMesh, camera: PerspectiveCamera) {

  const processedHalfEdges = new Map<HalfEdge, Edge>();
  const processedVertices = new Set<Vertex>();

  for (const face of mesh.hes.faces) {

    face.edges = new Set<Edge>();

    const startHalfEdge = face.halfEdge;
    let halfEdge = startHalfEdge;

    do {

      const twin = halfEdge.twin;
      let edge = twin && processedHalfEdges.get(twin);
      if (edge) {
        edge.faces.push(face);
      } else {

        edge = new Edge([mesh], [face], halfEdge.vertex, halfEdge.next.vertex);
        edge.updateNatureFromHalfEdge(halfEdge, camera);

        // Init edge vertices
        for (const vertex of edge.vertices) {
          if (!processedVertices.has(vertex)) {
            vertex.edges = new Set<Edge>();

            processedVertices.add(vertex);
          }
          vertex.edges.add(edge);
        }

        processedHalfEdges.set(halfEdge, edge);
      }

      face.edges.add(edge);

      halfEdge = halfEdge.next;
    } while(halfEdge != startHalfEdge);
  }
}


export class SurfaceIntersectionInfo {
  meshA: string;
  meshB: string;
  nbTests = Infinity;
  nbIntersections = Infinity;
  time = Infinity;
  intersectionEdges = new Array<Edge>();

  constructor(meshA: SVGMesh, meshB: SVGMesh) {
    this.meshA = meshA.name;
    this.meshB = meshB.name;
  }
}

export function computeSurfaceIntersections(meshA: SVGMesh, meshB: SVGMesh) {

  const startTime = Date.now();
  const info = new SurfaceIntersectionInfo(meshA, meshB);

  info.nbTests = 0;
  info.nbIntersections = 0;

  const matrixBtoA = new Matrix4()
    .copy(meshA.matrixWorld).invert().multiply(meshB.matrixWorld);

  const interPoints = new Array<Vector3>();
  const interLine = new Line3();

  meshA.bvh.bvhcast(meshB.bvh, matrixBtoA, {
    intersectsTriangles: function(triangleA, triangleB, indexA, indexB) {
      info.nbTests += 1;

      // if (triangleA.intersectsTriangle(triangleB, line)) {
      if (trianglesIntersect(triangleA, triangleB, interPoints)) {

        // We're ignoring intersection on single points as there is no triangle
        // cuts to perform
        if (interPoints.length > 1) {
          info.nbIntersections += 1;

          const faceA = meshA.hes.faces[indexA];
          const faceB = meshB.hes.faces[indexB];

          const size = interPoints.length === 2 ? 1 : interPoints.length;
          // We cut triangle for each line of the intersection
          for (let i=0; i<size; i++) {
            interLine.start.copy(interPoints[i]);
            interLine.end.copy(interPoints[(i+1)%interPoints.length]);

            interLine.applyMatrix4(meshA.matrixWorld);
            const edge = cutIntersectingFacesEdgesWithLine(
              meshA, faceA, meshB, faceB, interLine);

            if (edge) {
              info.intersectionEdges.push(edge);
            }
          }
        }
      }
      return false;
    }
  });
  

  info.time = Date.now() - startTime;

  return info;
}


export function gatherEdges(objects: Array<SVGMesh>) {
  const edges = new Set<Edge>();
  for (const obj of objects) {
    for (const face of obj.hes.faces) {
      for (const edge of face.edges) {
        if(edge.nature !== EdgeNature.None) {
          edges.add(edge);
        }
      }
    }
  }
  return edges;
}



export function initPoints(edges: Set<Edge>, camera: PerspectiveCamera) {
  const points = new Set<Point>();
  const processedVertices = new Set<Vertex>();
  for(const e of edges) {
    for(const v of e.vertices) {
      if (!processedVertices.has(v)){
        _proj.copy(v.position).project(camera);
        const point = new Point(new Vector2(_proj.x, _proj.y), [v]);
        v.point = point;
        points.add(point);
        processedVertices.add(v);
      }
    }
  }
  return points;
}


export function cutIntersectingFacesEdgesWithLine(
    meshA: SVGMesh,
    faceA: Face,
    meshB: SVGMesh,
    faceB: Face,
    line: Line3
) {

  const points = [line.start, line.end];
  const faces = [faceA, faceB];

  const interVertices = new Array<Vertex>();

  for (const linePoint of points) {

    const meshVertices = new Array<Vertex>();
    for (const face of faces) {
      const split = cutFaceEdgesAtPosition(face, linePoint);
      if(split) {
        meshVertices.push(split.vertex);
      }
    }

    if (meshVertices.length === 0) {
      console.error("At least one face should be cut");
    }
    else {

      let vertex = meshVertices[0];

      if (meshVertices.length === 2) {
        vertex = mergeVertices(meshVertices[0], meshVertices[1]);
      }

      interVertices.push(vertex);
    }
  }

  if (interVertices.length !== 2) {
    return null;
  }

  // For each point of the intersection line we found the vertices for each mesh
  // and merge them into one
  // In case face triangles both intersect on their side, there is a possibility
  // that edges already exist between the intersection merged vertices.
  // So we remove them as we create a new one
  removeEdgesBetweenVertices(interVertices[0], interVertices[1]);

  const interEdge = new Edge([meshA, meshB], [faceA, faceB],
    interVertices[0], interVertices[1]);
  interEdge.nature = EdgeNature.SurfaceIntersection;

  interVertices[0].edges.add(interEdge);
  interVertices[1].edges.add(interEdge);

  faceA.edges.add(interEdge);
  faceB.edges.add(interEdge);

  return interEdge;
}


export function removeEdgesBetweenVertices(a: Vertex, b: Vertex) {
  const commonEdges = new Array<Edge>();
  for (const edge of a.edges) {
    if (edge.hasVertex(b)) {
      commonEdges.push(edge);
    }
  }

  for (const edge of commonEdges) {

    a.edges.delete(edge);
    b.edges.delete(edge);

    for (const face of edge.faces) {
      face.edges.delete(edge);
    }

  }

}

export function mergeVertices(a: Vertex, b: Vertex) {

  // Add the edges of b to a
  for (const edge of b.edges) {
    a.edges.add(edge);
    edge.replaceVertex(b, a);
  }

  return a;
}


export function cutFaceEdgesAtPosition(face: Face, point: Vector3) {

  for (const edge of face.edges) {
    const vertex = splitEdge(edge, point);
    if (vertex) {
      return vertex;
    }
  }

  return null;
}


export function splitEdge(edge: Edge, position: Vector3, tolerance = 1e-10) {


  // Check first if position matches one edge vertex to avoid unnecessary split
  for (const vertex of edge.vertices) {
    if (vertex.matchesPosition(position, tolerance)) {
      return {
        vertex: vertex,
        cut: false
      };
    }
  }

  // Check if the position cuts the edge in 2
  if (edge.contains3dPosition(position, tolerance)) {

    const lerpNormal = new Vector3();
    edge.normalAtPosition(position, lerpNormal);

    const vertex = new Vertex(-1, position.clone(), lerpNormal);

    for (const v of edge.vertices) {
      v.edges.delete(edge);
    }

    const e1 = edge.clone();
    e1.replaceVertex(edge.vertices[0], vertex);
    edge.vertices[1].edges.add(e1);

    const e2 = edge.clone();
    e2.replaceVertex(edge.vertices[1], vertex);
    edge.vertices[0].edges.add(e2);

    vertex.edges = new Set<Edge>();
    vertex.edges.add(e1);
    vertex.edges.add(e2);

    for (const face of edge.faces) {
      face.edges.delete(edge);
      face.edges.add(e1);
      face.edges.add(e2);
    }

    return {
      vertex: vertex,
      cut: true
    };
  }

  return null;
}


export function splitEdge2d(edge: Edge, position: Vector2, tolerance = 1e-10) {
  const vertexPos = edge.position3dFromPosition2d(position, new Vector3());
  return splitEdge(edge, vertexPos, tolerance);
}



export function singularityForPoint(
    point: Point, camera: PerspectiveCamera
) {

  const naturesFound = new Set<EdgeNature>();
  let concaveSilhouetteFound = false;
  let convexSilhouetteFound = false;

  const edges = point.edges.filter(e => e.nature !== EdgeNature.None);

  // Count the number of different natures connected to the vertex
  for (const edge of edges) {
    naturesFound.add(edge.nature);
    concaveSilhouetteFound ||= ((edge.nature === EdgeNature.Silhouette) && (edge.isConcave));
    convexSilhouetteFound ||= ((edge.nature === EdgeNature.Silhouette) && (!edge.isConcave));
  }

  if (naturesFound.size === 0) {
    console.error("No natures found around point", point);
  }

  else if (naturesFound.size === 1) {
    const [nature] = naturesFound;

    // Curtain fold singularities can occur on a Silhouette segment where
    // there are at least one concave and one convex edges connected
    if (nature === EdgeNature.Silhouette &&
        concaveSilhouetteFound && convexSilhouetteFound) {
      return PointSingularity.CurtainFold;
    }

    // Curtain fold singularties can also occur on a Boundary edge where
    // one of the connected face overlaps the boundary edge
    else if (nature === EdgeNature.Boundary &&
        isBoundaryCurtainFoldVertex(point.vertices[0], camera)) {
      return PointSingularity.CurtainFold;
    }

    // If the number of segment natures is 1 and there is more than 2 segments
    // connected to the point, then there is a bifurcation singularity
    else if (edges.length > 2) {
      return PointSingularity.Bifurcation;
    }

  }

  // There are at least 2 edges of different natures connected to the vertex,
  // then there is a mesh intersection singularity
  else {
    return PointSingularity.MeshIntersection
  }

  return PointSingularity.None;

}


export function findSingularityPointsIn3D(
    points: Set<Point>,
    camera: PerspectiveCamera
) {

  const array = new Array<Point>();

  for (const point of points) {

    point.singularity = singularityForPoint(point, camera);

    if (point.singularity !== PointSingularity.None) {
      array.push(point);
    }

  }

  return array;

}





export function isBoundaryCurtainFoldVertex(vertex: Vertex, camera: PerspectiveCamera) {

  const boundaryHalfEdges = vertex.connectedBoundaryHalfEdges();

  if (boundaryHalfEdges.length > 0) {
    // Get the farthest boundary edge
    let farthestBoundaryHalfEdge = boundaryHalfEdges[0];
    let otherVertex = boundaryHalfEdges[0].vertex;
    let distance = -Infinity;
    for (let i=0; i < boundaryHalfEdges.length; i++) {
      const halfEdge = boundaryHalfEdges[i];

      // Check whether halfEdge is starting from or arriving to sourceVertex
      let tmpVertex;
      if (halfEdge.vertex === vertex) {
        tmpVertex = halfEdge.next.vertex;
      } else {
        tmpVertex = halfEdge.vertex;
      }
      const d = tmpVertex.position.distanceTo(camera.position);
      if (d > distance) {
        distance = d;
        farthestBoundaryHalfEdge = halfEdge;
        otherVertex = tmpVertex;
      }
    }

    // Iterate on each connected faces using halfedges starting from the
    // source vertex of point
    const c = camera.position;
    const p = vertex.position;
    const e = otherVertex.position;
    for (const halfEdge of vertex.halfEdges) {
      if (halfEdge.face !== farthestBoundaryHalfEdge.face) {

        const q = halfEdge.next.vertex.position;
        const r = halfEdge.next.vertex.position;

        if (!sameSide(p,q,r,c,e) && sameSide(c,p,q,e,r) && sameSide(c,p,r,e,q)) {
          return true;
        }
      }
    }
  }
  return false;
}






export function getIntersectingsEdges(edges: Set<Edge>) {

  const array = [];

  const intersectionAlgorithm = bush([...edges], {});
  const intersections = intersectionAlgorithm.run();

  for (const intersection of intersections) {

    const interEdges = intersection.segments as Edge[];
    const pos = new Vector2(intersection.point.x, intersection.point.y);

    if(!interEdges[0].isConnectedToEdge(interEdges[1])) {
      array.push({
        edges: interEdges,
        pos: pos
      })
    }
  }

  return array;

}


export function computeImageIntersections (
    edges: Set<Edge>)
{

  const newPoints = new Array<Point>();
  const splitMap = new Map<Edge, Array<Edge>>();

  const intersections = getIntersectingsEdges(edges);


  for (const intersection of intersections) {

    const interPos = intersection.pos;
    const splitVertices = new Array<Vertex>();

    for (const edge of intersection.edges) {

      let subEdges = splitMap.get(edge);
      if (!subEdges) {
        subEdges = [edge];
        splitMap.set(edge, subEdges);
      }

      let i = 0;
      let subEdge;
      let split;
      do {
        subEdge = subEdges[i];
        split = splitEdge2d(subEdge, interPos);
        i+=1;
      } while(!split && i<subEdges.length);

      if(!split) {
        console.error("Could not find a split vertex", subEdges, interPos);
      } else {

        const {vertex, cut} = split;

        // if cut is true, then the edge has been splited in 2
        if (cut) {

          splitVertices.push(vertex);
          subEdges.remove(subEdge);
          subEdges.push(...vertex.edges);

          edges.delete(subEdge);
          vertex.edges.forEach(e => edges.add(e));
        }
      }
    }


    const newPoint = new Point(interPos.clone(), []);
    newPoint.singularity = PointSingularity.ImageIntersection;
    newPoints.push(newPoint);

    for (const splitVertex of splitVertices) {

      if (splitVertex.point) {
        for (const v of splitVertex.point.vertices) {
          if (!newPoint.vertices.includes(v)){
            newPoint.vertices.push(v);
            v.point = newPoint;
          }
        }
      } else {
        newPoint.vertices.push(splitVertex);
        splitVertex.point = newPoint;
      }

    }

  }
  return newPoints;
}

export function nextEdgeFromPoint(
    currentEdge: Edge,
    point: Point,
    availableEdges: Set<Edge>,
    obj: SVGMesh) : Edge | null {

  // if point is a singularity, stop propagation
  if (point.singularity !== PointSingularity.None) {
    return null;
  }

  // TODO: Taking into account the nature of the current segment and geometric
  // properties to build longer chains
  for (const edge of point.edges) {
    // Check segment has not already been assigned

    if (availableEdges.has(edge) && edge.nature === currentEdge.nature &&
        edge.meshes.includes(obj)) {
      return edge;
    }
  }
  return null;
}

export function createChainedContours(
    edges: Set<Edge>
) : Array<Contour> {

  const contours = new Array<Contour>();

  // Transform the array of segments into a set so we can remove processed
  // segments while iterating on the set to create chains
  // See chaining section of https://hal.inria.fr/hal-02189483
  const remainingEdges = new Set(edges);
  let contourId = 0;
  while(remainingEdges.size > 0) {
    const [startEdge] = remainingEdges;
    const currentObject = startEdge.meshes[0];
    const contour = new Contour(contourId, currentObject);

    remainingEdges.delete(startEdge);
    contour.addEdge(startEdge);

    // Search for connected segments from one direction
    for (const startPoint of startEdge.points) {

      let point = startPoint;
      let segment = nextEdgeFromPoint(startEdge, point, remainingEdges, currentObject);

      while(segment) {
        remainingEdges.delete(segment);
        contour.addEdge(segment);
        point = segment.otherPoint(point);
        segment = nextEdgeFromPoint(segment, point, remainingEdges, currentObject);
      }
    }
    contours.push(contour);
    contourId += 1;
  }

  return contours;
}

interface ContoursVisibilityInfo {
  numberOfRaycasts: number;
}

export function computeContoursVisibility(
    contours: Array<Contour>,
    camera: PerspectiveCamera,
    meshes: Array<SVGMesh>,
): ContoursVisibilityInfo {

  const info = {
    numberOfRaycasts: 0,
    rayOrigins: new Array<Vector3>(),
  }
  const threeObjects = meshes.map(obj => obj.threeMesh);

  // As we cast rays from object to the camera, we want rays to intersect only
  // on the backside face. So we need to change material sideness
  const materialSidenessMap = new Map<Material, Side>();

  for (const mesh of meshes) {

    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) {
        materialSidenessMap.set(material, material.side);
        material.side = DoubleSide;
      }
    } else {
      materialSidenessMap.set(mesh.material, mesh.material.side);
      mesh.material.side = DoubleSide;
    }
 
  }

  for (const contour of contours) {
    // Search for an edge that is not obvisouly hidden by geometry
    // (i.e. not back and not concave, see paper https://hal.inria.fr/hal-02189483)
    // let i = 0;
    // let hiddenByGeometry = false;
    // do {
    //   hiddenByGeometry = contour.edges[i].isConcave || contour.edges[i].isBack;
    //   i += 1;
    // } while(!hiddenByGeometry && i < contour.edges.length);

    // if (hiddenByGeometry) {
    //   contour.visibility = ContourVisibility.Hidden;
    // } else {

    contourVisibilityWithRaycasting(contour, camera, threeObjects);
    info.numberOfRaycasts += 1;
    // }
  }

  // Restaure the sideness of material
  for (const mesh of meshes) {
    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) {
        material.side = materialSidenessMap.get(material)!;
      }
    } else {
      mesh.material.side = materialSidenessMap.get(mesh.material)!;
    }


  }

  return info;
}

const _rayDirection = new Vector3();
const _rayOrigin = new Vector3();
const _rayOriginProj = new Vector3();

/**
 * Return contour visibility via raycasting. If contour is empty, returns hidden
 * @param contour 
 * @param camera 
 * @param objects 
 * @param tolerance 
 * @returns 
 */
export function contourVisibilityWithRaycasting(
    contour: Contour,
    camera: PerspectiveCamera,
    objects: Array<Mesh>,
    tolerance = 1e-10
) {

  // Get the middle segment from the contour
  const edge = contour.middleEdge();

  if (!edge) {
    console.error("Contour has no edges");
    contour.visibility = ContourVisibility.Hidden;
    return;
  }

  // Cast a ray from the middle of the segment to the camera
  _rayOrigin.addVectors(edge.vertices[0].position, edge.vertices[1].position).divideScalar(2);
  _rayDirection.subVectors(camera.position, _rayOrigin).normalize();
  _raycaster.firstHitOnly = false;
  _raycaster.set(_rayOrigin, _rayDirection);

  // Get the projection of the origin of the ray cast
  _rayOriginProj.copy(_rayOrigin).project(camera);
  contour.raycastPoint.set(_rayOriginProj.x, _rayOriginProj.y);

  // Compute total distance in case of mathematical imprecision
  const intersections = _raycaster.intersectObjects(objects, false);

  let totalDistance = 0;
  for (const intersection of intersections) {
    totalDistance += intersection.distance;
  }

  if (totalDistance < tolerance) {
    contour.visibility = ContourVisibility.Visible;
  } else {
    contour.visibility = ContourVisibility.Hidden;
  }
}

export interface AssignPolygonInfo {
  assigned: number;
  nonAssigned: number;
}

export function assignPolygons(
    polygons: Polygon[],
    camera: PerspectiveCamera,
    objects: SVGMesh[],
    defaultColor: ColorRepresentation = 0x333333,
): AssignPolygonInfo {

  let assigned = 0;

  const color = new Color(defaultColor);

  const svgMeshesMap = new Map<Mesh, SVGMesh>();
  const threeMeshes = new Array<Mesh>();
  for (const object of objects) {
    svgMeshesMap.set(object.threeMesh, object);
    threeMeshes.push(object.threeMesh);
  }

  for (const polygon of polygons) {

    _raycaster.setFromCamera(polygon.insidePoint, camera);
    _raycaster.firstHitOnly = true;
    const intersections = _raycaster.intersectObjects(threeMeshes, false);

    if (intersections.length > 0) {
      const intersection = intersections[0];
      const faceIndex = intersection.faceIndex;
      if (faceIndex !== undefined) {
        const intersectionMesh = intersection.object as Mesh;
        polygon.mesh = svgMeshesMap.get(intersectionMesh);
        if (polygon.mesh) {
          polygon.color.copy(polygon.mesh.colorForFaceIndex(faceIndex) || color);
          assigned += 1;
        } else {
          console.error(`Could not associate SVG mesh to polygon ${polygon.id}`);
        }
      } else {
        console.error(`Polygon ${polygon.id} intersection has no face index`,intersection);
      }
    }
  }

  return {
    assigned: assigned,
    nonAssigned: polygons.length - assigned
  };
}




















