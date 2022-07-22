import {GUI} from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import { FillsDrawPass, HiddenContoursDrawPass, SingularityPointsDrawPass, SVGMesh, 
  SVGRenderer, VisibleContoursDrawPass, SVGRenderInfo} from '../src/index';
import { Mesh } from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';

const possibleObjects = {
  "cube": "cube",
  "pig": "pig",
  "torusknot": "torusknot",
}


// Init SVG Renderer
const svgRenderer = new SVGRenderer();
const visibleContoursPass = new VisibleContoursDrawPass();
const hiddenContoursPass = new HiddenContoursDrawPass();
const fillsPass = new FillsDrawPass();
const singularityPass = new SingularityPointsDrawPass();


const params = {
  shape: "cube",
  fills: {
    draw: true,
    style: fillsPass.fillStyle,
    options: fillsPass.options,
  },
  visible_contours: {
    draw: true,
    style: visibleContoursPass.strokeStyle,
    options: visibleContoursPass.options,
  },
  hidden_contours: {
    draw: false,
    style: hiddenContoursPass.strokeStyle,
    options: hiddenContoursPass.options,
  },
  singularityPoints: {
    draw: false,
    options: singularityPass.options,
  }
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
gui.add(params, 'shape', possibleObjects).onChange(setupScene);
let gui_root: GUI;
let style_gui: GUI;
let options_gui: GUI
let options: any, style : any;

// Setup visible and hidden contours gui (same settings basically)
const contours_gui_params = [
  {c_params: params.visible_contours, gui_root: gui.addFolder("Visible Contours")},
  {c_params: params.hidden_contours, gui_root: gui.addFolder("Hidden Contours")}
]
for (const {c_params, gui_root} of contours_gui_params) {

  gui_root.add(c_params, 'draw').onChange(updatePasses);
  
  style_gui = gui_root.addFolder("Style");
  style = c_params.style;
  style_gui.addColor(style, "color").onChange(updatePasses);
  style_gui.add(style, "width", 0, 20, 0.5).onChange(updatePasses);
  style_gui.add(style, "dasharray").onChange(updatePasses);
  style_gui.add(style, "opacity", 0, 1, 0.05).onChange(updatePasses);
  
  options_gui = gui_root.addFolder("Options");
  options = c_params.options;
  options_gui.add(options, "useRandomColors").onChange(updatePasses);
  options_gui.add(options, "drawContourId").onChange(updatePasses);
  options_gui.add(options, "groupByNature").onChange(updatePasses);
  options_gui.add(options, "drawRaycastPoint").onChange(updatePasses);
}

// Setup fills gui
gui_root = gui.addFolder("Fills");
gui_root.add(params.fills, 'draw').onChange(updatePasses);

style_gui = gui_root.addFolder("Style");
style = params.fills.style;
style_gui.addColor(style, "color").onChange(updatePasses);
style_gui.add(style, "opacity", 0, 1, 0.05).onChange(updatePasses);

options_gui = gui_root.addFolder("Options");
options = params.fills.options;
options_gui.add(options, "useRandomColors").onChange(updatePasses);
options_gui.add(options, "useFixedFillColor").onChange(updatePasses);
options_gui.add(options, "drawPolygonId").onChange(updatePasses);
options_gui.add(options, "drawRaycastPoint").onChange(updatePasses);

// Setup debug gui
const debug_gui = gui.addFolder("Debug");

// Debug -> Singularity points
gui_root = debug_gui.addFolder("Singularity Points");
gui_root.add(params.singularityPoints, 'draw').onChange(updatePasses);

options_gui = gui_root.addFolder("Options");
options = params.singularityPoints.options;
options_gui.add(options, "drawLegend").onChange(updatePasses);
options_gui.add(options, "pointSize", 0, 20, 0.5).onChange(updatePasses);
options_gui.add(options, "drawVisiblePoints").onChange(updatePasses);
options_gui.add(options, "drawHiddenPoints").onChange(updatePasses);

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

}, false);


function updatePasses() {

  svgRenderer.clearDrawPasses();

  if (params.fills.draw) {
    svgRenderer.addDrawPass(fillsPass);
  }

  if (params.hidden_contours.draw) {
    svgRenderer.addDrawPass(hiddenContoursPass);
  }

  if (params.visible_contours.draw) {
    svgRenderer.addDrawPass(visibleContoursPass);
  }

  if (params.singularityPoints.draw) {
    svgRenderer.addDrawPass(singularityPass);
  }

}



const meshMaterial = new THREE.MeshPhongMaterial({
  color: 0x333388,
  flatShading: true,
});

function setupScene() {
  // Clean the current scene
  for (const obj of scene.children) {
    obj.removeFromParent();
  }
  scene.add(ambientLight)
  scene.add(camera);

  switch (params.shape) {
    case "torusknot":
      scene.add(new Mesh(new THREE.TorusKnotGeometry(), meshMaterial));
      break;
    case "pig":
      loadGLTFObject(window.location+"../../../../objects/pig.gltf")
      break;
    case "cube":
    default:
      scene.add(new Mesh(new THREE.BoxGeometry(), meshMaterial));
  }

  render();
}

const loader = new GLTFLoader();
function loadGLTFObject(url: string) {
  loader.load(url, function ( gltf ) {
    scene.add(gltf.scene);
  });
}

function render() {

  gui.updateDisplay();

  renderer.render(scene, camera);

}

function generateSVG() {

  const svgMeshes = new Array<SVGMesh>();
  scene.traverse( obj => {
    if ((obj as Mesh).isMesh) {
      svgMeshes.push(new SVGMesh(obj as Mesh));
    }
  });

  const info = new SVGRenderInfo();
  svgRenderer.generateSVG(svgMeshes, camera, {w: W, h: H}, {}, info).then(svg => {
    if (svgDomElement) {
      clearHTMLElement(svgDomElement);
      svg.addTo(svgDomElement);
      console.info(info);
    }
  });

}

function clearHTMLElement(e: HTMLElement) {
  let child = e.lastElementChild; 
  while (child) {
    e.removeChild(child);
    child = e.lastElementChild;
  }
}


updatePasses();
setupScene();