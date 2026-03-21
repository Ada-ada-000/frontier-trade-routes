# Frontier Trade Routes 前端使用说明书

## 1. 项目是什么

Frontier Trade Routes 是一个运行在 EVE Frontier × Sui 场景中的去中心化物流与情报市场前端。

前端当前主要展示 5 类能力：

1. 首页封面与项目入口
2. 应用总览 Dashboard
3. 订单与合约页面
4. 声誉页面 Reputation
5. 保险页面 Insurance

项目当前支持两种运行模式：

- `mock`：默认演示模式，无需真实链上对象即可展示
- `sui`：当环境变量配置了真实对象 ID 后接入链上

当前最适合演示的是 `mock` 模式。

## 2. 如何启动前端

进入项目根目录：

```bash
cd "/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map"
```

安装依赖：

```bash
pnpm install
```

启动前端：

```bash
pnpm dev
```

启动后，终端会显示真实端口，例如：

```bash
Local: http://localhost:3002
```

你必须打开终端里显示的那个端口，不要手动假设一定是 `3000`。

## 3. 页面入口说明

### 首页

地址：

```text
/
```

功能：

- 展示项目封面
- 展示项目核心机制
- 提供 `Enter App` 按钮进入应用控制台

首页适合做开场介绍。

### 应用总览页

地址：

```text
/app
```

功能：

- 展示 Dashboard
- 展示模糊热力图
- 展示订单市场
- 展示 Reputation / Insurance 入口卡片
- 可打开接单质押弹窗

### Orders 页面

地址：

```text
/contracts
```

功能：

- 创建演示合同
- 查看合同看板
- 展示钱包接入状态

### Intel 页面

地址：

```text
/opportunities
```

功能：

- 展示区域级情报
- 展示机会评分
- 展示隐私说明

### Reputation 页面

地址：

```text
/app/reputation
```

功能：

- 展示卖家声誉体系
- 展示 tier 分级
- 展示成功/失败/质押/惩罚数据

### Insurance 页面

地址：

```text
/app/insurance
```

功能：

- 展示保险池资本
- 展示保费、赔付、追偿
- 展示失败后资金流向和恢复逻辑

## 4. 顶部导航怎么用

顶部导航有 5 个主要入口：

1. `Overview`
   进入应用总览页
2. `Orders`
   进入合同与订单页面
3. `Intel`
   进入机会与情报页面
4. `Reputation`
   进入声誉页面
5. `Insurance`
   进入保险页面

右上角有钱包区域：

- `Connect Wallet`
  打开钱包连接弹窗
- 若已连接，会显示截断后的钱包地址

## 5. 左侧边栏怎么用

进入应用后，左侧边栏用于模块导航。

桌面端：

- 常驻显示

移动端：

- 点击顶部菜单按钮展开

边栏下方会显示：

- 当前网络状态
- 隐私披露说明

## 6. Dashboard 页面怎么用

Dashboard 页面是最重要的演示入口。

你可以从上到下这样看：

### 6.1 顶部 Hero 区

用于解释项目是什么：

- 模糊热力图
- 带权抢单
- 分段揭示
- 声誉和保险

### 6.2 指标卡

这里展示：

- 当前模式 `mock` 或 `sui`
- 开放订单数量
- 质押压力
- 投保订单数量

### 6.3 Heatmap 模块

这里展示区域级热度，而不是精确坐标。

这是项目前端隐私设计的核心：

- 公开展示区域需求
- 不公开精确站点
- 不直接泄露完整航线

### 6.4 Order Market 模块

这里展示卖家可见订单列表。

每张卡片可看到：

- 货物提示
- 起点模糊区域
- 终点模糊区域
- 预算
- 最低信誉门槛
- 最低质押要求
- 是否投保
- 当前状态
- 当前阶段

### 6.5 Reputation / Insurance 快捷入口

Dashboard 下方新增了两个可点击面板：

- `Open Reputation`
- `Open Insurance`

点击后可进入完整页面。

## 7. 如何接单

在 Dashboard 的订单卡片上点击：

```text
Lock Stake
```

会打开质押接单弹窗。

弹窗内需要关注：

1. 订单编号和货物摘要
2. 最低质押要求
3. 当前预算
4. 报价输入
5. 钱包中可用 coin object
6. 风险提示

确认后会触发：

- `accept_order`
- 锁定质押
- 急单直接匹配或竞价单进入候选

## 8. Reputation 页面怎么解读

Reputation 页面主要分成 2 块：

### 8.1 Seller Ladder

展示不同卖家的：

- 地址
- 分数
- 成功次数
- 失败次数
- 当前 tier
- 已锁定质押
- 历史被罚没金额

### 8.2 Tier Rules

解释：

- Gold：可接高价值高门槛路线
- Silver：常规中阶承运人
- Bronze：只可接低风险任务

## 9. Insurance 页面怎么解读

Insurance 页面主要分成 2 块：

### 9.1 Coverage Board

展示当前已投保订单，包括：

- 订单编号
- 货物
- 模糊起点
- 模糊终点
- 预算
- 质押

### 9.2 Failure Handling

解释失败处理流程：

1. 买家买保险
2. 任务失败或仲裁触发索赔
3. 保险池先赔付
4. 再从卖家质押中追偿

## 10. 演示时最推荐的点击顺序

1. 打开首页
2. 点击 `Enter App`
3. 介绍 Dashboard
4. 介绍 Heatmap
5. 介绍订单卡片
6. 打开 `Lock Stake` 弹窗
7. 点击 `Open Reputation`
8. 点击 `Open Insurance`
9. 打开 `/contracts`
10. 打开 `/opportunities`

## 11. 如何验证项目可运行

在项目根目录执行：

```bash
pnpm typecheck
pnpm --filter web build
pnpm move:build
pnpm simulate:trade-routes
```

全部通过即可用于展示。

## 12. 常见问题

### 页面是白的

原因通常是旧开发服务缓存异常或端口打开错了。

处理方法：

1. 关闭旧的 `pnpm dev`
2. 重新执行：

```bash
pnpm dev
```

3. 打开终端中真实显示的端口

### 钱包按钮点不了

先确认：

- 浏览器已安装 Sui 兼容钱包
- 扩展已启用
- 页面不是旧缓存

然后强制刷新：

```text
Cmd + Shift + R
```

### Reputation / Insurance 点进去没内容

当前已修复，应该进入：

- `/app/reputation`
- `/app/insurance`

如果仍异常，先重启开发服务再试。
