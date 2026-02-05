import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import * as React from "react";

import RootErrorBoundary from "./error-boundary";

interface ComponentExampleProps {
    children?: React.ReactNode;
}

export function MdxExample(props: ComponentExampleProps) {
    const { children } = props;

    const rawCode = React.isValidElement(children)
        ? "코드를 표시할 수 없습니다 (문자열이 아님)"
        : String(children)
              .replace(/^```mdx\s*|\s*```$/g, "")
              .trim();

    return (
        <RootErrorBoundary>
            <Tabs items={["미리보기", "코드"]}>
                <Tab value="미리보기">{rawCode}</Tab>
                <Tab value="코드">{children}</Tab>
            </Tabs>
        </RootErrorBoundary>
    );
}
