// DEBUG: draws hex area (dist <= 1) using scene-coordinate origin offset
uniform vec2 origin;
uniform float hexSize; // dpi / sqrt(3)
uniform float hexType; // 0.0 = HEX_VERTICAL (pointy-top), 1.0 = HEX_HORIZONTAL (flat-top)

float hexDist(vec2 p) {
  float q, r;
  if (hexType < 0.5) {
    // Pointy-top
    q = ( 0.5773503 * p.x - 0.3333333 * p.y) / hexSize;
    r = ( 0.6666667 * p.y) / hexSize;
  } else {
    // Flat-top
    q = ( 0.6666667 * p.x) / hexSize;
    r = (-0.3333333 * p.x + 0.5773503 * p.y) / hexSize;
  }
  float s = -q - r;
  float rq = round(q), rr = round(r), rs = round(s);
  float dq = abs(rq - q), dr = abs(rr - r), ds = abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  else rs = -rq - rr;
  return (abs(rq) + abs(rr) + abs(rs)) / 2.0;
}

half4 main(float2 coord) {
  float dist = round(hexDist(coord - origin));
  if (dist <= 1.0) {
    return half4(0.863, 0.149, 0.149, 1.0);
  }
  return half4(0.0);
}
