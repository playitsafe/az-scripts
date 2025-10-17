# 视频下载器

这是一个自动化工具，可以通过dlpanda.com网站下载社交媒体视频。

## 安装

1. 确保你已经安装了Node.js
2. 安装依赖：
```bash
npm install puppeteer
```

## 使用方法

```bash
node downloader.js "<social-sharing-text>"
```

### 示例

```bash
node downloader.js "9.99 VYM:/ 08/01 https://v.douyin.com/mHamhmCjxWs/ 复制此链接，打开Dou音搜索，直接观看视频！"
```

## 工作原理

1. 使用Puppeteer启动浏览器
2. 访问dlpanda.com网站
3. 在输入框中粘贴分享链接
4. 点击解析按钮
5. 等待解析完成
6. 查找并下载视频文件

## 注意事项

- 脚本会在当前目录下载视频文件
- 文件名格式为：`video_<timestamp>.mp4`
- 需要稳定的网络连接
- 下载的视频仅供个人使用，请遵守相关法律法规

## 故障排除

如果遇到问题：
1. 检查网络连接
2. 确保分享链接有效
3. 检查dlpanda.com网站是否正常运行
4. 确保Puppeteer版本兼容（建议使用v21+）

