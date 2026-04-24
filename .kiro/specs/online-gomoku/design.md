# 技术设计文档：联机五子棋

## 概述

本文档描述在现有 `demo-first-try` 项目（Spring Boot 3.3.13 后端 + Next.js 15 前端）中新增联机五子棋对战模块的技术设计方案。

核心思路：
- 后端新增 Spring WebSocket 支持，房间状态全部存储在内存（`ConcurrentHashMap`），不引入数据库表。
- 前端新增 `/gomoku` 页面，通过状态机在「大厅」→「等待室」→「对局」三个视图间切换，棋盘使用 Canvas API 渲染。
- 胜负判断完全在后端完成，前端只负责展示。

---

## 架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端（Next.js 15）                    │
│                                                             │
│  /gomoku 页面                                               │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────────┐  │
│  │  大厅视图  │──▶│  等待室视图   │──▶│    对局视图         │  │
│  │ 创建/加入  │   │  显示房间码   │   │  Canvas 棋盘渲染   │  │
│  └──────────┘   └──────────────┘   └────────────────────┘  │
│                        │  WebSocket                         │
└────────────────────────┼────────────────────────────────────┘
                         │ ws://localhost:8080/ws/gomoku
┌────────────────────────┼────────────────────────────────────┐
│                        │  后端（Spring Boot 3.3.13）         │
│                                                             │
│  ┌─────────────────────▼──────────────────────────────┐    │
│  │              GomokuWebSocketHandler                 │    │
│  │  （消息路由、Session 管理、广播）                      │    │
│  └──────────┬──────────────────────┬───────────────────┘    │
│             │                      │                        │
│  ┌──────────▼──────────┐  ┌────────▼────────────────────┐  │
│  │    RoomManager      │  │       GameEngine             │  │
│  │  ConcurrentHashMap  │  │  落子校验 + 胜负判断（八方向）  │  │
│  │  房间码生成 / 销毁    │  │                             │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 技术选型

| 层次 | 技术 | 说明 |
|------|------|------|
| 后端 WebSocket | `spring-boot-starter-websocket` | 原生 WebSocket，不使用 STOMP |
| 后端消息序列化 | Jackson（已有） | JSON 格式消息 |
| 后端状态存储 | `ConcurrentHashMap` | 内存存储，无需数据库 |
| 前端 WebSocket | 浏览器原生 `WebSocket` API | 无需额外依赖 |
| 前端棋盘渲染 | 浏览器原生 `Canvas` API | 参考 fuck.tsx 中已有的 Canvas 渲染模式 |
| 前端状态管理 | React `useState` + `useReducer` | 状态机管理页面视图切换 |

---

## 组件与接口

### 后端组件

#### 1. WebSocket 配置（`WebSocketConfig`）

```java
// 包路径：com.demo.hrms.config
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    void registerWebSocketHandlers(WebSocketHandlerRegistry registry);
    // 注册路径：/ws/gomoku，允许所有来源（开发阶段）
}
```

#### 2. 消息处理器（`GomokuWebSocketHandler`）

```java
// 包路径：com.demo.hrms.gomoku
public class GomokuWebSocketHandler extends TextWebSocketHandler {
    void afterConnectionEstablished(WebSocketSession session);
    void handleTextMessage(WebSocketSession session, TextMessage message);
    void afterConnectionClosed(WebSocketSession session, CloseStatus status);
    // 私有方法：
    void handleCreateRoom(WebSocketSession session);
    void handleJoinRoom(WebSocketSession session, String roomCode);
    void handlePlaceStone(WebSocketSession session, int row, int col);
    void handleRematch(WebSocketSession session);
    void broadcastToRoom(String roomCode, Object message);
    void sendToSession(WebSocketSession session, Object message);
}
```

#### 3. 房间管理器（`RoomManager`）

