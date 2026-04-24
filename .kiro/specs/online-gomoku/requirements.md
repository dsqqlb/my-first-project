# 需求文档

## 简介

本功能在现有 Spring Boot + Next.js 项目（demo-first-try）中新增联机五子棋对战模块。两名玩家通过房间码匹配，使用 WebSocket 实时同步落子，后端负责房间管理与胜负判断，前端使用 Canvas 渲染棋盘与棋子。

## 词汇表

- **GomokuServer**：Spring Boot 后端中负责五子棋功能的服务端整体，包含 WebSocket 端点、房间管理和游戏逻辑。
- **GomokuClient**：Next.js 前端中负责五子棋功能的客户端整体，包含房间页面和棋盘页面。
- **RoomManager**：GomokuServer 内部负责创建、存储和销毁房间的组件。
- **GameEngine**：GomokuServer 内部负责落子合法性校验和胜负判断的组件。
- **BoardRenderer**：GomokuClient 内部使用 Canvas API 渲染棋盘和棋子的组件。
- **WebSocketSession**：代表一个玩家与服务器之间的 WebSocket 长连接。
- **房间码（RoomCode）**：由 GomokuServer 生成的 6 位大写字母数字混合字符串，用于唯一标识一个对战房间。
- **棋盘（Board）**：15×15 的网格，每个交叉点可放置一枚棋子。
- **棋子颜色**：先手玩家执黑棋，后手玩家执白棋。
- **五子连珠**：同色棋子在横、竖、左斜、右斜任意方向连续出现 5 枚或以上，即判定该颜色获胜。

---

## 需求

### 需求 1：创建房间

**用户故事：** 作为玩家，我希望能创建一个新的对战房间并获得房间码，以便邀请另一名玩家加入。

#### 验收标准

1. WHEN 玩家请求创建房间，THE RoomManager SHALL 生成一个唯一的 6 位大写字母数字混合房间码并返回给该玩家。
2. WHEN RoomManager 创建房间，THE RoomManager SHALL 将创建者的 WebSocketSession 与该房间关联，并将其标记为黑棋玩家（先手）。
3. WHEN 房间创建成功，THE GomokuClient SHALL 在界面上显示房间码，并提示玩家等待对手加入。
4. IF 服务器内部发生错误导致房间创建失败，THEN THE GomokuServer SHALL 向客户端发送包含错误描述的失败消息。

---

### 需求 2：加入房间

**用户故事：** 作为玩家，我希望能通过输入房间码加入已有房间，以便与创建者开始对战。

#### 验收标准

1. WHEN 玩家提交有效的房间码，THE RoomManager SHALL 将该玩家的 WebSocketSession 与对应房间关联，并将其标记为白棋玩家（后手）。
2. WHEN 第二名玩家成功加入房间，THE GomokuServer SHALL 向房间内两名玩家分别发送游戏开始消息，消息中包含各自的棋子颜色和当前行棋方。
3. IF 玩家提交的房间码不存在，THEN THE GomokuServer SHALL 向该玩家返回"房间不存在"的错误消息。
4. IF 玩家提交的房间码对应的房间已有两名玩家，THEN THE GomokuServer SHALL 向该玩家返回"房间已满"的错误消息。
5. WHEN 游戏开始，THE GomokuClient SHALL 跳转至棋盘页面并显示初始空棋盘。

---

### 需求 3：实时落子同步

**用户故事：** 作为玩家，我希望我的落子能实时同步给对手，以便双方看到相同的棋盘状态。

#### 验收标准

1. WHEN 当前行棋方玩家在棋盘上点击一个空交叉点，THE GomokuClient SHALL 通过 WebSocket 向 GomokuServer 发送包含行列坐标的落子消息。
2. WHEN GomokuServer 收到合法落子消息，THE GameEngine SHALL 更新棋盘状态，并向房间内两名玩家广播包含落子坐标和棋子颜色的同步消息。
3. WHEN GomokuClient 收到落子同步消息，THE BoardRenderer SHALL 在对应交叉点绘制相应颜色的棋子，并更新界面上的行棋方提示。
4. IF 非当前行棋方玩家发送落子消息，THEN THE GameEngine SHALL 忽略该消息并向该玩家返回"不是你的回合"的错误消息。
5. IF 玩家落子的交叉点已有棋子，THEN THE GameEngine SHALL 忽略该消息并向该玩家返回"该位置已有棋子"的错误消息。
6. IF 落子坐标超出 15×15 棋盘范围，THEN THE GameEngine SHALL 忽略该消息并向该玩家返回"落子位置非法"的错误消息。

---

### 需求 4：胜负判断

**用户故事：** 作为玩家，我希望游戏能自动判断胜负，以便在五子连珠时立即得到结果。

#### 验收标准

1. WHEN 每次合法落子后，THE GameEngine SHALL 检查横、竖、左斜、右斜四个方向上是否存在同色棋子连续 5 枚或以上。
2. WHEN GameEngine 判定某方获胜，THE GomokuServer SHALL 向房间内两名玩家广播包含获胜方棋子颜色和获胜连线坐标的游戏结束消息。
3. WHEN GomokuClient 收到游戏结束消息，THE BoardRenderer SHALL 在棋盘上高亮显示获胜的五子连线，并在界面上显示胜负结果文字。
4. WHEN 棋盘所有 225 个交叉点均已落子且无人获胜，THE GomokuServer SHALL 向两名玩家广播平局消息。
5. WHEN 游戏结束，THE GomokuClient SHALL 显示"再来一局"按钮，点击后重置棋盘并重新开始同一房间的新一局游戏。

---

### 需求 5：断线处理

**用户故事：** 作为玩家，我希望在对手断线时能收到通知，以便了解游戏中断的原因。

#### 验收标准

1. WHEN 房间内某玩家的 WebSocketSession 断开，THE GomokuServer SHALL 向房间内另一名玩家发送对手已断线的通知消息。
2. WHEN GomokuClient 收到对手断线通知，THE GomokuClient SHALL 在界面上显示"对手已断线，游戏结束"的提示，并提供返回主菜单的按钮。
3. WHEN 玩家断线时游戏尚未开始（房间仅一人），THE RoomManager SHALL 直接销毁该房间并释放房间码。
4. WHEN 游戏结束后任意玩家断开连接，THE RoomManager SHALL 销毁对应房间并释放房间码。

---

### 需求 6：棋盘渲染

**用户故事：** 作为玩家，我希望看到清晰美观的棋盘和棋子，以便获得良好的游戏体验。

#### 验收标准

1. THE BoardRenderer SHALL 使用 Canvas API 绘制 15×15 的网格棋盘，网格线均匀分布，棋盘背景色为木色（#DEB887）。
2. THE BoardRenderer SHALL 在棋盘的天元（第 8 行第 8 列）和八个星位（第 4、12 行与第 4、12 列的交叉点）绘制实心圆点标记。
3. WHEN BoardRenderer 绘制黑棋，THE BoardRenderer SHALL 使用从深灰到黑色的径向渐变填充圆形棋子，棋子直径为格距的 88%。
4. WHEN BoardRenderer 绘制白棋，THE BoardRenderer SHALL 使用从白色到浅灰的径向渐变填充圆形棋子，棋子直径为格距的 88%。
5. WHEN 玩家鼠标悬停在空交叉点上且轮到该玩家落子，THE BoardRenderer SHALL 在该交叉点绘制半透明的预览棋子。
6. WHEN 窗口尺寸变化，THE BoardRenderer SHALL 重新计算棋盘尺寸并重绘，保持棋盘始终居中且完整显示在视口内。
