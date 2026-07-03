/**
 * discover-assets.js — BROWSER PAYLOAD for the design-extractor agent.
 *
 * Runs in the page context via Playwright MCP (`browser_evaluate`). Enumerates
 * every asset + design signal on the page so the agent can (a) build a download
 * manifest for scripts/download-assets.mjs and (b) know which libraries/fonts to
 * reproduce. Returns a JSON string.
 */

export const discoverAssets = () => {
  const abs = (u) => {
    try {
      return new URL(u, location.href).href;
    } catch {
      return u;
    }
  };
  const bgUrl = (el) => {
    const m = /url\(["']?(.*?)["']?\)/.exec(getComputedStyle(el).backgroundImage || "");
    return m ? abs(m[1]) : null;
  };

  const images = [...document.querySelectorAll("img")].map((img) => ({
    src: abs(img.currentSrc || img.src),
    srcset: img.getAttribute("srcset") || null,
    alt: img.alt || null,
    w: img.naturalWidth,
    h: img.naturalHeight,
    loading: img.loading || null,
    parent: (img.parentElement?.getAttribute("class") || "").split(/\s+/)[0] || null,
  }));

  const videos = [...document.querySelectorAll("video")].map((v) => ({
    src: abs(v.currentSrc || v.src || v.querySelector("source")?.src || ""),
    poster: v.poster ? abs(v.poster) : null,
    autoplay: v.autoplay,
    loop: v.loop,
    muted: v.muted,
  }));

  const backgroundImages = [
    ...new Set([...document.querySelectorAll("*")].map(bgUrl).filter(Boolean)),
  ];

  const fonts = [
    ...new Set(
      [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,a,span,button,li,body")].map(
        (el) => getComputedStyle(el).fontFamily,
      ),
    ),
  ];

  const fontLinks = [
    ...document.querySelectorAll('link[href*="font"], link[rel="preload"][as="font"]'),
  ].map((l) => abs(l.href));

  const favicons = [
    ...document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]'),
  ].map((l) => ({
    href: abs(l.href),
    rel: l.rel,
    sizes: l.getAttribute("sizes") || null,
  }));

  const meta = {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || null,
    ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
    lang: document.documentElement.lang || null,
    themeColor: document.querySelector('meta[name="theme-color"]')?.content || null,
  };

  // Design-signal detection: which behavior libraries / techniques are in play.
  const html = document.documentElement.outerHTML;
  const signals = {
    lenis: !!document.querySelector(".lenis, [data-lenis]") || /lenis/i.test(html),
    locomotive: !!document.querySelector("[data-scroll], .has-scroll-smooth"),
    gsap: typeof window.gsap !== "undefined" || /gsap|ScrollTrigger/i.test(html),
    swiper: !!document.querySelector(".swiper"),
    scrollSnap: [...document.querySelectorAll("*")].some(
      (el) => (getComputedStyle(el).scrollSnapType || "none") !== "none",
    ),
    framerMotion: /framer|motion/i.test(html),
    lottie: !!document.querySelector("lottie-player, [data-lottie]") || /lottie/i.test(html),
    stickyEls: [...document.querySelectorAll("*")].filter(
      (el) => getComputedStyle(el).position === "sticky",
    ).length,
  };

  const svgCount = document.querySelectorAll("svg").length;

  return JSON.stringify(
    { meta, images, videos, backgroundImages, fonts, fontLinks, favicons, svgCount, signals },
    null,
    2,
  );
};
