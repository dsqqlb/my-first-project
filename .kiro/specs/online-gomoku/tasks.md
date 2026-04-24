# 实现计划：联机五子棋

## 概述

按照设计文档，依次实现后端 WebSocket 基础设施、房间管理、游戏引擎、消息处理器，再实现前端 Hook、各视图组件，最后整合页面并在菜单中添加入口。所有后端代码位于 `com.demo.hrms.gomoku` 包，前端代码位于 `frontend/pages/gomoku.tsx` 及 `frontend/components/gomoku/` 目录。

---

## 任务

- [ ] 1. 后端：WebSocket 基础配置
  - 在 `pom.xml` 中添加 `spring-boot-starter-websocket` 依赖
  - 在 `com.demo.hrms.config` 包下新建 `WebSocketConfig.java`，实现 `WebSocketConfigurer`，注册路径 `/ws/gomoku`，允许所有来源（`setAllowedOrigins("*")`）
  - _需求：1.1、2.1_

- [ ] 2. 后端：数据模型
  - [ ] 2.1 创建 `GameStatus` 枚举（`WAITING / PLAYING / FINISHED`）
    - 位于 `com.demo.hrms.gomoku` 包
    - _需求：1.2、2.1_
  - [ ] 2.2 创建 `GameRoom` 类
    - 字段：`roomCode`、`blackPlayer`（`WebSocketSession`）、`whitePlayer`（`WebSocketSession`）、`board`（`int[15][15]`，0=空/1=黑/2=白）、`currentTurn`（int）、`status`（`GameStatus`）
    - 提供构造方法和 getter/setter（或使用 Lombok `@Data`）
    - _需求：1.2、2.1、3.2_
  - [ ] 2.3 创建 `PlaceResult` record 和 `WinResult` record
    - `PlaceResult(boolean success, String errorMessage, WinResult winResult)`
    - `WinResult(boolean hasWinner, int winner, List<int[]> winningLine)`
    - _需求：3.2、4.1_
  - [ ] 2.4 创建客户端消息 DTO 类（`ClientMessage`）
    - 字段：`type`（String）、`roomCode`（String，可为 null）、`row`（Integer，可为 null）、`col`（Integer，可为 null）
    - 使用 Jackson 注解 `@JsonIgnoreProperties(ignoreUnknown = true)`
    - _需求：3.1_

- [ ] 3. 后端：RoomManager 实现
  - [ ] 3.1 实现 `RoomManager` 组件
    - 使用 `ConcurrentHashMap<String, GameRoom> rooms` 和 `ConcurrentHashMap<String, String> sessionRoomIndex` 存储状态
    - 实现 `generateRoomCode()`：生成 6 位大写字母数字混合字符串（字符集 `A-Z0-9`）
    - 实现 `createRoom(WebSocketSession)`：生成唯一房间码，创建 `GameRoom`，将创建者设为黑棋（`currentTurn=1`，`status=WAITING`），更新 `sessionRoomIndex`，返回房间码
    - 实现 `joinRoom(String roomCode, WebSocketSession)`：校验房间存在且状态为 `WAITING`，将加入者设为白棋，更新状态为 `PLAYING`，更新 `sessionRoomIndex`，返回 boolean
    - 实现 `getRoom(String)`、`getRoomCodeBySession(WebSocketSession)`、`destroyRoom(String)`
    - _需求：1.1、1.2、2.1、2.3、2.4、5.3_
  - [ ]* 3.2 为 `RoomManager` 编写单元测试（`RoomManagerTest`）
    - 测试房间码格式（正则 `[A-Z0-9]{6}`）
    - 测试创建者为黑棋、加入者为白棋
    - 测试房间满员时 `joinRoom` 返回 false
    - 测试 `destroyRoom` 后房间从 map 中移除
    - _需求：1.1、1.2、2.1、2.4_
  - [ ]* 3.3 为 `RoomManager` 编写属性测试（jqwik）
    - **属性 1：房间码格式不变量**
    - **验证：需求 1.1**
    - **属性 2：创建者始终为黑棋**
    - **验证：需求 1.2**
    - **属性 3：加入者始终为白棋**
    - **验证：需求 2.1**

