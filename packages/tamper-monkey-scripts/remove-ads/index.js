// ==UserScript==
// @name         Remove Ad
// @namespace    http://tampermonkey.net/
// @version      2025-10-18
// @description  Override `showAd` to () => {}
// @author       Aaron
// @match        https://dlpanda.com/*
// @match        https://*.dlpanda.com/*
// @match        https://ssstwitter.com/*
// @match        https://*.ssstwitter.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(async function () {
  "use strict";

  const isTwitter = location.hostname.includes("ssstwitter.com");
  const isDlpanda = location.hostname.includes("dlpanda.com");
  const isXiaohongshu = location.pathname === "/xiaohongshu";
  // override `showAds` function
  window.showAd = () => {};

  // remove ad elements
  function removeAds() {
    const selectors = [
      "#ad_iframe",
      "#banner-dl-a",
      "#banner-dl-b",
      "#mys-wrapper",
      // "#aswift_1_host",
      // "#aswift_2_host",
      // "#aswift_3_host",
      ".adsbygoogle",
      'div[class*="modal-body"]',
      'div[class*="banner3-square"]',
      ".call-to-action",
      "#vignette-modal",
      // "video",
      "hr",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) el.remove();
    }
  }

  // download img with blob
  async function forceDownloadImage(url, fileName) {
    try {
      const res = await fetch(url, { credentials: "omit" });
      const blob = await res.blob();

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${fileName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(blobUrl);
      console.log("PNG downloaded via blob:", url);
    } catch (err) {
      console.error("PNG blob download failed:", err);
    }
  }

  // initial call
  removeAds();

  // listen to DOM，delete ads once they are injected later
  const observer = new MutationObserver(() => removeAds());
  observer.observe(document.body, { childList: true, subtree: true });

  // contstantly override showAds function
  setInterval(() => {
    window.showAd = () => {};
  }, 2000);

  // Auto paste function
  async function pasteClipboardToInput(inputId) {
    const input = document.querySelector(`#${inputId}`);
    if (!input) return;

    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        input.value = text.trim();
        input.dispatchEvent(new Event("input", { bubbles: true }));
        console.log("Auto-pasted clipboard text into #url:", text);
      }
    } catch (err) {
      console.warn("Clipboard read failed:", err);
    }
  }

  let inputId = null;

  // For TikTok and XHS downloader
  if (isDlpanda) {
    inputId = "url";
  }

  // For X downloader
  if (isTwitter) {
    inputId = "main_page_text";
  }

  if (inputId) {
    // Try immediately and again after a short delay (in case input loads late)
    // pasteClipboardToInput(inputId);
    // Try when the document gets focus
    window.addEventListener("focus", () => pasteClipboardToInput(inputId), {
      once: true,
    });

    // Also try after the first user click
    document.addEventListener(
      "click",
      () => {
        pasteClipboardToInput(inputId);
      },
      { once: true }
    );
  }

  // Fix ssstwitter.com links
  if (isTwitter) {
    function fixDirectLinks() {
      document.querySelectorAll(".result-container").forEach((container) => {
        const firstLink = container.querySelector("a");
        if (
          firstLink &&
          firstLink.dataset.directurl &&
          !firstLink.dataset.fixed
        ) {
          const directUrl = firstLink.dataset.directurl;
          firstLink.href = directUrl;
          firstLink.removeAttribute("data-directurl");
          firstLink.dataset.fixed = "true";
          console.log(">>>Fixed direct URL:", directUrl);
          window.open(directUrl, "_blank");
        }
      });
    }

    // Run immediately and watch for future updates
    fixDirectLinks();
    const linkObserver = new MutationObserver(fixDirectLinks);
    linkObserver.observe(document.body, { childList: true, subtree: true });
  }

  // For Xiaohongshu downloader
  if (isXiaohongshu) {
    function getNoteTitle() {
      return document
        .querySelector('a[href*="https://www.xiaohongshu.com/discovery"] h5')
        ?.textContent.trim();
    }
    function getAuthor() {
      return document
        .querySelector('a[href*="https://www.xiaohongshu.com/user/profile"] h5')
        ?.textContent.trim();
    }

    let imgCount = 0;
    document.querySelectorAll("button").forEach((btn) => {
      if (btn.innerText.includes("PNG [")) {
        const match = btn
          .getAttribute("onclick")
          .match(/downloadFileHref\('([^']+)'/);
        if (!match || !match[1]) return;
        const imgUrl = match[1];
        const fileName = `${getNoteTitle()}-xhs@${getAuthor()}-${++imgCount}`;
        forceDownloadImage(imgUrl, fileName);
      }
    });
  }

  async function wait() {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
})();
