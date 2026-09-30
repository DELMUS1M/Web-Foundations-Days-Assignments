# Capstone Course Reflection

## 1. Most Difficult Concept & Overcoming It
The most challenging concept in the course was managing **distributed database concurrency and race conditions** during high-traffic flash sales. Understanding how multiple application servers can simultaneously attempt to modify the same database row—leading to double-booking anomalies—required a shift from traditional sequential programming to concurrent systems thinking. I overcame this by practicing atomic SQL conditional updates (`UPDATE ... WHERE status = 'AVAILABLE'`), studying database transaction isolation levels, and implementing Redis distributed locks with TTLs.

## 2. Capstone Project Improvements
Based on peer and instructor feedback from the Day 8 presentation, I would improve the **QuickNotes API client error handling** and **data synchronization layer**. Specifically, I would implement optimistic UI updates so user notes appear instantly before server confirmation, paired with automated retry mechanisms and backoff logic for failed network requests. Additionally, I would add offline storage caching using `IndexedDB` to allow full offline note editing.

## 3. Next Learning Goals
Moving forward, I plan to deepen my expertise in cloud-native backend architecture. My next three technical milestones are:
1. Mastering **Docker & Kubernetes** for container orchestration and auto-scaling microservices.
2. Learning **Message Brokers** like Apache Kafka and RabbitMQ for asynchronous event-driven system design.
3. Exploring **NoSQL Distributed Databases** like Cassandra and DynamoDB for global multi-region data replication.