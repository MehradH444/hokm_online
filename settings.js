"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * settings.js
 *
 * FILE 6 / 12
 *
 * سیستم کامل تنظیمات بازی
 *
 * امکانات:
 *
 * - مدیریت تنظیمات کاربر
 * - ذخیره تنظیمات در LocalStorage
 * - همگام‌سازی تنظیمات با Supabase
 * - تم روشن / تاریک / خودکار
 * - صدا
 * - موسیقی
 * - افکت‌های صوتی
 * - ویبره
 * - اعلان‌ها
 * - اعلان‌های بازی
 * - اعلان‌های دوستان
 * - اعلان‌های فروشگاه
 * - اعلان‌های سیستم
 * - کیفیت گرافیک
 * - انیمیشن‌ها
 * - کاهش حرکت
 * - زبان
 * - نمایش نام بازیکن
 * - نمایش وضعیت آنلاین
 * - حریم خصوصی
 * - تأیید قبل از خروج از بازی
 * - تأیید قبل از خرید
 * - نمایش آموزش
 * - ذخیره آخرین تنظیمات
 * - بازگردانی تنظیمات پیش‌فرض
 * - پاک‌سازی تنظیمات محلی
 * - هماهنگی با UI
 * - هماهنگی با game.js
 * - هماهنگی با profile.js
 * - هماهنگی با notifications.js
 * - هماهنگی با wallet.js
 * - Event System
 *
 * ================================================================
 */


/* ================================================================
   1. DEFAULT SETTINGS
================================================================ */

const DEFAULT_SETTINGS = {

    /*
     * ظاهر
     */

    theme: "dark",

    language: "fa",

    graphicQuality: "high",

    animations: true,

    reducedMotion: false,


    /*
     * صدا
     */

    soundEnabled: true,

    musicEnabled: true,

    effectsEnabled: true,

    soundVolume: 80,

    musicVolume: 60,

    effectsVolume: 80,


    /*
     * ویبره
     */

    vibrationEnabled: true,


    /*
     * اعلان‌ها
     */

    notificationsEnabled: true,

    gameNotifications: true,

    friendNotifications: true,

    shopNotifications: true,

    systemNotifications: true,


    /*
     * حریم خصوصی
     */

    showOnlineStatus: true,

    showProfileToOthers: true,

    allowFriendRequests: true,


    /*
     * تجربه بازی
     */

    confirmExitGame: true,

    confirmPurchase: true,

    showTutorial: true,

    autoReconnect: true,

    autoStartNextRound: false,


    /*
     * رابط کاربری
     */

    showCoins: true,

    showLevel: true,

    showPlayerName: true,

    showAvatars: true,


    /*
     * گیم‌پلی
     */

    cardAnimation: true,

    cardHints: true,

    highlightLegalMoves: true,

    autoSortCards: true,


    /*
     * عملکرد
     */

    lowPowerMode: false,

    preloadGameAssets: true,


    /*
     * امنیت و حساب
     */

    rememberSession: true

};


/* ================================================================
   2. SETTINGS STATE
================================================================ */

const settingsState = {

    initialized: false,

    loading: false,

    saving: false,

    settings: {

        ...DEFAULT_SETTINGS

    },

    lastSavedAt: null

};


/* ================================================================
   3. SETTINGS EVENTS
================================================================ */

const settingsEvents = {

    listeners: {},


    on(
        eventName,
        callback
    ) {

        if (
            typeof callback !== "function"
        ) {

            return;

        }


        if (
            !this.listeners[eventName]
        ) {

            this.listeners[eventName] = [];

        }


        this.listeners[eventName].push(
            callback
        );

    },


    off(
        eventName,
        callback
    ) {

        if (
            !this.listeners[eventName]
        ) {

            return;

        }


        this.listeners[eventName] =
            this.listeners[eventName].filter(
                listener =>
                    listener !== callback
            );

    },


    emit(
        eventName,
        data
    ) {

        const listeners =
            this.listeners[eventName] || [];


        listeners.forEach(
            callback => {

                try {

                    callback(data);

                } catch (error) {

                    console.error(
                        `خطا در Settings Event: ${eventName}`,
                        error
                    );

                }

            }
        );

    }

};


/* ================================================================
   4. STORAGE KEY
================================================================ */

const SETTINGS_STORAGE_KEY =
    "hokm_online_settings_v1";


/* ================================================================
   5. UTILITY - TOAST
================================================================ */

function settingsToast(
    message,
    icon = "⚙️",
    duration = 3000
) {

    if (
        typeof window.showToast === "function"
    ) {

        window.showToast(
            message,
            icon,
            duration
        );

        return;

    }


    console.log(
        `${icon} ${message}`
    );

}


/* ================================================================
   6. GET SUPABASE CLIENT
================================================================ */

function getSettingsSupabaseClient() {

    if (
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function"
    ) {

        return window.supabaseClient;

    }


    if (
        window.supabase &&
        typeof window.supabase.from === "function"
    ) {

        return window.supabase;

    }


    return null;

}


/* ================================================================
   7. GET CURRENT USER
================================================================ */

function getSettingsCurrentUser() {

    if (
        typeof window.getCurrentUser === "function"
    ) {

        return window.getCurrentUser();

    }


    if (
        window.hokmAuth &&
        typeof window.hokmAuth.getCurrentUser === "function"
    ) {

        return window.hokmAuth.getCurrentUser();

    }


    return null;

}


/* ================================================================
   8. DEEP CLONE SETTINGS
================================================================ */

function cloneSettings(
    settings
) {

    return {

        ...DEFAULT_SETTINGS,

        ...(settings || {})

    };

}


/* ================================================================
   9. NORMALIZE SETTINGS
================================================================ */

