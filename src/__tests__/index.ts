import {DeviceType, Tracker} from "../index";
import {BeaconTracker, GATracker, KakaoTracker, PixelTracker, TagManagerTracker, TwitterTracker} from "../trackers";
import {BaseTracker} from "../trackers/base";

const ALL_TRACKERS = [BeaconTracker, GATracker, PixelTracker, TagManagerTracker, KakaoTracker, TwitterTracker];

declare global {
  interface Array<T> {
    excludes(...elements: T[]): T[];
  }
}

if (!Array.prototype.excludes) {
  Array.prototype.excludes = function <T>(...elements: T[]): T[] {
    return this.filter((e: T) => !elements.includes(e))
  }
}

type trackerMethods = "isInitialized" | "initialize" | "setMainOptions" | "sendPageView" | "sendEvent" | "registration" | "impression"

beforeAll(() => {
  ALL_TRACKERS.forEach((t) => t.prototype.isInitialized = () => true);
})

beforeEach(() => {
  document.body.innerHTML = "<script />";
  jest.useFakeTimers();
});

afterEach(() => {
  jest.restoreAllMocks();
})

class TestableTracker extends Tracker {
  constructor(additionalOptions: object = {}) {
    super({
      deviceType: DeviceType.Mobile,
      serviceProps: {
        "prop1": "value1",
        "prop2": "value2"
      },
      beaconOptions: {
        use: true
      },
      gaOptions: {
        trackingId: "TEST"
      },
      pixelOptions: {
        pixelId: "TEST"
      },
      tagManagerOptions: {
        trackingId: "TEST"
      },
      kakaoOptions: {
        trackingId: "TEST"
      },
      twitterOptions: {
        mainTid: "TEST",
        productTrackingTid: "TEST",
        booksRegisterTid: "TEST",
      },
      ...additionalOptions
    });
  }

  private findTrackerInstances(...trackers: Array<new(...args: any[]) => BaseTracker>) {
    const isGivenTrackers = (t: BaseTracker) => {
      return trackers.some(useTracker => (t instanceof useTracker))
    }

    return this.trackers.filter(isGivenTrackers)
  }

  public getTrackerInstance<T>(trackerType: new(...args: any[]) => T) {
    return this.trackers.find(t => (t instanceof trackerType))
  }

  public mocking(trackers: Array<new(...args: any[]) => BaseTracker>, methodName: trackerMethods, mockImpl: () => void = () => true) {
    const mockingTargetTrackers = this.findTrackerInstances(...trackers)
    return mockingTargetTrackers.map(t => jest.spyOn(t, methodName).mockImplementation(mockImpl))
  }

  // FIXME: Convert to method overloading
  public mockingAll(trackers: Array<new(...args: any[]) => BaseTracker>, ...methodNames: trackerMethods[]) {
    return methodNames.map(m => {
      return this.mocking(trackers, m)
    })
  }
}


it("BeaconTracker sends PageView event with serviceProps", async () => {
  const dummpyPageMeta = {
    "device": "mobile",
    "href": "https://localhost/home?q=localhost&adult_exclude=true",
    "page": "home",
    "path": "/home",
    "query_params": {"adult_exclude": "true", "q": "localhost"},
    "referrer": "https://google.com/search?q=localhost"
  };

  const t = new TestableTracker();

  t.mocking(ALL_TRACKERS.excludes(BeaconTracker), "sendPageView");

  const href = "https://localhost/home?q=localhost&adult_exclude=true";
  const referrer = "https://google.com/search?q=localhost";
  await t.initialize();

  const sendBeaconMock = jest.fn();
  // @ts-ignore
  BeaconTracker.prototype.sendBeacon = sendBeaconMock;
  t.sendPageView(href, referrer);

  jest.runOnlyPendingTimers();
  expect(sendBeaconMock).toHaveBeenCalledWith("pageView", dummpyPageMeta, {"prop1": "value1", "prop2": "value2"}, expect.any(Date));

});


