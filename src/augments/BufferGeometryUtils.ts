// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 21/10/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md

import {BufferAttribute, Mesh} from 'three';

declare module 'three/examples/jsm/utils/BufferGeometryUtils' {
  export function computeMorphedAttributes(object: Mesh): {
    positionAttribute: BufferAttribute,
    normalAttribute: BufferAttribute,
    morphedPositionAttribute: BufferAttribute,
    morphedNormalAttribute: BufferAttribute
  }
}