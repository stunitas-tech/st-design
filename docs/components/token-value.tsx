"use client";

import {
    ALargeSmall,
    ListChevronsUpDown,
    RulerDimensionLine,
    WholeWord,
} from "lucide-react";
import { AlphaGrid } from "./alpha-grid";
import { Token } from "./tokens";

export default function TokenValue({
    item,
    category,
    alias = false,
}: {
    item: Token;
    category?: string;
    alias?: boolean;
}) {
    const value = item?.value?.split(" ")[0];
    const per = item?.value?.split(" ")[1];
    const perNum = per?.replace(/[()]/g, "") || "100%";
    const isPercent = perNum && perNum !== "100%";
    const isOpacity = item?.name?.includes("Opacity");
    const isSpacing = category?.includes("spacing");
    const isWeight = category?.includes("weight");
    const isLineHeight =
        category?.includes("line") && category?.includes("height");
    const isColor = value?.startsWith("#");
    const isAlias = !alias && item?.alias;
    const isPixel =
        !isColor && !isOpacity && !isAlias && !isWeight && !isLineHeight;

    const iconClassName = "inline-block size-5 shrink-0";
    let icon = <RulerDimensionLine className={iconClassName} />;
    if (isLineHeight) {
        icon = <ListChevronsUpDown className={iconClassName} />;
    } else if (isWeight) {
        icon = <ALargeSmall className={iconClassName} />;
    } else if (isSpacing) {
        icon = <WholeWord className={iconClassName} />;
    }

    return (
        <div className="flex items-center gap-2">
            {isColor || isOpacity ? (
                <AlphaGrid className="inline-block size-5 shrink-0 rounded-full border border-fd-border">
                    <span
                        className="absolute left-0 top-0 w-full h-full"
                        style={{
                            backgroundColor:
                                !isPercent && !isOpacity
                                    ? value
                                    : `rgba(0, 0, 0, ${perNum})`,
                            opacity: isOpacity ? Number(value) / 10 : 1,
                        }}
                    ></span>
                </AlphaGrid>
            ) : (
                icon
            )}
            <span className="font-mono text-xs">
                {isPixel ? Number(value) / 10 : isAlias ? item?.alias : value}
                {isPercent && ` ${per}`}
                {isOpacity && "%"}
                {isPixel && `rem (${value}px)`}
                {isLineHeight && "%"}
            </span>
        </div>
    );
}
