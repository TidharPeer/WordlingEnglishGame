# Publish the project

Target: https://github.com/TidharPeer/WordlingEnglishGame

Git is not installed in the current Codex environment and outbound provider requests return EACCES. No Git initialization, commit or push has occurred here.

From a local terminal with Git for Windows installed and GitHub sign-in available:

1. Run node scripts/generate-audio.mjs --generate (existing recordings are reused; seven slow listening clips are new).
2. Listen to the slow clips in public/audio/voices/slow-*.mp3.
3. Run node scripts/publish-github.mjs.

The publish script checks audio completeness, tests and production build, initializes main if needed, checks the requested origin, scans staged files for local credentials, commits and pushes without force. Git may open its normal GitHub sign-in. Existing unrelated remote history stops the script for reconciliation. Local .env, generated originals, browser caches and dependencies are ignored. Runtime source and bundled game assets are included.
