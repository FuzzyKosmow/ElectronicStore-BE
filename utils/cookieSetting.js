let cookieSettings = {};
if (process.env.COOKIES_SETTING_HTTP_ONLY) {
    if (process.env.COOKIES_SETTING_HTTP_ONLY === 'false') {
        cookieSettings.httpOnly = false;
    }
    else
        cookieSettings.httpOnly = true;
}
else
    cookieSettings.httpOnly = true;
if (process.env.COOKIES_SETTING_SAME_SITE) {
    cookieSettings.sameSite = process.env.COOKIES_SETTING_SAME_SITE;
}
else
    cookieSettings.sameSite = 'lax';
if (process.env.COOKIES_SETTING_SECURE) {
    if (process.env.COOKIES_SETTING_SECURE === 'false') {
        //Do nothing, no need to set secure to false
    }
    else
        cookieSettings.secure = true;
}
else
    cookieSettings.secure = false;
cookieSettings.expires = Date.now() + (1000 * 60 * 60 * 24 * 7); // 1 week
cookieSettings.maxAge = (1000 * 60 * 60 * 24 * 7);


module.exports = cookieSettings;
