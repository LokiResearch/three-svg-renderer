
import {Element} from '@svgdotjs/svg.js';

declare module '@svgdotjs/svg.js' {
  interface Element {
    addAll: (children: Element[]) => void;
  }
}

Element.prototype.addAll = function(children: Array<Element>) {
  for (const child of children) {
    this.add(child);
  }
}