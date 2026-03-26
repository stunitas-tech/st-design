import { Client } from "@notionhq/client";

// 1. V5 아키텍처 대응을 위한 타입 확장
interface StrictNotionClient {
    databases: {
        retrieve: (args: { database_id: string }) => Promise<any>;
    };
    dataSources: {
        query: (args: {
            data_source_id: string;
            filter?: object;
            sorts?: object;
            page_size?: number;
        }) => Promise<any>;
    };
}

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN) {
    console.error("❌ NOTION_TOKEN이 설정되지 않았습니다.");
    process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });
// 타입을 강제로 캐스팅하여 비표준 메서드(dataSources)에 접근 가능하게 만듭니다.
const strictNotion = notion as unknown as StrictNotionClient;

async function testNotionV5Connection() {
    console.log("🔍 [V5 모드] 노션 데이터베이스 연결 테스트 시작...");

    try {
        // Step 1: 데이터베이스 메타데이터에서 Data Source ID 추출
        console.log("1단계: DB 메타데이터 조회 중...");
        const dbMetadata = await strictNotion.databases.retrieve({
            database_id: DATABASE_ID || "",
        });

        // 참조하신 글에 따르면 data_sources 배열의 첫 번째 ID가 필요합니다.
        const dataSourceId = dbMetadata.data_sources?.[0]?.id;

        if (!dataSourceId) {
            console.error(
                "❌ Data Source ID를 찾을 수 없습니다. 일반적인 query를 시도해 보세요.",
            );
            // 만약 V5가 아니라면 일반 query로 폴백하는 로직을 넣을 수도 있습니다.
            return;
        }

        console.log(`✅ Data Source ID 발견: ${dataSourceId}`);

        // Step 2: 추출한 ID를 사용하여 실제 데이터 쿼리
        console.log("2단계: 실제 데이터 페칭 중...");
        const response = await strictNotion.dataSources.query({
            data_source_id: dataSourceId,
            // page_size: 5,
        });

        console.log(
            `🎉 성공! ${response.results.length}개의 문서를 불러왔습니다.\n`,
        );

        response.results.forEach(async (page: any, index: number) => {
            const props = page.properties;
            const title = props["title"]?.title?.[0]?.plain_text || "제목 없음";
            const status = props["status"]?.status?.name || "상태 없음";
            const description =
                props["description"]?.rich_text?.[0]?.plain_text || "설명 없음";
            const category = props["category"]?.select?.name || "카테고리 없음";

            console.log(`${index + 1}. [${category}][${status}] ${title}`);
            // console.log(description);

            if (status === "Push") {
                try {
                    // PATCH 요청으로 상태값을 "publish"로 변경
                    await notion.request({
                        path: `pages/${page.id}`,
                        method: "patch",
                        body: {
                            properties: {
                                status: {
                                    status: {
                                        name: "Published",
                                    },
                                },
                            },
                        },
                    });
                    console.log(
                        `✔️ [성공] ${index} [${category}][${status}] ${title} 상태 'publish'로 변경 완료`,
                    );
                } catch (err: any) {
                    console.error(
                        `    ❌ [실패] 업데이트 중 에러: ${err.message}`,
                    );
                }
            }
        });
    } catch (error: any) {
        console.error("❌ 에러 발생 상세:");
        console.error(`Status: ${error.status}, Message: ${error.message}`);
    }
}

testNotionV5Connection();
