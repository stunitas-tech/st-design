export const dynamic = "force-dynamic";

import TokenRow from "./token-row";
import { getTokens } from "./tokens";

export async function TokenReference() {
    // 모든 토큰 그룹을 가져옵니다.
    const tokenMap = await getTokens();

    // 객체의 키(palette, semantic 등) 배열 추출
    const categories = Object.keys(tokenMap);

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
                {categories.map((category) =>
                    tokenMap[category].map((item) => {
                        // 값이 공백으로 구분된 경우(예: "#ffffff 100%") 첫 번째 값만 사용
                        return (
                            <TokenRow
                                key={`${category}-${item?.name}`}
                                category={category}
                                item={item}
                            />
                        );
                    }),
                )}
            </tbody>
        </table>
    );
}
