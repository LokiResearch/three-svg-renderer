/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Tue Oct 18 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { GUI } from 'dat.gui';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { SVGRenderer, VisibleContourPass, TexturePass, SVGRenderInfo, 
  SVGMesh, 
  FillPass} from '../src/index';
import {debounce} from 'throttle-debounce';
import {
  AmbientLight,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  ShaderChunk,
  Sprite,
  TextureLoader,
  WebGLRenderer
} from 'three';
import SpriteText from 'three-spritetext';

/**
 * This Fragment shader merges the texture transparency with the diffuse Color
 * of the material used.
 * 
 * See https://stackoverflow.com/questions/12368200/displaying-background-colour-through-transparent-png-on-material
 */
const _BlendTextureFragment = ShaderChunk.map_fragment.replace(
  `diffuseColor *= sampledDiffuseColor;`,
  `diffuseColor = vec4( mix( diffuse, sampledDiffuseColor.rgb, sampledDiffuseColor.a ), opacity );`
);

const resourcesURL = window.location+"../../../../resources/";
type CMesh = Mesh<BufferGeometry, MeshStandardMaterial>;

const params = {
  autoRender: true,
  useTransparency: true,
  drawContours: true,
  materialColor: "#FFFFFF"
}

/**
 * Demo textures
 */
const textures = [
  'normal-texture.png', 
  'transparent-texture.png', 
  'svg-texture.svg'
];

/**
 * Create a mesh for each texture for demo purpose
 */
const plane = new PlaneGeometry();
const meshes = new Array<CMesh>(); 
const sprites = new Array<Sprite>();
const loadedTexturePromises = new Array<Promise<void>>();
for (const texture of textures) {

  const mesh = new Mesh(plane, new MeshStandardMaterial({
    side: DoubleSide,
    roughness: 1,
    metalness: 0.2,
  }));
  loadedTexturePromises.push(loadTexture(mesh, texture));
  meshes.push(mesh);

  const sprite = new SpriteText(texture, 0.1);
  sprite.backgroundColor = "#555555";
  sprites.push(sprite);
}

/**
 * Init the SVG Renderer and the draw passes
 */
const svgRenderer = new SVGRenderer();
const fillPass = new FillPass();
const contourPass = new VisibleContourPass();
const texturePass = new TexturePass();
svgRenderer.addDrawPass(fillPass);
svgRenderer.addDrawPass(texturePass);
svgRenderer.addDrawPass(contourPass);

/**
 * Init the Threejs WebGL Renderer 
 */

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

const renderer = new WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(W, H);
renderer.setClearColor(0x555555, 1);
sceneDomElement.appendChild(renderer.domElement);

// Init scene
const scene = new Scene();
const ambientLight = new AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const gap = 0.2;
const planeSize = 1;
const min_pos = -(meshes.length*planeSize + (meshes.length-1)*gap)/2+planeSize/2;
for (let i=0; i<meshes.length ; i++) {
  const mesh = meshes[i];
  const sprite = sprites[i];
  scene.add(mesh);
  mesh.position.set(min_pos + i*(planeSize+gap), 0, 0);
  mesh.add(sprite);
  sprite.position.set(0,0.6,0);
}

// Init camera
const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 50);
camera.position.set(-3, 0, 3);
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
gui.add(params, "drawContours").onChange(updatePasses);
gui.add(params, "useTransparency").onChange(updateTransparentTextures);
gui.addColor(params, "materialColor").onChange(updateColors);
gui.add(params, 'autoRender').onChange(autoRenderChanged);
gui.add({'Render SVG':generateSVG}, 'Render SVG');
gui.open();

//##############################################################################
//                          Setup scene controls
//##############################################################################

const orbitControls = new OrbitControls(camera, renderer.domElement);

orbitControls.addEventListener('change', function () {
  renderScene();
});

