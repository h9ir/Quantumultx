/*
  12306 广告清理脚本（QuanX / Surge / Loon 兼容）
  功能：清理首页/轮播/弹窗广告字段，确保不开票功能不受影响
  使用场景：配合 rewrite 的 script-response-body 调用
*/

(function() {
  let body = $response.body;
  if (!body) {
    $done({});
    return;
  }

  let isJson = false;
  try {
    JSON.parse(body);
    isJson = true;
  } catch (e) {
    isJson = false;
  }

  if (!isJson) {
    // 非 JSON 响应则直接返回原始内容（避免误伤）
    $done({ body });
    return;
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch (e) {
    $done({ body });
    return;
  }

  // 递归删除可能的广告字段（保守策略：删除常见字段但不删可能用于功能的字段）
  function cleanAds(obj) {
    if (!obj || typeof obj !== 'object') return;
    // 字段名白名单/黑名单处理
    const adKeys = ['ads', 'ad', 'adList', 'advert', 'advertList', 'banner', 'banners', 'promotion', 'promotions', 'popAds', 'activity', 'relatedProducts', 'recommend', 'recommendList', 'productPromotion'];
    for (const k of Object.keys(obj)) {
      try {
        // 如果字段名明显属于广告，删除
        if (adKeys.includes(k.toLowerCase())) {
          delete obj[k];
          continue;
        }
        // 如果值是数组并且项显著是广告对象（通过存在特征字段判断），删除数组字段
        if (Array.isArray(obj[k]) && obj[k].length > 0) {
          const sample = obj[k][0];
          if (sample && typeof sample === 'object') {
            const sampleKeys = Object.keys(sample).map(x => x.toLowerCase());
            // 广告对象常见字段：img、jumpUrl、adId、targetUrl、ad_type
            const adIndicators = ['img', 'jumpurl', 'adid', 'targeturl', 'ad_type', 'material'];
            let score = 0;
            for (const ik of adIndicators) if (sampleKeys.includes(ik)) score++;
            if (score >= 1) {
              delete obj[k];
              continue;
            }
          }
        }
        // 继续递归
        if (typeof obj[k] === 'object') cleanAds(obj[k]);
      } catch (e) { /* ignore */ }
    }
  }

  try {
    cleanAds(data);
  } catch (e) { /* ignore */ }

  // 输出处理后的 JSON
  $done({ body: JSON.stringify(data) });
})();