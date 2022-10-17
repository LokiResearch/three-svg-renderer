// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 17/06/2022

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md 

import { DrawPass } from "./DrawPass";
import { Mesh, PerspectiveCamera, Vector2 } from "three";
import cv, {Mat as CVMat} from "opencv-ts";
import { round } from "../../../utils/math";
import {Point, Size, Rect, projectPointImage} from '../../../utils/math';
import { SVGMesh } from "../../SVGMesh";

import {
  Svg, SVG,
  Polygon as SVGPolygon,
  Rect as SVGRect,
  Circle as SVGCircle,
  Element as SVGElement,
  Ellipse as SVGEllipse,
  Path as SVGPath,
  PathArray as SVGPathArray,
  PathCommand as SVGPathCommand,
  Image as SVGImage,
  G as SVGGroup,
  ClipPath as SVGClipPath,

} from '@svgdotjs/svg.js';
import '@svgdotjs/svg.topath.js';
import { Polygon } from "../../viewmap/Polygon";
import { Viewmap } from "../../viewmap/Viewmap";
import { getSVGPath, getSVGImage, NumberAliasToNumber, replaceShapeByPath } from '../svgutils';

declare const _cvVectorIn: CVMat;
declare const _cvVectorOut: CVMat;

export interface Texture {
  name: string;
  url: string;
}

// Make a promise to know when opencv module is available
const cvPromise = new Promise<void>(resolve => {
  cv.onRuntimeInitialized = () => {
    resolve();
  }
});


export class SVGTexturedMesh extends SVGMesh {
  isSVGTexturedMesh = true;

  texture: Texture;

  constructor (mesh: Mesh, texture: Texture) {
    super(mesh);
    this.texture = texture;
  }
}

/* 
TODO: Add UV attribute and support all types of geometries

- Texture is an image
  - Idea 1 (hard):  cut image for each uv, project pieces and draw them separatly
  - Idea 2 (doable): draw image on gpu, get back the framebuffer and draw that in the SVG

- Texture is a svg 
  - Idea 1: cut shapes for each uv, project shapes and draw them

  Good luck for that ! ;)
*/


/**
 * SVGDrawPass used to draw bitmap or svg textures on plane geometries
 */
export class TextureDrawPass extends DrawPass {
  camera: PerspectiveCamera;
  tmeshes: SVGTexturedMesh[];

  /**
     * @param camera 
     * @param tmeshes 
     */
  constructor(camera: PerspectiveCamera, tmeshes: SVGTexturedMesh[]) {
    super();
    this.camera = camera;
    this.tmeshes = tmeshes;
  }
  
  async draw(svg: Svg, viewmap: Viewmap) {

    const renderSize = {
      w: NumberAliasToNumber(svg.width()), 
      h: NumberAliasToNumber(svg.height())
    };

    const elligibleMeshes = getElligibleTMeshes(viewmap, this.tmeshes);

    if (elligibleMeshes.length == 0) {
      return;
    }

    await cvPromise;

    const group = new SVGGroup({id: "textures"});
    svg.add(group);

    // Get the viewmap polygons for each mesh so they can be used as clipping
    // paths
    const meshPolygonsMap = new Map<SVGMesh, Polygon[]>();
    for (const tmesh of this.tmeshes) {
      meshPolygonsMap.set(tmesh, []);
    }

    for (const polygon of viewmap.polygons) {
      if (polygon.mesh && meshPolygonsMap.has(polygon.mesh)) {
        meshPolygonsMap.get(polygon.mesh)?.push(polygon);
      }
    }
    
    for (const tmesh of elligibleMeshes) {
      
      let svgTexture: SVGElement;
      if (tmesh.texture.name.endsWith(".svg")) {
        svgTexture = await getSVGTexture(this.camera, renderSize, tmesh);
      } else {
        svgTexture = await getImageTexture(this.camera, renderSize, tmesh);
      }

      // Draw a clipping path using the polygons
      const clipPath = new SVGClipPath();
      const polygons = meshPolygonsMap.get(tmesh) || []
      for (const polygon of polygons) {
        const svgPath = getSVGPath(polygon.contour, polygon.holes, true);
        clipPath.add(svgPath);
      }
      group.add(clipPath);
      svgTexture.clipWith(clipPath);
      group.add(svgTexture);

    }

  }
}

function getElligibleTMeshes(viewmap: Viewmap, tmeshes: SVGTexturedMesh[]) {

  const elligibleTMeshes = new Array<SVGTexturedMesh>();

  for (const tmesh of tmeshes) {

    if (!viewmap.meshes.has(tmesh)) {
      console.error(`Mesh ${tmesh.name} ignored: please add mesh to the viewmap to render it in this pass`);
    } else if (!tmesh.hes || tmesh.hes.vertices.length !== 4
                          || tmesh.hes.faces.length !== 2) {
      
      // Probably a bit rough, but we consider if the mesh's HalfEdgeStructure
      // has 4 vertices and 2 faces, it is a plane

      console.warn(`Mesh ${tmesh.name} ignored: only plane geometries are currently supported`);
    } else {
      elligibleTMeshes.push(tmesh);
    }
  }

  return elligibleTMeshes;
}




