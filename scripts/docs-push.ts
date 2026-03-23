import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * 프로젝트의 GitHub 저장소 URL
 */
const REPO_URL = "https://github.com/stunitas-tech/st-design.git";

/**
 * 반영할 특정 경로 리스트
 */
const ALLOWED_PATHS = ["docs/public/", "docs/content/"];

/**
 * 원격 저장소 설정 및 초기화
 */
function setupGit(): void {
    if (!existsSync(".git")) {
        console.log("📂 Git 저장소를 초기화합니다...");
        execSync("git init", { stdio: "inherit" });
    }

    try {
        execSync("git remote get-url origin", { stdio: "ignore" });
    } catch {
        console.log("🔗 원격 저장소를 등록합니다...");
        execSync(`git remote add origin ${REPO_URL}`, { stdio: "inherit" });
    }
}

/**
 * 작업 트리 상태 체크 및 비정상 종료 방어
 */
function cleanUpGit(): void {
    try {
        // 1. 진행 중이던 머지가 있다면 강제 중단 (unmerged files 에러 방지)
        execSync("git merge --abort", { stdio: "ignore" });
    } catch {
        // 진행 중인 머지가 없으면 통과
    }

    // 2. 현재 커밋되지 않은 변경사항이 있는지 확인
    const status = execSync("git status --porcelain").toString().trim();
    if (status !== "") {
        // ALLOWED_PATHS 내의 변경사항은 docs:push 과정에서 처리되므로,
        // 그 외의 파일이 수정되었을 때만 에러를 띄웁니다.
        const untrackedOutside = status
            .split("\n")
            .filter(
                (line) => !ALLOWED_PATHS.some((path) => line.includes(path)),
            );

        if (untrackedOutside.length > 0) {
            console.error(
                "\n❌ [오류] 허용되지 않은 경로에 수정된 파일이 있습니다.",
            );
            console.error(
                "먼저 다른 작업을 커밋하거나 되돌린 후 다시 실행해주세요.",
            );
            console.error("수정된 파일 목록:\n", untrackedOutside.join("\n"));
            process.exit(1);
        }
    }
}

function docsPush(): void {
    let defaultBranch = "main";

    try {
        setupGit();
        cleanUpGit();

        // 1. 기본 브랜치 이름 확인 (main/master)
        try {
            execSync("git fetch origin", { stdio: "inherit" });
            defaultBranch =
                execSync("git symbolic-ref refs/remotes/origin/HEAD")
                    .toString()
                    .trim()
                    .split("/")
                    .pop() || "main";
        } catch {
            defaultBranch = "main";
        }

        console.log(`\n🔄 ${defaultBranch} 브랜치 최신화 중...`);

        // 2. 메인 브랜치로 이동 및 최신 풀 (에러 발생 시 강제 리셋 시도)
        try {
            execSync(`git checkout ${defaultBranch}`, { stdio: "inherit" });
            execSync(`git pull origin ${defaultBranch}`, { stdio: "inherit" });
        } catch (e) {
            console.log("⚠️ 풀(Pull) 도중 에러 발생. 강제 리셋을 시도합니다.");
            execSync(`git reset --hard origin/${defaultBranch}`, {
                stdio: "inherit",
            });
        }

        // 3. 새 작업 브랜치 생성
        const timestamp = new Date()
            .toISOString()
            .slice(2, 16)
            .replace(/[-T:]/g, "");
        const branchName = `design/sync-${timestamp}`;

        console.log(`\n🌿 새 작업 브랜치 생성: ${branchName}`);
        execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });

        // 4. 특정 경로만 스테이징
        console.log("📦 허용된 경로의 변경사항 반영 중...");
        execSync("git reset", { stdio: "ignore" }); // 혹시 add 되어있던 것들 초기화

        let hasChanges = false;
        for (const path of ALLOWED_PATHS) {
            const diff = execSync(`git status --porcelain ${path}`)
                .toString()
                .trim();
            if (diff) {
                execSync(`git add ${path}`, { stdio: "inherit" });
                hasChanges = true;
            }
        }

        if (!hasChanges) {
            console.log(
                "✨ 반영할 변경사항이 없습니다. (/public, /docs/content 내 수정 없음)",
            );
            execSync(`git checkout ${defaultBranch}`, { stdio: "ignore" });
            return;
        }

        execSync(
            `git commit -m "🎨 Design: Document Update (${timestamp}) [skip ci] [vercel skip deployment]"`,
            { stdio: "inherit" },
        );

        // 6. Pull Request 생성 (GitHub CLI 'gh' 설치 필요)
        try {
            console.log("📝 Pull Request 생성 중...");
            // --fill 옵션은 커밋 메시지를 제목과 내용으로 자동 사용합니다.
            execSync(
                `gh pr create --base ${defaultBranch} --head ${branchName} --title "🎨 Design: Document Update (${timestamp})" --body "업데이트된 디자인 문서를 반영합니다."`,
                {
                    stdio: "inherit",
                },
            );
            console.log("✅ PR이 성공적으로 생성되었습니다.");
        } catch (e) {
            console.log(
                "⚠️ PR 생성 실패 (이미 존재하거나 gh CLI가 설정되지 않았을 수 있습니다.)",
            );
            // PR 생성이 실패해도 프로세스는 계속 진행되게 처리
        }

        // 7. 다시 메인 브랜치로 복귀하여 최신화
        console.log(
            `\n🏠 작업을 마치고 다시 ${defaultBranch} 브랜치로 복귀합니다...`,
        );
        execSync(`git checkout ${defaultBranch}`, { stdio: "inherit" });
        execSync(`git pull origin ${defaultBranch}`, { stdio: "inherit" });

        console.log("\n" + "=".repeat(60));
        console.log("✅ 모든 프로세스가 완료되었습니다!");
        console.log("=".repeat(60));
    } catch (error) {
        if (error instanceof Error) {
            console.error(`\n❌ 에러 발생: ${error.message}`);
        }
        process.exit(1);
    }
}

docsPush();