window.addEventListener('resize', function () {

  W = sceneDomElement.clientWidth;
  H = sceneDomElement.clientHeight;

  camera.aspect = W/H;
  camera.updateProjectionMatrix();

  renderer.setSize(W, H);
  renderScene();
  generateSVG();

}, false);

/**
 * Enables/Disables automatic SVG Rendering on orbit controls changes
 */
function autoRenderChanged() {
  if (params.autoRender) {
    orbitControls.addEventListener('end', generateSVG);
  } else {
    orbitControls.removeEventListener('end', generateSVG);
  }
}

/**
 * Renders the Threejs scene
 */
function renderScene() {
  renderer.render(scene, camera);
}

/**
 * Enables/Disables SVG Renderer draw passes based on params
 */
function updatePasses() {
  contourPass.enabled = params.drawContours;
  generateSVG();
}

function updateTransparentTextures() {

  if (params.useTransparency) {
    /**
     * Enabling transparency =
     * - Texture is transparent and is displayed with transparency in the scene
     * - Base color is white so the texture stay same color as in the SVG
     * - No background will be drawn in the SVG for the texture
     */

    for (const mesh of meshes) {
      mesh.material.transparent = true;
      mesh.material.color.set(0xFFFFFF);
      fillPass.enabled = false;
      // Use the default fragment
      mesh.material.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>', ShaderChunk.map_fragment);
      };
      mesh.material.needsUpdate = true;
    }

  } else {

    /**
     * Disabling transparency = 
     * - Texture is transparent but uses mesh diffuse color as background color
     * - Diffuse color will be used as background color in the SVG 
     *   (using a FillsPass before the TexturePass)
     */
    
    for (const mesh of meshes) {
      mesh.material.transparent = false;
      mesh.material.color.set(params.materialColor);
      fillPass.enabled = true;
      // Use the blend texture fragment
      mesh.material.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>', _BlendTextureFragment);
      };
      mesh.material.needsUpdate = true;
    }
  }
  renderScene();
  generateSVG();
}

/**
 * Update meshes material color
 */
function updateColors() {
  if (!params.useTransparency) {
    for (const mesh of meshes) {
      mesh.material.color.set(params.materialColor);
      mesh.material.needsUpdate = true;
    }
  }
  renderScene();
  generateSVG();
}

function loadTexture(mesh: CMesh, textureFilename: string) {

  return new Promise<void>((resolve) => {
    fetch(resourcesURL + textureFilename)
      .then((response) => {
        // Create a blob from the data
        response.blob()
          .then((blob) => {

            // Read blob uri
            const reader = new FileReader();
            
            reader.onloadend = () => {
              const dataUrl = reader.result as string;

              // Load the textue to three js
              const loader = new TextureLoader();
              loader.loadAsync(dataUrl)
                .then((texture) => {
                  mesh.material.map = texture;
                  // Threejs transforms SVG files as PNGs in the scene and we need the
                  // raw data to send it to the SVG renderer, so we save it.
                  texture.sourceFile = dataUrl;
                  texture.name = textureFilename;
                  mesh.material.needsUpdate = true;
                  resolve();
                });
            };

            reader.readAsDataURL(blob); 
          }).
          catch(() => {
            console.error("Could create blob from data", response);
          })
      })
      .catch(() => {
        console.error("Could not fetch texure", textureFilename);
      });
  });
}

function clearHTMLElement(e: HTMLElement) {
  let child = e.lastElementChild; 
  while (child) {
    e.removeChild(child);
    child = e.lastElementChild;
  }
}

const debouncedGenerateSVG = debounce(500, () => {
  const svgMeshes = new Array<SVGMesh>();
  
  for (const mesh of meshes) {
    const svgMesh = new SVGMesh(mesh);
    if (mesh.material.map) {
      svgMesh.addTexture({
        name: mesh.material.map.name,
        url: mesh.material.map.sourceFile
      });
    }
    svgMeshes.push(svgMesh);
  }

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

autoRenderChanged();
Promise.all(loadedTexturePromises).then(() => {
  updateTransparentTextures();
})


