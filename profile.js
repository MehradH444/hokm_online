"use strict";

/*
====================================================================
 HOKM ONLINE
 profile.js
====================================================================

 فایل شماره ۵ از ۱۲

 مسئولیت‌های این فایل:

 1. مدیریت پروفایل بازیکن
 2. نمایش اطلاعات بازیکن
 3. نمایش نام کاربری
 4. نمایش آواتار
 5. نمایش سکه
 6. نمایش سطح
 7. نمایش تجربه
 8. نمایش تعداد بازی‌ها
 9. نمایش تعداد بردها
10. نمایش تعداد باخت‌ها
11. نمایش تعداد دست‌های برده‌شده
12. نمایش نرخ برد
13. نمایش آمار کامل
14. ویرایش نام نمایشی
15. تغییر آواتار
16. ذخیره اطلاعات پروفایل
17. هماهنگی با auth.js
18. هماهنگی با game.js
19. هماهنگی با shop.js
20. هماهنگی با wallet.js
21. مدیریت پنل پروفایل
22. مدیریت پنجره ویرایش پروفایل
23. نمایش سطح و XP
24. نمایش نوار پیشرفت XP
25. نمایش رتبه بازیکن
26. مدیریت پروفایل مهمان
27. مدیریت داده‌های محلی در صورت نبود Supabase
28. جلوگیری از حذف اطلاعات قبلی
29. پشتیبانی از UIهای مختلف
30. API عمومی برای سایر فایل‌های بازی

 توجه:
 این فایل هیچ سیستم اصلی بازی، سکه، فروشگاه یا احراز هویت را حذف نمی‌کند.
 فقط مسئول لایه پروفایل است.
====================================================================
*/


/* ================================================================
   1. PROFILE STATE
================================================================ */

const profileState = {

    initialized: false,

    loading: false,

    editing: false,

    profile: null,

    user: null,

    isGuest: false,

    selectedAvatar: null,

    originalProfile: null

};


/* ================================================================
   2. PROFILE CONSTANTS
================================================================ */

const PROFILE_CONFIG = {

    defaultName: "بازیکن",

    defaultLevel: 1,

    defaultCoins: 3000,

    defaultExperience: 0,

    maxNameLength: 20,

    minNameLength: 2,

    avatars: [

        "♟️",
        "👑",
        "😎",
        "🔥",
        "⚡",
        "🎯",
        "🦁",
        "🐯",
        "🐺",
        "🦊",
        "🐼",
        "🐸",
        "🤖",
        "👽",
        "💎",
        "🏆"

    ],

    levelBaseXP: 100,

    levelXPIncrement: 50

};


/* ================================================================
   3. UTILITY FUNCTIONS
================================================================ */

function profileLog(
    ...args
) {

    console.log(
        "[HOKM PROFILE]",
        ...args
    );

}


function profileWarn(
    ...args
) {

    console.warn(
        "[HOKM PROFILE]",
        ...args
    );

}


function profileError(
    ...args
) {

    console.error(
        "[HOKM PROFILE]",
        ...args
    );

}


function profileToast(
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


function profileLoading(
    show,
    message = "لطفاً صبر کنید..."
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
   4. SAFE NUMBER
================================================================ */

function profileNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    if (
        Number.isFinite(number)
    ) {

        return number;

    }

    return fallback;

}


/* ================================================================
   5. SAFE STRING
================================================================ */

function profileString(
    value,
    fallback = ""
) {

    if (
        value === null ||
        value === undefined
    ) {

        return fallback;

    }

    return String(value);

}


/* ================================================================
   6. GET SUPABASE CLIENT
================================================================ */

function getProfileSupabaseClient() {

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

function profileGetCurrentUser() {

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.getCurrentUser === "function"
    ) {

        return window.hokmAuth.getCurrentUser();

    }

    return profileState.user || null;

}


/* ================================================================
   8. GET CURRENT PROFILE
================================================================ */

function profileGetCurrentProfile() {

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.getCurrentProfile === "function"
    ) {

        const profile =
            window.hokmAuth.getCurrentProfile();

        if (profile) {

            return profile;

        }

    }

    return profileState.profile || null;

}


/* ================================================================
   9. CREATE DEFAULT PROFILE
================================================================ */

function createDefaultProfile(
    user = null
) {

    const metadata =
        user?.user_metadata || {};


    const metadataName =
        metadata.display_name ||
        metadata.username ||
        metadata.name;


    const name =
        profileNormalizeName(
            metadataName ||
            PROFILE_CONFIG.defaultName
        );


    return {

        id:
            user?.id || null,

        username:
            name,

        display_name:
            name,

        avatar_url:
            metadata.avatar_url ||
            null,

        avatar:
            metadata.avatar ||
            PROFILE_CONFIG.avatars[0],

        coins:
            PROFILE_CONFIG.defaultCoins,

        level:
            PROFILE_CONFIG.defaultLevel,

        experience:
            PROFILE_CONFIG.defaultExperience,

        games_played:
            0,

        games_won:
            0,

        games_lost:
            0,

        total_tricks:
            0,

        win_streak:
            0,

        best_win_streak:
            0,

        rating:
            1000,

        rank:
            "برنزی",

        created_at:
            new Date().toISOString(),

        updated_at:
            new Date().toISOString()

    };

}


/* ================================================================
   10. NORMALIZE NAME
================================================================ */

function profileNormalizeName(
    name
) {

    let result =
        profileString(
            name,
            PROFILE_CONFIG.defaultName
        )
            .trim();


    if (
        result.length <
        PROFILE_CONFIG.minNameLength
    ) {

        result =
            PROFILE_CONFIG.defaultName;

    }


    result =
        result.slice(
            0,
            PROFILE_CONFIG.maxNameLength
        );


    return result;

}


