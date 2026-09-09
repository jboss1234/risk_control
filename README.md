#  反欺诈决策引擎 · 系统说明

> 适用范围： 多模块 Maven 仓库（Spring Boot 2.7.18 / JDK 1.8 / Dubbo 2.7.23）。
> 最后更新：2026-09-07

## 一、系统定位

是一套**实时反欺诈 / 风控决策引擎**，为业务提供“事前拦截 + 事中评估 + 事后告警”的完整闭环：

- 上游通过 open-api（HTTP）或消息通道把用户行为事件提交进来（`submit`）；
- 引擎实时计算指标、跑衍生特征、执行规则并给出处置结论（`pass` / `review` / `reject` / `BLOCK` 等，含评分）；
- 决策结果沉淀为 Mongo 决策记录与 ES 事件日志，同时按告警配置推送到飞书 / 邮件；
- 管理后台负责模型（指标抽象、衍生特征、激活、规则）、告警配置与事件查询。

## 二、解决什么问题

| 业务问题 | 引擎怎么解决 |
|---|---|
| **批量注册 / 养号撞库** | 短时间注册、设备维度计数等指标实时聚合，规则直接拦截（例：命中 601「短时间注册」） |
| **盗号、异常登录、设备伪造** | 按设备 / IP / 账号建模做频次、去重计数等抽象指标，组合规则判定（例：命中 503「1天支付金额大于50000」） |
| **支付 / 交易风险** | 对金额类指标（1h/1d 累计金额）做阈值与条件规则，产出 BLOCK/REVIEW 结论 |
| **风控规则难以灵活迭代** | 场景 + 激活 + 规则树状配置，Groovy 脚本热更，不用发版即可加规则 |
| **规则命中看不清楚** | 命中详情（hitsDetail）精确到规则 ID，决策记录支持规则命中统计与按规则 ID 下钻 |
| **风险来了没人知道** | 独立告警服务聚合窗口事件，把“哪个规则命中多少条、涉及哪些账号/IP”直接推到飞书/邮件 |
| **人工处理无数据支撑** | 决策记录（Mongo）+ 事件日志（ES）双份沉淀，附评估时刻指标快照，方便复盘与旁路观察 |
| **业务方要自助接入** | 网关鉴权（JWT）+ open-api 的 submit/query 能力，只需按协议提交字段即可接入评估 |

## 三、核心功能清单

### 1. 实时指标计算（抽象 Abstraction / 指标）

- 以账号、设备、IP、手机号等维度为单位，在 Redis / Flink 中维护**滑窗计数**（如 `device_id_258_24h_count`、`ip_259_24h_count`、`register_phone_257_1h_distinct_count_ip`）。
- 支持求和、去重计数等多类口径；指标通过预计算/批量写策略控制资源开销，避免热点 key 打爆 Redis。
- 评估时按场景内规则实际引用的指标集去 Redis 取值，未命中的指标也保留占位（null），保证快照完整。

### 2. 规则与衍生特征

- **规则（rule）**：归属场景下的激活（activation），规则体为 Groovy 脚本，支持读 `data.properties.*`（事件原始字段）、`data.abstractions.*`（指标）、`data.features.*`（衍生特征）与 `fields.*`，命中产出 hitsDetail 明细。
- **衍生特征（feature）**：复用指标与属性做二次加工（例：`chrome_abnormal_ua_version`），供多条规则共享，避免每个规则重复写逻辑。
- 规则可带评分（initScore / max / baseNum）、灰度（grayRatio/grayDimension）、熔断（circuitConfig）与标签（tags），支持按 displayType 前端配置化。

### 3. 评估入口（open-api / Dubbo）

- `submit`：正常提交一次评估（携带场景、事件字段），返回决策结论；
- `query`：查询指定评估/维度的结果；
- 消息链路区分 `MessageType`（submit/query）语义，禁止布尔值代替类型；
- 引擎节点（nodeNo）→ 场景（sceneId）两层组织，字段缺失按 `RequiredFields` 校验。

### 4. 决策记录与事件日志

