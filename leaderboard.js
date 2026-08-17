"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * leaderboard.js
 *
 * فایل شماره 10 از 12
 *
 * سیستم کامل رتبه‌بندی بازی
 *
 * امکانات:
 *
 * - رتبه‌بندی کلی بازیکنان
 * - رتبه‌بندی بر اساس برد
 * - رتبه‌بندی بر اساس تجربه
 * - رتبه‌بندی بر اساس تعداد بازی
 * - رتبه‌بندی بر اساس نرخ برد
 * - دریافت رتبه بازیکن فعلی
 * - دریافت بازیکنان اطراف کاربر
 * - جستجوی بازیکن در جدول رتبه‌بندی
 * - صفحه‌بندی
 * - کش داخلی
 * - حالت آنلاین Supabase
 * - حالت Fallback برای زمانی که Supabase آماده نیست
 * - هماهنگی با auth.js
 * - هماهنگی با profile.js
 * - هماهنگی با game.js
 * - هماهنگی با UI
 * - Event System
 * - Auto Refresh
 * - نمایش رتبه، برد، باخت، تجربه و امتیاز
 *
 * ================================================================
 */


/* ================================================================
   1. GLOBAL STATE
================================================================ */

const leaderboardState = {

    initialized: false,

    loading: false,

    currentCategory: "rating",

    currentPage: 1,

    pageSize: 20,

    totalPlayers: 0,

    players: [],

    currentPlayer: null,

    currentPlayerRank: null,

    nearbyPlayers: [],

    searchQuery: "",

    lastUpdated: null,

    autoRefreshTimer: null,

    cache: new Map()

};


/* ================================================================
   2. CONFIG
================================================================ */

const leaderboardConfig = {

    defaultPageSize: 20,

    maxPageSize: 100,

    cacheDuration: 30000,

    autoRefreshInterval: 60000,

    minimumGamesForWinRate: 1,

    categories: [

        "rating",

        "wins",

        "experience",

        "games",

        "winRate",

        "coins"

    ]

};


/* ================================================================
   3. EVENTS
================================================================ */

