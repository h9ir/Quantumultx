// 途虎养车去广告脚本
let body = $response.body;

try {
    // 处理JSON响应
    if (typeof body === 'string') {
        let obj = JSON.parse(body);
        
        // 处理首页广告
        if (obj.data && obj.data.banners) {
            obj.data.banners = obj.data.banners.filter(item => 
                !item.position || !item.position.includes('ad')
            );
        }
        
        // 处理弹窗广告
        if (obj.data && obj.data.popups) {
            obj.data.popups = [];
        }
        
        // 处理启动页广告
        if (obj.data && obj.data.splash) {
            obj.data.splash = null;
        }
        
        // 移除广告数据
        if (obj.data && obj.data.adList) {
            obj.data.adList = [];
        }
        
        // 处理配置中的广告开关
        if (obj.data && obj.data.config) {
            delete obj.data.config.ad_switch;
            delete obj.data.config.popup_switch;
        }
        
        body = JSON.stringify(obj);
    }
} catch (error) {
    console.log('途虎广告清理错误: ' + error);
}

$done({body});
