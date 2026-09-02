precision highp float;

varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform vec2  uRes;
uniform float uTime;
uniform float uVignette;
uniform float uGrain;
uniform float uCA;

vec3 aces(vec3 x){
  return clamp((x*(2.51*x + 0.03))/(x*(2.43*x + 0.59) + 0.14), 0.0, 1.0);
}
float ghash(vec2 p){
  return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453);
}
void main(){
  vec2 uv = vUv;
  vec2 dir = uv - 0.5;

  // chromatic aberration (radial, R/B symmetric)
  float ca = uCA*dot(dir, dir);
  vec3 col;
  col.r = texture2D(tDiffuse, uv + dir*ca).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv - dir*ca).b;

  // manual ACES (renderer tone mapping stays OFF)
  col *= 0.95;
  col = aces(col);

  // aspect-aware vignette
  float aspect = uRes.x/max(uRes.y, 1.0);
  float vig = smoothstep(1.30, 0.30, length(dir*vec2(aspect, 1.0))*1.15);
  col *= mix(1.0, vig, uVignette);

  // animated fine grain, centered [-.5,.5]
  float g = ghash(gl_FragCoord.xy + fract(uTime*13.7)*97.0) - 0.5;
  col += g*uGrain*(1.0 - 0.5*col);

  gl_FragColor = vec4(col, 1.0);
}
