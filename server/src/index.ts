import "reflect-metadata"; 
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import cors from "cors";
import { HelloResolver } from "./resolvers/hello.js";
import { prisma } from "./prisma.js";        
import { ProblemResolver } from "./resolvers/problem.js";
import { UserResolver } from "./resolvers/user.js";
import { SubmissionResolver } from "./resolvers/submission.js";
import submissionRouter from "./routes/submissions";
import problemRouter from "./routes/problems";
import { initSocket } from "./socket";
import "./workers/submissionWorker";
import http from "http";

const main = async () => {
  const app = express();
  const server = http.createServer(app);

  // Initialize WebSockets real-time communication on the HTTP server
  initSocket(server);

  app.use(express.json());
  app.use(cors());

  // Register API routes
  app.use("/api", problemRouter);
  app.use("/api", submissionRouter);

  // 1. Build TypeGraphQL schema
  const schema = await buildSchema({
    resolvers: [HelloResolver, ProblemResolver, UserResolver, SubmissionResolver],
    validate: false,
  });

  // 2. Initialize Apollo Server
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res, prisma }),
  });

  await apolloServer.start();
  
  // 3. Attach Apollo Server to Express
  apolloServer.applyMiddleware({ app, path: "/graphql" } as any);

  const PORT = process.env.PORT || 5000;
  
  // CRITICAL: Must use server.listen instead of app.listen for Socket.io to work
  server.listen(PORT, () => {
    console.log(` Server ready at http://localhost:${PORT}/graphql`);
    console.log(` WebSocket & REST server active on port ${PORT}`);
  });
};

main().catch((err) => {
  console.error(err);
});