# 🍕 FoodTrack — Real-time Order Tracking

A full-stack food-ordering app where **every order moves live** — customers watch their food go from _placed_ → _confirmed_ → _preparing_ → _on the way_ → _delivered_ in real time, while admins manage the whole kitchen from a live dashboard. No refresh, no polling — pure **Socket.IO**.

🔗 **Live:** [exploring-socket-io.vercel.app](https://exploring-socket-io.vercel.app)
📦 **Repo:** [github.com/Hridoykhan4/Exploring-SocketIO](https://github.com/Hridoykhan4/Exploring-SocketIO)

---

## Why this project

Built to go past "hello world" sockets and use Socket.IO the way production apps do — **rooms, acknowledgements, role-based broadcasting, and authenticated events** — wired into a real ordering flow with a database behind it.

---

## 🔌 Socket.IO skills demonstrated

| Concept | Where it's used |
|---|---|
| **Acknowledgements** (request/response over WebSocket) | Every client event takes a `callback` — `placeOrder`, `trackOrder`, `adminLogin`… return `{ success, ... }` instead of fire-and-forget |
| **Rooms** | `order-<id>` (one room per order), `admins`, `customers` — so updates reach exactly who needs them |
| **Targeted broadcast** | `io.to('admins').emit('newOrder')` pushes a new order only to logged-in admins |
| **Sender exclusion** | `socket.to('admins').emit(...)` notifies *other* admins, not the one who acted |
| **Per-socket auth** | `socket.isAdmin` flag set on login; admin events reject unauthorized sockets |
| **Live fan-out** | A single status change emits to the order's room (customer) **and** the admin room at once |
| **Resilient client** | Singleton client, `websocket` transport with `polling` fallback, auto reconnect |

### Event reference

**Client → Server** (all with ack callback)
`placeOrder` · `trackOrder` · `cancelOrder` · `getMyOrders` · `adminLogin` · `getAllOrders` · `acceptOrder` · `rejectOrder` · `updateOrderStatus` · `setEstimatedTime` · `getLiveStats`

**Server → Client**
`connected` · `newOrder` · `orderAccepted` · `orderRejected` · `orderCancelled` · `statusUpdated` · `estimatedTimeUpdated` · `orderStatusChanged`

---

## ✨ Features

**Customer**
- Browse menu by category, cart with live totals (tax + delivery), localStorage-persisted
- Place an order and get dropped straight into a **live tracking** page
- Animated progress timeline, estimated-time updates, cancel while pending/confirmed
- Order history by phone number

**Admin**
- Password-gated dashboard with **live stats** (today's orders, pending, in-kitchen, delivered)
- New orders arrive instantly with a sound cue
- Accept / reject, advance status, set delivery estimate — all reflected on the customer's screen in real time

---

## 🏗️ Architecture (MVC)

```
backend/
├── server.js              # bootstrap: Express + Socket.IO + Mongo
├── routes/                # URL → controller wiring (REST)
├── controllers/           # REST request handling
├── models/orderModel.js   # data layer — all MongoDB access lives here
├── socket/orderHandler.js # real-time controller — listens to events, calls model
├── utils/helper.js        # validation, totals, order-id, status transitions
└── config/database.js     # Mongo connection lifecycle

frontend/
├── hooks/useSocket.jsx    # single shared socket connection
├── components/Customer/   # Menu, Cart, OrderForm, OrderTracking, OrderHistory
├── components/Admin/      # Dashboard, OrderCard, OrderDetails, Login
└── components/Common/     # Header, Notification, ConnectionStatus
```

Data access (Model), request/event handling (Controller), and the React UI (View) are kept separate so logic stays testable and the socket layer stays thin.

---

## 🛠️ Tech stack

**Backend:** Node.js · Express 5 · Socket.IO 4 · MongoDB
**Frontend:** React 19 · React Router 7 · Tailwind CSS 4 · Vite · Socket.IO client

---

## 🚀 Getting started

```bash
# Backend
cd backend
npm install
npm run dev            # nodemon on PORT (default 5000)

# Frontend
cd frontend
npm install
npm run dev            # Vite dev server
```

**`backend/.env`**
```env
PORT=5000
MONGODB_URI=<your-mongodb-atlas-uri>
ADMIN_PASSWORD=<admin-password>
CLIENT_URL=<frontend-origin>   # locks down CORS in production
```

**`frontend/.env.local`**
```env
VITE_SOCKET_URL=http://localhost:5000
```

---

Built by [**Hridoy**](https://github.com/Hridoykhan4) — learning Socket.IO by shipping something real.
