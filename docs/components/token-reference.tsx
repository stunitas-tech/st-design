export const dynamic = "force-dynamic";

import TokenRow from "./token-row";
import { getTokens } from "./tokens";

export type TokenType = "palette" | "semantic" | "dimension" | "all";

export async function TokenReference({
    filter,
    search,
}: {
    filter?: TokenType;
    search?: string;
}) {
    const tokenMap = await getTokens();
    const searchKeyword = search?.toLowerCase().trim();

    // 1️⃣ 먼저 모든 카테고리에서 검색어에 맞는 아이템들을 하나의 배열로 합칩니다.
    const filteredItems = Object.keys(tokenMap)
        .filter((key) => !filter || filter === "all" || key === filter) // 카테고리 필터
        .flatMap((category) =>
            (tokenMap[category] || []).map((item) => ({ ...item, category })),
        )
        .filter(
            (item) =>
                !searchKeyword ||
                item.name?.toLowerCase().includes(searchKeyword),
        ); // 검색어 필터
    return (
        <table>
            <colgroup>
                <col width="60%" />
                <col width="40%" />
            </colgroup>
            <thead>
                <tr>
                    <th>이름</th>
                    <th>값</th>
                </tr>
            </thead>
            <tbody>
                {filteredItems.length === 0 ? (
                    <tr>
                        <td colSpan={2}>
                            <div className="p-2 text-fd-muted-foreground text-xs text-pretty break-keep text-center">
                                데이터가 없습니다.
                            </div>
                        </td>
                    </tr>
                ) : (
                    // 3️⃣ 데이터가 있을 때 리스트 렌더링
                    filteredItems.map((item) => (
                        <TokenRow
                            key={`${item.category}-${item.name}`}
                            category={item.category}
                            item={item}
                        />
                    ))
                )}
            </tbody>
        </table>
    );
}
