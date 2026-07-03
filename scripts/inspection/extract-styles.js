/**
 * extract-styles.js — BROWSER PAYLOAD for the design-extractor agent.
 *
 * This runs in the *page* context via Playwright MCP, NOT in Node:
 *   browser_evaluate({ function: "(sel) => (" + <body of extractComputedStyles> + ")(sel)" })
 * The simplest reliable usage is to paste the arrow function below into
 * `browser_evaluate` and pass the target selector. It returns a JSON string:
 * a distilled DOM tree with only the computed styles that matter — so the
 * orchestrator receives a compact spec, never a raw HTML dump (token economy).
 *
 * Returns: JSON.stringify({ tag, classes, text, styles, image, childCount, children })
 */

export const extractComputedStyles = (selector = "body", maxDepth = 4) => {
  const root = document.querySelector(selector);
  if (!root) return JSON.stringify({ error: "Element not found: " + selector });

  // Only the properties that drive a pixel-perfect rebuild.
  const PROPS = [
    // typography
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "lineHeight",
    "letterSpacing",
    "color",
    "textAlign",
    "textTransform",
    "textDecorationLine",
    "whiteSpace",
    "textOverflow",
    "webkitLineClamp",
    // color / background
    "backgroundColor",
    "backgroundImage",
    "backgroundSize",
    "backgroundPosition",
    "backgroundRepeat",
    "opacity",
    "mixBlendMode",
    // box model
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "width",
    "height",
    "maxWidth",
    "minWidth",
    "maxHeight",
    "minHeight",
    // layout
    "display",
    "flexDirection",
    "flexWrap",
    "justifyContent",
    "alignItems",
    "gap",
    "gridTemplateColumns",
    "gridTemplateRows",
    "gridAutoFlow",
    // border / shape / shadow
    "borderTopWidth",
    "borderStyle",
    "borderColor",
    "borderRadius",
    "boxShadow",
    "outline",
    // position / stacking
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "zIndex",
    "overflow",
    // effects / motion
    "transform",
    "transformOrigin",
    "transition",
    "animation",
    "filter",
    "backdropFilter",
    "cursor",
    // media fit
    "objectFit",
    "objectPosition",
    "aspectRatio",
  ];

  // Defaults we drop to keep the payload small.
  const NOISE = new Set([
    "none",
    "normal",
    "auto",
    "0px",
    "rgba(0, 0, 0, 0)",
    "0s",
    "static",
    "visible",
    "0",
  ]);

  const stylesOf = (el) => {
    const cs = getComputedStyle(el);
    const out = {};
    for (const p of PROPS) {
      const v = cs[p];
      if (v != null && v !== "" && !NOISE.has(v)) out[p] = v;
    }
    return out;
  };

  const walk = (el, depth) => {
    const kids = [...el.children];
    const onlyText = el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE;
    const node = {
      tag: el.tagName.toLowerCase(),
      classes: (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).slice(0, 6).join(" "),
      text: onlyText ? el.textContent.trim().slice(0, 240) : null,
      styles: stylesOf(el),
      childCount: kids.length,
    };
    if (el.tagName === "IMG") {
      node.image = {
        src: el.currentSrc || el.src,
        alt: el.alt,
        w: el.naturalWidth,
        h: el.naturalHeight,
      };
    }
    if (el.tagName === "svg") node.svg = true;
    if (depth < maxDepth) {
      node.children = kids.slice(0, 24).map((c) => walk(c, depth + 1));
    }
    return node;
  };

  return JSON.stringify(walk(root, 0), null, 2);
};