- **Mongo `decision_record`**：风控结果主档（nodeNo、sceneId、reqId、score、decisionCode、accountId、hitsDetail、metrics 快照、fields、IP 归属地等）。
  - 列表接口 `risk_decision_log` 支持节点 / 时间范围 / 维度值过滤，并把扁平 `hitsDetail` 富化为带完整路径的 `hitsDetailList`（节点 → 场景 → 激活 → 规则）。
  - **规则命中统计接口** `risk_decision_log/ruleStats`：按时间/节点在服务端聚合 hitsDetail，返回 `[{ruleId, ruleName, hitCount}]`，命中数降序、可选 TOP N。
  - **按规则下钻**：`risk_decision_log?ruleId=xxx` 直接过滤出命中该规则的全部记录，与 ruleStats 联动使用。
- **ES 事件日志（event_log）**：按事件维度沉淀，`event_log/detail` 可查看评估当时的 metrics 快照与命中明细。
  - 注意口径：事件日志里的 `metrics` 是**评估落库快照**（含特征脚本引用的指标 key），`event_log/metrics` 是**实时现算**结果，两者口径不同。

### 5. 告警通知（alert）

独立部署的低流量可靠告警服务：

- 独立 Consumer Group 订阅 `radar_decision_risk_notify`，按告警配置（configName，如「注册短信预警」）聚合窗口并发送；
- 渠道：飞书（私聊 / 机器人所在群）、邮件（全局开关，默认关闭）；敏感凭据只走环境变量注入；
- **聚合窗口汇总**：统计窗口事件总数、独立账号、独立 IP、单独派发数，并给出**【高频命中规则 TOP10】**（每条含命中数 + 命中的去重账号，最多展示 10 个账号）；
- **账号兜底**：事件无 `accountId`（如注册）时自动用 uid / 手机号等字段兜底入库与展示，保证“涉及账号”可统计；
- 可靠性：`eventId+configId` 幂等去重、瞬时错误指数重试（1/2/4s×3 次）、确定性 4xx 只试一次、PROCESSING 断点可在重投后恢复、测试发送留痕、发送记录保留 90 天并可手工重发（配置删除时用配置快照）。

### 6. 名单库与实时宽表

- 名单库 / 上游数据经 cdc 与对账任务同步（Mongo → Redis / ES、回填），评估时可实时查询名单、实时宽表信息（详见 `docs/名单库与实时宽表查询接口.md`）。

### 7. 管理后台（admin）

- 模型管理：指标抽象、衍生特征、激活、规则（含历史版本与回滚，规则历史保存完整 ruleDefinition JSON）；
- 数据查询：事件日志、风控决策记录、规则命中统计与下钻；
- 监控大盘：风险等级趋势、高风险设备 / IP TOP、命中规则 TOP10（hitsDetail 统计）等；
- 用户与权限：菜单 / API 权限规则（JWT / token 鉴权，开放平台网关）；支持 SSO（见 `docs/sso-pt-setup.md`）。

### 8. 可观测与运维

- Prometheus 指标（Counter **total** 口径，不做速率推算）：评估量、告警量、Redis 内存与 key 数量等，另有 QPS 统计与预置 PromQL 目录；
- Actuator 健康检查、日志链路保留原始异常堆栈。

## 四、典型一次评估链路

```text
业务方（HTTP submit / Kafka 消息）
        │  （AmCommonReceiver / AmRegSmsReceiver 等按上报协议映射字段）
        ▼
指标计算（Flink 窗口 / Redis metric） ──► 实时频次/金额计数更新
        │
        ▼
引擎评估：取指标 → 跑衍生特征 → 执行激活/规则脚本 → 产出 score + decisionCode + hitsDetail
        │
        ├──► Mongo decision_record（决策主档，供 risk_decision_log 查询/统计/下钻）
        ├──► ES 事件日志（按事件沉淀，含 metrics 快照）
        └──► Kafka radar_decision_risk_notify
                  └──► alert：按配置窗口聚合 → 汇总消息（高频规则/账号）→ 飞书/邮件
```

## 五、模块职责一览

