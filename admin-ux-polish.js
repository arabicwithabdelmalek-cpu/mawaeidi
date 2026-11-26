/* Mawaeidi admin UX helpers — presentation only, no account data changes.
   Keeps section navigation readable and makes both searches easy to clear. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const dashboard = $("dashboard");
  const nav = document.querySelector(".admin-section-links");
  const back = $("adminBackToTop");
  if (!dashboard || !nav || !back) return;

  const sections = Array.from(dashboard.querySelectorAll("[data-admin-view]"));
  const links = new Map(Array.from(nav.querySelectorAll('a[href^="#"]')).map(link => [link.hash.slice(1),link]));
  const period = document.querySelector(".admin-global-period");
  const valid = id => links.has(id) && sections.some(section => section.id === id);
  let active = "";
  function showSection(id, scroll = false) {
    if (!valid(id)) id = "overview";
    const changed = active !== id;
    active = id;
    for (const section of sections) section.hidden = section.id !== id;
    for (const [key,link] of links) {
      if (key === id) link.setAttribute("aria-current","location");
      else link.removeAttribute("aria-current");
    }
    if (period) period.hidden = id === "accountsSection";
    if (scroll && changed) window.scrollTo({top:0,behavior:"auto"});
    updatePosition();
  }
  function fromHash() {showSection(location.hash.slice(1),true)}
  function updatePosition() {back.hidden = dashboard.hidden || window.scrollY < 600}
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {queued=false;updatePosition()});
  }
  nav.addEventListener("click",event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || !nav.contains(link) || !valid(link.hash.slice(1)) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const id = link.hash.slice(1);
    if (location.hash !== link.hash) history.pushState(null,"",link.hash);
    showSection(id,true);
  });
  back.addEventListener("click",() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({top:0,behavior:reduce?"auto":"smooth"});
  });
  showSection(location.hash.slice(1));
  // Dispatch the native input event so existing search/filter behavior stays
  // exactly as before; we only provide the clear control.
  const searchPairs = [
    [$("userSearch"),$("clearUserSearch")],
    [$("accountSearch"),$("clearAccountSearch")]
  ];
  for (const [input,clearButton] of searchPairs) {
    if (!input || !clearButton) continue;
    function updateClear() {
      clearButton.hidden = !input.value;
    }
    input.addEventListener("input",updateClear);
    input.addEventListener("search",updateClear);
    clearButton.addEventListener("click",() => {
      input.value = "";
      input.dispatchEvent(new Event("input",{bubbles:true}));
      input.focus({preventScroll:true});
    });
    updateClear();
  }

  const wrap = document.querySelector("#usersSection .table-wrap");
  const tableHint = $("usersTableHint");
  if (wrap && tableHint) {
    function updateTableHint() {
      tableHint.hidden = dashboard.hidden || wrap.offsetWidth === 0 ||
        wrap.scrollWidth <= wrap.clientWidth + 3;
    }
    window.addEventListener("resize",updateTableHint,{passive:true});
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(updateTableHint);
      observer.observe(wrap);
      const table = wrap.querySelector("table");
      if (table) observer.observe(table);
    }
    updateTableHint();
  }

  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",schedule,{passive:true});
  window.addEventListener("hashchange",fromHash);
  window.addEventListener("popstate",fromHash);
  if ("MutationObserver" in window) {
    const watcher = new MutationObserver(schedule);
    watcher.observe(dashboard,{attributes:true,attributeFilter:["hidden"]});
  }
  schedule();
})();
