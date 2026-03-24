import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const REPO_URL = "https://github.com/stunitas-tech/st-design.git";
const ALLOWED_PATHS = ["docs/public/", "docs/content/"];

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

function cleanUpGit(): void {
    try {
        execSync("git merge --abort", { stdio: "ignore" });
    } catch {}

    const status = execSync("git status --porcelain").toString().trim();
    if (status !== "") {
        const lines = status.split("\n");
        const untrackedOutside = lines.filter(
            (line) => !ALLOWED_PATHS.some((path) => line.includes(path)),
        );

        if (untrackedOutside.length > 0) {
            console.error(
                "\n❌ [오류] 허용되지 않은 경로에 수정된 파일이 있습니다.",
            );
            console.error("수정된 파일 목록:\n", untrackedOutside.join("\n"));
            process.exit(1);
        }
    }
}

function docsPush(): void {
    let defaultBranch = "main";
    let tempStashed = false;

    try {
        setupGit();
        cleanUpGit();

        // 1. 기본 브랜치 확인
        try {
            execSync("git fetch origin", { stdio: "ignore" });
            defaultBranch =
                execSync(
                    "git remote show origin | grep 'HEAD branch' | cut -d' ' -f5",
                )
                    .toString()
                    .trim() || "main";
        } catch {
            defaultBranch = "main";
        }

        // 2. [핵심] 현재 수정 중인 파일들을 임시 저장(Stash)합니다.
        console.log("📦 현재 작업 내용을 안전하게 임시 저장합니다...");
        const hasChangesToStash =
            execSync("git status --porcelain").toString().trim() !== "";
        if (hasChangesToStash) {
            execSync("git stash push -m 'design-sync-backup'", {
                stdio: "inherit",
            });
            tempStashed = true;
        }

        // 3. 메인 브랜치 최신화
        execSync(`git checkout ${defaultBranch}`, { stdio: "inherit" });
        execSync(`git pull origin ${defaultBranch}`, { stdio: "inherit" });

        // 4. 새 작업 브랜치 생성 및 이동
        const timestamp = new Date()
            .toISOString()
            .slice(2, 16)
            .replace(/[-T:]/g, "");
        const branchName = `design/sync-${timestamp}`;
        execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });

        // 5. 임시 저장했던 내용 다시 불러오기 (새 브랜치에 적용)
        if (tempStashed) {
            execSync("git stash pop", { stdio: "inherit" });
            tempStashed = false; // 성공적으로 꺼냈으므로 플래그 해제
        }

        // 6. 변경사항 스테이징 및 커밋
        let hasChanges = false;
        for (const path of ALLOWED_PATHS) {
            if (existsSync(path)) {
                const diff = execSync(`git status --porcelain ${path}`)
                    .toString()
                    .trim();
                if (diff) {
                    execSync(`git add ${path}`, { stdio: "inherit" });
                    hasChanges = true;
                }
            }
        }

        if (!hasChanges) {
            console.log("✨ 반영할 변경사항이 없습니다.");
            execSync(`git checkout ${defaultBranch}`, { stdio: "inherit" });
            return;
        }

        execSync(
            `git commit -m "🎨 Design: Document Update (${timestamp}) [skip ci]"`,
            { stdio: "inherit" },
        );

        // 7. 푸시 및 PR 생성
        console.log(`\n🚀 원격 푸시 중: ${branchName}`);
        execSync(`git push origin ${branchName}`, { stdio: "inherit" });

        try {
            execSync(
                `gh pr create --base ${defaultBranch} --head ${branchName} --title "🎨 Design: Document Update (${timestamp})" --body "업데이트된 디자인 문서를 반영합니다."`,
                { stdio: "inherit" },
            );
        } catch (e) {
            console.log("⚠️ PR 생성 실패 (GitHub에서 수동 생성 가능)");
        }

        // 8. 성공 시 메인 복귀
        execSync(`git checkout ${defaultBranch}`, { stdio: "inherit" });
        console.log("\n✅ 모든 프로세스가 완료되었습니다!");
    } catch (error) {
        console.error(
            `\n❌ 에러 발생: ${error instanceof Error ? error.message : error}`,
        );

        // 🔥 [복구 로직] 에러 발생 시 무조건 main으로 돌아가고 파일을 복구합니다.
        console.log(`\n🏠 안전하게 ${defaultBranch} 브랜치로 복구 시도 중...`);

        try {
            // 현재 만약 새 브랜치에 커밋되지 않은 파일이 있다면 stash에 넣고 이동
            if (execSync("git status --porcelain").toString().trim() !== "") {
                execSync("git stash push -m 'error-backup'", {
                    stdio: "ignore",
                });
                tempStashed = true;
            }

            execSync(`git checkout ${defaultBranch}`, { stdio: "inherit" });

            // 임시 저장했던 파일들을 다시 main에 풀어놓습니다.
            if (tempStashed) {
                execSync("git stash pop", { stdio: "inherit" });
                console.log(
                    "✅ 수정 중이던 파일들이 main 브랜치에 복구되었습니다.",
                );
            }
        } catch (recoveryError) {
            console.error(
                "🚨 복구 도중 심각한 에러가 발생했습니다. 'git stash list'를 확인하세요.",
            );
        }

        process.exit(1);
    }
}

docsPush();
