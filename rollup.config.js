import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs'
import htmlTemplate from 'rollup-plugin-generate-html-template';
import { env } from 'process';

const lib_cfg = {
  input: 'src/index.ts',
  external: [
    "three",
    "three-mesh-bvh",
    "three-mesh-halfedge",
    "arrangement-2d-js",
    "isect",
    "@svgdotjs/svg.js",
    "opencv-ts",
    "fast-triangle-triangle-intersection",
  ],
  output: [
    {
      name: 'NPRRendering',
      format: 'umd',
      file: 'build/index.umd.js',
      sourcemap: true,
      globals: {
        'three':'THREE',
        'three-mesh-bvh':'ThreeMeshBVH', 
        'three-mesh-halfedge':'ThreeMeshHalfEdge', 
        'arrangement-2d-js':'Arrangement2d',
        'isect':'isect',
        '@svgdotjs/svg.js':'Svgdotjs',
        "opencv-ts":'opencv',
        'fast-triangle-triangle-intersection':"FastTriangleTriangleIntersection",
      }
    },
    {
      format: 'esm',
      file: 'build/index.esm.js',
      sourcemap: true,
    }
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      compilerOptions: {
        "declaration": true,
        "declarationMap": true,
        "declarationDir": "types",
        "sourceMap": true,
      },
      exclude: ["examples/*", 'node_modules'],
      noEmitOnError: !env.ROLLUP_WATCH,
    })
  ],
};

const examples = ['RendererDemo', 'TextureDemo'];
// const examples = ['RendererDemo'];
const examples_cfg = []

for (const example of examples) {
  examples_cfg.push({
    input: `examples/${example}.ts`,
    output: {
      sourcemap: true,
      file: `build/examples/${example}.js`,
    },
    plugins: [
      nodeResolve({
        browser: true,
      }),
      commonjs(),
      typescript({
        compilerOptions: {
          "sourceMap": true,
        },
        tsconfig: './tsconfig.json',
        noEmitOnError: !env.ROLLUP_WATCH,
      }),
      htmlTemplate({
        template: `examples/${example}.html`,
        target: `${example}.html`,
        attrs: ['type="module"']
      }),
    ],
  }
  );
}

let exported;
if (env.examples) {
  exported = examples_cfg;
} else {
  exported = lib_cfg;
}

export default exported;