function normalizeSettings(
    settings
) {

    const normalized =
        cloneSettings(
            settings
        );


    /*
     * Boolean values
     */

    const booleanKeys = [

        "animations",

        "reducedMotion",

        "soundEnabled",

        "musicEnabled",

        "effectsEnabled",

        "vibrationEnabled",

        "notificationsEnabled",

        "gameNotifications",

        "friendNotifications",

        "shopNotifications",

        "systemNotifications",

        "showOnlineStatus",

        "showProfileToOthers",

        "allowFriendRequests",

        "confirmExitGame",

        "confirmPurchase",

        "showTutorial",

        "autoReconnect",

        "autoStartNextRound",

        "showCoins",

        "showLevel",

        "showPlayerName",

        "showAvatars",

        "cardAnimation",

        "cardHints",

        "highlightLegalMoves",

        "autoSortCards",

        "lowPowerMode",

        "preloadGameAssets",

        "rememberSession"

    ];


    booleanKeys.forEach(
        key => {

            normalized[key] =
                Boolean(
                    normalized[key]
                );

        }
    );


    /*
     * Volume
     */

    normalized.soundVolume =
        clampNumber(
            normalized.soundVolume,
            0,
            100,
            DEFAULT_SETTINGS.soundVolume
        );


    normalized.musicVolume =
        clampNumber(
            normalized.musicVolume,
            0,
            100,
            DEFAULT_SETTINGS.musicVolume
        );


    normalized.effectsVolume =
        clampNumber(
            normalized.effectsVolume,
            0,
            100,
            DEFAULT_SETTINGS.effectsVolume
        );


    /*
     * Theme
     */

    if (
        ![
            "dark",
            "light",
            "auto"
        ].includes(
            normalized.theme
        )
    ) {

        normalized.theme =
            DEFAULT_SETTINGS.theme;

    }


    /*
     * Language
     */

    if (
        typeof normalized.language !== "string" ||
        !normalized.language
    ) {

        normalized.language =
            DEFAULT_SETTINGS.language;

    }


    /*
     * Graphic Quality
     */

    if (
        ![
            "low",
            "medium",
            "high",
            "ultra"
        ].includes(
            normalized.graphicQuality
        )
    ) {

        normalized.graphicQuality =
            DEFAULT_SETTINGS.graphicQuality;

    }


    return normalized;

}


/* ================================================================
   10. CLAMP NUMBER
================================================================ */

function clampNumber(
    value,
    min,
    max,
    fallback
) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return fallback;

    }


    return Math.min(
        max,
        Math.max(
            min,
            number
        )
    );

}


/* ================================================================
   11. LOAD LOCAL SETTINGS
================================================================ */

function loadLocalSettings() {

    try {

        const raw =
            localStorage.getItem(
                SETTINGS_STORAGE_KEY
            );


        if (!raw) {

            return null;

        }


        const parsed =
            JSON.parse(
                raw
            );


        return normalizeSettings(
            parsed
        );

    } catch (error) {

        console.error(
            "خطا در خواندن تنظیمات محلی:",
            error
        );


        return null;

    }

}


/* ================================================================
   12. SAVE LOCAL SETTINGS
================================================================ */

function saveLocalSettings(
    settings = settingsState.settings
) {

    try {

        const normalized =
            normalizeSettings(
                settings
            );


        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify(
                normalized
            )
        );


        return true;

    } catch (error) {

        console.error(
            "خطا در ذخیره تنظیمات محلی:",
            error
        );


        return false;

    }

}


/* ================================================================
   13. LOAD REMOTE SETTINGS
================================================================ */

async function loadRemoteSettings() {

    const client =
        getSettingsSupabaseClient();


    const user =
        getSettingsCurrentUser();


    if (
        !client ||
        !user
    ) {

        return null;

    }


    try {

        /*
         * ابتدا metadata کاربر را بررسی می‌کنیم.
         */

        const metadata =
            user.user_metadata?.settings;


        if (
            metadata &&
            typeof metadata === "object"
        ) {

            return normalizeSettings(
                metadata
            );

        }


        /*
         * سپس در صورت وجود ستون settings
         * در profiles تلاش می‌کنیم آن را بخوانیم.
         */

        const {
            data,
            error
        } = await client
            .from("profiles")
            .select("settings")
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


        if (
            error
        ) {

            /*
             * اگر ستون settings در دیتابیس موجود نباشد،
             * برنامه نباید خراب شود.
             */

            console.warn(
                "تنظیمات Remote قابل دریافت نیستند:",
                error.message || error
            );


            return null;

        }


        if (
            data?.settings &&
            typeof data.settings === "object"
        ) {

            return normalizeSettings(
                data.settings
            );

        }


        return null;

    } catch (error) {

        console.error(
            "خطای loadRemoteSettings:",
            error
        );


        return null;

    }

}


/* ================================================================
   14. SAVE REMOTE SETTINGS
================================================================ */

async function saveRemoteSettings(
    settings = settingsState.settings
) {

    const client =
        getSettingsSupabaseClient();


    const user =
        getSettingsCurrentUser();


    if (
        !client ||
        !user
    ) {

        return false;

    }


    const normalized =
        normalizeSettings(
            settings
        );


    try {

        /*
         * ابتدا تلاش برای ذخیره در profiles
         */

        const {
            error
        } = await client
            .from("profiles")
            .update({

                settings:
                    normalized

            })
            .eq(
                "id",
                user.id
            );


        if (
            !error
        ) {

            return true;

        }


        /*
         * اگر ستون settings وجود نداشته باشد،
         * تلاش دوم از طریق Auth Metadata.
         */

        console.warn(
            "ذخیره تنظیمات در profiles انجام نشد:",
            error.message || error
        );


        if (
            client.auth &&
            typeof client.auth.updateUser === "function"
        ) {

            const {
                error: authError
            } = await client.auth.updateUser({

                data: {

                    settings:
                        normalized

                }

            });


            if (
                !authError
            ) {

                return true;

            }


            console.warn(
                "ذخیره تنظیمات در User Metadata نیز انجام نشد:",
                authError
            );

        }


        return false;

    } catch (error) {

        console.error(
            "خطای saveRemoteSettings:",
            error
        );


        return false;

    }

}


/* ================================================================
   15. INITIALIZE SETTINGS
================================================================ */

