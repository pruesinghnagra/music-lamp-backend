import type { NextApiRequest, NextApiResponse } from "next";

const API_KEY = process.env.API_KEY || "";

export function requireApiKey(
    req: NextApiRequest,
    res: NextApiResponse,
): boolean {
    const key = req.headers["x-api-key"];
    const host = req.headers.host || "";

    const isInternal = process.env.NODE_ENV === "development" ||
        host.includes("localhost") ||
        host.includes(process.env.VERCEL_URL || "");

    if (!isInternal && (!API_KEY || key !== API_KEY)) {
        res.status(401).json({ error: "Unauthorized" });
        return false;
    }
    return true;
}
