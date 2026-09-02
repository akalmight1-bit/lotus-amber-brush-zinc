import {
  HalfFloatType,
  LinearSRGBColorSpace,
  Mesh,
  NoToneMapping,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
  MathUtils,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import rayVert from "./ray.vert.glsl?raw";
import rayFrag from "./ray.frag.glsl?raw";
import compositeVert from "./composite.vert.glsl?raw";
import compositeFrag from "./composite.frag.glsl?raw";

const D2R = Math.PI / 180;
const CINE_SEGMENT = 11;
const FOV = 44;

const CINE_KEYS: [number, number, number][] = [
  [58, 12, -30],
  [36, 6, 10],
  [26, 24, 55],
  [14, 14, 100],
  [20, 52, 150],
  [34, 80, 200],
  [46, 35, 270],
  [36, 8, 330],
];

const K_R = CINE_KEYS.map((k) => k[0]);
const K_I = CINE_KEYS.map((k) => k[1] * D2R);
const K_A = CINE_KEYS.map((k) => k[2] * D2R);

function cr(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function wrapIdx(k: number, n: number) {
  return ((k % n) + n) % n;
}

function cinePath(time: number, out: Vector3) {
  const n = CINE_KEYS.length;
  const seg = Math.max(1, CINE_SEGMENT);
  const tt = time / seg;
  const i = Math.floor(tt);
  const t = tt - i;
  const v = (arr: number[], k: number) => arr[wrapIdx(k, n)]!;
  const az = (k: number) => K_A[wrapIdx(k, n)]! + 2 * Math.PI * Math.floor(k / n);
  const r = cr(v(K_R, i - 1), v(K_R, i), v(K_R, i + 1), v(K_R, i + 2), t);
  const inc = cr(v(K_I, i - 1), v(K_I, i), v(K_I, i + 1), v(K_I, i + 2), t);
  const a = cr(az(i - 1), az(i), az(i + 1), az(i + 2), t);
  out.set(
    r * Math.cos(inc) * Math.sin(a),
    r * Math.sin(inc),
    r * Math.cos(inc) * Math.cos(a),
  );
  return out;
}

const easeCubic = (k: number) =>
  k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

function detectProfile(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  let rendererName = "";
  try {
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (info) {
      rendererName = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || "");
    }
  } catch {
    /* ignore */
  }
  const software = /swiftshader|llvmpipe|softpipe|microsoft basic|cpu|virtualbox/i.test(
    rendererName,
  );
  if (software) {
    return { live: false, steps: 48, budget: 1.4e5, dprCap: 0.55, bloom: false, minFrame: 1 / 12 };
  }
  return { live: true, steps: 140, budget: 8.5e5, dprCap: 1.1, bloom: true, minFrame: 1 / 36 };
}

export class GargantuaEngine {
  private canvas: HTMLCanvasElement;
  private renderer: WebGLRenderer;
  private composer: EffectComposer;
  private compositePass: ShaderPass;
  private uniforms: {
    uRes: { value: Vector2 };
    uTime: { value: number };
    uCamPos: { value: Vector3 };
    uCamTarget: { value: Vector3 };
    uFov: { value: number };
    uSteps: { value: number };
    uRotSign: { value: number };
    uDebug: { value: number };
    uDin: { value: number };
    uDout: { value: number };
    uDopMax: { value: number };
    uOpNear: { value: number };
    uOpFar: { value: number };
    uDiskBright: { value: number };
    uStarBright: { value: number };
    uSkyFloor: { value: number };
    uRotSpeed: { value: number };
  };
  private camera: PerspectiveCamera;
  private fsScene: Scene;
  private fsCam: OrthographicCamera;
  private fsMat: ShaderMaterial;
  private fsMesh: Mesh;
  private cineFrom = new Vector3();
  private cineBlend = 0;
  private cineTime = 0;
  private simTime = 0;
  private lastNow = 0;
  private acc = 0;
  private minFrame: number;
  private budget: number;
  private dprCap: number;
  private rafId = 0;
  private running = false;
  private disposed = false;
  private _v1 = new Vector3();
  private _dbSize = new Vector2();
  private onResize: () => void;
  private onVisibility: () => void;
  private onContextLost: (e: Event) => void;
  private onContextRestored: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.outputColorSpace = LinearSRGBColorSpace;
    this.renderer.toneMapping = NoToneMapping;

    const gl = this.renderer.getContext();
    const profile = detectProfile(gl);
    this.minFrame = profile.minFrame;
    this.budget = profile.budget;
    this.dprCap = profile.dprCap;

    let halfFloatOK = true;
    try {
      halfFloatOK = !!(
        gl.getExtension("EXT_color_buffer_float") ||
        gl.getExtension("EXT_color_buffer_half_float")
      );
    } catch {
      halfFloatOK = false;
    }

    this.fsScene = new Scene();
    this.fsCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.uniforms = {
      uRes: { value: new Vector2(1, 1) },
      uTime: { value: 0 },
      uCamPos: { value: new Vector3(4.49, 2.72, 25.46) },
      uCamTarget: { value: new Vector3(0, 0, 0) },
      uFov: { value: 1 / Math.tan(MathUtils.degToRad(FOV) / 2) },
      uSteps: { value: profile.steps },
      uRotSign: { value: 1 },
      uDebug: { value: 0 },
      uDin: { value: 2.75 },
      uDout: { value: 40 },
      uDopMax: { value: 1.85 },
      uOpNear: { value: 0.9 },
      uOpFar: { value: 0.8 },
      uDiskBright: { value: 1 },
      uStarBright: { value: 1 },
      uSkyFloor: { value: 0.04 },
      uRotSpeed: { value: 1 },
    };

    this.fsMat = new ShaderMaterial({
      vertexShader: rayVert,
      fragmentShader: rayFrag,
      uniforms: this.uniforms,
      depthTest: false,
      depthWrite: false,
    });
    this.fsMesh = new Mesh(new PlaneGeometry(2, 2), this.fsMat);
    this.fsScene.add(this.fsMesh);

    this.camera = new PerspectiveCamera(FOV, 1, 0.01, 200);
    this.camera.position.set(4.49, 2.72, 25.46);
    this.camera.lookAt(0, 0, 0);
    this.cineFrom.copy(this.camera.position);

    const rtType = halfFloatOK ? HalfFloatType : UnsignedByteType;
    const rt = new WebGLRenderTarget(2, 2, { type: rtType, depthBuffer: false });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.fsScene, this.fsCam));

    if (profile.bloom && halfFloatOK) {
      this.composer.addPass(new UnrealBloomPass(new Vector2(2, 2), 0.55, 0.35, 0.55));
    }

    this.compositePass = new ShaderPass(
      new ShaderMaterial({
        vertexShader: compositeVert,
        fragmentShader: compositeFrag,
        uniforms: {
          tDiffuse: { value: null },
          uRes: { value: new Vector2(1, 1) },
          uTime: { value: 0 },
          uVignette: { value: 1 },
          uGrain: { value: 0.045 },
          uCA: { value: 0.0028 },
        },
      }),
    );
    this.composer.addPass(this.compositePass);

    this.onResize = () => this.resize();
    this.onVisibility = () => {
      if (document.hidden) this.stopLoop();
      else if (this.running) this.startLoop();
    };
    this.onContextLost = (e: Event) => {
      e.preventDefault();
      this.stopLoop();
    };
    this.onContextRestored = () => {
      if (this.running) this.startLoop();
    };

    window.addEventListener("resize", this.onResize);
    window.addEventListener("orientationchange", this.onResize);
    document.addEventListener("visibilitychange", this.onVisibility);
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);

    this.resize();
  }

  start() {
    if (this.disposed) return;
    this.running = true;
    this.startLoop();
  }

  private startLoop() {
    if (this.rafId || this.disposed || !this.running) return;
    this.lastNow = performance.now();
    const tick = () => {
      if (!this.running || this.disposed) {
        this.rafId = 0;
        return;
      }
      if (document.hidden) {
        this.rafId = 0;
        return;
      }
      this.frame();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private frame() {
    const now = performance.now();
    const realDelta = Math.max(5e-4, (now - this.lastNow) / 1e3);
    this.lastNow = now;
    const dt = Math.min(realDelta, 0.1);
    this.simTime += dt;
    this.cineTime += dt;
    this.acc += dt;
    if (this.acc < this.minFrame) return;
    this.acc = 0;

    cinePath(this.cineTime, this._v1);
    if (this.cineBlend < 1) {
      this.cineBlend = Math.min(1, this.cineBlend + dt / 2);
      this._v1.lerpVectors(this.cineFrom, this._v1, easeCubic(this.cineBlend));
    }
    this.camera.position.copy(this._v1);
    this.camera.lookAt(0, 0, 0);

    this.uniforms.uTime.value = this.simTime;
    this.uniforms.uCamPos.value.copy(this.camera.position);
    this.uniforms.uCamTarget.value.set(0, 0, 0);
    const cu = this.compositePass.uniforms;
    if (cu.uTime) cu.uTime.value = this.simTime;

    try {
      this.composer.render();
      this.canvas.classList.add("is-live");
    } catch {
      this.stopLoop();
    }
  }

  private resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const devDpr = window.devicePixelRatio || 1;
    const byPixels = Math.sqrt(this.budget / Math.max(1, w * h));
    const dpr = Math.max(0.45, Math.min(devDpr, this.dprCap, byPixels));
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.getDrawingBufferSize(this._dbSize);
    this.uniforms.uRes.value.copy(this._dbSize);
    const ru = this.compositePass.uniforms;
    if (ru.uRes) ru.uRes.value.copy(this._dbSize);
  }

  dispose() {
    this.disposed = true;
    this.running = false;
    this.stopLoop();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("orientationchange", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
    this.fsMat.dispose();
    this.fsMesh.geometry.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
