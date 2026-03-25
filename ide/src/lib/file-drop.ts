import { FileNode } from "@/lib/sample-contracts";

const IGNORED_FOLDERS = new Set(["node_modules", "target", ".git", "dist", "build"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export interface DroppedFile {
  pathParts: string[];
  file: File;
}

interface EntryFile {
  kind: "file";
  pathParts: string[];
  file: File;
}

interface EntryFolder {
  kind: "folder";
  pathParts: string[];
}

type DropEntry = EntryFile | EntryFolder;

const getLanguage = (name: string): FileNode["language"] => {
  if (name.endsWith(".rs")) return "rust";
  if (name.endsWith(".toml")) return "toml";
  return "text";
};

const entryToFile = (entry: FileSystemFileEntry): Promise<File> =>
  new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });

const readDirectoryEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> =>
  new Promise((resolve, reject) => {
    reader.readEntries(resolve, reject);
  });

const walkEntry = async (entry: FileSystemEntry, parentPath: string[]): Promise<DropEntry[]> => {
  const pathParts = [...parentPath, entry.name];

  if (entry.isDirectory) {
    if (IGNORED_FOLDERS.has(entry.name)) return [];

    const folder: EntryFolder = { kind: "folder", pathParts };
    const dirReader = (entry as FileSystemDirectoryEntry).createReader();
    const children: DropEntry[] = [];

    while (true) {
      const batch = await readDirectoryEntries(dirReader);
      if (batch.length === 0) break;
      for (const child of batch) {
        children.push(...(await walkEntry(child, pathParts)));
      }
    }

    return [folder, ...children];
  }

  const file = await entryToFile(entry as FileSystemFileEntry);
  return [{ kind: "file", pathParts, file }];
};

export async function readDropPayload(dataTransfer: DataTransfer): Promise<DropEntry[]> {
  const items = Array.from(dataTransfer.items || []);
  const roots: DropEntry[] = [];

  if (items.length > 0 && items.some((item) => typeof item.webkitGetAsEntry === "function")) {
    for (const item of items) {
      if (item.kind !== "file") continue;
      const entry = item.webkitGetAsEntry?.();
      if (!entry) continue;
      roots.push(...(await walkEntry(entry, [])));
    }
    return roots;
  }

  return Array.from(dataTransfer.files).map((file) => ({
    kind: "file",
    file,
    pathParts: [file.name],
  }));
}

export async function mapDroppedEntriesToTree(entries: DropEntry[]): Promise<{
  nodes: FileNode[];
  totalBytes: number;
  uploadedFiles: number;
  skippedFiles: number;
}> {
  const root: FileNode[] = [];
  let totalBytes = 0;
  let uploadedFiles = 0;
  let skippedFiles = 0;

  const ensureFolderPath = (parts: string[]) => {
    let cursor = root;
    for (const part of parts) {
      if (IGNORED_FOLDERS.has(part)) return null;
      let node = cursor.find((n) => n.type === "folder" && n.name === part);
      if (!node) {
        node = { name: part, type: "folder", children: [] };
        cursor.push(node);
      }
      cursor = node.children ?? [];
      node.children = cursor;
    }
    return cursor;
  };

  for (const entry of entries) {
    if (entry.kind === "folder") {
      ensureFolderPath(entry.pathParts);
      continue;
    }

    const folderPath = entry.pathParts.slice(0, -1);
    const fileName = entry.pathParts[entry.pathParts.length - 1];
    const target = ensureFolderPath(folderPath);
    if (!target) {
      skippedFiles += 1;
      continue;
    }

    if (totalBytes + entry.file.size > MAX_UPLOAD_BYTES) {
      skippedFiles += 1;
      continue;
    }

    const content = await entry.file.text();
    totalBytes += entry.file.size;
    uploadedFiles += 1;

    const existing = target.find((n) => n.type === "file" && n.name === fileName);
    const nextNode: FileNode = {
      name: fileName,
      type: "file",
      language: getLanguage(fileName),
      content,
    };

    if (existing) {
      existing.content = content;
      existing.language = nextNode.language;
    } else {
      target.push(nextNode);
    }
  }

  return { nodes: root, totalBytes, uploadedFiles, skippedFiles };
}

export function mergeFileNodes(base: FileNode[], incoming: FileNode[]): FileNode[] {
  const output = JSON.parse(JSON.stringify(base)) as FileNode[];

  const mergeInto = (target: FileNode[], additions: FileNode[]) => {
    for (const add of additions) {
      const existing = target.find((node) => node.name === add.name && node.type === add.type);

      if (add.type === "folder") {
        if (existing && existing.type === "folder") {
          if (!existing.children) existing.children = [];
          mergeInto(existing.children, add.children ?? []);
        } else {
          target.push(add);
        }
      } else if (existing && existing.type === "file") {
        existing.content = add.content;
        existing.language = add.language;
      } else {
        target.push(add);
      }
    }
  };

  mergeInto(output, incoming);
  return output;
}

export const DROP_LIMIT_BYTES = MAX_UPLOAD_BYTES;