async function initializeSettings() {

    if (
        settingsState.initialized
    ) {

        return settingsState;

    }


    if (
        settingsState.loading
    ) {

        return settingsState;

    }


    settingsState.loading =
        true;


    try {

        /*
         * اول تنظیمات محلی
         */

        const localSettings =
            loadLocalSettings();


        if (
            localSettings
        ) {

            settingsState.settings =
                localSettings;

        }


        /*
         * سپس تنظیمات Remote
         */

        const remoteSettings =
            await loadRemoteSettings();


        if (
            remoteSettings
        ) {

            settingsState.settings =
                normalizeSettings(
                    remoteSettings
                );


            saveLocalSettings(
                settingsState.settings
            );

        }


        /*
         * اعمال تنظیمات
         */

        applyAllSettings();


        settingsState.initialized =
            true;


        settingsState.loading =
            false;


        settingsEvents.emit(
            "initialized",
            getSettings()
        );


        return settingsState;

    } catch (error) {

        settingsState.loading =
            false;


        console.error(
            "خطا در initializeSettings:",
            error
        );


        /*
         * حتی در صورت خطا،
         * بازی با تنظیمات پیش‌فرض اجرا شود.
         */

        settingsState.settings =
            normalizeSettings(
                settingsState.settings
            );


        applyAllSettings();


        settingsState.initialized =
            true;


        return settingsState;

    }

}


/* ================================================================
   16. GET ALL SETTINGS
================================================================ */

function getSettings() {

    return {

        ...settingsState.settings

    };

}


/* ================================================================
   17. GET SETTING
================================================================ */

function getSetting(
    key,
    fallback = null
) {

    if (
        Object.prototype.hasOwnProperty.call(
            settingsState.settings,
            key
        )
    ) {

        return settingsState.settings[key];

    }


    return fallback;

}


/* ================================================================
   18. SET SETTING
================================================================ */

async function setSetting(
    key,
    value,
    options = {}
) {

    if (
        typeof key !== "string" ||
        !key
    ) {

        return false;

    }


    const previousValue =
        settingsState.settings[key];


    const updated = {

        ...settingsState.settings,

        [key]:
            value

    };


    settingsState.settings =
        normalizeSettings(
            updated
        );


    /*
     * ذخیره محلی بلافاصله انجام می‌شود
     * تا حتی در صورت قطع اینترنت تنظیمات باقی بمانند.
     */

    saveLocalSettings(
        settingsState.settings
    );


    /*
     * اعمال فوری
     */

    applySetting(
        key,
        settingsState.settings[key]
    );


    /*
     * Event
     */

    settingsEvents.emit(
        "changed",
        {

            key,

            value:
                settingsState.settings[key],

            previousValue,

            settings:
                getSettings()

        }
    );


    /*
     * Remote Save
     */

    if (
        options.remote !== false
    ) {

        saveSettingsToServer();

    }


    return true;

}


/* ================================================================
   19. SET MULTIPLE SETTINGS
================================================================ */

async function setSettings(
    updates = {},
    options = {}
) {

    if (
        !updates ||
        typeof updates !== "object"
    ) {

        return false;

    }


    const previous =
        getSettings();


    settingsState.settings =
        normalizeSettings({

            ...settingsState.settings,

            ...updates

        });


    saveLocalSettings(
        settingsState.settings
    );


    applyAllSettings();


    settingsEvents.emit(
        "changed",
        {

            key: null,

            value:
                settingsState.settings,

            previousValue:
                previous,

            settings:
                getSettings()

        }
    );


    if (
        options.remote !== false
    ) {

        saveSettingsToServer();

    }


    return true;

}


/* ================================================================
   20. SAVE SETTINGS TO SERVER
================================================================ */

async function saveSettingsToServer() {

    if (
        settingsState.saving
    ) {

        return false;

    }


    settingsState.saving =
        true;


    try {

        const result =
            await saveRemoteSettings(
                settingsState.settings
            );


        if (
            result
        ) {

            settingsState.lastSavedAt =
                Date.now();

        }


        return result;

    } catch (error) {

        console.error(
            "خطا در saveSettingsToServer:",
            error
        );


        return false;

    } finally {

        settingsState.saving =
            false;

    }

}


/* ================================================================
   21. APPLY ALL SETTINGS
================================================================ */

function applyAllSettings() {

    Object.keys(
        settingsState.settings
    ).forEach(
        key => {

            applySetting(
                key,
                settingsState.settings[key]
            );

        }
    );


    updateSettingsUI();

}


/* ================================================================
   22. APPLY SINGLE SETTING
================================================================ */

function applySetting(
    key,
    value
) {

    switch (key) {

        case "theme":

            applyTheme(
                value
            );

            break;


        case "language":

            applyLanguage(
                value
            );

            break;


        case "graphicQuality":

            applyGraphicQuality(
                value
            );

            break;


        case "animations":

            applyAnimations(
                value
            );

            break;


        case "reducedMotion":

            applyReducedMotion(
                value
            );

            break;


        case "soundEnabled":

            applySoundEnabled(
                value
            );

            break;


        case "musicEnabled":

            applyMusicEnabled(
                value
            );

            break;


        case "effectsEnabled":

            applyEffectsEnabled(
                value
            );

            break;


        case "soundVolume":

            applySoundVolume(
                value
            );

            break;


        case "musicVolume":

            applyMusicVolume(
                value
            );

            break;


        case "effectsVolume":

            applyEffectsVolume(
                value
            );

            break;


        case "vibrationEnabled":

            applyVibrationEnabled(
                value
            );

            break;


        case "notificationsEnabled":

            applyNotificationsEnabled(
                value
            );

            break;


        case "showOnlineStatus":

            applyOnlineStatus(
                value
            );

            break;


        case "showProfileToOthers":

            applyProfileVisibility(
                value
            );

            break;


        case "showCoins":

        case "showLevel":

        case "showPlayerName":

        case "showAvatars":

            updateSettingsUI();

            break;


        case "cardAnimation":

        case "cardHints":

        case "highlightLegalMoves":

        case "autoSortCards":

            applyGameSettings();

            break;


        case "lowPowerMode":

            applyLowPowerMode(
                value
            );

            break;


        default:

            break;

    }

}


/* ================================================================
   23. APPLY THEME
================================================================ */

function applyTheme(
    theme
) {

    const root =
        document.documentElement;


    if (!root) {

        return;

    }


    let finalTheme =
        theme;


    if (
        theme === "auto"
    ) {

        const prefersDark =
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;


        finalTheme =
            prefersDark
                ? "dark"
                : "light";

    }


    root.setAttribute(
        "data-theme",
        finalTheme
    );


    root.classList.toggle(
        "theme-dark",
        finalTheme === "dark"
    );


    root.classList.toggle(
        "theme-light",
        finalTheme === "light"
    );


    document.body?.classList.toggle(
        "dark-mode",
        finalTheme === "dark"
    );


    document.body?.classList.toggle(
        "light-mode",
        finalTheme === "light"
    );


    settingsEvents.emit(
        "themeChanged",
        finalTheme
    );

}


