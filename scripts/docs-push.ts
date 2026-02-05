import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * 프로젝트의 GitHub 저장소 URL (실제 주소로 수정하세요)
 */
const REPO_URL = "https://github.com/stunitas-tech/st-design";

function ensureRemote(): void {
    try {
        execSync("git remote get-url origin", { stdio: "ignore" });
    } catch {
        console.log("🔗 원격 저장소를 등록합니다...");
        execSync(`git remote add origin ${REPO_URL}`, { stdio: "inherit" });
    }
}

function docsPush(): void {
    try {
        // 0. Git 초기화 및 리모트 체크
        if (!existsSync(".git")) {
            execSync("git init", { stdio: "inherit" });
        }
        ensureRemote();

        // 1. 기본 브랜치 이름 확인 (main 또는 master)
        const defaultBranch =
            execSync("git symbolic-ref refs/remotes/origin/HEAD")
                .toString()
                .trim()
                .split("/")
                .pop() || "main";

        console.log(
            `\n🔄 ${defaultBranch} 브랜치로부터 최신 정보를 가져오는 중...`,
        );

        // 2. 메인 브랜치로 이동하여 최신 코드 받기
        // - 작업 중이던 파일이 있으면 임시 저장(stash)하고 이동
        execSync("git stash", { stdio: "ignore" });
        execSync(`git checkout ${defaultBranch}`, { stdio: "inherit" });
        execSync(`git pull origin ${defaultBranch}`, { stdio: "inherit" });
        execSync("git stash pop", { stdio: "ignore" }); // 임시 저장했던 파일 복구

        // 3. 새 작업 브랜치 생성
        const timestamp = new Date()
            .toISOString()
            .slice(2, 16)
            .replace(/[-T:]/g, "");
        const branchName = `design/sync-${timestamp}`;

        console.log(`\n🌿 새 작업 브랜치 생성: ${branchName}`);
        execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });

        // 4. 변경사항 커밋
        console.log("📦 토큰 변경사항 기록 중...");
        execSync("git add .", { stdio: "inherit" });

        try {
            execSync(`git commit -m "design: docs update (${timestamp})"`, {
                stdio: "inherit",
            });
        } catch {
            console.log("✨ 변경된 토큰이 없습니다. 작업을 종료합니다.");
            execSync(`git checkout ${defaultBranch}`, { stdio: "ignore" });
            execSync(`git branch -d ${branchName}`, { stdio: "ignore" });
            return;
        }

        // 5. 푸시
        console.log("🚀 GitHub으로 전송 중...");
        execSync(`git push origin ${branchName}`, { stdio: "inherit" });

        // 6. PR 링크 출력
        const prBaseUrl = REPO_URL.replace(/\.git$/, "").replace(
            "git@github.com:",
            "https://github.com/",
        );
        const prLink = `${prBaseUrl}/compare/${defaultBranch}...${branchName}?expand=1`;

        console.log("\n" + "=".repeat(60));
        console.log("✅ 모든 작업이 완료되었습니다!");
        console.log("🔗 아래 링크를 클릭하여 Pull Request를 생성해 주세요:");
        console.log(`\x1b[36m${prLink}\x1b[0m`);
        console.log("=".repeat(60));
    } catch (error) {
        if (error instanceof Error) {
            console.error(`\n❌ 작업 중 에러 발생: ${error.message}`);
        }
        process.exit(1);
    }
}

docsPush();
