import {GUI} from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import { FillPass, HiddenChainPass, SingularityPointPass, SVGMesh, 
  SVGRenderer, VisibleChainPass, SVGRenderInfo} from '../src/index';
import { BoxBufferGeometry, BufferGeometry, Mesh, MeshBasicMaterial, MeshPhongMaterial, MeshStandardMaterial, SphereBufferGeometry, Vector3 } from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {debounce} from 'throttle-debounce';
import { Svg } from '@svgdotjs/svg.js';


const resourcesURL = window.location+"../../../resources/";

let nbTriangles = 0;
let nbObjects = 0;
let nbVertices = 0;

const possibleObjects = {
  "pig": "pig",
  "vincent": "vincent",
  "cube": "cube",
  "cubes": "cubes",
  "spheres": "spheres",
  "torusknot": "torusknot",
}

let svg: Svg | null = null;

// Init SVG Renderer
const svgRenderer = new SVGRenderer();
const fillPass = new FillPass();
const visibleChainPass = new VisibleChainPass();
const hiddenChainPass = new HiddenChainPass();
hiddenChainPass.enabled = false;
const singularityPass = new SingularityPointPass();
singularityPass.enabled = false;
svgRenderer.addPass(fillPass);
svgRenderer.addPass(visibleChainPass);
svgRenderer.addPass(hiddenChainPass);
svgRenderer.addPass(singularityPass);

const params = {
  autoRender: false,
  scene: "pig",
  ignoreVisibility: false,
  colorChainsByNature: false,
  prettify: false,
}

const bgColor = 0x555555;

const sceneDomElement = document.getElementById('scene');
if (!sceneDomElement) {
  throw "Cannot find scene div";
}

const svgDomElement = document.getElementById('svgoutput');
if (!svgDomElement) {
  throw "Cannot find svg output div";
}

let W = sceneDomElement.clientWidth;
let H = sceneDomElement.clientHeight;

// Init renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(W, H);
renderer.setClearColor(bgColor, 1);
sceneDomElement.appendChild(renderer.domElement);

// Init scene
const scene = new THREE.Scene();
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// Init camera
const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 50);
camera.position.set(3, 2, 4);
camera.far = 100;
camera.updateProjectionMatrix();

// Init camera light
const camLight = new THREE.PointLight(0xffffff, 0.5);
camera.add(camLight);
camLight.position.set(7, 7, 7);
scene.add(camera);

//##############################################################################
//                                Setup GUI
//##############################################################################

const gui = new GUI();
gui.add(params, 'scene', possibleObjects).onChange(setupScene);

/**
 * Chains Pass
 */
const chains_gui_params = [
  {pass: visibleChainPass, chain_gui: gui.addFolder("Visible Chains")},
  {pass: hiddenChainPass, chain_gui: gui.addFolder("Hidden Chains")}
]
for (const {pass, chain_gui} of chains_gui_params) {

  chain_gui.add(pass, 'enabled').onChange(paramChanged);
  chain_gui.addColor(pass.options.defaultStyle, "color").onChange(paramChanged);
  chain_gui.add(pass.options.defaultStyle, "width", 0, 20, 0.5).onChange(paramChanged);
  chain_gui.add(pass.options.defaultStyle, "dasharray").onChange(paramChanged);
  chain_gui.add(pass.options.defaultStyle, "opacity", 0, 1, 0.05).onChange(paramChanged);
  chain_gui.add(pass.options, "useRandomColors").onChange(paramChanged);
  chain_gui.add(pass.options, "drawRaycastPoint").onChange(paramChanged);
}

/**
 * Fill Pass
 */
const fill_gui = gui.addFolder("Fill");
fill_gui.add(fillPass, 'enabled').onChange(paramChanged);
fill_gui.add(fillPass.options, "useRandomColors").onChange(paramChanged);
fill_gui.add(fillPass.options, "useFixedStyle").onChange(paramChanged);
fill_gui.add(fillPass.options, "drawRaycastPoint").onChange(paramChanged);
fill_gui.addColor(fillPass.options.fillStyle, "color").onChange(paramChanged);
fill_gui.add(fillPass.options.fillStyle, "opacity", 0, 1, 0.05).onChange(paramChanged);