/* ================================================================
   24. SYSTEM THEME LISTENER
================================================================ */

function setupSystemThemeListener() {

    if (
        !window.matchMedia
    ) {

        return;

    }


    const mediaQuery =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        );


    const handler =
        () => {

            if (
                settingsState.settings.theme === "auto"
            ) {

                applyTheme(
                    "auto"
                );

            }

        };


    if (
        typeof mediaQuery.addEventListener === "function"
    ) {

        mediaQuery.addEventListener(
            "change",
            handler
        );

    } else if (
        typeof mediaQuery.addListener === "function"
    ) {

        mediaQuery.addListener(
            handler
        );

    }

}


/* ================================================================
   25. APPLY LANGUAGE
================================================================ */

function applyLanguage(
    language
) {

    document.documentElement.setAttribute(
        "lang",
        language
    );


    if (
        language === "fa"
    ) {

        document.documentElement.setAttribute(
            "dir",
            "rtl"
        );

    } else {

        document.documentElement.setAttribute(
            "dir",
            "ltr"
        );

    }


    settingsEvents.emit(
        "languageChanged",
        language
    );

}


/* ================================================================
   26. APPLY GRAPHIC QUALITY
================================================================ */

function applyGraphicQuality(
    quality
) {

    const body =
        document.body;


    if (!body) {

        return;

    }


    body.classList.remove(
        "quality-low",
        "quality-medium",
        "quality-high",
        "quality-ultra"
    );


    body.classList.add(
        `quality-${quality}`
    );


    document.documentElement.setAttribute(
        "data-quality",
        quality
    );


    settingsEvents.emit(
        "graphicQualityChanged",
        quality
    );

}


/* ================================================================
   27. APPLY ANIMATIONS
================================================================ */

function applyAnimations(
    enabled
) {

    document.documentElement.classList.toggle(
        "animations-disabled",
        !enabled
    );


    if (
        !enabled
    ) {

        document.documentElement.classList.add(
            "no-animations"
        );

    } else {

        document.documentElement.classList.remove(
            "no-animations"
        );

    }


    applyGameSettings();

}


/* ================================================================
   28. APPLY REDUCED MOTION
================================================================ */

function applyReducedMotion(
    enabled
) {

    document.documentElement.classList.toggle(
        "reduced-motion",
        Boolean(enabled)
    );

}


/* ================================================================
   29. APPLY SOUND
================================================================ */

function applySoundEnabled(
    enabled
) {

    if (
        typeof window.setSoundEnabled === "function"
    ) {

        window.setSoundEnabled(
            Boolean(enabled)
        );

    }


    settingsEvents.emit(
        "soundChanged",
        Boolean(enabled)
    );

}


/* ================================================================
   30. APPLY MUSIC
================================================================ */

function applyMusicEnabled(
    enabled
) {

    if (
        typeof window.setMusicEnabled === "function"
    ) {

        window.setMusicEnabled(
            Boolean(enabled)
        );

    }


    settingsEvents.emit(
        "musicChanged",
        Boolean(enabled)
    );

}


/* ================================================================
   31. APPLY EFFECTS
================================================================ */

function applyEffectsEnabled(
    enabled
) {

    if (
        typeof window.setEffectsEnabled === "function"
    ) {

        window.setEffectsEnabled(
            Boolean(enabled)
        );

    }


    settingsEvents.emit(
        "effectsChanged",
        Boolean(enabled)
    );

}


/* ================================================================
   32. APPLY SOUND VOLUME
================================================================ */

function applySoundVolume(
    volume
) {

    const normalized =
        Number(volume) / 100;


    if (
        typeof window.setSoundVolume === "function"
    ) {

        window.setSoundVolume(
            normalized
        );

    }


    settingsEvents.emit(
        "soundVolumeChanged",
        Number(volume)
    );

}


/* ================================================================
   33. APPLY MUSIC VOLUME
================================================================ */

function applyMusicVolume(
    volume
) {

    const normalized =
        Number(volume) / 100;


    if (
        typeof window.setMusicVolume === "function"
    ) {

        window.setMusicVolume(
            normalized
        );

    }


    settingsEvents.emit(
        "musicVolumeChanged",
        Number(volume)
    );

}


/* ================================================================
   34. APPLY EFFECT VOLUME
================================================================ */

function applyEffectsVolume(
    volume
) {

    const normalized =
        Number(volume) / 100;


    if (
        typeof window.setEffectsVolume === "function"
    ) {

        window.setEffectsVolume(
            normalized
        );

    }


    settingsEvents.emit(
        "effectsVolumeChanged",
        Number(volume)
    );

}


/* ================================================================
   35. APPLY VIBRATION
================================================================ */

function applyVibrationEnabled(
    enabled
) {

    settingsEvents.emit(
        "vibrationChanged",
        Boolean(enabled)
    );

}


/* ================================================================
   36. APPLY NOTIFICATIONS
================================================================ */

function applyNotificationsEnabled(
    enabled
) {

    document.documentElement.classList.toggle(
        "notifications-disabled",
        !enabled
    );


    if (
        window.hokmNotifications &&
        typeof window.hokmNotifications.setEnabled === "function"
    ) {

        window.hokmNotifications.setEnabled(
            Boolean(enabled)
        );

    }


    settingsEvents.emit(
        "notificationsChanged",
        Boolean(enabled)
    );

}


/* ================================================================
   37. APPLY ONLINE STATUS
================================================================ */

function applyOnlineStatus(
    enabled
) {

    document.documentElement.setAttribute(
        "data-show-online",
        enabled
            ? "true"
            : "false"
    );


    settingsEvents.emit(
        "onlineStatusChanged",
        Boolean(enabled)
    );

}


/* ================================================================
   38. APPLY PROFILE VISIBILITY
================================================================ */

function applyProfileVisibility(
    enabled
) {

    document.documentElement.setAttribute(
        "data-profile-visible",
        enabled
            ? "true"
            : "false"
    );


    settingsEvents.emit(
        "profileVisibilityChanged",
        Boolean(enabled)
    );

}


/* ================================================================
   39. APPLY GAME SETTINGS
================================================================ */

