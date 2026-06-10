import fs from "fs";

export function readJson<T>(filePath: string): T[] {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T[];
}
