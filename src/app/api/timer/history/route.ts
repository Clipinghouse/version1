import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const today = new Date().toISOString().split("T")[0];

        // Get all completed past days (not today) + today's record
        const records = await prisma.dailyTimer.findMany({
            orderBy: { date: "desc" },
        });

        // For each record, compute final seconds (account for still-running timer on today)
        const data = records.map((r) => {
            let secs = r.seconds;
            if (r.date === today && r.isRunning && r.lastStartedAt) {
                secs += Math.floor((Date.now() - r.lastStartedAt.getTime()) / 1000);
            }
            return { date: r.date, seconds: secs, isRunning: r.isRunning };
        });

        return NextResponse.json(data);
    } catch (e) {
        console.error("Timer History Error", e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
