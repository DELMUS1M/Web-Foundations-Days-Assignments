# TicketHub System Design & Architecture Specification

## 1. Requirements

### Functional Requirements
- **Browse & Search Events:** Users can search and filter upcoming concerts, sports, and theatre events by category, location, and date.
- **Interactive Seat Map & Selection:** Users can view real-time seat maps for an event showing seat status (`AVAILABLE`, `HELD`, `SOLD`).
- **Temporary Seat Hold:** Users can hold up to 4 selected seats for a strict 10-minute reservation window during checkout.
- **Payment & Order Checkout:** Users can securely purchase held seats using credit cards/payment gateways.
- **Digital Ticket Management:** Users can view purchased tickets, generate mobile QR codes, and receive email receipts.

### Non-Functional Requirements
- **Speed & Low Latency:** Event browsing and seat map queries must respond in under 50ms, even during peak traffic.
- **Strict Correctness (Zero Double-Booking):** The system must guarantee with 100% mathematical certainty that no seat is sold or held by two users simultaneously.
- **Fairness:** Flash sales must operate on a strict First-Come, First-Served (FCFS) model using a virtual queue, preventing bot abuse and request starvation.
- **High Availability & Fault Tolerance:** The core browsing and queueing services must maintain 99.99% uptime during high-concurrency ticket drops.

---

## 2. Traffic & Load Estimates

### Base Inputs & Facts
- **Registered Users:** 2,000,000 (2 Million)
- **Normal Day Traffic:** 50,000 visitors/day viewing 10 pages each = 500,000 page views/day.
- **Normal Daily Ticket Sales:** 5,000 tickets sold/day.
- **Flash Sale Event ("Big Sale"):** 200,000 users compete for 20,000 seats for a popular concert within the first 10 minutes (600 seconds).

### Throughput Calculations

#### A. Normal Daily Traffic
- **Page Views / Reads per Second:**
  $$\text{Average Reads/sec} = \frac{500,000 \text{ pages}}{86,400 \text{ seconds}} \approx 5.79 \text{ RPS}$$
- **Ticket Sales / Writes per Second:**
  $$\text{Average Writes/sec} = \frac{5,000 \text{ sales}}{86,400 \text{ seconds}} \approx 0.058 \text{ WPS}$$

#### B. "Big Sale" Peak Flash Traffic (10-Minute Spike)
- **Concurrent Active Users:** 200,000 users active in a 600-second window (avg 333 new users/sec entering).
- **Peak Reads per Second (Seat Map Refreshes):**
  Assuming each user refreshes the interactive seat map 5 times during the 10 minutes:
  $$\text{Peak Reads} = 200,000 \times 5 = 1,000,000 \text{ requests in 600s} \approx 1,666.67 \text{ RPS}$$
- **Peak Writes / Hold Requests per Second:**
  All 200,000 users attempt to reserve a seat almost immediately:
  $$\text{Peak Hold Attempts/sec} = \frac{200,000 \text{ attempts}}{600 \text{ seconds}} \approx 333.33 \text{ WPS}$$

#### C. Traffic Comparison Analysis
| Metric | Normal Day Traffic | Big Sale Flash Traffic | Multiplier / Spike |
| :--- | :--- | :--- | :--- |
| **Active Users** | 50,000 / day | 200,000 / 10 mins | **~576× rate spike** |
| **Read Requests (RPS)** | 5.79 RPS | 1,666.67 RPS | **~288× read spike** |
| **Write/Hold Requests (WPS)** | 0.058 WPS | 333.33 WPS | **~5,747× write spike** |

---

## 3. API Design

### Base Path: `/api/v1`

#### 1. `GET /api/v1/events`
- **Description:** Browse and search upcoming events with pagination and filters.
- **Query Params:** `category`, `search`, `page`, `limit`
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "event_id": "evt_101",
        "title": "Coldplay World Tour",
        "venue": "Wembley Stadium",
        "event_date": "2026-11-15T20:00:00Z",
        "available_seats": 20000
      }
    ]
  }
  ```

#### 2. `GET /api/v1/events/{id}/seats`
- **Description:** Fetch seat map layout and real-time status for an event.
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "event_id": "evt_101",
    "seats": [
      { "seat_id": "s_1001", "section": "A", "number": "12", "price": 150.00, "status": "AVAILABLE" },
      { "seat_id": "s_1002", "section": "A", "number": "13", "price": 150.00, "status": "HELD" }
    ]
  }
  ```

#### 3. `POST /api/v1/events/{id}/holds`
- **Description:** Request a temporary 10-minute hold on selected seats.
- **Request Body:**
  ```json
  {
    "seat_ids": ["s_1001"]
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "hold_id": "hld_99823",
    "seat_ids": ["s_1001"],
    "expires_at": "2026-09-30T14:54:38Z",
    "ttl_seconds": 600
  }
  ```

#### 4. `POST /api/v1/orders/checkout`
- **Description:** Complete payment and convert held seats into confirmed ticket orders.
- **Request Body:**
  ```json
  {
    "hold_id": "hld_99823",
    "payment_token": "tok_visa_4444"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "order_id": "ord_77102",
    "tickets": [
      { "ticket_id": "tkt_5501", "seat_id": "s_1001", "qr_code": "https://cdn.tickethub.com/qr/tkt_5501.png" }
    ]
  }
  ```