function applyGameSettings() {

    const gameSettings = {

        animations:
            settingsState.settings.animations,

        reducedMotion:
            settingsState.settings.reducedMotion,

        cardAnimation:
            settingsState.settings.cardAnimation,

        cardHints:
            settingsState.settings.cardHints,

        highlightLegalMoves:
            settingsState.settings.highlightLegalMoves,

        autoSortCards:
            settingsState.settings.autoSortCards,

        graphicQuality:
            settingsState.settings.graphicQuality

    };


    /*
     * هماهنگی با game.js
     */

    if (
        window.hokmGame &&
        typeof window.hokmGame.applySettings === "function"
    ) {

        window.hokmGame.applySettings(
            gameSettings
        );

    }


    /*
     * API عمومی game.js
     */

    if (
        typeof window.applyGameSettings === "function" &&
        window.applyGameSettings !== applyGameSettings
    ) {

        try {

            window.applyGameSettings(
                gameSettings
            );

        } catch (error) {

            console.warn(
                "هماهنگی تنظیمات با game.js انجام نشد:",
                error
            );

        }

    }


    settingsEvents.emit(
        "gameSettingsChanged",
        gameSettings
    );

}


/* ================================================================
   40. APPLY LOW POWER MODE
================================================================ */

function applyLowPowerMode(
    enabled
) {

    document.documentElement.classList.toggle(
        "low-power-mode",
        Boolean(enabled)
    );


    if (
        enabled
    ) {

        document.documentElement.classList.add(
            "performance-mode"
        );

    } else {

        document.documentElement.classList.remove(
            "performance-mode"
        );

    }


    settingsEvents.emit(
        "lowPowerModeChanged",
        Boolean(enabled)
    );

}


/* ================================================================
   41. UPDATE SETTINGS UI
================================================================ */

function updateSettingsUI() {

    const settings =
        settingsState.settings;


    /*
     * Checkbox / Toggle
     */

    const checkboxElements =
        document.querySelectorAll(
            "[data-setting]"
        );


    checkboxElements.forEach(
        element => {

            const key =
                element.dataset.setting;


            if (
                !Object.prototype.hasOwnProperty.call(
                    settings,
                    key
                )
            ) {

                return;

            }


            const value =
                settings[key];


            if (
                element.type === "checkbox"
            ) {

                element.checked =
                    Boolean(value);

            }


            if (
                element.type === "range"
            ) {

                element.value =
                    value;

            }


            if (
                element.tagName === "SELECT"
            ) {

                element.value =
                    value;

            }


            if (
                element.tagName === "INPUT" &&
                element.type === "radio"
            ) {

                element.checked =
                    element.value === String(value);

            }

        }
    );


    /*
     * Text elements
     */

    document
        .querySelectorAll(
            "[data-setting-value]"
        )
        .forEach(
            element => {

                const key =
                    element.dataset.settingValue;


                if (
                    Object.prototype.hasOwnProperty.call(
                        settings,
                        key
                    )
                ) {

                    element.textContent =
                        formatSettingValue(
                            key,
                            settings[key]
                        );

                }

            }
        );


    /*
     * Theme buttons
     */

    document
        .querySelectorAll(
            "[data-theme-option]"
        )
        .forEach(
            element => {

                const active =
                    element.dataset.themeOption ===
                    settings.theme;


                element.classList.toggle(
                    "active",
                    active
                );

                element.setAttribute(
                    "aria-selected",
                    active
                        ? "true"
                        : "false"
                );

            }
        );


    /*
     * Graphic Quality buttons
     */

    document
        .querySelectorAll(
            "[data-quality-option]"
        )
        .forEach(
            element => {

                const active =
                    element.dataset.qualityOption ===
                    settings.graphicQuality;


                element.classList.toggle(
                    "active",
                    active
                );

            }
        );


    /*
     * Language buttons
     */

    document
        .querySelectorAll(
            "[data-language-option]"
        )
        .forEach(
            element => {

                const active =
                    element.dataset.languageOption ===
                    settings.language;


                element.classList.toggle(
                    "active",
                    active
                );

            }
        );

}


/* ================================================================
   42. FORMAT SETTING VALUE
================================================================ */

function formatSettingValue(
    key,
    value
) {

    switch (key) {

        case "theme":

            if (
                value === "dark"
            ) {

                return "تیره";

            }

            if (
                value === "light"
            ) {

                return "روشن";

            }

            return "خودکار";


        case "graphicQuality":

            if (
                value === "low"
            ) {

                return "پایین";

            }

            if (
                value === "medium"
            ) {

                return "متوسط";

            }

            if (
                value === "high"
            ) {

                return "بالا";

            }

            return "فوق‌العاده";


        case "soundVolume":

        case "musicVolume":

        case "effectsVolume":

            return `${Number(value)}٪`;


        default:

            if (
                typeof value === "boolean"
            ) {

                return value
                    ? "فعال"
                    : "غیرفعال";

            }


            return String(
                value
            );

    }

}


/* ================================================================
   43. SET THEME
================================================================ */

async function setTheme(
    theme
) {

    if (
        ![
            "dark",
            "light",
            "auto"
        ].includes(
            theme
        )
    ) {

        return false;

    }


    return await setSetting(
        "theme",
        theme
    );

}


/* ================================================================
   44. SET GRAPHIC QUALITY
================================================================ */

async function setGraphicQuality(
    quality
) {

    if (
        ![
            "low",
            "medium",
            "high",
            "ultra"
        ].includes(
            quality
        )
    ) {

        return false;

    }


    return await setSetting(
        "graphicQuality",
        quality
    );

}


/* ================================================================
   45. SET LANGUAGE
================================================================ */

async function setLanguage(
    language
) {

    if (
        typeof language !== "string" ||
        !language
    ) {

        return false;

    }


    return await setSetting(
        "language",
        language
    );

}


/* ================================================================
   46. TOGGLE SETTING
================================================================ */

async function toggleSetting(
    key
) {

    const current =
        Boolean(
            getSetting(
                key,
                false
            )
        );


    return await setSetting(
        key,
        !current
    );

}


/* ================================================================
   47. ENABLE SOUND
================================================================ */

async function enableSound() {

    return await setSetting(
        "soundEnabled",
        true
    );

}


