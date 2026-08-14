"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * auth.js
 *
 * مرحله ۵
 *
 * مسئولیت‌های این فایل:
 *
 * - ثبت‌نام کاربر
 * - ورود کاربر
 * - خروج کاربر
 * - بررسی نشست کاربر
 * - دریافت کاربر فعلی
 * - دریافت پروفایل
 * - ساخت پروفایل اولیه
 * - به‌روزرسانی پروفایل
 * - تغییر نام نمایشی
 * - تغییر رمز عبور
 * - بازیابی رمز عبور
 * - گوش دادن به تغییرات وضعیت احراز هویت
 *
 * وابستگی:
 *
 * config.js
 *
 * این فایل برای Supabase طراحی شده است.
 *
 * در این مرحله هنوز Multiplayer را وصل نمی‌کنیم.
 * اتصال Multiplayer در مرحله ۶ انجام می‌شود.
 * ================================================================
 */


/* ================================================================
   1. SUPABASE CLIENT
================================================================ */

/*
 * config.js باید قبل از auth.js بارگذاری شود.
 *
 * انتظار داریم config.js یکی از این موارد را در اختیار قرار دهد:
 *
 * window.supabaseClient
 *
 * یا
 *
 * window.supabase
 *
 * برای سازگاری بیشتر هر دو حالت پشتیبانی می‌شوند.
 */

function getSupabaseClient() {

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

    console.error(
        "Supabase client پیدا نشد. ابتدا config.js را بررسی کنید."
    );

    return null;
}


/* ================================================================
   2. AUTH STATE
================================================================ */

const authState = {

    initialized: false,

    loading: false,

    user: null,

    profile: null,

    session: null,

    loggedIn: false

};


/* ================================================================
   3. AUTH EVENTS
================================================================ */

