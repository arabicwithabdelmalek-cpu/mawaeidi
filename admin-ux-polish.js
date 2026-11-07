/* Mawaeidi admin UX helpers — presentation only, no account data changes.
   Keeps section navigation readable and makes both searches easy to clear. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const dashboard = $("dashboard");
  const nav = document.querySelector(".admin-section-links");
  const back = $("adminBackToTop");
  if (!dashboard || !nav || !back) return;

  const sections = [
    {id:"overview", element:$("overview")},
    {id:"usersSection", element:$("usersSection")},
    {id:"accountsSection", element:$("accountsSection")}
  ].filter(entry => !!entry.element);

  const links = new Map(
    Array.from(nav.querySelectorAll('a[href^="#"]')).map(link => [
      link.getAttribute("href").slice(1),link
    ])
  );
  function setCurrent(id) {
    for (const [key,link] of links) {
      if (key === id) link.setAttribute("aria-current","location");
      else link.removeAttribute("aria-current");
    }
  }
  function updatePosition() {
    if (dashboard.hidden) {
      back.hidden = true;
      return;
    }
    const threshold = Math.min(window.innerHeight * .32,230);
    let visible = sections[0]?.id || "overview";
    for (const section of sections) {
      if (section.element.getBoundingClientRect().top <= threshold)
        visible = section.id;
    }
    setCurrent(visible);
    back.hidden = window.scrollY < 600;
  }
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      updatePosition();
    });
  }

  nav.addEventListener("click",event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || !nav.contains(link)) return;
    const id = link.getAttribute("href").slice(1);
    if (links.has(id)) setCurrent(id);
  });
  back.addEventListener("click",() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({top:0,behavior:reduce?"auto":"smooth"});
    setCurrent("overview");
  });

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
  window.addEventListener("hashchange",schedule);
  if ("MutationObserver" in window) {
    const watcher = new MutationObserver(schedule);
    watcher.observe(dashboard,{attributes:true,attributeFilter:["hidden"]});
  }
  schedule();
})();