```java
// 包路径：com.demo.hrms.gomoku
@Component
public class RoomManager {
    // 存储：roomCode -> GameRoom
    private final ConcurrentHashMap<String, GameRoom> rooms;
    // 存储：sessionId -> roomCode（反向索引，用于断线处理）
    private final ConcurrentHashMap<String, String> sessionRoomIndex;

    String createRoom(WebSocketSession creatorSession);
    boolean joinRoom(String roomCode, WebSocketSession joinerSession);
    Optional<GameRoom> getRoom(String roomCode);
    Optional<String> getRoomCodeBySession(WebSocketSession session);
    void destroyRoom(String roomCode);
    String generateRoomCode(); // 生成 6 位大写字母数字
}
```

#### 4. 游戏引擎（`GameEngine`）

```java
// 包路径：com.demo.hrms.gomoku
@Component
public class GameEngine {
    // 校验落子合法性
    PlaceResult validateAndPlace(GameRoom room, WebSocketSession session, int row, int col);
    // 胜负判断（八方向检测）
    WinResult checkWin(int[][] board, int row, int col, int color);
    // 检查平局
    boolean isDraw(int[][] board);
    // 重置棋盘
    void resetBoard(GameRoom room);
}
```

### 前端组件

#### 1. 主页面（`/pages/gomoku.tsx`）

页面级组件，持有全局状态，通过状态机切换三个子视图：

```typescript
type PageState = 'LOBBY' | 'WAITING' | 'PLAYING' | 'GAME_OVER';

// 状态转换：
// LOBBY --[创建/加入成功]--> WAITING
// WAITING --[GAME_START 消息]--> PLAYING
// PLAYING --[GAME_OVER 消息]--> GAME_OVER
// GAME_OVER --[再来一局]--> PLAYING（重置棋盘）
// GAME_OVER / PLAYING --[断线]--> LOBBY
```

#### 2. 大厅视图（`LobbyView`）

```typescript
interface LobbyViewProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomCode: string) => void;
  error: string | null;
}
```

#### 3. 等待室视图（`WaitingView`）

```typescript
interface WaitingViewProps {
  roomCode: string;
  onCancel: () => void;
}
```

#### 4. 棋盘渲染器（`BoardCanvas`）

```typescript
interface BoardCanvasProps {
  board: number[][];          // 0=空, 1=黑, 2=白
  myColor: 1 | 2;
  currentTurn: 1 | 2;
  winningLine: [number, number][] | null;
  onPlaceStone: (row: number, col: number) => void;
}
```

#### 5. WebSocket Hook（`useGomokuSocket`）

```typescript
function useGomokuSocket(url: string): {
  sendMessage: (msg: ClientMessage) => void;
  lastMessage: ServerMessage | null;
  connected: boolean;
}
```

---

## 数据模型

### 后端数据模型

#### `GameRoom`（内存对象）

```java
public class GameRoom {
    String roomCode;
    WebSocketSession blackPlayer;   // 先手，黑棋
    WebSocketSession whitePlayer;   // 后手，白棋
    int[][] board;                  // 15x15，0=空，1=黑，2=白
    int currentTurn;                // 1=黑棋回合，2=白棋回合
    GameStatus status;              // WAITING / PLAYING / FINISHED
}

public enum GameStatus { WAITING, PLAYING, FINISHED }
```

#### `PlaceResult`

```java
public record PlaceResult(
    boolean success,
    String errorMessage,   // 失败时的错误描述
    WinResult winResult    // 落子后的胜负结果（可为 null）
) {}
```

#### `WinResult`

```java
public record WinResult(
    boolean hasWinner,
    int winner,                        // 1=黑棋赢，2=白棋赢，0=平局
    List<int[]> winningLine            // 获胜的五个棋子坐标
) {}
```

### WebSocket 消息协议

所有消息均为 JSON 格式，包含 `type` 字段用于路由。

#### 客户端 → 服务端消息