/* ================================================================
   48. DISABLE SOUND
================================================================ */

async function disableSound() {

    return await setSetting(
        "soundEnabled",
        false
    );

}


/* ================================================================
   49. ENABLE MUSIC
================================================================ */

async function enableMusic() {

    return await setSetting(
        "musicEnabled",
        true
    );

}


/* ================================================================
   50. DISABLE MUSIC
================================================================ */

async function disableMusic() {

    return await setSetting(
        "musicEnabled",
        false
    );

}


/* ================================================================
   51. ENABLE VIBRATION
================================================================ */

async function enableVibration() {

    return await setSetting(
        "vibrationEnabled",
        true
    );

}


/* ================================================================
   52. DISABLE VIBRATION
================================================================ */

async function disableVibration() {

    return await setSetting(
        "vibrationEnabled",
        false
    );

}


/* ================================================================
   53. VIBRATE
================================================================ */

function vibrate(
    pattern = 30
) {

    if (
        !settingsState.settings.vibrationEnabled
    ) {

        return false;

    }


    if (
        !navigator.vibrate
    ) {

        return false;

    }


    try {

        navigator.vibrate(
            pattern
        );


        return true;

    } catch (error) {

        console.warn(
            "ویبره در دسترس نیست:",
            error
        );


        return false;

    }

}


/* ================================================================
   54. RESET SETTINGS
================================================================ */

async function resetSettings(
    options = {}
) {

    const previous =
        getSettings();


    settingsState.settings =
        normalizeSettings(
            DEFAULT_SETTINGS
        );


    saveLocalSettings(
        settingsState.settings
    );


    applyAllSettings();


    settingsEvents.emit(
        "reset",
        {

            previous,

            settings:
                getSettings()

        }
    );


    if (
        options.remote !== false
    ) {

        await saveSettingsToServer();

    }


    if (
        options.showToast !== false
    ) {

        settingsToast(
            "تنظیمات به حالت پیش‌فرض برگشت.",
            "🔄"
        );

    }


    return true;

}


/* ================================================================
   55. CLEAR LOCAL SETTINGS
================================================================ */

function clearLocalSettings() {

    try {

        localStorage.removeItem(
            SETTINGS_STORAGE_KEY
        );


        return true;

    } catch (error) {

        console.error(
            "خطا در پاک کردن تنظیمات:",
            error
        );


        return false;

    }

}


/* ================================================================
   56. CHECK SETTING
================================================================ */

function hasSetting(
    key
) {

    return Object.prototype.hasOwnProperty.call(
        settingsState.settings,
        key
    );

}


/* ================================================================
   57. SETTINGS PANEL OPEN
================================================================ */

function openSettingsPanel() {

    const panel =
        document.querySelector(
            "[data-settings-panel]"
        );


    if (
        panel
    ) {

        panel.classList.add(
            "active",
            "open"
        );


        panel.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    document.body?.classList.add(
        "settings-open"
    );


    updateSettingsUI();


    settingsEvents.emit(
        "panelOpened"
    );

}


/* ================================================================
   58. SETTINGS PANEL CLOSE
================================================================ */

function closeSettingsPanel() {

    const panel =
        document.querySelector(
            "[data-settings-panel]"
        );


    if (
        panel
    ) {

        panel.classList.remove(
            "active",
            "open"
        );


        panel.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    document.body?.classList.remove(
        "settings-open"
    );


    settingsEvents.emit(
        "panelClosed"
    );

}


/* ================================================================
   59. SETTINGS PANEL TOGGLE
================================================================ */

function toggleSettingsPanel() {

    const panel =
        document.querySelector(
            "[data-settings-panel]"
        );


    if (
        panel &&
        (
            panel.classList.contains("open") ||
            panel.classList.contains("active")
        )
    ) {

        closeSettingsPanel();

    } else {

        openSettingsPanel();

    }

}


/* ================================================================
   60. CONFIRM EXIT GAME
================================================================ */

function shouldConfirmExitGame() {

    return Boolean(
        settingsState.settings.confirmExitGame
    );

}


/* ================================================================
   61. CONFIRM PURCHASE
================================================================ */

function shouldConfirmPurchase() {

    return Boolean(
        settingsState.settings.confirmPurchase
    );

}


/* ================================================================
   62. SHOULD SHOW TUTORIAL
================================================================ */

function shouldShowTutorial() {

    return Boolean(
        settingsState.settings.showTutorial
    );

}


/* ================================================================
   63. SHOULD AUTO RECONNECT
================================================================ */

function shouldAutoReconnect() {

    return Boolean(
        settingsState.settings.autoReconnect
    );

}


/* ================================================================
   64. SHOULD AUTO SORT CARDS
================================================================ */

function shouldAutoSortCards() {

    return Boolean(
        settingsState.settings.autoSortCards
    );

}


/* ================================================================
   65. SHOULD HIGHLIGHT LEGAL MOVES
================================================================ */

function shouldHighlightLegalMoves() {

    return Boolean(
        settingsState.settings.highlightLegalMoves
    );

}


/* ================================================================
   66. SHOULD SHOW CARD HINTS
================================================================ */

function shouldShowCardHints() {

    return Boolean(
        settingsState.settings.cardHints
    );

}


/* ================================================================
   67. SHOULD USE CARD ANIMATION
================================================================ */

function shouldUseCardAnimation() {

    return Boolean(
        settingsState.settings.cardAnimation &&
        settingsState.settings.animations &&
        !settingsState.settings.reducedMotion
    );

}


/* ================================================================
   68. SHOULD SHOW NOTIFICATIONS
================================================================ */

function shouldShowNotifications() {

    return Boolean(
        settingsState.settings.notificationsEnabled
    );

}


/* ================================================================
   69. SHOULD SHOW ONLINE STATUS
================================================================ */

function shouldShowOnlineStatus() {

    return Boolean(
        settingsState.settings.showOnlineStatus
    );

}


/* ================================================================
   70. SHOULD SHOW PROFILE
================================================================ */

function shouldShowProfileToOthers() {

    return Boolean(
        settingsState.settings.showProfileToOthers
    );

}


/* ================================================================
   71. SHOULD ALLOW FRIEND REQUESTS
================================================================ */

function shouldAllowFriendRequests() {

    return Boolean(
        settingsState.settings.allowFriendRequests
    );

}


/* ================================================================
   72. HANDLE SETTING UI EVENTS
================================================================ */

function setupSettingsUIEvents() {

    /*
     * عناصر دارای data-setting
     */

    document
        .querySelectorAll(
            "[data-setting]"
        )
        .forEach(
            element => {

                if (
                    element.dataset.settingsBound === "true"
                ) {

                    return;

                }


                element.dataset.settingsBound =
                    "true";


                const key =
                    element.dataset.setting;


                element.addEventListener(
                    "change",
                    async event => {

                        let value;


                        if (
                            element.type === "checkbox"
                        ) {

                            value =
                                element.checked;

                        } else if (
                            element.type === "range"
                        ) {

                            value =
                                Number(
                                    element.value
                                );

                        } else {

                            value =
                                element.value;

                        }


                        await setSetting(
                            key,
                            value
                        );

                    }
                );

            }
        );


    /*
     * Theme buttons
     */

    document
        .querySelectorAll(
            "[data-theme-option]"
        )
        .forEach(
            element => {

                if (
                    element.dataset.settingsBound === "true"
                ) {

                    return;

                }


                element.dataset.settingsBound =
                    "true";


                element.addEventListener(
                    "click",
                    () => {

                        setTheme(
                            element.dataset.themeOption
                        );

                    }
                );

            }
        );


    /*
     * Quality buttons
     */

    document
        .querySelectorAll(
            "[data-quality-option]"
        )
        .forEach(
            element => {

                if (
                    element.dataset.settingsBound === "true"
                ) {

                    return;

                }


                element.dataset.settingsBound =
                    "true";


                element.addEventListener(
                    "click",
                    () => {

                        setGraphicQuality(
                            element.dataset.qualityOption
                        );

                    }
                );

            }
        );


    /*
     * Language buttons
     */

    document
        .querySelectorAll(
            "[data-language-option]"
        )
        .forEach(
            element => {

                if (
                    element.dataset.settingsBound === "true"
                ) {

                    return;

                }


                element.dataset.settingsBound =
                    "true";


                element.addEventListener(
                    "click",
                    () => {

                        setLanguage(
                            element.dataset.languageOption
                        );

                    }
                );

            }
        );


    /*
     * Open Settings
     */

    document
        .querySelectorAll(
            "[data-open-settings]"
        )
        .forEach(
            element => {

                if (
                    element.dataset.settingsBound === "true"
                ) {

                    return;

                }


                element.dataset.settingsBound =
                    "true";


                element.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        openSettingsPanel();

                    }
                );

            }
        );


    /*
     * Close Settings
     */

    document
        .querySelectorAll(
            "[data-close-settings]"
        )
        .forEach(
            element => {

                if (
                    element.dataset.settingsBound === "true"
                ) {

                    return;

                }


                element.dataset.settingsBound =
                    "true";


                element.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        closeSettingsPanel();

                    }
                );

            }
        );


    /*
     * Reset Settings
     */

    document
        .querySelectorAll(
            "[data-reset-settings]"
        )
        .forEach(
            element => {

                if (
                    element.dataset.settingsBound === "true"
                ) {

                    return;

                }


                element.dataset.settingsBound =
                    "true";


                element.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();


                        await resetSettings();

                    }
                );

            }
        );

}


