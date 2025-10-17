import https from "https";
import notifier from "node-notifier";
import zlib from "zlib";
// import path from path;
//
const argInterval = parseInt(process.argv[2], 10);
const intervalMs = isNaN(argInterval) ? 120000 : argInterval * 1000;
console.log(`使用间隔时间: ${intervalMs / 1000} 秒`);

// 随机延迟函数 - 在指定范围内产生随机延迟 (毫秒)
function randomDelay(min, max) {
  return new Promise((resolve) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`等待 ${delay}ms 后重试...`);
    setTimeout(resolve, delay);
  });
}

// 用户代理列表
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// 获取汇率函数，带重试
async function getAudRate(retryCount = 0, maxRetries = 3) {
  const options = {
    hostname: "www.boc.cn",
    path: "/sourcedb/whpj/",
    method: "GET",
    headers: {
      "User-Agent": getRandomUserAgent(),
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Cache-Control": "max-age=0",
      "Sec-Ch-Ua":
        '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
    rejectUnauthorized: false,
    timeout: 10000,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode >= 400) {
        const error = new Error(`HTTP 错误: ${res.statusCode}`);
        error.statusCode = res.statusCode;
        return reject(error);
      }

      let data = "";
      const encoding = res.headers["content-encoding"];
      if (encoding && encoding.includes("gzip")) {
        res
          .pipe(zlib.createGunzip())
          .on("data", (chunk) => {
            data += chunk;
          })
          .on("end", () => processData(data));
      } else {
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => processData(data));
      }

      function processData(data) {
        try {
          if (data.length === 0) {
            return reject(new Error("接收到空响应"));
          }

          const rows = data.split("<tr");
          let rateValue = null;
          for (const row of rows) {
            if (row.includes("澳大利亚元")) {
              const cells = row.split("<td");
              if (cells.length > 3) {
                const rateCell = cells[3];
                const rate = rateCell.split(">")[1].split("<")[0].trim();
                rateValue = rate;
                break;
              }
            }
          }

          if (!rateValue) {
            console.log("未找到澳大利亚元汇率");
          }

          resolve(+rateValue);
        } catch (error) {
          reject(error);
        }
      }
    });

    req.setTimeout(options.timeout, () => {
      req.destroy();
      reject(new Error("请求超时"));
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

// 自动重试包装函数
async function fetchWithRetry() {
  let lastError = null;

  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      if (attempt > 0) {
        await randomDelay(2000, 5000);
      }

      const rate = await getAudRate(attempt, 3);
      if (rate) {
        return rate;
      }
    } catch (error) {
      lastError = error;
      const isRetryable =
        error.statusCode === 503 ||
        error.message.includes("timeout") ||
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT";

      console.error(`尝试 ${attempt + 1} 失败:`, error.message);

      if (attempt === 3 || !isRetryable) {
        break;
      }
    }
  }

  throw lastError || new Error("获取汇率失败");
}

// 时间格式化函数
function getFormattedDate() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return `${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 循环执行函数
async function startPolling(intervalMs = 10000) {
  while (true) {
    try {
      const rate = await fetchWithRetry();
      console.log(
        `[${getFormattedDate()}] %c${rate}%c`,
        "font-weight: bold",
        "font-weight: normal"
      );
      if (rate >= 470) {
        notifier.notify({
          title: "汇率提醒",
          message: `澳元现汇买入价高于 4.7`,
          sound: true,
        });
      }
    } catch (error) {
      console.error(`[${getFormattedDate()}] 获取汇率失败:`, error.message);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

// 启动轮询
startPolling(intervalMs);
