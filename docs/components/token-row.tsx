"use client";

import { clsx } from "clsx";
import { ChevronDown, ChevronUp, MoveDown } from "lucide-react";
import { useState } from "react";
import TokenValue from "./token-value";
import { Token } from "./tokens";

export default function TokenRow({
    category,
    item,
}: {
    category: string;
    item: Token;
}) {
    const value = item?.value?.split(" ")[0];
    const per = item?.value?.split(" ")[1];
    const perNum = per?.replace(/[()]/g, "") || "100%";
    const isPercent = perNum && perNum !== "100%";
    const isOpacity = item?.name?.includes("Opacity");
    const isColor = value?.startsWith("#");
    const isAlias = item?.alias;

    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <tr
            key={`${category}-${item?.name}`}
            className={clsx("border-b last:border-0 hover:bg-fd-muted", {
                "cursor-pointer": isAlias,
            })}
            onClick={true ? () => setIsExpanded((prev) => !prev) : undefined}
        >
            <td className="py-3 font-mono text-xs">
                {category}/{item?.name.toLowerCase()}
                {/* <div className="text-fd-muted-foreground text-xs text-pretty break-keep mt-1">
                Top Navigation과 Page Title 사이의 간격입니다.
            </div> */}
            </td>
            <td className="py-3">
                <div
                    className="flex justify-between"
                    aria-expanded={isExpanded}
                >
                    <div className="flex flex-col gap-1">
                        <TokenValue item={item} />
                        {isAlias && isExpanded && (
                            <>
                                <div className="flex size-5 items-center justify-center">
                                    <MoveDown className="size-3" />
                                </div>
                                <TokenValue item={item} alias />
                            </>
                        )}
                    </div>
                    {isAlias ? (
                        <div className="flex h-6 items-center gap-0.5">
                            {isExpanded ? (
                                <ChevronUp className="size-4" />
                            ) : (
                                <ChevronDown className="size-4" />
                            )}
                        </div>
                    ) : null}
                </div>
            </td>
        </tr>
    );
}
