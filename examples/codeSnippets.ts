/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Wed Nov 16 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */


/**
 * This file contains code snippets display in the readme.
 * A separate typescript file allows tsc to check the code.
 */

import { Mesh, PerspectiveCamera, Scene } from 'three';
import { SVGRenderer, FillPass, VisibleContourPass, HiddenContourPass, SVGMesh } from '../src/index';

// Example 1: Basic drawing
{
  const scene = new Scene();
  const camera = new PerspectiveCamera();

  // Gather meshes from the scene and setup SVGMesh
  const meshes = new Array<SVGMesh>();
  scene.traverse(obj => {
    (obj as Mesh).isMesh && meshes.push(new SVGMesh(obj as Mesh));
  });

  // Setup the svg renderer and add pass to it
  const renderer = new SVGRenderer();

  // This pass will draw fills for meshes using the three.js material color
  const fillPass = new FillPass();

  // This pass will draw visible contours of meshes on top of fills
  // using black color and solid line of width 1
  const visibleContourPass = new VisibleContourPass({
    color: "#000000",
    width: 1
  });

  // This pass will draw hidden contours on top of visible and fills
  // using red color, dash line of width 1
  const hiddenContourPass = new HiddenContourPass({
    color: "#FF0000",
    width: 1,
    dasharray: "2,2"
  });

  renderer.addPass(fillPass);
  renderer.addPass(visibleContourPass);
  renderer.addPass(hiddenContourPass);

  // Get the SVG
  renderer.generateSVG(meshes, camera, {w: 1000, h:1000})
    .then((svg) => {
      console.log(svg);
    });
}