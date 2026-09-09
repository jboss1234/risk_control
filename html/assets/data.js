/* ============ 风控系统静态演示 · 模拟数据 ============ */
const NOW = 1788401708000; // 与演示日志时间一致（北京 2026-09-03 左右）

const DEMO = {
  nodes: [
    { id: 1, nodeNo: 'TRANSACTION_PHONE_SDK', nodeName: '交易-手机SDK', status: 1 },
    { id: 2, nodeNo: 'LOGIN_WEB', nodeName: '登录-WEB', status: 1 },
    { id: 3, nodeNo: 'LOGIN_API', nodeName: '登录-开放接口', status: 1 },
    { id: 4, nodeNo: 'PAY_ANDROID_SDK', nodeName: '支付-安卓SDK', status: 1 },
    { id: 5, nodeNo: 'RECHARGE_ADMIN', nodeName: '充值-管理后台', status: 1 },
    { id: 6, nodeNo: 'REGISTER_IOS_SDK', nodeName: '注册-iOS SDK', status: 0 },
  ],

  scenes: [
    { id: 480, name: '手机端交易风控', nodeId: 1, nodeName: '交易-手机SDK', status: 1, strategyCount: 2 },
    { id: 490, name: '登录风控', nodeId: 2, nodeName: '登录-WEB', status: 1, strategyCount: 2 },
    { id: 500, name: '开放接口交易风控', nodeId: 3, nodeName: '登录-开放接口', status: 1, strategyCount: 1 },
    { id: 510, name: '安卓支付风控', nodeId: 4, nodeName: '支付-安卓SDK', status: 1, strategyCount: 1 },
    { id: 520, name: '后台充值风控', nodeId: 5, nodeName: '充值-管理后台', status: 0, strategyCount: 1 },
  ],

  strategies: [
    { id: 231, name: '交易金额策略', sceneId: 480, nodeId: 1, status: 1, updateTime: '2026-09-02 14:30:21' },
    { id: 232, name: '支付频次策略', sceneId: 480, nodeId: 1, status: 1, updateTime: '2026-09-01 09:12:03' },
    { id: 240, name: '登录设备策略', sceneId: 490, nodeId: 2, status: 1, updateTime: '2026-08-28 18:45:09' },
    { id: 241, name: '异常IP登录策略', sceneId: 490, nodeId: 2, status: 1, updateTime: '2026-09-02 11:20:44' },
    { id: 250, name: '开放接口频控策略', sceneId: 500, nodeId: 3, status: 0, updateTime: '2026-07-30 16:00:12' },
  ],

  rules: [
    { id: 503, name: '1天支付金额大于50000', nodeId: 1, strategyName: '交易金额策略', status: 1, circuitState: 'closed', updateTime: '2026-09-02 14:30:21' },
    { id: 505, name: '1小时支付笔数大于30', nodeId: 1, strategyName: '支付频次策略', status: 1, circuitState: 'open', updateTime: '2026-09-01 09:12:03' },
    { id: 521, name: '设备黑名单命中', nodeId: 2, strategyName: '登录设备策略', status: 1, circuitState: 'closed', updateTime: '2026-08-28 18:45:09' },
    { id: 522, name: '3小时异常IP登录次数大于5', nodeId: 2, strategyName: '异常IP登录策略', status: 1, circuitState: 'half', updateTime: '2026-09-02 11:20:44' },
    { id: 531, name: '开放接口QPS限流', nodeId: 3, strategyName: '开放接口频控策略', status: 0, circuitState: 'closed', updateTime: '2026-07-30 16:00:12' },
  ],

  ruleStats: [
    { ruleId: '503', ruleName: '1天支付金额大于50000', hitCount: 142 },
    { ruleId: '521', ruleName: '设备黑名单命中', hitCount: 98 },
    { ruleId: '505', ruleName: '1小时支付笔数大于30', hitCount: 76 },
    { ruleId: '522', ruleName: '3小时异常IP登录次数大于5', hitCount: 31 },
    { ruleId: '531', ruleName: '开放接口QPS限流', hitCount: 12 },
  ],

  // 指标名 -> 中文名（abstraction 映射）
  metricNames: {
    'tran_1h_amount': '1小时交易金额',
    'count_buyerid_24h_uid': '24小时购买次数(按用户)',
    'uid_240_24h_distinct_count_pay_orderid': '24小时去重支付单数(按用户)',
    'order_cnt_12h_by_uid': '12小时下单笔数(按用户)',
    'uid_240_1h_distinct_count_pay_orderid': '1小时去重支付单数(按用户)',
    'uid_240_24h_distinct_count_ip': '24小时去重IP数(按用户)',
    'openid_282_1h_count_openid': '1小时事件数(按openid)',
    'device_black_hit': '设备黑名单命中',
    'ip_black_hit': 'IP黑名单命中',
  },

  // 审计/风险列表（risk_decision_log）
  audits: [
    {
      reqId: '4cf082ba-a73d-11f1-866d-0ffb4f7ff8de', type: 2, accountId: '138****001', decisionCode: 'REJECT',
      score: 86, hits: '1天支付金额大于50000', sceneName: '手机端交易风控', deviceId: '123****131', ip: '171.109.*.*',
      ipLocation: '中国 广西壮族自治区 南宁市 (中国电信)', createTime: '2026-09-03 10:15:22',
      fields: { amount: '12999.00', account_id: '138****001', product_name: '1288元礼包', channel_id: '1', game_id: '5290', openid: '123131', order_id: '177****301', ip: '171.109.*.*' },
      metrics: { count_buyerid_24h_uid: 4, order_cnt_12h_by_uid: 28, uid_240_1h_distinct_count_pay_orderid: 19, uid_240_24h_distinct_count_pay_orderid: 4, uid_240_24h_distinct_count_ip: 3 },
      level: 'reject',
    },
    {
      reqId: 'b9a2f0d1-3e55-4f21-ba0c-8d9f1e2a77c1', type: 2, accountId: '188****672', decisionCode: 'REVIEW',
      score: 62, hits: '1小时支付笔数大于30', sceneName: '手机端交易风控', deviceId: '86f2****aa91', ip: '120.229.*.*',
      ipLocation: '中国 广东省 广州市', createTime: '2026-09-03 10:12:47',
      fields: { amount: '648.00', account_id: '188****672', product_name: '648元礼包', channel_id: '2', game_id: '5290', order_id: '166****890', ip: '120.229.*.*' },
      metrics: { count_buyerid_24h_uid: 7, order_cnt_12h_by_uid: 35, uid_240_1h_distinct_count_pay_orderid: 22, uid_240_24h_distinct_count_pay_orderid: 9, uid_240_24h_distinct_count_ip: 5 },
      level: 'review',
    },
    {
      reqId: '7c1e8a90-1d2b-4c3f-9e4d-5a6f7b8c9d0e', type: 2, accountId: '139****508', decisionCode: 'REJECT',
      score: 91, hits: '设备黑名单命中', sceneName: '登录风控', deviceId: '9ab1****c88d', ip: '223.104.*.*',
      ipLocation: '中国 广东省 深圳市', createTime: '2026-09-03 09:58:03',
      fields: { account_id: '139****508', device_id: '9ab1****c88d', event_time: '1788401708000', ip: '223.104.*.*', openid: '908732', game_id: '5290' },
      metrics: { device_black_hit: 1 },
      level: 'reject',
    },
    {
      reqId: 'e5d4c3b2-a109-8765-4321-0fedcba98765', type: 1, accountId: '152****330', decisionCode: 'PASS',
      score: 12, hits: '-', sceneName: '手机端交易风控', deviceId: 'd31f****2210', ip: '110.86.*.*',
      ipLocation: '中国 福建省 厦门市', createTime: '2026-09-03 09:41:18',
      fields: { amount: '30.00', account_id: '152****330', product_name: '30元礼包', channel_id: '1', game_id: '5290', order_id: '155****012', ip: '110.86.*.*' },
      metrics: { tran_1h_amount: 60, count_buyerid_24h_uid: 2, order_cnt_12h_by_uid: 6 },
      level: 'pass',
    },
    {
      reqId: 'a1b2c3d4-5e6f-7890-abcd-ef1234567890', type: 2, accountId: '186****245', decisionCode: 'REVIEW',
      score: 58, hits: '3小时异常IP登录次数大于5', sceneName: '登录风控', deviceId: '77ab****12cd', ip: '61.140.*.*',
      ipLocation: '中国 广东省 广州市', createTime: '2026-09-03 09:20:55',
      fields: { account_id: '186****245', device_id: '77ab****12cd', ip: '61.140.*.*', openid: '552019', game_id: '5290' },
      metrics: { uid_240_24h_distinct_count_ip: 6 },
      level: 'review',
    },
  ],

  // 请求明细（event_log，含 extInfoFields）
  eventLogs: [
    {
      reqId: '4cf082ba-a73d-11f1-866d-0ffb4f7ff8de', nodeNo: 'TRANSACTION_PHONE_SDK', accountId: '138****001', gameId: '5290',
      deviceId: '123****131', ip: '171.109.*.*', ipLocation: '中国 广西壮族自治区 南宁市 中国电信', score: 86,
      eventTime: '2026-09-03 10:15:22', createTime: '2026-09-03 10:15:22', masked: { accountId: true, deviceId: true, ip: true },
      ext: [
        { fieldName: 'amount', label: '交易金额', displayValue: '12999.00', masked: false },
        { fieldName: 'account_id', label: '账号', displayValue: '138****001', masked: true },
        { fieldName: 'device_id', label: '设备ID', displayValue: '123****131', masked: true },
        { fieldName: 'openid', label: '手游账号id', displayValue: '123131', masked: false },
        { fieldName: 'product_name', label: '产品名称', displayValue: '1288元礼包', masked: false },
        { fieldName: 'order_id', label: '订单号', displayValue: '177****301', masked: true },
        { fieldName: 'channel_id', label: '渠道 ID', displayValue: '1', masked: false },
        { fieldName: 'ip', label: 'IP 地址', displayValue: '171.109.*.*', masked: true },
      ],
    },
    {
      reqId: 'b9a2f0d1-3e55-4f21-ba0c-8d9f1e2a77c1', nodeNo: 'TRANSACTION_PHONE_SDK', accountId: '188****672', gameId: '5290',
      deviceId: '86f2****aa91', ip: '120.229.*.*', ipLocation: '中国 广东省 广州市', score: 62,
      eventTime: '2026-09-03 10:12:47', createTime: '2026-09-03 10:12:47', masked: { accountId: true, ip: true },
      ext: [
        { fieldName: 'amount', label: '交易金额', displayValue: '648.00', masked: false },
        { fieldName: 'account_id', label: '账号', displayValue: '188****672', masked: true },
        { fieldName: 'openid', label: '手游账号id', displayValue: '556677', masked: false },
        { fieldName: 'product_name', label: '产品名称', displayValue: '648元礼包', masked: false },
        { fieldName: 'order_id', label: '订单号', displayValue: '166****890', masked: true },
        { fieldName: 'channel_id', label: '渠道 ID', displayValue: '2', masked: false },
        { fieldName: 'ip', label: 'IP 地址', displayValue: '120.229.*.*', masked: true },
      ],
    },
    {
      reqId: '7c1e8a90-1d2b-4c3f-9e4d-5a6f7b8c9d0e', nodeNo: 'LOGIN_WEB', accountId: '139****508', gameId: '5290',
      deviceId: '9ab1****c88d', ip: '223.104.*.*', ipLocation: '中国 广东省 深圳市', score: 91,
      eventTime: '2026-09-03 09:58:03', createTime: '2026-09-03 09:58:03', masked: { accountId: true, ip: true },
      ext: [
        { fieldName: 'account_id', label: '账号', displayValue: '139****508', masked: true },
        { fieldName: 'device_id', label: '设备ID', displayValue: '9ab1****c88d', masked: true },
        { fieldName: 'openid', label: '手游账号id', displayValue: '908732', masked: false },
        { fieldName: 'event_time', label: '事件时间', displayValue: '1788401708000', masked: false },
        { fieldName: 'ip', label: 'IP 地址', displayValue: '223.104.*.*', masked: true },
      ],
    },
    {
      reqId: 'a1b2c3d4-5e6f-7890-abcd-ef1234567890', nodeNo: 'LOGIN_WEB', accountId: '186****245', gameId: '5290',
      deviceId: '77ab****12cd', ip: '61.140.*.*', ipLocation: '中国 广东省 广州市', score: 58,
      eventTime: '2026-09-03 09:20:55', createTime: '2026-09-03 09:20:55', masked: { accountId: true, ip: true },
      ext: [
        { fieldName: 'account_id', label: '账号', displayValue: '186****245', masked: true },
        { fieldName: 'device_id', label: '设备ID', displayValue: '77ab****12cd', masked: true },
        { fieldName: 'openid', label: '手游账号id', displayValue: '552019', masked: false },
        { fieldName: 'event_time', label: '事件时间', displayValue: '1788401708000', masked: false },
        { fieldName: 'ip', label: 'IP 地址', displayValue: '61.140.*.*', masked: true },
      ],
    },
  ],

  deriveFields: [
    { id: 1, field: 'risk_level_text', label: '风险等级文案', status: 1, createTime: '2026-08-20 10:00:00', script: 'if (data.riskScore >= 80) return "高风险"; if (data.riskScore >= 60) return "中风险"; return "低风险";' },
    { id: 2, field: 'order_ratio_1h', label: '1小时下单占比', status: 1, createTime: '2026-08-25 15:30:00', script: 'return (data.order_cnt_12h_by_uid || 0) / 12;' },
    { id: 3, field: 'is_device_black', label: '设备是否黑名单', status: 0, createTime: '2026-08-30 09:12:00', script: 'return data?.properties?.device_black_hit === 1;' },
  ],

  flinkMetrics: [
    { id: 675, name: 'tran_1h_amount', label: '1小时交易金额', modelId: 231, group: '手机端交易', status: 1 },
    { id: 676, name: 'count_buyerid_24h_uid', label: '24小时购买次数(按用户)', modelId: 231, group: '手机端交易', status: 1 },
    { id: 677, name: 'order_cnt_12h_by_uid', label: '12小时下单笔数(按用户)', modelId: 231, group: '手机端交易', status: 1 },
    { id: 678, name: 'uid_240_24h_distinct_count_pay_orderid', label: '24小时去重支付单数(按用户)', modelId: 231, group: '手机端交易', status: 1 },
    { id: 679, name: 'device_black_hit', label: '设备黑名单命中', modelId: 240, group: '登录', status: 1 },
  ],

  commonFields: [
    { id: 1, name: 'account_id', label: '账号', type: 'STRING', group: '公共字段', status: 1 },
    { id: 2, name: 'device_id', label: '设备ID', type: 'STRING', group: '公共字段', status: 1 },
    { id: 3, name: 'amount', label: '交易金额', type: 'DOUBLE', group: '交易字段', status: 1 },
    { id: 4, name: 'order_id', label: '订单号', type: 'STRING', group: '交易字段', status: 1 },
    { id: 5, name: 'openid', label: '手游账号id', type: 'STRING', group: '公共字段', status: 1 },
    { id: 6, name: 'ip', label: 'IP 地址', type: 'STRING', group: '公共字段', status: 1 },
  ],
};