const leaderboardEvents = {

    listeners: {},


    on(eventName, callback) {

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


    off(eventName, callback) {

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


    emit(eventName, data) {

        const listeners =
            this.listeners[eventName] || [];


        listeners.forEach(
            callback => {

                try {

                    callback(data);

                } catch (error) {

                    console.error(
                        "Leaderboard event error:",
                        error
                    );

                }

            }
        );

    }

};


/* ================================================================
   4. UTILITY
================================================================ */

function leaderboardToast(
    message,
    icon = "ℹ️",
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


function leaderboardLoading(
    show,
    message = "در حال دریافت رتبه‌بندی..."
) {

    if (
        show &&
        typeof window.showLoading === "function"
    ) {

        window.showLoading(
            message
        );

        return;

    }


    if (
        !show &&
        typeof window.hideLoading === "function"
    ) {

        window.hideLoading();

    }

}


/* ================================================================
   5. SUPABASE CLIENT
================================================================ */

function getLeaderboardSupabaseClient() {

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
   6. AUTH USER
================================================================ */

function getLeaderboardCurrentUser() {

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.getCurrentUser === "function"
    ) {

        return window.hokmAuth.getCurrentUser();

    }


    return null;

}


/* ================================================================
   7. PROFILE
================================================================ */

function getLeaderboardCurrentProfile() {

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.getCurrentProfile === "function"
    ) {

        return window.hokmAuth.getCurrentProfile();

    }


    return null;

}


/* ================================================================
   8. NORMALIZE PLAYER
================================================================ */

function normalizeLeaderboardPlayer(
    player,
    fallbackRank = null
) {

    if (!player) {

        return null;

    }


    const gamesPlayed =
        Number(
            player.games_played ??
            player.gamesPlayed ??
            0
        );


    const gamesWon =
        Number(
            player.games_won ??
            player.gamesWon ??
            0
        );


    const gamesLost =
        Math.max(
            gamesPlayed - gamesWon,
            0
        );


    const experience =
        Number(
            player.experience ??
            0
        );


    const coins =
        Number(
            player.coins ??
            0
        );


    const level =
        Number(
            player.level ??
            1
        );


    const totalTricks =
        Number(
            player.total_tricks ??
            player.totalTricks ??
            0
        );


    const winRate =
        gamesPlayed > 0
            ? Number(
                (
                    gamesWon /
                    gamesPlayed
                ) *
                100
            )
            : 0;


    /*
     * امتیاز رتبه‌بندی
     *
     * برد بیشتر
     * تجربه بیشتر
     * نرخ برد بهتر
     * و تعداد بازی
     */

    const rating =
        calculatePlayerRating({

            gamesPlayed,

            gamesWon,

            experience,

            winRate,

            level

        });


    const name =
        player.display_name ||
        player.username ||
        player.name ||
        player.user_metadata?.display_name ||
        player.user_metadata?.username ||
        "بازیکن";


    return {

        id:
            player.id ||
            player.user_id ||
            null,

        username:
            player.username ||
            name,

        display_name:
            player.display_name ||
            player.username ||
            name,

        name,

        avatar_url:
            player.avatar_url ||
            null,

        coins,

        level,

        games_played:
            gamesPlayed,

        games_won:
            gamesWon,

        games_lost:
            gamesLost,

        total_tricks:
            totalTricks,

        experience,

        win_rate:
            Number(
                winRate.toFixed(2)
            ),

        rating,

        rank:
            fallbackRank,

        created_at:
            player.created_at ||
            null,

        updated_at:
            player.updated_at ||
            null

    };

}


/* ================================================================
   9. CALCULATE PLAYER RATING
================================================================ */

function calculatePlayerRating(
    data = {}
) {

    const gamesPlayed =
        Math.max(
            Number(
                data.gamesPlayed ||
                0
            ),
            0
        );


    const gamesWon =
        Math.max(
            Number(
                data.gamesWon ||
                0
            ),
            0
        );


    const experience =
        Math.max(
            Number(
                data.experience ||
                0
            ),
            0
        );


    const winRate =
        Math.max(
            Number(
                data.winRate ||
                0
            ),
            0
        );


    const level =
        Math.max(
            Number(
                data.level ||
                1
            ),
            1
        );


    /*
     * سیستم امتیاز داخلی.
     *
     * این امتیاز برای جدول رتبه‌بندی Frontend
     * استفاده می‌شود و به سکه مربوط نیست.
     */

    const winScore =
        gamesWon * 100;


    const experienceScore =
        experience * 0.05;


    const winRateScore =
        winRate * 10;


    const gameScore =
        Math.min(
            gamesPlayed * 5,
            2500
        );


    const levelScore =
        level * 50;


    const rating =
        Math.round(
            1000 +
            winScore +
            experienceScore +
            winRateScore +
            gameScore +
            levelScore
        );


    return Math.max(
        rating,
        1000
    );

}


/* ================================================================
   10. CATEGORY SORT
================================================================ */

function sortPlayersByCategory(
    players,
    category = "rating"
) {

    const list =
        Array.isArray(players)
            ? [...players]
            : [];


    list.sort(
        (a, b) => {

            let valueA = 0;
            let valueB = 0;


            switch (category) {

                case "wins":

                    valueA =
                        Number(
                            a.games_won || 0
                        );

                    valueB =
                        Number(
                            b.games_won || 0
                        );

                    break;


                case "experience":

                    valueA =
                        Number(
                            a.experience || 0
                        );

                    valueB =
                        Number(
                            b.experience || 0
                        );

                    break;


                case "games":

                    valueA =
                        Number(
                            a.games_played || 0
                        );

                    valueB =
                        Number(
                            b.games_played || 0
                        );

                    break;


                case "winRate":

                    valueA =
                        Number(
                            a.win_rate || 0
                        );

                    valueB =
                        Number(
                            b.win_rate || 0
                        );

                    break;


                case "coins":

                    valueA =
                        Number(
                            a.coins || 0
                        );

                    valueB =
                        Number(
                            b.coins || 0
                        );

                    break;


                case "rating":

                default:

                    valueA =
                        Number(
                            a.rating || 0
                        );

                    valueB =
                        Number(
                            b.rating || 0
                        );

                    break;

            }


            if (
                valueB !== valueA
            ) {

                return valueB - valueA;

            }


            /*
             * در صورت مساوی بودن،
             * برد بیشتر بالاتر قرار می‌گیرد.
             */

            const winsDifference =
                Number(
                    b.games_won || 0
                ) -
                Number(
                    a.games_won || 0
                );


            if (
                winsDifference !== 0
            ) {

                return winsDifference;

            }


            /*
             * سپس تجربه.
             */

            return (
                Number(
                    b.experience || 0
                ) -
                Number(
                    a.experience || 0
                )
            );

        }
    );


    return list;

}


/* ================================================================
   11. ADD RANKS
================================================================ */

function assignPlayerRanks(
    players
) {

    if (
        !Array.isArray(players)
    ) {

        return [];

    }


    return players.map(
        (player, index) => {

            return {

                ...player,

                rank:
                    index + 1

            };

        }
    );

}


/* ================================================================
   12. GET CACHE KEY
================================================================ */

function getLeaderboardCacheKey(
    category,
    page,
    pageSize,
    search
) {

    return [

        category,

        page,

        pageSize,

        search || ""

    ].join(
        "::"
    );

}


/* ================================================================
   13. CACHE VALIDITY
================================================================ */

function isLeaderboardCacheValid(
    cacheItem
) {

    if (!cacheItem) {

        return false;

    }


    return (
        Date.now() -
        cacheItem.timestamp
    ) <
    leaderboardConfig.cacheDuration;

}


/* ================================================================
   14. LOAD PLAYERS FROM SUPABASE
================================================================ */

async function loadPlayersFromSupabase() {

    const client =
        getLeaderboardSupabaseClient();


    if (!client) {

        return [];

    }


    try {

        const {
            data,
            error
        } = await client
            .from("profiles")
            .select(
                `
                id,
                username,
                avatar_url,
                coins,
                level,
                games_played,
                games_won,
                total_tricks,
                experience,
                created_at,
                updated_at
                `
            );


        if (error) {

            console.error(
                "خطا در دریافت Leaderboard:",
                error
            );


            return [];

        }


        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.error(
            "خطای loadPlayersFromSupabase:",
            error
        );


        return [];

    }

}


/* ================================================================
   15. LOAD LOCAL FALLBACK PLAYERS
================================================================ */

function loadFallbackPlayers() {

    const players = [];


    /*
     * بازیکن فعلی
     */

    const currentProfile =
        getLeaderboardCurrentProfile();


    const currentUser =
        getLeaderboardCurrentUser();


    if (
        currentProfile
    ) {

        players.push(
            normalizeLeaderboardPlayer({

                ...currentProfile,

                id:
                    currentProfile.id ||
                    currentUser?.id

            })
        );

    }


    /*
     * اگر state بازی اطلاعات بازیکن را دارد،
     * آن را نیز در نظر می‌گیریم.
     */

    if (
        window.state?.player
    ) {

        const gamePlayer =
            window.state.player;


        const existing =
            players.find(
                player =>
                    player.id &&
                    currentUser?.id &&
                    player.id === currentUser.id
            );


        if (!existing) {

            players.push(
                normalizeLeaderboardPlayer({

                    id:
                        currentUser?.id ||
                        "local-player",

                    username:
                        gamePlayer.name ||
                        "بازیکن",

                    display_name:
                        gamePlayer.name ||
                        "بازیکن",

                    coins:
                        gamePlayer.coins ||
                        0,

                    level:
                        gamePlayer.level ||
                        1,

                    games_played:
                        gamePlayer.gamesPlayed ||
                        0,

                    games_won:
                        gamePlayer.gamesWon ||
                        0,

                    total_tricks:
                        gamePlayer.totalTricks ||
                        0,

                    experience:
                        gamePlayer.experience ||
                        0

                })
            );

        }

    }


    /*
     * داده‌های نمایشی پیش‌فرض فقط برای حالت Offline.
     *
     * این بازیکنان در Supabase ذخیره نمی‌شوند.
     */

    const demoPlayers = [

        {
            id: "demo-1",
            username: "شاه حکم",
            display_name: "شاه حکم",
            level: 25,
            games_played: 320,
            games_won: 238,
            experience: 12800,
            coins: 45000,
            total_tricks: 2100
        },

        {
            id: "demo-2",
            username: "سلطان ورق",
            display_name: "سلطان ورق",
            level: 21,
            games_played: 285,
            games_won: 201,
            experience: 10900,
            coins: 37000,
            total_tricks: 1850
        },

        {
            id: "demo-3",
            username: "حکم‌باز",
            display_name: "حکم‌باز",
            level: 18,
            games_played: 250,
            games_won: 172,
            experience: 9200,
            coins: 29500,
            total_tricks: 1600
        },

        {
            id: "demo-4",
            username: "استاد ورق",
            display_name: "استاد ورق",
            level: 16,
            games_played: 210,
            games_won: 143,
            experience: 7600,
            coins: 22000,
            total_tricks: 1350
        }

    ];


    demoPlayers.forEach(
        player => {

            players.push(
                normalizeLeaderboardPlayer(
                    player
                )
            );

        }
    );


    return players;

}


/* ================================================================
   16. LOAD ALL PLAYERS
================================================================ */

async function loadAllLeaderboardPlayers(
    forceRefresh = false
) {

    const cacheKey =
        "ALL_PLAYERS";


    const cached =
        leaderboardState.cache.get(
            cacheKey
        );


    if (
        !forceRefresh &&
        isLeaderboardCacheValid(
            cached
        )
    ) {

        return cached.players;

    }


    let rawPlayers =
        await loadPlayersFromSupabase();


    /*
     * اگر Supabase داده‌ای نداد،
     * Fallback فعال می‌شود.
     */

    if (
        !rawPlayers.length
    ) {

        rawPlayers =
            loadFallbackPlayers();

    }


    const normalized =
        rawPlayers
            .filter(Boolean)
            .map(
                player =>
                    normalizeLeaderboardPlayer(
                        player
                    )
            );


    /*
     * حذف بازیکنان تکراری
     */

    const uniquePlayers =
        [];


    const ids =
        new Set();


    normalized.forEach(
        player => {

            const id =
                player.id ||
                `name:${player.name}`;


            if (
                ids.has(id)
            ) {

                return;

            }


            ids.add(id);

            uniquePlayers.push(
                player
            );

        }
    );


    leaderboardState.cache.set(
        cacheKey,
        {

            timestamp:
                Date.now(),

            players:
                uniquePlayers

        }
    );


    return uniquePlayers;

}


/* ================================================================
   17. GET LEADERBOARD
================================================================ */

async function getLeaderboard(
    options = {}
) {

    const category =
        leaderboardConfig.categories.includes(
            options.category
        )
            ? options.category
            : "rating";


    const page =
        Math.max(
            Number(
                options.page ||
                1
            ),
            1
        );


    const pageSize =
        Math.min(
            Math.max(
                Number(
                    options.pageSize ||
                    leaderboardConfig.defaultPageSize
                ),
                1
            ),
            leaderboardConfig.maxPageSize
        );


    const search =
        String(
            options.search ||
            ""
        )
            .trim()
            .toLowerCase();


    const forceRefresh =
        options.forceRefresh === true;


    leaderboardState.loading =
        true;


    leaderboardState.currentCategory =
        category;


    leaderboardState.currentPage =
        page;


    leaderboardState.pageSize =
        pageSize;


    leaderboardState.searchQuery =
        search;


    try {

        const cacheKey =
            getLeaderboardCacheKey(
                category,
                page,
                pageSize,
                search
            );


        const cached =
            leaderboardState.cache.get(
                cacheKey
            );


        if (
            !forceRefresh &&
            isLeaderboardCacheValid(
                cached
            )
        ) {

            leaderboardState.players =
                cached.players;


            leaderboardState.totalPlayers =
                cached.totalPlayers;


            leaderboardState.lastUpdated =
                new Date(
                    cached.timestamp
                );


            return {

                success: true,

                players:
                    cached.players,

                totalPlayers:
                    cached.totalPlayers,

                page,

                pageSize,

                category,

                search,

                cached: true

            };

        }


        const allPlayers =
            await loadAllLeaderboardPlayers(
                forceRefresh
            );


        let filtered =
            [...allPlayers];


        /*
         * Search
         */

        if (
            search
        ) {

            filtered =
                filtered.filter(
                    player => {

                        const name =
                            String(
                                player.name ||
                                ""
                            )
                                .toLowerCase();


                        const username =
                            String(
                                player.username ||
                                ""
                            )
                                .toLowerCase();


                        return (
                            name.includes(search) ||
                            username.includes(search)
                        );

                    }
                );

        }


        /*
         * Sort
         */

        const sorted =
            sortPlayersByCategory(
                filtered,
                category
            );


        /*
         * Rank
         */

        const ranked =
            assignPlayerRanks(
                sorted
            );


        leaderboardState.totalPlayers =
            ranked.length;


        const start =
            (
                page - 1
            ) *
            pageSize;


        const end =
            start +
            pageSize;


        const paginated =
            ranked.slice(
                start,
                end
            );


        leaderboardState.players =
            paginated;


        leaderboardState.lastUpdated =
            new Date();


        leaderboardState.cache.set(
            cacheKey,
            {

                timestamp:
                    Date.now(),

                players:
                    paginated,

                totalPlayers:
                    ranked.length

            }
        );


        leaderboardEvents.emit(
            "updated",
            {

                players:
                    paginated,

                totalPlayers:
                    ranked.length,

                page,

                pageSize,

                category,

                search

            }
        );


        return {

            success: true,

            players:
                paginated,

            totalPlayers:
                ranked.length,

            page,

            pageSize,

            category,

            search,

            cached: false

        };


    } catch (error) {

        console.error(
            "خطا در getLeaderboard:",
            error
        );


        return {

            success: false,

            players: [],

            totalPlayers: 0,

            page,

            pageSize,

            category,

            search,

            error

        };


    } finally {

        leaderboardState.loading =
            false;

    }

}


/* ================================================================
   18. GET PLAYER RANK
================================================================ */

async function getPlayerRank(
    userId = null,
    category = "rating"
) {

    const currentUser =
        getLeaderboardCurrentUser();


    const id =
        userId ||
        currentUser?.id;


    if (!id) {

        return null;

    }


    const players =
        await loadAllLeaderboardPlayers();


    const sorted =
        sortPlayersByCategory(
            players,
            category
        );


    const ranked =
        assignPlayerRanks(
            sorted
        );


    const player =
        ranked.find(
            item =>
                item.id === id
        );


    if (!player) {

        return null;

    }


    leaderboardState.currentPlayer =
        player;


    leaderboardState.currentPlayerRank =
        player.rank;


    leaderboardEvents.emit(
        "playerRankUpdated",
        player
    );


    return player;

}


/* ================================================================
   19. GET NEARBY PLAYERS
================================================================ */

async function getNearbyPlayers(
    range = 2,
    category = "rating"
) {

    const player =
        await getPlayerRank(
            null,
            category
        );


    if (!player) {

        return [];

    }


    const players =
        await loadAllLeaderboardPlayers();


    const sorted =
        assignPlayerRanks(
            sortPlayersByCategory(
                players,
                category
            )
        );


    const minRank =
        Math.max(
            player.rank - range,
            1
        );


    const maxRank =
        player.rank +
        range;


    const nearby =
        sorted.filter(
            item =>
                item.rank >= minRank &&
                item.rank <= maxRank
        );


    leaderboardState.nearbyPlayers =
        nearby;


    return nearby;

}


/* ================================================================
   20. SEARCH PLAYER
================================================================ */

async function searchPlayer(
    query
) {

    return await getLeaderboard({

        category:
            leaderboardState.currentCategory,

        page:
            1,

        pageSize:
            leaderboardConfig.maxPageSize,

        search:
            query || ""

    });

}


/* ================================================================
   21. REFRESH
================================================================ */

async function refreshLeaderboard(
    category =
        leaderboardState.currentCategory
) {

    leaderboardState.cache.clear();


    return await getLeaderboard({

        category,

        page:
            leaderboardState.currentPage,

        pageSize:
            leaderboardState.pageSize,

        search:
            leaderboardState.searchQuery,

        forceRefresh:
            true

    });

}


/* ================================================================
   22. FORMAT NUMBER
================================================================ */

function formatLeaderboardNumber(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
        "fa-IR"
    );

}


/* ================================================================
   23. FORMAT WIN RATE
================================================================ */

function formatWinRate(
    value
) {

    return `${Number(
        value || 0
    ).toLocaleString(
        "fa-IR",
        {
            maximumFractionDigits: 1
        }
    )}%`;

}


/* ================================================================
   24. GET RANK ICON
================================================================ */

function getRankIcon(
    rank
) {

    const number =
        Number(rank || 0);


    if (
        number === 1
    ) {

        return "🥇";

    }


    if (
        number === 2
    ) {

        return "🥈";

    }


    if (
        number === 3
    ) {

        return "🥉";

    }


    return "🏅";

}


/* ================================================================
   25. GET RANK CLASS
================================================================ */

function getRankClass(
    rank
) {

    const number =
        Number(rank || 0);


    if (
        number === 1
    ) {

        return "rank-first";

    }


    if (
        number === 2
    ) {

        return "rank-second";

    }


    if (
        number === 3
    ) {

        return "rank-third";

    }


    return "rank-normal";

}


/* ================================================================
   26. ESCAPE HTML
================================================================ */

function escapeLeaderboardHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ================================================================
   27. CREATE PLAYER ROW
================================================================ */

function createLeaderboardPlayerHTML(
    player
) {

    if (!player) {

        return "";

    }


    const rank =
        Number(
            player.rank || 0
        );


    const avatar =
        player.avatar_url ||
        "";


    const avatarHTML =
        avatar
            ? `
                <img
                    class="leaderboard-avatar"
                    src="${escapeLeaderboardHTML(avatar)}"
                    alt=""
                    loading="lazy"
                >
              `
            : `
                <div class="leaderboard-avatar leaderboard-avatar-placeholder">
                    👤
                </div>
              `;


    const currentUser =
        getLeaderboardCurrentUser();


    const isCurrentUser =
        !!(
            currentUser &&
            player.id &&
            currentUser.id === player.id
        );


    return `

        <div
            class="leaderboard-player-row ${getRankClass(rank)} ${isCurrentUser ? "leaderboard-current-user" : ""}"
            data-player-id="${escapeLeaderboardHTML(player.id || "")}"
        >

            <div class="leaderboard-rank">

                <span class="leaderboard-rank-icon">

                    ${getRankIcon(rank)}

                </span>

                <span class="leaderboard-rank-number">

                    ${formatLeaderboardNumber(rank)}

                </span>

            </div>


            <div class="leaderboard-player-info">

                ${avatarHTML}


                <div class="leaderboard-player-text">

                    <strong class="leaderboard-player-name">

                        ${escapeLeaderboardHTML(player.name)}

                    </strong>


                    <span class="leaderboard-player-level">

                        سطح
                        ${formatLeaderboardNumber(player.level)}

                    </span>

                </div>

            </div>


            <div class="leaderboard-stat">

                <span class="leaderboard-stat-label">

                    امتیاز

                </span>

                <strong>

                    ${formatLeaderboardNumber(player.rating)}

                </strong>

            </div>


            <div class="leaderboard-stat">

                <span class="leaderboard-stat-label">

                    برد

                </span>

                <strong>

                    ${formatLeaderboardNumber(player.games_won)}

                </strong>

            </div>


            <div class="leaderboard-stat">

                <span class="leaderboard-stat-label">

                    نرخ برد

                </span>

                <strong>

                    ${formatWinRate(player.win_rate)}

                </strong>

            </div>


            <div class="leaderboard-stat">

                <span class="leaderboard-stat-label">

                    تجربه

                </span>

                <strong>

                    ${formatLeaderboardNumber(player.experience)}

                </strong>

            </div>

        </div>

    `;

}


/* ================================================================
   28. RENDER LEADERBOARD
================================================================ */

function renderLeaderboard(
    container,
    result = null
) {

    if (
        typeof container === "string"
    ) {

        container =
            document.querySelector(
                container
            );

    }


    if (!container) {

        return;

    }


    const data =
        result || {

            players:
                leaderboardState.players,

            totalPlayers:
                leaderboardState.totalPlayers

        };


    const players =
        data.players || [];


    if (
        !players.length
    ) {

        container.innerHTML = `

            <div class="leaderboard-empty">

                <div class="leaderboard-empty-icon">

                    🏆

                </div>

                <h3>

                    هنوز بازیکنی پیدا نشد

                </h3>

                <p>

                    با شروع بازی‌ها جدول رتبه‌بندی پر می‌شود.

                </p>

            </div>

        `;


        return;

    }


    container.innerHTML =
        players
            .map(
                player =>
                    createLeaderboardPlayerHTML(
                        player
                    )
            )
            .join("");

}


/* ================================================================
   29. RENDER CURRENT PLAYER CARD
================================================================ */

function renderCurrentPlayerRank(
    container,
    player = null
) {

    if (
        typeof container === "string"
    ) {

        container =
            document.querySelector(
                container
            );

    }


    if (!container) {

        return;

    }


    const data =
        player ||
        leaderboardState.currentPlayer;


    if (!data) {

        container.innerHTML = `

            <div class="leaderboard-login-required">

                <span>

                    👤

                </span>

                <p>

                    برای مشاهده رتبه خود وارد حساب شوید.

                </p>

            </div>

        `;


        return;

    }


    container.innerHTML = `

        <div class="leaderboard-my-card">

            <div class="leaderboard-my-rank">

                <span>

                    ${getRankIcon(data.rank)}

                </span>

                <strong>

                    رتبه
                    ${formatLeaderboardNumber(data.rank)}

                </strong>

            </div>


            <div class="leaderboard-my-name">

                ${escapeLeaderboardHTML(data.name)}

            </div>


            <div class="leaderboard-my-stats">

                <div>

                    <span>امتیاز</span>

                    <strong>
                        ${formatLeaderboardNumber(data.rating)}
                    </strong>

                </div>


                <div>

                    <span>برد</span>

                    <strong>
                        ${formatLeaderboardNumber(data.games_won)}
                    </strong>

                </div>


                <div>

                    <span>بازی</span>

                    <strong>
                        ${formatLeaderboardNumber(data.games_played)}
                    </strong>

                </div>


                <div>

                    <span>نرخ برد</span>

                    <strong>
                        ${formatWinRate(data.win_rate)}
                    </strong>

                </div>

            </div>

        </div>

    `;

}


/* ================================================================
   30. RENDER PAGINATION
================================================================ */

function renderLeaderboardPagination(
    container,
    totalPlayers =
        leaderboardState.totalPlayers,
    page =
        leaderboardState.currentPage,
    pageSize =
        leaderboardState.pageSize
) {

    if (
        typeof container === "string"
    ) {

        container =
            document.querySelector(
                container
            );

    }


    if (!container) {

        return;

    }


    const totalPages =
        Math.max(
            Math.ceil(
                totalPlayers /
                pageSize
            ),
            1
        );


    if (
        totalPages <= 1
    ) {

        container.innerHTML = "";

        return;

    }


    let html = `

        <div class="leaderboard-pagination">

    `;


    html += `

        <button
            type="button"
            class="leaderboard-page-button"
            data-leaderboard-page="${page - 1}"
            ${page <= 1 ? "disabled" : ""}
        >

            قبلی

        </button>

    `;


    const startPage =
        Math.max(
            page - 2,
            1
        );


    const endPage =
        Math.min(
            page + 2,
            totalPages
        );


    for (
        let index = startPage;
        index <= endPage;
        index++
    ) {

        html += `

            <button
                type="button"
                class="leaderboard-page-button ${index === page ? "active" : ""}"
                data-leaderboard-page="${index}"
            >

                ${formatLeaderboardNumber(index)}

            </button>

        `;

    }


    html += `

        <button
            type="button"
            class="leaderboard-page-button"
            data-leaderboard-page="${page + 1}"
            ${page >= totalPages ? "disabled" : ""}
        >

            بعدی

        </button>

    `;


    html += `

        </div>

    `;


    container.innerHTML =
        html;

}


/* ================================================================
   31. LOAD AND RENDER FULL LEADERBOARD
================================================================ */

async function loadAndRenderLeaderboard(
    options = {}
) {

    const result =
        await getLeaderboard(
            options
        );


    if (!result.success) {

        leaderboardToast(
            "دریافت جدول رتبه‌بندی انجام نشد.",
            "❌"
        );


        return result;

    }


    const listContainer =
        options.container ||
        "[data-leaderboard-list]";


    const currentPlayerContainer =
        options.currentPlayerContainer ||
        "[data-leaderboard-me]";


    const paginationContainer =
        options.paginationContainer ||
        "[data-leaderboard-pagination]";


    renderLeaderboard(
        listContainer,
        result
    );


    const player =
        await getPlayerRank(
            null,
            result.category
        );


    renderCurrentPlayerRank(
        currentPlayerContainer,
        player
    );


    renderLeaderboardPagination(
        paginationContainer,
        result.totalPlayers,
        result.page,
        result.pageSize
    );


    return result;

}


/* ================================================================
   32. CATEGORY BUTTONS
================================================================ */

function setupLeaderboardCategoryButtons() {

    document.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "[data-leaderboard-category]"
                );


            if (!button) {

                return;

            }


            const category =
                button.dataset
                    .leaderboardCategory;


            if (
                !leaderboardConfig.categories.includes(
                    category
                )
            ) {

                return;

            }


            document
                .querySelectorAll(
                    "[data-leaderboard-category]"
                )
                .forEach(
                    element => {

                        element.classList.toggle(
                            "active",
                            element === button
                        );

                    }
                );


            await loadAndRenderLeaderboard({

                category,

                page:
                    1,

                pageSize:
                    leaderboardState.pageSize

            });

        }
    );

}


