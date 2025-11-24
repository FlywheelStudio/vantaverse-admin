import fs from 'fs/promises';
import path from 'path';

export async function getJsonFile<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), 'data', filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    // If file doesn't exist, return empty array or object depending on expected type
    // For now, assuming array for teams
    return [] as unknown as T;
  }
}

export async function updateJsonFile<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', filename);
  const dirPath = path.dirname(filePath);

  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