/* ================================================================
   11. NORMALIZE PROFILE
================================================================ */

function normalizeProfile(
    profile,
    user = null
) {

    const base =
        createDefaultProfile(
            user
        );


    const source =
        profile || {};


    const normalized = {

        ...base,

        ...source

    };


    const name =
        profileNormalizeName(
            normalized.display_name ||
            normalized.username ||
            base.display_name
        );


    normalized.username =
        name;


    normalized.display_name =
        name;


    normalized.coins =
        Math.max(
            0,
            profileNumber(
                normalized.coins,
                PROFILE_CONFIG.defaultCoins
            )
        );


    normalized.level =
        Math.max(
            1,
            profileNumber(
                normalized.level,
                1
            )
        );


    normalized.experience =
        Math.max(
            0,
            profileNumber(
                normalized.experience,
                0
            )
        );


    normalized.games_played =
        Math.max(
            0,
            profileNumber(
                normalized.games_played,
                0
            )
        );


    normalized.games_won =
        Math.max(
            0,
            profileNumber(
                normalized.games_won,
                0
            )
        );


    normalized.games_lost =
        Math.max(
            0,
            profileNumber(
                normalized.games_lost,
                0
            )
        );


    normalized.total_tricks =
        Math.max(
            0,
            profileNumber(
                normalized.total_tricks,
                0
            )
        );


    normalized.win_streak =
        Math.max(
            0,
            profileNumber(
                normalized.win_streak,
                0
            )
        );


    normalized.best_win_streak =
        Math.max(
            0,
            profileNumber(
                normalized.best_win_streak,
                0
            )
        );


    normalized.rating =
        Math.max(
            0,
            profileNumber(
                normalized.rating,
                1000
            )
        );


    normalized.rank =
        normalized.rank ||
        calculateRank(
            normalized.rating
        );


    return normalized;

}


/* ================================================================
   12. CALCULATE LEVEL XP
================================================================ */

function getRequiredExperience(
    level
) {

    const safeLevel =
        Math.max(
            1,
            profileNumber(
                level,
                1
            )
        );


    return (
        PROFILE_CONFIG.levelBaseXP +
        (
            safeLevel - 1
        ) *
        PROFILE_CONFIG.levelXPIncrement
    );

}


/* ================================================================
   13. GET LEVEL PROGRESS
================================================================ */

function getLevelProgress(
    profile = null
) {

    const data =
        profile ||
        profileState.profile ||
        createDefaultProfile();


    const level =
        Math.max(
            1,
            profileNumber(
                data.level,
                1
            )
        );


    const experience =
        Math.max(
            0,
            profileNumber(
                data.experience,
                0
            )
        );


    const required =
        getRequiredExperience(
            level
        );


    const percentage =
        Math.min(
            100,
            Math.max(
                0,
                (
                    experience /
                    required
                ) *
                100
            )
        );


    return {

        level,

        experience,

        required,

        percentage

    };

}


/* ================================================================
   14. CALCULATE RANK
================================================================ */

function calculateRank(
    rating
) {

    const value =
        profileNumber(
            rating,
            1000
        );


    if (
        value >= 1800
    ) {

        return "الماسی";

    }


    if (
        value >= 1600
    ) {

        return "الماس";

    }


    if (
        value >= 1400
    ) {

        return "طلایی";

    }


    if (
        value >= 1200
    ) {

        return "نقره‌ای";

    }


    return "برنزی";

}


/* ================================================================
   15. CALCULATE WIN RATE
================================================================ */

function calculateWinRate(
    profile = null
) {

    const data =
        profile ||
        profileState.profile;


    if (!data) {

        return 0;

    }


    const games =
        profileNumber(
            data.games_played,
            0
        );


    const wins =
        profileNumber(
            data.games_won,
            0
        );


    if (
        games <= 0
    ) {

        return 0;

    }


    return Math.min(
        100,
        Math.max(
            0,
            (
                wins /
                games
            ) *
            100
        )
    );

}


/* ================================================================
   16. FORMAT NUMBER
================================================================ */

function profileFormatNumber(
    value
) {

    return profileNumber(
        value,
        0
    ).toLocaleString(
        "fa-IR"
    );

}


/* ================================================================
   17. FORMAT PERCENT
================================================================ */

function profileFormatPercent(
    value
) {

    return (
        profileNumber(
            value,
            0
        ).toFixed(1)
    ) + "%";

}


/* ================================================================
   18. LOAD LOCAL PROFILE
================================================================ */

function loadLocalProfile() {

    try {

        const saved =
            localStorage.getItem(
                "hokm_profile"
            );


        if (!saved) {

            return null;

        }


        const parsed =
            JSON.parse(
                saved
            );


        if (
            !parsed ||
            typeof parsed !== "object"
        ) {

            return null;

        }


        return normalizeProfile(
            parsed
        );


    } catch (error) {

        profileError(
            "خطا در خواندن پروفایل محلی:",
            error
        );


        return null;

    }

}


/* ================================================================
   19. SAVE LOCAL PROFILE
================================================================ */

function saveLocalProfile(
    profile
) {

    try {

        const normalized =
            normalizeProfile(
                profile
            );


        localStorage.setItem(
            "hokm_profile",
            JSON.stringify(
                normalized
            )
        );


        return true;


    } catch (error) {

        profileError(
            "خطا در ذخیره پروفایل محلی:",
            error
        );


        return false;

    }

}


/* ================================================================
   20. LOAD PROFILE FROM SERVER
================================================================ */

