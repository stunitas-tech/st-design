import type { Node, RGBA } from "@figma/rest-api-spec";
import { Api as FigmaApi } from "figma-api";
import fs from "fs";
import path from "node:path";

const TOKENS_DIR = path.join(process.cwd(), "docs/public/tokens");

type CanvasWithChildren = Node & { children?: Node[] };

type NodeWithChildren = Node & {
    children?: NodeWithChildren[];
    characters?: string;
};

function writeTokens(name: string, data: unknown) {
    fs.mkdirSync(TOKENS_DIR, { recursive: true });

    fs.writeFileSync(
        path.join(TOKENS_DIR, `${name}.json`),
        JSON.stringify(data, null, 2),
    );
}

function writeIndex(files: string[]) {
    const index = {
        resources: files.map((f) => ({ path: `/${f}.json`, name: f })),
    };

    fs.writeFileSync(
        path.join(TOKENS_DIR, "index.json"),
        JSON.stringify(index, null, 2),
    );
}

// 텍스트 검색 (별칭 패턴 대응)
function findText(
    node: NodeWithChildren,
    pattern: string = "#",
): string | undefined {
    const texts: string[] = [];

    function walk(n: NodeWithChildren) {
        if (n.type === "TEXT" && typeof n.characters === "string") {
            texts.push(n.characters.trim());
        }
        for (const child of n.children ?? []) {
            walk(child);
        }
    }

    walk(node);

    // 패턴(예: '#', '@')이 있으면 해당 텍스트 우선 반환
    if (pattern) {
        const matched = texts.find((t) => t.startsWith(pattern));
        if (matched) return matched;
    }

    return texts[0]; // 없으면 첫 번째 텍스트
}

function findAlias(node: NodeWithChildren): string | undefined {
    function walk(n: NodeWithChildren): string | undefined {
        if (!n.children) return;

        for (let i = 0; i < n.children.length; i++) {
            const child = n.children[i];

            if (
                child.type === "TEXT" &&
                child.characters?.trim() === "Alias:"
            ) {
                const next = n.children[i + 1];

                let value: string | undefined;

                if (next?.type === "TEXT") {
                    value = next.characters.trim();
                } else if (next) {
                    value = findText(next);
                }

                // ✅ 여기 핵심 필터
                if (!value || value === "Alias name") {
                    return undefined;
                }

                return value;
            }

            const found = walk(child);
            if (found !== undefined) return found;
        }
    }

    return walk(node);
}

// Row 파싱
function parseRow(row: NodeWithChildren) {
    let name: string | undefined;
    let type: string | undefined;
    let value: string | undefined;
    let alias: string | undefined;

    for (const cell of row.children ?? []) {
        if (cell.type !== "INSTANCE") continue;

        if (cell.name.toLowerCase().includes("name")) {
            name = findText(cell);
        }

        if (cell.name.toLowerCase().includes("type")) {
            type = findText(cell);
        }

        if (cell.name.toLowerCase().includes("value")) {
            value = findText(cell);

            alias = findAlias(cell) ?? undefined;
        }
    }

    if (!name && !type && !value) return null;

    return { name, type, value, alias };
}

// Row All
function extractPaletteRows(collectionPalette: NodeWithChildren) {
    return (collectionPalette.children ?? [])
        .filter((node) => node.type === "FRAME" && node.name === "Row")
        .map(parseRow)
        .filter(Boolean);
}

const FIGMA_TOKEN = process.env.FIGMA_PERSONAL_ACCESS_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;

// if (!FIGMA_TOKEN || !FIGMA_FILE_KEY) {
//   throw new Error("Missing FIGMA_PERSONAL_ACCESS_TOKEN or FIGMA_FILE_KEY");
// }

