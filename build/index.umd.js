(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('arrangement-2d-js'), require('isect'), require('fast-triangle-triangle-intersection'), require('@svgdotjs/svg.js'), require('opencv-ts'), require('three-mesh-halfedge'), require('three-mesh-bvh')) :
    typeof define === 'function' && define.amd ? define(['exports', 'three', 'arrangement-2d-js', 'isect', 'fast-triangle-triangle-intersection', '@svgdotjs/svg.js', 'opencv-ts', 'three-mesh-halfedge', 'three-mesh-bvh'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.NPRRendering = {}, global.THREE, global.Arrangement2d, global.isect, global.FastTriangleTriangleIntersection, global.Svgdotjs, global.opencv, global.ThreeMeshHalfEdge, global.ThreeMeshBVH));
})(this, (function (exports, three, Arrangement2D, isect, fastTriangleTriangleIntersection, svg_js, cv, threeMeshHalfedge, threeMeshBvh) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var Arrangement2D__default = /*#__PURE__*/_interopDefaultLegacy(Arrangement2D);
    var cv__default = /*#__PURE__*/_interopDefaultLegacy(cv);

    // Author: Axel Antoine
    // mail: ax.antoine@gmail.com
    // website: https://axantoine.com
    // 09/12/2021
    /**
     * Possible values for the edge nature in the viemap.
     */
    exports.ViewEdgeNature = void 0;
    (function (ViewEdgeNature) {
        // /** Edge is standard */
        // None = "None",
        /** Edge is connected to front-facing and a back-facing face */
        ViewEdgeNature["Silhouette"] = "Silhouette";
        /** Edge is only connected to one face */
        ViewEdgeNature["Boundary"] = "Boundary";
        /** Edge is on the intersection between two meshes */
        ViewEdgeNature["MeshIntersection"] = "MeshIntersection";
        /** Edge is connected to two faces where the angle between normals is acute */
        ViewEdgeNature["Crease"] = "Crease";
        /** Edge is connected to two faces using a different material/vertex color */
        ViewEdgeNature["Material"] = "Material";
    })(exports.ViewEdgeNature || (exports.ViewEdgeNature = {}));
    const VisibilityIndicatingNatures = new Set([
        exports.ViewEdgeNature.Silhouette,
        exports.ViewEdgeNature.Boundary,
        exports.ViewEdgeNature.MeshIntersection,
    ]);
    class ViewEdge {
        /**
         * Halfedge on which the edge is based on
         * @defaultValue null
         */
        halfedge;
        /**
         * List of the meshes the Edge belongs to
         */
        meshes = new Array();
        /**
         * Nature of the edge
         * @defautValue EdgeNature.None
         */
        nature;
        /**
         * Angle between to the connected faces.
         * @defaultValue Infinity */
        faceAngle = Infinity;
        /**
         * Indicates whether the edge is connected to back-facing faces only
         * *Note: this makes only sense with 2 connected faces.*
         * @defaultValue false
        */
        isBack = false;
        /**
         * Indicates wheter the edge is concave.
         * *Note: this makes only sense with 2 connected faces.*
         * @defaultValue false
         */
        isConcave = false;
        faces = new Array();
        a;
        b;
        constructor(a, b, nature, halfedge) {
            this.a = a;
            this.b = b;
            this.nature = nature;
            this.halfedge = halfedge;
        }
        get vertices() {
            return [this.a, this.b];
        }
        get from() {
            return this.a.pos2d;
        }
        get to() {
            return this.b.pos2d;
        }
        toJSON() {
            return {
                id: [...this.a.vertices].map(v => v.id).join(',') + '-' +
                    [...this.b.vertices].map(v => v.id).join(','),
            };
        }
        clone() {
            const edge = new ViewEdge(this.a, this.b, this.nature, this.halfedge);
            edge.faceAngle = this.faceAngle;
            edge.isBack = this.isBack;
            edge.isConcave = this.isConcave;
            edge.meshes.push(...this.meshes);
            edge.faces.push(...this.faces);
            return edge;
        }
        otherVertex(vertex) {
            if (vertex === this.a) {
                return this.b;
            }
            else {
                return this.a;
            }
        }
        hasVertex(vertex) {
            return this.a === vertex || this.b === vertex;
        }
        isConnectedTo(edge) {
            return this.hasVertex(edge.a) || this.hasVertex(edge.b);
        }
    }

    /**
     * Calculates the morphed attributes of a morphed/skinned BufferGeometry.
     * Helpful for Raytracing or Decals.
     * @param {Mesh | Line | Points} object An instance of Mesh, Line or Points.
     * @return {Object} An Object with original position/normal attributes and morphed ones.
     */
    function computeMorphedAttributes( object ) {

    	if ( object.geometry.isBufferGeometry !== true ) {

    		console.error( 'THREE.BufferGeometryUtils: Geometry is not of type BufferGeometry.' );
    		return null;

    	}

    	const _vA = new three.Vector3();
    	const _vB = new three.Vector3();
    	const _vC = new three.Vector3();

    	const _tempA = new three.Vector3();
    	const _tempB = new three.Vector3();
    	const _tempC = new three.Vector3();

    	const _morphA = new three.Vector3();
    	const _morphB = new three.Vector3();
    	const _morphC = new three.Vector3();

    	function _calculateMorphedAttributeData(
    		object,
    		attribute,
    		morphAttribute,
    		morphTargetsRelative,
    		a,
    		b,
    		c,
    		modifiedAttributeArray
    	) {

    		_vA.fromBufferAttribute( attribute, a );
    		_vB.fromBufferAttribute( attribute, b );
    		_vC.fromBufferAttribute( attribute, c );

    		const morphInfluences = object.morphTargetInfluences;

    		if ( morphAttribute && morphInfluences ) {

    			_morphA.set( 0, 0, 0 );
    			_morphB.set( 0, 0, 0 );
    			_morphC.set( 0, 0, 0 );

    			for ( let i = 0, il = morphAttribute.length; i < il; i ++ ) {

    				const influence = morphInfluences[ i ];
    				const morph = morphAttribute[ i ];

    				if ( influence === 0 ) continue;

    				_tempA.fromBufferAttribute( morph, a );
    				_tempB.fromBufferAttribute( morph, b );
    				_tempC.fromBufferAttribute( morph, c );

    				if ( morphTargetsRelative ) {

    					_morphA.addScaledVector( _tempA, influence );
    					_morphB.addScaledVector( _tempB, influence );
    					_morphC.addScaledVector( _tempC, influence );

    				} else {

    					_morphA.addScaledVector( _tempA.sub( _vA ), influence );
    					_morphB.addScaledVector( _tempB.sub( _vB ), influence );
    					_morphC.addScaledVector( _tempC.sub( _vC ), influence );

    				}

    			}

    			_vA.add( _morphA );
    			_vB.add( _morphB );
    			_vC.add( _morphC );

    		}

    		if ( object.isSkinnedMesh ) {

    			object.boneTransform( a, _vA );
    			object.boneTransform( b, _vB );
    			object.boneTransform( c, _vC );

    		}

    		modifiedAttributeArray[ a * 3 + 0 ] = _vA.x;
    		modifiedAttributeArray[ a * 3 + 1 ] = _vA.y;
    		modifiedAttributeArray[ a * 3 + 2 ] = _vA.z;
    		modifiedAttributeArray[ b * 3 + 0 ] = _vB.x;
    		modifiedAttributeArray[ b * 3 + 1 ] = _vB.y;
    		modifiedAttributeArray[ b * 3 + 2 ] = _vB.z;
    		modifiedAttributeArray[ c * 3 + 0 ] = _vC.x;
    		modifiedAttributeArray[ c * 3 + 1 ] = _vC.y;
    		modifiedAttributeArray[ c * 3 + 2 ] = _vC.z;

    	}

    	const geometry = object.geometry;
    	const material = object.material;

    	let a, b, c;
    	const index = geometry.index;
    	const positionAttribute = geometry.attributes.position;
    	const morphPosition = geometry.morphAttributes.position;
    	const morphTargetsRelative = geometry.morphTargetsRelative;
    	const normalAttribute = geometry.attributes.normal;
    	const morphNormal = geometry.morphAttributes.position;

    	const groups = geometry.groups;
    	const drawRange = geometry.drawRange;
    	let i, j, il, jl;
    	let group;
    	let start, end;

    	const modifiedPosition = new Float32Array( positionAttribute.count * positionAttribute.itemSize );
    	const modifiedNormal = new Float32Array( normalAttribute.count * normalAttribute.itemSize );

    	if ( index !== null ) {

    		// indexed buffer geometry

    		if ( Array.isArray( material ) ) {

    			for ( i = 0, il = groups.length; i < il; i ++ ) {

    				group = groups[ i ];

    				start = Math.max( group.start, drawRange.start );
    				end = Math.min( ( group.start + group.count ), ( drawRange.start + drawRange.count ) );

    				for ( j = start, jl = end; j < jl; j += 3 ) {

    					a = index.getX( j );
    					b = index.getX( j + 1 );
    					c = index.getX( j + 2 );

    					_calculateMorphedAttributeData(
    						object,
    						positionAttribute,
    						morphPosition,
    						morphTargetsRelative,
    						a, b, c,
    						modifiedPosition
    					);

    					_calculateMorphedAttributeData(
    						object,
    						normalAttribute,
    						morphNormal,
    						morphTargetsRelative,
    						a, b, c,
    						modifiedNormal
    					);

    				}

    			}

    		} else {

    			start = Math.max( 0, drawRange.start );
    			end = Math.min( index.count, ( drawRange.start + drawRange.count ) );

    			for ( i = start, il = end; i < il; i += 3 ) {

    				a = index.getX( i );
    				b = index.getX( i + 1 );
    				c = index.getX( i + 2 );

    				_calculateMorphedAttributeData(
    					object,
    					positionAttribute,
    					morphPosition,
    					morphTargetsRelative,
    					a, b, c,
    					modifiedPosition
    				);

    				_calculateMorphedAttributeData(
    					object,
    					normalAttribute,
    					morphNormal,
    					morphTargetsRelative,
    					a, b, c,
    					modifiedNormal
    				);

    			}

    		}

    	} else {

    		// non-indexed buffer geometry

    		if ( Array.isArray( material ) ) {

    			for ( i = 0, il = groups.length; i < il; i ++ ) {

    				group = groups[ i ];

    				start = Math.max( group.start, drawRange.start );
    				end = Math.min( ( group.start + group.count ), ( drawRange.start + drawRange.count ) );

    				for ( j = start, jl = end; j < jl; j += 3 ) {

    					a = j;
    					b = j + 1;
    					c = j + 2;

    					_calculateMorphedAttributeData(
    						object,
    						positionAttribute,
    						morphPosition,
    						morphTargetsRelative,
    						a, b, c,
    						modifiedPosition
    					);

    					_calculateMorphedAttributeData(
    						object,
    						normalAttribute,
    						morphNormal,
    						morphTargetsRelative,
    						a, b, c,
    						modifiedNormal
    					);

    				}

    			}

    		} else {

    			start = Math.max( 0, drawRange.start );
    			end = Math.min( positionAttribute.count, ( drawRange.start + drawRange.count ) );

    			for ( i = start, il = end; i < il; i += 3 ) {

    				a = i;
    				b = i + 1;
    				c = i + 2;

    				_calculateMorphedAttributeData(
    					object,
    					positionAttribute,
    					morphPosition,
    					morphTargetsRelative,
    					a, b, c,
    					modifiedPosition
    				);

    				_calculateMorphedAttributeData(
    					object,
    					normalAttribute,
    					morphNormal,
    					morphTargetsRelative,
    					a, b, c,
    					modifiedNormal
    				);

    			}

    		}

    	}

    	const morphedPositionAttribute = new three.Float32BufferAttribute( modifiedPosition, 3 );
    	const morphedNormalAttribute = new three.Float32BufferAttribute( modifiedNormal, 3 );

    	return {

    		positionAttribute: positionAttribute,
    		normalAttribute: normalAttribute,
    		morphedPositionAttribute: morphedPositionAttribute,
    		morphedNormalAttribute: morphedNormalAttribute

    	};

    }

    function disposeMesh(mesh) {
        mesh.geometry.dispose();
        if (mesh.material instanceof Array) {
            const materials = mesh.material;
            for (const material of materials) {
                material.dispose();
            }
        }
        else {
            mesh.material.dispose();
        }
    }
    function computeMorphedGeometry(source, target) {
        if (!source.geometry.hasAttribute("normal")) {
            source.geometry.computeVertexNormals();
        }
        const { morphedPositionAttribute, morphedNormalAttribute } = computeMorphedAttributes(source);
        target.groups = [...source.geometry.groups];
        if (source.geometry.index) {
            target.index = source.geometry.index.clone();
        }
        target.deleteAttribute('position');
        target.deleteAttribute('normal');
        target.setAttribute('position', morphedPositionAttribute);
        target.setAttribute('normal', morphedNormalAttribute);
    }

    const _u$2 = new three.Vector3();
    function projectPointNDC(point, target, camera) {
        _u$2.copy(point).project(camera);
        return target.set(_u$2.x, _u$2.y);
    }
    function projectPoint(point, target, camera, renderSize) {
        projectPointNDC(point, target, camera);
        NDCPointToImage(target, target, renderSize);
        return target;
    }
    /**
     * Converts a point from the NDC coordinates to the image coordinates
     * @param point Point in NDC to be converted
     * @param size Size of the render
     * @returns
     */
    function NDCPointToImage(point, target, size) {
        return target.set((point.x + 1) / 2 * size.w, (1 - point.y) / 2 * size.h);
    }
    /**
     * Converts a point from the image coordinates to the NDC coordinates
     * @param point Point in the image coordinates
     * @param size Size of the render
     * @returns
     */
    function imagePointToNDC(point, target, size) {
        return target.set(2 / size.w * point.x - 1, 1 - 2 / size.h * point.y);
    }
    function hashVector3(vec, multiplier = 1e10) {
        const gap = 1e-3 / multiplier;
        return `${hashNumber(vec.x + gap, multiplier)},` +
            `${hashNumber(vec.y + gap, multiplier)},` +
            `${hashNumber(vec.z + gap, multiplier)}`;
    }
    function hashVector2(vec, multiplier = 1e10) {
        const gap = 1e-3 / multiplier;
        return `${hashNumber(vec.x + gap, multiplier)},` +
            `${hashNumber(vec.y + gap, multiplier)}`;
    }
    function hashNumber(value, multiplier = 1e10) {
        // return (~ ~ (value*multiplier));
        return Math.trunc(value * multiplier);
    }
    /**
     * Checks wether lines intersect and computes the intersection point.
     *
     * Adapted from mathjs
     *
     * @param line1 First segment/line
     * @param line2 Second segment/line
     * @param target Destination of the intersection point
     * @param infiniteLine Wether to consider segments as infinite lines. Default, false
     * @param tolerance Tolerance from which points are considred equal
     * @returns true if lines intersect, false otherwise
     */
    function intersectLines(line1, line2, target, infiniteLine = false, tolerance = 1e-10) {
        const { x: x1, y: y1, z: z1 } = line1.start;
        const { x: x2, y: y2, z: z2 } = line1.end;
        const { x: x3, y: y3, z: z3 } = line2.start;
        const { x: x4, y: y4, z: z4 } = line2.end;
        // (a - b)*(c - d) + (e - f)*(g - h) + (i - j)*(k - l)
        const d1343 = (x1 - x3) * (x4 - x3) + (y1 - y3) * (y4 - y3) + (z1 - z3) * (z4 - z3);
        const d4321 = (x4 - x3) * (x2 - x1) + (y4 - y3) * (y2 - y1) + (z4 - z3) * (z2 - z1);
        const d1321 = (x1 - x3) * (x2 - x1) + (y1 - y3) * (y2 - y1) + (z1 - z3) * (z2 - z1);
        const d4343 = (x4 - x3) * (x4 - x3) + (y4 - y3) * (y4 - y3) + (z4 - z3) * (z4 - z3);
        const d2121 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1);
        const numerator = (d1343 * d4321) - (d1321 * d4343);
        const denominator = (d2121 * d4343) - (d4321 * d4321);
        if (denominator < tolerance) {
            return false;
        }
        const ta = numerator / denominator;
        const tb = ((d1343 + (ta * d4321)) / d4343);
        if (!infiniteLine && (ta < 0 || ta > 1 || tb < 0 || tb > 1)) {
            return false;
        }
        const pax = x1 + (ta * (x2 - x1));
        const pay = y1 + (ta * (y2 - y1));
        const paz = z1 + (ta * (z2 - z1));
        const pbx = x3 + (tb * (x4 - x3));
        const pby = y3 + (tb * (y4 - y3));
        const pbz = z3 + (tb * (z4 - z3));
        if (Math.abs(pax - pbx) < tolerance &&
            Math.abs(pay - pby) < tolerance &&
            Math.abs(paz - pbz) < tolerance) {
            target.set(pax, pay, paz);
            return true;
        }
        return false;
    }
    function vectors3Equal(a, b, tolerance = 1e-10) {
        return (Math.abs(a.x - b.x) < tolerance &&
            Math.abs(a.y - b.y) < tolerance &&
            Math.abs(a.z - b.z) < tolerance);
    }
    function vectors2Equal(a, b, tolerance = 1e-10) {
        return (Math.abs(a.x - b.x) < tolerance &&
            Math.abs(a.y - b.y) < tolerance);
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Thu Oct 20 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    const _matrix$1 = new three.Matrix4();
    /**
     * Determines whether the point `d` is to the left of, to the right of, or on
     * the oriented plane defined by triangle `abc` appearing in counter-clockwise
     * order when viewed from above the plane.
     *
     * See https://hal.inria.fr/hal-02189483 Appendix C.2 Orientation test
     *
     * @param a Triangle point
     * @param b Triangle point
     * @param c Triangle point
     * @param d Test point
     * @param epsilon Precision, default to `1e-10`
     * @returns `1` if on the right side, `-1` if left, `0` if coplanar
     */
    function orient3D(a, b, c, d, epsilon = 1e-10) {
        _matrix$1.set(a.x, a.y, a.z, 1, b.x, b.y, b.z, 1, c.x, c.y, c.z, 1, d.x, d.y, d.z, 1);
        const det = _matrix$1.determinant();
        if (det > epsilon) {
            return 1;
        }
        else if (det < -epsilon) {
            return -1;
        }
        return 0;
    }
    /**
     * Returns whether the point `d` is front facing the triangle `abc`.
     *
     * See https://hal.inria.fr/hal-02189483 Appendix C.2 Orientation test
     *
     * @param a Triangle point
     * @param b Triangle point
     * @param c Triangle point
     * @param d Camera position
     * @param epsilon Precision, default to `1e-10`
     * @returns `True` if triangle if front facing, `False` otherwise
     */
    function frontSide(a, b, c, d, epsilon = 1e-10) {
        return orient3D(d, b, c, a, epsilon) > 0;
    }
    /**
     * Returns whether the points `d` and `e` are on the same side of the triangle `abc`.
     *
     * See https://hal.inria.fr/hal-02189483 Appendix C.2 Orientation test
     *
     * @param a Triangle point
     * @param b Triangle point
     * @param c Triangle point
     * @param d Test point
     * @param e Test point
     * @param epsilon Precision, default to `1e-10`
     * @returns `True` if points are on the same side, `False` otherwise
     */
    function sameSide(a, b, c, d, e, epsilon = 1e-10) {
        return (orient3D(a, b, c, d, epsilon) > 0) === (orient3D(a, b, c, e, epsilon) > 0);
    }
    /**
     * Rounds the number `num` with the given `divider`.
     * @param num Number to round
     * @param divider Value of the divider, default `100`.
     * @returns Rounded number
     */
    function round(num, divider = 100) {
        return Math.round(num * divider) / divider;
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Fri Dec 09 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    exports.ViewVertexSingularity = void 0;
    (function (ViewVertexSingularity) {
        ViewVertexSingularity["None"] = "None";
        ViewVertexSingularity["ImageIntersection"] = "ImageIntersection";
        ViewVertexSingularity["MeshIntersection"] = "MeshIntersection";
        ViewVertexSingularity["CurtainFold"] = "CurtainFold";
        ViewVertexSingularity["Bifurcation"] = "Bifurcation";
    })(exports.ViewVertexSingularity || (exports.ViewVertexSingularity = {}));
    class ViewVertex {
        hash3d = "";
        hash2d = "";
        singularity = exports.ViewVertexSingularity.None;
        vertices = new Set();
        pos3d = new three.Vector3();
        pos2d = new three.Vector2();
        viewEdges = new Array();
        visible = false;
        commonViewEdgeWith(other) {
            for (const viewEdge of this.viewEdges) {
                if (other.viewEdges.includes(viewEdge)) {
                    return viewEdge;
                }
            }
            return null;
        }
        isConnectedTo(other) {
            return this.commonViewEdgeWith(other) != null;
        }
        matches3dPosition(position, tolerance = 1e-10) {
            return vectors3Equal(this.pos3d, position, tolerance);
        }
        matches2dPosition(position, tolerance = 1e-10) {
            return vectors2Equal(this.pos2d, position, tolerance);
        }
        get x() {
            return this.pos2d.x;
        }
        get y() {
            return this.pos2d.y;
        }
    }

    // Author: Axel Antoine
    exports.ChainVisibility = void 0;
    (function (ChainVisibility) {
        ChainVisibility["Unknown"] = "Unknown";
        ChainVisibility["Hidden"] = "Hidden";
        ChainVisibility["Visible"] = "Visible";
    })(exports.ChainVisibility || (exports.ChainVisibility = {}));
    class Chain {
        id;
        object;
        raycastPoint = new three.Vector2();
        edges = new Array();
        vertices = new Array();
        visibility = exports.ChainVisibility.Unknown;
        constructor(id, object) {
            this.id = id;
            this.object = object;
        }
        get head() {
            return this.vertices[0];
        }
        get tail() {
            return this.vertices[this.vertices.length - 1];
        }
        get size() {
            return this.vertices.length;
        }
        get nature() {
            return this.edges[0].nature;
        }
        middlePoint() {
            return this.vertices[Math.floor(this.vertices.length / 2)];
        }
        middleEdge() {
            if (this.edges.length === 0) {
                return null;
            }
            else {
                return this.edges[Math.floor(this.edges.length / 2)];
            }
        }
        addEdge(edge) {
            if (this.edges.length == 0) {
                this.edges.push(edge);
                this.vertices.push(edge.a);
                this.vertices.push(edge.b);
            }
            else {
                if (edge.hasVertex(this.head)) {
                    // Put vertex and segment in the head of the lists
                    this.vertices.unshift(edge.otherVertex(this.head));
                    this.edges.unshift(edge);
                }
                else if (edge.hasVertex(this.tail)) {
                    // Put vertex and segment in the tail of the lists
                    this.vertices.push(edge.otherVertex(this.tail));
                    this.edges.push(edge);
                }
            }
        }
    }

    // Author: Axel Antoine
    class Polygon {
        id;
        mesh;
        color = new three.Color();
        insidePoint = new three.Vector2();
        contour;
        holes;
        constructor(id, contour, holes) {
            this.id = id;
            this.contour = contour;
            this.holes = holes;
        }
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Tue Nov 22 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    // Make the wrapper a global promise so it is load once
    const Arr2DPromise = Arrangement2D__default["default"]();
    class PolygonsInfo {
        smallAreaIgnored = Infinity;
        insidePointErrors = Infinity;
    }
    /**
     * Computes the polygons formed by the projection of the ViewEdges on the image
     * plane
     * @param viewmap
     * @param info
     */
    async function computePolygons(viewmap, info = new PolygonsInfo()) {
        const { chains, polygons } = viewmap;
        const Arr2D = await Arr2DPromise;
        const visibleChains = chains.filter(c => c.visibility === exports.ChainVisibility.Visible);
        const points = new Arr2D.PointList();
        let a, b;
        for (const chain of visibleChains) {
            a = new Arr2D.Point(chain.vertices[0].pos2d.x, chain.vertices[0].pos2d.y);
            for (let i = 1; i < chain.vertices.length; i++) {
                b = new Arr2D.Point(chain.vertices[i].pos2d.x, chain.vertices[i].pos2d.y);
                points.push_back(a);
                points.push_back(b);
                a = b;
            }
        }
        const builder = new Arr2D.ArrangementBuilder();
        const arr2DPolygonlist = builder.getPolygons(points);
        const p = new Arr2D.Point();
        info.smallAreaIgnored = 0;
        info.insidePointErrors = 0;
        for (let i = 0; i < arr2DPolygonlist.size(); i++) {
            const arr2DPolygon = arr2DPolygonlist.at(i);
            const area = arr2DPolygon.getPolyTristripArea();
            if (area > 1e-10) {
                // Transform types from the Arrangement2D to more friendly three types
                const contour = convertContour(arr2DPolygon.contour);
                const holes = convertContourList(arr2DPolygon.holes);
                const polygon = new Polygon(i, contour, holes);
                if (arr2DPolygon.getInsidePoint(p)) {
                    polygon.insidePoint.set(p.x, p.y);
                    polygons.push(polygon);
                }
                else {
                    info.insidePointErrors += 1;
                }
            }
            else {
                info.smallAreaIgnored += 1;
            }
            Arr2D.destroy(arr2DPolygon);
        }
        Arr2D.destroy(arr2DPolygonlist);
        Arr2D.destroy(p);
    }
    function convertContourList(vector) {
        const array = new Array();
        for (let i = 0; i < vector.size(); i++) {
            array.push(convertContour(vector.at(i)));
        }
        return array;
    }
    function convertContour(contour) {
        const array = new Array();
        for (let i = 0; i < contour.size(); i++) {
            const p = contour.at(i);
            array.push(new three.Vector2(p.x, p.y));
        }
        return array;
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Tue Nov 22 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    // See chaining section of https://hal.inria.fr/hal-02189483
    function createChains(viewmap) {
        const { viewEdges, chains } = viewmap;
        const remainingEdges = new Set(viewEdges);
        let chainId = 0;
        while (remainingEdges.size > 0) {
            const [startEdge] = remainingEdges;
            const currentObject = startEdge.meshes[0];
            const chain = new Chain(chainId, currentObject);
            remainingEdges.delete(startEdge);
            chain.addEdge(startEdge);
            // Search for connected edges from one direction
            for (const startViewVertex of startEdge.vertices) {
                let current = startViewVertex;
                let edge = nextChainEdge(startEdge, current, remainingEdges, currentObject);
                while (edge) {
                    remainingEdges.delete(edge);
                    chain.addEdge(edge);
                    current = edge.otherVertex(current);
                    edge = nextChainEdge(edge, current, remainingEdges, currentObject);
                }
            }
            chains.push(chain);
            chainId += 1;
        }
    }
    function nextChainEdge(currentEdge, viewVertex, remainingEdges, obj) {
        // If point is a singularity, chaining stops
        if (viewVertex.singularity !== exports.ViewVertexSingularity.None) {
            return null;
        }
        // TODO: Taking into account the nature of the current segment and geometric
        // properties to build longer chains
        for (const viewEdge of viewVertex.viewEdges) {
            const takeEdge = 
            // Take edge only if it has not been assigned yet
            remainingEdges.has(viewEdge) &&
                // Next edge must have the same nature of the current edge
                viewEdge.nature === currentEdge.nature &&
                // Next edge must be part of the same object
                viewEdge.meshes.includes(obj);
            if (takeEdge) {
                return viewEdge;
            }
        }
        return null;
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Tue Nov 22 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    function find3dSingularities(viewmap) {
        const { viewVertexMap, camera } = viewmap;
        for (const [, viewVertex] of viewVertexMap) {
            viewVertex.singularity = singularityForPoint(viewVertex, camera);
        }
    }
    /**
     *
     * @ref https://hal.inria.fr/hal-02189483/file/contour_tutorial.pdf Section 4.3
     *
     * @param point
     * @param camera
     * @returns
     */
    function singularityForPoint(viewVertex, camera) {
        const natures = new Set();
        let concaveSilhouetteEdgeFound = false;
        let convexSilhouetteEdgeFound = false;
        // Count the number of different natures connected to the vertex
        for (const edge of viewVertex.viewEdges) {
            natures.add(edge.nature);
            if (edge.faces.length > 1 && edge.nature === exports.ViewEdgeNature.Silhouette) {
                concaveSilhouetteEdgeFound ||= edge.isConcave;
                convexSilhouetteEdgeFound ||= !edge.isConcave;
            }
        }
        if (natures.size === 0) {
            console.error("No natures found around vertex", viewVertex);
            return exports.ViewVertexSingularity.None;
        }
        // If the number of segment natures is 1 and there is more than 2 segments
        // connected to the point, then there is a bifurcation singularity
        if (natures.size === 1) {
            if (viewVertex.viewEdges.length > 2 && (natures.has(exports.ViewEdgeNature.Silhouette) || natures.has(exports.ViewEdgeNature.Boundary))) {
                return exports.ViewVertexSingularity.Bifurcation;
            }
        }
        // If there are at least 2 edges of different natures connected to the vertex,
        // then there is a mesh intersection singularity
        if (natures.size > 1) {
            if (natures.has(exports.ViewEdgeNature.Silhouette) ||
                natures.has(exports.ViewEdgeNature.Boundary) ||
                natures.has(exports.ViewEdgeNature.MeshIntersection)) {
                return exports.ViewVertexSingularity.MeshIntersection;
            }
        }
        // Curtains folds:
        // Curtain fold singularity can occur on a non-boundary segment where
        // there are at least one concave and one convex edges connected
        // if (!natures.has(EdgeNature.Boundary) &&
        if (concaveSilhouetteEdgeFound && convexSilhouetteEdgeFound) {
            return exports.ViewVertexSingularity.CurtainFold;
        }
        // Curtain fold singularity can also occur on a Boundary edge where
        // one of the connected face overlaps the boundary edge
        // Note that at this stage of the pipeline, each point should only have
        // one associated vertex, hence the index 0
        if (natures.has(exports.ViewEdgeNature.Boundary)) {
            if (isAnyFaceOverlappingBoundary(viewVertex, camera)) {
                return exports.ViewVertexSingularity.CurtainFold;
            }
        }
        return exports.ViewVertexSingularity.None;
    }
    function* listBoundaryHalfedgesInOut(vertex) {
        yield* vertex.boundaryHalfedgesInLoop();
        yield* vertex.boundaryHalfedgesOutLoop();
    }
    /**
     * Checks if face adjacent to a boundary vertex overlap in image-space.
     *
     * @ref https://hal.inria.fr/hal-02189483/file/contour_tutorial.pdf Appendix C.2.1
     *
     * @param vertex
     * @param camera
     * @returns
     */
    function isAnyFaceOverlappingBoundary(viewVertex, camera) {
        for (const vertex of viewVertex.vertices) {
            // Get the farthest boundary halfedge from the camera and connected to the
            // vertex
            let farthestHalfedge = null;
            let otherVertex = null;
            let distance = -Infinity;
            for (const halfedge of listBoundaryHalfedgesInOut(vertex)) {
                let other;
                if (halfedge.vertex === vertex) {
                    // Halfedge is starting from vertex
                    other = halfedge.next.vertex;
                }
                else {
                    // Halfedge is arriving to vertex
                    other = halfedge.vertex;
                }
                const d = other.position.distanceTo(camera.position);
                if (d > distance) {
                    distance = d;
                    farthestHalfedge = halfedge;
                    otherVertex = other;
                }
            }
            if (farthestHalfedge && otherVertex) {
                // Iterate on each connected faces to vertex and check if it overlaps
                // the farthest halfedge
                const c = camera.position;
                const p = vertex.position;
                const e = otherVertex.position;
                const boundaryFace = farthestHalfedge.twin.face;
                if (boundaryFace) {
                    for (const halfedge of vertex.loopCW()) {
                        if (halfedge.face !== boundaryFace) {
                            const q = halfedge.next.vertex.position;
                            const r = halfedge.next.vertex.position;
                            if (!sameSide(p, q, r, c, e) && sameSide(c, p, q, e, r) && sameSide(c, p, r, e, q)) {
                                return true;
                            }
                        }
                    }
                }
                else {
                    console.error("Boundary halfedge twin has no connected face");
                }
            }
        }
        return false;
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Mon Dec 12 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    /**
     * Creates a ViewVertex at the given position if no one already exist
     * @param viewmap
     * @param pos3d
     * @returns
     */
    function createViewVertex(viewmap, pos3d) {
        const { camera, viewVertexMap, renderSize } = viewmap;
        const hash3d = hashVector3(pos3d);
        let viewVertex = viewVertexMap.get(hash3d);
        if (!viewVertex) {
            viewVertex = new ViewVertex();
            viewVertex.pos3d.copy(pos3d);
            projectPoint(pos3d, viewVertex.pos2d, camera, renderSize);
            viewVertex.hash2d = hashVector2(viewVertex.pos2d);
            viewVertex.hash3d = hash3d;
            viewVertexMap.set(hash3d, viewVertex);
        }
        return viewVertex;
    }

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
    const _u$1 = new three.Vector3();
    const _v$1 = new three.Vector3();
    /**
     * Returns the list
     * @param meshes
     * @param camera
     * @param options
     * @returns
     */
    function setupEdges(viewmap, options) {
        const { viewEdges, camera, meshes } = viewmap;
        const handledHalfedges = new Set();
        for (const mesh of meshes) {
            for (const face of mesh.hes.faces) {
                face.viewEdges = new Array();
            }
            for (const halfedge of mesh.hes.halfedges) {
                if (!handledHalfedges.has(halfedge.twin)) {
                    handledHalfedges.add(halfedge);
                    const props = propsForViewEdge(halfedge, camera, options);
                    if (props) {
                        const meshv1 = halfedge.vertex;
                        const meshv2 = halfedge.twin.vertex;
                        // Get the viewmap points from the vertices or create them
                        const v1 = createViewVertex(viewmap, meshv1.position);
                        const v2 = createViewVertex(viewmap, meshv2.position);
                        meshv1.viewVertex = v1;
                        meshv2.viewVertex = v2;
                        // Point stores a set of vertices, so unicity is guaranted
                        v1.vertices.add(meshv1);
                        v2.vertices.add(meshv2);
                        const viewEdge = new ViewEdge(v1, v2, props.nature, halfedge);
                        viewEdge.faceAngle = props.faceAngle;
                        viewEdge.isConcave = props.isConcave;
                        viewEdge.isBack = props.isBack;
                        viewEdge.meshes.push(mesh);
                        v1.viewEdges.push(viewEdge);
                        v2.viewEdges.push(viewEdge);
                        if (halfedge.face) {
                            halfedge.face.viewEdges.push(viewEdge);
                            viewEdge.faces.push(halfedge.face);
                        }
                        if (halfedge.twin.face) {
                            halfedge.twin.face.viewEdges.push(viewEdge);
                            viewEdge.faces.push(halfedge.twin.face);
                        }
                        viewEdges.push(viewEdge);
                    }
                }
            }
        }
    }
    function propsForViewEdge(halfedge, camera, options) {
        const props = {
            nature: exports.ViewEdgeNature.Silhouette,
            faceAngle: 0,
            isConcave: false,
            isBack: false,
        };
        const opt = {
            creaseAngle: { min: 80, max: 100 },
            ...options
        };
        // If halfedge only has one connected face, then it is a boundary
        if (!halfedge.face || !halfedge.twin.face) {
            props.nature = exports.ViewEdgeNature.Boundary;
            return props;
        }
        else {
            const faceAFront = halfedge.face.isFront(camera.position);
            const faceBFront = halfedge.twin.face.isFront(camera.position);
            // If edge is between two back faces, then it is a back edge
            props.isBack = !faceAFront && !faceBFront;
            // Compute the angle between the 2 connected face
            halfedge.face.getNormal(_u$1);
            halfedge.twin.face.getNormal(_v$1);
            props.faceAngle = Math.acos(_u$1.dot(_v$1)) * 180 / Math.PI;
            // Concavity is determined by an orientation test
            props.isConcave = frontSide(halfedge.prev.vertex.position, halfedge.vertex.position, halfedge.next.vertex.position, halfedge.twin.prev.vertex.position);
            // If edge is between front and back face, then it is a silhouette edge
            if (faceAFront !== faceBFront) {
                props.nature = exports.ViewEdgeNature.Silhouette;
                return props;
            }
            else if (opt.creaseAngle.min <= props.faceAngle &&
                props.faceAngle <= opt.creaseAngle.max) {
                props.nature = exports.ViewEdgeNature.Crease;
                return props;
            }
        }
        return null;
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Tue Nov 29 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    const _u = new three.Vector3();
    const _v = new three.Vector3();
    const _vec3 = new three.Vector3();
    const _u2 = new three.Vector2();
    const _v2 = new three.Vector2();
    function splitViewEdge3d(viewmap, edge, position) {
        /**
         *  We consider that position is on the infinite line formed by a and b
         *
         *            p?          p?           p?
         *            x--a--------x---------b--x
         *                  edge
         */
        const hash = hashVector3(position);
        // if (edge.a.hash3d === hash) {
        if (edge.a.matches3dPosition(position)) {
            if (edge.a.hash3d !== hash) {
                console.log("Different hash", edge.a, position, hash);
            }
            return {
                viewVertex: edge.a,
                viewEdge: null
            };
        }
        // if (edge.b.hash3d === hash) {
        if (edge.b.matches3dPosition(position)) {
            if (edge.b.hash3d !== hash) {
                console.log("Different hash", edge.b, position, hash);
            }
            return {
                viewVertex: edge.b,
                viewEdge: null
            };
        }
        _u.subVectors(position, edge.a.pos3d);
        _v.subVectors(edge.b.pos3d, edge.a.pos3d);
        const cross = _u.cross(_v);
        const v = cross.x + cross.y + cross.z;
        if (v > 1e-10 || v < -1e-10) {
            return null;
        }
        if (_u.dot(_v) < -1e-10) {
            return null;
        }
        const lengthU = _u.length();
        const lengthV = _v.length();
        if (lengthU > lengthV) {
            return null;
        }
        const viewVertex = createViewVertex(viewmap, position);
        const viewEdge = splitViewEdgeWithViewVertex(viewmap, edge, viewVertex);
        return {
            viewVertex: viewVertex,
            viewEdge: viewEdge
        };
    }
    function splitViewEdge2d(viewmap, edge, position) {
        // tolerance = 1e-10) {
        const hash = hashVector2(position);
        // if (edge.a.hash2d === hash) {
        if (edge.a.matches2dPosition(position)) {
            if (edge.a.hash2d !== hash) {
                console.log("Different hash", edge.a, position, hash);
            }
            return {
                viewVertex: edge.a,
                viewEdge: null
            };
        }
        // if (edge.b.hash2d === hash) {
        if (edge.b.matches2dPosition(position)) {
            if (edge.b.hash2d !== hash) {
                console.log("Different hash", edge.b, position, hash);
            }
            return {
                viewVertex: edge.b,
                viewEdge: null
            };
        }
        _u2.subVectors(position, edge.a.pos2d);
        _v2.subVectors(edge.b.pos2d, edge.a.pos2d);
        // Check points are aligned
        const cross = _u2.cross(_v2);
        if (cross > 1e-10 || cross < -1e-10) {
            return null;
        }
        const lengthU = _u2.length();
        const lengthV = _v2.length();
        if (lengthU > lengthV) {
            return null;
        }
        // Check points order
        if (_u.dot(_v) < -1e10) {
            return null;
        }
        _vec3.lerpVectors(edge.a.pos3d, edge.b.pos3d, lengthU / lengthV);
        const viewVertex = createViewVertex(viewmap, _vec3);
        const viewEdge = splitViewEdgeWithViewVertex(viewmap, edge, viewVertex);
        return {
            viewVertex: viewVertex,
            viewEdge: viewEdge
        };
    }
    function splitViewEdgeWithViewVertex(viewmap, edge, vertex) {
        /**
         *  Update the references around the new vertex
         *
         *                       vertex
         *            ---a--------x---------b--
         *                  edge      newedge
         */
        const b = edge.b;
        const newEdge = edge.clone();
        edge.b = vertex;
        newEdge.a = vertex;
        newEdge.b = b;
        vertex.viewEdges.push(edge);
        vertex.viewEdges.push(newEdge);
        b.viewEdges.remove(edge);
        b.viewEdges.push(newEdge);
        for (const face of newEdge.faces) {
            face.viewEdges.push(newEdge);
        }
        viewmap.viewEdges.push(newEdge);
        return newEdge;
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Tue Nov 22 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    const _vec = new three.Vector2();
    /**
     * Finds the 2d singularities in the viewmap and mark them.
     * (Computes the intersection of ViewEdges in the image plane)
     *
     * @param viewmap
     */
    function find2dSingularities(viewmap) {
        const { viewEdges } = viewmap;
        const interAlgorithm = isect.bush([...viewEdges]);
        let intersections = interAlgorithm.run();
        // Keep intersections of non connected edges with at least one visibility
        // indicating ViewEdgeNature
        intersections = intersections.filter(({ segments: [a, b] }) => {
            return !(a).isConnectedTo(b) &&
                (VisibilityIndicatingNatures.has(a.nature) ||
                    VisibilityIndicatingNatures.has(b.nature));
        });
        // As we will cut viewEdge recursively in small viewEdge, we store the current
        // cuts in a map
        const cutMap = new Map();
        for (const intersection of intersections) {
            const splitViewVertices = [];
            _vec.set(intersection.point.x, intersection.point.y);
            const hash = hashVector2(_vec);
            for (const viewEdge of intersection.segments) {
                // Setup edge cuts if needed
                let cuts = cutMap.get(viewEdge);
                if (!cuts) {
                    cuts = [viewEdge];
                    cutMap.set(viewEdge, cuts);
                }
                // Test the cuts to find the intersection point
                let i = 0;
                let splitResult = null;
                while (i < cuts.length && splitResult === null) {
                    splitResult = splitViewEdge2d(viewmap, cuts[i], _vec);
                    i += 1;
                }
                if (splitResult) {
                    splitViewVertices.push(splitResult.viewVertex);
                    /*
                     * Overwrite position and hash so we are sure the vertices have the
                     * exact same 2D position from the camera which is CRUCIAL for the
                     * CGAL step
                     */
                    splitResult.viewVertex.pos2d.copy(_vec);
                    splitResult.viewVertex.hash2d = hash;
                    if (splitResult.viewEdge) {
                        cuts.push(splitResult.viewEdge);
                    }
                }
                else {
                    console.error("Image intersection -- Edge could not be splitted", cuts, _vec);
                }
            }
            if (splitViewVertices.length === 0) {
                console.error("Image intersection -- Should have 2 split vertices");
            }
            else if (splitViewVertices.length === 1) {
                const v = splitViewVertices[0];
                v.singularity = exports.ViewVertexSingularity.ImageIntersection;
            }
            else {
                const v1 = splitViewVertices[0];
                const v2 = splitViewVertices[1];
                // Compute the distance between the vertices and the camera.
                // We only need to insert a singularity point at the farest vertex
                // If equal, both vertices get a singularity
                // See https://hal.inria.fr/hal-02189483, image intersections of type T-cusp
                const d1 = v1.pos3d.distanceTo(viewmap.camera.position);
                const d2 = v2.pos3d.distanceTo(viewmap.camera.position);
                if (d1 > d2 + 1e-10) {
                    v1.singularity = exports.ViewVertexSingularity.ImageIntersection;
                }
                else if (d2 > d1 + 1e-10) {
                    v2.singularity = exports.ViewVertexSingularity.ImageIntersection;
                }
                else {
                    v1.singularity = exports.ViewVertexSingularity.ImageIntersection;
                    v2.singularity = exports.ViewVertexSingularity.ImageIntersection;
                }
            }
        }
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Tue Nov 22 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    class AssignPolygonInfo {
        assigned = Infinity;
        nonAssigned = Infinity;
    }
    const _color = new three.Color();
    const _raycaster$1 = new three.Raycaster();
    const _vec2 = new three.Vector2();
    function assignPolygons(viewmap, options, info = new AssignPolygonInfo()) {
        options = {
            defaultMeshColor: 0x333333,
            ...options,
        };
        _color.set(options.defaultMeshColor);
        info.assigned = 0;
        info.nonAssigned = 0;
        const { meshes, renderSize, camera, polygons } = viewmap;
        const svgMeshesMap = new Map();
        const threeMeshes = new Array();
        for (const mesh of meshes) {
            svgMeshesMap.set(mesh.threeMesh, mesh);
            threeMeshes.push(mesh.threeMesh);
        }
        for (const polygon of polygons) {
            imagePointToNDC(polygon.insidePoint, _vec2, renderSize);
            _raycaster$1.setFromCamera(_vec2, camera);
            _raycaster$1.firstHitOnly = true;
            const intersections = _raycaster$1.intersectObjects(threeMeshes, false);
            if (intersections.length > 0) {
                const intersection = intersections[0];
                const faceIndex = intersection.faceIndex;
                if (faceIndex !== undefined) {
                    const intersectionMesh = intersection.object;
                    polygon.mesh = svgMeshesMap.get(intersectionMesh);
                    if (polygon.mesh) {
                        polygon.color.copy(polygon.mesh.colorForFaceIndex(faceIndex) || _color);
                        info.assigned += 1;
                    }
                    else {
                        console.error(`Could not associate SVG mesh to polygon ${polygon.id}`);
                    }
                }
                else {
                    console.error(`Polygon ${polygon.id} intersection has no face index`, intersection);
                }
            }
        }
        info.nonAssigned = polygons.length - info.assigned;
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Tue Nov 22 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    const _raycaster = new three.Raycaster();
    const _rayDirection = new three.Vector3();
    const _rayOrigin = new three.Vector3();
    class ChainVisibilityInfo {
        nbTests = Infinity;
        nbRaycasts = Infinity;
    }
    function computeChainsVisibility(viewmap, info = new ChainVisibilityInfo()) {
        const { chains, meshes, camera } = viewmap;
        const threeMeshes = meshes.map(obj => obj.threeMesh);
        info.nbRaycasts = 0;
        info.nbTests = 0;
        // As we cast rays from object to the camera, we want rays to intersect only
        // on the backside face. So we need to change material sideness
        const materialSidenessMap = new Map();
        for (const mesh of meshes) {
            if (Array.isArray(mesh.material)) {
                for (const material of mesh.material) {
                    materialSidenessMap.set(material, material.side);
                    material.side = three.DoubleSide;
                }
            }
            else {
                materialSidenessMap.set(mesh.material, mesh.material.side);
                mesh.material.side = three.DoubleSide;
            }
        }
        // Compute chain visibility
        for (const chain of chains) {
            info.nbTests += 1;
            // if (!chainVisibilityWithGeometry(chain)) {
            chainVisibilityWithRaycasting(chain, camera, threeMeshes);
            info.nbRaycasts += 1;
            // }
        }
        // Restaure the sideness of material
        for (const mesh of meshes) {
            if (Array.isArray(mesh.material)) {
                for (const material of mesh.material) {
                    material.side = materialSidenessMap.get(material) ?? material.side;
                }
            }
            else {
                mesh.material.side = materialSidenessMap.get(mesh.material) ?? mesh.material.side;
            }
        }
    }
    /**
     * Determines chain visibility via casting a rayfrom the chain to the camera
     * @param contour
     * @param camera
     * @param objects
     * @param tolerance
     * @returns
     */
    function chainVisibilityWithRaycasting(chain, camera, objects, tolerance = 1e-5) {
        const edge = chain.middleEdge();
        if (!edge) {
            console.error("Contour has no edges");
            chain.visibility = exports.ChainVisibility.Visible;
            return;
        }
        // Cast a ray from the middle of the segment to the camera
        _rayOrigin.lerpVectors(edge.a.pos3d, edge.b.pos3d, 0.5);
        _rayDirection.subVectors(camera.position, _rayOrigin).normalize();
        _raycaster.firstHitOnly = false;
        _raycaster.set(_rayOrigin, _rayDirection);
        // Get the projection of the origin of the ray cast
        chain.raycastPoint.lerpVectors(edge.a.pos2d, edge.b.pos2d, 0.5);
        // Compute total distance in case of mathematical imprecision
        const intersections = _raycaster.intersectObjects(objects, false);
        let totalDistance = 0;
        for (const intersection of intersections) {
            totalDistance += intersection.distance;
        }
        if (totalDistance < tolerance) {
            chain.visibility = exports.ChainVisibility.Visible;
        }
        else {
            chain.visibility = exports.ChainVisibility.Hidden;
        }
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Wed Nov 30 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    const _matrix = new three.Matrix4();
    const _line$1 = new three.Line3();
    const _points = new Array();
    class TriIntersectionInfo {
        name = "";
        nbTests = Infinity;
        nbIntersections = Infinity;
        time = Infinity;
    }
    /**
     * Run the specify callback for all
     * @param meshA
     * @param meshB
     * @param callback
     * @param info
     */
    function meshIntersectionCb(meshA, meshB, callback, info = new TriIntersectionInfo()) {
        const startTime = Date.now();
        info.name = meshA.name + ' ∩ ' + meshB.name;
        info.nbTests = 0;
        info.nbIntersections = 0;
        _matrix.copy(meshA.matrixWorld).invert().multiply(meshB.matrixWorld);
        meshA.bvh.bvhcast(meshB.bvh, _matrix, {
            intersectsTriangles: (t1, t2, idx1, idx2) => {
                info.nbTests += 1;
                if (fastTriangleTriangleIntersection.trianglesIntersect(t1, t2, _points) !== null) {
                    info.nbIntersections += 1;
                    // Ignore intersection on a single point
                    if (_points.length === 1) {
                        return false;
                    }
                    else if (_points.length > 2) {
                        _points.push(_points[0]);
                    }
                    for (let i = 0; i < _points.length - 1; i++) {
                        _line$1.start.copy(_points[i]);
                        _line$1.end.copy(_points[i + 1]);
                        if (_line$1.distance() > 1e-10) {
                            _line$1.applyMatrix4(meshA.matrixWorld);
                            callback(meshA, meshB, _line$1, meshA.hes.faces[idx1], meshB.hes.faces[idx2]);
                        }
                    }
                }
                return false;
            }
        });
        info.time = Date.now() - startTime;
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Tue Nov 29 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    const _line = new three.Line3();
    const _inter = new three.Vector3();
    const _lineDir = new three.Vector3();
    const _dir = new three.Vector3();
    class MeshIntersectionInfo {
        details = new Array();
        nbTests = Infinity;
        nbIntersections = Infinity;
        nbMeshesTested = Infinity;
        nbEdgesAdded = Infinity;
    }
    function computeMeshIntersections(viewmap, info = new MeshIntersectionInfo()) {
        const { meshes } = viewmap;
        info.nbMeshesTested = 0;
        info.nbIntersections = 0;
        info.nbTests = 0;
        info.nbEdgesAdded = 0;
        const intersectCallback = (meshA, meshB, line, faceA, faceB) => {
            // Create vertices for line ends
            const v1 = createViewVertex(viewmap, line.start);
            const v2 = createViewVertex(viewmap, line.end);
            const intersectionViewVertices = [v1, v2];
            // Gather all the viewEdges that lie on faceA and faceB and check if
            // they intersect with the line
            const faceViewEdges = new Set([...faceA.viewEdges, ...faceB.viewEdges]);
            for (const e of faceViewEdges) {
                _line.set(e.a.pos3d, e.b.pos3d);
                if (intersectLines(_line, line, _inter)) {
                    const splitResult = splitViewEdge3d(viewmap, e, _inter);
                    if (splitResult) {
                        if (!intersectionViewVertices.includes(splitResult.viewVertex)) {
                            intersectionViewVertices.push(splitResult.viewVertex);
                        }
                    }
                    else {
                        console.error("Intersection but split failed");
                    }
                }
            }
            // Sort point along the line
            _dir.subVectors(line.end, line.start);
            intersectionViewVertices.sort((a, b) => {
                _dir.subVectors(b.pos3d, a.pos3d);
                return _dir.dot(_lineDir);
            });
            // Create new edges
            for (let i = 0; i < intersectionViewVertices.length - 1; i++) {
                const v1 = intersectionViewVertices[i];
                const v2 = intersectionViewVertices[i + 1];
                const viewEdge = new ViewEdge(v1, v2, exports.ViewEdgeNature.MeshIntersection);
                viewEdge.meshes.push(meshA, meshB);
                viewEdge.faces.push(faceA, faceB);
                v1.viewEdges.push(viewEdge);
                v2.viewEdges.push(viewEdge);
                faceA.viewEdges.push(viewEdge);
                faceB.viewEdges.push(viewEdge);
                viewmap.viewEdges.push(viewEdge);
            }
        };
        // Apply the callback for every pair of meshes
        // TODO: Need to run that for self-intersections as well
        for (let i = 0; i < meshes.length - 1; i++) {
            for (let j = i + 1; j < meshes.length; j++) {
                const meshA = meshes[i];
                const meshB = meshes[j];
                const triInfo = new TriIntersectionInfo();
                meshIntersectionCb(meshA, meshB, intersectCallback, triInfo);
                info.nbIntersections += triInfo.nbIntersections;
                info.nbTests += triInfo.nbTests;
                info.nbMeshesTested += 1;
                info.details.push(triInfo);
            }
        }
    }

    // Author: Axel Antoine
    class ViewmapBuildInfo {
        totalTime = Infinity;
        /** Record or times in ms */
        times = {
            updateGeometries: Infinity,
            updateBVH: Infinity,
            updateHES: Infinity,
            setupEdges: Infinity,
            find3dSingularities: Infinity,
            find2dSingularities: Infinity,
            computeChains: Infinity,
            visibility: Infinity,
            computePolygons: Infinity,
            assignPolygons: Infinity,
            worldTransform: Infinity,
            meshIntersections: Infinity,
            setupPoints: Infinity,
            setupFaceMap: Infinity,
        };
        intersections = new MeshIntersectionInfo();
        visibility = {
            nbTests: Infinity,
            nbRaycasts: Infinity,
        };
        polygons = {
            smallAreaIgnored: Infinity,
            insidePointErrors: Infinity,
            assigned: Infinity,
            nonAssigned: Infinity,
        };
    }
    class Viewmap {
        meshes = new Array();
        viewEdges = new Array();
        // readonly viewPointMap = new Map<string, ViewPoint>();
        viewVertexMap = new Map();
        chains = new Array();
        polygons = new Array();
        camera = new three.PerspectiveCamera();
        renderSize = { w: 500, h: 500 };
        options = {
            updateMeshes: true,
            ignoreVisibility: false,
            defaultMeshColor: 0x555555,
            creaseAngle: {
                min: 80,
                max: 100,
            }
        };
        constructor(options) {
            Object.assign(this.options, options);
        }
        clear() {
            this.meshes.clear();
            this.viewEdges.clear();
            // this.viewPointMap.clear();
            this.viewVertexMap.clear();
            this.chains.clear();
            this.polygons.clear();
        }
        build(meshes, camera, renderSize, info = new ViewmapBuildInfo(), progressCallback) {
            this.clear();
            this.meshes.push(...meshes);
            this.camera.copy(camera);
            this.camera.getWorldPosition(camera.position);
            this.renderSize.w = renderSize.w;
            this.renderSize.h = renderSize.h;
            const actions = this.setupActions(info);
            info.totalTime = Date.now();
            return this.buildAsync(0, actions, info, progressCallback);
        }
        buildAsync(idx, actions, info, progressCallback) {
            info.totalTime = Date.now();
            return new Promise((resolve) => {
                if (idx < actions.length) {
                    progressCallback && progressCallback({
                        totalSteps: actions.length,
                        currentStep: idx + 1,
                        currentStepName: actions[idx].name
                    });
                    console.info(`Viewmap step ${idx + 1}/${actions.length} : ${actions[idx].name}`);
                    actions[idx].process().then(() => {
                        resolve(this.buildAsync(idx + 1, actions, info, progressCallback));
                    });
                }
                else {
                    info.totalTime = Date.now() - info.totalTime;
                    resolve();
                }
            });
        }
        setupActions(info = new ViewmapBuildInfo()) {
            const actions = new Array();
            if (this.options.updateMeshes) {
                /**
                 * Update Morphed Geometries
                 */
                actions.push({
                    name: "Update Morphed Geometries",
                    process: async () => {
                        const startTime = Date.now();
                        for (const mesh of this.meshes) {
                            mesh.updateMorphGeometry();
                        }
                        info.times.updateGeometries = Date.now() - startTime;
                    }
                });
                /**
                 * Update BVH structs
                 */
                actions.push({
                    name: "Update BVH Structures",
                    process: async () => {
                        const startTime = Date.now();
                        for (const mesh of this.meshes) {
                            mesh.updateBVH(false);
                        }
                        info.times.updateBVH = Date.now() - startTime;
                    }
                });
                /**
                 * Update Halfedge structs
                 */
                actions.push({
                    name: "Update Halfedge Structures",
                    process: async () => {
                        const startTime = Date.now();
                        for (const mesh of this.meshes) {
                            mesh.updateHES(false);
                        }
                        info.times.updateHES = Date.now() - startTime;
                    }
                });
                /**
                 * Update Halfedge structures to world positions
                 */
                actions.push({
                    name: "Transform local 3d points into world",
                    process: async () => {
                        const startTime = Date.now();
                        for (const mesh of this.meshes) {
                            for (const vertex of mesh.hes.vertices) {
                                vertex.position.applyMatrix4(mesh.matrixWorld);
                            }
                        }
                        info.times.worldTransform = Date.now() - startTime;
                    }
                });
            }
            /**
             * Setup edges
             */
            actions.push({
                name: "Setup viewmap edges",
                process: async () => {
                    const startTime = Date.now();
                    setupEdges(this, this.options);
                    info.times.setupEdges = Date.now() - startTime;
                }
            });
            /**
             * Compute Meshes Intersections
             */
            actions.push({
                name: "Compute meshes intersections",
                process: async () => {
                    const startTime = Date.now();
                    computeMeshIntersections(this, info.intersections);
                    info.times.meshIntersections = Date.now() - startTime;
                }
            });
            /**
             * Find singularities in the 3D space
             */
            actions.push({
                name: "Find singularities in the 3d space",
                process: async () => {
                    const startTime = Date.now();
                    // this.singularityPoints = 
                    find3dSingularities(this);
                    info.times.find3dSingularities = Date.now() - startTime;
                }
            });
            /**
             * Find singularity points in the 2d space (image place intersections)
             * This step creates new points and segments on-the-fly
             */
            actions.push({
                name: "Find singularities in the 2d space",
                process: async () => {
                    const startTime = Date.now();
                    find2dSingularities(this);
                    info.times.find2dSingularities = Date.now() - startTime;
                }
            });
            /**
             * Compute chains from the set of segments: link segments depending
             * of their connexity and nature
             */
            actions.push({
                name: "Create chains",
                process: async () => {
                    const startTime = Date.now();
                    createChains(this);
                    info.times.computeChains = Date.now() - startTime;
                }
            });
            /**
             * Compute contours visibility using geometry's topology or raycasting if
             * need.
             * If ignore visibility is set, set all contours to be visible
             */
            actions.push({
                name: "Compute chains visibility",
                process: async () => {
                    if (!this.options.ignoreVisibility) {
                        const startTime = Date.now();
                        const visInfo = new ChainVisibilityInfo();
                        computeChainsVisibility(this, visInfo);
                        info.visibility.nbRaycasts = visInfo.nbRaycasts;
                        info.visibility.nbTests = visInfo.nbTests;
                        info.times.visibility = Date.now() - startTime;
                    }
                    else {
                        this.chains.map(chain => chain.visibility = exports.ChainVisibility.Visible);
                    }
                }
            });
            /**
             * Compute the polygons formed by the visible subset of contours
             */
            actions.push({
                name: "Compute polygons",
                process: async () => {
                    const startTime = Date.now();
                    const polyInfo = new PolygonsInfo();
                    await computePolygons(this, polyInfo);
                    info.polygons.smallAreaIgnored = polyInfo.smallAreaIgnored;
                    info.polygons.insidePointErrors = polyInfo.insidePointErrors;
                    info.times.computePolygons = Date.now() - startTime;
                }
            });
            /**
             * Assign polygons to their corresponding object with raycasting
             */
            actions.push({
                name: "Assign Polygons",
                process: async () => {
                    const startTime = Date.now();
                    const assignInfo = new AssignPolygonInfo();
                    assignPolygons(this, this.options, assignInfo);
                    info.polygons.assigned = assignInfo.assigned;
                    info.polygons.nonAssigned = assignInfo.nonAssigned;
                    info.times.assignPolygons = Date.now() - startTime;
                }
            });
            return actions;
        }
        visibleChains() {
            return this.chains.filter(c => c.visibility === exports.ChainVisibility.Visible);
        }
        hiddenChains() {
            return this.chains.filter(c => c.visibility === exports.ChainVisibility.Hidden);
        }
    }

    // Normalise attributes
    const normaliseAttributes = (attr) => {
      for (const a in attr) {
        if (!/fill|stroke|opacity|transform/.test(a)) { delete attr[a]; }
      }

      return attr
    };

    svg_js.extend(svg_js.Shape, {
      // Convert element to path
      toPath (replace = true) {
        var d;

        switch (this.type) {
        case 'rect': {
          let {
            width: w,
            height: h,
            rx,
            ry,
            x,
            y
          } = this.attr(['width', 'height', 'rx', 'ry', 'x', 'y']);

          // normalise radius values, just like the original does it (or should do)
          if (rx < 0) rx = 0;
          if (ry < 0) ry = 0;
          rx = rx || ry;
          ry = ry || rx;
          if (rx > w / 2) rx = w / 2;
          if (ry > h / 2) ry = h / 2;

          if (rx && ry) {
            // if there are round corners

            d = [
              ['M', rx + x, y],
              ['h', w - 2 * rx],
              ['a', rx, ry, 0, 0, 1, rx, ry],
              ['v', h - 2 * ry],
              ['a', rx, ry, 0, 0, 1, -rx, ry],
              ['h', -w + 2 * rx],
              ['a', rx, ry, 0, 0, 1, -rx, -ry],
              ['v', -h + 2 * ry],
              ['a', rx, ry, 0, 0, 1, rx, -ry],
              ['z']
            ];
          } else {
            // no round corners, no need to draw arcs
            d = [
              ['M', x, y],
              ['h', w],
              ['v', h],
              ['h', -w],
              ['v', -h],
              ['z']
            ];
          }

          break
        }
        case 'circle':
        case 'ellipse': {
          let rx = this.rx();
          let ry = this.ry();
          let { cx, cy } = this.attr(['cx', 'cy']);

          d = [
            ['M', cx - rx, cy],
            ['A', rx, ry, 0, 0, 0, cx + rx, cy],
            ['A', rx, ry, 0, 0, 0, cx - rx, cy],
            ['z']
          ];

          break
        }
        case 'polygon':
        case 'polyline':
        case 'line':

          d = this.array().map(function (arr) {
            return ['L'].concat(arr)
          });

          d[0][0] = 'M';

          if (this.type === 'polygon') { d.push('Z'); }

          break
        case 'path':
          d = this.array();
          break
        default:
          throw new Error('SVG toPath got unsupported type ' + this.type, this)
        }

        const path = new svg_js.Path()
          .plot(d)
          .attr(normaliseAttributes(this.attr()));

        if (replace) {
          this.replace(path);
        }

        return path
      }

    });

    // Author: Axel Antoine
    class SVGDrawInfo {
        totalTime = Infinity;
        passesInfo = new Array();
    }
    class SVGDrawHandler {
        options = {
            prettifySVG: false,
        };
        passes = new Array();
        constructor(options) {
            Object.assign(this.options, options);
        }
        async drawSVG(viewmap, size, info = new SVGDrawInfo()) {
            const buildStartTime = Date.now();
            const svg = new svg_js.Svg();
            svg.width(size.w);
            svg.height(size.h);
            // Call the draw passes
            for (let i = 0; i < this.passes.length; i++) {
                const pass = this.passes[i];
                if (pass.enabled) {
                    const passStartTime = Date.now();
                    await pass.draw(svg, viewmap);
                    info.passesInfo.push({
                        name: pass.name,
                        order: i,
                        time: Date.now() - passStartTime,
                    });
                }
            }
            info.totalTime = Date.now() - buildStartTime;
            return svg;
        }
    }

    // Author: Axel Antoine
    // mail: ax.antoine@gmail.com
    // website: https://axantoine.com
    // 16/06/2022
    class DrawPass {
        /**
         * Name of the draw pass
         */
        name;
        /**
         * Enables/Disables draw pass.
         * @defaultValue `true`
        */
        enabled = true;
        constructor() {
            this.name = this.constructor.name;
        }
    }

    // Author: Axel Antoine
    function getSVGImage(url, rect) {
        const svgImage = new svg_js.Image();
        svgImage.load(url);
        svgImage.x(rect.x);
        svgImage.y(rect.y);
        svgImage.width(rect.w);
        svgImage.height(rect.h);
        return svgImage;
    }
    function getSVGText(text, x, y, fontStyle = {}, strokeStyle = {}, fillStyle = {}) {
        const svgText = new svg_js.Text();
        svgText.text(text);
        svgText.x(x);
        svgText.y(y);
        svgText.font(fontStyle);
        svgText.stroke(strokeStyle);
        svgText.fill(fillStyle);
        return svgText;
    }
    function getSVGPath(contour, holes, closed, strokeStyle, fillStyle) {
        const path = new svg_js.Path();
        let cmds = getSVGPathCommands(contour, closed);
        for (const hole of holes) {
            cmds = cmds.concat(getSVGPathCommands(hole, closed));
        }
        path.plot(new svg_js.PathArray(cmds));
        if (strokeStyle) {
            path.stroke(strokeStyle);
        }
        else {
            path.stroke('none');
        }
        if (fillStyle) {
            path.fill({ ...fillStyle, rule: "evenodd" });
        }
        else {
            path.fill('none');
        }
        return path;
    }
    function getSVGPathCommands(points, closed = true) {
        const cmds = new Array();
        let p;
        if (points.length > 0) {
            p = points[0];
            cmds.push(['M', round(p.x), round(p.y)]);
            for (let i = 1; i < points.length; i++) {
                p = points[i];
                cmds.push(['L', round(p.x), round(p.y)]);
            }
            if (closed) {
                cmds.push(['Z']);
            }
        }
        return cmds;
    }
    function getSVGCircle(cx, cy, radius, strokeStyle = {}, fillStyle = {}) {
        const circle = new svg_js.Circle();
        circle.center(cx, cy);
        circle.radius(radius);
        circle.stroke(strokeStyle);
        circle.fill(fillStyle);
        return circle;
    }
    const _ignoredAttributes = ["x", "y", "width", "height", "viewbox", "cx", "cy", "rw", "rx", "points"];
    function replaceShapeByPath(shape) {
        const path = shape.toPath(true);
        const attributes = shape.attr();
        for (const attribute in attributes) {
            if (!_ignoredAttributes.includes(attribute)) {
                path.attr(attribute, attributes[attribute]);
            }
        }
        return path;
    }
    function NumberAliasToNumber(n) {
        switch (typeof n) {
            case "number":
                return n;
            case "string":
                return Number(n);
            case typeof svg_js.Number:
                return n.value;
        }
        return 0;
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Wed Dec 14 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    function mergeOptions(target, source) {
        // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object)
                Object.assign(source[key], mergeOptions(target[key], source[key]));
        }
        // Join `target` and modified `source`
        Object.assign(target || {}, source);
        return target;
    }

    // Author: Axel Antoine
    class FillPass extends DrawPass {
        options = {
            drawRaycastPoint: false,
            useRandomColors: false,
            useFixedStyle: false,
            fillStyle: {
                color: "#333333",
                opacity: 1,
            }
        };
        constructor(options = {}) {
            super();
            mergeOptions(this.options, options);
        }
        async draw(svg, viewmap) {
            const group = new svg_js.G({ id: "fills" });
            svg.add(group);
            for (const mesh of viewmap.meshes) {
                if (mesh.drawFills) {
                    const polygons = viewmap.polygons.filter(p => p.mesh === mesh);
                    const objectGroup = new svg_js.G({ id: mesh.name });
                    group.add(objectGroup);
                    for (const polygon of polygons) {
                        drawPolygon(group, polygon, this.options);
                    }
                }
            }
        }
    }
    function drawPolygon(parent, polygon, options) {
        // Make a copy of the style so we can modify it
        const style = { ...options.fillStyle };
        // If not using fixed color through the style, use the object color
        if (!options.useFixedStyle) {
            style.color = '#' + polygon.color.getHexString();
        }
        if (options.useRandomColors) {
            style.color = svg_js.Color.random().toString();
        }
        const path = getSVGPath(polygon.contour, polygon.holes, true, {}, style);
        path.id("fill-" + polygon.id);
        parent.add(path);
        if (options.drawRaycastPoint) {
            drawPolygonRaycastPoint(parent, polygon);
        }
    }
    function drawPolygonRaycastPoint(parent, polygon) {
        const strokeStyle = { color: "black" };
        const fillStyle = { color: "white" };
        const cx = polygon.insidePoint.x;
        const cy = polygon.insidePoint.y;
        const point = getSVGCircle(cx, cy, 2, strokeStyle, fillStyle);
        point.id('raycast-point');
        parent.add(point);
    }

    // Author: Axel Antoine
    const ViewVertexSingularities = Object.values(exports.ViewVertexSingularity)
        .filter(singularity => singularity !== exports.ViewVertexSingularity.None);
    const ViewVertexSingularityColor = {
        [exports.ViewVertexSingularity.None]: "",
        [exports.ViewVertexSingularity.ImageIntersection]: "green",
        [exports.ViewVertexSingularity.MeshIntersection]: "red",
        [exports.ViewVertexSingularity.CurtainFold]: "blue",
        [exports.ViewVertexSingularity.Bifurcation]: "orange",
    };
    class SingularityPointPass extends DrawPass {
        options = {
            drawVisiblePoints: true,
            drawHiddenPoints: false,
            drawLegend: true,
            pointSize: 2,
        };
        constructor(options = {}) {
            super();
            Object.assign(this.options, options);
        }
        async draw(svg, viewmap) {
            // Update point visibility to avoid drawing point on hidden chains if only
            // visible chains are drawn
            for (const chain of viewmap.chains) {
                for (const p of chain.vertices) {
                    p.visible = p.visible || chain.visibility === exports.ChainVisibility.Visible;
                }
            }
            const visibilities = [];
            if (this.options.drawVisiblePoints) {
                visibilities.push(true);
            }
            if (this.options.drawHiddenPoints) {
                visibilities.push(false);
            }
            const group = new svg_js.G({ id: "singularity-points" });
            svg.add(group);
            const strokeStyle = {
                color: 'black'
            };
            const fillStyle = {
                color: "",
            };
            const singularityPoints = Array.from(viewmap.viewVertexMap.values())
                .filter(p => p.singularity != exports.ViewVertexSingularity.None);
            for (const visibility of visibilities) {
                const visibilityGroup = new svg_js.G({ id: visibility ? "visible" : "hidden" });
                group.add(visibilityGroup);
                for (const singularity of ViewVertexSingularities) {
                    const points = singularityPoints
                        .filter(p => p.singularity === singularity && p.visible === visibility);
                    const singularityGroup = new svg_js.G({ id: singularity });
                    visibilityGroup.add(singularityGroup);
                    fillStyle.color = ViewVertexSingularityColor[singularity];
                    for (const p of points) {
                        const svgPoint = getSVGCircle(p.pos2d.x, p.pos2d.y, this.options.pointSize, strokeStyle, fillStyle);
                        singularityGroup.add(svgPoint);
                    }
                }
            }
            if (this.options.drawLegend) {
                group.add(getLegend$1());
            }
        }
    }
    function getLegend$1() {
        const legend = new svg_js.G({ id: "singularity-legend" });
        legend.add(getSVGText("Singularities", 10, 10, { size: 15, anchor: 'start' }));
        let y = 40;
        for (const singularity of ViewVertexSingularities) {
            const fillColor = ViewVertexSingularityColor[singularity];
            legend.add(getSVGCircle(15, y, 8, { color: "black" }, { color: fillColor }));
            legend.add(getSVGText(singularity, 30, y - 10, { size: 15, anchor: 'start' }));
            y += 20;
        }
        return legend;
    }

    // Author: Axel Antoine
    let _cvVectorIn;
    let _cvVectorOut;
    // Make a promise to know when opencv module is available and init the two buffers
    const cvPromise = new Promise(resolve => {
        cv__default["default"].onRuntimeInitialized = () => {
            _cvVectorIn = cv__default["default"].matFromArray(1, 1, cv__default["default"].CV_32FC2, [0, 0]);
            _cvVectorOut = cv__default["default"].matFromArray(1, 1, cv__default["default"].CV_32FC2, [0, 0]);
            resolve();
        };
    });
    /**
     * SVGTexturePass used to draw image or vector graphics textures on mesh in the
     * final SVG.
     *
     * Note that only `PlaneGeometry` is supported for now. Textures set on
     * geometries other than plane will be ignored.
     */
    class TexturePass extends DrawPass {
        async draw(svg, viewmap) {
            const { meshes, polygons } = viewmap;
            /**
             * Gather meshes with texture
             */
            const textureMeshes = new Array();
            for (const mesh of meshes) {
                if (mesh.texture) {
                    /**
                     * We only can handle Plane Geometry for now
                     *
                     * Probably a bit rough, but we consider tthat if the mesh's
                     * HalfEdgeStructure has 4 vertices and 2 faces, it is a plane
                     *
                     */
                    if (mesh.hes && mesh.hes.vertices.length === 4
                        && mesh.hes.faces.length === 2) {
                        textureMeshes.push(mesh);
                    }
                    else {
                        console.warn(`Mesh "${mesh.name}": Texture ignored, not a plane geometry.`);
                    }
                }
            }
            /**
             * Exit if there is no mesh to handle
             */
            if (textureMeshes.length === 0) {
                return;
            }
            /**
             * Wait OpenCV to be loaded, as we need the module to compute the
             * perspective transform matrix and image perspective transform
             */
            await cvPromise;
            const group = new svg_js.G({ id: "textures" });
            svg.add(group);
            /**
             * Get the viewmap polygons for each mesh so they can be used as svg clipping
             * path for the texture
             */
            const meshPolygonsMap = new Map();
            for (const mesh of textureMeshes) {
                meshPolygonsMap.set(mesh, []);
            }
            for (const polygon of polygons) {
                if (polygon.mesh && meshPolygonsMap.has(polygon.mesh)) {
                    meshPolygonsMap.get(polygon.mesh)?.push(polygon);
                }
            }
            /**
             * Draw each mesh texture
             */
            for (const mesh of textureMeshes) {
                let svgTexture;
                if (mesh.texture.url.startsWith('data:image/svg+xml;base64,')) {
                    svgTexture = await getSVGTexture(mesh);
                }
                else {
                    svgTexture = await getImageTexture(mesh);
                }
                // Draw a clipping path using the polygons
                const clipPath = new svg_js.ClipPath();
                const polygons = meshPolygonsMap.get(mesh) ?? [];
                for (const polygon of polygons) {
                    const svgPath = getSVGPath(polygon.contour, polygon.holes, true);
                    clipPath.add(svgPath);
                }
                group.add(clipPath);
                svgTexture.clipWith(clipPath);
                group.add(svgTexture);
            }
        }
    }
    async function getImageTexture(mesh) {
        const imgEl = document.createElement('img');
        imgEl.src = mesh.texture.url;
        const srcImageMatrix = cv__default["default"].imread(imgEl);
        // Get the transformation matrix and the output size;
        const imgRect = { x: 0, y: 0, w: srcImageMatrix.cols, h: srcImageMatrix.rows };
        const { matrix, outRect } = getCVTransformMatrix(imgRect, mesh);
        const dstImageMatrix = new cv__default["default"].Mat();
        const dSize = new cv__default["default"].Size(outRect.w, outRect.h);
        cv__default["default"].warpPerspective(srcImageMatrix, dstImageMatrix, matrix, dSize, cv__default["default"].INTER_LINEAR);
        // OpenCV needs a canvas to draw the transformed image
        const canvas = document.createElement('canvas');
        cv__default["default"].imshow(canvas, dstImageMatrix);
        srcImageMatrix.delete();
        dstImageMatrix.delete();
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const url = reader.result;
                        const svgImage = getSVGImage(url, outRect);
                        resolve(svgImage);
                    };
                    reader.readAsDataURL(blob);
                }
                else {
                    reject("Error blob conversion from opencv canvas");
                }
            });
        });
    }
    async function getSVGTexture(mesh) {
        return new Promise((resolve, reject) => {
            svgContentFromDataURL(mesh.texture.url)
                .then(content => {
                // As SVG.js gets an extra <svg> div around the svg for internal
                // computations, we only take the children
                // See first question in the FAQ: https://svgjs.dev/docs/3.0/faq/
                const svg = svg_js.SVG().svg(content);
                const group = new svg_js.G({ id: "svg-interface-" + mesh.name });
                for (const child of svg.children()) {
                    try {
                        const ignoredElements = new Array();
                        transformSVG(child, mesh, undefined, ignoredElements);
                        console.info(`SVG Transform: ${ignoredElements.length} elements ignored.`, ignoredElements);
                    }
                    catch (e) {
                        console.error("Error while transforming SVG", e);
                    }
                    group.add(child);
                }
                resolve(group);
            })
                .catch(reason => {
                reject("Couldn't retrieved svg content from base64 dataURL: " + reason);
            });
        });
    }
    function svgContentFromDataURL(dataUrl) {
        return new Promise((resolve, reject) => {
            if (dataUrl.startsWith('data:image/svg+xml;base64,')) {
                fetch(dataUrl).then(value => {
                    value.blob()
                        .then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            resolve(reader.result);
                        };
                        reader.onerror = () => {
                            reject("Couldn't read content");
                        };
                        reader.readAsText(blob);
                    })
                        .catch(() => {
                        reject("Couldn't create blob");
                    });
                }).catch(() => {
                    reject("Couldn't fetch data ");
                });
            }
            else {
                reject("Data not svg xml based");
            }
        });
    }
    function getCVTransformMatrix(srcRect, mesh) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        // Setup initial points with the size of the input SVG/image
        const srcPointsArray = [
            srcRect.x, srcRect.y,
            srcRect.x, srcRect.y + srcRect.h,
            srcRect.x + srcRect.w, srcRect.y,
            srcRect.x + srcRect.w, srcRect.y + srcRect.h
        ];
        const dstPointsArray = new Array();
        // Get the coordinates in pixels of the four screen corners
        const vertices = Array.from(mesh.hes.vertices);
        const viewVertices = vertices.map(vertex => vertex.viewVertex);
        for (const vertex of viewVertices) {
            minX = Math.min(minX, vertex.x);
            minY = Math.min(minY, vertex.y);
            maxX = Math.max(maxX, vertex.x);
            maxY = Math.max(maxY, vertex.y);
            dstPointsArray.push(vertex.x);
            dstPointsArray.push(vertex.y);
        }
        // Recenter the projection on top left corner of the object
        for (let i = 0; i < 8; i += 2) {
            dstPointsArray[i] -= minX;
            dstPointsArray[i + 1] -= minY;
        }
        const srcMat = cv__default["default"].matFromArray(4, 1, cv__default["default"].CV_32FC2, srcPointsArray);
        const dstMat = cv__default["default"].matFromArray(4, 1, cv__default["default"].CV_32FC2, dstPointsArray);
        const matrix = cv__default["default"].getPerspectiveTransform(srcMat, dstMat, cv__default["default"].DECOMP_LU);
        srcMat.delete();
        dstMat.delete();
        return {
            matrix: matrix,
            outRect: { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
        };
    }
    function transformSVG(element, mesh, transformMatrix, ignoredElements) {
        if (element.type === "svg") {
            const svg = element;
            let inRect = {
                x: NumberAliasToNumber(svg.x()), y: NumberAliasToNumber(svg.y()),
                w: NumberAliasToNumber(svg.width()), h: NumberAliasToNumber(svg.height())
            };
            const viewBox = svg.viewbox();
            if (viewBox.height !== 0 && viewBox.width !== 0) {
                inRect = { x: viewBox.x, y: viewBox.y, w: viewBox.width, h: viewBox.height };
            }
            if (inRect.w === 0 || inRect.h === 0) {
                throw ("Embedded SVG has no visible dimension: i.e no width/height or viewbox properties.");
            }
            const { matrix, outRect } = getCVTransformMatrix(inRect, mesh);
            svg.x(outRect.x);
            svg.y(outRect.y);
            svg.width(outRect.w);
            svg.height(outRect.h);
            svg.attr('viewBox', null);
            transformMatrix = matrix;
        }
        else if (element.type === "polygon") {
            element = replaceShapeByPath(element);
        }
        else if (element.type === "rect") {
            element = replaceShapeByPath(element);
        }
        else if (element.type === "ellipse") {
            element = replaceShapeByPath(element);
        }
        else if (element.type === "circle") {
            element = replaceShapeByPath(element);
        }
        else if (element.type !== "path" && element.type !== "g") {
            ignoredElements?.push(element);
        }
        if (element.type !== 'svg' && !transformMatrix) {
            throw ('There is no perspective transform matrix or it hasn\'t been initialized.');
        }
        // Convert path elements
        if (transformMatrix && element.type === 'path') {
            const path = element;
            transformSVGPath(path, transformMatrix);
        }
        for (const child of element.children()) {
            transformSVG(child, mesh, transformMatrix, ignoredElements);
        }
        // Delete OpenCV Matrix if the top element has finished its transform
        if (element.type === 'svg' && transformMatrix) {
            transformMatrix.delete();
        }
    }
    function transformSVGPath(path, matrix) {
        const array = path.array();
        const newCmds = new Array();
        const lastP = { x: 0, y: 0 };
        let p, p1, p2;
        for (let i = 0; i < array.length; i++) {
            const cmd = array[i];
            const op = cmd[0];
            switch (op) {
                // Horizontal line from the last point
                case 'H':
                    p = transformCoords(cmd[1], lastP.y, matrix);
                    newCmds.push(['L', round(p.x), round(p.y)]);
                    lastP.x = cmd[1];
                    break;
                // vertical line from the last point
                case 'V':
                    p = transformCoords(lastP.x, cmd[1], matrix);
                    newCmds.push(['L', round(p.x), round(p.y)]);
                    lastP.y = cmd[1];
                    break;
                // Move to | Line to
                case 'M':
                case 'L':
                    p = transformCoords(cmd[1], cmd[2], matrix);
                    newCmds.push([op, round(p.x), round(p.y)]);
                    lastP.x = cmd[1];
                    lastP.y = cmd[2];
                    break;
                // Curve to
                case 'C':
                    p = transformCoords(cmd[1], cmd[2], matrix);
                    p1 = transformCoords(cmd[3], cmd[4], matrix);
                    p2 = transformCoords(cmd[5], cmd[6], matrix);
                    newCmds.push([op, round(p.x), round(p.y),
                        round(p1.x), round(p1.y), round(p2.x), round(p2.y)]);
                    lastP.x = cmd[5];
                    lastP.y = cmd[6];
                    break;
                // Close path
                case 'Z':
                    newCmds.push(['Z']);
                    break;
                default:
                    console.info("Unsupported SVG path command", op);
            }
        }
        path.plot(new svg_js.PathArray(newCmds));
    }
    /**
     * Transform x and y coords with an OpenCV [perspective] matrix
     *
     * @param      {number}  x       { parameter_description }
     * @param      {number}  y       { parameter_description }
     * @param      {CVMat}   matrix  The matrix
     * @return     {Object}  { description_of_the_return_value }
     */
    function transformCoords(x, y, matrix) {
        _cvVectorIn.data32F[0] = x;
        _cvVectorIn.data32F[1] = y;
        cv__default["default"].perspectiveTransform(_cvVectorIn, _cvVectorOut, matrix);
        return { x: _cvVectorOut.data32F[0], y: _cvVectorOut.data32F[1] };
    }

    // Author: Axel Antoine
    const ViewEdgesNatures = Object.values(exports.ViewEdgeNature);
    class ChainPass extends DrawPass {
        /** Options of the draw pass */
        options = {
            drawRaycastPoint: false,
            useRandomColors: false,
            drawLegend: false,
            defaultStyle: {
                color: "#000000",
                width: 1,
                dasharray: "",
                linecap: "butt",
                linejoin: "miter",
                opacity: 1,
                dashoffset: 0,
            },
            styles: {
                [exports.ViewEdgeNature.Silhouette]: { enabled: true, drawOrder: 5 },
                [exports.ViewEdgeNature.Boundary]: { enabled: true, drawOrder: 4 },
                [exports.ViewEdgeNature.MeshIntersection]: { enabled: true, drawOrder: 3 },
                [exports.ViewEdgeNature.Crease]: { enabled: true, drawOrder: 2 },
                [exports.ViewEdgeNature.Material]: { enabled: true, drawOrder: 1 }
            }
        };
        /**
         *
         * @param strokeStyle Default style applied to the strokes
         * @param options
         */
        constructor(options = {}) {
            super();
            mergeOptions(this.options, options);
        }
    }
    class VisibleChainPass extends ChainPass {
        constructor(options = {}) {
            super(options);
        }
        async draw(svg, viewmap) {
            const chains = viewmap.chains
                .filter(c => c.visibility === exports.ChainVisibility.Visible);
            const meshes = Array.from(viewmap.meshes).filter(m => m.drawVisibleContours);
            const group = new svg_js.G({ id: "visible-contours" });
            drawChains(group, meshes, chains, this.options);
            svg.add(group);
        }
    }
    class HiddenChainPass extends ChainPass {
        constructor(options = {}) {
            const { defaultStyle, ...otherOptions } = options;
            options = {
                defaultStyle: {
                    color: "#FF0000",
                    dasharray: "2,2",
                    ...defaultStyle,
                },
                ...otherOptions
            };
            super(options);
        }
        async draw(svg, viewmap) {
            const chains = viewmap.chains.filter(c => c.visibility === exports.ChainVisibility.Hidden);
            const meshes = Array.from(viewmap.meshes).filter(m => m.drawHiddenContours);
            const group = new svg_js.G({ id: "hidden-contours" });
            svg.add(group);
            drawChains(group, meshes, chains, this.options);
        }
    }
    function drawChains(parent, meshes, chains, options) {
        const { defaultStyle, styles } = options;
        // Order natures depending on the draw order
        ViewEdgesNatures.sort((n1, n2) => (styles[n1].drawOrder ?? 0) - (styles[n2].drawOrder ?? 0));
        // Group the contours by mesh
        for (const mesh of meshes) {
            const objectChains = chains.filter(c => c.object === mesh);
            const objectGroup = new svg_js.G({ id: mesh.name });
            parent.add(objectGroup);
            for (const nature of ViewEdgesNatures) {
                if (styles[nature]?.enabled) {
                    const strokeStyle = { ...defaultStyle, ...styles[nature] };
                    const natureChains = objectChains.filter(c => c.nature === nature);
                    const natureGroup = new svg_js.G({ id: nature });
                    objectGroup.add(natureGroup);
                    for (const chain of natureChains) {
                        drawChain(natureGroup, chain, options, strokeStyle);
                    }
                }
            }
        }
        if (options.drawLegend) {
            parent.add(getLegend(options));
        }
    }
    function drawChain(parent, chain, options, style = {}) {
        // Make a copy of the style so we can modify it
        style = { ...style };
        if (options.useRandomColors) {
            style.color = svg_js.Color.random().toString();
        }
        const path = getSVGPath(chain.vertices, [], false, style);
        parent.add(path);
        if (options.drawRaycastPoint) {
            drawContourRaycastPoint(parent, chain);
        }
    }
    function drawContourRaycastPoint(parent, chain) {
        const strokeStyle = { color: "black" };
        const fillStyle = { color: "white" };
        const cx = chain.raycastPoint.x;
        const cy = chain.raycastPoint.y;
        const point = getSVGCircle(cx, cy, 2, strokeStyle, fillStyle);
        point.id('raycast-point');
        parent.add(point);
    }
    function getLegend(options) {
        const legend = new svg_js.G({ id: "edges-nature-legend" });
        legend.add(getSVGText("Natures", 10, 140, { size: 15, anchor: 'start' }));
        let y = 170;
        for (const nature of ViewEdgesNatures) {
            const fillColor = options.styles[nature].color ?? 'black';
            legend.add(getSVGCircle(15, y, 8, { color: "black" }, { color: fillColor }));
            legend.add(getSVGText(nature, 30, y - 10, { size: 15, anchor: 'start' }));
            y += 20;
        }
        return legend;
    }

    // Author: Axel Antoine
    /**
     * Mesh object that can be rendered as SVG.
     * Wrapper class around three mesh object that duplicates geometry if needed (i.e.
     * for SkinnedMesh) and computes BVH and HalfEdgeStructure on demand)
     */
    class SVGMesh {
        sourceMesh;
        threeMesh = new three.Mesh();
        hes;
        bvh;
        drawFills = true;
        drawVisibleContours = true;
        drawHiddenContours = true;
        isUsingBVHForRaycasting = false;
        texture;
        constructor(mesh, options = {}) {
            this.sourceMesh = mesh;
            this.threeMesh.copy(mesh);
            this.threeMesh.geometry = this.sourceMesh.geometry.clone();
            // Setup HES
            this.hes = new threeMeshHalfedge.HalfedgeDS();
            // Setup BVH
            const bvhOptions = {
                maxLeafTris: 1,
                strategy: threeMeshBvh.CENTER,
                ...options?.bvhOptions
            };
            this.bvh = new threeMeshBvh.MeshBVH(this.threeMesh.geometry, bvhOptions);
            this.threeMesh.raycast = threeMeshBvh.acceleratedRaycast;
            this.threeMesh.geometry.boundsTree = this.bvh;
        }
        /**
         * Adds a SVGtexture to the mesh.
         *
         * @param texture The image or vector graphics texture to use.
         */
        addTexture(texture) {
            this.texture = texture;
        }
        updateMorphGeometry() {
            computeMorphedGeometry(this.sourceMesh, this.threeMesh.geometry);
        }
        updateBVH(updateMorphGeometry = true) {
            updateMorphGeometry && this.updateMorphGeometry();
            this.bvh.refit();
        }
        updateHES(updateMorphGeometry = true) {
            updateMorphGeometry && this.updateMorphGeometry();
            this.hes.setFromGeometry(this.threeMesh.geometry);
        }
        localToWorld(target) {
            return this.threeMesh.localToWorld(target);
        }
        colorForFaceIndex(faceIndex) {
            if (Array.isArray(this.material)) {
                for (const group of this.threeMesh.geometry.groups) {
                    if (group.start <= faceIndex &&
                        faceIndex < (group.start + group.count) &&
                        group.materialIndex != undefined &&
                        group.materialIndex < this.material.length) {
                        return colorForMaterial(this.material[group.materialIndex]);
                    }
                }
                return null;
            }
            return colorForMaterial(this.material);
        }
        dispose() {
            disposeMesh(this.threeMesh);
        }
        get material() { return this.threeMesh.material; }
        get matrixWorld() { return this.threeMesh.matrixWorld; }
        get name() { return this.threeMesh.name; }
        set name(name) { this.threeMesh.name = name; }
    }
    function colorForMaterial(material) {
        const colorMaterial = material;
        return colorMaterial.color;
    }

    /**
     * @typedef {Object} ParsingOptions
     *  @property {function(node)} filter Returns false to exclude a node. Default is true.
     */

    var xmlParserXo;
    var hasRequiredXmlParserXo;

    function requireXmlParserXo () {
    	if (hasRequiredXmlParserXo) return xmlParserXo;
    	hasRequiredXmlParserXo = 1;
    	/**
    	 * Parse the given XML string into an object.
    	 *
    	 * @param {String} xml
    	 * @param {ParsingOptions} [options]
    	 * @return {Object}
    	 * @api public
    	 */
    	function parse(xml, options = {}) {

    	    options.filter = options.filter || (() => true);

    	    function nextChild() {
    	        return tag() || content() || comment() || cdata();
    	    }

    	    function nextRootChild() {
    	        match(/\s*/);
    	        return tag(true) || comment() || doctype() || processingInstruction(false);
    	    }

    	    function document() {
    	        const decl = declaration();
    	        const children = [];
    	        let documentRootNode;
    	        let child = nextRootChild();

    	        while (child) {
    	            if (child.node.type === 'Element') {
    	                if (documentRootNode) {
    	                    throw new Error('Found multiple root nodes');
    	                }
    	                documentRootNode = child.node;
    	            }

    	            if (!child.excluded) {
    	                children.push(child.node);
    	            }

    	            child = nextRootChild();
    	        }

    	        if (!documentRootNode) {
    	            throw new Error('Failed to parse XML');
    	        }

    	        return {
    	            declaration: decl ? decl.node : null,
    	            root: documentRootNode,
    	            children
    	        };
    	    }

    	    function declaration() {
    	        return processingInstruction(true);
    	    }

    	    function processingInstruction(matchDeclaration) {
    	        const m = matchDeclaration ? match(/^<\?(xml)\s*/) : match(/^<\?([\w-:.]+)\s*/);
    	        if (!m) return;

    	        // tag
    	        const node = {
    	            name: m[1],
    	            type: 'ProcessingInstruction',
    	            attributes: {}
    	        };

    	        // attributes
    	        while (!(eos() || is('?>'))) {
    	            const attr = attribute();
    	            if (!attr) return node;
    	            node.attributes[attr.name] = attr.value;
    	        }

    	        match(/\?>/);

    	        return {
    	            excluded: matchDeclaration ? false : options.filter(node) === false,
    	            node
    	        };
    	    }

    	    function tag(matchRoot) {
    	        const m = match(/^<([\w-:.]+)\s*/);
    	        if (!m) return;

    	        // name
    	        const node = {
    	            type: 'Element',
    	            name: m[1],
    	            attributes: {},
    	            children: []
    	        };

    	        // attributes
    	        while (!(eos() || is('>') || is('?>') || is('/>'))) {
    	            const attr = attribute();
    	            if (!attr) return node;
    	            node.attributes[attr.name] = attr.value;
    	        }

    	        const excluded = matchRoot ? false : options.filter(node) === false;

    	        // self closing tag
    	        if (match(/^\s*\/>/)) {
    	            node.children = null;
    	            return {
    	                excluded,
    	                node
    	            };
    	        }

    	        match(/\??>/);

    	        if (!excluded) {
    	            // children
    	            let child = nextChild();
    	            while (child) {
    	                if (!child.excluded) {
    	                    node.children.push(child.node);
    	                }
    	                child = nextChild();
    	            }
    	        }

    	        // closing
    	        match(/^<\/[\w-:.]+>/);

    	        return {
    	            excluded,
    	            node
    	        };
    	    }

    	    function doctype() {
    	        const m = match(/^<!DOCTYPE\s+[^>]*>/);
    	        if (m) {
    	            const node = {
    	                type: 'DocumentType',
    	                content: m[0]
    	            };
    	            return {
    	                excluded: options.filter(node) === false,
    	                node
    	            };
    	        }
    	    }

    	    function cdata() {
    	        if (xml.startsWith('<![CDATA[')) {
    	            const endPositionStart = xml.indexOf(']]>');
    	            if (endPositionStart > -1) {
    	                const endPositionFinish  = endPositionStart + 3;
    	                const node = {
    	                    type: 'CDATA',
    	                    content: xml.substring(0, endPositionFinish)
    	                };
    	                xml = xml.slice(endPositionFinish);
    	                return {
    	                    excluded: options.filter(node) === false,
    	                    node
    	                };
    	            }
    	        }
    	    }

    	    function comment() {
    	        const m = match(/^<!--[\s\S]*?-->/);
    	        if (m) {
    	            const node = {
    	                type: 'Comment',
    	                content: m[0]
    	            };
    	            return {
    	                excluded: options.filter(node) === false,
    	                node
    	            };
    	        }
    	    }

    	    function content() {
    	        const m = match(/^([^<]+)/);
    	        if (m) {
    	            const node = {
    	                type: 'Text',
    	                content: m[1]
    	            };
    	            return {
    	                excluded: options.filter(node) === false,
    	                node
    	            };
    	        }
    	    }

    	    function attribute() {
    	        const m = match(/([\w-:.]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/);
    	        if (!m) return;
    	        return {name: m[1], value: strip(m[2])}
    	    }

    	    /**
    	     * Strip quotes from `val`.
    	     */
    	    function strip(val) {
    	        return val.replace(/^['"]|['"]$/g, '');
    	    }

    	    /**
    	     * Match `re` and advance the string.
    	     */
    	    function match(re) {
    	        const m = xml.match(re);
    	        if (!m) return;
    	        xml = xml.slice(m[0].length);
    	        return m;
    	    }

    	    /**
    	     * End-of-source.
    	     */
    	    function eos() {
    	        return 0 === xml.length;
    	    }

    	    /**
    	     * Check for `prefix`.
    	     */
    	    function is(prefix) {
    	        return 0 === xml.indexOf(prefix);
    	    }

    	    xml = xml.trim();

    	    return document();
    	}

    	xmlParserXo = parse;
    	return xmlParserXo;
    }

    /**
     * @typedef {Object} XMLFormatterOptions
     *  @property {String} [indentation='    '] The value used for indentation
     *  @property {function(node): boolean} [filter] Return false to exclude the node.
     *  @property {Boolean} [collapseContent=false] True to keep content in the same line as the element. Only works if element contains at least one text node
     *  @property {String} [lineSeparator='\r\n'] The line separator to use
     *  @property {String} [whiteSpaceAtEndOfSelfclosingTag=false] to either end ad self closing tag with `<tag/>` or `<tag />`
     */

    /**
     * @typedef {Object} XMLFormatterState
     * @param {String} content
     * @param {Number} level
     * @param {XMLFormatterOptions} options
     */

    /**
     * @param {XMLFormatterState} state
     * @return {void}
     */
    function newLine(state) {
        if (!state.options.indentation && !state.options.lineSeparator) return;
        state.content += state.options.lineSeparator;
        let i;
        for (i = 0; i < state.level; i++) {
            state.content += state.options.indentation;
        }
    }

    /**
     * @param {XMLFormatterState} state
     * @param {String} content
     * @return {void}
     */
    function appendContent(state, content) {
        state.content += content;
    }

    /**
     * @param {Object} node
     * @param {XMLFormatterState} state
     * @param {Boolean} preserveSpace
     * @return {void}
     */
    function processNode(node, state, preserveSpace) {
        if (typeof node.content === 'string') {
            processContentNode(node, state, preserveSpace);
        } else if (node.type === 'Element') {
            processElementNode(node, state, preserveSpace);
        } else if (node.type === 'ProcessingInstruction') {
            processProcessingIntruction(node, state);
        } else {
            throw new Error('Unknown node type: ' + node.type);
        }
    }

    /**
     * @param {Object} node
     * @param {XMLFormatterState} state
     * @param {Boolean} preserveSpace
     * @return {void}
     */
    function processContentNode(node, state, preserveSpace) {
        if (!preserveSpace) {
            node.content = node.content.trim();
        }
        if (node.content.length > 0) {
            if (!preserveSpace && state.content.length > 0) {
                newLine(state);
            }
            appendContent(state, node.content);
        }
    }

    /**
     * @param {Object} node
     * @param {XMLFormatterState} state
     * @param {Boolean} preserveSpace
     * @return {void}
     */
    function processElementNode(node, state, preserveSpace) {
        if (!preserveSpace && state.content.length > 0) {
            newLine(state);
        }

        appendContent(state, '<' + node.name);
        processAttributes(state, node.attributes);

        if (node.children === null) {
            const selfClosingNodeClosingTag = state.options.whiteSpaceAtEndOfSelfclosingTag ? ' />' : '/>';
            // self-closing node
            appendContent(state, selfClosingNodeClosingTag);
        } else if (node.children.length === 0) {
            // empty node
            appendContent(state, '></' + node.name + '>');
        } else {

            appendContent(state, '>');

            state.level++;

            let nodePreserveSpace = node.attributes['xml:space'] === 'preserve';

            if (!nodePreserveSpace && state.options.collapseContent) {
                let containsTextNodes = false;
                let containsTextNodesWithLineBreaks = false;
                let containsNonTextNodes = false;

                node.children.forEach(function(child, index) {
                    if (child.type === 'Text') {
                        if (child.content.includes('\n')) {
                            containsTextNodesWithLineBreaks = true;
                            child.content = child.content.trim();
                        } else if (index === 0 || index === node.children.length - 1) {
                            if (child.content.trim().length === 0) {
                                // If the text node is at the start or end and is empty, it should be ignored when formatting
                                child.content = '';
                            }
                        }
                        if (child.content.length > 0) {
                            containsTextNodes = true;
                        }
                    } else if (child.type === 'CDATA') {
                        containsTextNodes = true;
                    } else {
                        containsNonTextNodes = true;
                    }
                });

                if (containsTextNodes && (!containsNonTextNodes || !containsTextNodesWithLineBreaks)) {
                    nodePreserveSpace = true;
                }
            }

            node.children.forEach(function(child) {
                processNode(child, state, preserveSpace || nodePreserveSpace, state.options);
            });

            state.level--;

            if (!preserveSpace && !nodePreserveSpace) {
                newLine(state);
            }
            appendContent(state, '</' + node.name + '>');
        }
    }

    /**
     * @param {XMLFormatterState} state
     * @param {Record<String, String>} attributes
     * @return {void}
     */
    function processAttributes(state, attributes) {
        Object.keys(attributes).forEach(function(attr) {
            const escaped = attributes[attr].replace(/"/g, '&quot;');
            appendContent(state, ' ' + attr + '="' + escaped + '"');
        });
    }

    /**
     * @param {Object} node
     * @param {XMLFormatterState} state
     * @return {void}
     */
    function processProcessingIntruction(node, state) {
        if (state.content.length > 0) {
            newLine(state);
        }
        appendContent(state, '<?' + node.name);
        processAttributes(state, node.attributes);
        appendContent(state, '?>');
    }


    /**
     * Converts the given XML into human readable format.
     *
     * @param {String} xml
     * @param {XMLFormatterOptions} options
     * @returns {string}
     */
    function format(xml, options = {}) {
        options.indentation = 'indentation' in options ? options.indentation : '    ';
        options.collapseContent = options.collapseContent === true;
        options.lineSeparator = 'lineSeparator' in options ? options.lineSeparator : '\r\n';
        options.whiteSpaceAtEndOfSelfclosingTag = !!options.whiteSpaceAtEndOfSelfclosingTag;

        const parser = requireXmlParserXo();
        const parsedXml = parser(xml, {filter: options.filter});
        const state = {content: '', level: 0, options: options};

        if (parsedXml.declaration) {
            processProcessingIntruction(parsedXml.declaration, state);
        }

        parsedXml.children.forEach(function(child) {
            processNode(child, state, false);
        });

        return state.content
            .replace(/\r\n/g, '\n')
            .replace(/\n/g, options.lineSeparator);
    }


    var xmlFormatter = format;

    // Author: Axel Antoine
    class SVGRenderInfo {
        resolution = { w: Infinity, h: Infinity };
        renderingTime = Infinity;
        svgDrawInfo = new SVGDrawInfo();
        viewmapInfo = new ViewmapBuildInfo();
    }
    /**
     *
     */
    class SVGRenderer {
        viewmap;
        drawHandler;
        constructor(vOptions, sOptions) {
            this.viewmap = new Viewmap(vOptions);
            this.drawHandler = new SVGDrawHandler(sOptions);
        }
        /**
         * Render a SVG file from the given meshes and returns it.
         * @param meshes Mehses to render
         * @param camera Camera used to compute the perspective
         * @param size Size of the render (will be scaled by camera aspect ratio)
         * @param options Options to customize the render
         * @param info Object containing info (e.g. times) on the rendering process
         * @returns SVG object from the Svgdotjs lib
         */
        async generateSVG(meshes, camera, size, info = new SVGRenderInfo()) {
            const renderStartTime = Date.now();
            // Setup camera keeping
            const renderSize = { w: size.w, h: size.w / camera.aspect };
            info.resolution = renderSize;
            // Viewmap Build
            await this.viewmap.build(meshes, camera, renderSize, info.viewmapInfo);
            // SVG Buid
            const svg = await this.drawHandler.drawSVG(this.viewmap, renderSize, info.svgDrawInfo);
            info.renderingTime = Date.now() - renderStartTime;
            return svg;
        }
        /**
         * Adds a pass to the SVG rendering pipeline.
         * @param pass
         */
        addPass(pass) {
            if (!this.drawHandler.passes.includes(pass)) {
                this.drawHandler.passes.push(pass);
            }
        }
        /**
         * Removes a pass from the SVG rendering pipeline
         * @param pass
         */
        removePass(pass) {
            this.drawHandler.passes.remove(pass);
        }
        /**
         * Removes all the passes from the SVG rendering pipeline.
         */
        clearPasses() {
            this.drawHandler.passes.clear();
        }
        static exportSVG(svg, filename, options) {
            const opt = {
                prettify: false,
                ...options,
            };
            let text = svg.svg();
            if (opt.prettify) {
                text = xmlFormatter(text, {});
            }
            const svgBlob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
            const svgUrl = URL.createObjectURL(svgBlob);
            const downloadLink = document.createElement("a");
            downloadLink.href = svgUrl;
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    }

    exports.Chain = Chain;
    exports.ChainPass = ChainPass;
    exports.DrawPass = DrawPass;
    exports.FillPass = FillPass;
    exports.HiddenChainPass = HiddenChainPass;
    exports.Polygon = Polygon;
    exports.SVGDrawHandler = SVGDrawHandler;
    exports.SVGDrawInfo = SVGDrawInfo;
    exports.SVGMesh = SVGMesh;
    exports.SVGRenderInfo = SVGRenderInfo;
    exports.SVGRenderer = SVGRenderer;
    exports.SingularityPointPass = SingularityPointPass;
    exports.TexturePass = TexturePass;
    exports.ViewEdge = ViewEdge;
    exports.ViewVertex = ViewVertex;
    exports.Viewmap = Viewmap;
    exports.ViewmapBuildInfo = ViewmapBuildInfo;
    exports.VisibleChainPass = VisibleChainPass;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.js.map
