# Frontier Trade Routes Demo Day 流程

## 1. 演示目标

本次演示要让观众在 5 分钟内看懂三件事：

1. 这不是普通交易面板，而是物流与情报协作市场
2. 系统通过模糊展示、质押、声誉、保险来建立信任
3. 前端、合约、模拟脚本已经能串起来展示完整闭环

## 2. 演示前准备

进入项目根目录：

```bash
cd "/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map"
```

启动前端：

```bash
pnpm dev
```

另开一个终端，准备演示脚本：

```bash
cd "/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map"
pnpm simulate:trade-routes
```

注意：

- 浏览器一定打开终端输出的真实端口
- 不要默认认为一定是 `3000`

## 3. 演示顺序

### 第 1 步：首页开场

打开：

```text
/
```

讲法：

- 这是 `Frontier Trade Routes`
- 一个面向 EVE Frontier × Sui 的物流与情报市场
- 公开市场只显示模糊区域，不暴露精确坐标

重点指给观众看：

- 顶部导航
- Hero 标题
- `Enter App`

### 第 2 步：进入应用

点击：

```text
Enter App
```

进入：

```text
/app
```

讲法：

- 这是标准 DApp 控制台
- 左边是模块导航
- 中间是核心业务面板

### 第 3 步：解释 Heatmap

在 Dashboard 中讲：

- 热力图展示的是区域级压力
- 不是具体站点坐标
- 这是前端隐私保护的第一层

### 第 4 步：解释订单市场

在订单卡片区域讲：

- 每个订单有预算
- 有最低信誉分
- 有最低质押要求
- 有是否投保
- 有阶段状态

重点强调：

- 接单之前看不到完整路径
- 满足条件的人才能接

### 第 5 步：打开 Stake 弹窗

点击任意订单：

```text
Lock Stake
```

讲法：

- 这里不是普通确认框
- 这是链上承诺窗口
- 卖家要先锁定质押
- 然后才进入 staged reveal

### 第 6 步：进入 Reputation 页面

点击顶部或左侧：

```text
Reputation
```

进入：

```text
/app/reputation
```

讲法：

- 卖家不是同权的
- 分数越高，tier 越高
- 能接的单越高级
- 失败会扣分、罚没、降级

### 第 7 步：进入 Insurance 页面

点击：

```text
Insurance
```

进入：

```text
/app/insurance
```

讲法：

- 买家可以为任务买保险
- 如果失败，保险池先赔
- 之后再从卖家质押里追偿

### 第 8 步：进入 Orders 页面

点击：

```text
Orders
```

进入：

```text
/contracts
```

讲法：

- 这里是合同创建和生命周期追踪页面
- 可用于展示如何创建前端合同任务

### 第 9 步：进入 Intel 页面

点击：

```text
Intel
```

进入：

```text
/opportunities
```

讲法：

- 这里展示的是区域级情报和机会评分
- 仍然不公开精确坐标

### 第 10 步：运行模拟脚本

在终端展示：

```bash
pnpm simulate:trade-routes
```

讲法顺序：

1. 买家发单
2. 卖家抢单并锁定质押
3. Pickup 揭示
4. Destination 揭示
5. 成功交付
6. 声誉更新

## 4. 一句话讲清项目

可以直接说：

“Frontier Trade Routes 用模糊展示保护路线隐私，用质押和声誉过滤承运人，用保险池补足失败赔付，把物流撮合和履约信任做成了一个链上闭环。” 

## 5. 演示结束时的收尾

最后总结三点：

1. 前端已经可用并且页面完整
2. Move 合约可构建
3. 模拟脚本已经能跑通完整业务流程
