import {GUI} from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import { FillPass, HiddenContourPass, SingularityPointPass, SVGMesh, 
  SVGRenderer, VisibleContourPass, SVGRenderInfo} from '../src/index';
import { Mesh } from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {debounce} from 'throttle-debounce';


const resourcesURL = window.location+"../../../resources/";

const possibleObjects = {
  "cube": "cube",
  "pig": "pig",
  "torusknot": "torusknot",
}


// Init SVG Renderer
const svgRenderer = new SVGRenderer();
const fillPass = new FillPass();
const visibleContourPass = new VisibleContourPass();
const hiddenContourPass = new HiddenContourPass();
hiddenContourPass.enabled = false;
const singularityPass = new SingularityPointPass();
singularityPass.enabled = false;
svgRenderer.addPass(fillPass);
svgRenderer.addPass(visibleContourPass);
svgRenderer.addPass(hiddenContourPass);
svgRenderer.addPass(singularityPass);

const params = {
  autoRender: true,
  scene: "cube",
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
camera.position.set(3, 3, 3);
camera.far = 100;
camera.updateProjectionMatrix();

// Init camera light
const camLight = new THREE.PointLight(0xffffff, 0.5);
camera.add(camLight);
camLight.position.set(0.5, 1, 0);
scene.add(camera);

//##############################################################################
//                                Setup GUI
//##############################################################################

const gui = new GUI();
gui.add(params, 'scene', possibleObjects).onChange(setupScene);
let gui_root: GUI;
let style_gui: GUI;
let options_gui: GUI;
let options, style;

/**
 * Contour Pass
 */
const contours_gui_params = [
  {c_params: visibleContourPass, gui_root: gui.addFolder("Visible Contours")},
  {c_params: hiddenContourPass, gui_root: gui.addFolder("Hidden Contours")}
]
for (const {c_params, gui_root} of contours_gui_params) {

  gui_root.add(c_params, 'enabled').onChange(generateSVG);
  
  style_gui = gui_root.addFolder("Style");
  style = c_params.strokeStyle;
  style_gui.addColor(style, "color").onChange(generateSVG);
  style_gui.add(style, "width", 0, 20, 0.5).onChange(generateSVG);
  style_gui.add(style, "dasharray").onChange(generateSVG);
  style_gui.add(style, "opacity", 0, 1, 0.05).onChange(generateSVG);
  
  options_gui = gui_root.addFolder("Options");
  options = c_params.options;
  options_gui.add(options, "useRandomColors").onChange(generateSVG);
  options_gui.add(options, "drawContourId").onChange(generateSVG);
  options_gui.add(options, "groupByNature").onChange(generateSVG);
  options_gui.add(options, "drawRaycastPoint").onChange(generateSVG);
}

/**
 * Fill Pass
 */
gui_root = gui.addFolder("Fill");
gui_root.add(fillPass, 'enabled').onChange(generateSVG);

style_gui = gui_root.addFolder("Style");
style = fillPass.fillStyle;
style_gui.addColor(style, "color").onChange(generateSVG);
style_gui.add(style, "opacity", 0, 1, 0.05).onChange(generateSVG);

options_gui = gui_root.addFolder("Options");
options = fillPass.options;
options_gui.add(options, "useRandomColors").onChange(generateSVG);
options_gui.add(options, "useFixedColor").onChange(generateSVG);
options_gui.add(options, "drawPolygonId").onChange(generateSVG);
options_gui.add(options, "drawRaycastPoint").onChange(generateSVG);

/**
 * Debug options
 */
const debug_gui = gui.addFolder("Debug");

/**
 * Singularity point
 */
gui_root = debug_gui.addFolder("Singularity Points");
gui_root.add(singularityPass, 'enabled').onChange(generateSVG);

options_gui = gui_root.addFolder("Options");
options = singularityPass.options;
options_gui.add(options, "drawLegend").onChange(generateSVG);
options_gui.add(options, "pointSize", 0, 20, 0.5).onChange(generateSVG);
options_gui.add(options, "drawVisiblePoints").onChange(generateSVG);
options_gui.add(options, "drawHiddenPoints").onChange(generateSVG);

gui.add(params, 'autoRender').onChange(autoRenderChanged);
gui.add({'Render SVG':generateSVG}, 'Render SVG');
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

function setupScene() {
  scene.clear();
  scene.add(ambientLight)
  scene.add(camera);

  switch (params.scene) {
  case "torusknot":
    scene.add(new Mesh(new THREE.TorusKnotGeometry(), meshMaterial));
    break;
  case "pig":
    loadGLTFObject(resourcesURL+"pig.gltf")
    break;
  case "cube":
  default:
    scene.add(new Mesh(new THREE.BoxGeometry(), meshMaterial));
  }

  render();
}

const loader = new GLTFLoader();
function loadGLTFObject(url: string) {
  loader.load(url, function (gltf) {
    scene.add(gltf.scene);
    render();
    params.autoRender && generateSVG();
  });
}

function render() {
  gui.updateDisplay();
  renderer.render(scene, camera);
}

const debouncedGenerateSVG = debounce(500, () => {
  const svgMeshes = new Array<SVGMesh>();
  scene.traverse(obj => {
    if ((obj as Mesh).isMesh) {
      svgMeshes.push(new SVGMesh(obj as Mesh));
    }
  });

  console.log("genrate svg", svgMeshes);

  const info = new SVGRenderInfo();
  svgRenderer.generateSVG(svgMeshes, camera, {w: W, h: H}, {}, info).then(svg => {
    if (svgDomElement) {
      clearHTMLElement(svgDomElement);
      svg.addTo(svgDomElement);
      console.info(info);
    }
  });
});

function generateSVG() {
  debouncedGenerateSVG();
}

function clearHTMLElement(e: HTMLElement) {
  let child = e.lastElementChild; 
  while (child) {
    e.removeChild(child);
    child = e.lastElementChild;
  }
}

autoRenderChanged();
setupScene();
params.autoRender && generateSVG();




