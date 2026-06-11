export function isSecureBaseUrl(value) {
    let url;
    try {
        url = new URL(value);
    }
    catch {
        return false;
    }
    if (url.username || url.password) {
        return false;
    }
    if (url.protocol === "https:") {
        return true;
    }
    return url.protocol === "http:" && isLoopbackHost(url.hostname);
}
export function assertSecureBaseUrl(value) {
    if (!isSecureBaseUrl(value)) {
        throw new Error("baseUrl must use HTTPS and must not contain credentials. HTTP is allowed only for localhost, 127.0.0.1, or ::1.");
    }
}
function isLoopbackHost(hostname) {
    const normalized = hostname.toLowerCase().replace(/^\[(.*)\]$/, "$1");
    return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}
//# sourceMappingURL=baseUrl.js.map