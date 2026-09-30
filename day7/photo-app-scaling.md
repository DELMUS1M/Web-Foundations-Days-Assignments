# SnapShare System Architecture & Scaling Plan

## 1. System Assumptions & Calculations

### Core Facts
- **Registered Users:** 10,000,000 (10 Million)
- **Daily Active User (DAU) Ratio:** 10%
- **Daily Active Users (DAU):** $10,000,000 \times 0.10 = 1,000,000$ (1 Million DAU)
- **Daily Photo Uploads per Active User:** 1 photo/day
- **Daily Feed Views per Active User:** 50 feed views/day
- **Photo File Sizes:** 
  - Original Photo: 2 MB
  - Generated Thumbnail: 50 KB (0.05 MB)
  - Total storage required per upload: 2.05 MB

---

### Traffic Calculations

1. **Uploads per Second:**
   - **Total Daily Uploads:** $1,000,000 \text{ uploads/day}$
   - **Average Uploads/sec:** $\frac{1,000,000}{86,400 \text{ seconds}} \approx 11.57 \text{ uploads/sec}$
   - **Peak Uploads/sec ($5\times$ multiplier):** $11.57 \times 5 \approx 57.87 \text{ (approx. 58 uploads/sec)}$

2. **Feed Views per Second:**
   - **Total Daily Feed Views:** $1,000,000 \times 50 = 50,000,000 \text{ feed views/day}$
   - **Average Feed Views/sec:** $\frac{50,000,000}{86,400 \text{ seconds}} \approx 578.70 \text{ feed views/sec}$
   - **Peak Feed Views/sec ($5\times$ multiplier):** $578.70 \times 5 \approx 2,893.52 \text{ (approx. 2,894 feed views/sec)}$

3. **Photo Storage Requirements per Year:**
   - **Photos per Year:** $1,000,000 \text{ photos/day} \times 365 \text{ days} = 365,000,000 \text{ photos/year}$
   - **Storage per Photo (Original + Thumbnail):** $2.05 \text{ MB}$
   - **Total Annual Storage:** $365,000,000 \times 2.05 \text{ MB} = 748,250,000 \text{ MB} \approx 748.25 \text{ TB/year}$

---

## 2. Workload Analysis: Read-Heavy vs. Write-Heavy

The SnapShare system is **heavily read-heavy**, with a read-to-write ratio of **50:1** (50 million feed reads vs. 1 million photo uploads per day).

### Architectural Impact:
Because users query feeds 50 times more often than they upload content, the architecture must focus heavily on **read-optimization**:
- **Caching Layer:** Frequently requested feeds, user metadata, and follower graphs must be stored in memory (e.g., Redis) to bypass the database.
- **Database Read Replicas:** Database traffic is split so that heavy read queries go to distributed read replicas, shielding the primary write database.
- **Content Delivery Network (CDN):** Static image files (photos and thumbnails) must be cached globally near users so image fetches never hit app servers directly.

---

## 3. Storage Strategy: Why Photos Belong in Object Storage

Binary media files like high-resolution images (2 MB each) should **never be stored directly inside relational database tables** (e.g., as BLOB types) for the following reasons:
1. **Database Bloat & Performance Degradation:** Storing large binary files drastically expands database backups, slows down index scans, bloats buffer pools, and severely degrades query performance.
2. **Expensive Scaling:** Scaling relational databases vertically/horizontally is costly; paying database-tier pricing for static media storage is inefficient.
3. **Improper Separation of Concerns:** Relational databases excel at querying structured tabular metadata (user IDs, timestamps, image URLs), whereas Object Storage excels at serving unstructured static media files.

### Alternative Solution:
- **Object Storage (e.g., AWS S3 / Cloud Storage):** Stores the raw binary image files and thumbnails affordably with high durability and web accessibility.
- **Relational Database:** Stores light metadata records containing the Object Storage URL/path (`https://cdn.snapshare.com/photos/abc123.jpg`), `user_id`, `created_at`, and image attributes.

---

## 4. System Architecture Diagram