```typescript
// 创建房间
{ type: "CREATE_ROOM" }

// 加入房间
{ type: "JOIN_ROOM", roomCode: "ABC123" }

// 落子
{ type: "PLACE_STONE", row: 7, col: 7 }

// 再来一局
{ type: "REMATCH" }
```

#### 服务端 → 客户端消息

```typescript
// 房间创建成功
{ type: "ROOM_CREATED", roomCode: "ABC123" }

// 游戏开始
{ type: "GAME_START", myColor: 1, currentTurn: 1 }
// myColor: 1=黑棋, 2=白棋

// 落子同步
{ type: "STONE_PLACED", row: 7, col: 7, color: 1, currentTurn: 2 }

// 游戏结束
{ type: "GAME_OVER", winner: 1, winningLine: [[7,3],[7,4],[7,5],[7,6],[7,7]], isDraw: false }

// 对手断线
{ type: "PLAYER_DISCONNECT" }

// 错误消息
{ type: "ERROR", message: "房间不存在" }
```

---

## 正确性属性

*属性是在系统所有合法执行中都应成立的特征或行为——本质上是对系统应做什么的形式化陈述。属性是人类可读规范与机器可验证正确性保证之间的桥梁。*

### 属性 1：房间码格式不变量

*对任意*调用 `generateRoomCode()` 的结果，生成的字符串都应满足：长度为 6，且每个字符都属于大写字母（A-Z）或数字（0-9）。

**验证：需求 1.1**

---

### 属性 2：创建者始终为黑棋

*对任意* WebSocket Session 调用 `createRoom()`，创建后该 Session 在房间中的颜色应为黑棋（`color == 1`），且房间状态为 `WAITING`。

**验证：需求 1.2**

---

### 属性 3：加入者始终为白棋

*对任意*处于 `WAITING` 状态的房间，第二个 Session 调用 `joinRoom()` 后，该 Session 在房间中的颜色应为白棋（`color == 2`），且房间状态变为 `PLAYING`。

**验证：需求 2.1**

---

### 属性 4：游戏开始消息完整性

*对任意*两名玩家成功加入同一房间的情况，双方都应收到 `GAME_START` 消息，且消息中包含 `myColor` 和 `currentTurn` 字段，且两人的 `myColor` 互不相同（一黑一白）。

**验证：需求 2.2**

---

### 属性 5：合法落子后棋盘状态更新

*对任意*合法坐标 `(row, col)`（0 ≤ row < 15，0 ≤ col < 15），在该位置为空且轮到当前玩家时，落子后棋盘 `board[row][col]` 应等于该玩家的颜色值，且双方都收到 `STONE_PLACED` 广播消息。

**验证：需求 3.2**

---

### 属性 6：越界坐标始终被拒绝

*对任意*坐标 `(row, col)` 满足 `row < 0 || row >= 15 || col < 0 || col >= 15`，`validateAndPlace()` 应返回失败结果，且棋盘状态不发生任何变化。

**验证：需求 3.6**

---

### 属性 7：胜负检测正确性

*对任意*棋盘状态，若在 `(row, col)` 落下颜色为 `c` 的棋子后，横、竖、左斜、右斜任意方向存在连续 5 枚或以上同色棋子，则 `checkWin()` 应返回 `hasWinner=true` 且 `winner=c`；否则返回 `hasWinner=false`。

**验证：需求 4.1**

---

### 属性 8：断线通知可靠性

*对任意*处于 `PLAYING` 状态的房间，当其中一名玩家的 Session 断开时，另一名玩家应收到 `PLAYER_DISCONNECT` 消息，且房间最终被销毁（从 `RoomManager` 中移除）。

**验证：需求 5.1**

---

### 属性 9：棋盘尺寸计算不变量

*对任意*窗口尺寸 `(windowWidth, windowHeight)`，计算出的棋盘边长应满足：`boardSize <= min(windowWidth, windowHeight) * 0.9`，且格距 `cellSize = boardSize / 14` 为正数。