/* ================================================================
   73. KEYBOARD / BACK BUTTON
================================================================ */

function setupSettingsNavigation() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                const panel =
                    document.querySelector(
                        "[data-settings-panel]"
                    );


                if (
                    panel &&
                    (
                        panel.classList.contains("open") ||
                        panel.classList.contains("active")
                    )
                ) {

                    closeSettingsPanel();

                }

            }

        }
    );


    /*
     * Android / Browser Back
     *
     * فقط در صورتی که پنل تنظیمات باز باشد.
     */

    window.addEventListener(
        "popstate",
        () => {

            const panel =
                document.querySelector(
                    "[data-settings-panel]"
                );


            if (
                panel &&
                (
                    panel.classList.contains("open") ||
                    panel.classList.contains("active")
                )
            ) {

                closeSettingsPanel();

            }

        }
    );

}


/* ================================================================
   74. BEFORE UNLOAD
================================================================ */

function setupSettingsUnloadProtection() {

    window.addEventListener(
        "beforeunload",
        () => {

            /*
             * آخرین نسخه محلی تنظیمات
             * همیشه ذخیره می‌شود.
             */

            saveLocalSettings(
                settingsState.settings
            );

        }
    );

}


/* ================================================================
   75. SYNC AFTER AUTH
================================================================ */

function setupAuthSettingsSync() {

    /*
     * اگر auth.js قبلاً آماده باشد.
     */

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.onAuthChange === "function"
    ) {

        window.hokmAuth.onAuthChange(
            async data => {

                if (
                    data?.user
                ) {

                    const remote =
                        await loadRemoteSettings();


                    if (
                        remote
                    ) {

                        settingsState.settings =
                            normalizeSettings(
                                remote
                            );


                        saveLocalSettings(
                            settingsState.settings
                        );


                        applyAllSettings();

                    }

                }

            }
        );

    }

}


/* ================================================================
   76. PAGE VISIBILITY
================================================================ */

function setupVisibilityHandler() {

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState === "visible"
            ) {

                /*
                 * تنظیمات محلی را دوباره بررسی می‌کنیم.
                 * این کار برای چند تب / چند صفحه مفید است.
                 */

                const local =
                    loadLocalSettings();


                if (
                    local
                ) {

                    settingsState.settings =
                        normalizeSettings(
                            local
                        );


                    applyAllSettings();

                }

            }

        }
    );

}


/* ================================================================
   77. STORAGE EVENT
================================================================ */

function setupStorageSync() {

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key !== SETTINGS_STORAGE_KEY
            ) {

                return;

            }


            const settings =
                loadLocalSettings();


            if (
                settings
            ) {

                settingsState.settings =
                    settings;


                applyAllSettings();


                settingsEvents.emit(
                    "externalChange",
                    getSettings()
                );

            }

        }
    );

}


/* ================================================================
   78. SETTINGS API FOR GAME
================================================================ */

