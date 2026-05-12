#!/usr/bin/env node
"use strict";

const fs = require("fs");
const https = require("https");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const repo = "benitogf/detritus";
const cacheDir = process.env.DETRITUS_CACHE_DIR || path.join(defaultCacheDir(), "detritus-codex");
const binName = process.platform === "win32" ? "detritus.exe" : "detritus";
const binPath = path.join(cacheDir, binName);

main().catch((err) => {
  console.error(`[detritus] ${err.message}`);
  process.exit(1);
});

async function main() {
  await ensureBinary();

  const child = spawn(binPath, process.argv.slice(2), {
    stdio: "inherit",
    windowsHide: true,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

async function ensureBinary() {
  if (fs.existsSync(binPath)) {
    return;
  }

  fs.mkdirSync(cacheDir, { recursive: true });

  const release = await getJson(`https://api.github.com/repos/${repo}/releases/latest`);
  const asset = selectAsset(release);
  const archivePath = path.join(cacheDir, asset.name);
  const extractDir = path.join(cacheDir, "extract");

  console.error(`[detritus] downloading ${asset.name}`);
  await download(asset.browser_download_url, archivePath);

  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir, { recursive: true });
  extractArchive(archivePath, extractDir);

  const extracted = findFile(extractDir, binName);
  if (!extracted) {
    throw new Error(`downloaded archive did not contain ${binName}`);
  }

  fs.copyFileSync(extracted, binPath);
  if (process.platform !== "win32") {
    fs.chmodSync(binPath, 0o755);
  }

  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.rmSync(archivePath, { force: true });
}

function selectAsset(release) {
  const goos = {
    win32: "windows",
    darwin: "darwin",
    linux: "linux",
  }[process.platform];
  const goarch = {
    x64: "amd64",
    arm64: "arm64",
  }[process.arch];

  if (!goos || !goarch) {
    throw new Error(`unsupported platform: ${process.platform}/${process.arch}`);
  }

  const suffix = process.platform === "win32" ? ".zip" : ".tar.gz";
  const needle = `detritus_${goos}_${goarch}${suffix}`;
  const asset = (release.assets || []).find((candidate) => candidate.name === needle);
  if (!asset) {
    throw new Error(`release ${release.tag_name || ""} does not include ${needle}`);
  }
  return asset;
}

function extractArchive(archivePath, extractDir) {
  const command = process.platform === "win32" ? "powershell.exe" : "tar";
  const args = process.platform === "win32"
    ? ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", `Expand-Archive -LiteralPath '${escapePowerShell(archivePath)}' -DestinationPath '${escapePowerShell(extractDir)}' -Force`]
    : ["-xzf", archivePath, "-C", extractDir];

  const result = spawnSync(command, args, { stdio: "inherit", windowsHide: true });
  if (result.status !== 0) {
    throw new Error(`failed to extract ${path.basename(archivePath)}`);
  }
}

function findFile(dir, name) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(fullPath, name);
      if (found) return found;
    } else if (entry.name === name) {
      return fullPath;
    }
  }
  return null;
}

function getJson(url) {
  return request(url).then((body) => JSON.parse(body.toString("utf8")));
}

function download(url, destination) {
  return request(url, destination).then(() => undefined);
}

function request(url, destination, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "detritus-codex-plugin",
        "Accept": "application/vnd.github+json",
      },
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode || 0)) {
        res.resume();
        if (!res.headers.location || redirects > 5) {
          reject(new Error(`redirect failed for ${url}`));
          return;
        }
        resolve(request(new URL(res.headers.location, url).toString(), destination, redirects + 1));
        return;
      }

      if ((res.statusCode || 0) < 200 || (res.statusCode || 0) >= 300) {
        res.resume();
        reject(new Error(`request failed ${res.statusCode}: ${url}`));
        return;
      }

      if (destination) {
        const file = fs.createWriteStream(destination);
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
        file.on("error", reject);
      } else {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      }
    });

    req.on("error", reject);
  });
}

function defaultCacheDir() {
  if (process.platform === "win32") {
    return process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Caches");
  }
  return process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache");
}

function escapePowerShell(value) {
  return value.replace(/'/g, "''");
}
