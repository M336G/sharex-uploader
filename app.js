import { join, isAbsolute } from "node:path";
import { existsSync, mkdirSync, rmdirSync } from "node:fs";
import { readdir, rename } from "node:fs/promises";

import { checkToken, generateRandomString, getClientIP, getFileType } from "./utils/functions.js";
import { RegexCheck } from "./utils/security.js";
import { Headers } from "./utils/utilities.js";

// Check if a token is supplied or allow anyone to upload to the server
if (!process.env.TOKEN)
    console.warn("No TOKEN environment variable set, anyone will be able to use this server!")
if (process.env.TOKEN == "AAAABBBBCCCCDDDD")
    console.warn("The TOKEN environment variable is set to the example value, please change it to a secure one!");

// Get the base URL from environment variable or default to localhost
let BASE_URL = process.env.BASE_URL || "http://localhost:3579/";
if (!BASE_URL.endsWith("/")) BASE_URL += "/";
if (BASE_URL == "http://localhost:3579/")
    console.warn("No BASE_URL environment variable set, defaulting to http://localhost:3579/");

// Set up the storage path
const STORAGE_PATH = process.env.STORAGE_PATH ? (isAbsolute(process.env.STORAGE_PATH) ? process.env.STORAGE_PATH : join(process.cwd(), process.env.STORAGE_PATH)) : join(process.cwd(), "storage");
if (!existsSync(STORAGE_PATH))
    mkdirSync(STORAGE_PATH, { recursive: true, force: true });

// Set up the temporary storage path
const STORAGE_TEMP_PATH = join(STORAGE_PATH, "temp");
if (existsSync(STORAGE_TEMP_PATH)) {
    rmdirSync(STORAGE_TEMP_PATH, { recursive: true, force: true });
    mkdirSync(STORAGE_TEMP_PATH, { recursive: true, force: true });
} else {
    mkdirSync(STORAGE_TEMP_PATH, { recursive: true, force: true });
}

const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE ? Number(process.env.MAX_FILE_SIZE) : 10; // In megabytes
console.info(`Maximum file size set to ${MAX_FILE_SIZE} MB!`);

const server = Bun.serve({
    port: Number(process.env.PORT) || 3579,
    maxRequestBodySize: MAX_FILE_SIZE * 1024 * 1024, // Convert from megabytes to bytes
    development: process.argv.includes("--dev"),

    routes: {
        // Endpoints usable by anyone
        "/:file": {
            OPTIONS: () => { // For CORS headers
                return new Response(null, { status: 204, headers: Headers.everyone });
            },
            GET: async (req) => { // Get a file
                const file = req.params.file;

                // Make sure the file name is valid
                if (!RegexCheck.isValidFilename(file))
                    return new Response("Invalid file name!", { status: 400, headers: Headers.everyone });

                const filePath = join(STORAGE_PATH, file);

                // And make sure it exists
                if (!await Bun.file(filePath).exists())
                    return new Response("File not found!", { status: 404, headers: Headers.everyone });

                // Return the file
                return new Response(Bun.file(filePath), { headers: Headers.everyone });
            }
        },

        // User-only endpoints
        "/": {
            OPTIONS: () => { // For CORS headers
                return new Response(null, { status: 204, headers: Headers.user });
            },
            GET: async (req) => { // List all files that have been uploaded
                if (!checkToken(req.headers.get("Authorization")))
                    return new Response("Invalid token!", { status: 401, headers: Headers.user });

                const files = await readdir(STORAGE_PATH);

                return new Response(files.filter(file => file != "temp").join("\n"), { headers: Headers.user });
            },
            POST: async (req) => { // Upload a new file
                if (!checkToken(req.headers.get("Authorization")))
                    return new Response("Invalid token!", { status: 401, headers: Headers.user });

                const reader = req.body?.getReader();

                // Check if there is a file and if it's not empty
                if (!reader) return new Response("Please send a file!", { status: 400, headers: Headers.root });

                let id = generateRandomString();

                // Create a temporary file path and a writer to it
                const tempPath = join(STORAGE_TEMP_PATH, `${id}.tmp`);
                const fileStream = Bun.file(tempPath).writer();

                // Start to stream the request's file to the temporary location
                try {
                    let probeBuffer = Buffer.alloc(0);
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;

                        const chunk = Buffer.from(value);

                        if (probeBuffer.length < 4100) {
                            probeBuffer = Buffer.concat([probeBuffer, chunk]);

                            if (probeBuffer.length > 4100) probeBuffer = probeBuffer.subarray(0, 4100);
                        }

                        fileStream.write(chunk); // Write the file chunk
                    }
                    fileStream.end(); // Close the file and automatically flush the buffer
                } catch (error) {
                    fileStream.end();
                    await Bun.file(tempPath).delete();
                    return new Response("Internal Server Error", { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
                }

                // Get the actual file type
                let fileType = await getFileType(tempPath);
                if (!fileType) fileType = { mime: "text/plain", ext: "txt" };

                // Make sure the file name is not taken
                let filePath = join(STORAGE_PATH, `${id}.${fileType.ext}`);
                let attempts = 0;
                while (await Bun.file(filePath).exists() && attempts++ < 10) {
                    id = generateRandomString();
                    filePath = join(STORAGE_PATH, `${id}.${fileType.ext}`);
                }
                if (attempts >= 10) {
                    await Bun.file(tempPath).delete();
                    return new Response("Failed to save the file, please try again.", { status: 500, headers: Headers.root });
                }

                await rename(tempPath, filePath);

                console.info(`New file: ${id}.${fileType.ext} (${filePath})! Uploaded by: ${getClientIP(req)}`);
                return new Response(BASE_URL + id + "." + fileType.ext, { headers: Headers.user });
            }
        },

        // If the endpoint is not found
        "/*": new Response("Not Found", { status: 404, headers: { "Access-Control-Allow-Origin": "*" } })
    },
    error(error) {
        console.error(`${error.stack}`);
        return new Response("Internal Server Error", { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
    }
});
console.info(`Server is now running on ${server.url}`);

process.on("unhandledRejection", async (reason, promise) => {
    console.error(reason);
    await server.stop();
    process.exit(1);
});

process.on("uncaughtException", async (error) => {
    console.error(error);
    await server.stop();
    process.exit(1);
});