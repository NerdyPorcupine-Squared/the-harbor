/*! The Harbor Home Enhancements | streaming-services.js + home-navigation.js */
(() => {
  "use strict";

  const ADAPTER_VERSION = "core-v1-rc3";
  const ADAPTER_ATTRIBUTE = "data-harbor-streaming-services-adapter";
  const HOME_ENHANCEMENTS_ATTRIBUTE = "data-harbor-home-enhancements";
  const STATE_KEY = "__harborStreamingServicesState";
  const HUB_ID = "homelabStreamingHub";
  const HOME_SELECTOR = ".homeSectionsContainer";

  const SERVICES = [
    ["Netflix", "https://www.netflix.com/"],
    ["Prime Video", "https://www.primevideo.com/"],
    ["Disney+", "https://www.disneyplus.com/"],
    ["HBO Max", "https://www.hbomax.com/"],
  ];

  function reconcileHomeEnhancementsMarker() {
    const root = document.documentElement;
    const streamingVersion = root.getAttribute(ADAPTER_ATTRIBUTE);
    const navigationVersion = root.getAttribute("data-harbor-home-navigation-adapter");

    if (streamingVersion === ADAPTER_VERSION && navigationVersion === ADAPTER_VERSION) {
      root.setAttribute(HOME_ENHANCEMENTS_ATTRIBUTE, ADAPTER_VERSION);
      return;
    }

    root.removeAttribute(HOME_ENHANCEMENTS_ATTRIBUTE);
  }

  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function createHub() {
    const hub = makeElement("section", "verticalSection homeSection harbor-streaming-services");
    hub.id = HUB_ID;
    hub.dataset.harborStreamingServices = "true";

    const titleContainer = makeElement(
      "div",
      "sectionTitleContainer sectionTitleContainer-cards stream-header",
    );
    const title = makeElement(
      "h2",
      "sectionTitle sectionTitle-cards padded-left stream-title",
      "Streaming Services",
    );
    titleContainer.append(title);

    const row = makeElement("div", "stream-row padded-left padded-right");
    row.setAttribute("role", "list");

    for (const [name, href] of SERVICES) {
      const link = makeElement("a", "stream-card");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("role", "listitem");
      link.setAttribute("aria-label", `Open ${name}`);

      const logo = makeElement("span", "service-logo", name);
      const openLabel = makeElement("span", "open-label", "Open");
      link.append(logo, openLabel);
      row.append(link);
    }

    hub.append(titleContainer, row);
    return hub;
  }

  function findMyMediaSection(container) {
    return (
      [...container.querySelectorAll(":scope > .verticalSection")].find((section) => {
        if (section.id === HUB_ID) return false;

        const heading = section.querySelector(".sectionTitle");
        if (heading?.textContent?.trim().toLowerCase() === "my media") return true;

        const links = [...section.querySelectorAll("a[href]")];
        const hasMovieCue = links.some((link) => /movie/iu.test(link.textContent ?? ""));
        const hasTvCue = links.some((link) => /tv|show|series/iu.test(link.textContent ?? ""));
        return hasMovieCue && hasTvCue;
      }) ?? null
    );
  }

  function ensureHomeOrder() {
    const container = document.querySelector(HOME_SELECTOR);
    if (!container) return;

    let hub = container.querySelector(`#${HUB_ID}`);
    if (hub && hub.dataset.harborStreamingServices !== "true") {
      const managedHub = createHub();
      hub.replaceWith(managedHub);
      hub = managedHub;
    }
    if (!hub) hub = createHub();

    if (container.firstElementChild !== hub) {
      container.prepend(hub);
    }

    const myMediaSection = findMyMediaSection(container);
    if (myMediaSection && hub.nextElementSibling !== myMediaSection) {
      container.insertBefore(myMediaSection, hub.nextElementSibling);
    }
  }

  let queued = false;
  function scheduleHomeOrder() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      ensureHomeOrder();
    });
  }

  const root = document.documentElement;
  const previousState = window[STATE_KEY];

  if (previousState?.version === ADAPTER_VERSION) {
    root.setAttribute(ADAPTER_ATTRIBUTE, ADAPTER_VERSION);
    ensureHomeOrder();
    reconcileHomeEnhancementsMarker();
    return;
  }

  if (previousState?.observer && typeof previousState.observer.disconnect === "function") {
    previousState.observer.disconnect();
  }

  ensureHomeOrder();

  const observer = new MutationObserver(scheduleHomeOrder);
  observer.observe(document.body ?? document.documentElement, { childList: true, subtree: true });

  window[STATE_KEY] = {
    version: ADAPTER_VERSION,
    observer,
  };
  root.setAttribute(ADAPTER_ATTRIBUTE, ADAPTER_VERSION);
  reconcileHomeEnhancementsMarker();
})();

