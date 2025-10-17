;(async () => {
	const filename = "testTk.mp4"

	const videoUrl =
		"https://www.douyin.com/aweme/v1/play/?video_id=v1e00fgi0000d16d51vog65h09c33jqg&line=0&file_id=e47a30d3ad6b48b68a1b9f1320806010&sign=33e9d15463a91072570d71b0e7412aa8&is_play_url=1&source=PackSourceEnum_AWEME_DETAIL"

	// 发起 fetch 请求获取视频内容
	const response = await fetch(videoUrl)
	if (!response.ok) {
		throw new Error("下载失败，状态码: " + response.status)
	}

	const blob = await response.blob()

	// 创建 blob 对象的本地链接
	const blobUrl = URL.createObjectURL(blob)

	// 生成下载链接
	const a = document.createElement("a")
	a.href = blobUrl
	a.download = "video.mp4" // 可以自定义名字
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)

	// 释放 blob 对象
	URL.revokeObjectURL(blobUrl)
})()
