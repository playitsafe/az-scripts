// ==UserScript==
// @name         Click to copy
// @namespace    http://tampermonkey.net/
// @version      2025-10-18
// @description  Hold Command key to copy text on right click
// @author       Aaron
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=douyin.com
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  "use strict";

  let metaDown = false;

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.metaKey) metaDown = true;
    },
    true,
  );

  window.addEventListener(
    "keyup",
    (e) => {
      if (!e.metaKey) metaDown = false;
    },
    true,
  );

  window.addEventListener("blur", () => {
    metaDown = false;
  });

  function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function getNodeText(node) {
    if (!node) return "";

    if (node.nodeType === Node.TEXT_NODE) {
      return normalizeText(node.nodeValue || "");
    }

    if (!(node instanceof Element)) return "";

    if (
      node instanceof HTMLInputElement ||
      node instanceof HTMLTextAreaElement ||
      node instanceof HTMLSelectElement
    ) {
      const value = "value" in node ? node.value : "";
      return normalizeText(value);
    }

    const attrText =
      node.getAttribute("aria-label") ||
      node.getAttribute("title") ||
      node.getAttribute("alt") ||
      "";

    const text = node.innerText || node.textContent || attrText;
    return normalizeText(text);
  }

  function getNextParent(node) {
    if (!node) return null;
    if (node.parentNode) return node.parentNode;
    if (node instanceof ShadowRoot) return node.host;
    return null;
  }

  function getCopyTextFromTarget(target) {
    let current = target;

    // Walk up from the clicked node to find the closest meaningful text.
    while (current && current !== document) {
      const text = getNodeText(current);
      if (text) return text;
      current = getNextParent(current);
    }

    return "";
  }

  function getCopyTextFromEvent(e) {
    if (e && typeof e.composedPath === "function") {
      const path = e.composedPath();
      for (const node of path) {
        const text = getNodeText(node);
        if (text) return text;
      }
    }

    return getCopyTextFromTarget(e ? e.target : null);
  }

  function copyToClipboard(text) {
    if (typeof GM_setClipboard === "function") {
      GM_setClipboard(text);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch((err) => {
        console.error("clipboard API 失败:", err);
      });
    } else {
      console.warn("Failed to copy: API not available");
    }
  }

  let toastContainer = null;

  function ensureToastContainer() {
    if (toastContainer && toastContainer.isConnected) return toastContainer;

    toastContainer = document.createElement("div");
    toastContainer.style.position = "fixed";
    toastContainer.style.bottom = "20px";
    toastContainer.style.right = "20px";
    toastContainer.style.zIndex = "999999";

    const root = document.body || document.documentElement;
    if (!root) return null;
    root.appendChild(toastContainer);
    return toastContainer;
  }

  function showToast(message) {
    const container = ensureToastContainer();
    if (!container) return;

    const toast = document.createElement("div");
    toast.innerText = message;
    toast.style.background = "rgba(0,0,0,0.75)";
    toast.style.color = "#fff";
    toast.style.padding = "8px 12px";
    toast.style.marginTop = "8px";
    toast.style.borderRadius = "6px";
    toast.style.fontSize = "14px";
    toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    toast.style.opacity = "1";
    toast.style.transition = "opacity 0.5s ease";
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 1500);
  }

  document.addEventListener(
    "contextmenu",
    function (e) {
      //Only copy when Command key is on hold
      if (!(e.metaKey || metaDown)) return; // Command key -> metaKey

      const text = getCopyTextFromEvent(e);

      if (text) {
        copyToClipboard(text);
        showToast(
          "Copied: " + (text.length > 20 ? text.slice(0, 20) + "..." : text),
        );

        // reset meta flag in case keyup didn’t fire (macOS Safari/Chrome quirk)
        metaDown = false;
      }
    },
    true,
  );
})();