/* ================================================================
   33. PAGINATION BUTTONS
================================================================ */

function setupLeaderboardPagination() {

    document.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "[data-leaderboard-page]"
                );


            if (!button) {

                return;

            }


            if (
                button.disabled
            ) {

                return;

            }


            const page =
                Number(
                    button.dataset
                        .leaderboardPage
                );


            if (
                !Number.isFinite(page) ||
                page < 1
            ) {

                return;

            }


            await loadAndRenderLeaderboard({

                category:
                    leaderboardState.currentCategory,

                page,

                pageSize:
                    leaderboardState.pageSize,

                search:
                    leaderboardState.searchQuery

            });

        }
    );

}


/* ================================================================
   34. SEARCH UI
================================================================ */

function setupLeaderboardSearch() {

    document.addEventListener(
        "submit",
        async event => {

            const form =
                event.target.closest(
                    "[data-leaderboard-search-form]"
                );


            if (!form) {

                return;

            }


            event.preventDefault();


            const input =
                form.querySelector(
                    "[data-leaderboard-search-input]"
                );


            const query =
                input?.value ||
                "";


            await loadAndRenderLeaderboard({

                category:
                    leaderboardState.currentCategory,

                page:
                    1,

                pageSize:
                    leaderboardState.pageSize,

                search:
                    query

            });

        }
    );

}


