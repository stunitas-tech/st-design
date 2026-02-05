import { type InferPageType, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { docs, gongsoop } from "fumadocs-mdx:collections/server";

const isProd = process.env.NODE_ENV === "production";

// See https://fumadocs.dev/docs/headless/source-api for more info
export function getPageImage(page: InferPageType<typeof docsSource>) {
    const segments = [...page.slugs, "image.png"];

    return {
        segments,
        url: `/og/docs/${segments.join("/")}`,
    };
}

export async function getLLMText(page: InferPageType<typeof docsSource>) {
    const processed = await page.data.getText("processed");

    return `# ${page.data.title}

  ${processed}`;
}

export const docsSource = loader({
    baseUrl: "/docs",
    source: docs.toFumadocsSource(),
    plugins: [lucideIconsPlugin()],
});

export const gongsoopSource = loader({
    baseUrl: "/gongsoop",
    source: gongsoop.toFumadocsSource(),
    plugins: [lucideIconsPlugin()],
});
