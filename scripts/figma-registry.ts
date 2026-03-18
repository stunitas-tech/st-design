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

export async function figmaToToken() {
    if (!FIGMA_TOKEN || !FIGMA_FILE_KEY) {
        console.warn("환경변수가 설정되지 않았습니다.");
        return [];
    }

    const api = new FigmaApi({ personalAccessToken: FIGMA_TOKEN });

    try {
        const file = await api.getFile({ file_key: FIGMA_FILE_KEY });

        // 1️⃣ 'Variables Documentation' 프레임 찾기
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
            console.warn(
                "'Variables Documentation' 프레임을 찾을 수 없습니다.",
            );
            return [];
        }

        // 2️⃣ 추출할 대상 정의 (프레임 이름 : 저장할 파일 이름)
        const targetCollections = [
            { frameName: "Collection Palette", fileName: "palette" },
            { frameName: "Collection Semantic Color", fileName: "semantic" },
            { frameName: "Collection Dimension", fileName: "dimension" },
        ];

        const savedFiles: string[] = [];

        // 3️⃣ 각 컬렉션을 순회하며 데이터 추출 및 저장
        targetCollections.forEach(({ frameName, fileName }) => {
            const collectionNode = variablesFrame.children?.find(
                (n) => n.type === "FRAME" && n.name === frameName,
            ) as NodeWithChildren;

            if (collectionNode) {
                const rows = extractPaletteRows(collectionNode);

                // 4️⃣ 데이터가 성공적으로 존재할 때만 파일 저장
                if (rows && rows.length > 0) {
                    writeTokens(fileName, rows);
                    savedFiles.push(fileName); // 인덱스에 추가할 파일 목록
                    console.log(
                        `✅ ${frameName} 추출 성공: ${fileName}.json 저장됨`,
                    );
                } else {
                    console.warn(
                        `⚠️ ${frameName}에 유효한 Row 데이터가 없습니다.`,
                    );
                }
            } else {
                console.warn(
                    `❓ ${frameName} 프레임을 찾을 수 없어 건너뜁니다.`,
                );
            }
        });

        // 5️⃣ 성공한 파일들만 모아서 index.json 업데이트
        if (savedFiles.length > 0) {
            writeIndex(savedFiles);
            console.log("--- 모든 작업 완료 ---");
        } else {
            console.log("--- 저장된 토큰 파일이 없습니다 ---");
        }

        return savedFiles;
    } catch (error) {
        console.warn("Figma 파일를 가져오는데 실패했습니다:", error);
        return [];
    }
}

figmaToToken();
