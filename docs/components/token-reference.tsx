export const dynamic = "force-dynamic";

import { getTokens } from "./tokens";

export async function TokenReference() {
    const tokens = await getTokens();
    console.log(tokens);

    return (
        <table>
            <colgroup>
                <col width="70%" />
                <col width="30%" />
            </colgroup>
            <thead>
                <tr>
                    <th>이름</th>
                    <th>값</th>
                </tr>
            </thead>
            <tbody>
                {tokens &&
                    tokens.map((item) => {
                        const value = item?.value.split(" ")[0];
                        return (
                            <tr key={item?.name}>
                                <td>{item?.name}</td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="inline-block size-4 rounded-full border border-fd-border"
                                            style={{
                                                background: value,
                                            }}
                                        ></span>
                                        <span>{value}</span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
            </tbody>
        </table>
    );
}
