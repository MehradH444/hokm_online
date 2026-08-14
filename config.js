"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * config.js
 *
 * نسخه اصلاح‌شده و کامل
 *
 * این فایل تنظیمات مرکزی کل پروژه را نگهداری می‌کند.
 *
 * امکانات حفظ‌شده:
 *
 * - بازی حکم ۴ نفره
 * - بازی محلی
 * - Multiplayer
 * - اتاق‌ها
 * - احراز هویت
 * - پروفایل
 * - سکه
 * - سطح
 * - آمار بازی
 * - فروشگاه
 * - موجودی
 * - چت
 * - رتبه‌بندی
 * - اعلان‌ها
 * - دوستان
 * - تاریخچه بازی
 * - صدا
 * - انیمیشن
 * - تنظیمات
 * - امنیت
 * - Debug
 * - Supabase
 *
 * ================================================================
 */


/* ================================================================
   1. SUPABASE CONFIG
================================================================ */

/*
 * اطلاعات پروژه Supabase
 *
 * بعداً این دو مقدار را با اطلاعات واقعی پروژه خودت جایگزین می‌کنیم.
 *
 * مهم:
 * anon key برای استفاده در Frontend طراحی شده است.
 *
 * service_role key را هرگز داخل این فایل قرار نده.
 */

const SUPABASE_CONFIG = {

    enabled: true,

    url: "",

    anonKey: "",

    /*
     * اگر تأیید ایمیل فعال باشد،
     * کاربر بعد از ثبت‌نام باید ایمیل خود را تأیید کند.
     */

    emailConfirmationRequired: true,

    /*
     * مسیر بازگشت بازیابی رمز عبور
     */

    passwordResetPath: "/",

    /*
     * نام جدول پروفایل
     */

    profileTable: "profiles",

    /*
     * نام فیلد نام نمایشی در Frontend
     *
     * auth.js از display_name استفاده می‌کند.
     */

    profileDisplayNameField: "display_name",

    /*
     * در database.sql فعلی username وجود دارد.
     *
     * این مقدار را نگه می‌داریم تا در مرحله هماهنگ‌سازی
     * database.js / auth.js بتوانیم هر دو ساختار را پشتیبانی کنیم.
     */

    profileUsernameField: "username"

};


/* ================================================================
   2. SUPABASE CLIENT INITIALIZATION
================================================================ */

/*
 * اگر کتابخانه Supabase در index.html بارگذاری شده باشد،
 * در صورت وجود URL و anon key کلاینت ساخته می‌شود.
 *
 * اگر هنوز اطلاعات Supabase وارد نشده باشد،
 * بازی از کار نمی‌افتد و حالت Local قابل استفاده باقی می‌ماند.
 */

function initializeSupabaseClient() {

    if (
        !SUPABASE_CONFIG.enabled
    ) {

        console.warn(
            "Supabase در config غیرفعال است."
        );

        return null;
    }


    /*
     * اگر قبلاً Client ساخته شده باشد،
     * دوباره آن را نساز.
     */

    if (
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function"
    ) {

        return window.supabaseClient;
    }


    /*
     * بررسی وجود کتابخانه Supabase
     */

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {

        console.warn(
            "کتابخانه Supabase JS پیدا نشد."
        );

        return null;
    }


    /*
     * بررسی تنظیمات
     */

    if (
        !SUPABASE_CONFIG.url ||
        !SUPABASE_CONFIG.anonKey
    ) {

        console.warn(
            "Supabase URL یا Anon Key هنوز وارد نشده است."
        );

        return null;
    }


    try {

        const client =
            window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );


        window.supabaseClient =
            client;


        console.log(
            "Supabase Client initialized successfully."
        );


        return client;


    } catch (error) {

        console.error(
            "خطا در ساخت Supabase Client:",
            error
        );

        return null;
    }
}


/* ================================================================
   3. APPLICATION CONFIG
================================================================ */

