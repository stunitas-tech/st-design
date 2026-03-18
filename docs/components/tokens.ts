import fs from "node:fs/promises";
import path from "node:path";

type TokenIndex = {
    resources: { path: string; name: string }[]; // name 추가
};

export type Token = {
    type: string;
    name: string;
    value: string;
    alias?: string;
};

// 반환 타입을 각 name이 키가 되는 객체 타입으로 정의
type TokenMap = { [key: string]: Token[] };

export async function getTokens(): Promise<TokenMap> {
    const baseDir = path.join(process.cwd(), "public/tokens");

    // 1️⃣ index.json 읽기
    const indexRaw = await fs.readFile(
        path.join(baseDir, "index.json"),
        "utf-8",
    );
    const index: TokenIndex = JSON.parse(indexRaw);

    // 2️⃣ 각 token 파일 읽기 (비동기 병렬 처리)
    const tokenEntries = await Promise.all(
        index.resources.map(async (resource) => {
            const filePath = path.join(baseDir, resource.path);
            const raw = await fs.readFile(filePath, "utf-8");
            const data = JSON.parse(raw) as Token[];

            // [name, data] 형태의 튜플로 반환하여 나중에 객체로 만들기 쉽게 함
            return [resource.name, data] as const;
        }),
    );

    // 3️⃣ 배열을 객체로 변환 { palette: [...], palette2: [...] }
    const variables = Object.fromEntries(tokenEntries);
    return variables;
}
