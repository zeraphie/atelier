# Testing — Atelier

How a change proves itself. Code style is in [STYLE.md](STYLE.md).

## One kind of test

- **Logic tests** for pure logic: the camera math, the wheel and
  pinch mapping, the frame scheduler, the hang, the tier a zoom lands
  in, the comment events and what they do to the store's state, the
  wording of a relative time. `bun test`, in milliseconds, and they
  never lie.
- Nothing else gets a test of its own. Components, pins and panels
  are verified in the browser by a person. A bug found there becomes
  a logic test where the logic is, or it stays a browser check.
- No end-to-end runs. The project is small by design; more coverage
  means more logic tests, not a second runner.

## How

- Top-level `tests/`, one file per module: `<module>.test.ts`.
- DOM- or canvas-bound code is never DOM-emulated: extract the math
  into a pure module, test that, and let the browser show it
  rendering.
- Names describe the scenario: `"keeps the world point under the
  anchor fixed"`.
- No mocks unless hitting a real external service; a fake refresh
  loop handed in as a function is not a mock.
- `check` runs in seconds; keep it so.
