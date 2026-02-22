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

  // Create toast container
  const toastContainer = document.createElement("div");
  toastContainer.style.position = "fixed";
  toastContainer.style.bottom = "20px";
  toastContainer.style.right = "20px";
  toastContainer.style.zIndex = "999999";
  document.body.appendChild(toastContainer);

  function showToast(message) {
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
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 1500);
  }

  document.addEventListener("contextmenu", function (e) {
    //Only copy when Command key is on hold
    if (!(e.metaKey || metaDown)) return; // Command key -> metaKey

    let target = e.target;
    let text = target.innerText || target.textContent || "";

    if (text.trim()) {
      copyToClipboard(text.trim());
      showToast(
        "Copied: " + (text.length > 20 ? text.slice(0, 20) + "..." : text),
      );

      // reset meta flag in case keyup didn’t fire (macOS Safari/Chrome quirk)
      metaDown = false;
    }
  });
})();