/**
 * Debug options
 */
const debug_gui = gui.addFolder("Debug");

debug_gui.add(params, "ignoreVisibility").onChange(paramChanged);
debug_gui.add(params, "colorChainsByNature").onChange(colorChainsByNature);


/**
 * Singularity point
 */
const sing_gui = debug_gui.addFolder("Singularity Points");
sing_gui.add(singularityPass, 'enabled').onChange(paramChanged);

sing_gui.add(singularityPass.options, "drawLegend").onChange(paramChanged);
sing_gui.add(singularityPass.options, "pointSize", 0, 20, 0.5).onChange(paramChanged);
sing_gui.add(singularityPass.options, "drawVisiblePoints").onChange(paramChanged);
sing_gui.add(singularityPass.options, "drawHiddenPoints").onChange(paramChanged);

/**
 * Options
 */
gui.add(params, 'prettify', "prettify SVG");

gui.add(params, 'autoRender').onChange(autoRenderChanged);
gui.add({'Render SVG':generateSVG}, 'Render SVG');
gui.add({'Export SVG':exportSVG}, 'Export SVG');
gui.open();


//##############################################################################
//                          Setup scene controls
//##############################################################################

const orbitControls = new OrbitControls(camera, renderer.domElement);

orbitControls.addEventListener('change', function () {
  render();
});

window.addEventListener('resize', function () {

  W = sceneDomElement.clientWidth;
  H = sceneDomElement.clientHeight;

  camera.aspect = W/H;
  camera.updateProjectionMatrix();

  renderer.setSize(W, H);
  render();
  generateSVG();

}, false);

function autoRenderChanged() {
  if (params.autoRender) {
    orbitControls.addEventListener('end', generateSVG);
  } else {
    orbitControls.removeEventListener('end', generateSVG);
  }

}

//##############################################################################
//                          Setup svg rendering
//##############################################################################


const meshMaterial = new THREE.MeshPhongMaterial({
  color: 0x333388,
  flatShading: true,
});

async function setupScene() {
  scene.clear();
  scene.add(ambientLight)
  scene.add(camera);

  switch (params.scene) {
  case "torusknot":
    scene.add(new Mesh(new THREE.TorusKnotGeometry(), meshMaterial));
    break;
  case "pig":
  case "vincent":
    await loadGLTFObject(resourcesURL+params.scene+".gltf");
    break;
  case "cubes":
    setupSceneObjects(new BoxBufferGeometry());
    break;
  case "spheres":
    setupSceneObjects(new SphereBufferGeometry(0.7));
    break;
  case "cube":
  default:
    scene.add(new Mesh(new THREE.BoxGeometry(), meshMaterial));
  }

  nbObjects = 0;
  nbTriangles = 0;
  nbVertices = 0;
  scene.traverse(obj => {
    const m = obj as Mesh;
    if (m.isMesh) {
      console.log(m);

      nbObjects += 1;
      const geometry = m.geometry;

      nbVertices += geometry.attributes.position.count;

      if (geometry.index !== null) {
        nbTriangles += geometry.index.count / 3;
      } else {
        nbTriangles += geometry.attributes.position.count / 3;
      }

      convertMaterial(m);
    }
  })

  render();
  params.autoRender && generateSVG();
}

const loader = new GLTFLoader();
function loadGLTFObject(url: string) {
  return new Promise<void>((resolve) => {
    loader.load(url, function (gltf) {
      scene.add(gltf.scene);
      resolve();
    });
  });
}

function render() {
  gui.updateDisplay();
  updateInfo();
  renderer.render(scene, camera);
}

const debouncedGenerateSVG = debounce(500, () => {
  const svgMeshes = new Array<SVGMesh>();
  scene.traverse(obj => {
    if ((obj as Mesh).isMesh) {
      svgMeshes.push(new SVGMesh(obj as Mesh));
    }
  });

  const info = new SVGRenderInfo();

  svgRenderer.viewmap.options.ignoreVisibility = params.ignoreVisibility;



  svgRenderer.generateSVG(svgMeshes, camera, {w: W, h: H}, info).then(newSvg => {
    svg = newSvg;
    if (svgDomElement) {
      clearHTMLElement(svgDomElement);
      newSvg.addTo(svgDomElement);
      console.info(info);
      updateInfo(info.renderingTime);
    }
  });
});

