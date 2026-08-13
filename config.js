"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * config.js
 *
 * تنظیمات مرکزی پروژه
 *
 * این فایل فقط تنظیمات عمومی بازی را نگهداری می‌کند.
 *
 * نکته:
 * در این مرحله هیچ اتصال مستقیمی به Supabase نداریم.
 * اتصال واقعی در مراحل بعدی ساخته خواهد شد.
 * ================================================================
 */


/* ================================================================
   1. APPLICATION CONFIG
================================================================ */

const APP_CONFIG = {

    /*
     * اطلاعات عمومی برنامه
     */

    app: {

        name: "Hokm Online",

        version: "1.0.0",

        environment: "development",

        language: "fa",

        direction: "rtl",

        defaultScreen: "homeScreen"
    },


    /* ============================================================
       2. GAME CONFIG
    ============================================================ */

    game: {

        /*
         * تعداد بازیکنان حکم
         */

        playersPerGame: 4,


        /*
         * تعداد کارت‌های هر بازیکن
         */

        cardsPerPlayer: 13,


        /*
         * تعداد کل کارت‌ها
         */

        totalCards: 52,


        /*
         * تعداد دست لازم برای بردن راند
         */

        tricksToWinRound: 7,


        /*
         * حداکثر تعداد دست در یک راند
         */

        maxTricksPerRound: 13,


        /*
         * تعداد تیم‌ها
         */

        teams: 2,


        /*
         * تعداد بازیکن در هر تیم
         */

        playersPerTeam: 2,


        /*
         * مدت تأخیر نمایش کارت کامپیوتر
         * بر حسب میلی‌ثانیه
         */

        computerTurnDelay: 750,


        /*
         * مدت نمایش نتیجه هر دست
         */

        trickResultDelay: 900,


        /*
         * مدت نمایش نتیجه راند
         */

        roundResultDelay: 1200
    },


    /* ============================================================
       3. ROOM CONFIG
    ============================================================ */

    room: {

        /*
         * تعداد ارقام کد اتاق
         */

        codeLength: 6,


        /*
         * حداقل تعداد بازیکن برای شروع
         */

        minPlayersToStart: 4,


        /*
         * حداکثر تعداد بازیکن اتاق
         */

        maxPlayers: 4,


        /*
         * حداکثر طول نام اتاق
         */

        maxRoomNameLength: 30,


        /*
         * حداکثر مدت اعتبار اتاق آزمایشی
         * 30 دقیقه
         */

        demoRoomExpiration:
            30 * 60 * 1000
    },


    /* ============================================================
       4. PLAYER CONFIG
    ============================================================ */

    player: {

        /*
         * نام پیش‌فرض بازیکن
         */

        defaultName: "بازیکن مهمان",


        /*
         * حداقل طول نام
         */

        minNameLength: 2,


        /*
         * حداکثر طول نام
         */

        maxNameLength: 20,


        /*
         * سکه اولیه
         */

        startingCoins: 1000,


        /*
         * سطح اولیه
         */

        startingLevel: 1,


        /*
         * تعداد بازی اولیه

         */

        startingGamesPlayed: 0,


        /*
         * تعداد برد اولیه
         */

        startingGamesWon: 0
    },


    /* ============================================================
       5. ECONOMY CONFIG
    ============================================================ */

    economy: {

        /*
         * پاداش برد
         */

        winReward: 100,


        /*
         * پاداش باخت
         */

        loseReward: 25,


        /*
         * حداقل سکه قابل نگهداری
         */

        minimumCoins: 0,


        /*
         * حداکثر سکه
         *
         * فعلاً بسیار بالا قرار داده شده.
         * بعداً می‌توانیم سیستم اقتصاد را حرفه‌ای‌تر کنیم.
         */

        maximumCoins: 999999999,


        /*
         * هزینه پیش‌فرض ورود به اتاق
         */

        defaultEntryFee: 0
    },


    /* ============================================================
       6. SHOP CONFIG
    ============================================================ */

    shop: {

        enabled: true,


        /*
         * آیتم‌های فروشگاه نسخه اولیه
         *
         * این‌ها فعلاً آیتم‌های تزئینی هستند.
         */

        items: {

            cardClassic: {

                id: "card-classic",

                name: "پوسته کلاسیک کارت",

                price: 250,

                type: "card-theme"
            },


            cardRoyal: {

                id: "card-royal",

                name: "پوسته سلطنتی کارت",

                price: 500,

                type: "card-theme"
            },


            avatarGold: {

                id: "avatar-gold",

                name: "آواتار طلایی",

                price: 750,

                type: "avatar"
            },


            tableLuxury: {

                id: "table-luxury",

                name: "میز سلطنتی",

                price: 1000,

                type: "table-theme"
            }
        }
    },


    /* ============================================================
       7. LOCAL STORAGE
    ============================================================ */

    storage: {

        /*
         * کلید ذخیره اطلاعات بازیکن
         */

        playerKey:
            "hokm_online_player_v1",


        /*
         * کلید تنظیمات
         */

        settingsKey:
            "hokm_online_settings_v1",


        /*
         * کلید اطلاعات موقت بازی
         */

        gameKey:
            "hokm_online_game_v1"
    },


    /* ============================================================
       8. UI CONFIG
    ============================================================ */

    ui: {

        /*
         * مدت نمایش Toast
         */

        toastDuration: 2500,


        /*
         * مدت انیمیشن صفحه
         */

        screenTransitionDuration: 300,


        /*
         * سرعت انیمیشن کارت
         */

        cardAnimationDuration: 350,


        /*
         * فعال بودن انیمیشن‌ها
         */

        animations: true,


        /*
         * فعال بودن افکت‌های بصری
         */

        visualEffects: true
    },


    /* ============================================================
       9. SOUND CONFIG
    ============================================================ */

    sound: {

        enabled: true,


        /*
         * صدای کلیک

         */

        click: true,


        /*
         * صدای بازی کارت

         */

        cardPlay: true,


        /*
         * صدای برد دست

         */

        trickWin: true,


        /*
         * صدای برد بازی

         */

        gameWin: true,


        /*
         * صدای اعلان

         */

        notification: true
    },


    /* ============================================================
       10. MULTIPLAYER CONFIG
    ============================================================ */

    multiplayer: {

        /*
         * در این مرحله خاموش است.
         *
         * در مراحل بعدی که Multiplayer واقعی
         * ساخته شد، این مقدار فعال خواهد شد.
         */

        enabled: false,


        /*
         * حالت فعلی بازی
         */

        mode: "local",


        /*
         * تعداد بازیکنان آنلاین

         */

        maxPlayers: 4,


        /*
         * زمان انتظار برای اتصال بازیکن

         */

        connectionTimeout: 15000,


        /*
         * فاصله بررسی وضعیت بازی

         */

        syncInterval: 1000
    },


    /* ============================================================
       11. AUTH CONFIG
    ============================================================ */

    auth: {

        /*
         * احراز هویت واقعی بعداً اضافه می‌شود.
         */

        enabled: false,


        /*
         * اجازه ورود مهمان در نسخه فعلی
         */

        guestMode: true,


        /*
         * حداقل طول رمز عبور
         */

        minimumPasswordLength: 6,


        /*
         * حداکثر طول نام کاربری
         */

        maximumUsernameLength: 20
    },


    /* ============================================================
       12. LEADERBOARD CONFIG
    ============================================================ */

    leaderboard: {

        enabled: true,


        /*
         * تعداد بازیکن قابل نمایش
         */

        visiblePlayers: 10,


        /*
         * نوع رتبه‌بندی فعلی
         */

        defaultSort: "wins"
    },


    /* ============================================================
       13. CHAT CONFIG
    ============================================================ */

    chat: {

        enabled: true,


        /*
         * حداکثر طول پیام
         */

        maxMessageLength: 100,


        /*
         * حداکثر تعداد پیام قابل نمایش محلی
         */

        maxMessages: 50
    },


    /* ============================================================
       14. SECURITY CONFIG
    ============================================================ */

    security: {

        /*
         * محدودیت ساده برای نام‌ها
         */

        sanitizeNames: true,


        /*
         * محدودیت ساده پیام‌ها
         */

        sanitizeMessages: true,


        /*
         * جلوگیری از HTML در محتوای کاربر
         */

        escapeUserContent: true
    },


    /* ============================================================
       15. DEBUG CONFIG
    ============================================================ */

    debug: {

        /*
         * حالت توسعه
         */

        enabled: true,


        /*
         * نمایش لاگ بازی
         */

        gameLogs: true,


        /*
         * نمایش لاگ اتاق
         */

        roomLogs: true,


        /*
         * نمایش خطاها
         */

        errorLogs: true
    }

};


