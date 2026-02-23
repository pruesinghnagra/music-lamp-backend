import type { NextApiRequest, NextApiResponse } from "next";
import { setCorsHeaders } from "@lib/cors";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    setCorsHeaders(res, req.headers.origin, [
        "GET",
        "POST",
        "OPTIONS",
    ]);

    const { method, body } = req;

    if (method === "OPTIONS") {
        res.setHeader("Allow", "GET,POST,OPTIONS");
        return res.status(204).end();
    }

    if (method === "POST") {
        const { password } = body;
        if (password === process.env.ADMIN_PASS) {
            res.setHeader(
                "Set-Cookie",
                `admin_session=true; HttpOnly; Path=/; SameSite=Strict; ${
                    process.env.NODE_ENV === "production" ? "Secure;" : ""
                }`,
            );
            return res.status(200).json({ ok: true });
        } else {
            return res.status(401).json({
                ok: false,
                error: "Invalid password",
            });
        }
    }
}
