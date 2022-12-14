# three-svg-renderer

[![npm release](https://img.shields.io/npm/v/three-mesh-renderer)](https://www.npmjs.com/package/three-mesh-renderer)
[![build](https://img.shields.io/github/workflow/status/LokiResearch/three-svg-renderer/build)](https://github.com/LokiResearch/three-mesh-renderer/actions)
[![Documentation](https://img.shields.io/badge/view-Documentation-blue?label=Open)](https://lokiresearch.github.io/three-svg-renderer/doc/index.html)
[![License](https://img.shields.io/badge/License-GPL-green)](#license)

An **experimental** three.js SVG renderer written in Typescript to render 3D scenes as Vector Graphics. The renderer analyzes the geometry in the scene, builds a viewmap of the mesh edges and computes the visible and hidden contours to draw. 

![A SVG rendering of a 3D pig](./images/pig_rendering.png)

## Demo

- [SVG Renderer Demo](https://lokiresearch.github.io/three-svg-renderer/build-examples/RendererDemo.html)
    
- [PNG/SVG Textures Demo](https://lokiresearch.github.io/three-svg-renderer/build-examples/TextureDemo.html)

## Install

```
npm i three-svg-renderer
```

## Documentation

[![Documentation](https://img.shields.io/badge/view-Documentation-blue?label=Open)](https://lokiresearch.github.io/three-svg-renderer/doc/index.html)

*Documentation is still in progress.*

## How to use

```ts
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
```

## References

- Pierre Bénard, Aaron Hertzmann. Line drawings from 3D models: a tutorial. Foundations and Trends in Computer Graphics and Vision, Now Publishers, 2019, 11 (1-2), pp.159. [https://hal.inria.fr/hal-02189483](https://hal.inria.fr/hal-02189483)
- Elmar Eisemann, Holger Winnenmöller, John C. Hart, David Salesin. Stylized Vector Art from 3D Models with Region Support. Computer Graphics Forum, Wiley, 2008, Special Issue: Proceedings of the 19th Eurographics Symposium on Rendering 2008, 27 (4), pp.1199--1207. [https://hal.inria.fr/inria-00345295](https://hal.inria.fr/inria-00345295)
- Stéphane Grabli, Emmanuel Turquin, Frédo Durand, François X. Sillion. Programmable Style for NPR Line Drawing. Rendering Techniques 2004 (Eurographics Symposium on Rendering), 2004, Norrköping, Sweden. [https://hal.inria.fr/inria-00510169](https://hal.inria.fr/inria-00510169)