function getGameSettings() {

    return {

        animations:
            settingsState.settings.animations,

        reducedMotion:
            settingsState.settings.reducedMotion,

        cardAnimation:
            settingsState.settings.cardAnimation,

        cardHints:
            settingsState.settings.cardHints,

        highlightLegalMoves:
            settingsState.settings.highlightLegalMoves,

        autoSortCards:
            settingsState.settings.autoSortCards,

        graphicQuality:
            settingsState.settings.graphicQuality,

        lowPowerMode:
            settingsState.settings.lowPowerMode,

        vibrationEnabled:
            settingsState.settings.vibrationEnabled,

        soundEnabled:
            settingsState.settings.soundEnabled,

        effectsEnabled:
            settingsState.settings.effectsEnabled,

        musicEnabled:
            settingsState.settings.musicEnabled

    };

}


/* ================================================================
   79. SETTINGS API FOR UI
================================================================ */

function getUISettings() {

    return {

        theme:
            settingsState.settings.theme,

        language:
            settingsState.settings.language,

        showCoins:
            settingsState.settings.showCoins,

        showLevel:
            settingsState.settings.showLevel,

        showPlayerName:
            settingsState.settings.showPlayerName,

        showAvatars:
            settingsState.settings.showAvatars,

        showOnlineStatus:
            settingsState.settings.showOnlineStatus

    };

}


/* ================================================================
   80. SETTINGS API FOR NOTIFICATIONS
================================================================ */

function getNotificationSettings() {

    return {

        enabled:
            settingsState.settings.notificationsEnabled,

        game:
            settingsState.settings.gameNotifications,

        friends:
            settingsState.settings.friendNotifications,

        shop:
            settingsState.settings.shopNotifications,

        system:
            settingsState.settings.systemNotifications

    };

}


/* ================================================================
   81. SETTINGS API FOR PRIVACY
================================================================ */

function getPrivacySettings() {

    return {

        showOnlineStatus:
            settingsState.settings.showOnlineStatus,

        showProfileToOthers:
            settingsState.settings.showProfileToOthers,

        allowFriendRequests:
            settingsState.settings.allowFriendRequests

    };

}


/* ================================================================
   82. SETTINGS API FOR PURCHASES
================================================================ */

function getPurchaseSettings() {

    return {

        confirmPurchase:
            settingsState.settings.confirmPurchase

    };

}


/* ================================================================
   83. SETTINGS API FOR GAME EXIT
================================================================ */

function getGameExitSettings() {

    return {

        confirmExitGame:
            settingsState.settings.confirmExitGame,

        autoReconnect:
            settingsState.settings.autoReconnect,

        autoStartNextRound:
            settingsState.settings.autoStartNextRound

    };

}


/* ================================================================
   84. SETTINGS EVENT HELPERS
================================================================ */

function onSettingsChange(
    callback
) {

    settingsEvents.on(
        "changed",
        callback
    );

}


function onThemeChange(
    callback
) {

    settingsEvents.on(
        "themeChanged",
        callback
    );

}


function onLanguageChange(
    callback
) {

    settingsEvents.on(
        "languageChanged",
        callback
    );

}


function onGameSettingsChange(
    callback
) {

    settingsEvents.on(
        "gameSettingsChanged",
        callback
    );

}


function onNotificationSettingsChange(
    callback
) {

    settingsEvents.on(
        "notificationsChanged",
        callback
    );

}


/* ================================================================
   85. PUBLIC API
================================================================ */

window.hokmSettings = {

    initialize:
        initializeSettings,

    getSettings,

    getSetting,

    setSetting,

    setSettings,

    save:
        saveSettingsToServer,

    reset:
        resetSettings,

    clearLocal:
        clearLocalSettings,

    hasSetting,

    setTheme,

    setGraphicQuality,

    setLanguage,

    toggleSetting,

    enableSound,

    disableSound,

    enableMusic,

    disableMusic,

    enableVibration,

    disableVibration,

    vibrate,

    open:
        openSettingsPanel,

    close:
        closeSettingsPanel,

    toggle:
        toggleSettingsPanel,

    shouldConfirmExitGame,

    shouldConfirmPurchase,

    shouldShowTutorial,

    shouldAutoReconnect,

    shouldAutoSortCards,

    shouldHighlightLegalMoves,

    shouldShowCardHints,

    shouldUseCardAnimation,

    shouldShowNotifications,

    shouldShowOnlineStatus,

    shouldShowProfileToOthers,

    shouldAllowFriendRequests,

    getGameSettings,

    getUISettings,

    getNotificationSettings,

    getPrivacySettings,

    getPurchaseSettings,

    getGameExitSettings,

    onChange:
        onSettingsChange,

    onThemeChange,

    onLanguageChange,

    onGameSettingsChange,

    onNotificationSettingsChange,

    applyAll:
        applyAllSettings,

    updateUI:
        updateSettingsUI

};


/* ================================================================
   86. GLOBAL SHORTCUTS
================================================================ */

window.getSettings =
    getSettings;


window.getSetting =
    getSetting;


window.setSetting =
    setSetting;


window.setSettings =
    setSettings;


window.setTheme =
    setTheme;


window.setGraphicQuality =
    setGraphicQuality;


window.setLanguage =
    setLanguage;


window.resetSettings =
    resetSettings;


window.openSettings =
    openSettingsPanel;


window.closeSettings =
    closeSettingsPanel;


window.toggleSettings =
    toggleSettingsPanel;


window.vibrateGame =
    vibrate;


/* ================================================================
   87. INITIALIZATION
================================================================ */

function startSettingsInitialization() {

    /*
     * سیستم تنظیمات را راه‌اندازی می‌کنیم.
     */

    initializeSettings();


    /*
     * Event handlers
     */

    setupSettingsUIEvents();

    setupSettingsNavigation();

    setupSettingsUnloadProtection();

    setupAuthSettingsSync();

    setupVisibilityHandler();

    setupStorageSync();

    setupSystemThemeListener();

}


/* ================================================================
   88. DOM READY
================================================================ */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startSettingsInitialization,
        {
            once: true
        }
    );

} else {

    startSettingsInitialization();

}


/* ================================================================
   89. FINAL SAFETY INITIALIZATION
================================================================ */

window.addEventListener(
    "load",
    () => {

        if (
            !settingsState.initialized
        ) {

            initializeSettings();

        }


        setupSettingsUIEvents();

        updateSettingsUI();

    }
);


/* ================================================================
   END OF SETTINGS.JS
================================================================ */