/* ================================================================
   35. REFRESH BUTTON
================================================================ */

function setupLeaderboardRefresh() {

    document.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "[data-leaderboard-refresh]"
                );


            if (!button) {

                return;

            }


            await refreshLeaderboard();

        }
    );

}


/* ================================================================
   36. INITIALIZE UI EVENTS
================================================================ */

function setupLeaderboardUI() {

    setupLeaderboardCategoryButtons();

    setupLeaderboardPagination();

    setupLeaderboardSearch();

    setupLeaderboardRefresh();

}


/* ================================================================
   37. AUTO REFRESH
================================================================ */

function startLeaderboardAutoRefresh() {

    stopLeaderboardAutoRefresh();


    leaderboardState.autoRefreshTimer =
        setInterval(
            async () => {

                if (
                    document.hidden
                ) {

                    return;

                }


                if (
                    !leaderboardState.initialized
                ) {

                    return;

                }


                try {

                    await refreshLeaderboard();

                } catch (error) {

                    console.error(
                        "Leaderboard auto refresh error:",
                        error
                    );

                }

            },
            leaderboardConfig.autoRefreshInterval
        );

}


/* ================================================================
   38. STOP AUTO REFRESH
================================================================ */

function stopLeaderboardAutoRefresh() {

    if (
        leaderboardState.autoRefreshTimer
    ) {

        clearInterval(
            leaderboardState.autoRefreshTimer
        );


        leaderboardState.autoRefreshTimer =
            null;

    }

}