async function loadProfileFromServer() {

    const client =
        getProfileSupabaseClient();


    const user =
        profileGetCurrentUser();


    if (
        !client ||
        !user
    ) {

        return null;

    }


    try {

        const {
            data,
            error
        } = await client
            .from("profiles")
            .select("*")
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


        if (error) {

            profileError(
                "خطا در دریافت پروفایل:",
                error
            );


            return null;

        }


        if (!data) {

            return null;

        }


        return normalizeProfile(
            data,
            user
        );


    } catch (error) {

        profileError(
            "خطای غیرمنتظره در loadProfileFromServer:",
            error
        );


        return null;

    }

}


/* ================================================================
   21. SAVE PROFILE TO SERVER
================================================================ */

async function saveProfileToServer(
    updates
) {

    const client =
        getProfileSupabaseClient();


    const user =
        profileGetCurrentUser();


    if (
        !client ||
        !user
    ) {

        return null;

    }


    try {

        const allowed = {

            updated_at:
                new Date().toISOString()

        };


        if (
            updates.username !== undefined
        ) {

            allowed.username =
                profileNormalizeName(
                    updates.username
                );

        }


        if (
            updates.display_name !== undefined
        ) {

            allowed.username =
                profileNormalizeName(
                    updates.display_name
                );

        }


        if (
            updates.avatar_url !== undefined
        ) {

            allowed.avatar_url =
                updates.avatar_url;

        }


        if (
            updates.avatar !== undefined
        ) {

            allowed.avatar =
                updates.avatar;

        }


        const {
            data,
            error
        } = await client
            .from("profiles")
            .update(
                allowed
            )
            .eq(
                "id",
                user.id
            )
            .select()
            .single();


        if (error) {

            profileError(
                "خطا در ذخیره پروفایل:",
                error
            );


            return null;

        }


        return normalizeProfile(
            data,
            user
        );


    } catch (error) {

        profileError(
            "خطای saveProfileToServer:",
            error
        );


        return null;

    }

}


/* ================================================================
   22. LOAD PROFILE
================================================================ */

async function loadProfileData() {

    if (
        profileState.loading
    ) {

        return profileState.profile;

    }


    profileState.loading =
        true;


    try {

        const user =
            profileGetCurrentUser();


        profileState.user =
            user;


        /*
         * اگر کاربر وارد شده باشد،
         * ابتدا اطلاعات Supabase را می‌گیریم.
         */

        if (user) {

            profileState.isGuest =
                false;


            let profile =
                profileGetCurrentProfile();


            if (!profile) {

                profile =
                    await loadProfileFromServer();

            }


            if (profile) {

                profileState.profile =
                    normalizeProfile(
                        profile,
                        user
                    );

            } else {

                const local =
                    loadLocalProfile();


                profileState.profile =
                    normalizeProfile(
                        local ||
                        createDefaultProfile(
                            user
                        ),
                        user
                    );

            }

        } else {

            /*
             * حالت مهمان
             */

            profileState.isGuest =
                true;


            const local =
                loadLocalProfile();


            profileState.profile =
                normalizeProfile(
                    local ||
                    createDefaultProfile(),
                    null
                );

        }


        profileState.originalProfile =
            JSON.parse(
                JSON.stringify(
                    profileState.profile
                )
            );


        saveLocalProfile(
            profileState.profile
        );


        updateProfileUI();


        return profileState.profile;


    } catch (error) {

        profileError(
            "خطا در loadProfileData:",
            error
        );


        if (
            !profileState.profile
        ) {

            profileState.profile =
                createDefaultProfile();

        }


        updateProfileUI();


        return profileState.profile;


    } finally {

        profileState.loading =
            false;

    }

}


/* ================================================================
   23. UPDATE PROFILE UI
==================================================================== */

