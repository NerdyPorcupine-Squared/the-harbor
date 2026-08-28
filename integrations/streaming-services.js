(() => {
  "use strict";

  const HUB_ID = "homelabStreamingHub";
  const HOME_SELECTOR = ".homeSectionsContainer";
  const RESUME_SELECTOR = '.itemsContainer[data-monitor*="videoplayback"]';

  const SERVICES = [
    ["Netflix", "https://www.netflix.com/"],
    ["Prime Video", "https://www.primevideo.com/"],
    ["Disney+", "https://www.disneyplus.com/"],
    ["HBO Max", "https://www.hbomax.com/"],
  ];

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

  function ensureHomeOrder() {
    const container = document.querySelector(HOME_SELECTOR);
    if (!container) return;

    let hub = container.querySelector(`#${HUB_ID}`);
    if (!hub) hub = createHub();

    if (container.firstElementChild !== hub) {
      container.prepend(hub);
    }

    const resumeItems = container.querySelector(RESUME_SELECTOR);
    const resumeSection = resumeItems?.closest(".verticalSection");
    if (resumeSection && resumeSection !== hub && hub.nextElementSibling !== resumeSection) {
      container.insertBefore(resumeSection, hub.nextElementSibling);
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

  ensureHomeOrder();

  const observer = new MutationObserver(scheduleHomeOrder);
  observer.observe(document.body, { childList: true, subtree: true });
})();
