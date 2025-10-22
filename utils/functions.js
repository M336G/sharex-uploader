import { randomBytes } from "crypto";
import detect from "detect-file-type";

export function getClientIP(request) {
    const headers = request.headers

    let cfConnectingIP = headers.get("cf-connecting-ip");
    if (cfConnectingIP) return cfConnectingIP;

    let xRealIP = headers.get("x-real-ip");
    if (xRealIP) return xRealIP;

    let xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) return xForwardedFor.split(",")[0].trim();

    return request.remoteAddr || "unknown";
}

export function generateRandomString(length = 5) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charsetLength = charset.length;
    const bytes = randomBytes(length);

    let auth = "";
    for (let i = 0; i < length; i++) {
        const index = bytes[i] % charsetLength;
        auth += charset[index];
    }
    return auth;
}

export function checkToken(token) {
    if (process.env.TOKEN) {
        if (token == `Bearer ${process.env.TOKEN}`) return true;
        else return false;
    } else {
        return true;
    }
}

export async function getFileType(path) {
    return new Promise((resolve, reject) => {
        detect.fromFile(path, (error, result) => {
            if (error) return reject(error);
            return resolve(result);
        });
    });
}