function updateProfileUI() {

    const profile =
        profileState.profile ||
        createDefaultProfile();


    const user =
        profileState.user ||
        profileGetCurrentUser();


    profileState.profile =
        normalizeProfile(
            profile,
            user
        );


    const data =
        profileState.profile;


    /* ------------------------------------------------------------
       NAME
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-profile-name], [data-user-name]"
        )
        .forEach(
            element => {

                element.textContent =
                    data.display_name ||
                    data.username ||
                    PROFILE_CONFIG.defaultName;

            }
        );


    /* ------------------------------------------------------------
       USERNAME
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-profile-username]"
        )
        .forEach(
            element => {

                element.textContent =
                    data.username ||
                    data.display_name ||
                    PROFILE_CONFIG.defaultName;

            }
        );


    /* ------------------------------------------------------------
       EMAIL
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-profile-email], [data-user-email]"
        )
        .forEach(
            element => {

                element.textContent =
                    user?.email ||
                    "مهمان";

            }
        );


    /* ------------------------------------------------------------
       COINS
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-profile-coins], [data-user-coins]"
        )
        .forEach(
            element => {

                element.textContent =
                    profileFormatNumber(
                        data.coins
                    );

            }
        );


    /* ------------------------------------------------------------
       LEVEL
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-profile-level], [data-user-level]"
        )
        .forEach(
            element => {

                element.textContent =
                    profileFormatNumber(
                        data.level
                    );

            }
        );


    /* ------------------------------------------------------------
       EXPERIENCE
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-profile-experience]"
        )
        .forEach(
            element => {

                element.textContent =
                    profileFormatNumber(
                        data.experience
                    );

            }
        );


    /* ------------------------------------------------------------
       GAMES PLAYED
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-games-played]"
        )
        .forEach(
            element => {

                element.textContent =
                    profileFormatNumber(
                        data.games_played
                    );

            }
        );


    /* ------------------------------------------------------------
       GAMES WON
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-games-won]"
        )
        .forEach(
            element => {

                element.textContent =
                    profileFormatNumber(
                        data.games_won
                    );

            }
        );


    /* ------------------------------------------------------------
       GAMES LOST
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-games-lost]"
        )
        .forEach(
            element => {

                element.textContent =
                    profileFormatNumber(
                        data.games_lost
                    );

            }
        );


    /* ------------------------------------------------------------
       TOTAL TRICKS
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-total-tricks]"
        )
        .forEach(
            element => {

                element.textContent =
                    profileFormatNumber(
                        data.total_tricks
                    );

            }
        );


    /* ------------------------------------------------------------
       WIN RATE
    ------------------------------------------------------------ */

    const winRate =
        calculateWinRate(
            data
        );


    document
        .querySelectorAll(
            "[data-win-rate]"
        )
        .forEach(
            element => {

                element.textContent =
                    profileFormatPercent(
                        winRate
                    );

            }
        );


    /* ------------------------------------------------------------
       WIN STREAK
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-win-streak]"
        )
        .forEach(
            element => {

                element.textContent =
                    profileFormatNumber(
                        data.win_streak
                    );

            }
        );


    /* ------------------------------------------------------------
       BEST WIN STREAK
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-best-win-streak]"
        )
        .forEach(
            element => {

                element.textContent =
                    profileFormatNumber(
                        data.best_win_streak
                    );

            }
        );


    /* ------------------------------------------------------------
       RATING
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-profile-rating]"
        )
        .forEach(
            element => {

                element.textContent =
                    profileFormatNumber(
                        data.rating
                    );

            }
        );


    /* ------------------------------------------------------------
       RANK
    ------------------------------------------------------------ */

    document
        .querySelectorAll(
            "[data-profile-rank]"
        )
        .forEach(
            element => {

                element.textContent =
                    data.rank ||
                    calculateRank(
                        data.rating
                    );

            }
        );


    /* ------------------------------------------------------------
       AVATAR
    ------------------------------------------------------------ */

    updateProfileAvatarUI(
        data
    );


    /* ------------------------------------------------------------
       LEVEL PROGRESS
    ------------------------------------------------------------ */

    updateLevelProgressUI(
        data
    );


    /* ------------------------------------------------------------
       PLAYER STATE
    ------------------------------------------------------------ */

    syncProfileWithGameState();


    /*
     * اطلاع به سایر سیستم‌ها
     */

    emitProfileEvent(
        "profileUIUpdated",
        data
    );

}


/* ================================================================
   24. UPDATE AVATAR UI
================================================================ */

function updateProfileAvatarUI(
    profile
) {

    const data =
        profile ||
        profileState.profile ||
        createDefaultProfile();


    document
        .querySelectorAll(
            "[data-profile-avatar]"
        )
        .forEach(
            element => {

                const avatar =
                    data.avatar ||
                    null;


                if (
                    element.tagName === "IMG"
                ) {

                    if (
                        data.avatar_url
                    ) {

                        element.src =
                            data.avatar_url;

                    }

                } else {

                    element.textContent =
                        avatar ||
                        "♟️";

                }

            }
        );


    document
        .querySelectorAll(
            "[data-user-avatar]"
        )
        .forEach(
            element => {

                if (
                    element.tagName === "IMG"
                ) {

                    if (
                        data.avatar_url
                    ) {

                        element.src =
                            data.avatar_url;

                    }

                } else {

                    element.textContent =
                        data.avatar ||
                        "♟️";

                }

            }
        );

}


/* ================================================================
   25. UPDATE LEVEL PROGRESS UI
================================================================ */

function updateLevelProgressUI(
    profile
) {

    const progress =
        getLevelProgress(
            profile
        );


    document
        .querySelectorAll(
            "[data-xp-progress]"
        )
        .forEach(
            element => {

                element.style.width =
                    `${progress.percentage}%`;

                element.setAttribute(
                    "aria-valuenow",
                    String(
                        progress.percentage
                    )
                );

            }
        );


    document
        .querySelectorAll(
            "[data-xp-text]"
        )
        .forEach(
            element => {

                element.textContent =
                    `${profileFormatNumber(progress.experience)} / ${profileFormatNumber(progress.required)}`;

            }
        );


    document
        .querySelectorAll(
            "[data-xp-percent]"
        )
        .forEach(
            element => {

                element.textContent =
                    profileFormatPercent(
                        progress.percentage
                    );

            }
        );

}


/* ================================================================
   26. SYNC WITH GAME STATE
================================================================ */

function syncProfileWithGameState() {

    const profile =
        profileState.profile;


    if (!profile) {

        return;

    }


    if (
        !window.state ||
        !window.state.player
    ) {

        return;

    }


    const player =
        window.state.player;


    player.name =
        profile.display_name ||
        profile.username ||
        player.name ||
        PROFILE_CONFIG.defaultName;


    player.coins =
        profileNumber(
            profile.coins,
            player.coins || PROFILE_CONFIG.defaultCoins
        );


    player.level =
        profileNumber(
            profile.level,
            player.level || 1
        );


    player.experience =
        profileNumber(
            profile.experience,
            player.experience || 0
        );


    player.gamesPlayed =
        profileNumber(
            profile.games_played,
            player.gamesPlayed || 0
        );


    player.gamesWon =
        profileNumber(
            profile.games_won,
            player.gamesWon || 0
        );


    player.totalTricks =
        profileNumber(
            profile.total_tricks,
            player.totalTricks || 0
        );


    if (
        typeof window.updatePlayerUI === "function"
    ) {

        try {

            window.updatePlayerUI();

        } catch (error) {

            profileWarn(
                "updatePlayerUI خطا داد:",
                error
            );

        }

    }

}


