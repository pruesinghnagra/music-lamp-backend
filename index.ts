import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";

import spotifyRoutes from "./routes/spotify.js";

dotenv.config();

const app = Fastify({ logger: true });

app.register(cors, {
    origin: true,
    credentials: true,
});

app.register(spotifyRoutes);

export default async (req: any, res: any) => {
    await app.ready();
    app.server.emit("request", req, res);
};
