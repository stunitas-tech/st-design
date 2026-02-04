import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { gongsoopOptions } from "../layout.config";

export default function Layout({ children }: LayoutProps<"/docs">) {
    return <DocsLayout {...gongsoopOptions}>{children}</DocsLayout>;
}
