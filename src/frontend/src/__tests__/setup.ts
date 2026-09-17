import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Generated components use `data-ocid` for test hooks; make it the test id
// attribute so `getByTestId` matches the app's own selectors.
configure({ testIdAttribute: "data-ocid" });

afterEach(() => {
  cleanup();
  // Radix Popover/Dialog portals render their content into document.body and
  // keep it mounted through the close animation. In jsdom that animation never
  // settles, so the portal content leaks into the next test and its leftover
  // emoji buttons / open state make a later popover test time out. Force-remove
  // any leftover portal content so no open popover state carries across tests.
  document.body.innerHTML = "";
  // The reels feed creates an IntersectionObserver per mount. Reset the stub's
  // recorded instances so a test never observes an observer from an earlier
  // render.
  IntersectionObserverStub.instances = [];
});

// jsdom does not implement scrollIntoView; the chat room scrolls to the latest
// message on render. Provide a no-op so the effect does not throw in tests.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Radix Popover (used by the chat room's emoji pickers) observes its content
// with ResizeObserver to position it. jsdom does not implement it, so without
// a stub the popover content never mounts and the emoji buttons never appear.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!("ResizeObserver" in globalThis)) {
  (globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverStub;
}

// Radix Popover schedules its open/close animations through
// requestAnimationFrame. jsdom does not implement it, so a pending animation
// frame would never fire and would leak a live handle across tests, making the
// next test time out even after its body completes. Run the callback
// synchronously so no frame is left pending.
if (!("requestAnimationFrame" in globalThis)) {
  (globalThis as Record<string, unknown>).requestAnimationFrame = (
    cb: FrameRequestCallback,
  ) => {
    cb(0);
    return 0;
  };
  (globalThis as Record<string, unknown>).cancelAnimationFrame = () => {};
}

// The object-storage package's dist/index.js imports a `./blob` subpath that
// does not resolve under Vitest's module graph. The app only uses ExternalBlob
// to wrap uploaded bytes before calling the actor, so a lightweight mock keeps
// the seam without depending on the broken subpath.
vi.mock("@caffeineai/object-storage", () => {
  class ExternalBlob {
    static fromBytes(bytes: Uint8Array, _type: string, _name: string) {
      return new ExternalBlob(bytes);
    }
    withUploadProgress(_cb: (p: number) => void) {
      return this;
    }
    constructor(public bytes: Uint8Array) {}
  }
  return { ExternalBlob };
});

// Radix Popover positions its portal content through @floating-ui/dom's
// autoUpdate, which keeps a ResizeObserver/interval loop alive for as long as
// the popover is mounted. In jsdom that loop never settles and leaks a live
// handle into the next test, making it time out even after its body completes.
// Stub autoUpdate to a no-op so no positioning loop is left running.
vi.mock("@floating-ui/dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@floating-ui/dom")>();
  return {
    ...actual,
    autoUpdate: () => () => {},
  };
});

// The reels feed uses an IntersectionObserver to decide which reel is in view
// and should autoplay. jsdom does not implement it, so without a stub the
// ReelsPage effect throws on mount. The stub records observed elements and
// exposes a trigger so tests can simulate a reel scrolling into view.
type IntersectionCallback = (
  entries: Array<{ target: Element; isIntersecting: boolean }>,
) => void;
class IntersectionObserverStub {
  static instances: IntersectionObserverStub[] = [];
  readonly root: Element | null;
  readonly threshold: number | number[];
  private callback: IntersectionCallback;
  private observed = new Set<Element>();
  constructor(
    callback: IntersectionCallback,
    options?: { root?: Element | null; threshold?: number | number[] },
  ) {
    this.callback = callback;
    this.root = options?.root ?? null;
    this.threshold = options?.threshold ?? 0;
    IntersectionObserverStub.instances.push(this);
  }
  observe(target: Element) {
    this.observed.add(target);
  }
  unobserve(target: Element) {
    this.observed.delete(target);
  }
  disconnect() {
    this.observed.clear();
  }
  /** Simulate the given element entering/leaving the viewport. */
  trigger(target: Element, isIntersecting: boolean) {
    this.callback([{ target, isIntersecting }]);
  }
  get observedElements() {
    return [...this.observed];
  }
}
if (!("IntersectionObserver" in globalThis)) {
  (globalThis as Record<string, unknown>).IntersectionObserver =
    IntersectionObserverStub;
}

// ReelCard calls video.play() on the active reel. jsdom defines play() but
// throws "Not implemented", so the `.catch()` in the component never runs and
// the error propagates. Override it to resolve so autoplay logic runs without
// erroring in tests.
HTMLMediaElement.prototype.play = () => Promise.resolve();
HTMLMediaElement.prototype.pause = () => {};
