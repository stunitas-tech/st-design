import { Client } from "@notionhq/client";
import axios from "axios";
import fs from "fs";
import { NotionToMarkdown } from "notion-to-md";
import path from "path";
import prettier from "prettier";

// --------------------
// Callout 변환
// --------------------
const calloutTypeMap: Record<string, string> = {
    "💡": "info",
    "⚠️": "warn",
    "⛔️": "error",
    "✅": "success",
};

function transformCallouts(content: string) {
    const lines = content.split("\n");
    let result: string[] = [];

    let buffer: string[] = [];
    let inCallout = false;

    for (let line of lines) {
        if (line.startsWith(">")) {
            const clean = line.replace(/^>\s?/, "");

            if (!inCallout) {
                buffer = [];
                inCallout = true;
            }

            buffer.push(clean);
        } else {
            if (inCallout) {
                result.push(convertBufferToCallout(buffer));
                buffer = [];
                inCallout = false;
            }
            result.push(line);
        }
    }

    if (inCallout && buffer.length > 0) {
        result.push(convertBufferToCallout(buffer));
    }

    return result.join("\n");
}

function convertBufferToCallout(lines: string[]) {
    if (!lines.length) return "";

    const firstLine = lines[0];

    const match = firstLine.match(/^([^\s]+)\s*(.*)$/);
    let icon = match?.[1] ?? "";
    let title = match?.[2] ?? "";

    const type = calloutTypeMap[icon] || "info";

    // 첫 줄에서 아이콘 제거
    if (match) {
        lines[0] = title || "";
    }

    const body = lines.join("\n").trim();

    return `<Callout title="${title || ""}" type="${type}">
${body}
</Callout>`;
}

interface StrictNotionClient {
    databases: { retrieve: (args: { database_id: string }) => Promise<any> };
    dataSources: {
        query: (args: {
            data_source_id: string;
            filter?: object;
            sorts?: object;
        }) => Promise<any>;
    };
}

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN) {
    console.error("❌ NOTION_TOKEN이 설정되지 않았습니다.");
    process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN, timeoutMs: 120_000 });
const n2m = new NotionToMarkdown({ notionClient: notion });
const strictNotion = notion as unknown as StrictNotionClient;

// --------------------
// utils
// --------------------
const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
const resetDir = (dir: string) => {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
};
const removeTarget = (targetPath: string) => {
    if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
        return true;
    }
    return false;
};

// 소문자, 공백->하이픈 변환 (슬러그화)
const slugify = (text: string) =>
    text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-가-힣]/g, "");

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    try {
        return await fn();
    } catch (err) {
        if (retries > 0) {
            console.warn(`🔁 재시도 중... (남은 횟수: ${retries})`);
            await new Promise((r) => setTimeout(r, 1500));
            return withRetry(fn, retries - 1);
        }
        throw err;
    }
}

// --------------------
// 이미지 관련 유틸
// --------------------
async function downloadImage(url: string, dest: string) {
    try {
        const response = await axios({
            url,
            method: "GET",
            responseType: "stream",
            timeout: 30000,
            headers: { "User-Agent": "Mozilla/5.0" },
        });
        const writer = fs.createWriteStream(dest);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    } catch (err: any) {
        throw new Error(`이미지 다운로드 실패: ${err.message}`);
    }
}

async function getAllImageUrls(blockId: string): Promise<string[]> {
    let urls: string[] = [];
    let cursor: string | undefined = undefined;
    while (true) {
        const res = await notion.blocks.children.list({
            block_id: blockId,
            start_cursor: cursor,
        });
        for (const block of res.results as any[]) {
            if (block.type === "image") {
                const url =
                    block.image.type === "file"
                        ? block.image.file.url
                        : block.image.external.url;
                urls.push(url);
            }
            if (block.has_children) {
                const childUrls = await getAllImageUrls(block.id);
                urls = urls.concat(childUrls);
            }
        }
        if (!res.has_more) break;
        cursor = res.next_cursor ?? undefined;
    }
    return urls;
}

