/*
  12306 强化版：广告清理 + 倒计时归零（兼容字符串、压缩响应、容错）
  适配：QuantumultX / Surge / Loon (script-response-body)
*/
(function () {
  if (typeof $response === "undefined" || !$response || !$response.body) {
    $done({});
    return;
  }

  let body = $response.body;
  // 确保 body 是字符串
  if (typeof body !== 'string') body = String(body);

  // 尝试解析 JSON；若不是 JSON 则直接返回原文（保守策略）
  let data;
  try {
    data = JSON.parse(body);
  } catch (e) {
    // 一些接口可能在body里包含前缀或后缀，尝试提取首个{...}块
    try {
      const match = body.match(/\{[\s\S]*\}/);
      if (match) data = JSON.parse(match[0]);
      else { $done({body}); return; }
    } catch (ee) {
      $done({body}); return;
    }
  }

  // 保守删除常见广告字段并把等待字段归零
  const adKeys = ['ads','ad','adlist','advert','advertlist','banner','banners','promotion','promotions','popads','activity','relatedproducts','recommend','recommendlist','productpromotion','promotioninfo'];
  const waitKeys = ['showtime','displaytime','duration','countdown','waittime','delay','adtime','adduration','time','seconds'];

  function isAdObject(o) {
    if (!o || typeof o !== 'object') return false;
    const keys = Object.keys(o).map(k => k.toLowerCase());
    const adIndicators = ['img','jumpurl','adid','targeturl','ad_type','material','clickUrl','link'];
    let score = 0;
    for (const ind of adIndicators) if (keys.includes(ind.toLowerCase())) score++;
    return score >= 1;
  }

  function normalizeNumber(val) {
    if (typeof val === 'number') return val;
    if (typeof val === 'string' && /^\d+(\.\d+)?$/.test(val)) return Number(val);
    return null;
  }

  function traverse(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const k of Object.keys(obj)) {
      try {
        const lk = k.toLowerCase();
        // 删除明显的广告字段（保守策略）
        if (adKeys.includes(lk)) {
          delete obj[k];
          continue;
        }
        // 如果字段是数组且疑似广告数组，删除
        if (Array.isArray(obj[k]) && obj[k].length > 0) {
          if (isAdObject(obj[k][0])) { delete obj[k]; continue; }
        }
        // 将可能的等待字段归零（支持字符串或数字）
        if (waitKeys.includes(lk)) {
          const normalized = normalizeNumber(obj[k]);
          if (normalized !== null) obj[k] = 0;
          else if (typeof obj[k] === 'string') {
            // 若为格式 "3s" 或 "3 秒"，取出数字再置零
            const m = obj[k].match(/(\d+)/);
            if (m) obj[k] = obj[k].replace(m[1], '0');
            else obj[k] = 0;
          } else obj[k] = 0;
        }
        // 递归
        if (typeof obj[k] === 'object') traverse(obj[k]);
      } catch (err) { /* 忽略单字段错误继续处理 */ }
    }
  }

  try {
    traverse(data);
  } catch (err) { /* 安全兜底 */ }

  $done({ body: JSON.stringify(data) });
})();