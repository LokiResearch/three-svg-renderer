import {GUI} from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import { FillPass, HiddenChainPass, SingularityPointPass, SVGMesh, 
  SVGRenderer, VisibleChainPass, SVGRenderInfo} from '../src/index';
import { BoxBufferGeometry, BufferGeometry, Mesh, MeshStandardMaterial, SphereBufferGeometry, Vector3 } from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {debounce} from 'throttle-debounce';
import { Svg } from '@svgdotjs/svg.js';


const resourcesURL = window.location+"../../../resources/";

const possibleObjects = {
  "cube": "cube",
  "cubes": "cubes",
  "spheres": "spheres",
  "pig": "pig",
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
  scene: "cubes",
  ignoreVisibility: false,
  prettify: false,
}
visibleChainPass.options.colorByNature = true;
visibleChainPass.strokeStyle.width = 1;
singularityPass.enabled = true;

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
let gui_root: GUI;
let style_gui: GUI;
let options_gui: GUI;
let options, style;

/**
 * Chains Pass
 */
const chains_gui_params = [
  {c_params: visibleChainPass, gui_root: gui.addFolder("Visible Chains")},
  {c_params: hiddenChainPass, gui_root: gui.addFolder("Hidden Chains")}
]
for (const {c_params, gui_root} of chains_gui_params) {

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
  options_gui.add(options, "drawChainId").onChange(generateSVG);
  options_gui.add(options, "groupByNature").onChange(generateSVG);
  options_gui.add(options, "drawRaycastPoint").onChange(generateSVG);
  options_gui.add(options, "drawLegend").onChange(generateSVG);
  options_gui.add(options, "colorByNature").onChange(generateSVG);
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

debug_gui.add(params, "ignoreVisibility").onChange(generateSVG);

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

gui_root = gui.addFolder("Export");
gui_root.add(params, 'prettify');

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
    }
  });
});

function generateSVG() {
  debouncedGenerateSVG();
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

function updateInfo() {

  const div = document.getElementById('info');
  if (!div) {
    return;
  }
  const {x,y,z} = camera.position;
  div.innerHTML = `Camera: (${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)})`;

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

autoRenderChanged();
setupScene();
params.autoRender && generateSVG();