function rgbaToHex({ r, g, b }: RGBA) {
    const toHex = (v: number) =>
        Math.round(v * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const TEMP_TOKENS_DIR = path.join(process.cwd(), "docs/public/tokens_tmp");

/**
 * 임시 디렉토리 및 기존 파일 교체 로직
 */
async function finalizeTokens(savedFiles: string[]) {
    try {
        // 1. 기존 tokens 폴더에서 index.json을 제외한 파일 삭제
        const files = fs.readdirSync(TOKENS_DIR);
        for (const file of files) {
            if (file !== "index.json") {
                fs.unlinkSync(path.join(TOKENS_DIR, file));
            }
        }

        // 2. 임시 폴더의 파일들을 실제 폴더로 이동
        const tempFiles = fs.readdirSync(TEMP_TOKENS_DIR);
        for (const file of tempFiles) {
            fs.renameSync(
                path.join(TEMP_TOKENS_DIR, file),
                path.join(TOKENS_DIR, file),
            );
        }

        // 3. index.json 업데이트
        writeIndex(savedFiles);

        // 4. 임시 폴더 삭제
        fs.rmSync(TEMP_TOKENS_DIR, { recursive: true, force: true });

        console.log("✨ 안전하게 모든 토큰이 교체되었습니다.");
    } catch (err) {
        console.error("파일 교체 중 오류 발생:", err);
    }
}

export async function figmaToToken() {
    if (!FIGMA_TOKEN || !FIGMA_FILE_KEY) {
        console.warn("환경변수가 설정되지 않았습니다.");
        return [];
    }

    // 작업 시작 전 임시 폴더 생성 (깨끗한 상태로)
    if (fs.existsSync(TEMP_TOKENS_DIR)) {
        fs.rmSync(TEMP_TOKENS_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_TOKENS_DIR, { recursive: true });

    const api = new FigmaApi({ personalAccessToken: FIGMA_TOKEN });

    try {
        console.log("🚀 Figma에서 데이터를 가져오는 중...");
        const file = await api.getFile({ file_key: FIGMA_FILE_KEY });

        const variablesFrame = file.document.children
            .flatMap((page: any) =>
                page.type === "CANVAS" ? (page.children ?? []) : [],
            )
            .find(
                (node: any) =>
                    node.type === "FRAME" &&
                    node.name === "Variables Documentation",
            ) as CanvasWithChildren;

        if (!variablesFrame || !variablesFrame.children) {
            throw new Error(
                "'Variables Documentation' 프레임을 찾을 수 없습니다.",
            );
        }

        const savedFiles: string[] = [];

        variablesFrame.children.forEach((node) => {
            if (node.type !== "FRAME") return;

            const collectionNode = node as NodeWithChildren;
            const rows = extractPaletteRows(collectionNode);

            if (rows && rows.length > 0) {
                const fileName = node.name
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "-");

                // ✅ 실제 폴더가 아닌 임시 폴더에 먼저 씁니다.
                fs.writeFileSync(
                    path.join(TEMP_TOKENS_DIR, `${fileName}.json`),
                    JSON.stringify(rows, null, 2),
                );
                savedFiles.push(fileName);
                console.log(`📦 [임시 저장] ${fileName}.json`);
            }
        });

        // 4️⃣ 모든 데이터가 성공적으로 준비되었을 때만 실제 폴더 교체
        if (savedFiles.length > 0) {
            await finalizeTokens(savedFiles);
        } else {
            console.warn("추출된 데이터가 없어 교체를 중단합니다.");
            fs.rmSync(TEMP_TOKENS_DIR, { recursive: true, force: true });
        }

        return savedFiles;
    } catch (error) {
        // ❌ 에러 발생 시: 임시 폴더만 지우고 종료 (기존 데이터 보존)
        console.error("❌ 작업 중 에러 발생. 기존 데이터를 보존합니다.");
        console.error("사유:", error instanceof Error ? error.message : error);

        if (fs.existsSync(TEMP_TOKENS_DIR)) {
            fs.rmSync(TEMP_TOKENS_DIR, { recursive: true, force: true });
        }
        return [];
    }
}

figmaToToken();
