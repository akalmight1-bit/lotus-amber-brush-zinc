import { _ as WebGLRenderTarget, a as HalfFloatType, c as Mesh, d as PlaneGeometry, f as Scene, g as Vector3, h as Vector2, i as ShaderPass, l as OrthographicCamera, m as UnsignedByteType, n as RenderPass, o as LinearSRGBColorSpace, p as ShaderMaterial, r as EffectComposer, s as MathUtils, t as UnrealBloomPass, u as PerspectiveCamera, v as WebGLRenderer } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/engine-BeTGFpD6.js
var ray_vert_default = "varying vec2 vUv;\nvoid main(){\n  vUv = uv;\n  gl_Position = vec4(position.xy, 0.0, 1.0);\n}\n";
var ray_frag_default = "precision highp float;\n\nvarying vec2 vUv;\n\nuniform vec2  uRes;\nuniform float uTime;\nuniform vec3  uCamPos;\nuniform vec3  uCamTarget;\nuniform float uFov;\nuniform int   uSteps;\nuniform float uRotSign;\nuniform int   uDebug;\nuniform float uDin;\nuniform float uDout;\nuniform float uDopMax;\nuniform float uOpNear;\nuniform float uOpFar;\nuniform float uDiskBright;\nuniform float uStarBright;\nuniform float uSkyFloor;\nuniform float uRotSpeed;\n\n#define RS 1.0\n\n// ---------------------------------------------------------------- noise -----\nfloat hash1(vec3 p){\n  p = fract(p*0.3183099 + vec3(0.10,0.17,0.13));\n  p *= 17.0;\n  return fract(p.x*p.y*p.z*(p.x+p.y+p.z));\n}\nvec3 hash3(vec3 p){\n  p = fract(p*vec3(0.1031,0.1030,0.0973));\n  p += dot(p, p.yxz+33.33);\n  return fract((p.xxy+p.yxx)*p.zyx);\n}\nfloat vnoise(vec3 x){\n  vec3 i = floor(x);\n  vec3 f = fract(x);\n  f = f*f*(3.0-2.0*f);\n  float n000 = hash1(i);\n  float n100 = hash1(i+vec3(1.0,0.0,0.0));\n  float n010 = hash1(i+vec3(0.0,1.0,0.0));\n  float n110 = hash1(i+vec3(1.0,1.0,0.0));\n  float n001 = hash1(i+vec3(0.0,0.0,1.0));\n  float n101 = hash1(i+vec3(1.0,0.0,1.0));\n  float n011 = hash1(i+vec3(0.0,1.0,1.0));\n  float n111 = hash1(i+vec3(1.0,1.0,1.0));\n  return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),\n             mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);\n}\n// five-octave value-noise FBM, frequency x2.03 + 11.3, amplitude halved from .5\nfloat fbm(vec3 p){\n  float v = 0.0;\n  float a = 0.5;\n  for(int i=0;i<5;i++){\n    v += a*vnoise(p);\n    p = p*2.03 + 11.3;\n    a *= 0.5;\n  }\n  return v;\n}\n\n// ------------------------------------------------------ pseudo-blackbody ----\nvec3 blackbody(float t){\n  vec3 c = mix(vec3(0.55,0.06,0.01), vec3(1.00,0.42,0.10), smoothstep(0.00,0.55,t));\n  c = mix(c, vec3(1.00,0.86,0.55), smoothstep(0.50,1.05,t));\n  c = mix(c, vec3(0.85,0.92,1.25), smoothstep(1.05,1.90,t));\n  return c;\n}\n\n// ------------------------------------------------------------ star field ----\nmat3 layerRot(float ay, float ax){\n  float cy = cos(ay), sy = sin(ay), cx = cos(ax), sx = sin(ax);\n  return mat3(cy,0.0,-sy,  sy*sx,cx,cy*sx,  sy*cx,-sx,cy*cx);\n}\nvec3 starLayer(vec3 d, float scale, float thresh, mat3 rot, float sharp){\n  vec3 p = rot*d*scale;\n  vec3 id = floor(p);\n  vec3 f = fract(p);\n  float h = hash1(id);\n  if(h < thresh) return vec3(0.0);\n  vec3 sp = 0.15 + 0.70*hash3(id + 4.7);\n  float dist = length(f - sp);\n  float star = exp(-dist*dist*sharp);\n  float bright = (h - thresh)/(1.0 - thresh);\n  bright *= bright;\n  vec3 tint = mix(vec3(0.72,0.84,1.0), vec3(1.0,0.86,0.70), hash1(id + 13.1));\n  return star*bright*tint*4.0;\n}\nvec3 heroStars(vec3 d){\n  vec3 p = d*14.0;\n  vec3 id = floor(p);\n  vec3 f = fract(p);\n  float h = hash1(id + 91.7);\n  if(h < 0.9975) return vec3(0.0);\n  vec3 sp = 0.20 + 0.60*hash3(id + 3.3);\n  float dist = length(f - sp);\n  float glow = exp(-dist*dist*22.0)*0.85 + exp(-dist*dist*240.0)*1.5;\n  vec3 tint = mix(vec3(0.70,0.82,1.0), vec3(1.0,0.80,0.60), step(0.5, hash1(id + 5.5)));\n  return glow*tint;\n}\nvec3 milkyway(vec3 d){\n  vec3 n = normalize(vec3(0.25,1.0,0.15));\n  float w = dot(d,n);\n  float band = exp(-w*w*7.0);\n  vec3 p = d*2.6;\n  float cloud = fbm(p*1.4 + 5.2);\n  float dust  = fbm(p*2.3 + 9.1);\n  vec3 col = mix(vec3(0.04,0.07,0.20), vec3(0.42,0.24,0.52), smoothstep(0.25,0.85,cloud));\n  col *= band;\n  col *= 1.0 - 0.62*smoothstep(0.45,0.85,dust);\n  col *= 1.15;\n  return col;\n}\nvec3 background(vec3 d){\n  vec3 col = uSkyFloor*vec3(0.10,0.13,0.28);\n  col += milkyway(d);\n  col += starLayer(d,  26.0, 0.952, layerRot(0.7,0.4), 120.0);\n  col += starLayer(d,  47.0, 0.952, layerRot(2.1,1.1), 200.0);\n  col += starLayer(d,  83.0, 0.952, layerRot(4.0,2.3), 320.0);\n  col += starLayer(d, 150.0, 0.968, layerRot(5.3,0.9), 480.0);\n  col += heroStars(d);\n  return col*uStarBright;\n}\n\n// Schwarzschild null-geodesic acceleration (c = G = 1, RS = 1)\nvec3 accAt(vec3 p, vec3 v){\n  vec3 h = cross(p, v);\n  float r2 = dot(p, p);\n  return -1.5*RS*dot(h, h)/(r2*r2*sqrt(r2))*p;\n}\n\n// Accretion-disk plane crossing (multiple crossings permitted).\n// Returns true when front-to-back opacity saturates (ray absorbed by disk).\nbool diskCross(vec3 a, vec3 b, vec3 rayDir,\n               inout vec3 col, inout float trans,\n               inout float crossCount, inout float validCross,\n               inout float firstAng, inout float crossRad, inout float turbDbg){\n  if(a.y*b.y > 0.0) return false;\n  float t = abs(a.y)/(abs(a.y) + abs(b.y) + 1e-5);\n  vec3 q = mix(a, b, t);\n  float qr = length(q.xz);\n  crossCount += 1.0;\n  if(qr <= uDin || qr >= uDout) return false;\n  validCross += 1.0;\n  float ang = atan(q.z, q.x);\n  if(validCross < 1.5){ firstAng = ang; crossRad = qr; }\n\n  // Novikov\\u2013Thorne style flux, ISCO = 3 RS\n  float x = max(qr, 3.001);\n  float flux = max(pow(x/3.0, -3.0)*(1.0 - sqrt(3.0/x)), 0.0);\n  float temp = pow(flux*10.0, 0.25);\n\n  // seamless rotating pattern coords (rotate cartesian, never atan-sample)\n  float omega = uRotSign*1.1*uRotSpeed*pow(3.0/qr, 1.5);\n  float rot = omega*uTime;\n  float ca = cos(rot), sa = sin(rot);\n  vec3 qp = vec3(ca*q.x + sa*q.z, 0.0, -sa*q.x + ca*q.z);\n  vec2 rp = qp.xz/qr;\n\n  // turbulence: warp at 1.5x, inner detail, 22x streaks, lane mask\n  vec3 pc = vec3(rp.x*3.0, rp.y*3.0, qr*0.85);\n  vec3 warp = vec3(\n    fbm(pc*1.5),\n    fbm(pc*1.5 + vec3(5.2,1.3,2.8)),\n    fbm(pc*1.5 + vec3(9.7,4.1,7.3)));\n  float turb = fbm(pc*2.0 + warp*1.5);\n  float innerDetail = 1.0 - smoothstep(4.0, 18.0, qr);\n  turb = mix(0.50, turb*1.7, innerDetail);\n  float streakN = fbm(vec3(rp.x*22.0, rp.y*22.0, qr*1.4));\n  // 22x streaks live in the inner disk; outer haze stays smooth\n  float streak = mix(0.95, mix(0.55, 1.15, smoothstep(0.25, 0.85, streakN)), innerDetail);\n  float lane = fbm(vec3(rp.x*5.0, rp.y*5.0, qr*0.55) + warp*0.8);\n  float laneMask = mix(0.85, mix(0.50, 1.30, smoothstep(0.15, 0.80, lane)), innerDetail);\n  // radial gain: inner disk fierce, outer disk a dim smooth haze\n  float radialGain = mix(0.38, 1.0, innerDetail);\n  turbDbg = turb;\n\n  float I = flux*11.0*turb*streak*laneMask*radialGain;\n  I += exp(-pow((qr-3.1)*3.0, 2.0))*2.8;              // inner glow\n  float outerFade = 1.0 - smoothstep(uDout-14.0, uDout, qr);\n  I *= outerFade;\n\n  // relativistic beaming + gravitational redshift\n  float beta = sqrt(0.5/qr);\n  float gamma = 1.0/sqrt(max(1.0 - beta*beta, 1e-4));\n  vec3 tdir = normalize(vec3(-sin(ang), 0.0, cos(ang)))*uRotSign;\n  float dop = 1.0/(gamma*(1.0 - dot(tdir*beta, rayDir)));\n  dop = clamp(dop, 0.50, uDopMax);\n  float g = sqrt(max(1.0 - RS/qr, 0.0));\n\n  vec3 dcol = blackbody(temp*dop*g) * I * (dop*dop*dop) * g * uDiskBright;\n  float alpha = mix(uOpFar, uOpNear, 1.0 - smoothstep(4.0, 13.0, qr)) * outerFade;\n  col += trans * alpha * dcol;\n  trans *= 1.0 - alpha;\n  if(trans < 0.02){ trans = 0.0; return true; }\n  return false;\n}\n\n// ------------------------------------------------------------------ main ----\nvoid main(){\n  vec2 p = (gl_FragCoord.xy - 0.5*uRes)/uRes.y;\n  vec3 ro = uCamPos;\n  vec3 ww = normalize(uCamTarget - ro);\n  vec3 uu = normalize(cross(ww, vec3(0.0,1.0,0.0)));\n  vec3 vv = cross(uu, ww);\n  vec3 rd = normalize(p.x*uu + p.y*vv + uFov*ww);\n\n  vec3 pos = ro;\n  vec3 vel = rd;\n  vec3 col = vec3(0.0);              // disk accumulator (front-to-back)\n  vec3 haloCol = vec3(0.0);          // volumetric halo (dropped if captured)\n  float trans = 1.0;\n  float minR = 1e5;\n  float lastR = length(ro);\n  int   stepsUsed = 0;\n  float crossCount = 0.0;\n  float validCross = 0.0;\n  float firstAng = 0.0;\n  float crossRad = 0.0;\n  float turbDbg = 0.0;\n\n  for(int i=0;i<600;i++){\n    if(i >= uSteps) break;\n    float r = length(pos);\n    lastR = r;\n    if(r < 1.03*RS){ trans = 0.0; break; }                 // event horizon\n    if(r > 45.0 && dot(pos,vel) > 0.0){ break; }           // escaped\n    stepsUsed = i + 1;\n    minR = min(minR, r);\n\n    float dt = max(0.012, r*mix(0.02, 0.06, smoothstep(6.0, 20.0, r)));\n\n    // thin volumetric halo hugging the disk plane\n    float absY = abs(pos.y);\n    if(absY < 0.45 && r > uDin && r < uDout){\n      float dens = exp(-absY*30.0)*0.03*(1.0 - smoothstep(10.0, uDout-1.0, r));\n      float xh = max(r, 3.001);\n      float fluxh = max(pow(xh/3.0, -3.0)*(1.0 - sqrt(3.0/xh)), 0.0);\n      vec3 glowc = blackbody(pow(fluxh*10.0, 0.25)*0.9);\n      haloCol += trans * glowc * (fluxh*3.5) * dens * dt * uDiskBright;\n    }\n\n    if(r < 4.4){\n      // near-critical refinement: two fixed half-substeps with midpoint\n      // acceleration (RK2); total advancement still matches baseDt and the\n      // outer uSteps budget is unchanged\n      float hdt = dt*0.5;\n      bool absorbed = false;\n      for(int s = 0; s < 2; s++){\n        vec3 k1 = accAt(pos, vel);\n        vec3 pm = pos + vel*(hdt*0.5);\n        vec3 vm = normalize(vel + k1*(hdt*0.5));\n        vec3 k2 = accAt(pm, vm);\n        vec3 pn = pos + vm*hdt;\n        vel = normalize(vel + k2*hdt);\n        if(diskCross(pos, pn, vel, col, trans, crossCount, validCross, firstAng, crossRad, turbDbg)){\n          absorbed = true;\n        }\n        pos = pn;\n        minR = min(minR, length(pos));\n      }\n      if(absorbed) break;\n    }else{\n      vel = normalize(vel + accAt(pos, vel)*dt);\n      vec3 npos = pos + vel*dt;\n      if(diskCross(pos, npos, vel, col, trans, crossCount, validCross, firstAng, crossRad, turbDbg)){\n        pos = npos;\n        break;\n      }\n      pos = npos;\n    }\n  }\n\n  // lensed background sampled only in the final escape direction.\n  // Budget-exhausted rays keep trans and contribute continuously dimmed\n  // deep-well light (spec \\xA77.5); halo counts for non-captured rays and is\n  // dimmed by the same factor, so the horizon itself stays pure black.\n  vec3 bgAdd = vec3(0.0);\n  if(trans > 0.0){\n    float deep = clamp((lastR-1.03)*0.45, 0.45, 1.0);\n    col += haloCol * deep;\n    bgAdd = trans * background(vel) * deep;\n  }\n  // photon ring from the tracked perigee (thin critical curve, bloom-fed)\n  vec3 ringAdd = vec3(1.0,0.92,0.80) * exp(-pow((minR-1.55)*4.0, 2.0)) * 0.05;\n\n  vec3 outCol;\n  if(uDebug == 1){                       // disk / halo only\n    outCol = col;\n  }else if(uDebug == 2){                 // lensed background only\n    outCol = bgAdd;\n  }else if(uDebug == 3){                 // step usage\n    outCol = vec3(float(stepsUsed)/float(max(uSteps,1)));\n  }else if(uDebug == 4){                 // first-crossing radius map\n    float v = clamp(crossRad/max(uDout,1e-3), 0.0, 1.0);\n    outCol = (validCross > 0.5) ? vec3(v, v*(1.0-v)*2.4, 1.0-v) : vec3(0.0);\n  }else if(uDebug == 5){                 // raw turbulence\n    outCol = vec3(clamp(turbDbg, 0.0, 1.0));\n  }else if(uDebug == 6){                 // minR (red) / crossing count (green)\n    outCol = vec3(clamp(minR/12.0,0.0,1.0), clamp(crossCount/4.0,0.0,1.0), 0.0);\n  }else if(uDebug == 7){                 // valid crossing count\n    if(validCross < 0.5)      outCol = vec3(0.0);\n    else if(validCross < 1.5) outCol = vec3(0.0,0.0,1.0);\n    else if(validCross < 2.5) outCol = vec3(0.0,1.0,0.0);\n    else                      outCol = vec3(1.0,0.0,0.0);\n  }else if(uDebug == 8){                 // three-phase sine of first crossing angle\n    outCol = (validCross > 0.5)\n      ? 0.5 + 0.5*sin(firstAng + vec3(0.0, 2.0944, 4.1888))\n      : vec3(0.0);\n  }else if(uDebug == 9){                 // crossing-radius bands\n    float band = mod(floor(crossRad), 2.0);\n    outCol = (validCross > 0.5)\n      ? mix(vec3(0.05,0.15,0.45), vec3(0.95,0.55,0.15), band)\n      : vec3(0.0);\n  }else{                                 // 0 \\u2014 normal\n    outCol = col + bgAdd + ringAdd;\n  }\n\n  outCol = clamp(max(outCol, vec3(0.0)), vec3(0.0), vec3(64.0));\n  gl_FragColor = vec4(outCol, 1.0);\n}\n";
var composite_vert_default = "varying vec2 vUv;\nvoid main(){\n  vUv = uv;\n  gl_Position = vec4(position.xy, 0.0, 1.0);\n}\n";
var composite_frag_default = "precision highp float;\n\nvarying vec2 vUv;\nuniform sampler2D tDiffuse;\nuniform vec2  uRes;\nuniform float uTime;\nuniform float uVignette;\nuniform float uGrain;\nuniform float uCA;\n\nvec3 aces(vec3 x){\n  return clamp((x*(2.51*x + 0.03))/(x*(2.43*x + 0.59) + 0.14), 0.0, 1.0);\n}\nfloat ghash(vec2 p){\n  return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453);\n}\nvoid main(){\n  vec2 uv = vUv;\n  vec2 dir = uv - 0.5;\n\n  // chromatic aberration (radial, R/B symmetric)\n  float ca = uCA*dot(dir, dir);\n  vec3 col;\n  col.r = texture2D(tDiffuse, uv + dir*ca).r;\n  col.g = texture2D(tDiffuse, uv).g;\n  col.b = texture2D(tDiffuse, uv - dir*ca).b;\n\n  // manual ACES (renderer tone mapping stays OFF)\n  col *= 0.95;\n  col = aces(col);\n\n  // aspect-aware vignette\n  float aspect = uRes.x/max(uRes.y, 1.0);\n  float vig = smoothstep(1.30, 0.30, length(dir*vec2(aspect, 1.0))*1.15);\n  col *= mix(1.0, vig, uVignette);\n\n  // animated fine grain, centered [-.5,.5]\n  float g = ghash(gl_FragCoord.xy + fract(uTime*13.7)*97.0) - 0.5;\n  col += g*uGrain*(1.0 - 0.5*col);\n\n  gl_FragColor = vec4(col, 1.0);\n}\n";
var D2R = Math.PI / 180;
var PIXEL_BUDGET = 115e4;
var STEPS = 180;
var DPR_CAP = 1.15;
var CINE_SEGMENT = 11;
var FOV = 44;
var CINE_KEYS = [
	[
		58,
		12,
		-30
	],
	[
		36,
		6,
		10
	],
	[
		26,
		24,
		55
	],
	[
		14,
		14,
		100
	],
	[
		20,
		52,
		150
	],
	[
		34,
		80,
		200
	],
	[
		46,
		35,
		270
	],
	[
		36,
		8,
		330
	]
];
var K_R = CINE_KEYS.map((k) => k[0]);
var K_I = CINE_KEYS.map((k) => k[1] * D2R);
var K_A = CINE_KEYS.map((k) => k[2] * D2R);
function cr(p0, p1, p2, p3, t) {
	const t2 = t * t;
	const t3 = t2 * t;
	return .5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
function wrapIdx(k, n) {
	return (k % n + n) % n;
}
function cinePath(time, out) {
	const n = CINE_KEYS.length;
	const tt = time / Math.max(1, CINE_SEGMENT);
	const i = Math.floor(tt);
	const t = tt - i;
	const v = (arr, k) => arr[wrapIdx(k, n)];
	const az = (k) => K_A[wrapIdx(k, n)] + 2 * Math.PI * Math.floor(k / n);
	const r = cr(v(K_R, i - 1), v(K_R, i), v(K_R, i + 1), v(K_R, i + 2), t);
	const inc = cr(v(K_I, i - 1), v(K_I, i), v(K_I, i + 1), v(K_I, i + 2), t);
	const a = cr(az(i - 1), az(i), az(i + 1), az(i + 2), t);
	out.set(r * Math.cos(inc) * Math.sin(a), r * Math.sin(inc), r * Math.cos(inc) * Math.cos(a));
	return out;
}
var easeCubic = (k) => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
var GargantuaEngine = class {
	canvas;
	renderer;
	composer;
	bloomPass = null;
	compositePass;
	uniforms;
	camera;
	fsScene;
	fsCam;
	fsMat;
	fsMesh;
	cineFrom = new Vector3();
	cineBlend = 0;
	cineTime = 0;
	simTime = 0;
	lastNow = 0;
	rafId = 0;
	running = false;
	disposed = false;
	_v1 = new Vector3();
	_dbSize = new Vector2();
	onResize;
	onVisibility;
	onContextLost;
	onContextRestored;
	constructor(canvas) {
		this.canvas = canvas;
		this.renderer = new WebGLRenderer({
			canvas,
			antialias: false,
			powerPreference: "high-performance",
			alpha: false
		});
		this.renderer.outputColorSpace = LinearSRGBColorSpace;
		this.renderer.toneMapping = 0;
		let halfFloatOK = true;
		try {
			const gl = this.renderer.getContext();
			halfFloatOK = !!(gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float"));
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
			uSteps: { value: STEPS },
			uRotSign: { value: 1 },
			uDebug: { value: 0 },
			uDin: { value: 2.75 },
			uDout: { value: 40 },
			uDopMax: { value: 1.85 },
			uOpNear: { value: .9 },
			uOpFar: { value: .8 },
			uDiskBright: { value: 1 },
			uStarBright: { value: 1 },
			uSkyFloor: { value: .04 },
			uRotSpeed: { value: 1 }
		};
		this.fsMat = new ShaderMaterial({
			vertexShader: ray_vert_default,
			fragmentShader: ray_frag_default,
			uniforms: this.uniforms,
			depthTest: false,
			depthWrite: false
		});
		this.fsMesh = new Mesh(new PlaneGeometry(2, 2), this.fsMat);
		this.fsScene.add(this.fsMesh);
		this.camera = new PerspectiveCamera(FOV, 1, .01, 200);
		this.camera.position.set(4.49, 2.72, 25.46);
		this.camera.lookAt(0, 0, 0);
		this.cineFrom.copy(this.camera.position);
		const rt = new WebGLRenderTarget(2, 2, {
			type: halfFloatOK ? HalfFloatType : UnsignedByteType,
			depthBuffer: false
		});
		this.composer = new EffectComposer(this.renderer, rt);
		this.composer.addPass(new RenderPass(this.fsScene, this.fsCam));
		if (halfFloatOK) {
			this.bloomPass = new UnrealBloomPass(new Vector2(2, 2), .55, .35, .55);
			this.composer.addPass(this.bloomPass);
		}
		this.compositePass = new ShaderPass(new ShaderMaterial({
			vertexShader: composite_vert_default,
			fragmentShader: composite_frag_default,
			uniforms: {
				tDiffuse: { value: null },
				uRes: { value: new Vector2(1, 1) },
				uTime: { value: 0 },
				uVignette: { value: 1 },
				uGrain: { value: .045 },
				uCA: { value: .0028 }
			}
		}));
		this.composer.addPass(this.compositePass);
		this.onResize = () => this.resize();
		this.onVisibility = () => {
			if (document.hidden) this.stopLoop();
			else if (this.running) this.startLoop();
		};
		this.onContextLost = (e) => {
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
	startLoop() {
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
	stopLoop() {
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = 0;
		}
	}
	frame() {
		const now = performance.now();
		const realDelta = Math.max(5e-4, (now - this.lastNow) / 1e3);
		this.lastNow = now;
		const dt = Math.min(realDelta, .1);
		this.simTime += dt;
		this.cineTime += dt;
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
		} catch {
			this.stopLoop();
		}
	}
	resize() {
		const w = window.innerWidth;
		const h = window.innerHeight;
		const devDpr = window.devicePixelRatio || 1;
		const byPixels = Math.sqrt(PIXEL_BUDGET / Math.max(1, w * h));
		const dpr = Math.max(.65, Math.min(devDpr, DPR_CAP, byPixels));
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
};
//#endregion
export { GargantuaEngine };