async function getImageTexture(
    camera: PerspectiveCamera,
    renderSize: Size,
    tmesh: SVGTexturedMesh
) {

  const imgEl = document.getElementById('openCVInputImage') as HTMLImageElement;
  imgEl.src = tmesh.texture.url;
  const srcImageMatrix = cv.imread(imgEl);

  // Get the transformation matrix and the output size;
  const imgRect = {x: 0, y: 0, w: srcImageMatrix.cols, h: srcImageMatrix.rows};
  const {matrix, outRect} = getCVTransformMatrix(camera, renderSize, imgRect, tmesh);

  const dstImageMatrix = new cv.Mat();
  const dSize = new cv.Size(outRect.w, outRect.h);
  cv.warpPerspective(srcImageMatrix, dstImageMatrix, matrix, dSize, cv.INTER_LINEAR);

  // OpenCV needs a canvas to draw the transformed image
  const canvas = document.getElementById('openCVOutputCanvas') as HTMLCanvasElement;
  cv.imshow(canvas, dstImageMatrix);

  return new Promise<SVGImage>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const fr = new FileReader();
        fr.onloadend = () => {
          const str = fr.result as string;
          const svgImage = getSVGImage("data:image/png;base64,"+window.btoa(str), outRect);
          resolve(svgImage);
        }
        fr.readAsBinaryString(blob);
      } else {
        reject("Error blob conversion from opencv canvas")
      }
    });
  });
}

async function getSVGTexture(
    camera: PerspectiveCamera,
    renderSize: Size,
    tmesh: SVGTexturedMesh
) {

  return new Promise<SVGGroup>((resolve, reject) => {
    
    const content = svgContentFromDataURL(tmesh.texture.url);

    if (!content) {
      reject("Couldn't retrieved svg content from base64 dataURL");
    } else {
      // As SVG.js gets an extra <svg> div around the svg for internal
      // computations, we only take the children
      // See first question in the FAQ: https://svgjs.dev/docs/3.0/faq/
      const svg = SVG().svg(content);
      
      const group = new SVGGroup({id:"svg-interface-"+tmesh.name});
      for(const child of svg.children()) {
        transformSVG(child, camera, renderSize, tmesh);
        group.add(child)
      }
      resolve(group);
    }
  });
}

function svgContentFromDataURL(dataUrl: string) {
  if (dataUrl.startsWith('data:image/svg+xml;base64,')) {
    // Remove the header
    const encodedString = dataUrl.replace('data:image/svg+xml;base64,','');

    // Convert from base64 to utf8
    const buffer = Buffer.from(encodedString, 'base64');
    return buffer.toString('utf8');
  }
  return null;
}

function getCVTransformMatrix(
    camera: PerspectiveCamera,
    renderSize: Size,
    srcRect: Rect,
    tmesh: SVGTexturedMesh,
) {

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Setup initial points with the size of the input SVG/image
  const srcPointsArray = [
    srcRect.x, srcRect.y,
    srcRect.x, srcRect.y+srcRect.h,
    srcRect.x+srcRect.w, srcRect.y,
    srcRect.x+srcRect.w, srcRect.y+srcRect.h];
  const dstPointsArray = new Array<number>();

  // Get the coordinates in pixels of the four screen corners
  const vertices = tmesh.hes.vertices;
  const corners = vertices.map(vertex => {
    return projectPointImage(vertex.position, new Vector2(), camera, renderSize);
  });

  for (const corner of corners) {
    minX = Math.min(minX, corner.x);
    minY = Math.min(minY, corner.y);
    maxX = Math.max(maxX, corner.x);
    maxY = Math.max(maxY, corner.y);
    dstPointsArray.push(corner.x);
    dstPointsArray.push(corner.y);
  }

  // Recenter the projection on top left corner of the object
  for (let i=0; i<8; i+=2) {
    dstPointsArray[i] -= minX;
    dstPointsArray[i+1] -= minY;
  }

  const srcMat = cv.matFromArray(4, 1, cv.CV_32FC2, srcPointsArray);
  const dstMat = cv.matFromArray(4, 1, cv.CV_32FC2, dstPointsArray);

  const matrix = cv.getPerspectiveTransform(srcMat, dstMat, cv.DECOMP_LU)

  srcMat.delete();
  dstMat.delete();

  return {
    matrix: matrix,
    outRect: {x: minX, y: minY, w: maxX - minX, h: maxY - minY}
  };
}