- [ ] 4. 后端：GameEngine 实现
  - [ ] 4.1 实现 `GameEngine` 组件
    - 实现 `validateAndPlace(GameRoom, WebSocketSession, int row, int col)`：
      - 校验游戏状态为 `PLAYING`
      - 校验坐标范围（0 ≤ row < 15，0 ≤ col < 15），越界返回失败
      - 校验是否轮到该玩家，否则返回"不是你的回合"
      - 校验目标位置为空，否则返回"该位置已有棋子"
      - 更新 `board[row][col]`，切换 `currentTurn`
      - 调用 `checkWin()` 和 `isDraw()`，返回 `PlaceResult`
    - 实现 `checkWin(int[][] board, int row, int col, int color)`：
      - 检测横、竖、左斜（↖↘）、右斜（↗↙）四个方向
      - 每个方向双向延伸，统计连续同色棋子数
      - 连续 ≥ 5 则返回 `WinResult(true, color, winningLine)`
    - 实现 `isDraw(int[][] board)`：遍历棋盘，全满且无胜者则返回 true
    - 实现 `resetBoard(GameRoom)`：将 `board` 全部置 0，`currentTurn` 置 1，`status` 置 `PLAYING`
    - _需求：3.2、3.4、3.5、3.6、4.1、4.4_
  - [ ]* 4.2 为 `GameEngine` 编写单元测试（`GameEngineTest`）
    - 测试横向五连检测
    - 测试纵向五连检测
    - 测试左斜、右斜五连检测
    - 测试棋盘边缘的五连
    - 测试平局检测（225 子全满）
    - 测试越界坐标被拒绝
    - 测试非当前行棋方落子被拒绝
    - _需求：3.4、3.5、3.6、4.1、4.4_
  - [ ]* 4.3 为 `GameEngine` 编写属性测试（jqwik）
    - **属性 6：越界坐标始终被拒绝**
    - **验证：需求 3.6**
    - **属性 7：胜负检测正确性**
    - **验证：需求 4.1**

- [ ] 5. 后端：GomokuWebSocketHandler 实现
  - [ ] 5.1 实现 `GomokuWebSocketHandler`（继承 `TextWebSocketHandler`，标注 `@Component`）
    - `afterConnectionEstablished`：记录 session 日志
    - `handleTextMessage`：用 Jackson 解析 `ClientMessage`，按 `type` 路由到对应私有方法
    - `afterConnectionClosed`：调用 `getRoomCodeBySession` 找到房间，若房间存在则通知对方 `PLAYER_DISCONNECT`，销毁房间
    - `handleCreateRoom`：调用 `RoomManager.createRoom()`，发送 `ROOM_CREATED` 消息
    - `handleJoinRoom`：调用 `RoomManager.joinRoom()`，成功则向双方广播 `GAME_START`（各自 `myColor` 不同）；失败则发送 `ERROR`
    - `handlePlaceStone`：调用 `GameEngine.validateAndPlace()`，成功则广播 `STONE_PLACED`；若有胜者广播 `GAME_OVER`；若平局广播 `GAME_OVER(isDraw=true)`；失败则发送 `ERROR`
    - `handleRematch`：调用 `GameEngine.resetBoard()`，向双方广播新的 `GAME_START`
    - `broadcastToRoom`：向房间内两名玩家各发送一条消息
    - `sendToSession`：将对象序列化为 JSON 后通过 session 发送，捕获异常并记录日志
    - _需求：1.1、1.4、2.2、2.3、2.4、3.2、3.4、3.5、3.6、4.2、4.4、4.5、5.1、5.3、5.4_
  - [ ] 5.2 检查点：确保后端编译通过，所有单元测试通过，向用户确认是否有疑问。

- [ ] 6. 前端：useGomokuSocket Hook
  - 新建 `frontend/hooks/useGomokuSocket.ts`
  - 实现 `useGomokuSocket(url: string)`，返回 `{ sendMessage, lastMessage, connected }`
  - 在 `useEffect` 中创建 `WebSocket`，监听 `onopen`、`onmessage`、`onclose`、`onerror`
  - `onmessage` 时将 JSON 解析为 `ServerMessage` 并更新 `lastMessage` state
  - 组件卸载时关闭 WebSocket 连接
  - 定义 `ClientMessage` 和 `ServerMessage` TypeScript 类型（覆盖设计文档中所有消息类型）
  - _需求：3.1、5.2_

- [ ] 7. 前端：LobbyView 组件
  - 新建 `frontend/components/gomoku/LobbyView.tsx`
  - 实现 `LobbyViewProps`：`onCreateRoom: () => void`、`onJoinRoom: (roomCode: string) => void`、`error: string | null`
  - 包含"创建房间"按钮和"加入房间"输入框+按钮
  - 若 `error` 不为 null，在界面上显示错误文字
  - 使用 Tailwind CSS 样式，风格与现有页面保持一致
  - _需求：1.3、2.3、2.4_

