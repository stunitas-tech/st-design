export const dynamic = "force-dynamic";

import TokenRow from "./token-row";
import { getTokens } from "./tokens";

interface TokenReferenceProps {
    filter?: string;
    search?: string;
    /** 토큰 카테고리 렌더링 순서 (예: ["palette", "dimension"]) */
    order?: string[];
}

export async function TokenReference({
    filter,
    search,
    order = [], // 기본값은 빈 배열
}: TokenReferenceProps) {
    const tokenMap = await getTokens();
    const searchKeyword = search?.toLowerCase().trim();

    // 1️⃣ 정렬 기준 결정: order가 있으면 order 기준, 없으면 기존 key 기준
    const allCategories = Object.keys(tokenMap);

    // order에 포함된 것들을 먼저 배치하고, 명시되지 않은 나머지는 뒤로 보냄
    const sortedCategories =
        order.length > 0
            ? [
                  ...order.filter((cat) => allCategories.includes(cat)),
                  ...allCategories.filter((cat) => !order.includes(cat)),
              ]
            : allCategories;

    // 2️⃣ 결정된 카테고리 순서대로 데이터를 플랫하게 합침
    const filteredItems = sortedCategories
        .filter((key) => !filter || filter === "all" || key === filter) // 카테고리 필터
        .flatMap((category) =>
            (tokenMap[category] || []).map((item: any) => ({
                ...item,
                category,
            })),
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