/* ================================================================
   27. UPDATE PROFILE NAME
================================================================ */

async function updateProfileName(
    newName
) {

    const name =
        profileNormalizeName(
            newName
        );


    if (
        name === PROFILE_CONFIG.defaultName &&
        profileString(
            newName
        ).trim().length <
        PROFILE_CONFIG.minNameLength
    ) {

        profileToast(
            "نام بازیکن معتبر نیست.",
            "⚠️"
        );


        return false;

    }


    const current =
        profileState.profile ||
        createDefaultProfile();


    const oldName =
        current.display_name ||
        current.username;


    if (
        name === oldName
    ) {

        closeProfileEditor();

        return true;

    }


    profileLoading(
        true,
        "در حال ذخیره نام..."
    );


    try {

        let savedProfile =
            null;


        /*
         * اول auth.js
         */

        if (
            window.hokmAuth &&
            typeof window.hokmAuth.updateDisplayName === "function"
        ) {

            savedProfile =
                await window.hokmAuth.updateDisplayName(
                    name
                );

        }


        /*
         * اگر auth.js نتوانست ذخیره کند،
         * مستقیم Supabase را امتحان می‌کنیم.
         */

        if (
            !savedProfile
        ) {

            savedProfile =
                await saveProfileToServer({

                    username:
                        name,

                    display_name:
                        name

                });

        }


        /*
         * اگر Supabase موجود نبود،
         * نسخه محلی را نگه می‌داریم.
         */

        if (
            !savedProfile
        ) {

            profileState.profile =
                normalizeProfile({

                    ...current,

                    username:
                        name,

                    display_name:
                        name,

                    updated_at:
                        new Date().toISOString()

                });


            saveLocalProfile(
                profileState.profile
            );

        } else {

            profileState.profile =
                normalizeProfile(
                    savedProfile,
                    profileState.user
                );


            saveLocalProfile(
                profileState.profile
            );

        }


        updateProfileUI();

        closeProfileEditor();


        profileToast(
            "نام بازیکن با موفقیت تغییر کرد.",
            "✅",
            3500
        );


        emitProfileEvent(
            "nameChanged",
            profileState.profile
        );


        return true;


    } catch (error) {

        profileError(
            "خطا در updateProfileName:",
            error
        );


        profileToast(
            "تغییر نام انجام نشد.",
            "❌"
        );


        return false;


    } finally {

        profileLoading(
            false
        );

    }

}


/* ================================================================
   28. UPDATE AVATAR
================================================================ */

async function updateAvatar(
    avatar,
    avatarUrl = null
) {

    if (
        !avatar &&
        !avatarUrl
    ) {

        return false;

    }


    const current =
        profileState.profile ||
        createDefaultProfile();


    const updates = {

        avatar:
            avatar ||
            current.avatar,

        avatar_url:
            avatarUrl !== null
                ? avatarUrl
                : current.avatar_url

    };


    profileLoading(
        true,
        "در حال ذخیره آواتار..."
    );


    try {

        let saved =
            null;


        if (
            window.hokmAuth &&
            typeof window.hokmAuth.updateProfile === "function"
        ) {

            saved =
                await window.hokmAuth.updateProfile(
                    updates
                );

        }


        if (
            !saved
        ) {

            saved =
                await saveProfileToServer(
                    updates
                );

        }


        if (
            saved
        ) {

            profileState.profile =
                normalizeProfile(
                    saved,
                    profileState.user
                );

        } else {

            profileState.profile =
                normalizeProfile({

                    ...current,

                    ...updates,

                    updated_at:
                        new Date().toISOString()

                });

        }


        saveLocalProfile(
            profileState.profile
        );


        updateProfileUI();


        profileToast(
            "آواتار با موفقیت تغییر کرد.",
            "✅"
        );


        emitProfileEvent(
            "avatarChanged",
            profileState.profile
        );


        return true;


    } catch (error) {

        profileError(
            "خطا در updateAvatar:",
            error
        );


        profileToast(
            "تغییر آواتار انجام نشد.",
            "❌"
        );


        return false;


    } finally {

        profileLoading(
            false
        );

    }

}


/* ================================================================
   29. OPEN PROFILE EDITOR
================================================================ */

function openProfileEditor() {

    const profile =
        profileState.profile ||
        createDefaultProfile();


    profileState.editing =
        true;


    profileState.selectedAvatar =
        profile.avatar ||
        PROFILE_CONFIG.avatars[0];


    const modal =
        document.querySelector(
            "[data-profile-editor]"
        );


    if (
        modal
    ) {

        modal.classList.add(
            "active"
        );


        modal.style.display =
            "flex";

    }


    const input =
        document.querySelector(
            "[data-profile-name-input]"
        );


    if (
        input
    ) {

        input.value =
            profile.display_name ||
            profile.username ||
            "";


        setTimeout(
            () => {

                input.focus();

                try {

                    input.select();

                } catch (_) {}

            },
            100
        );

    }


    renderAvatarSelector();

}


/* ================================================================
   30. CLOSE PROFILE EDITOR
================================================================ */

function closeProfileEditor() {

    profileState.editing =
        false;


    const modal =
        document.querySelector(
            "[data-profile-editor]"
        );


    if (
        modal
    ) {

        modal.classList.remove(
            "active"
        );


        modal.style.display =
            "none";

    }

}


/* ================================================================
   31. RENDER AVATAR SELECTOR
================================================================ */