it("sends PageView event with all tracking providers", async () => {
  const t = new TestableTracker();
  const spies = t.mocking(ALL_TRACKERS, "sendPageView");


  const href = "https://localhost/home";
  const referrer = "https://google.com/search?q=localhost";

  await t.initialize();
  t.sendPageView(href, referrer);

  jest.runOnlyPendingTimers();
  spies.forEach(mock => {
    expect(mock).toBeCalledTimes(1);
  });
});

it("sends events both before and after initialize", async () => {

  const t = new TestableTracker();
  const spies = t.mocking(ALL_TRACKERS, "sendPageView");

  const href = "https://localhost/home";
  const referrer = "https://google.com/search?q=localhost";

  const href2 = "https://localhost/search?q=abc";
  const referrer2 = href;

  t.sendPageView(href, referrer);

  spies.forEach(mock => {
    expect(mock).not.toBeCalled();
  });

  await t.initialize();
  jest.runOnlyPendingTimers();
  t.sendPageView(href2, referrer2);
  jest.runOnlyPendingTimers();


  spies.forEach(mock => {
    expect(mock).toHaveBeenNthCalledWith(1, {
      "device": "mobile",
      "href": "https://localhost/home",
      "page": "home",
      "path": "/home",
      "query_params": {},
      "referrer": "https://google.com/search?q=localhost"
    }, expect.any(Date))
    expect(mock).toHaveBeenNthCalledWith(2, {
      "device": "mobile",
      "href": "https://localhost/search?q=abc",
      "page": "search",
      "path": "/search",
      "query_params": {"q": "abc"},
      "referrer": "https://localhost/home"
    }, expect.any(Date))
  });
});

it("GATracker should send pageview event", async () => {
  const t = new TestableTracker();
  t.mocking(ALL_TRACKERS.excludes(GATracker), "sendPageView");


  const href = "https://localhost/home?q=localhost&adult_exclude=true";
  const referrer = "https://google.com/search?q=localhost";

  await t.initialize();

  // @ts-ignore
  window.ga = jest.fn();
  t.sendPageView(href, referrer);

  jest.runOnlyPendingTimers();
  expect(ga).toHaveBeenCalledWith("set", "page", "/home?q=localhost&adult_exclude=true");

});

it("Test TwitterTracker", async () => {

  const t = new TestableTracker({
    isSelect: true,
    twitterOptions: {
      mainTid: "mainTid",
      selectRegisterTid: "selectRegisterTid",
      productTrackingTid: "productTrackingTid",
      booksRegisterTid: "booksRegisterTid"
    }
  });

  t.mockingAll(ALL_TRACKERS.excludes(TwitterTracker), "sendPageView", "impression", "registration");

  const trackPidMock = jest.fn();
  const twqMock = jest.fn();

  const twitterTracker = t.getTrackerInstance(TwitterTracker)
  // @ts-ignore
  twitterTracker.twttr = {conversion: {}}, twitterTracker.twttr.conversion.trackPid = trackPidMock;

  // @ts-ignore
  twitterTracker.twq = twqMock;

  await t.initialize();

  /* Need to disable flush throttling when sending event multiple times in one test cases */
  // @ts-ignore
  t.throttledFlush = t.flush;

  t.sendPageView("href");
  t.sendImpression();
  t.sendRegistration();
  jest.runOnlyPendingTimers();


  expect(twqMock).toHaveBeenCalledWith("track", "pageView");

  expect(trackPidMock).toHaveBeenNthCalledWith(1, "productTrackingTid", {tw_sale_amount: 0, tw_order_quantity: 0});
  expect(trackPidMock).toHaveBeenNthCalledWith(2, "selectRegisterTid", {tw_sale_amount: 0, tw_order_quantity: 0});

  expect(trackPidMock).not.toHaveBeenCalledWith("booksRegisterTid", {tw_sale_amount: 0, tw_order_quantity: 0});


});
