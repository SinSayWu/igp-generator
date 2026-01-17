import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const dataDir = path.join(process.cwd(), "data");
        const classes = fs.readFileSync(path.join(dataDir, "classesv2.json"), "utf8");
        return NextResponse.json(JSON.parse(classes));
    } catch (error) {
        console.error("Classes API Error:", error);
        return NextResponse.json({ error: "Failed to load classes" }, { status: 500 });
    }
}