const authEvents = {

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

    emit(eventName, data) {

        const listeners =
            this.listeners[eventName] || [];

        listeners.forEach(
            callback => {

                try {

                    callback(data);

                } catch (error) {

                    console.error(
                        `خطا در Auth Event: ${eventName}`,
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

function authToast(
    message,
    icon = "ℹ️",
    duration = 3000
) {

    if (
        typeof window.showToast ===
        "function"
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


function authLoading(
    show,
    message = "لطفاً صبر کنید..."
) {

    if (
        show &&
        typeof window.showLoading ===
        "function"
    ) {

        window.showLoading(
            message
        );

        return;
    }

    if (
        !show &&
        typeof window.hideLoading ===
        "function"
    ) {

        window.hideLoading();
    }
}


/* ================================================================
   5. GET CURRENT USER
================================================================ */

function getCurrentUser() {

    return authState.user;
}


/* ================================================================
   6. GET CURRENT SESSION
================================================================ */

function getCurrentSession() {

    return authState.session;
}


/* ================================================================
   7. IS LOGGED IN
================================================================ */

function isLoggedIn() {

    return (
        authState.loggedIn === true &&
        !!authState.user
    );
}


/* ================================================================
   8. GET PROFILE
================================================================ */

function getCurrentProfile() {

    return authState.profile;
}


/* ================================================================
   9. LOAD SESSION
================================================================ */

async function loadAuthSession() {

    const client =
        getSupabaseClient();

    if (!client) {
        return null;
    }

    try {

        const {
            data,
            error
        } = await client.auth.getSession();

        if (error) {

            console.error(
                "خطا در دریافت Session:",
                error
            );

            return null;
        }

        authState.session =
            data?.session || null;

        authState.user =
            data?.session?.user || null;

        authState.loggedIn =
            !!authState.user;

        return authState.session;

    } catch (error) {

        console.error(
            "خطا در loadAuthSession:",
            error
        );

        return null;
    }
}


/* ================================================================
   10. LOAD PROFILE
================================================================ */

async function loadProfile(
    userId = null
) {

    const client =
        getSupabaseClient();

    if (!client) {
        return null;
    }

    const id =
        userId ||
        authState.user?.id;

    if (!id) {

        authState.profile =
            null;

        return null;
    }

    try {

        const {
            data,
            error
        } = await client
            .from("profiles")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (error) {

            console.error(
                "خطا در دریافت پروفایل:",
                error
            );

            return null;
        }

        authState.profile =
            data || null;

        return data || null;

    } catch (error) {

        console.error(
            "خطا در loadProfile:",
            error
        );

        return null;
    }
}


/* ================================================================
   11. CREATE PROFILE
================================================================ */

async function createProfile(
    user,
    extraData = {}
) {

    const client =
        getSupabaseClient();

    if (!client || !user) {
        return null;
    }

    const defaultName =
        extraData.display_name ||
        user.user_metadata?.display_name ||
        user.user_metadata?.name ||
        "بازیکن مهمان";

    const profileData = {

        id:
            user.id,

        email:
            user.email || null,

        display_name:
            String(defaultName)
                .trim()
                .slice(0, 20),

        avatar_url:
            extraData.avatar_url ||
            user.user_metadata?.avatar_url ||
            null,

        coins:
            Number(
                extraData.coins ??
                1000
            ),

        level:
            Number(
                extraData.level ??
                1
            ),

        games_played:
            Number(
                extraData.games_played ??
                0
            ),

        games_won:
            Number(
                extraData.games_won ??
                0
            )

    };


    try {

        const {
            data,
            error
        } = await client
            .from("profiles")
            .insert(profileData)
            .select()
            .single();

        if (error) {

            /*
             * اگر پروفایل قبلاً وجود داشته باشد،
             * به جای خراب شدن سیستم آن را دوباره می‌خوانیم.
             */

            if (
                error.code === "23505"
            ) {

                return await loadProfile(
                    user.id
                );
            }

            console.error(
                "خطا در ساخت پروفایل:",
                error
            );

            return null;
        }

        authState.profile =
            data;

        return data;

    } catch (error) {

        console.error(
            "خطا در createProfile:",
            error
        );

        return null;
    }
}


/* ================================================================
   12. ENSURE PROFILE
================================================================ */

async function ensureProfile(
    user
) {

    if (!user) {
        return null;
    }

    let profile =
        await loadProfile(
            user.id
        );

    if (!profile) {

        profile =
            await createProfile(
                user
            );
    }

    return profile;
}


/* ================================================================
   13. SIGN UP
================================================================ */

async function signUp(
    email,
    password,
    displayName
) {

    const client =
        getSupabaseClient();

    if (!client) {

        authToast(
            "اتصال Supabase آماده نیست.",
            "⚠️"
        );

        return {
            success: false,
            error: "Supabase client not found"
        };
    }


    email =
        String(email || "")
            .trim()
            .toLowerCase();

    password =
        String(password || "");

    displayName =
        String(displayName || "")
            .trim();


    if (!email) {

        authToast(
            "ایمیل را وارد کنید.",
            "⚠️"
        );

        return {
            success: false,
            error: "EMAIL_REQUIRED"
        };
    }


    if (!isValidEmail(email)) {

        authToast(
            "فرمت ایمیل صحیح نیست.",
            "⚠️"
        );

        return {
            success: false,
            error: "INVALID_EMAIL"
        };
    }


    if (
        password.length < 6
    ) {

        authToast(
            "رمز عبور باید حداقل ۶ کاراکتر باشد.",
            "⚠️"
        );

        return {
            success: false,
            error: "WEAK_PASSWORD"
        };
    }


    if (
        displayName.length < 2
    ) {

        authToast(
            "نام بازیکن باید حداقل ۲ حرف باشد.",
            "⚠️"
        );

        return {
            success: false,
            error: "INVALID_NAME"
        };
    }


    try {

        authLoading(
            true,
            "در حال ساخت حساب..."
        );


        const {
            data,
            error
        } = await client.auth.signUp({

            email,

            password,

            options: {

                data: {

                    display_name:
                        displayName
                            .slice(0, 20)

                }

            }

        });


        authLoading(
            false
        );


        if (error) {

            console.error(
                "خطای ثبت‌نام:",
                error
            );

            authToast(
                translateAuthError(
                    error
                ),
                "❌",
                4000
            );

            return {
                success: false,
                error
            };
        }


        authState.user =
            data?.user || null;

        authState.session =
            data?.session || null;

        authState.loggedIn =
            !!authState.user;


        /*
         * اگر Supabase تأیید ایمیل نخواهد،
         * Session بلافاصله ساخته می‌شود.
         */

        if (
            data?.session &&
            data?.user
        ) {

            await ensureProfile(
                data.user
            );

        }


        /*
         * اگر تأیید ایمیل فعال باشد،
         * Session ممکن است null باشد.
         */

        if (
            data?.user &&
            !data?.session
        ) {

            authToast(
                "حساب ساخته شد. ایمیل خود را برای تأیید حساب بررسی کنید.",
                "📧",
                5000
            );

        } else {

            authToast(
                "حساب با موفقیت ساخته شد.",
                "🎉",
                3500
            );

        }


        authEvents.emit(
            "signup",
            data
        );


        return {

            success: true,

            user:
                data?.user || null,

            session:
                data?.session || null

        };


    } catch (error) {

        authLoading(
            false
        );

        console.error(
            "خطای غیرمنتظره ثبت‌نام:",
            error
        );

        authToast(
            "در ثبت‌نام مشکلی به وجود آمد.",
            "❌"
        );

        return {
            success: false,
            error
        };
    }
}


/* ================================================================
   14. SIGN IN
================================================================ */

async function signIn(
    email,
    password
) {

    const client =
        getSupabaseClient();

    if (!client) {

        authToast(
            "اتصال Supabase آماده نیست.",
            "⚠️"
        );

        return {
            success: false
        };
    }


    email =
        String(email || "")
            .trim()
            .toLowerCase();

    password =
        String(password || "");


    if (!email) {

        authToast(
            "ایمیل را وارد کنید.",
            "⚠️"
        );

        return {
            success: false,
            error: "EMAIL_REQUIRED"
        };
    }


    if (!isValidEmail(email)) {

        authToast(
            "ایمیل واردشده صحیح نیست.",
            "⚠️"
        );

        return {
            success: false,
            error: "INVALID_EMAIL"
        };
    }


    if (!password) {

        authToast(
            "رمز عبور را وارد کنید.",
            "⚠️"
        );

        return {
            success: false,
            error: "PASSWORD_REQUIRED"
        };
    }


    try {

        authLoading(
            true,
            "در حال ورود..."
        );


        const {
            data,
            error
        } = await client.auth.signInWithPassword({

            email,

            password

        });


        authLoading(
            false
        );


        if (error) {

            console.error(
                "خطای ورود:",
                error
            );

            authToast(
                translateAuthError(
                    error
                ),
                "❌",
                4000
            );

            return {
                success: false,
                error
            };
        }


        authState.user =
            data?.user || null;

        authState.session =
            data?.session || null;

        authState.loggedIn =
            !!authState.user;


        if (
            authState.user
        ) {

            await ensureProfile(
                authState.user
            );
        }


        authEvents.emit(
            "signin",
            data
        );


        authToast(
            "با موفقیت وارد شدی. خوش آمدی! 🎮",
            "👋",
            3500
        );


        return {

            success: true,

            user:
                data?.user || null,

            session:
                data?.session || null,

            profile:
                authState.profile

        };


    } catch (error) {

        authLoading(
            false
        );

        console.error(
            "خطای غیرمنتظره ورود:",
            error
        );

        authToast(
            "ورود انجام نشد.",
            "❌"
        );

        return {
            success: false,
            error
        };
    }
}


/* ================================================================
   15. SIGN OUT
================================================================ */

async function signOut() {

    const client =
        getSupabaseClient();

    if (!client) {
        return false;
    }


    try {

        authLoading(
            true,
            "در حال خروج..."
        );


        const {
            error
        } = await client.auth.signOut();


        authLoading(
            false
        );


        if (error) {

            console.error(
                "خطای خروج:",
                error
            );

            authToast(
                "خروج از حساب انجام نشد.",
                "❌"
            );

            return false;
        }


        authState.user =
            null;

        authState.session =
            null;

        authState.profile =
            null;

        authState.loggedIn =
            false;


        authEvents.emit(
            "signout",
            null
        );


        authToast(
            "با موفقیت از حساب خارج شدی.",
            "🚪"
        );


        return true;


    } catch (error) {

        authLoading(
            false
        );

        console.error(
            "خطای غیرمنتظره خروج:",
            error
        );

        return false;
    }
}


/* ================================================================
   16. UPDATE PROFILE
================================================================ */

async function updateProfile(
    updates = {}
) {

    const client =
        getSupabaseClient();

    if (
        !client ||
        !authState.user
    ) {

        authToast(
            "ابتدا وارد حساب شوید.",
            "⚠️"
        );

        return null;
    }


    const allowedUpdates = {};


    if (
        updates.display_name !==
        undefined
    ) {

        const name =
            String(
                updates.display_name
            )
                .trim()
                .slice(0, 20);


        if (
            name.length < 2
        ) {

            authToast(
                "نام بازیکن معتبر نیست.",
                "⚠️"
            );

            return null;
        }


        allowedUpdates.display_name =
            name;
    }


    if (
        updates.avatar_url !==
        undefined
    ) {

        allowedUpdates.avatar_url =
            updates.avatar_url;
    }


    if (
        Object.keys(
            allowedUpdates
        ).length === 0
    ) {

        return authState.profile;
    }


    try {

        const {
            data,
            error
        } = await client
            .from("profiles")
            .update(
                allowedUpdates
            )
            .eq(
                "id",
                authState.user.id
            )
            .select()
            .single();


        if (error) {

            console.error(
                "خطا در به‌روزرسانی پروفایل:",
                error
            );

            authToast(
                "ذخیره پروفایل انجام نشد.",
                "❌"
            );

            return null;
        }


        authState.profile =
            data;


        /*
         * اگر game.js از state.player استفاده کند،
         * در صورت وجود آن را هم هماهنگ می‌کنیم.
         */

        if (
            window.state &&
            window.state.player
        ) {

            if (
                data.display_name
            ) {

                window.state.player.name =
                    data.display_name;
            }

            if (
                data.coins !==
                undefined
            ) {

                window.state.player.coins =
                    data.coins;
            }

            if (
                data.level !==
                undefined
            ) {

                window.state.player.level =
                    data.level;
            }

            if (
                data.games_played !==
                undefined
            ) {

                window.state.player.gamesPlayed =
                    data.games_played;
            }

            if (
                data.games_won !==
                undefined
            ) {

                window.state.player.gamesWon =
                    data.games_won;
            }


            if (
                typeof window.updatePlayerUI ===
                "function"
            ) {

                window.updatePlayerUI();
            }
        }


        authEvents.emit(
            "profileUpdated",
            data
        );


        return data;


    } catch (error) {

        console.error(
            "خطای updateProfile:",
            error
        );

        return null;
    }
}


/* ================================================================
   17. UPDATE DISPLAY NAME
================================================================ */

async function updateDisplayName(
    name
) {

    return await updateProfile({

        display_name:
            name

    });
}


/* ================================================================
   18. CHANGE PASSWORD
================================================================ */

async function changePassword(
    newPassword
) {

    const client =
        getSupabaseClient();

    if (!client) {
        return false;
    }


    if (!authState.user) {

        authToast(
            "ابتدا وارد حساب شوید.",
            "⚠️"
        );

        return false;
    }


    newPassword =
        String(
            newPassword || ""
        );


    if (
        newPassword.length < 6
    ) {

        authToast(
            "رمز عبور باید حداقل ۶ کاراکتر باشد.",
            "⚠️"
        );

        return false;
    }


    try {

        authLoading(
            true,
            "در حال تغییر رمز عبور..."
        );


        const {
            error
        } = await client.auth.updateUser({

            password:
                newPassword

        });


        authLoading(
            false
        );


        if (error) {

            console.error(
                "خطا در تغییر رمز:",
                error
            );

            authToast(
                translateAuthError(
                    error
                ),
                "❌"
            );

            return false;
        }


        authToast(
            "رمز عبور با موفقیت تغییر کرد.",
            "🔐"
        );


        return true;


    } catch (error) {

        authLoading(
            false
        );

        console.error(
            "خطای changePassword:",
            error
        );

        return false;
    }
}


/* ================================================================
   19. RESET PASSWORD
================================================================ */

async function resetPassword(
    email
) {

    const client =
        getSupabaseClient();

    if (!client) {
        return false;
    }


    email =
        String(email || "")
            .trim()
            .toLowerCase();


    if (!isValidEmail(email)) {

        authToast(
            "یک ایمیل معتبر وارد کنید.",
            "⚠️"
        );

        return false;
    }


    try {

        authLoading(
            true,
            "در حال ارسال لینک بازیابی..."
        );


        const redirectUrl =
            `${window.location.origin}${window.location.pathname}`;


        const {
            error
        } = await client.auth.resetPasswordForEmail(

            email,

            {
                redirectTo:
                    redirectUrl
            }

        );


        authLoading(
            false
        );


        if (error) {

            console.error(
                "خطای بازیابی رمز:",
                error
            );

            authToast(
                translateAuthError(
                    error
                ),
                "❌"
            );

            return false;
        }


        authToast(
            "لینک بازیابی رمز به ایمیل شما ارسال شد.",
            "📧",
            5000
        );


        return true;


    } catch (error) {

        authLoading(
            false
        );

        console.error(
            "خطای resetPassword:",
            error
        );

        return false;
    }
}


/* ================================================================
   20. EMAIL VALIDATION
================================================================ */

function isValidEmail(
    email
) {

    const pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return pattern.test(
        String(email || "")
    );
}


/* ================================================================
   21. AUTH ERROR TRANSLATION
================================================================ */

function translateAuthError(
    error
) {

    const message =
        String(
            error?.message || ""
        )
            .toLowerCase();


    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return "ایمیل یا رمز عبور اشتباه است.";
    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return "ابتدا ایمیل خود را تأیید کنید.";
    }


    if (
        message.includes(
            "user already registered"
        )
    ) {

        return "این ایمیل قبلاً ثبت‌نام شده است.";
    }


    if (
        message.includes(
            "password should be at least"
        )
    ) {

        return "رمز عبور باید حداقل ۶ کاراکتر باشد.";
    }


    if (
        message.includes(
            "unable to validate email address"
        )
    ) {

        return "فرمت ایمیل صحیح نیست.";
    }


    if (
        message.includes(
            "rate limit"
        )
    ) {

        return "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.";
    }


    if (
        message.includes(
            "network"
        )
    ) {

        return "اتصال اینترنت را بررسی کنید.";
    }


    return (
        error?.message ||
        "خطایی در احراز هویت رخ داد."
    );
}


/* ================================================================
   22. AUTH STATE LISTENER
================================================================ */

function setupAuthListener() {

    const client =
        getSupabaseClient();

    if (!client) {
        return;
    }


    client.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {

            console.log(
                "Auth State Change:",
                event
            );


            authState.session =
                session || null;


            authState.user =
                session?.user || null;


            authState.loggedIn =
                !!authState.user;


            if (
                authState.user
            ) {

                /*
                 * برای جلوگیری از مشکلات
                 * callbackهای داخلی Supabase،
                 * دریافت پروفایل را کمی بعد انجام می‌دهیم.
                 */

                setTimeout(
                    async () => {

                        await ensureProfile(
                            authState.user
                        );

                        updateAuthUI();

                    },
                    0
                );

            } else {

                authState.profile =
                    null;

                updateAuthUI();
            }


            authEvents.emit(
                "authStateChanged",
                {

                    event,

                    session,

                    user:
                        authState.user

                }
            );

        }
    );
}


/* ================================================================
   23. AUTH UI
================================================================ */

function updateAuthUI() {

    const loggedIn =
        isLoggedIn();


    /*
     * عناصر عمومی
     */

    const loggedInElements =
        document.querySelectorAll(
            "[data-auth='logged-in']"
        );


    const loggedOutElements =
        document.querySelectorAll(
            "[data-auth='logged-out']"
        );


    loggedInElements.forEach(
        element => {

            element.style.display =
                loggedIn
                    ? ""
                    : "none";

        }
    );


    loggedOutElements.forEach(
        element => {

            element.style.display =
                loggedIn
                    ? "none"
                    : "";

        }
    );


    /*
     * نام کاربر
     */

    const userNameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );


    const name =
        authState.profile?.display_name ||
        authState.user?.user_metadata?.display_name ||
        "بازیکن";


    userNameElements.forEach(
        element => {

            element.textContent =
                name;

        }
    );


    /*
     * ایمیل
     */

    const userEmailElements =
        document.querySelectorAll(
            "[data-user-email]"
        );


    userEmailElements.forEach(
        element => {

            element.textContent =
                authState.user?.email ||
                "";

        }
    );


    /*
     * آواتار
     */

    const avatarElements =
        document.querySelectorAll(
            "[data-user-avatar]"
        );


    avatarElements.forEach(
        element => {

            const avatar =
                authState.profile?.avatar_url ||
                authState.user?.user_metadata?.avatar_url;


            if (avatar) {

                if (
                    element.tagName ===
                    "IMG"
                ) {

                    element.src =
                        avatar;

                }

            }

        }
    );


    /*
     * اگر game.js وجود داشته باشد،
     * اطلاعات بازیکن را هماهنگ می‌کنیم.
     */

    syncWithGameState();
}


/* ================================================================
   24. SYNC WITH GAME.JS
================================================================ */

function syncWithGameState() {

    if (
        !authState.profile
    ) {
        return;
    }


    if (
        !window.state ||
        !window.state.player
    ) {
        return;
    }


    const profile =
        authState.profile;


    if (
        profile.display_name
    ) {

        window.state.player.name =
            profile.display_name;
    }


    if (
        profile.coins !==
        undefined
    ) {

        window.state.player.coins =
            Number(
                profile.coins
            );
    }


    if (
        profile.level !==
        undefined
    ) {

        window.state.player.level =
            Number(
                profile.level
            );
    }


    if (
        profile.games_played !==
        undefined
    ) {

        window.state.player.gamesPlayed =
            Number(
                profile.games_played
            );
    }


    if (
        profile.games_won !==
        undefined
    ) {

        window.state.player.gamesWon =
            Number(
                profile.games_won
            );
    }


    if (
        typeof window.updatePlayerUI ===
        "function"
    ) {

        window.updatePlayerUI();
    }
}


/* ================================================================
   25. INITIALIZE AUTH
================================================================ */

async function initializeAuth() {

    if (
        authState.initialized
    ) {

        return;
    }


    const client =
        getSupabaseClient();


    if (!client) {

        console.warn(
            "Auth initialization متوقف شد چون Supabase Client پیدا نشد."
        );

        return;
    }


    try {

        authState.loading =
            true;


        await loadAuthSession();


        if (
            authState.user
        ) {

            await ensureProfile(
                authState.user
            );
        }


        setupAuthListener();


        updateAuthUI();


        authState.initialized =
            true;


        authState.loading =
            false;


        authEvents.emit(
            "initialized",
            {

                user:
                    authState.user,

                session:
                    authState.session,

                profile:
                    authState.profile

            }
        );


        console.log(
            "Hokm Online Auth initialized successfully."
        );


    } catch (error) {

        authState.loading =
            false;

        console.error(
            "خطا در initializeAuth:",
            error
        );
    }
}


/* ================================================================
   26. WAIT FOR AUTH
================================================================ */

function waitForAuth() {

    return new Promise(
        resolve => {

            if (
                authState.initialized
            ) {

                resolve(
                    authState
                );

                return;
            }


            authEvents.on(
                "initialized",
                () => {

                    resolve(
                        authState
                    );

                }
            );

        }
    );
}


/* ================================================================
   27. AUTH EVENT HELPERS
================================================================ */

function onAuthChange(
    callback
) {

    authEvents.on(
        "authStateChanged",
        callback
    );
}


function onSignIn(
    callback
) {

    authEvents.on(
        "signin",
        callback
    );
}


function onSignOut(
    callback
) {

    authEvents.on(
        "signout",
        callback
    );
}


function onProfileUpdated(
    callback
) {

    authEvents.on(
        "profileUpdated",
        callback
    );
}


/* ================================================================
   28. PUBLIC API
================================================================ */

/*
 * همه توابع مهم را روی window قرار می‌دهیم
 * تا game.js، index.html و فایل‌های بعدی بتوانند
 * به آنها دسترسی داشته باشند.
 */

window.hokmAuth = {

    signUp,

    signIn,

    signOut,

    resetPassword,

    changePassword,

    updateProfile,

    updateDisplayName,

    getCurrentUser,

    getCurrentSession,

    getCurrentProfile,

    isLoggedIn,

    loadProfile,

    ensureProfile,

    waitForAuth,

    onAuthChange,

    onSignIn,

    onSignOut,

    onProfileUpdated,

    initializeAuth

};


/* ================================================================
   29. GLOBAL SHORTCUTS
================================================================ */

/*
 * این‌ها برای راحتی فایل‌های بعدی هستند.
 */

window.signUp =
    signUp;

window.signIn =
    signIn;

window.signOut =
    signOut;

window.resetPassword =
    resetPassword;

window.getCurrentUser =
    getCurrentUser;

window.getCurrentProfile =
    getCurrentProfile;

window.isLoggedIn =
    isLoggedIn;


/* ================================================================
   30. START
================================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAuth
    );

} else {

    initializeAuth();
}


/* ================================================================
   END OF AUTH.JS
================================================================ */
