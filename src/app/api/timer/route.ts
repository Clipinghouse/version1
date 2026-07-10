import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const today = new Date().toISOString().split("T")[0];
    try {
        let timer = await prisma.dailyTimer.findUnique({ where: { date: today } });

        if (!timer) {
            timer = await prisma.dailyTimer.create({
                data: { date: today, seconds: 0, isRunning: false }
            });
            return NextResponse.json({ seconds: 0, isRunning: false });
        }

        let currentSeconds = timer.seconds;
        if (timer.isRunning && timer.lastStartedAt) {
            const elapsed = Math.floor((new Date().getTime() - timer.lastStartedAt.getTime()) / 1000);
            currentSeconds += elapsed;
        }

        return NextResponse.json({ seconds: currentSeconds, isRunning: timer.isRunning });
    } catch (e) {
        console.error("Timer GET Error", e);
        return NextResponse.json({ error: "Failed to fetch timer" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const today = new Date().toISOString().split("T")[0];
    try {
        const { action, clientSeconds, date: targetDate } = await req.json();
        let timer = await prisma.dailyTimer.findUnique({ where: { date: today } });
        if (!timer) {
            timer = await prisma.dailyTimer.create({ data: { date: today, seconds: 0 } });
        }

        if (action === "PLAY") {
            if (!timer.isRunning) {
                const startSecs = clientSeconds !== undefined ? clientSeconds : timer.seconds;
                timer = await prisma.dailyTimer.update({
                    where: { date: today },
                    data: { isRunning: true, lastStartedAt: new Date(), seconds: startSecs }
                });
            }
        } else if (action === "PAUSE") {
            if (timer.isRunning) {
                let elapsed = 0;
                if (timer.lastStartedAt) {
                    elapsed = Math.floor((new Date().getTime() - timer.lastStartedAt.getTime()) / 1000);
                }
                const serverComputed = timer.seconds + elapsed;
                const newSecs = (clientSeconds !== undefined && clientSeconds > serverComputed) ? clientSeconds : serverComputed;

                timer = await prisma.dailyTimer.update({
                    where: { date: today },
                    data: { isRunning: false, lastStartedAt: null, seconds: newSecs }
                });
            } else if (clientSeconds !== undefined) {
                timer = await prisma.dailyTimer.update({
                    where: { date: today },
                    data: { seconds: clientSeconds }
                });
            }
        } else if (action === "SYNC") {
            if (timer.isRunning && clientSeconds !== undefined) {
                timer = await prisma.dailyTimer.update({
                    where: { date: today },
                    data: { seconds: clientSeconds, lastStartedAt: new Date() }
                });
            }
        } else if (action === "RESET") {
            const resetDate = targetDate ?? today;
            await prisma.dailyTimer.upsert({
                where: { date: resetDate },
                update: { seconds: 0, isRunning: false, lastStartedAt: null },
                create: { date: resetDate, seconds: 0, isRunning: false },
            });
            return NextResponse.json({ success: true, seconds: 0, isRunning: false });
        }

        let currentSeconds = timer.seconds;
        if (timer.isRunning && timer.lastStartedAt) {
            const elapsed = Math.floor((new Date().getTime() - timer.lastStartedAt.getTime()) / 1000);
            currentSeconds += elapsed;
        }

        return NextResponse.json({ success: true, seconds: currentSeconds, isRunning: timer.isRunning });
    } catch (e) {
        console.error("Timer POST Error", e);
        return NextResponse.json({ error: "Failed to update timer" }, { status: 500 });
    }
}
