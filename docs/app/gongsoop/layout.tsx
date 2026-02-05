import DefaultSearchDialog from "@/components/search/search";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { RootProvider } from "fumadocs-ui/provider/base";
import { TAGS } from "../api/search/constants";
import { gongsoopOptions } from "../layout.config";

export default function Layout({ children }: LayoutProps<"/docs">) {
    return (
        <RootProvider
            search={{
                SearchDialog: DefaultSearchDialog,
                options: {
                    // defaultTag: TAGS.gongsoop.value,
                    tags: Object.values(TAGS),
                },
            }}
        >
            <DocsLayout {...gongsoopOptions}>{children}</DocsLayout>
        </RootProvider>
    );
}
