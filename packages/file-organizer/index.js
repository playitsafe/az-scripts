import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

function printUsage() {
  console.log(
    "Usage: node ./packages/file-organizer/index.js <folderPath> <prefix>",
  );
  console.log("Example: node ./packages/file-organizer/index.js ./videos xx");
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    const remainingMinutes = Math.floor((safeSeconds % 3600) / 60);
    return `${hours}h${remainingMinutes}m${seconds}s`;
  }

  if (safeSeconds < 60) {
    return `${seconds}s`;
  }

  return `${minutes}m${seconds}s`;
}

async function getMp4DurationSeconds(filePath) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);

    const duration = Number.parseFloat(stdout.trim());
    if (Number.isNaN(duration)) {
      throw new Error("Unable to parse video duration");
    }

    return duration;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        "ffprobe not found. Please install ffmpeg (includes ffprobe) and try again.",
      );
    }

    throw new Error(
      `Failed to read video duration: ${filePath} (${error.message})`,
    );
  }
}

async function collectMp4Files(rootDir) {
  const stack = [rootDir];
  const mp4Files = [];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith(".mp4")) {
        mp4Files.push(fullPath);
      }
    }
  }

  return mp4Files.sort((a, b) => a.localeCompare(b));
}

async function renameMp4Files(targetDir, prefix) {
  const absoluteTargetDir = path.resolve(targetDir);
  const stat = await fs.stat(absoluteTargetDir);
  if (!stat.isDirectory()) {
    throw new Error("Provided path is not a folder");
  }

  const mp4Files = await collectMp4Files(absoluteTargetDir);
  if (mp4Files.length === 0) {
    console.log("No mp4 files found. Nothing to process.");
    return;
  }

  const renamePlans = [];
  const durationCounts = new Map();
  for (const oldPath of mp4Files) {
    const durationSeconds = await getMp4DurationSeconds(oldPath);
    const durationText = formatDuration(durationSeconds);
    const currentCount = (durationCounts.get(durationText) ?? 0) + 1;
    durationCounts.set(durationText, currentCount);

    const duplicateSuffix = currentCount > 1 ? `-${currentCount}` : "";
    const newBaseName = `${prefix}-${durationText}${duplicateSuffix}.mp4`;
    const newPath = path.join(path.dirname(oldPath), newBaseName);

    renamePlans.push({ oldPath, newPath, newBaseName });
  }

  const collisionMap = new Map();
  for (const plan of renamePlans) {
    const normalizedTarget = path.resolve(plan.newPath).toLowerCase();
    if (collisionMap.has(normalizedTarget)) {
      throw new Error(
        `Naming conflict: ${plan.newBaseName} conflicts with ${collisionMap.get(normalizedTarget)}`,
      );
    }
    collisionMap.set(normalizedTarget, plan.newBaseName);
  }

  for (const plan of renamePlans) {
    const currentResolved = path.resolve(plan.oldPath);
    const targetResolved = path.resolve(plan.newPath);
    if (currentResolved === targetResolved) {
      continue;
    }
    await fs.rename(plan.oldPath, plan.newPath);
    console.log(`${path.basename(plan.oldPath)} -> ${plan.newBaseName}`);
  }

  console.log(`Done. Renamed ${renamePlans.length} files.`);
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
  const [targetDir, prefix] = args;
  if (!targetDir || !prefix) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  try {
    await renameMp4Files(targetDir, prefix);
  } catch (error) {
    console.error(`Execution failed: ${error.message}`);
    process.exitCode = 1;
  }
}

await main();
