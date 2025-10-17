const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// 获取命令行参数
const sharingText = process.argv[2];

if (!sharingText) {
  console.log('使用方法: node downloader.js "<social-sharing-text>"');
  console.log(
    '示例: node downloader.js "9.99 VYM:/ 08/01 https://v.douyin.com/mHamhmCjxWs/ 复制此链接，打开Dou音搜索，直接观看视频！"'
  );
  process.exit(1);
}

// 下载文件函数
function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https:") ? https : http;

    // 设置请求选项，包含必要的头部信息
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "video/mp4,video/*,*/*",
        "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
        "Accept-Encoding": "identity",
        Connection: "keep-alive",
        Referer: "https://dlpanda.com/",
      },
    };

    const request = protocol.request(options, (response) => {
      // 处理重定向
      if (
        response.statusCode === 302 ||
        response.statusCode === 301 ||
        response.statusCode === 307 ||
        response.statusCode === 308
      ) {
        console.log(`重定向到: ${response.headers.location}`);
        return downloadFile(response.headers.location, filename)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(
          new Error(
            `下载失败: HTTP ${response.statusCode} - ${response.statusMessage}`
          )
        );
        return;
      }

      // 检查内容类型
      const contentType = response.headers["content-type"] || "";
      const contentLength = response.headers["content-length"];

      console.log(`Content-Type: ${contentType}`);
      if (contentLength) {
        console.log(
          `Content-Length: ${
            Math.round((parseInt(contentLength) / 1024 / 1024) * 100) / 100
          } MB`
        );
      }

      // 验证是否为视频内容
      if (
        !contentType.includes("video/") &&
        !contentType.includes("application/octet-stream") &&
        !url.includes(".mp4")
      ) {
        reject(
          new Error(`无效的内容类型: ${contentType}. 这可能不是视频文件。`)
        );
        return;
      }

      const fileStream = fs.createWriteStream(filename);
      let downloadedBytes = 0;
      const totalBytes = contentLength ? parseInt(contentLength) : 0;

      response.on("data", (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const progress = Math.round((downloadedBytes / totalBytes) * 100);
          process.stdout.write(
            `\r下载进度: ${progress}% (${
              Math.round((downloadedBytes / 1024 / 1024) * 100) / 100
            }MB)`
          );
        }
      });

      response.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close();
        console.log(
          `\n下载完成，文件大小: ${
            Math.round((downloadedBytes / 1024 / 1024) * 100) / 100
          }MB`
        );

        // 验证文件是否为有效的MP4
        if (downloadedBytes < 1024) {
          fs.unlinkSync(filename); // 删除无效文件
          reject(new Error("下载的文件太小，可能无效"));
          return;
        }

        // 检查MP4文件头
        const buffer = Buffer.alloc(12);
        const fd = fs.openSync(filename, "r");
        fs.readSync(fd, buffer, 0, 12, 0);
        fs.closeSync(fd);

        // MP4文件应该包含 'ftyp' 标识符在第4-8字节
        const ftypCheck = buffer.slice(4, 8).toString("ascii");
        if (
          !ftypCheck.includes("ftyp") &&
          !buffer.slice(0, 4).includes("\x00\x00\x00")
        ) {
          console.warn("警告: 文件可能不是有效的MP4格式，但仍将保存");
        }

        resolve(filename);
      });

      fileStream.on("error", (err) => {
        fs.unlink(filename, () => {}); // 删除部分下载的文件
        reject(err);
      });

      response.on("error", (err) => {
        fs.unlink(filename, () => {}); // 删除部分下载的文件
        reject(err);
      });
    });

    request.on("error", reject);
    request.setTimeout(60000, () => {
      request.abort();
      reject(new Error("下载超时"));
    });

    request.end();
  });
}

