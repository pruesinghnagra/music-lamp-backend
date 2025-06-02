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

app.listen({ port: 3001 }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Server listening at ${address}`);
});