function paramChanged() {
  if (params.autoRender) {
    generateSVG();
  }
}

function generateSVG() {
  debouncedGenerateSVG();
}

function colorChainsByNature() {

  visibleChainPass.options.styles.Boundary.color = params.colorChainsByNature ? "blue" : undefined;
  visibleChainPass.options.styles.Silhouette.color = params.colorChainsByNature ? "red" : undefined;
  visibleChainPass.options.styles.MeshIntersection.color = params.colorChainsByNature ? "green" : undefined;
  visibleChainPass.options.styles.Crease.color = params.colorChainsByNature ? "Orange" : undefined;
  visibleChainPass.options.styles.Material.color = params.colorChainsByNature ? "purple" : undefined;

  hiddenChainPass.options.styles.Boundary.color = params.colorChainsByNature ? "blue" : undefined;
  hiddenChainPass.options.styles.Silhouette.color = params.colorChainsByNature ? "red" : undefined;
  hiddenChainPass.options.styles.MeshIntersection.color = params.colorChainsByNature ? "green" : undefined;
  hiddenChainPass.options.styles.Crease.color = params.colorChainsByNature ? "Orange" : undefined;
  hiddenChainPass.options.styles.Material.color = params.colorChainsByNature ? "purple" : undefined;

  visibleChainPass.options.drawLegend = (visibleChainPass.enabled || hiddenChainPass.enabled) && params.colorChainsByNature;

  generateSVG();
}

function exportSVG() {
  if (svg) {
    SVGRenderer.exportSVG(svg, params.scene, {prettify: params.prettify});
  }
}

function clearHTMLElement(e: HTMLElement) {
  let child = e.lastElementChild; 
  while (child) {
    e.removeChild(child);
    child = e.lastElementChild;
  }
}

function updateInfo(renderTime = 0) {

  let div = document.getElementById('sceneinfo');
  if (div) {
    div.innerHTML = `
      scene:
      <br>objects: ${nbObjects}
      <br>vertices: ${nbVertices}
      <br>triangles: ${nbTriangles}
    `;
  }

  div = document.getElementById('viewmapinfo');
  if (div) {
    div.innerHTML = `
    svg:
    <br>viewEdges: ${svgRenderer.viewmap.viewEdges.length}
    <br>chains: ${svgRenderer.viewmap.chains.length}
    <br>polygons: ${svgRenderer.viewmap.polygons.length}
    <br>renderTime(ms): ${renderTime}
    `;
  }

  div = document.getElementById('extrainfo');
  if (div) {
    const {x,y,z} = camera.position;
    div.innerHTML = 
      `<br>camera: (${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)})`;
  }
}

function setupSceneObjects(geometry: BufferGeometry) {

  const colors = [
    0xd53e4f, 0xf46d43, 0xfdae61,
    0xfee08b, 0xffffbf, 0xe6f598,
    0xabdda4, 0x66c2a5, 0x3288bd
  ]

  const delta = new Vector3(-1, -1, 0);

  for (let i=0; i<3; i++) {
    for (let j=0; j<3; j++) {
      const c = new Mesh(geometry, new MeshStandardMaterial({
        color: colors[i*3+j]}));
      c.position.set(j*1-i*0.5, i*0.65+j*0.25, -i*0.5-j*0.5);
      c.position.add(delta);
      scene.add(c);
    }
  }
}

function convertMaterial(mesh: Mesh) {
  
  if (Array.isArray(mesh.material)) {

    mesh.material = mesh.material.map(m => {

      if (m.type === 'MeshBasicMaterial') {
        const bm = m as MeshBasicMaterial;
        return new MeshPhongMaterial({
          flatShading: true,
          color: bm.color,
        })
      }

      return m;

    })
    

  } else {

    if (mesh.material.type === 'MeshBasicMaterial') {
      const bm = mesh.material as MeshBasicMaterial;
      mesh.material = new MeshPhongMaterial({
        flatShading: true,
        color: bm.color,
      })
    }
  }

}

autoRenderChanged();
setupScene();
params.autoRender && generateSVG();