/* ================================================================
   16. HELPER FUNCTIONS
================================================================ */


/*
 * دریافت تنظیمات برنامه
 */

function getConfig(path, fallback = null) {

    if (!path) {
        return fallback;
    }

    const parts =
        path.split(".");


    let current =
        APP_CONFIG;


    for (const part of parts) {

        if (
            current === null ||
            current === undefined ||
            !Object.prototype.hasOwnProperty.call(
                current,
                part
            )
        ) {

            return fallback;
        }


        current =
            current[part];
    }


    return current;
}


/*
 * بررسی فعال بودن Multiplayer
 */

function isMultiplayerEnabled() {

    return Boolean(
        APP_CONFIG.multiplayer.enabled
    );
}


/*
 * بررسی فعال بودن احراز هویت
 */

function isAuthEnabled() {

    return Boolean(
        APP_CONFIG.auth.enabled
    );
}


/*
 * بررسی فعال بودن فروشگاه
 */

function isShopEnabled() {

    return Boolean(
        APP_CONFIG.shop.enabled
    );
}


/*
 * بررسی فعال بودن صدا
 */

function isSoundEnabled() {

    return Boolean(
        APP_CONFIG.sound.enabled
    );
}


/*
 * بررسی حالت Debug
 */

function isDebugEnabled() {

    return Boolean(
        APP_CONFIG.debug.enabled
    );
}