function transformSVG(
    element: SVGElement,
    camera: PerspectiveCamera,
    renderSize: Size,
    tmesh: SVGTexturedMesh,
    transformMatrix?: CVMat
){
  if (element.type === "svg") {
    const svg = element as Svg;
    let inRect: Rect = {
      x: NumberAliasToNumber(svg.x()), y: NumberAliasToNumber(svg.y()),
      w: NumberAliasToNumber(svg.width()), h: NumberAliasToNumber(svg.height())};
    const viewBox = svg.viewbox();
    if (viewBox.height !== 0 && viewBox.width !==0) {
      inRect = {x: viewBox.x, y: viewBox.y, w: viewBox.width, h: viewBox.height};
    }

    if (inRect.w === 0 || inRect.h === 0) {
      throw("Embedded SVG has no visible dimension: i.e no width/height or viewbox properties.");
    }

    const {matrix, outRect} = getCVTransformMatrix(camera, renderSize, inRect, tmesh);
    svg.x(outRect.x);
    svg.y(outRect.y);
    svg.attr('viewBox', null);
    transformMatrix = matrix;
  } else if (element.type === "polygon") {
    element = replaceShapeByPath(element as SVGPolygon);
  } else if (element.type === "rect") {
    element = replaceShapeByPath(element as SVGRect);
  } else if (element.type === "ellipse") {
    element = replaceShapeByPath(element as SVGEllipse);
  } else if (element.type === "circle") {
    element = replaceShapeByPath(element as SVGCircle);
  } else if (element.type !== "path" && element.type !== "g") {
    console.error("Unknown SVG tag \""+element.type+"\", ignoring.", element);
  }

  if (element.type !== 'svg' && !transformMatrix) {
    throw('There is no perspective transform matrix or it hasn\'t been initialized.');
  }

  // Convert path elements
  if (transformMatrix && element.type === 'path') {
    const path = element as SVGPath;
    transformSVGPath(path, transformMatrix);
  }

  for (const child of element.children()) {
    transformSVG(child, camera, renderSize, tmesh, transformMatrix);
  }

  // Delete OpenCV Matrix if the top element has finished its transform
  if(element.type === 'svg' && transformMatrix) {
    transformMatrix.delete();
  }
}

function transformSVGPath(path: SVGPath, matrix: CVMat) {
  const array = path.array();
  const newCmds = new Array<SVGPathCommand>();
  const lastP = {x: 0, y:0};
  let p: Point, p1: Point, p2: Point;
  for (let i=0; i<array.length; i++) {
    const cmd = array[i];
    const op = cmd[0];
    switch(op) {
    // Horizontal line from the last point
    case 'H':
      p = transformCoords(cmd[1], lastP.y, matrix);
      newCmds.push(['L', round(p.x), round(p.y)]);
      lastP.x = cmd[1];
      break;
      // vertical line from the last point
    case 'V':
      p = transformCoords(lastP.x, cmd[1], matrix);
      newCmds.push(['L', round(p.x), round(p.y)]);
      lastP.y = cmd[1];
      break;
      // Move to | Line to
    case 'M':
    case 'L':
      p = transformCoords(cmd[1], cmd[2], matrix);
      newCmds.push([op, round(p.x), round(p.y)]);
      lastP.x = cmd[1]
      lastP.y = cmd[2];
      break;
      // Curve to
    case 'C':
      p = transformCoords(cmd[1], cmd[2], matrix);
      p1 = transformCoords(cmd[3], cmd[4], matrix);
      p2 = transformCoords(cmd[5], cmd[6], matrix);
      newCmds.push([op, round(p.x), round(p.y),
        round(p1.x), round(p1.y), round(p2.x), round(p2.y)]);
      lastP.x = cmd[5]
      lastP.y = cmd[6];
      break;
      // Close path
    case 'Z':
      newCmds.push(['Z'])
      break;

    default:
      console.info("Unsupported SVG path command", op);
    }
  }
  path.plot(new SVGPathArray(newCmds));
}



/**
 * Transform x and y coords with an OpenCV [perspective] matrix
 *
 * @param      {number}  x       { parameter_description }
 * @param      {number}  y       { parameter_description }
 * @param      {CVMat}   matrix  The matrix
 * @return     {Object}  { description_of_the_return_value }
 */
function transformCoords(x: number, y: number, matrix: CVMat) {
  _cvVectorIn.data32F[0] = x;
  _cvVectorIn.data32F[1] = y;
  cv.perspectiveTransform(_cvVectorIn, _cvVectorOut, matrix);
  return {x: _cvVectorOut.data32F[0], y: _cvVectorOut.data32F[1]};
}