```text
                               +-------------------+
                               |    Client App     |
                               +---------+---------+
                                         |
                                         v
                               +-------------------+
                               |  CDN (Cloudflare) |  <--- Static Photos & Thumbnails
                               +---------+---------+
                                         |
                                         v
                               +-------------------+
                               |   Load Balancer   |
                               +---------+---------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
             +-------------------+               +-------------------+
             |   App Server 1    |               |   App Server 2    |
             +---------+---------+               +---------+---------+
                       |                                   |
         +-------------+-------------+                     |
         |                           |                     |
         v                           v                     v
+-----------------+        +------------------+   +-------------------+
| In-Memory Cache |        | Primary Database |   | Object Storage    |
| (Redis Feed)    |        | (Writes Only)    |   | (S3 Photo Bucket) |
+-----------------+        +--------+---------+   +---------+---------+
                                    |                       |
                                    v                       v
                           +------------------+   +-------------------+
                           | Read Replica     |   | Message Queue     |
                           | (Read Queries)   |   | (RabbitMQ / SQS)  |
                           +------------------+   +---------+---------+
                                                            |
                                                            v
                                                  +-------------------+
                                                  | Thumbnail Worker  |
                                                  +-------------------+
```

---

## 5. Component Descriptions

1. **CDN (Content Delivery Network):** Caches static photo files and thumbnails globally near users to minimize latency and offload image requests from application servers.
2. **Load Balancer:** Distributes incoming HTTP traffic evenly across multiple application servers to prevent any single server from becoming overloaded.
3. **App Servers:** Executes core application logic, handles authentication, coordinates uploads, queries metadata, and builds feed timelines.
4. **Cache (In-Memory Redis):** Stores frequently accessed user feed data and session states in memory to deliver lightning-fast responses without hitting the database.
5. **Primary Database (Write DB):** Handles write transactions (new users, photo metadata records, follows) and enforces ACID compliance and relational integrity.
6. **Read Replica Database:** Asynchronously mirrors the primary database to serve all read-heavy queries (user profiles, follower lists) without lock contention on the primary DB.
7. **Object Storage (e.g., AWS S3):** Stores binary photo files and generated thumbnails in a highly scalable, low-cost, distributed blob store.
8. **Message Queue (e.g., RabbitMQ / AWS SQS):** Holds background task messages asynchronously so heavy tasks like image processing do not block HTTP request threads.
9. **Thumbnail Worker:** Consumes messages from the queue to asynchronously download original photos, resize them into 50 KB thumbnails, and save them back to Object Storage.

---

## 6. Step-by-Step Photo Upload Flow

1. **Client Request:** The user selects a photo and sends an HTTP POST request containing the image binary and metadata to the Load Balancer, which forwards it to an App Server.
2. **Direct Upload to Object Storage:** The App Server uploads the raw 2 MB photo file directly to the **Object Storage** bucket and receives a unique object key/URL (`photos/photo_98765.jpg`).
3. **Database Record Creation:** The App Server writes a new photo metadata record (containing `photo_id`, `user_id`, `object_url`, `created_at`) into the **Primary Database**.
4. **Asynchronous Task Enqueueing:** The App Server pushes a job message (`{ "photo_id": 98765, "s3_url": "photos/photo_98765.jpg" }`) into the **Message Queue** and immediately responds to the user with a `201 Created` HTTP status.
5. **Background Thumbnail Processing:** 
   - A **Thumbnail Worker** pulls the message from the queue.
   - The worker fetches the original 2 MB photo from Object Storage, generates a optimized 50 KB thumbnail image, and uploads the thumbnail to Object Storage (`thumbnails/thumb_98765.jpg`).
   - The worker updates the photo's database record with the `thumbnail_url`.
6. **Cache Invalidation/Update:** The App Server or Worker updates the Redis feed cache for followers so the new photo appears instantly in their feeds.

---

## 7. System Trade-Offs

1. **Asynchronous Processing vs. Immediate Consistency (Thumbnail Availability):**
   - *Trade-off:* Generating thumbnails asynchronously via a background queue allows user upload requests to complete in milliseconds without blocking on CPU-heavy image processing. However, if a user reloads their feed immediately after uploading, the thumbnail might take a couple of seconds to render while the background worker finishes processing.
2. **Read Replica Asynchronous Replication Delay vs. Read Performance:**
   - *Trade-off:* Offloading feed reads to read replicas significantly boosts read throughput and keeps the primary database responsive. However, because replication from Primary to Read Replica is asynchronous, there may be a tiny lag (a few milliseconds) where a user's freshly uploaded photo metadata is visible on the primary DB but not yet replicated to read replicas.