/* ================================================================
   17. SAFE PLAYER CONFIG
================================================================ */

function getDefaultPlayerData() {

    return {

        name:
            APP_CONFIG.player.defaultName,

        coins:
            APP_CONFIG.player.startingCoins,

        level:
            APP_CONFIG.player.startingLevel,

        gamesPlayed:
            APP_CONFIG.player.startingGamesPlayed,

        gamesWon:
            APP_CONFIG.player.startingGamesWon,

        inventory: [],

        createdAt:
            Date.now()
    };
}


/* ================================================================
   18. ROOM VALIDATION
================================================================ */

function isValidRoomCode(code) {

    if (!code) {
        return false;
    }


    const normalized =
        String(code)
            .replace(/\D/g, "");


    return (
        normalized.length ===
        APP_CONFIG.room.codeLength
    );
}


/* ================================================================
   19. PLAYER NAME VALIDATION
================================================================ */

function isValidPlayerName(name) {

    if (!name) {
        return false;
    }


    const normalized =
        String(name).trim();


    return (
        normalized.length >=
            APP_CONFIG.player.minNameLength
        &&
        normalized.length <=
            APP_CONFIG.player.maxNameLength
    );
}


/* ================================================================
   20. ENTRY FEE VALIDATION
================================================================ */

function isValidEntryFee(
    fee,
    playerCoins = 0
) {

    const amount =
        Number(fee);


    if (!Number.isFinite(amount)) {
        return false;
    }


    if (amount < 0) {
        return false;
    }


    if (amount > playerCoins) {
        return false;
    }


    return true;
}


/* ================================================================
   21. EXPORT-LIKE GLOBAL ACCESS
================================================================ */


/*
 * چون پروژه فعلاً بدون bundler و به صورت HTML/CSS/JS
 * اجرا می‌شود، تنظیمات را روی window قرار می‌دهیم
 * تا فایل‌های دیگر بتوانند از آن استفاده کنند.
 */

window.HOKM_CONFIG =
    APP_CONFIG;


window.HokmConfig = {

    get:
        getConfig,

    isMultiplayerEnabled:
        isMultiplayerEnabled,

    isAuthEnabled:
        isAuthEnabled,

    isShopEnabled:
        isShopEnabled,

    isSoundEnabled:
        isSoundEnabled,

    isDebugEnabled:
        isDebugEnabled,

    getDefaultPlayerData:
        getDefaultPlayerData,

    isValidRoomCode:
        isValidRoomCode,

    isValidPlayerName:
        isValidPlayerName,

    isValidEntryFee:
        isValidEntryFee
};


/* ================================================================
   22. INITIALIZATION LOG
================================================================ */

if (
    APP_CONFIG.debug.enabled
) {

    console.log(
        `Hokm Online ${APP_CONFIG.app.version} config loaded.`
    );

    console.log(
        "Environment:",
        APP_CONFIG.app.environment
    );

    console.log(
        "Multiplayer:",
        APP_CONFIG.multiplayer.enabled
    );
}
