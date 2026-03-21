# Frontier Trade Routes 项目信息

## 1. 项目名称

Frontier Trade Routes

## 2. 项目定位

Frontier Trade Routes 是一个面向 EVE Frontier 生态的去中心化物流与情报市场 DApp。

它的核心目标不是替代官方市场，而是在不泄露精确坐标、不依赖官方实时位置接口的前提下，为玩家提供一个可验证、可质押、可保险的链上物流协作层。

## 3. 解决的问题

- 官方市场和玩家物流之间缺少可信的中间协调层
- 直接公开真实坐标会带来作弊、埋伏、隐私泄露风险
- 玩家抢单和履约缺乏链上信誉与惩罚机制
- 高价值运输缺少链上可执行的保险补偿逻辑

## 4. 核心机制

### 模糊热力图

- 前端只展示区域级热度
- 不暴露具体星系、空间站或精确路线
- 数据来自链上订单与情报摘要

### 带门槛的抢单池

- 买家发布订单时可设置最低信誉门槛和最低质押要求
- 卖家只有在满足条件时才适合接单
- 急单支持先到先得
- 竞价单支持买家从候选中选择最优者

### 分段揭示

- 接单后只揭示取货点
- 卖家确认取货后才揭示送货点
- 降低完整路线在接单瞬间被泄露的风险

### 声誉与质押

- 成功履约提升信誉
- 失败或欺诈触发扣罚与 tier 降级
- 质押金在任务完成前保持锁定

### 链上互助保险

- 买家可购买保险
- 失败后保险池自动赔付
- 对责任卖家执行追偿和悬赏事件触发

## 5. 技术栈

### 前端

- Next.js 15
- React 19
- TypeScript
- Recharts
- `@mysten/dapp-kit`
- `@mysten/sui`

### 合约

- Sui Move 2024 beta
- 模块：
  - `trade_routes::profile`
  - `trade_routes::order`
  - `trade_routes::intel`
  - `trade_routes::insurance`

## 6. 当前已完成内容

- Sui Move 合约对象模型与事件结构
- 订单市场首页与模糊热力图区块
- 抢单弹窗与 `accept_order` 交易入口
- 订单、情报、信誉、保险的数据类型定义
- Node.js 模拟脚本，演示发布到完成的完整流程

## 7. 可实际运行的代码位置

### 前端入口

- [page.tsx](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/apps/web/app/page.tsx)
- [trade-routes-dashboard.tsx](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/apps/web/components/trade-routes/trade-routes-dashboard.tsx)
- [order-card.tsx](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/apps/web/components/trade-routes/order-card.tsx)
- [stake-modal.tsx](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/apps/web/components/trade-routes/stake-modal.tsx)
- [heatmap-layer.tsx](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/apps/web/components/trade-routes/heatmap-layer.tsx)

### 前端状态与类型

- [use-trade-routes.ts](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/apps/web/lib/trade-routes/use-trade-routes.ts)
- [types.ts](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/apps/web/lib/trade-routes/types.ts)
- [mock-data.ts](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/apps/web/lib/trade-routes/mock-data.ts)

### 合约

- [profile.move](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/contracts/trade_routes/sources/profile.move)
- [order.move](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/contracts/trade_routes/sources/order.move)
- [intel.move](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/contracts/trade_routes/sources/intel.move)
- [insurance.move](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/contracts/trade_routes/sources/insurance.move)

### 模拟脚本

- [simulate-trade-routes.mjs](/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map/scripts/simulate-trade-routes.mjs)

## 8. 运行方式

```bash
pnpm install
pnpm dev
```

打开：

`http://localhost:3000`

## 9. 验证方式

```bash
pnpm typecheck
pnpm --filter web build
pnpm move:build
pnpm simulate:trade-routes
```

## 10. 项目亮点

- 隐私优先：公开界面不直接暴露精确坐标
- 机制闭环：订单、情报、质押、保险、争议全部能联动
- 可演示：前端、合约、模拟脚本都已具备可运行基础
- 可扩展：后续可接真实链上对象、索引器与更细粒度权限控制
