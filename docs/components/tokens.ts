import fs from "node:fs/promises";
import path from "node:path";

type TokenIndex = {
    resources: { path: string }[];
};

type Token = {
    name: string;
    value: string;
};

export async function getTokens(): Promise<Token[]> {
    const baseDir = path.join(process.cwd(), "public/tokens");

    // 1️⃣ index.json 읽기
    const indexRaw = await fs.readFile(
        path.join(baseDir, "index.json"),
        "utf-8"
    );
    const index: TokenIndex = JSON.parse(indexRaw);

    // 2️⃣ 각 token 파일 읽기
    const files = await Promise.all(
        index.resources.map(async (resource) => {
            const filePath = path.join(baseDir, resource.path);
            const raw = await fs.readFile(filePath, "utf-8");
            return JSON.parse(raw) as Token[];
        })
    );

    // 3️⃣ 하나로 합침
    return files.flat();
}
