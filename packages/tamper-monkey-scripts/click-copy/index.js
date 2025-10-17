// ==UserScript==
// @name         右键复制
// @namespace    http://tampermonkey.net/
// @version      2025-09-02
// @description  try to take over the world!
// @author       You
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=douyin.com
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  "use strict";

  function copyToClipboard(text) {
    if (typeof GM_setClipboard === "function") {
      GM_setClipboard(text);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch((err) => {
        console.error("clipboard API 失败:", err);
      });
    } else {
      console.warn("无法复制: 没有可用的 API");
    }
  }

  // 创建 toast 容器
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
    let target = e.target;
    let text = target.innerText || target.textContent || "";

    if (text.trim()) {
      copyToClipboard(text.trim());
      console.log("已复制元素文字:", text);
      showToast(
        "已复制: " + (text.length > 20 ? text.slice(0, 20) + "..." : text)
      );
    }
  });
})();
