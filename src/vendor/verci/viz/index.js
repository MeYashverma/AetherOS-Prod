// The 13 styles of the latest Verci release (v2.0.1) in Verci's grouping, plus 4 originals (Kinetic, Collage, Y2K, Cinema).
// `own: true` marks styles that keep their own colours regardless of the Aesthetics settings.
import { Visual, Fisheye, FisheyeVisual, Ship } from './type.js';
import { Codestyle, CodestyleVisual, Branches, Web, Constellation } from './scenes.js';
// Version this import so an open preview cannot pair the new chat CSS with stale header markup.
import { Notifications, Money, Messages, MapStyle } from './native.js?v=chat-history-24';
import { Kinetic, Collage, Y2K, Cinema } from './art.js';

export const STYLES = [
  { id: 'ship', name: 'Ship', group: 'Kinetic type', make: Ship },
  { id: 'fisheye', name: 'Fisheye', group: 'Kinetic type', make: Fisheye },
  { id: 'visual', name: 'Visual', group: 'Kinetic type', make: Visual },
  { id: 'fisheye-visual', name: 'Fisheye Visual', group: 'Kinetic type', make: FisheyeVisual },
  { id: 'codestyle', name: 'Codestyle', group: 'Motion scenes', make: Codestyle },
  { id: 'codestyle-visual', name: 'Codestyle Visual', group: 'Motion scenes', make: CodestyleVisual },
  { id: 'branches', name: 'Branches', group: 'Motion scenes', make: Branches },
  { id: 'web', name: 'Web', group: 'Motion scenes', make: Web },
  { id: 'constellation', name: 'Constellation', group: 'Motion scenes', make: Constellation },
  { id: 'kinetic', name: 'Kinetic', group: 'Originals', make: Kinetic },
  { id: 'collage', name: 'Collage', group: 'Originals', make: Collage },
  { id: 'y2k', name: 'Chrome', group: 'Originals', make: Y2K },
  { id: 'cinema', name: 'Cinema', group: 'Originals', make: Cinema },
  { id: 'native-messages', name: 'Native Design', group: 'Native Design', own: true, make: Messages },
  { id: 'native-money', name: 'Native Design Money', group: 'Native Design', own: true, make: Money },
  { id: 'native-map', name: 'Native Design Map', group: 'Native Design', own: true, make: MapStyle },
  { id: 'native-notifications', name: 'Native Design Notifications', group: 'Native Design', own: true, make: Notifications }
];
