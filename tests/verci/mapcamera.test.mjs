// The 3D camera changes only pixels, never geographic nodes or lyric geometry.
import assert from 'node:assert/strict';
import test from 'node:test';
import { mapCamera } from '../../src/vendor/verci/viz/mapcamera.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} differs from ${b}`);

test('projecting and unprojecting ground positions works at phone sizes, bearings and both tilts', () => {
  for (const [width, height] of [[320, 640], [390, 845]]) {
    for (const bearing of [0, 0.65, -1.2, Math.PI]) {
      for (const mode of [{}, { explore: true, anchor: 0.61 }, { flat: true }]) {
        const cam = mapCamera({ width, height, center: { x: 210, y: -350 }, bearing, ...mode });
        for (const x of [130, 210, 290]) for (const y of [-440, -350, -260]) {
          const [px, py] = cam.project([x, y]);
          const [rx, ry] = cam.unproject([px, py]);
          close(rx, x); close(ry, y);
        }
        close(cam.project([210, -350])[0], width / 2);
        close(cam.project([210, -350])[1], cam.ay);
        assert.equal(cam.width, width); assert.equal(cam.height, height);
        if (mode.flat) {
          close(cam.scaleAt(90), cam.scaleAt(-90));
          assert.equal(cam.pitch, 1);
          assert.deepEqual(cam.project([210, -350], 40), cam.project([210, -350]), 'flat mode has no building height');
        } else {
          assert.ok(cam.scaleAt(90) > cam.scaleAt(-90), 'the nearer ground is larger');
          assert.ok(cam.pitch < 1);
          assert.ok(cam.project([210, -350], 40)[1] < cam.ay, '3D rises above the ground');
        }
      }
    }
  }
});

test('query bounds include every visible screen corner, including the landmark and nav sheet edges', () => {
  for (const mode of [{}, { flat: true }, { explore: true, anchor: .61 }, { explore: true, anchor: .79 }]) {
    const cam = mapCamera({ width: 352, height: 764, center: { x: -310, y: -490 }, bearing: -.34, ...mode });
    const b = cam.bounds();
    for (const [x, y] of [[0, 240], [352, 240], [0, 764], [352, 764], [176, 400]]) {
      const [wx, wy] = cam.unproject([x, y]);
      assert.ok(wx >= b[0] && wx <= b[2] && wy >= b[1] && wy <= b[3]);
    }
    assert.ok(b[2] - b[0] > 352 && b[3] - b[1] > 400, 'leave headroom for tall roofs');
  }
});
