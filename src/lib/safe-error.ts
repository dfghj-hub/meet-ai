const SAFE_PREFIXES = [
  "请",
  "文本长度超过",
  "仅支持",
  "文件大小超过",
  "图片 OCR 需要配置",
  "转写结果为空",
  "模型",
  "格式错误",
  "产品分析失败",
  "带货内容包生成失败",
  "文案生成失败",
  "文件任务流处理失败",
  "字幕生成失败",
  "复盘建议生成失败",
  "简历优化失败",
  "内容任务流生成失败",
  "生成纪要失败",
  "处理失败",
  "上传失败",
  "网络错误",
];

/**
 * Sanitizes error messages for client responses.
 * In production, only whitelisted messages are returned;
 * everything else becomes a generic fallback.
 */
export function safeErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  const msg = err.message;
  if (SAFE_PREFIXES.some((p) => msg.startsWith(p))) return msg;
  if (process.env.NODE_ENV === "development") return msg;
  return fallback;
}
