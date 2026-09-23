/**
 * ─ Transport ─
 *
 * The one file that touches trystero. A viewing's transport is the least
 * the viewing needs: send to all or to one, hear messages with who sent
 * them, hear peers come and go, and leave. The library is loaded on
 * demand, so the solo gallery never fetches it, and the relays are
 * named outright, since the library's own list has left a peer unable
 * to connect before, in warrior of keyboard.
 * Decision: DECISIONS.md, a viewing is opt-in by link and siloed.
 */

const APP_ID = "atelier";

// Public Nostr relays the peers find each other through; several, so one
// blocked or down still leaves a way.
const RELAYS = [
  "wss://nos.lol",
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nostr.mom",
  "wss://relay.snort.social",
  "wss://offchain.pub",
];

/** What a viewing can do over the network, and nothing more. */
export interface Transport {
  /** This screen's own peer id. */
  readonly selfId: string;
  /** Send to every peer, or to one. */
  send(data: unknown, to?: string): void;
  onMessage(listener: (data: unknown, from: string) => void): void;
  onJoin(listener: (peerId: string) => void): void;
  onLeave(listener: (peerId: string) => void): void;
  peers(): readonly string[];
  leave(): void;
}

/** Join the viewing `code` and return its transport; resolves once the library is loaded, not once a peer is found. */
export async function connect(code: string): Promise<Transport> {
  const { joinRoom, selfId } = await import("trystero/nostr");
  const room = joinRoom({ appId: APP_ID, relayConfig: { urls: RELAYS } }, code);
  const action = room.makeAction("msg");
  type Payload = Parameters<typeof action.send>[0];
  return {
    selfId,
    send: (data, to) => {
      action
        .send(data as Payload, to === undefined ? undefined : { target: to })
        .catch(reportError);
    },
    onMessage: (listener) => {
      action.onMessage = (data, context) => {
        listener(data, context.peerId);
      };
    },
    onJoin: (listener) => {
      room.onPeerJoin = listener;
    },
    onLeave: (listener) => {
      room.onPeerLeave = listener;
    },
    peers: () => Object.keys(room.getPeers()),
    leave: () => {
      room.leave().catch(reportError);
    },
  };
}
