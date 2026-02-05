import { execSync } from "node:child_process";

/**
 * 프로젝트의 GitHub 저장소 URL (여기를 실제 주소로 수정하세요)
 */
const REPO_URL = "https://github.com/stunitas-tech/st-design";

/**
 * 원격 저장소(origin) 설정을 확인하고 없으면 등록하는 함수
 */
function ensureRemote(): void {
    try {
        // origin이 이미 있는지 확인
        execSync("git remote get-url origin", { stdio: "ignore" });
        console.log("✅ 원격 저장소 연결 확인됨.");
    } catch {
        // origin이 없으면 새로 등록
        console.log("🔗 원격 저장소가 설정되지 않아 새로 등록합니다...");
        try {
            execSync(`git remote add origin ${REPO_URL}`, { stdio: "inherit" });
            console.log(`✅ 원격 저장소 등록 완료: ${REPO_URL}`);
        } catch (error) {
            console.error(
                "❌ 원격 저장소 등록 실패. Git이 설치되어 있는지 확인해주세요.",
            );
            process.exit(1);
        }
    }
}

/**
 * PR 링크 생성을 위한 베이스 URL 추출
 */
function getPRBaseUrl(): string {
    const url = REPO_URL.replace(/\.git$/, "").replace(
        "git@github.com:",
        "https://github.com/",
    );
    return url;
}

function docsPush(): void {
    // 0. 로컬이 git 저장소인지 확인 후 remote 체크
    try {
        if (!require("node:fs").existsSync(".git")) {
            console.log("📂 Git 저장소를 초기화합니다...");
            execSync("git init", { stdio: "inherit" });
        }
        ensureRemote();
    } catch (e) {
        console.error("❌ Git 초기화 중 에러 발생");
        process.exit(1);
    }

    // 1. 브랜치명 생성
    const timestamp = new Date()
        .toISOString()
        .slice(2, 16)
        .replace(/[-T:]/g, "");
    const branchName = `design/sync-${timestamp}`;

    try {
        console.log(`🌿 새 브랜치 생성 중: ${branchName}`);
        execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });

        console.log("📦 변경사항 커밋 중...");
        execSync("git add .", { stdio: "inherit" });

        try {
            execSync(
                `git commit -m "design: sync figma tokens (${timestamp})"`,
                { stdio: "inherit" },
            );
        } catch {
            console.log("✨ 변경사항이 없습니다.");
            execSync("git checkout main", { stdio: "ignore" });
            execSync(`git branch -d ${branchName}`, { stdio: "ignore" });
            return;
        }

        // 2. 푸시 시도 (로그인 창이 뜰 수 있음)
        console.log("🚀 GitHub으로 전송 중...");
        execSync(`git push origin ${branchName}`, { stdio: "inherit" });

        // 3. PR 링크 출력
        const prLink = `${getPRBaseUrl()}/compare/main...${branchName}?expand=1`;
        console.log("\n" + "=".repeat(60));
        console.log("✅ 전송 완료!");
        console.log("🔗 아래 링크를 클릭하여 Pull Request를 생성하세요:");
        console.log(`\x1b[36m${prLink}\x1b[0m`);
        console.log("=".repeat(60));
    } catch (error) {
        console.error("❌ 작업 중 오류가 발생했습니다.");
        process.exit(1);
    }
}

docsPush();