(() => {
  "use strict";

  const ADAPTER_VERSION = "core-v1-rc3";
  const ADAPTER_ATTRIBUTE = "data-harbor-home-navigation-adapter";
  const HOME_ENHANCEMENTS_ATTRIBUTE = "data-harbor-home-enhancements";
  const STATE_KEY = "__harborHomeNavigationState";
  const HEADER_SELECTOR = ".skinHeader .headerTabs";
  const INJECTED_ATTRIBUTE = "data-harbor-global-nav";
  const LABELS = {
    home: "Home",
    movies: "Movies",
    tv: "TV Shows",
    favorites: "Favorites",
  };

  function reconcileHomeEnhancementsMarker() {
    const root = document.documentElement;
    const streamingVersion = root.getAttribute("data-harbor-streaming-services-adapter");
    const navigationVersion = root.getAttribute(ADAPTER_ATTRIBUTE);

    if (streamingVersion === ADAPTER_VERSION && navigationVersion === ADAPTER_VERSION) {
      root.setAttribute(HOME_ENHANCEMENTS_ATTRIBUTE, ADAPTER_VERSION);
      return;
    }

    root.removeAttribute(HOME_ENHANCEMENTS_ATTRIBUTE);
  }

  function normalize(text) {
    return text?.trim().replace(/\s+/gu, " ").toLowerCase() ?? "";
  }

  function findNativeTab(header, label) {
    const target = normalize(label);
    return (
      [...header.querySelectorAll(".emby-tab-button:not([data-harbor-global-nav])")].find(
        (element) => normalize(element.textContent) === target,
      ) ?? null
    );
  }

  function discoverLibraryHref(kind) {
    const labels =
      kind === "movies"
        ? ["movies", "movie"]
        : ["tv shows", "shows", "series"];

    const candidates = [
      ...document.querySelectorAll(`a[href]:not([${INJECTED_ATTRIBUTE}])`),
    ];

    return (
      candidates.find((anchor) => {
        if (anchor.closest(HEADER_SELECTOR)) return false;
        const text = normalize(anchor.textContent);
        return labels.includes(text);
      })?.getAttribute("href") ?? null
    );
  }

  function createTab(kind, label, href, nativeReference) {
    const tab = document.createElement("a");
    tab.className = "emby-tab-button";
    tab.textContent = label;
    tab.href = href;
    tab.setAttribute(INJECTED_ATTRIBUTE, kind);

    const nativeRole = nativeReference?.getAttribute("role");
    if (nativeRole) tab.setAttribute("role", nativeRole);

    return tab;
  }

  function injectedTabsAreCurrent(header, movieHref, tvHref) {
    const movies = header.querySelector(`[${INJECTED_ATTRIBUTE}="movies"]`);
    const tv = header.querySelector(`[${INJECTED_ATTRIBUTE}="tv"]`);

    if (!movies || !tv) return false;
    if (header.querySelectorAll(`[${INJECTED_ATTRIBUTE}]`).length !== 2) return false;
    if (movies.getAttribute("href") !== movieHref) return false;
    if (tv.getAttribute("href") !== tvHref) return false;

    return normalize(movies.textContent) === "movies" && normalize(tv.textContent) === "tv shows";
  }

  function removeInjectedTabs(header) {
    for (const element of header.querySelectorAll(`[${INJECTED_ATTRIBUTE}]`)) {
      element.remove();
    }
  }

  function ensureGlobalNav() {
    const header = document.querySelector(HEADER_SELECTOR);
    if (!header) return;

    const home = findNativeTab(header, LABELS.home);
    const favorites = findNativeTab(header, LABELS.favorites);
    const movieHref = discoverLibraryHref("movies");
    const tvHref = discoverLibraryHref("tv");

    if (!home || !favorites || !movieHref || !tvHref) {
      removeInjectedTabs(header);
      return;
    }

    if (injectedTabsAreCurrent(header, movieHref, tvHref)) return;

    removeInjectedTabs(header);

    const movies = createTab("movies", LABELS.movies, movieHref, favorites);
    const tv = createTab("tv", LABELS.tv, tvHref, favorites);
    header.insertBefore(movies, favorites);
    header.insertBefore(tv, favorites);
  }

  let queued = false;
  function scheduleGlobalNav() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      ensureGlobalNav();
    });
  }

  const root = document.documentElement;
  const previousState = window[STATE_KEY];

  if (previousState?.version === ADAPTER_VERSION) {
    root.setAttribute(ADAPTER_ATTRIBUTE, ADAPTER_VERSION);
    ensureGlobalNav();
    reconcileHomeEnhancementsMarker();
    return;
  }

  if (previousState?.observer && typeof previousState.observer.disconnect === "function") {
    previousState.observer.disconnect();
  }

  ensureGlobalNav();

  const observer = new MutationObserver(scheduleGlobalNav);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window[STATE_KEY] = {
    version: ADAPTER_VERSION,
    observer,
  };
  root.setAttribute(ADAPTER_ATTRIBUTE, ADAPTER_VERSION);
  reconcileHomeEnhancementsMarker();
})();
