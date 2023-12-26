let cookieSettings = {};
if (process.env.COOKIES_SETTING_HTTP_ONLY) {
    cookieSettings.httpOnly = process.env.COOKIES_SETTING_HTTP_ONLY;
}
else
    cookieSettings.httpOnly = true;
if (process.env.COOKIES_SETTING_SECURE) {
    cookieSettings.sameSite = process.env.COOKIES_SETTING_SAME_SITE;
}
else
    cookieSettings.sameSite = 'lax';
if (process.env.COOKIES_SETTING_SAME_SITE) {
    cookieSettings.secure = process.env.COOKIES_SETTING_SECURE;
}
else
    cookieSettings.secure = false;
cookieSettings.expires = Date.now() + (1000 * 60 * 60 * 24 * 7); // 1 week
cookieSettings.maxAge = (1000 * 60 * 60 * 24 * 7);


module.exports = cookieSettings;