// 主函数
async function main() {
  console.log("启动浏览器...");

  const browser = await puppeteer.launch({
    headless: false, // 设置为false可以看到浏览器操作过程
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    console.log("访问 dlpanda.com...");
    await page.goto("https://dlpanda.com/zh-CN", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // 等待页面加载完成
    await new Promise((resolve) => setTimeout(resolve, 4000));

    console.log("查找输入框...");
    // 查找输入框 - 尝试多种可能的选择器
    const inputSelectors = [
      'input[type="text"]',
      'input[placeholder*="链接"]',
      'input[placeholder*="URL"]',
      "textarea",
      "#url",
      ".url-input",
      '[name="url"]',
    ];

    let inputElement = null;
    for (const selector of inputSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        inputElement = await page.$(selector);
        if (inputElement) {
          console.log(`找到输入框: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!inputElement) {
      throw new Error("未找到输入框");
    }

    console.log("输入分享链接...");
    await inputElement.click();
    await inputElement.focus();
    // 清空输入框并输入新内容
    // 检测操作系统以使用正确的修饰键
    const platform = process.platform;
    const modifierKey = platform === "darwin" ? "Meta" : "Control"; // Mac使用Cmd，Windows/Linux使用Ctrl

    await page.keyboard.down(modifierKey);
    await page.keyboard.press("a"); // 全选
    await page.keyboard.up(modifierKey);
    await page.keyboard.type(sharingText);

    console.log("查找并点击解析按钮...");
    // 查找解析/下载按钮
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      ".download-btn",
      ".parse-btn",
      ".submit-btn",
    ];

    let submitButton = null;
    for (const selector of buttonSelectors) {
      try {
        submitButton = await page.$(selector);
        if (submitButton) {
          console.log(`找到提交按钮: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // 如果没有找到特定按钮，尝试查找所有按钮并选择最合适的
    if (!submitButton) {
      const buttons = await page.$$("button");
      for (const button of buttons) {
        const buttonText = await page.evaluate(
          (el) => el.textContent.trim(),
          button
        );
        if (
          buttonText.includes("解析") ||
          buttonText.includes("下载") ||
          buttonText.includes("开始") ||
          buttonText.includes("提交")
        ) {
          submitButton = button;
          console.log(`找到按钮: ${buttonText}`);
          break;
        }
      }
    }

    if (!submitButton) {
      throw new Error("未找到提交按钮");
    }

    await submitButton.click();
    console.log("等待解析结果...");

    // 等待下载链接出现，增加等待时间并检查页面状态
    await new Promise((resolve) => setTimeout(resolve, 8000));
    
    // 检查页面是否仍然可用
    try {
      await page.evaluate(() => document.readyState);
    } catch (e) {
      console.log('页面状态检查失败，可能发生了导航:', e.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // 查找下载链接
    console.log("查找下载链接...");
    const downloadSelectors = [
      'a[href*=".mp4"]',
      "a[download]",
      ".download-link",
      ".video-download",
      'a[href*="download"]',
    ];

    let downloadLinks = [];

    // 获取所有可能的下载链接
    try {
      const allLinks = await page.$$("a");
      for (let i = 0; i < allLinks.length; i++) {
        const link = allLinks[i];
        try {
          // 检查链接元素是否仍然有效
          const isConnected = await page.evaluate(el => el.isConnected, link);
          if (!isConnected) continue;
          
          const href = await page.evaluate((el) => el.href, link);
          const text = await page.evaluate((el) => el.textContent.trim(), link);

          if (
            href &&
            (href.includes(".mp4") ||
              href.includes("download") ||
              text.includes("下载"))
          ) {
            downloadLinks.push({ href, text });
          }
        } catch (linkError) {
          console.log(`处理链接 ${i + 1} 时出错: ${linkError.message}`);
          continue;
        }
      }
    } catch (linksError) {
      console.log(`获取下载链接时出错: ${linksError.message}`);
    }

    if (downloadLinks.length === 0) {
      console.log("未找到直接下载链接，尝试查找特定的Douyin视频元素...");

      try {
        // 等待页面稳定，确保没有正在进行的导航
        await page.waitForLoadState ? await page.waitForLoadState('networkidle') : await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 查找特定的视频元素：width="100%" controls="controls" style="max-height: 380px;"
        const specificVideos = await page.$$(
          'video[width="100%"][controls="controls"][style*="max-height: 380px"]'
        );

        if (specificVideos.length > 0) {
          console.log(`找到 ${specificVideos.length} 个匹配的视频元素`);

          for (let i = 0; i < specificVideos.length; i++) {
            const video = specificVideos[i];
            try {
              // 检查元素是否仍然附加到DOM
              const isConnected = await page.evaluate(el => el.isConnected, video);
              if (!isConnected) {
                console.log(`视频元素 ${i + 1} 已从DOM中移除，跳过...`);
                continue;
              }

              // 首先尝试从video元素本身获取src
              const videoSrc = await page.evaluate(
                (el) => el.src || el.currentSrc,
                video
              );

              if (videoSrc && videoSrc.startsWith("http")) {
                downloadLinks.push({ href: videoSrc, text: "特定video元素" });
                console.log(`从video元素获取到URL: ${videoSrc}`);
              }

              // 查找video元素内的source标签
              const sources = await page.evaluate((videoEl) => {
                try {
                  const sourceElements = videoEl.querySelectorAll("source");
                  return Array.from(sourceElements).map((source) => ({
                    src: source.src,
                    type: source.type || "",
                  }));
                } catch (e) {
                  console.log('获取source元素时出错:', e.message);
                  return [];
                }
              }, video);

              if (sources.length > 0) {
                console.log(`找到 ${sources.length} 个source元素`);
                for (const source of sources) {
                  if (source.src) {
                    // 处理相对URL，转换为绝对URL
                    let fullUrl = source.src;
                    if (fullUrl.startsWith("//")) {
                      fullUrl = "https:" + fullUrl;
                    } else if (fullUrl.startsWith("/")) {
                      const currentUrl = await page.url();
                      fullUrl = new URL(fullUrl, currentUrl).href;
                    }

                    if (fullUrl.startsWith("http")) {
                      downloadLinks.push({
                        href: fullUrl,
                        text: `source元素 (${source.type || "video/mp4"})`,
                      });
                      console.log(`从source元素获取到URL: ${fullUrl}`);
                    }
                  }
                }
              }
            } catch (elementError) {
              console.log(`处理视频元素 ${i + 1} 时出错: ${elementError.message}`);
              // 如果是执行上下文被销毁的错误，尝试重新获取页面状态
              if (elementError.message.includes('Execution context was destroyed')) {
                console.log('检测到页面导航，等待页面稳定...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                break; // 跳出循环，避免继续处理可能已失效的元素
              }
              continue;
            }
          }
        }

        // 如果特定视频元素没找到，回退到查找所有视频元素
        if (downloadLinks.length === 0) {
          console.log("未找到特定视频元素，尝试查找所有视频元素...");
          try {
            const allVideos = await page.$$("video");
            if (allVideos.length > 0) {
              for (let i = 0; i < allVideos.length; i++) {
                const video = allVideos[i];
                try {
                  const isConnected = await page.evaluate(el => el.isConnected, video);
                  if (!isConnected) continue;
                  
                  const src = await page.evaluate(
                    (el) => el.src || el.currentSrc,
                    video
                  );
                  if (src && src.startsWith("http")) {
                    downloadLinks.push({ href: src, text: "普通video元素" });
                  }
                } catch (videoError) {
                  console.log(`处理普通视频元素 ${i + 1} 时出错: ${videoError.message}`);
                  continue;
                }
              }
            }
          } catch (fallbackError) {
            console.log(`查找所有视频元素时出错: ${fallbackError.message}`);
          }
        }
      } catch (contextError) {
        console.log(`视频元素查找过程中出错: ${contextError.message}`);
        if (contextError.message.includes('Execution context was destroyed')) {
          console.log('页面可能已导航，尝试重新刷新页面状态...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    if (downloadLinks.length === 0) {
      throw new Error("未找到下载链接");
    }

    console.log(`找到 ${downloadLinks.length} 个下载链接:`);
    downloadLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link.text}: ${link.href}`);
    });

    // 下载第一个视频
    const downloadUrl = downloadLinks[0].href;
    console.log(`开始下载: ${downloadUrl}`);

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `video_${timestamp}.mp4`;
    const downloadsPath = path.join(require("os").homedir(), "Downloads");
    const filepath = path.join(downloadsPath, filename);

    await downloadFile(downloadUrl, filepath);
    console.log(`视频已下载到: ${filepath}`);
  } catch (error) {
    console.error("错误:", error.message);
  } finally {
    await browser.close();
  }
}

// 运行脚本
main().catch(console.error);