#### 5. `GET /api/v1/users/tickets`
- **Description:** Retrieve purchased tickets for the authenticated user.
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "order_id": "ord_77102",
        "event_title": "Coldplay World Tour",
        "venue": "Wembley Stadium",
        "seat": "Section A, Row 1, Seat 12",
        "qr_code_url": "https://cdn.tickethub.com/qr/tkt_5501.png"
      }
    ]
  }
  ```

---

## 4. Data Model

```sql
PRAGMA foreign_keys = ON;

-- 1. Users Table
CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Events Table
CREATE TABLE events (
    event_id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    venue VARCHAR(150) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    total_seats INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seats Table
CREATE TABLE seats (
    seat_id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    section VARCHAR(20) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'HELD', 'SOLD'
    held_by_user_id VARCHAR(36),
    hold_expires_at TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1, -- Optimistic concurrency lock control
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (held_by_user_id) REFERENCES users(user_id),
    UNIQUE(event_id, section, seat_number) -- Prevents duplicate seat definitions
);

-- 4. Orders Table
CREATE TABLE orders (
    order_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    event_id VARCHAR(36) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL, -- 'PENDING', 'PAID', 'FAILED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

-- 5. Tickets Table (Links Orders to Seats)
CREATE TABLE tickets (
    ticket_id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    seat_id VARCHAR(36) NOT NULL UNIQUE, -- Ensures a seat can only belong to 1 ticket
    qr_code_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id)
);
```

---

## 5. Prevention of Double-Booking (Concurrency & Constraints)

Double-booking (selling the exact same seat to two different users) is strictly prevented using a **multi-layered concurrency strategy**:

1. **Atomic Database Conditional Updates (Optimistic Concurrency Control):**
   When a user requests a seat hold, the application executes an atomic conditional SQL statement:
   ```sql
   UPDATE seats
   SET status = 'HELD',
       held_by_user_id = 'user_123',
       hold_expires_at = CURRENT_TIMESTAMP + INTERVAL '10 minutes',
       version = version + 1
   WHERE seat_id = 's_1001'
     AND (status = 'AVAILABLE' OR (status = 'HELD' AND hold_expires_at < CURRENT_TIMESTAMP))
     AND version = 1;
   ```
   If another request attempts to update the same row simultaneously, database row-level locking ensures one transaction succeeds while the second fails with `0 rows updated`.

2. **Database Hard Constraints:**
   - The `seats` table enforces a composite `UNIQUE(event_id, section, seat_number)` constraint.
   - The `tickets` table enforces a `UNIQUE(seat_id)` constraint, making it physically impossible in SQL to insert two tickets pointing to the same seat.

3. **Redis Distributed Locks with TTL:**
   Before reaching the SQL database, seat holds execute an atomic Redis Lua script using `SET seat_s_1001 user_123 NX EX 600`. The `NX` flag guarantees that only the first request sets the key, while `EX 600` automatically releases the hold if payment is not completed in 10 minutes.

---

## 6. Architecture Diagram & Flash Sale Strategy

```text
                                  +-------------------+
                                  |    Client App     |
                                  +---------+---------+
                                            |
                                            v
                                  +-------------------+
                                  | Virtual Queue /   |  <--- Cloudflare / Redis Waiting Room
                                  | Traffic Limiter   |       (Throttles 200k users to 1k RPS)
                                  +---------+---------+
                                            |
                                            v
                                  +-------------------+
                                  |   Load Balancer   |  <--- AWS ALB
                                  +---------+---------+
                                            |
                       +--------------------+--------------------+
                       |                                         |
                       v                                         v
             +-------------------+                     +-------------------+
             |   App Server 1    |                     |   App Server 2    |
             |  (Node.js REST)   |                     |  (Node.js REST)   |
             +---------+---------+                     +---------+---------+
                       |                                         |
         +-------------+-------------+                           |
         |                           |                           |
         v                           v                           v
+-----------------+        +------------------+         +-------------------+
| Cache (Redis)   |        | Primary Database |         | Payment Gateway   |
| (Locks & Holds) |        | (PostgreSQL)     |         | (Stripe API)      |
+-----------------+        +--------+---------+         +-------------------+
                                    |
                                    v
                           +------------------+
                           | Read Replicas    |  <--- Serves Seat Map Read Queries
                           | (PostgreSQL)     |
                           +------------------+
```

### How the Architecture Survives the Big Sale:
1. **Virtual Waiting Room / Token Bucket:** During flash sales, 200,000 incoming users are held in a virtual queue (Redis queue/Cloudflare Waiting Room). Users are admitted into the checkout flow in controlled batches (e.g., 500 users every 10 seconds), preventing application servers and database connections from crashing under massive concurrency.
2. **Read/Write Splitting:** Interactive seat map requests (~1,667 RPS) are served entirely from in-memory Redis caches and PostgreSQL **Read Replicas**, shielding the Primary Database from read pressure.
3. **Primary Database Protection:** Only valid hold requests from queue-admitted users touch the **Primary Database** for atomic transactional commits (~333 WPS).

---

## 7. System Trade-Offs

1. **Virtual Waiting Room UX vs. Infrastructure Stability:**
   - *Trade-off:* Forcing users into a virtual waiting queue during flash sales adds friction to the user experience. However, this protects the platform from cascading server crashes and guarantees a fair, deterministic First-Come, First-Served ticket distribution.
2. **Redis In-Memory Holds vs. Strict SQL ACID Consistency:**
   - *Trade-off:* Managing 10-minute temporary seat holds in Redis provides ultra-low latency (<5ms) and absorbs massive flash sale spikes. However, syncing Redis state back to PostgreSQL requires careful handling of edge-case TTL expiration mismatches.