| 模块 | 职责 |
|---|---|
| commons | 通用层：枚举、JSON/Groovy/IP/加解密等工具 |
| facade | Dubbo API 接口与返回 VO |
| service | 领域接口与枚举（ProcessService、DecisionRiskService 等） |
| service-impl | 领域实现：Mongo/ES 存储、规则模型管理、告警明细 enrich、指标目录等 |
| dal / dao | 数据访问抽象与 MyBatis PO/Mapper（MapStruct 映射） |
| engine | 决策引擎：EngineServiceImpl、OpenController（submit/query）、指标切面、决策/事件执行器 |
| admin | 管理后台接口：事件日志、决策记录、大盘、权限（open-api 网关） |
| kafka | Kafka 接入消息与字段映射（Am*Receiver） |
| cdc | 数据变更同步/对账：Mongo → Redis/ES、回填任务 |
| alert | 风险告警：窗口聚合、飞书/邮件推送、发送记录与重发 |

## 六、关键实现约定

1. 技术栈固定：Spring Boot 2.7.18、JDK 1.8、Dubbo 2.7.23、ES 7.11.2、MapStruct 1.4.1；禁止擅自升级、禁止 Spring DevTools、默认不开启懒加载。
2. 处理/展示数据不得改动已有字段名与标签；方法/接口语义必须显式（如消息类型用 `MessageType`）。
3. 规则历史记录保存完整 ruleDefinition JSON（与主表落库口径一致），回滚时可完整还原规则定义。
4. 告警“涉及账号”在**入库前**做兜底回填（uid → 手机号），而非改下游模板硬编码。
5. 窗口/指标类热点设计需先评估资源开销（如高基数 keyBy 场景避免逐 key 定时器）。
6. 汇总消息“高频命中规则”在全窗口内按规则聚合（命中事件数 + 去重账号），不是随机抽样的最近 10 条事件。

<img width="3024" height="1714" alt="alert" src="https://github.com/user-attachments/assets/482bdeb6-3449-4f80-8be1-11be180f6c41" />
<img width="3024" height="1714" alt="user" src="https://github.com/user-attachments/assets/aa7dedc7-b6e8-4153-93f2-b75e44e0117d" />
<img width="3024" height="1714" alt="job" src="https://github.com/user-attachments/assets/9e20fe21-05cb-4d5e-8c87-16d6fe9f2d9a" />
<img width="3024" height="1714" alt="featurefields" src="https://github.com/user-attachments/assets/ede038ac-f46d-4354-853d-11994adede96" />
<img width="3024" height="1714" alt="derviefields" src="https://github.com/user-attachments/assets/25c12790-ea60-4951-9f2b-5766c6ad1dd6" />
<img width="3024" height="1714" alt="commonfield" src="https://github.com/user-attachments/assets/538a100d-ad5c-41ad-91b2-a59cd017cd36" />
<img width="3024" height="1714" alt="decision" src="https://github.com/user-attachments/assets/517ef33e-94fa-4ee5-bdc4-40783ffbed0f" />
<img width="3024" height="1714" alt="rule" src="https://github.com/user-attachments/assets/e57c09b0-d691-4625-9cc5-997236a76890" />
<img width="3024" height="1714" alt="strage" src="https://github.com/user-attachments/assets/6e5ddfba-54bb-4d4a-b205-10bd5f31fd31" />
<img width="3024" height="1714" alt="scene" src="https://github.com/user-attachments/assets/e938547b-1393-46ce-a25f-c0cb326156cb" />
<img width="3024" height="1714" alt="node" src="https://github.com/user-attachments/assets/2ff0b095-b3d6-4f58-aed7-c5ea58030a9e" />
<img width="3024" height="1714" alt="starrocks" src="https://github.com/user-attachments/assets/8de6eee7-dc6e-416b-96bf-fe3b8b83eb27" />
<img width="3024" height="1714" alt="black" src="https://github.com/user-attachments/assets/9e2e5998-f5a7-4ced-a066-c591d710f346" />
<img width="3024" height="1714" alt="oberlist" src="https://github.com/user-attachments/assets/69df15d3-1acb-447d-9e35-8058097e16ca" />
<img width="3024" height="1714" alt="risk_list" src="https://github.com/user-attachments/assets/5859b6e6-307e-4fdf-8a01-41187e143852" />
<img width="2974" height="1566" alt="record" src="https://github.com/user-attachments/assets/22362227-efa8-4caa-ae27-095c72cab73a" />
<img width="2970" height="1480" alt="dashboard" src="https://github.com/user-attachments/assets/0938ba3d-0655-46f4-85b2-edd36137b88a" />

项目中包含了静态代码，有需要沟通探讨可以微信联系：a13386248033