- [ ] 8. 前端：WaitingView 组件
  - 新建 `frontend/components/gomoku/WaitingView.tsx`
  - 实现 `WaitingViewProps`：`roomCode: string`、`onCancel: () => void`
  - 显示房间码（大字体，方便复制）和"等待对手加入…"提示
  - 提供"取消"按钮（关闭 WebSocket 并返回大厅）
  - _需求：1.3_

- [ ] 9. 前端：BoardCanvas 组件
  - 新建 `frontend/components/gomoku/BoardCanvas.tsx`
  - 实现 `BoardCanvasProps`：`board: number[][]`、`myColor: 1 | 2`、`currentTurn: 1 | 2`、`winningLine: [number, number][] | null`、`onPlaceStone: (row: number, col: number) => void`
  - 使用 `useRef<HTMLCanvasElement>` 和 `useEffect` 绘制棋盘：
    - 背景色 `#DEB887`，15×15 网格线
    - 天元（第 8 行第 8 列，0-indexed 为 7,7）和八个星位（第 4、12 行与第 4、12 列交叉点，0-indexed 为 3,3 / 3,11 / 11,3 / 11,11 / 3,7 / 7,3 / 11,7 / 7,11）绘制实心圆点
    - 黑棋：深灰到黑色径向渐变圆形，直径为格距的 88%
    - 白棋：白色到浅灰径向渐变圆形，直径为格距的 88%
    - `winningLine` 不为 null 时，高亮显示获胜连线（如红色描边或半透明覆盖）
  - 监听 `mousemove` 事件，在空交叉点且轮到本方时绘制半透明预览棋子
  - 监听 `click` 事件，计算最近交叉点坐标，调用 `onPlaceStone`
  - 监听 `resize` 事件（通过 `ResizeObserver` 或 `window.addEventListener`），重新计算棋盘尺寸并重绘
  - 棋盘边长 = `min(容器宽, 容器高) * 0.9`，格距 = `boardSize / 14`
  - _需求：3.1、3.3、4.3、6.1、6.2、6.3、6.4、6.5、6.6_

- [ ] 10. 前端：/gomoku 页面整合（状态机）
  - 新建 `frontend/pages/gomoku.tsx`
  - 定义 `PageState = 'LOBBY' | 'WAITING' | 'PLAYING' | 'GAME_OVER'`
  - 使用 `useGomokuSocket` 连接 `ws://localhost:8080/ws/gomoku`
  - 使用 `useEffect` 监听 `lastMessage`，按消息类型驱动状态转换：
    - `ROOM_CREATED` → 保存 `roomCode`，切换到 `WAITING`
    - `GAME_START` → 保存 `myColor` 和 `currentTurn`，切换到 `PLAYING`
    - `STONE_PLACED` → 更新 `board` 和 `currentTurn`
    - `GAME_OVER` → 保存 `winner`/`winningLine`/`isDraw`，切换到 `GAME_OVER`
    - `PLAYER_DISCONNECT` → 显示提示，切换到 `LOBBY`
    - `ERROR` → 更新 `error` state
  - 根据 `pageState` 渲染对应子视图：`LobbyView`、`WaitingView`、`BoardCanvas`（含游戏结束覆盖层）
  - 游戏结束覆盖层显示胜负文字和"再来一局"按钮（发送 `REMATCH` 消息）
  - 页面顶部显示返回主菜单链接
  - _需求：1.3、2.5、3.3、4.3、4.5、5.2_

- [ ] 11. 前端：菜单页添加五子棋入口
  - 修改 `frontend/pages/menu.tsx`
  - 在现有菜单卡片网格中新增"联机五子棋"卡片
  - 样式参考现有卡片（渐变背景、hover 动效），使用绿色系渐变（如 `linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)`）
  - 点击后跳转至 `/gomoku`
  - _需求：无直接需求条目，属于功能入口_

- [ ] 12. 最终检查点
  - 确保后端所有测试通过（`mvn test`）
  - 确保前端 TypeScript 编译无错误（`tsc --noEmit`）
  - 向用户确认是否有疑问或需要调整。

---

## 备注

- 标注 `*` 的子任务为可选项，可跳过以加快 MVP 进度
- 属性测试需在 `pom.xml` 中添加 `net.jqwik:jqwik` 依赖（版本 1.8.x）
- 后端所有新增类均位于 `com.demo.hrms.gomoku` 包（`WebSocketConfig` 除外，位于 `com.demo.hrms.config`）
- 前端 WebSocket 地址在开发阶段硬编码为 `ws://localhost:8080/ws/gomoku`，可后续提取到 `utils/constants.ts`
