import { createGitInstance } from '../infra/git-operations.js';
import { syncToGitHub } from '../sync/orchestrator.js';

async function main(): Promise<void> {
  const git = createGitInstance();
  const result = await syncToGitHub(git, { autoTranslate: false });

  if (!result.success) {
    process.exit(1);
  }
}

main();
