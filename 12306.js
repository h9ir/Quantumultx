/*
  12306 极速跳过开屏广告补丁
  强制将开屏/活动页等待时间置为0，实现真正秒进首页
*/

(function() {
  if (!$response.body) { $done({}); return; }
  let body = $response.body;

  try {
    const obj = JSON.parse(body);

    // 自动归零可能的倒计时字段
    function zero(obj) {
      if (typeof obj !== "object") return;
      for (const k in obj) {
        // 常见广告等待字段名
        const waitKeys = ['showTime','displayTime','duration','countdown','waitTime','delay','adTime','adDuration'];
        if (waitKeys.includes(k.toLowerCase()) && typeof obj[k] === 'number') {
          obj[k] = 0; // 🔥强制跳过
        }
        if (typeof obj[k] === 'object') zero(obj[k]);
      }
    }

    zero(obj);

    $done({body: JSON.stringify(obj)});
  } catch(e) {
    $done({body});
  }
})();