/* ================================================================
   39. INITIALIZE
================================================================ */

async function initializeLeaderboard() {

    if (
        leaderboardState.initialized
    ) {

        return leaderboardState;

    }


    leaderboardLoading(
        true,
        "در حال آماده‌سازی رتبه‌بندی..."
    );


    try {

        setupLeaderboardUI();


        leaderboardState.initialized =
            true;


        await loadAndRenderLeaderboard({

            category:
                "rating",

            page:
                1,

            pageSize:
                leaderboardConfig.defaultPageSize

        });


        startLeaderboardAutoRefresh();


        leaderboardEvents.emit(
            "initialized",
            leaderboardState
        );


        console.log(
            "Hokm Online Leaderboard initialized successfully."
        );


        return leaderboardState;


    } catch (error) {

        console.error(
            "خطا در initializeLeaderboard:",
            error
        );


        return leaderboardState;


    } finally {

        leaderboardLoading(
            false
        );

    }

}


/* ================================================================
   40. AUTH EVENT CONNECTION
================================================================ */

function connectLeaderboardToAuth() {

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.onAuthChange === "function"
    ) {

        window.hokmAuth.onAuthChange(
            async () => {

                leaderboardState.cache.clear();


                if (
                    leaderboardState.initialized
                ) {

                    await loadAndRenderLeaderboard({

                        category:
                            leaderboardState.currentCategory,

                        page:
                            leaderboardState.currentPage,

                        pageSize:
                            leaderboardState.pageSize,

                        search:
                            leaderboardState.searchQuery

                    });

                }

            }
        );

    }


    if (
        window.hokmAuth &&
        typeof window.hokmAuth.onProfileUpdated === "function"
    ) {

        window.hokmAuth.onProfileUpdated(
            async () => {

                leaderboardState.cache.clear();


                if (
                    leaderboardState.initialized
                ) {

                    await refreshLeaderboard();

                }

            }
        );

    }

}


