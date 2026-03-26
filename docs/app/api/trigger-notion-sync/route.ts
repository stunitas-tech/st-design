export async function POST() {
    const res = await fetch(
        "https://api.github.com/repos/stunitas-tech/st-design/dispatches",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                event_type: "notion-sync",
            }),
        },
    );

    const text = await res.text();

    return Response.json({
        ok: true,
        status: res.status,
        response: text,
    });
}