// --------------------
// Main Sync
// --------------------
async function syncNotionToMdx() {
    console.log("🚀 Notion to MDX 동기화 시작...");

    try {
        const dbMetadata = await withRetry(() =>
            strictNotion.databases.retrieve({ database_id: DATABASE_ID || "" }),
        );
        const dataSourceId = dbMetadata.data_sources?.[0]?.id;
        if (!dataSourceId) {
            console.error("❌ DataSource ID를 찾을 수 없습니다.");
            return;
        }

        const response = await strictNotion.dataSources.query({
            data_source_id: dataSourceId,
        });

        for (const page of response.results) {
            const props = (page as any).properties;
            const title = props["title"]?.title?.[0]?.plain_text;
            const status = props["status"]?.status?.name;
            const category = props["category"]?.select?.name?.toLowerCase();
            const description =
                props["description"]?.rich_text?.[0]?.plain_text || "";

            if (!category || !title) continue;

            // 🛠️ 경로용 슬러그와 표시용 타이틀 분리
            const rawSegments = title.split("/").filter(Boolean);
            const slugSegments = rawSegments.map(slugify);

            const fileName = slugSegments[slugSegments.length - 1]; // 파일명 (colors)
            const displayTitle = rawSegments[rawSegments.length - 1]; // 실제 타이틀 (Colors)

            const mdxFilePath = path.join(
                process.cwd(),
                "docs/content/docs",
                category,
                ...slugSegments.slice(0, -1),
                `${fileName}.mdx`,
            );
            const imageDir = path.join(
                process.cwd(),
                "docs/public/images/docs",
                category,
                ...slugSegments,
            );

            // 🔥 CASE 1: Delete
            if (status === "Delete") {
                console.log(`\n🗑️ 삭제: [${category}] ${displayTitle}`);
                removeTarget(mdxFilePath);
                removeTarget(imageDir);
                try {
                    await notion.pages.update({
                        page_id: page.id,
                        archived: true,
                    });
                    console.log(`✅ 삭제 완료`);
                } catch (err: any) {
                    console.error(`❌ 삭제 실패: ${err.message}`);
                }
                continue;
            }

            // 🔥 CASE 2: Push
            if (status === "Push") {
                console.log(`\n📦 처리: [${category}] ${displayTitle}`);

                try {
                    ensureDir(path.dirname(mdxFilePath));
                    resetDir(imageDir);

                    const mdblocks = await withRetry(() =>
                        n2m.pageToMarkdown(page.id),
                    );
                    const { parent } = n2m.toMarkdownString(mdblocks);

                    const imageUrls = await getAllImageUrls(page.id);
                    const imgRegex = /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;
                    const matches = Array.from(parent.matchAll(imgRegex));

                    let updatedContent = parent;
                    const downloads: Promise<void>[] = [];

                    for (let i = 0; i < matches.length; i++) {
                        const freshUrl = imageUrls[i];
                        if (!freshUrl) continue;

                        const ext =
                            freshUrl.split("?")[0].split(".").pop() || "png";
                        const imgName = `image-${i}.${ext}`;
                        const localPath = path.join(imageDir, imgName);
                        const webPath = `/images/docs/${category}/${slugSegments.join("/")}/${imgName}`;

                        downloads.push(downloadImage(freshUrl, localPath));
                        updatedContent = updatedContent.replace(
                            matches[i][1],
                            webPath,
                        );
                    }
                    await Promise.allSettled(downloads);

                    // 컴포넌트 변환

                    updatedContent = transformCallouts(updatedContent);

                    updatedContent = updatedContent
                        // 1. 역슬래시 이스케이프 선처리
                        .replace(/\\</g, "<")
                        .replace(/\\>/g, ">")

                        // 2. @token 컴포넌트 변환 (기존 로직)
                        .replace(/@token\((.*?)\)/g, (match, paramString) => {
                            if (!paramString.trim())
                                return `<TokenReference />`;
                            const params = new URLSearchParams(
                                paramString.trim().replace(/&amp;/g, "&"),
                            );
                            const cat = params.get("category");
                            const src = params.get("search");
                            return `<TokenReference ${cat ? `category="${cat.trim()}" ` : ""}${src ? `search="${src.trim()}" ` : ""}/>`;
                        })
                        .replace(/`(<TokenReference.*?\/>)`/g, "$1")

                        // 3. 문법 오류 방지를 위한 이스케이프 처리 (순서 중요)
                        .replace(/&/g, "&amp;") // & -> &amp;
                        .replace(/{/g, "&#123;") // { -> &#123;
                        .replace(/}/g, "&#125;") // } -> &#125;

                        // 4. 컴포넌트 태그가 아닌 일반 부등호 처리
                        // < 뒤에 영문/슬래시가 안 오면 &lt; 로 변경
                        .replace(/<(?![a-zA-Z/])/g, "&lt;")
                        // > 앞에 영문/슬래시/따옴표가 없으면 &gt; 로 변경 (태그 닫기 보존)
                        .replace(/(?<![a-zA-Z/"'])\s*>/g, " &gt;");

                    // 5. 테이블이나 리스트 뒤에 컴포넌트가 붙어있을 경우를 대비해 줄바꿈 정돈
                    updatedContent = updatedContent.replace(
                        /\n(<TokenReference)/g,
                        "\n\n$1",
                    );

                    // 🛠️ MDX 저장 (마지막 세그먼트만 title로 사용)
                    const mdxContent = `---
title: "${displayTitle}"
description: "${description}"
---

${updatedContent}`;

                    const formatted = await prettier.format(mdxContent, {
                        parser: "mdx",
                    });

                    fs.writeFileSync(mdxFilePath, formatted);

                    await notion.pages.update({
                        page_id: page.id,
                        properties: {
                            status: { status: { name: "Published" } },
                        },
                    });

                    console.log(`✅ 완료: ${displayTitle}`);
                } catch (err: any) {
                    console.error(`❌ 실패: ${displayTitle} - ${err.message}`);
                    await notion.pages.update({
                        page_id: page.id,
                        properties: { status: { status: { name: "Error" } } },
                    });
                }
            }
        }
        console.log("\n✨ 동기화 종료");
    } catch (err: any) {
        console.error("❌ 치명적 에러:", err.message);
    }
}

syncNotionToMdx();
