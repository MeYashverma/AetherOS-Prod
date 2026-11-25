// A lightweight, local 2.5D map camera. World coordinates and route points are
// never moved: perspective affects only their projection onto the phone.
export function mapCamera({ width, height, center, bearing = 0, explore = false, flat = false, anchor = null }) {
  const zoom = Math.max(0.68, Math.min(1.14, width / 350)) * (explore ? 1.88 : 1.04);
  const pitch = flat ? 1 : explore ? 0.69 : 0.76;
  const perspective = flat ? 0 : explore ? 0.00092 : 0.00108;
  const elevation = flat ? 0 : 0.94;
  const ax = width / 2, ay = height * (anchor ?? (explore ? 0.715 : 0.765));
  const cp = Math.cos(bearing), sp = Math.sin(bearing);
  const plane = ([x, y]) => {
    const dx = x - center.x, dy = y - center.y;
    return [dx * cp - dy * sp, dx * sp + dy * cp];
  };
  const depth = p => plane(p)[1];
  const scaleAt = v => zoom / Math.max(0.26, 1 - v * perspective);
  const project = (p, altitude = 0) => {
    const [u, v] = plane(p), scale = scaleAt(v);
    return [ax + u * scale, ay + (v * pitch - altitude * elevation) * scale];
  };
  const unproject = ([x, y]) => {
    const dy = y - ay;
    const v = dy / (zoom * pitch + dy * perspective);
    const u = (x - ax) / scaleAt(v);
    return [center.x + u * cp + v * sp, center.y - u * sp + v * cp];
  };
  const bounds = () => {
    // There is no need to generate what's hidden behind the opaque navigation
    // header. Leave ample headroom for tall rooftops and waterfront scenery.
    const top = height * (explore ? 0.03 : 0.20), bottom = height + 45, pad = 55;
    const corners = [[-pad, top], [width + pad, top], [-pad, bottom], [width + pad, bottom]].map(unproject);
    return [Math.min(...corners.map(p => p[0])) - 110, Math.min(...corners.map(p => p[1])) - 110,
      Math.max(...corners.map(p => p[0])) + 110, Math.max(...corners.map(p => p[1])) + 110];
  };
  return { project, unproject, bounds, scaleAt, depth, zoom, pitch, perspective, elevation, ax, ay, width, height, contentTop: height * (explore ? .10 : .26), contentBottom: height * .88 };
}
