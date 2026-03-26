import { Client } from "@notionhq/client";
import axios from "axios";
import { NotionToMarkdown } from "notion-to-md";
import path from "path";

// --------------------
// ENV
// --------------------
const NOTION_TOKEN = process.env.NOTION_TOKEN!;
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;

const GITHUB_OWNER = "YOUR_ID";
const GITHUB_REPO = "YOUR_REPO";
const GITHUB_BRANCH = "main";

// --------------------
const notion = new Client({ auth: NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

// --------------------
// TYPES
// --------------------
type FileChange = {
    path: string;
    content?: string;
    encoding?: "utf-8" | "base64";
    delete?: boolean;
};

// --------------------
// utils
// --------------------
const slugify = (text: string) =>
    text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-가-힣]/g, "");

// --------------------
// GitHub Batch Commit
// --------------------
async function createCommit(changes: FileChange[]) {
    const headers = {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
    };

    // 1. 현재 HEAD
    const refRes = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${GITHUB_BRANCH}`,
        { headers },
    );
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // 2. base tree
    const commitRes = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits/${latestCommitSha}`,
        { headers },
    );
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. tree 생성
    const tree = changes.map((file) => {
        if (file.delete) {
            return {
                path: file.path,
                mode: "100644",
                type: "blob",
                sha: null,
            };
        }

        return {
            path: file.path,
            mode: "100644",
            type: "blob",
            content: file.content,
        };
    });

    const treeRes = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree,
            }),
        },
    );
    const treeData = await treeRes.json();

    // 4. commit 생성
    const commitCreate = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                message: "sync from notion",
                tree: treeData.sha,
                parents: [latestCommitSha],
            }),
        },
    );
    const newCommit = await commitCreate.json();

    // 5. push (branch 업데이트)
    await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`,
        {
            method: "PATCH",
            headers,
            body: JSON.stringify({
                sha: newCommit.sha,
            }),
        },
    );
}

// --------------------
// 이미지
// --------------------
async function fetchImageBase64(url: string) {
    const res = await axios.get(url, {
        responseType: "arraybuffer",
    });
    return Buffer.from(res.data).toString("base64");
}

// --------------------
async function getAllImageUrls(blockId: string): Promise<string[]> {
    let urls: string[] = [];
    let cursor: string | undefined;

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
                const child = await getAllImageUrls(block.id);
                urls = urls.concat(child);
            }
        }

        if (!res.has_more) break;
        cursor = res.next_cursor ?? undefined;
    }

    return urls;
}

// --------------------
// MAIN
// --------------------
async function syncNotionToMdx() {
    const changes: FileChange[] = [];

    const db = await notion.databases.retrieve({
        database_id: DATABASE_ID,
    });

    const dataSourceId = (db as any).data_sources?.[0]?.id;

    const response = await (notion as any).dataSources.query({
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

        const rawSegments = title.split("/").filter(Boolean);
        const slugSegments = rawSegments.map(slugify);

        const fileName = slugSegments.at(-1)!;
        const displayTitle = rawSegments.at(-1)!;

        const repoMdxPath = path.posix.join(
            "docs/content/docs",
            category,
            ...slugSegments.slice(0, -1),
            `${fileName}.mdx`,
        );

        const imageBasePath = path.posix.join(
            "docs/public/images/docs",
            category,
            ...slugSegments,
        );

        // DELETE
        if (status === "Delete") {
            changes.push({ path: repoMdxPath, delete: true });
            continue;
        }

        // PUSH
        if (status === "Push") {
            const mdblocks = await n2m.pageToMarkdown(page.id);
            const { parent } = n2m.toMarkdownString(mdblocks);

            const imageUrls = await getAllImageUrls(page.id);
            const matches = Array.from(
                parent.matchAll(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g),
            );

            let updatedContent = parent;

            for (let i = 0; i < matches.length; i++) {
                const url = imageUrls[i];
                if (!url) continue;

                const ext = url.split("?")[0].split(".").pop() || "png";
                const imgName = `image-${i}.${ext}`;

                const repoImgPath = `${imageBasePath}/${imgName}`;
                const webPath = `/images/docs/${category}/${slugSegments.join("/")}/${imgName}`;

                const base64 = await fetchImageBase64(url);

                changes.push({
                    path: repoImgPath,
                    content: base64,
                });

                updatedContent = updatedContent.replace(matches[i][1], webPath);
            }

            const mdxContent = `---
title: "${displayTitle}"
description: "${description}"
---

${updatedContent}`;

            changes.push({
                path: repoMdxPath,
                content: mdxContent,
            });

            await notion.pages.update({
                page_id: page.id,
                properties: {
                    status: { status: { name: "Published" } },
                },
            });
        }
    }

    if (changes.length > 0) {
        await createCommit(changes);
        console.log("✅ batch commit 완료");
    } else {
        console.log("변경 없음");
    }
}

syncNotionToMdx();
