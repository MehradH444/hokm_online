"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * auth.js
 *
 * نسخه کامل و اصلاح‌شده
 *
 * مسئولیت‌ها:
 *
 * - ثبت‌نام
 * - ورود
 * - خروج
 * - بررسی Session
 * - دریافت User
 * - دریافت Profile
 * - ساخت Profile
 * - اطمینان از وجود Profile
 * - به‌روزرسانی Profile
 * - تغییر نام نمایشی
 * - تغییر رمز عبور
 * - بازیابی رمز عبور
 * - Auth State Listener
 * - هماهنگی با game.js
 * - هماهنگی username / display_name
 * - مدیریت رویدادهای Auth
 *
 * سازگار با:
 *
 * config.js
 * database.sql
 * Supabase
 *
 * ================================================================
 */


/* ================================================================
   1. SUPABASE CLIENT
================================================================ */

function getSupabaseClient() {

    if (
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function"
    ) {

        return window.supabaseClient;
    }


    /*
     * توجه:
     *
     * window.supabase ممکن است خود کتابخانه Supabase باشد
     * و ممکن است Client نباشد.
     *
     * فقط زمانی آن را Client در نظر می‌گیریم که
     * متد from وجود داشته باشد.
     */

    if (
        window.supabase &&
        typeof window.supabase.from === "function"
    ) {

        return window.supabase;
    }


    console.error(
        "Supabase client پیدا نشد. ابتدا config.js و Supabase را بررسی کنید."
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


function authLoading(
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
   8. GET CURRENT PROFILE
================================================================ */

function getCurrentProfile() {

    return authState.profile;
}


/* ================================================================
   9. GET PROFILE NAME
================================================================ */

/*
 * database.sql فعلاً username دارد.
 *
 * برای سازگاری با بخش‌های مختلف Frontend،
 * هم username و هم display_name را پشتیبانی می‌کنیم.
 */

function getProfileDisplayName(
    profile = null
) {

    const data =
        profile ||
        authState.profile;


    if (!data) {

        return (
            authState.user?.user_metadata?.display_name ||
            authState.user?.user_metadata?.username ||
            "بازیکن"
        );
    }


    return (
        data.display_name ||
        data.username ||
        authState.user?.user_metadata?.display_name ||
        authState.user?.user_metadata?.username ||
        "بازیکن"
    );
}


/* ================================================================
   10. LOAD SESSION
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
   11. LOAD PROFILE
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
            .eq(
                "id",
                id
            )
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
   12. CREATE PROFILE
================================================================ */

async function createProfile(
    user,
    extraData = {}
) {

    const client =
        getSupabaseClient();


    if (
        !client ||
        !user
    ) {

        return null;
    }


    /*
     * نام پیش‌فرض
     */

    const defaultName =
        extraData.display_name ||
        extraData.username ||
        user.user_metadata?.display_name ||
        user.user_metadata?.username ||
        user.user_metadata?.name ||
        "بازیکن";


    const safeName =
        String(defaultName)
            .trim()
            .slice(0, 20) ||
        "بازیکن";


    /*
     * database.sql از username استفاده می‌کند.
     *
     * بنابراین اطلاعات را با username ذخیره می‌کنیم.
     */

    const profileData = {

        id:
            user.id,

        username:
            safeName,

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
            ),

        total_tricks:
            Number(
                extraData.total_tricks ??
                0
            ),

        experience:
            Number(
                extraData.experience ??
                0
            )

    };


    try {

        const {
            data,
            error
        } = await client
            .from("profiles")
            .insert(
                profileData
            )
            .select()
            .single();


        if (error) {

            /*
             * اگر Trigger دیتابیس قبلاً Profile ساخته باشد،
             * خطای duplicate می‌گیریم.
             *
             * در این حالت Profile را دوباره می‌خوانیم.
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
   13. ENSURE PROFILE
================================================================ */

async function ensureProfile(
    user
) {

    if (!user) {

        return null;
    }


    /*
     * اول Profile موجود را پیدا می‌کنیم.
     */

    let profile =
        await loadProfile(
            user.id
        );


    /*
     * اگر وجود نداشت،
     * آن را می‌سازیم.
     */

    if (!profile) {

        profile =
            await createProfile(
                user
            );
    }


    return profile;
}


/* ================================================================
   14. SIGN UP
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

            error:
                "Supabase client not found"

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


    /* ------------------------------------------------------------
       Validation
    ------------------------------------------------------------ */

    if (!email) {

        authToast(
            "ایمیل را وارد کنید.",
            "⚠️"
        );


        return {

            success: false,

            error:
                "EMAIL_REQUIRED"

        };
    }


    if (
        !isValidEmail(email)
    ) {

        authToast(
            "فرمت ایمیل صحیح نیست.",
            "⚠️"
        );


        return {

            success: false,

            error:
                "INVALID_EMAIL"

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

            error:
                "WEAK_PASSWORD"

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

            error:
                "INVALID_NAME"

        };
    }


    try {

        authLoading(
            true,
            "در حال ساخت حساب..."
        );


        /*
         * هر دو نام را داخل metadata قرار می‌دهیم.
         *
         * database.sql فعلی username را می‌خواند.
         *
         * auth.js و UI نیز display_name را می‌شناسند.
         */

        const {
            data,
            error
        } = await client.auth.signUp({

            email,

            password,

            options: {

                data: {

                    username:
                        displayName
                            .slice(0, 20),

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
         * اگر Session بلافاصله ساخته شده باشد،
         * Profile را بررسی می‌کنیم.
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


        updateAuthUI();


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
   15. SIGN IN
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

            success: false,

            error:
                "Supabase client not found"

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

            error:
                "EMAIL_REQUIRED"

        };
    }


    if (
        !isValidEmail(email)
    ) {

        authToast(
            "ایمیل واردشده صحیح نیست.",
            "⚠️"
        );


        return {

            success: false,

            error:
                "INVALID_EMAIL"

        };
    }


    if (!password) {

        authToast(
            "رمز عبور را وارد کنید.",
            "⚠️"
        );


        return {

            success: false,

            error:
                "PASSWORD_REQUIRED"

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


        updateAuthUI();


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
   16. SIGN OUT
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


        updateAuthUI();


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
   17. UPDATE PROFILE
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


    /* ------------------------------------------------------------
       DISPLAY NAME
    ------------------------------------------------------------ */

    if (
        updates.display_name !== undefined ||
        updates.username !== undefined
    ) {

        const rawName =
            updates.display_name !== undefined
                ? updates.display_name
                : updates.username;


        const name =
            String(
                rawName || ""
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


        /*
         * database.sql:
         *
         * username
         */

        allowedUpdates.username =
            name;
    }


    /* ------------------------------------------------------------
       AVATAR
    ------------------------------------------------------------ */

    if (
        updates.avatar_url !== undefined
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
         * هماهنگ‌سازی با game.js
         */

        syncWithGameState();


        updateAuthUI();


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
   18. UPDATE DISPLAY NAME
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
   19. CHANGE PASSWORD
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
   20. RESET PASSWORD
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


    if (
        !isValidEmail(email)
    ) {

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


        /*
         * از config.js استفاده می‌کنیم
         * اگر تنظیمات موجود باشند.
         */

        let redirectUrl =
            `${window.location.origin}${window.location.pathname}`;


        if (
            window.HOKM_SUPABASE_CONFIG &&
            window.HOKM_SUPABASE_CONFIG.passwordResetPath
        ) {

            redirectUrl =
                `${window.location.origin}${window.HOKM_SUPABASE_CONFIG.passwordResetPath}`;
        }


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
   21. EMAIL VALIDATION
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
   22. AUTH ERROR TRANSLATION
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


    if (
        message.includes(
            "fetch"
        )
    ) {

        return "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.";
    }


    if (
        message.includes(
            "duplicate"
        )
    ) {

        return "این اطلاعات قبلاً ثبت شده است.";
    }


    return (
        error?.message ||
        "خطایی در احراز هویت رخ داد."
    );
}


/* ================================================================
   23. AUTH STATE LISTENER
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


            /*
             * SIGNED_OUT
             */

            if (
                !authState.user
            ) {

                authState.profile =
                    null;


                updateAuthUI();


                authEvents.emit(
                    "authStateChanged",
                    {

                        event,

                        session,

                        user: null

                    }
                );


                return;
            }


            /*
             * SIGNED_IN / TOKEN_REFRESHED /
             * USER_UPDATED و سایر وضعیت‌ها
             *
             * برای جلوگیری از مشکلات callback داخلی
             * Supabase، دریافت Profile را با setTimeout
             * انجام می‌دهیم.
             */

            const userId =
                authState.user.id;


            setTimeout(
                async () => {

                    /*
                     * ممکن است در فاصله اجرای callback
                     * کاربر Logout کرده باشد.
                     */

                    if (
                        !authState.user ||
                        authState.user.id !== userId
                    ) {

                        return;
                    }


                    await ensureProfile(
                        authState.user
                    );


                    updateAuthUI();


                },
                0
            );


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
   24. AUTH UI
================================================================ */

function updateAuthUI() {

    const loggedIn =
        isLoggedIn();


    /* ------------------------------------------------------------
       Logged In Elements
    ------------------------------------------------------------ */

    const loggedInElements =
        document.querySelectorAll(
            "[data-auth='logged-in']"
        );


    loggedInElements.forEach(
        element => {

            element.style.display =
                loggedIn
                    ? ""
                    : "none";

        }
    );


    /* ------------------------------------------------------------
       Logged Out Elements
    ------------------------------------------------------------ */

    const loggedOutElements =
        document.querySelectorAll(
            "[data-auth='logged-out']"
        );


    loggedOutElements.forEach(
        element => {

            element.style.display =
                loggedIn
                    ? "none"
                    : "";

        }
    );


    /* ------------------------------------------------------------
       USER NAME
    ------------------------------------------------------------ */

    const userNameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );


    const name =
        getProfileDisplayName();


    userNameElements.forEach(
        element => {

            element.textContent =
                name;

        }
    );


    /* ------------------------------------------------------------
       EMAIL
    ------------------------------------------------------------ */

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


    /* ------------------------------------------------------------
       AVATAR
    ------------------------------------------------------------ */

    const avatarElements =
        document.querySelectorAll(
            "[data-user-avatar]"
        );


    avatarElements.forEach(
        element => {

            const avatar =
                authState.profile?.avatar_url ||
                authState.user?.user_metadata?.avatar_url;


            if (
                avatar &&
                element.tagName === "IMG"
            ) {

                element.src =
                    avatar;
            }

        }
    );


    /* ------------------------------------------------------------
       COINS
    ------------------------------------------------------------ */

    const coinElements =
        document.querySelectorAll(
            "[data-user-coins]"
        );


    coinElements.forEach(
        element => {

            const coins =
                authState.profile?.coins;


            if (
                coins !== undefined &&
                coins !== null
            ) {

                element.textContent =
                    Number(coins).toLocaleString(
                        "fa-IR"
                    );
            }

        }
    );


    /* ------------------------------------------------------------
       LEVEL
    ------------------------------------------------------------ */

    const levelElements =
        document.querySelectorAll(
            "[data-user-level]"
        );


    levelElements.forEach(
        element => {

            const level =
                authState.profile?.level;


            if (
                level !== undefined &&
                level !== null
            ) {

                element.textContent =
                    Number(level).toLocaleString(
                        "fa-IR"
                    );
            }

        }
    );


    /*
     * هماهنگی با game.js
     */

    syncWithGameState();
}


/* ================================================================
   25. SYNC WITH GAME.JS
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


    /*
     * database.sql:
     *
     * username
     */

    const playerName =
        profile.display_name ||
        profile.username;


    if (
        playerName
    ) {

        window.state.player.name =
            playerName;
    }


    if (
        profile.coins !== undefined
    ) {

        window.state.player.coins =
            Number(
                profile.coins
            );
    }


    if (
        profile.level !== undefined
    ) {

        window.state.player.level =
            Number(
                profile.level
            );
    }


    if (
        profile.games_played !== undefined
    ) {

        window.state.player.gamesPlayed =
            Number(
                profile.games_played
            );
    }


    if (
        profile.games_won !== undefined
    ) {

        window.state.player.gamesWon =
            Number(
                profile.games_won
            );
    }


    if (
        profile.total_tricks !== undefined
    ) {

        window.state.player.totalTricks =
            Number(
                profile.total_tricks
            );
    }


    if (
        profile.experience !== undefined
    ) {

        window.state.player.experience =
            Number(
                profile.experience
            );
    }


    if (
        typeof window.updatePlayerUI === "function"
    ) {

        window.updatePlayerUI();
    }
}


/* ================================================================
   26. INITIALIZE AUTH
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


        /*
         * توجه:
         *
         * اینجا initialized را true نمی‌کنیم،
         * چون ممکن است config.js کمی بعد Client را بسازد.
         */

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
   27. WAIT FOR AUTH
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
   28. AUTH EVENT HELPERS
================================================================ */

function onAuthChange(
    callback
) {

    authEvents.on(
        "authStateChanged",
        callback
    );
}


function onSignUp(
    callback
) {

    authEvents.on(
        "signup",
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
   29. PUBLIC API
================================================================ */

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

    getProfileDisplayName,

    isLoggedIn,

    loadProfile,

    ensureProfile,

    waitForAuth,

    onAuthChange,

    onSignUp,

    onSignIn,

    onSignOut,

    onProfileUpdated,

    initializeAuth

};


/* ================================================================
   30. GLOBAL SHORTCUTS
================================================================ */

window.signUp =
    signUp;


window.signIn =
    signIn;


window.signOut =
    signOut;


window.resetPassword =
    resetPassword;


window.changePassword =
    changePassword;


window.updateProfile =
    updateProfile;


window.updateDisplayName =
    updateDisplayName;


window.getCurrentUser =
    getCurrentUser;


window.getCurrentSession =
    getCurrentSession;


window.getCurrentProfile =
    getCurrentProfile;


window.getProfileDisplayName =
    getProfileDisplayName;


window.isLoggedIn =
    isLoggedIn;


/* ================================================================
   31. START AUTH
================================================================ */

/*
 * config.js باید قبل از auth.js بارگذاری شده باشد.
 *
 * اگر Supabase Client در لحظه اول آماده نباشد،
 * چند بار برای پیدا کردن آن تلاش می‌کنیم.
 */

function startAuthInitialization() {

    if (
        authState.initialized
    ) {

        return;
    }


    if (
        getSupabaseClient()
    ) {

        initializeAuth();

        return;
    }


    /*
     * تلاش مجدد برای شرایطی که
     * کتابخانه یا config کمی دیرتر بارگذاری شده است.
     */

    let attempts =
        0;


    const maxAttempts =
        20;


    const retryTimer =
        setInterval(
            () => {

                attempts++;


                if (
                    authState.initialized
                ) {

                    clearInterval(
                        retryTimer
                    );

                    return;
                }


                if (
                    getSupabaseClient()
                ) {

                    clearInterval(
                        retryTimer
                    );


                    initializeAuth();

                    return;
                }


                if (
                    attempts >= maxAttempts
                ) {

                    clearInterval(
                        retryTimer
                    );


                    console.warn(
                        "Supabase Client بعد از تلاش‌های متعدد پیدا نشد."
                    );
                }

            },
            500
        );
}


/* ================================================================
   32. DOM READY
================================================================ */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startAuthInitialization
    );

} else {

    startAuthInitialization();
}


/* ================================================================
   END OF AUTH.JS
================================================================ */
