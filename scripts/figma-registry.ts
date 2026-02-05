import type { Node, RGBA } from "@figma/rest-api-spec";
import { Api as FigmaApi } from "figma-api";
import fs from "fs";
import path from "node:path";

const TOKENS_DIR = path.join(process.cwd(), "public/tokens");

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
        resources: files.map((f) => ({ path: `/${f}.json` })),
    };

    fs.writeFileSync(
        path.join(TOKENS_DIR, "index.json"),
        JSON.stringify(index, null, 2),
    );
}

// 텍스트 검색
function findText(node: NodeWithChildren): string | undefined {
    const texts: string[] = [];

    function walk(n: NodeWithChildren) {
        if (n.type === "TEXT" && typeof n.characters === "string") {
            texts.push(n.characters.trim());
        }

        for (const child of n.children ?? []) {
            walk(child);
        }
    }

    // ColorTemplate부터 내려가며 TEXT 수집
    walk(node);

    // 1️⃣ '#'으로 시작하는 텍스트 우선
    const colorText = texts.find((t) => t.startsWith("#"));
    if (colorText) return colorText;

    // 2️⃣ 없으면 첫 번째 텍스트
    return texts[0];
}

// Row 파싱
function parseRow(row: NodeWithChildren) {
    let name: string | undefined;
    let type: string | undefined;
    let value: string | undefined;

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
        }
    }

    if (!name && !type && !value) return null;

    return { name, type, value };
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
    if (!FIGMA_TOKEN) {
        console.warn(
            "FIGMA_PERSONAL_ACCESS_TOKEN 환경변수가 설정되지 않았습니다. 스타일 추출을 건너뜁니다.",
        );
        return [];
    }

    if (!FIGMA_FILE_KEY) {
        console.warn(
            "FIGMA_FILE_KEY 환경변수가 설정되지 않았습니다. 스타일 추출을 건너뜁니다.",
        );
        return [];
    }

    const api = new FigmaApi({
        personalAccessToken: FIGMA_TOKEN,
    });

    try {
        const file = await api.getFile({ file_key: FIGMA_FILE_KEY });

        // const tokenPage = file.document.children.find(
        //     (node: Node) => node.type === "CANVAS" && node.name === "Token"
        // );

        const variablesFrame = file.document.children
            .flatMap((page: Node) =>
                page.type === "CANVAS" ? (page.children ?? []) : [],
            )
            .find(
                (node: Node) =>
                    node.type === "FRAME" &&
                    node.name === "Variables Documentation",
            ) as CanvasWithChildren;

        // const palette = variablesFrame?.children?.[0] as NodeWithChildren;
        const collectionPalette = variablesFrame.children?.find(
            (n) => n.type === "FRAME" && n.name === "Collection Palette",
        ) as NodeWithChildren;

        const rows = extractPaletteRows(collectionPalette);

        // console.log(rows);
        writeTokens("colors", rows);
        writeIndex(["colors"]);
        console.log(rows);
        console.log("--- 완료 ---");
        return rows;
    } catch (error) {
        console.log(FIGMA_FILE_KEY);
        console.warn("Figma 파일를 가져오는데 실패했습니다:", error);
        return [];
    }
    // try {
    //     const {
    //         meta: { variables },
    //     } = await api.getLocalVariables({ file_key: FIGMA_FILE_KEY });
    //     console.log(variables);
    //     return Object.values(variables);
    // } catch (error) {
    //     console.warn("Figma 변수를 가져오는데 실패했습니다:", error);
    //     return [];
    // }

    //   const colors: Record<string, string> = {};

    //   Object.values(meta.variables).forEach((v: LocalVariable) => {
    //     if (v.resolvedType !== "COLOR") return;

    //     const value = Object.values(v.valuesByMode)[0] as RGBA;
    //     if (!value) return;

    //     colors[v.name.replace(/\//g, ".")] = rgbaToHex(value);
    //   });

    //   const outputPath = path.resolve("docs/public/tokens/colors.json");

    //   await fs.mkdir(path.dirname(outputPath), { recursive: true });
    //   await fs.writeFile(outputPath, JSON.stringify(colors, null, 2));

    //   console.log(
    //     `✅ colors.json generated (${Object.keys(colors).length} tokens)`
    //   );
}

figmaToToken();