function renderAvatarSelector() {

    const container =
        document.querySelector(
            "[data-avatar-selector]"
        );


    if (
        !container
    ) {

        return;

    }


    container.innerHTML =
        "";


    PROFILE_CONFIG.avatars.forEach(
        avatar => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "profile-avatar-option";


            button.textContent =
                avatar;


            if (
                avatar ===
                profileState.selectedAvatar
            ) {

                button.classList.add(
                    "selected"
                );

            }


            button.addEventListener(
                "click",
                () => {

                    profileState.selectedAvatar =
                        avatar;


                    container
                        .querySelectorAll(
                            ".profile-avatar-option"
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "selected"
                                );

                            }
                        );


                    button.classList.add(
                        "selected"
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


/* ================================================================
   32. SAVE PROFILE EDITOR
================================================================ */

async function saveProfileEditor() {

    const input =
        document.querySelector(
            "[data-profile-name-input]"
        );


    if (
        !input
    ) {

        return false;

    }


    const name =
        profileString(
            input.value
        ).trim();


    if (
        name.length <
        PROFILE_CONFIG.minNameLength
    ) {

        profileToast(
            "نام باید حداقل ۲ کاراکتر باشد.",
            "⚠️"
        );


        return false;

    }


    if (
        name.length >
        PROFILE_CONFIG.maxNameLength
    ) {

        profileToast(
            `نام نمی‌تواند بیشتر از ${PROFILE_CONFIG.maxNameLength} کاراکتر باشد.`,
            "⚠️"
        );


        return false;

    }


    const nameResult =
        await updateProfileName(
            name
        );


    if (
        !nameResult
    ) {

        return false;

    }


    if (
        profileState.selectedAvatar
    ) {

        await updateAvatar(
            profileState.selectedAvatar
        );

    }


    closeProfileEditor();


    return true;

}


/* ================================================================
   33. CANCEL PROFILE EDITOR
================================================================ */

function cancelProfileEditor() {

    profileState.selectedAvatar =
        profileState.profile?.avatar ||
        PROFILE_CONFIG.avatars[0];


    closeProfileEditor();

}


/* ================================================================
   34. UPDATE STATISTICS
================================================================ */

async function updateProfileStatistics(
    statistics = {}
) {

    const current =
        profileState.profile ||
        createDefaultProfile();


    const updates = {

        games_played:
            statistics.games_played !== undefined
                ? Math.max(
                    0,
                    profileNumber(
                        statistics.games_played
                    )
                )
                : current.games_played,

        games_won:
            statistics.games_won !== undefined
                ? Math.max(
                    0,
                    profileNumber(
                        statistics.games_won
                    )
                )
                : current.games_won,

        games_lost:
            statistics.games_lost !== undefined
                ? Math.max(
                    0,
                    profileNumber(
                        statistics.games_lost
                    )
                )
                : current.games_lost,

        total_tricks:
            statistics.total_tricks !== undefined
                ? Math.max(
                    0,
                    profileNumber(
                        statistics.total_tricks
                    )
                )
                : current.total_tricks,

        win_streak:
            statistics.win_streak !== undefined
                ? Math.max(
                    0,
                    profileNumber(
                        statistics.win_streak
                    )
                )
                : current.win_streak,

        best_win_streak:
            statistics.best_win_streak !== undefined
                ? Math.max(
                    0,
                    profileNumber(
                        statistics.best_win_streak
                    )
                )
                : current.best_win_streak,

        rating:
            statistics.rating !== undefined
                ? Math.max(
                    0,
                    profileNumber(
                        statistics.rating
                    )
                )
                : current.rating,

        experience:
            statistics.experience !== undefined
                ? Math.max(
                    0,
                    profileNumber(
                        statistics.experience
                    )
                )
                : current.experience

    };


    updates.rank =
        calculateRank(
            updates.rating
        );


    profileState.profile =
        normalizeProfile({

            ...current,

            ...updates,

            updated_at:
                new Date().toISOString()

        });


    saveLocalProfile(
        profileState.profile
    );


    updateProfileUI();


    emitProfileEvent(
        "statisticsUpdated",
        profileState.profile
    );


    return profileState.profile;

}


/* ================================================================
   35. ADD EXPERIENCE
================================================================ */

async function addExperience(
    amount
) {

    const value =
        Math.max(
            0,
            profileNumber(
                amount,
                0
            )
        );


    if (
        value <= 0
    ) {

        return profileState.profile;

    }


    const profile =
        profileState.profile ||
        createDefaultProfile();


    let level =
        Math.max(
            1,
            profileNumber(
                profile.level,
                1
            )
        );


    let experience =
        Math.max(
            0,
            profileNumber(
                profile.experience,
                0
            )
        );


    experience +=
        value;


    let levelUp =
        false;


    while (
        experience >=
        getRequiredExperience(
            level
        )
    ) {

        experience -=
            getRequiredExperience(
                level
            );


        level++;

        levelUp =
            true;

    }


    profileState.profile =
        normalizeProfile({

            ...profile,

            level,

            experience,

            updated_at:
                new Date().toISOString()

        });


    saveLocalProfile(
        profileState.profile
    );


    updateProfileUI();


    if (
        levelUp
    ) {

        profileToast(
            `تبریک! به سطح ${profileFormatNumber(level)} رسیدی! 🎉`,
            "🏆",
            5000
        );


        emitProfileEvent(
            "levelUp",
            {

                level,

                profile:
                    profileState.profile

            }
        );

    }


    emitProfileEvent(
        "experienceAdded",
        {

            amount:
                value,

            profile:
                profileState.profile

        }
    );


    return profileState.profile;

}


/* ================================================================
   36. SET PROFILE COINS
================================================================ */

function setProfileCoins(
    amount
) {

    const profile =
        profileState.profile ||
        createDefaultProfile();


    profile.coins =
        Math.max(
            0,
            profileNumber(
                amount,
                0
            )
        );


    profile.updated_at =
        new Date().toISOString();


    profileState.profile =
        normalizeProfile(
            profile
        );


    saveLocalProfile(
        profileState.profile
    );


    updateProfileUI();


    return profileState.profile.coins;

}


/* ================================================================
   37. GET PROFILE COINS
================================================================ */

function getProfileCoins() {

    return Math.max(
        0,
        profileNumber(
            profileState.profile?.coins,
            0
        )
    );

}


/* ================================================================
   38. GET PROFILE LEVEL
================================================================ */

function getProfileLevel() {

    return Math.max(
        1,
        profileNumber(
            profileState.profile?.level,
            1
        )
    );

}


/* ================================================================
   39. GET PROFILE NAME
================================================================ */

function getProfileName() {

    const profile =
        profileState.profile ||
        createDefaultProfile();


    return (
        profile.display_name ||
        profile.username ||
        PROFILE_CONFIG.defaultName
    );

}


/* ================================================================
   40. GET PROFILE AVATAR
================================================================ */

function getProfileAvatar() {

    const profile =
        profileState.profile ||
        createDefaultProfile();


    return (
        profile.avatar ||
        profile.avatar_url ||
        "♟️"
    );

}


/* ================================================================
   41. PROFILE EVENTS
================================================================ */

const profileEvents = {

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

            this.listeners[eventName] =
                [];

        }


        this.listeners[eventName].push(
            callback
        );

    },


    emit(
        eventName,
        data
    ) {

        const listeners =
            this.listeners[eventName] ||
            [];


        listeners.forEach(
            callback => {

                try {

                    callback(
                        data
                    );

                } catch (error) {

                    profileError(
                        `خطا در رویداد ${eventName}:`,
                        error
                    );

                }

            }
        );

    }

};


/* ================================================================
   42. EMIT PROFILE EVENT
================================================================ */

function emitProfileEvent(
    eventName,
    data
) {

    profileEvents.emit(
        eventName,
        data
    );


    if (
        window.hokmProfileEvents &&
        typeof window.hokmProfileEvents.emit === "function"
    ) {

        try {

            window.hokmProfileEvents.emit(
                eventName,
                data
            );

        } catch (error) {

            profileWarn(
                "خطا در hokmProfileEvents:",
                error
            );

        }

    }

}


/* ================================================================
   43. PROFILE UI EVENTS
================================================================ */

function setupProfileUIEvents() {

    document.addEventListener(
        "click",
        event => {

            const editButton =
                event.target.closest(
                    "[data-action='edit-profile']"
                );


            if (
                editButton
            ) {

                event.preventDefault();

                openProfileEditor();

                return;

            }


            const closeButton =
                event.target.closest(
                    "[data-action='close-profile-editor']"
                );


            if (
                closeButton
            ) {

                event.preventDefault();

                closeProfileEditor();

                return;

            }


            const cancelButton =
                event.target.closest(
                    "[data-action='cancel-profile-edit']"
                );


            if (
                cancelButton
            ) {

                event.preventDefault();

                cancelProfileEditor();

                return;

            }


            const saveButton =
                event.target.closest(
                    "[data-action='save-profile']"
                );


            if (
                saveButton
            ) {

                event.preventDefault();

                saveProfileEditor();

                return;

            }


            const profileButton =
                event.target.closest(
                    "[data-action='open-profile']"
                );


            if (
                profileButton
            ) {

                event.preventDefault();

                openProfilePanel();

                return;

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                profileState.editing
            ) {

                closeProfileEditor();

            }

        }
    );

}


/* ================================================================
   44. OPEN PROFILE PANEL
================================================================ */

function openProfilePanel() {

    const panel =
        document.querySelector(
            "[data-profile-panel]"
        );


    if (
        panel
    ) {

        panel.classList.add(
            "active"
        );


        panel.style.display =
            "flex";

    }


    updateProfileUI();


    emitProfileEvent(
        "profileOpened",
        profileState.profile
    );

}


/* ================================================================
   45. CLOSE PROFILE PANEL
================================================================ */

function closeProfilePanel() {

    const panel =
        document.querySelector(
            "[data-profile-panel]"
        );


    if (
        panel
    ) {

        panel.classList.remove(
            "active"
        );


        panel.style.display =
            "none";

    }


    emitProfileEvent(
        "profileClosed",
        profileState.profile
    );

}


/* ================================================================
   46. AUTH EVENT CONNECTION
================================================================ */

function setupProfileAuthEvents() {

    if (
        !window.hokmAuth
    ) {

        return;

    }


    if (
        typeof window.hokmAuth.onSignIn === "function"
    ) {

        window.hokmAuth.onSignIn(
            async data => {

                profileState.user =
                    data?.user ||
                    profileGetCurrentUser();


                await loadProfileData();

            }
        );

    }


    if (
        typeof window.hokmAuth.onSignOut === "function"
    ) {

        window.hokmAuth.onSignOut(
            () => {

                profileState.user =
                    null;


                profileState.isGuest =
                    true;


                profileState.profile =
                    normalizeProfile(
                        loadLocalProfile() ||
                        createDefaultProfile()
                    );


                updateProfileUI();

            }
        );

    }


    if (
        typeof window.hokmAuth.onProfileUpdated === "function"
    ) {

        window.hokmAuth.onProfileUpdated(
            data => {

                if (
                    data
                ) {

                    profileState.profile =
                        normalizeProfile(
                            data,
                            profileState.user
                        );


                    saveLocalProfile(
                        profileState.profile
                    );


                    updateProfileUI();

                }

            }
        );

    }


    if (
        typeof window.hokmAuth.onAuthChange === "function"
    ) {

        window.hokmAuth.onAuthChange(
            async data => {

                if (
                    data?.user
                ) {

                    profileState.user =
                        data.user;

                    profileState.isGuest =
                        false;

                    await loadProfileData();

                } else {

                    profileState.user =
                        null;

                    profileState.isGuest =
                        true;

                    updateProfileUI();

                }

            }
        );

    }

}


/* ================================================================
   47. INITIALIZE PROFILE
================================================================ */

async function initializeProfile() {

    if (
        profileState.initialized
    ) {

        return profileState.profile;

    }


    try {

        profileState.loading =
            true;


        setupProfileUIEvents();


        setupProfileAuthEvents();


        await loadProfileData();


        profileState.initialized =
            true;


        emitProfileEvent(
            "initialized",
            profileState.profile
        );


        profileLog(
            "Profile system initialized successfully."
        );


        return profileState.profile;


    } catch (error) {

        profileError(
            "خطا در initializeProfile:",
            error
        );


        return profileState.profile;


    } finally {

        profileState.loading =
            false;

    }

}


/* ================================================================
   48. REFRESH PROFILE
================================================================ */

async function refreshProfile() {

    profileState.loading =
        true;


    try {

        const serverProfile =
            await loadProfileFromServer();


        if (
            serverProfile
        ) {

            profileState.profile =
                serverProfile;


            saveLocalProfile(
                profileState.profile
            );

        }


        updateProfileUI();


        emitProfileEvent(
            "refreshed",
            profileState.profile
        );


        return profileState.profile;


    } catch (error) {

        profileError(
            "خطا در refreshProfile:",
            error
        );


        return profileState.profile;


    } finally {

        profileState.loading =
            false;

    }

}


/* ================================================================
   49. GET FULL STATISTICS
================================================================ */

function getProfileStatistics() {

    const profile =
        profileState.profile ||
        createDefaultProfile();


    return {

        gamesPlayed:
            profileNumber(
                profile.games_played
            ),

        gamesWon:
            profileNumber(
                profile.games_won
            ),

        gamesLost:
            profileNumber(
                profile.games_lost
            ),

        totalTricks:
            profileNumber(
                profile.total_tricks
            ),

        winRate:
            calculateWinRate(
                profile
            ),

        winStreak:
            profileNumber(
                profile.win_streak
            ),

        bestWinStreak:
            profileNumber(
                profile.best_win_streak
            ),

        rating:
            profileNumber(
                profile.rating
            ),

        rank:
            profile.rank ||
            calculateRank(
                profile.rating
            ),

        level:
            profileNumber(
                profile.level,
                1
            ),

        experience:
            profileNumber(
                profile.experience
            ),

        coins:
            profileNumber(
                profile.coins
            )

    };

}


/* ================================================================
   50. RESET LOCAL PROFILE
================================================================ */

function resetLocalProfile() {

    try {

        localStorage.removeItem(
            "hokm_profile"
        );

        return true;

    } catch (error) {

        profileError(
            "خطا در حذف پروفایل محلی:",
            error
        );

        return false;

    }

}


/* ================================================================
   51. PROFILE PUBLIC API
================================================================ */

window.hokmProfile = {

    state:
        profileState,

    config:
        PROFILE_CONFIG,

    initialize:
        initializeProfile,

    load:
        loadProfileData,

    refresh:
        refreshProfile,

    updateUI:
        updateProfileUI,

    get:
        profileGetCurrentProfile,

    getUser:
        profileGetCurrentUser,

    getName:
        getProfileName,

    getAvatar:
        getProfileAvatar,

    getCoins:
        getProfileCoins,

    getLevel:
        getProfileLevel,

    getStatistics:
        getProfileStatistics,

    getLevelProgress:
        getLevelProgress,

    getWinRate:
        calculateWinRate,

    updateName:
        updateProfileName,

    updateAvatar:
        updateAvatar,

    updateStatistics:
        updateProfileStatistics,

    addExperience:
        addExperience,

    setCoins:
        setProfileCoins,

    openEditor:
        openProfileEditor,

    closeEditor:
        closeProfileEditor,

    saveEditor:
        saveProfileEditor,

    cancelEditor:
        cancelProfileEditor,

    openPanel:
        openProfilePanel,

    closePanel:
        closeProfilePanel,

    on:
        profileEvents.on.bind(
            profileEvents
        ),

    saveLocal:
        saveLocalProfile,

    loadLocal:
        loadLocalProfile

};


/* ================================================================
   52. GLOBAL SHORTCUTS
================================================================ */

window.initializeProfile =
    initializeProfile;


window.loadProfileData =
    loadProfileData;


window.updateProfileUI =
    updateProfileUI;


window.openProfileEditor =
    openProfileEditor;


window.closeProfileEditor =
    closeProfileEditor;


window.saveProfileEditor =
    saveProfileEditor;


window.updateProfileName =
    updateProfileName;


window.updateProfileAvatar =
    updateAvatar;


window.getProfileStatistics =
    getProfileStatistics;


window.addProfileExperience =
    addExperience;


window.getProfileCoins =
    getProfileCoins;


window.getProfileLevel =
    getProfileLevel;


window.getProfileName =
    getProfileName;


window.getProfileAvatar =
    getProfileAvatar;


/* ================================================================
   53. DOM READY
================================================================ */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            /*
             * کمی تأخیر برای اینکه
             * config.js و auth.js فرصت initialize شدن داشته باشند.
             */

            setTimeout(
                () => {

                    initializeProfile();

                },
                100
            );

        }
    );

} else {

    setTimeout(
        () => {

            initializeProfile();

        },
        100
    );

}


/* ================================================================
   END OF PROFILE.JS
====================================================================
*/