/* ================================================================
   41. GAME EVENT CONNECTION
================================================================ */

function connectLeaderboardToGame() {

    /*
     * اگر game.js سیستم Event داشته باشد،
     * بعد از پایان بازی جدول را تازه می‌کنیم.
     */

    if (
        window.hokmGameEvents &&
        typeof window.hokmGameEvents.on === "function"
    ) {

        window.hokmGameEvents.on(
            "gameFinished",
            async () => {

                leaderboardState.cache.clear();


                if (
                    leaderboardState.initialized
                ) {

                    await refreshLeaderboard();

                }

            }
        );

    }


    /*
     * Event عمومی.
     */

    window.addEventListener(
        "hokm:gameFinished",
        async () => {

            leaderboardState.cache.clear();


            if (
                leaderboardState.initialized
            ) {

                await refreshLeaderboard();

            }

        }
    );

}


/* ================================================================
   42. PUBLIC API
================================================================ */

window.hokmLeaderboard = {

    state:
        leaderboardState,

    config:
        leaderboardConfig,

    events:
        leaderboardEvents,

    initialize:
        initializeLeaderboard,

    getLeaderboard,

    loadAndRenderLeaderboard,

    getPlayerRank,

    getNearbyPlayers,

    searchPlayer,

    refreshLeaderboard,

    loadAllLeaderboardPlayers,

    calculatePlayerRating,

    sortPlayersByCategory,

    renderLeaderboard,

    renderCurrentPlayerRank,

    renderLeaderboardPagination,

    formatNumber:
        formatLeaderboardNumber,

    formatWinRate,

    getRankIcon,

    getRankClass,

    startAutoRefresh:
        startLeaderboardAutoRefresh,

    stopAutoRefresh:
        stopLeaderboardAutoRefresh

};


/* ================================================================
   43. GLOBAL SHORTCUTS
================================================================ */

window.getLeaderboard =
    getLeaderboard;


window.getPlayerRank =
    getPlayerRank;


window.getNearbyPlayers =
    getNearbyPlayers;


window.refreshLeaderboard =
    refreshLeaderboard;


window.searchLeaderboardPlayer =
    searchPlayer;


window.initializeLeaderboard =
    initializeLeaderboard;


/* ================================================================
   44. DOM READY
================================================================ */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            connectLeaderboardToAuth();

            connectLeaderboardToGame();

            initializeLeaderboard();

        }
    );

} else {

    connectLeaderboardToAuth();

    connectLeaderboardToGame();

    initializeLeaderboard();

}


/* ================================================================
   45. VISIBILITY CHANGE
================================================================ */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden
        ) {

            stopLeaderboardAutoRefresh();

        } else {

            if (
                leaderboardState.initialized
            ) {

                startLeaderboardAutoRefresh();

            }

        }

    }
);


/* ================================================================
   46. PAGE UNLOAD
================================================================ */

window.addEventListener(
    "beforeunload",
    () => {

        stopLeaderboardAutoRefresh();

    }
);


/* ================================================================
   END OF LEADERBOARD.JS
================================================================ */
