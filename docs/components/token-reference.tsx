export const dynamic = "force-dynamic";

import { getTokens } from "./tokens";

export async function TokenReference() {
    const tokens = await getTokens();
    console.log(tokens);

    return (
        <table>
            <colgroup>
                <col width="50%" />
                <col width="50%" />
            </colgroup>
            <thead>
                <tr>
                    <th>이름</th>
                    <th>값</th>
                </tr>
            </thead>
            <tbody>
                {tokens &&
                    tokens.map((item) => (
                        <tr key={item?.name}>
                            <td>{item?.name}</td>
                            <td>{item?.value}</td>
                        </tr>
                    ))}
            </tbody>
        </table>
    );
}
