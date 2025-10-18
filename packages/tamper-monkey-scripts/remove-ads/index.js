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

(function () {
  "use strict";
  // override `showAds` function
  window.showAd = () => {};

  // remove ad elements
  function removeAds() {
    const selectors = [
      "#ad_iframe",
      "#banner-dl-a",
      "#banner-dl-b",
      "#mys-wrapper",
      "#aswift_1_host",
      "#aswift_2_host",
      "#aswift_3_host",
      ".adsbygoogle",
      'div[class*="modal-body"]',
      'div[class*="banner3-square"]',
      ".call-to-action",
      "#vignette-modal",
      "video",
      "hr",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) el.remove();
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
})();