**验证：需求 6.6**

---

## 错误处理

### 后端错误处理策略

| 错误场景 | 处理方式 | 返回消息 |
|---------|---------|---------|
| 房间码不存在 | 向请求方发送 ERROR | `{ type: "ERROR", message: "房间不存在" }` |
| 房间已满（已有两人） | 向请求方发送 ERROR | `{ type: "ERROR", message: "房间已满" }` |
| 非当前行棋方落子 | 忽略，向请求方发送 ERROR | `{ type: "ERROR", message: "不是你的回合" }` |
| 落子位置已有棋子 | 忽略，向请求方发送 ERROR | `{ type: "ERROR", message: "该位置已有棋子" }` |
| 落子坐标越界 | 忽略，向请求方发送 ERROR | `{ type: "ERROR", message: "落子位置非法" }` |
| 玩家断线（游戏中） | 通知对方，销毁房间 | `{ type: "PLAYER_DISCONNECT" }` |
| 玩家断线（等待中） | 直接销毁房间 | 无需通知 |
| JSON 解析失败 | 向请求方发送 ERROR | `{ type: "ERROR", message: "消息格式错误" }` |
| 服务器内部异常 | 捕获异常，向请求方发送 ERROR | `{ type: "ERROR", message: "服务器内部错误" }` |

### 前端错误处理策略

- WebSocket 连接失败：显示错误提示，提供重试按钮。
- 收到 `ERROR` 消息：在当前视图内显示错误文字（不跳转页面）。
- WebSocket 意外断开：显示"连接已断开"提示，返回大厅视图。
- 收到 `PLAYER_DISCONNECT`：显示"对手已断线，游戏结束"，提供返回主菜单按钮。

---

## 测试策略

### 后端单元测试（JUnit 5）

使用 JUnit 5 + Mockito，重点测试 `GameEngine` 和 `RoomManager` 的纯逻辑。

**`GameEngineTest`**：
- 测试各方向五连检测（横、竖、左斜、右斜）
- 测试边界情况：棋盘边缘的五连
- 测试平局检测（225 子全满）
- 测试越界坐标拒绝

**`RoomManagerTest`**：
- 测试房间码格式（正则匹配 `[A-Z0-9]{6}`）
- 测试创建者为黑棋、加入者为白棋
- 测试房间满员拒绝
- 测试断线后房间销毁

### 后端属性测试（jqwik）

使用 [jqwik](https://jqwik.net/)（Java 属性测试库）实现以下属性测试，每个属性最少运行 100 次：

- **属性 1**：房间码格式不变量 — 生成 100+ 个房间码，验证全部匹配 `[A-Z0-9]{6}`
- **属性 6**：越界坐标始终被拒绝 — 生成 100+ 个越界坐标，验证全部被拒绝
- **属性 7**：胜负检测正确性 — 生成随机棋盘状态（含各方向五连），验证检测结果正确

每个属性测试注释格式：
```java
// Feature: online-gomoku, Property 1: 房间码格式不变量
@Property(tries = 200)
void roomCodeFormatInvariant(@ForAll @StringLength(6) String ignored) { ... }
```

### 前端测试

前端以手动测试为主（Canvas 渲染无法自动化验证视觉效果），辅以以下自动化测试：

- **状态机测试**（Jest）：验证 `PageState` 在各消息触发下的正确转换
- **棋盘尺寸计算测试**（Jest）：验证属性 9（尺寸计算不变量）
- **消息解析测试**（Jest）：验证各类服务端消息被正确解析

### 集成测试

- 使用 Spring Boot Test + `@SpringBootTest` 启动完整应用
- 使用 `StandardWebSocketClient` 模拟两个客户端完成完整对局流程
- 验证：创建房间 → 加入房间 → 落子 → 胜负判断 → 断线处理 全流程