const APP_CONFIG = {

    app: {

        name: "Hokm Online",

        version: "1.0.0",

        environment: "development",

        language: "fa",

        direction: "rtl",

        defaultScreen: "homeScreen",

        platform: "web",

        mobileFirst: true
    },


    /* ============================================================
       4. GAME CONFIG
    ============================================================ */

    game: {

        playersPerGame: 4,

        cardsPerPlayer: 13,

        totalCards: 52,

        tricksToWinRound: 7,

        maxTricksPerRound: 13,

        teams: 2,

        playersPerTeam: 2,

        computerTurnDelay: 750,

        trickResultDelay: 900,

        roundResultDelay: 1200,

        /*
         * تعداد راندهای بازی
         */

        maxRounds: 3,

        /*
         * فعال بودن بازی محلی
         */

        localModeEnabled: true,

        /*
         * فعال بودن بازی آنلاین
         */

        onlineModeEnabled: true,

        /*
         * امکان بازی با Bot
         */

        botEnabled: true,

        /*
         * امکان بازی تک‌نفره با Bot
         */

        singlePlayerEnabled: true,

        /*
         * امکان بازی دوستانه
         */

        friendlyGamesEnabled: true,

        /*
         * امکان بازی رقابتی
         */

        rankedGamesEnabled: true
    },


    /* ============================================================
       5. ROOM CONFIG
    ============================================================ */

    room: {

        codeLength: 6,

        minPlayersToStart: 4,

        maxPlayers: 4,

        maxRoomNameLength: 30,

        demoRoomExpiration:
            30 * 60 * 1000,

        /*
         * امکان ساخت اتاق عمومی
         */

        publicRoomsEnabled: true,

        /*
         * امکان ساخت اتاق خصوصی
         */

        privateRoomsEnabled: true,

        /*
         * امکان ورود با کد
         */

        joinByCodeEnabled: true,

        /*
         * امکان تعیین هزینه ورود
         */

        entryFeeEnabled: true,

        /*
         * حداکثر زمان انتظار اتاق
         */

        waitingTimeout:
            10 * 60 * 1000
    },


    /* ============================================================
       6. PLAYER CONFIG
    ============================================================ */

    player: {

        defaultName: "بازیکن مهمان",

        minNameLength: 2,

        maxNameLength: 20,

        startingCoins: 1000,

        startingLevel: 1,

        startingGamesPlayed: 0,

        startingGamesWon: 0,

        startingExperience: 0,

        /*
         * امکان بازی مهمان
         */

        guestEnabled: true,

        /*
         * امکان تغییر نام
         */

        changeNameEnabled: true,

        /*
         * امکان آواتار
         */

        avatarEnabled: true,

        /*
         * حداکثر طول Bio
         */

        maxBioLength: 160
    },


    /* ============================================================
       7. ECONOMY CONFIG
    ============================================================ */

    economy: {

        winReward: 100,

        loseReward: 25,

        minimumCoins: 0,

        maximumCoins: 999999999,

        defaultEntryFee: 0,

        /*
         * فعال بودن سیستم سکه
         */

        enabled: true,

        /*
         * فعال بودن تراکنش‌های سکه
         */

        transactionHistoryEnabled: true,

        /*
         * پاداش تجربه برای برد
         */

        winExperience: 100,

        /*
         * پاداش تجربه برای باخت
         */

        loseExperience: 25
    },


    /* ============================================================
       8. SHOP CONFIG
    ============================================================ */

    shop: {

        enabled: true,

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
       9. STORAGE CONFIG
    ============================================================ */

    storage: {

        playerKey:
            "hokm_online_player_v1",

        settingsKey:
            "hokm_online_settings_v1",

        gameKey:
            "hokm_online_game_v1",

        roomKey:
            "hokm_online_room_v1",

        authKey:
            "hokm_online_auth_v1",

        inventoryKey:
            "hokm_online_inventory_v1",

        notificationKey:
            "hokm_online_notifications_v1",

        chatKey:
            "hokm_online_chat_v1"
    },


    /* ============================================================
       10. UI CONFIG
    ============================================================ */

    ui: {

        toastDuration: 2500,

        screenTransitionDuration: 300,

        cardAnimationDuration: 350,

        animations: true,

        visualEffects: true,

        responsive: true,

        mobileOptimized: true,

        fullscreenGame: true
    },


    /* ============================================================
       11. SOUND CONFIG
    ============================================================ */

    sound: {

        enabled: true,

        click: true,

        cardPlay: true,

        trickWin: true,

        gameWin: true,

        notification: true,

        music: true,

        volume: 0.7
    },


    /* ============================================================
       12. MULTIPLAYER CONFIG
    ============================================================ */

    multiplayer: {

        /*
         * Multiplayer واقعی آماده اتصال است.
         *
         * وقتی Supabase تنظیم شود،
         * حالت online قابل استفاده خواهد بود.
         */

        enabled: true,

        mode: "online",

        maxPlayers: 4,

        connectionTimeout: 15000,

        syncInterval: 1000,

        reconnectEnabled: true,

        reconnectAttempts: 5,

        reconnectDelay: 2000,

        realtimeEnabled: true,

        presenceEnabled: true,

        broadcastEnabled: true
    },


    /* ============================================================
       13. AUTH CONFIG
    ============================================================ */

    auth: {

        /*
         * احراز هویت واقعی فعال است.
         */

        enabled: true,

        guestMode: true,

        minimumPasswordLength: 6,

        maximumUsernameLength: 20,

        emailLoginEnabled: true,

        passwordLoginEnabled: true,

        passwordResetEnabled: true,

        profileEnabled: true,

        autoCreateProfile: true,

        sessionPersistence: true
    },


    /* ============================================================
       14. LEADERBOARD CONFIG
    ============================================================ */

    leaderboard: {

        enabled: true,

        visiblePlayers: 10,

        defaultSort: "wins",

        globalEnabled: true,

        weeklyEnabled: true,

        monthlyEnabled: true,

        friendsEnabled: true
    },


    /* ============================================================
       15. CHAT CONFIG
    ============================================================ */

    chat: {

        enabled: true,

        maxMessageLength: 100,

        maxMessages: 50,

        roomChatEnabled: true,

        gameChatEnabled: true,

        privateChatEnabled: false,

        emojiEnabled: true
    },


    /* ============================================================
       16. FRIEND CONFIG
    ============================================================ */

    friends: {

        enabled: true,

        requestsEnabled: true,

        blockEnabled: true,

        onlineStatusEnabled: true,

        maximumFriends: 500
    },


    /* ============================================================
       17. NOTIFICATION CONFIG
    ============================================================ */

    notifications: {

        enabled: true,

        gameNotifications: true,

        friendNotifications: true,

        systemNotifications: true,

        rewardNotifications: true,

        maximumStored: 100
    },


    /* ============================================================
       18. HISTORY CONFIG
    ============================================================ */

    history: {

        enabled: true,

        maximumRecords: 100,

        storeGameResults: true,

        storeTrickResults: true,

        storeCoinTransactions: true
    },


    /* ============================================================
       19. SECURITY CONFIG
    ============================================================ */

    security: {

        sanitizeNames: true,

        sanitizeMessages: true,

        escapeUserContent: true,

        validateRoomCodes: true,

        validateEntryFees: true,

        validateCardMoves: true,

        preventDuplicateMoves: true
    },


    /* ============================================================
       20. DEBUG CONFIG
    ============================================================ */

    debug: {

        enabled: true,

        gameLogs: true,

        roomLogs: true,

        authLogs: true,

        realtimeLogs: true,

        errorLogs: true,

        databaseLogs: true
    }

};


/* ================================================================
   21. DATABASE CONFIG
================================================================ */

const DATABASE_CONFIG = {

    schema: "public",

    tables: {

        profiles: "profiles",

        playerSettings: "player_settings",

        shopItems: "shop_items",

        playerInventory: "player_inventory",

        coinTransactions: "coin_transactions",

        rooms: "rooms",

        roomPlayers: "room_players",

        games: "games",

        gamePlayers: "game_players",

        gameHands: "game_hands",

        gameTricks: "game_tricks",

        trickCards: "trick_cards",

        chatMessages: "chat_messages",

        gameHistory: "game_history",

        notifications: "notifications",

        friendships: "friendships"
    }

};


/* ================================================================
   22. CARD CONFIG
================================================================ */

const CARD_CONFIG = {

    suits: [

        "hearts",

        "diamonds",

        "clubs",

        "spades"

    ],

    ranks: [

        2,

        3,

        4,

        5,

        6,

        7,

        8,

        9,

        10,

        11,

        12,

        13,

        14

    ],

    rankNames: {

        11: "J",

        12: "Q",

        13: "K",

        14: "A"
    },

    totalCards: 52
};


/* ================================================================
   23. PROFILE CONFIG
================================================================ */

/*
 * این بخش برای هماهنگ کردن auth.js
 * با database.sql در نظر گرفته شده است.
 */

const PROFILE_CONFIG = {

    table: "profiles",

    idField: "id",

    /*
     * نامی که Frontend استفاده می‌کند.
     */

    displayNameField: "display_name",

    /*
     * نام فعلی موجود در database.sql
     */

    usernameField: "username",

    avatarField: "avatar_url",

    coinsField: "coins",

    levelField: "level",

    gamesPlayedField: "games_played",

    gamesWonField: "games_won",

    totalTricksField: "total_tricks",

    experienceField: "experience",

    onlineField: "is_online",

    lastSeenField: "last_seen"
};


/* ================================================================
   24. HELPER FUNCTIONS
================================================================ */


/*
 * دریافت تنظیمات با مسیر
 *
 * مثال:
 *
 * getConfig("game.playersPerGame")
 */

function getConfig(
    path,
    fallback = null
) {

    if (!path) {

        return fallback;
    }


    const parts =
        String(path).split(".");


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


/* ================================================================
   25. FEATURE CHECKS
================================================================ */

function isMultiplayerEnabled() {

    return Boolean(
        APP_CONFIG.multiplayer.enabled
    );
}


function isAuthEnabled() {

    return Boolean(
        APP_CONFIG.auth.enabled
    );
}


function isShopEnabled() {

    return Boolean(
        APP_CONFIG.shop.enabled
    );
}


function isSoundEnabled() {

    return Boolean(
        APP_CONFIG.sound.enabled
    );
}


function isDebugEnabled() {

    return Boolean(
        APP_CONFIG.debug.enabled
    );
}


function isChatEnabled() {

    return Boolean(
        APP_CONFIG.chat.enabled
    );
}


function isFriendsEnabled() {

    return Boolean(
        APP_CONFIG.friends.enabled
    );
}


function isLeaderboardEnabled() {

    return Boolean(
        APP_CONFIG.leaderboard.enabled
    );
}


function isNotificationsEnabled() {

    return Boolean(
        APP_CONFIG.notifications.enabled
    );
}


/* ================================================================
   26. SUPABASE STATUS
================================================================ */

function isSupabaseConfigured() {

    return Boolean(
        SUPABASE_CONFIG.enabled &&
        SUPABASE_CONFIG.url &&
        SUPABASE_CONFIG.anonKey
    );
}


/* ================================================================
   27. DEFAULT PLAYER DATA
================================================================ */

function getDefaultPlayerData() {

    return {

        id: null,

        name:
            APP_CONFIG.player.defaultName,

        email: null,

        avatarUrl: null,

        coins:
            APP_CONFIG.player.startingCoins,

        level:
            APP_CONFIG.player.startingLevel,

        gamesPlayed:
            APP_CONFIG.player.startingGamesPlayed,

        gamesWon:
            APP_CONFIG.player.startingGamesWon,

        totalTricks: 0,

        experience:
            APP_CONFIG.player.startingExperience,

        inventory: [],

        isOnline: false,

        createdAt:
            Date.now()
    };
}


/* ================================================================
   28. ROOM VALIDATION
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
   29. PLAYER NAME VALIDATION
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
   30. ENTRY FEE VALIDATION
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
   31. CARD VALIDATION
================================================================ */

function isValidSuit(suit) {

    return CARD_CONFIG.suits.includes(
        suit
    );
}


function isValidRank(rank) {

    const numericRank =
        Number(rank);


    return CARD_CONFIG.ranks.includes(
        numericRank
    );
}


/* ================================================================
   32. PUBLIC CONFIG
================================================================ */

window.HOKM_CONFIG =
    APP_CONFIG;


window.HOKM_SUPABASE_CONFIG =
    SUPABASE_CONFIG;


window.HOKM_DATABASE_CONFIG =
    DATABASE_CONFIG;


window.HOKM_CARD_CONFIG =
    CARD_CONFIG;


window.HOKM_PROFILE_CONFIG =
    PROFILE_CONFIG;


/* ================================================================
   33. PUBLIC CONFIG API
================================================================ */

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

    isChatEnabled:
        isChatEnabled,

    isFriendsEnabled:
        isFriendsEnabled,

    isLeaderboardEnabled:
        isLeaderboardEnabled,

    isNotificationsEnabled:
        isNotificationsEnabled,

    isSupabaseConfigured:
        isSupabaseConfigured,

    getDefaultPlayerData:
        getDefaultPlayerData,

    isValidRoomCode:
        isValidRoomCode,

    isValidPlayerName:
        isValidPlayerName,

    isValidEntryFee:
        isValidEntryFee,

    isValidSuit:
        isValidSuit,

    isValidRank:
        isValidRank,

    getDatabaseTables:
        function () {

            return DATABASE_CONFIG.tables;
        },

    getProfileConfig:
        function () {

            return PROFILE_CONFIG;
        }
};


/* ================================================================
   34. INITIALIZE SUPABASE
================================================================ */

/*
 * Supabase را بعد از آماده شدن DOM
 * یا بلافاصله در صورت آماده بودن اجرا می‌کنیم.
 */

function startSupabaseInitialization() {

    try {

        initializeSupabaseClient();

    } catch (error) {

        console.error(
            "خطا در initialize Supabase:",
            error
        );
    }
}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startSupabaseInitialization
    );

} else {

    startSupabaseInitialization();
}


/* ================================================================
   35. DEBUG LOG
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


    console.log(
        "Authentication:",
        APP_CONFIG.auth.enabled
    );


    console.log(
        "Supabase configured:",
        isSupabaseConfigured()
    );


    console.log(
        "Database tables:",
        DATABASE_CONFIG.tables
    );
}


/* ================================================================
   END OF CONFIG.JS
================================================================ */
