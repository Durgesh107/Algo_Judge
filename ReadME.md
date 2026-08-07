#  Full-Stack Real-Time Online Judge Platform

A production-grade, full-stack competitive programming and code execution platform inspired by platforms like LeetCode. Built with a modern tech stack focusing on high performance, asynchronous queuing, and real-time bidirectional communication.

---

##  Tech Stack

### **Frontend (`client/`)**
* **React** with **TypeScript** & **Vite**
* **Tailwind CSS** for modern, responsive UI styling
* **Monaco Editor** (`@monaco-editor/react`) for an IDE-grade code editing experience
* **Apollo Client** for efficient GraphQL query and mutation handling
* **Socket.io-client** for real-time status synchronization

### **Backend (`server/`)**
* **Node.js** & **Express**
* **GraphQL** with **Apollo Server** & **TypeGraphQL**
* **Prisma ORM** coupled with **PostgreSQL** for relational data persistence
* **Redis** for high-performance caching (Cache-Aside pattern) and message brokering
* **BullMQ** for robust, asynchronous background worker job queues for code grading
* **Socket.io** for real-time WebSocket event dispatching

---

##  Core Features

* **Interactive IDE Workspace:** Features language boilerplates (C++, JavaScript, Java), customized Monaco themes, and a `Ctrl + Enter` keyboard shortcut to submit instantly.
* **Cache-Aside Architecture:** Leverages Redis memory caching to serve problem descriptions and test cases with sub-millisecond response times, bypassing database bottlenecks.
* **Asynchronous Code Grading Pipeline:** Uses BullMQ workers to safely queue, process, and evaluate code submissions concurrently without blocking the main Express thread.
* **Real-Time Verdict Streaming:** Pushes live compilation and evaluation updates (`PENDING` $\rightarrow$ `RUNNING` $\rightarrow$ `ACCEPTED` / `WRONG_ANSWER`) directly to the client via WebSockets.
* **Sample Test Case Explorer:** Inspect test inputs and expected outputs before finalizing submissions.

---

## Project Structure

```text
Online Judge/
├── client/                # React Vite frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI elements
│   │   ├── App.tsx        # Route configurations
│   │   └── main.tsx       # Apollo Provider & Entry point
│   └── package.json
├── server/                # Express & GraphQL backend application
│   ├── src/
│   │   ├── resolvers/     # TypeGraphQL resolvers
│   │   ├── routes/        # REST endpoints (Auth, Submissions, Problems)
│   │   ├── queues/        # BullMQ queue configurations
│   │   ├── workers/       # Background grading workers
│   │   ├── redis.ts       # Centralized Redis client connection
│   │   └── index.ts       # Server entry point
│   └── prisma/            # Database schema & migrations
└── README.md
