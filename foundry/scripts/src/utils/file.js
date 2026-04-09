import fs from 'fs';
import { createStringifyStream, createParseStream } from 'big-json';

/**
 * Write a JavaScript value as JSON to disk.
 * Falls back to streaming stringify (big-json) for payloads that would
 * exceed V8's string-length limit.
 */
export async function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data), { encoding: 'utf8' });
  } catch {
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath, { encoding: 'utf8' });
      const stringifyStream = createStringifyStream({ body: data });

      stringifyStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('close', resolve);

      stringifyStream.pipe(writeStream);
    });
  }
}

/**
 * Read and parse a JSON file, streaming it through big-json
 * to handle files larger than V8's string-length limit.
 */
export async function readJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    const parseStream = createParseStream();
    let result;

    parseStream.on('data', (data) => {
      result = data;
    });
    parseStream.on('end', () => resolve(result));
    parseStream.on('error', reject);

    fs.createReadStream(filePath).pipe(parseStream);
  });
}
