import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { password } = req.body;

    if (password === process.env.ADMIN_PASS) {
        return res.status(200).json({ ok: true });
    }

    return res.status(401).json({ ok: false, error: "Invalid password" });
}
