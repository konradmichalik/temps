/**
 * Update check against the GitHub Releases API (no auth, no third-party
 * service — see the project's network rules). Compares the running version to
 * the latest published release and, if newer, hands back a version + release
 * URL for the UI to surface.
 *
 * The API payload is untrusted external data: we only accept a well-formed
 * semver tag and a github.com release URL before showing anything.
 */
import { fetchJson } from '../utils/fetch';

const REPO = 'konradmichalik/temps';
const LATEST_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

export interface UpdateInfo {
  /** Latest version without a leading "v" (e.g. "1.2.0"). */
  version: string;
  /** Release page on github.com. */
  url: string;
}

interface GhRelease {
  tag_name?: string;
  html_url?: string;
}

interface Version {
  core: [number, number, number];
  /** Pre-release ordinal (`beta.2` → 2); null means a final release. */
  pre: number | null;
}

/** Parse "v1.2.3", "1.2.3" or "2.0.0-beta.1" into comparable parts. */
export function parseVersion(v: string): Version | null {
  const m = v
    .trim()
    .replace(/^v/i, '')
    .match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9a-z.]+))?/i);
  if (!m) return null;
  const preStr = m[4];
  const pre = preStr == null ? null : Number(preStr.match(/\d+/)?.[0] ?? 0);
  return { core: [Number(m[1]), Number(m[2]), Number(m[3])], pre };
}

/** semver-style ordering: -1 if a < b, 1 if a > b, 0 if equal. */
function compare(a: Version, b: Version): number {
  for (let i = 0; i < 3; i++) {
    if (a.core[i] !== b.core[i]) return a.core[i] < b.core[i] ? -1 : 1;
  }
  // Same core: a final release outranks any pre-release of it.
  if (a.pre === b.pre) return 0;
  if (a.pre === null) return 1;
  if (b.pre === null) return -1;
  return a.pre < b.pre ? -1 : 1;
}

/** True if `latest` is strictly newer than `current`. */
export function isNewer(current: string, latest: string): boolean {
  const a = parseVersion(current);
  const b = parseVersion(latest);
  if (!a || !b) return false;
  return compare(b, a) > 0;
}

export async function checkForUpdate(
  currentVersion: string,
): Promise<UpdateInfo | null> {
  let release: GhRelease;
  try {
    release = await fetchJson<GhRelease>(LATEST_URL);
  } catch {
    return null; // offline, rate-limited, or no releases published yet
  }

  const tag = release.tag_name;
  if (!tag || !parseVersion(tag) || !isNewer(currentVersion, tag)) return null;

  const url =
    release.html_url && /^https:\/\/github\.com\//.test(release.html_url)
      ? release.html_url
      : `https://github.com/${REPO}/releases`;

  return { version: tag.replace(/^v/i, ''), url };
}
