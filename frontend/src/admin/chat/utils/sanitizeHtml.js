const ALLOWED_TAGS = new Set([
  "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "A",
  "BLOCKQUOTE", "CODE", "BR", "DIV", "SPAN", "UL", "LI", "P",
]);
const ALLOWED_ATTRS = {
  A: ["href", "target", "rel"],
  SPAN: ["class"],
};

// Strips anything not on the allow-list above (tags AND attributes),
// unwrapping disallowed elements instead of dropping their text content.
// Used any time composer-authored HTML gets rendered with
// dangerouslySetInnerHTML, so a message can only ever contain the tags
// the formatting toolbar itself produces.
export default function sanitizeHtml(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");

  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!ALLOWED_TAGS.has(child.tagName)) {
          while (child.firstChild) child.parentNode.insertBefore(child.firstChild, child);
          child.parentNode.removeChild(child);
          return;
        }
        const allowedAttrs = ALLOWED_ATTRS[child.tagName] || [];
        [...child.attributes].forEach((attr) => {
          if (!allowedAttrs.includes(attr.name)) child.removeAttribute(attr.name);
        });
        if (child.tagName === "A") {
          const href = child.getAttribute("href") || "";
          if (!/^https?:\/\//i.test(href)) child.removeAttribute("href");
          child.setAttribute("target", "_blank");
          child.setAttribute("rel", "noreferrer");
        }
        walk(child);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.parentNode.removeChild(child);
      }
    });
  };

  walk(doc.body);
  return doc.body.innerHTML;
}