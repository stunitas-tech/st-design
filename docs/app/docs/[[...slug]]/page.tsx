import { getGitHubSourceUrl } from "@/app/_llms/config";
import { mdxComponents } from "@/components/mdx-components";
import { LLMOptions, ViewOptions } from "@/components/page-actions";
import { docsSource, getPageImage } from "@/lib/source";
import { findSiblings } from "fumadocs-core/page-tree";
import { Card, Cards } from "fumadocs-ui/components/card";
import {
    DocsBody,
    DocsDescription,
    DocsPage,
    DocsTitle,
} from "fumadocs-ui/layouts/notebook/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
    const params = await props.params;
    const page = docsSource.getPage(params.slug);
    if (!page) notFound();

    const MDX = page.data.body;

    const slugsWithExt = page.slugs.map((s, i) =>
        i === page.slugs.length - 1 ? `${s}.txt` : s,
    );
    const markdownUrl = `/llms/docs/${slugsWithExt.join("/")}`;

    return (
        <DocsPage toc={page.data.toc} full={page.data.full}>
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription>{page.data.description || ""}</DocsDescription>

            <div className="hidden flex-row gap-2 items-center mb-3 justify-end">
                <LLMOptions markdownUrl={markdownUrl} />
                <ViewOptions
                    markdownUrl={markdownUrl}
                    githubUrl={getGitHubSourceUrl("docs", page.path)}
                />
            </div>
            <DocsBody className="prose-p:break-keep prose-p:text-pretty prose-headings:text-balance">
                <MDX
                    components={{
                        ...mdxComponents,
                        DocsCategory: ({ url }) => {
                            return <DocsCategory url={url ?? page.url} />;
                        },
                    }}
                />
            </DocsBody>
        </DocsPage>
    );
}

function DocsCategory({ url }: { url: string }) {
    return (
        <Cards>
            {findSiblings(docsSource.getPageTree(), url).map((item) => {
                if (item.type === "separator") return;
                if (item.type === "folder") {
                    if (!item.index) return;
                    item = item.index;
                }

                return (
                    <Card key={item.url} title={item.name} href={item.url}>
                        {item.description}
                    </Card>
                );
            })}
        </Cards>
    );
}

export async function generateStaticParams() {
    return docsSource.generateParams();
}

export async function generateMetadata(
    props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
    const params = await props.params;
    const page = docsSource.getPage(params.slug);
    if (!page) notFound();

    return {
        title: page.data.title,
        description: page.data.description,
        openGraph: {
            images: getPageImage(page).url,
        },
    };
}
