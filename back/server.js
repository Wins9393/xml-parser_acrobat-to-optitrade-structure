import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import { processOptitradeData } from "./optitrade-controller.js";
import { processCentropData } from "./centrop-controller.js";

const fastify = Fastify({
  logger: true,
});

fastify.register(fastifyMultipart);

await fastify.register(cors, {
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-requested-with", "Content-Disposition"],
  exposedHeaders: ["Content-Disposition"],
  preflightContinue: true,
});

const PORT = 5555;

fastify.post("/api/structure-optitrade-xml", processOptitradeData);
fastify.post("/api/structure-centrop-xml", processCentropData);

const start = async (PORT) => {
  try {
    await fastify.listen({ port: PORT });
    console.log(`back is running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(PORT);
