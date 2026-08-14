"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * auth.js
 *
 * نسخه هماهنگ‌شده با database.sql
 *
 * امکانات:
 * - ثبت‌نام
 * - ورود
 * - خروج
 * - Session
 * - بررسی کاربر فعلی
 * - پروفایل
 * - ساخت/تکمیل پروفایل
 * - username
 * - display_name برای سازگاری با کدهای قبلی
 * - avatar
 * - coins
 * - level
 * - games_played
 * - games_won
 * - total_tricks
 * - experience
 * - وضعیت آنلاین
 * - آخرین زمان فعالیت
 * - تغییر نام
 * - تغییر رمز
 * - بازیابی رمز
 * - Auth State Listener
 * - هماهنگی با game.js
 * - Event System
 *
 * مهم:
 * این فایل هیچ قابلیت قبلی را حذف نمی‌کند.
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
     * بعضی نسخه‌های پروژه ممکن است Client را
     * مستقیماً داخل window.supabase قرار داده باشند.
     */

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


    off(eventName, callback) {

        if (
            !this.listeners[eventName]
        ) {
            return;
        }

        this.listeners[eventName] =
            this.listeners[eventName].filter(
                listener => listener !== callback
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
   5. CURRENT USER
================================================================ */

function getCurrentUser() {

    return authState.user;
}


/* ================================================================
   6. CURRENT SESSION
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
   8. CURRENT PROFILE
================================================================ */

function getCurrentProfile() {

    return authState.profile;
}


/* ================================================================
   9. DISPLAY NAME
================================================================ */

/*
 * دیتابیس از username استفاده می‌کند.
 *
 * برای سازگاری با فایل‌های قبلی پروژه:
 *
 * display_name
 *
 * همچنان در JavaScript پشتیبانی می‌شود.
 */

function getDisplayName(
    profile = authState.profile,
    user = authState.user
) {

    return (
        profile?.username ||
        profile?.display_name ||
        user?.user_metadata?.display_name ||
        user?.user_metadata?.username ||
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
   12. CREATE / ENSURE PROFILE
================================================================ */

/*
 * در database.sql یک Trigger وجود دارد:
 *
 * handle_new_user()
 *
 * که هنگام ثبت‌نام، پروفایل را خودکار می‌سازد.
 *
 * بنابراین این تابع ابتدا پروفایل را می‌خواند.
 *
 * اگر Trigger ساخته باشد:
 * همان پروفایل استفاده می‌شود.
 *
 * اگر به هر دلیل وجود نداشته باشد:
 * تلاش می‌کنیم آن را ایجاد کنیم.
 */

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


    const metadata =
        user.user_metadata || {};


    const username =
        String(
            extraData.username ||
            extraData.display_name ||
            metadata.username ||
            metadata.display_name ||
            "بازیکن"
        )
            .trim()
            .slice(0, 20);


    const profileData = {

        id:
            user.id,

        username:
            username || "بازیکن",

        avatar_url:
            extraData.avatar_url ||
            metadata.avatar_url ||
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
            ),

        is_online:
            true,

        last_seen:
            new Date().toISOString()
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
             * اگر Trigger قبلاً پروفایل را ساخته باشد،
             * خطای duplicate می‌گیریم.
             *
             * در این حالت فقط پروفایل را دوباره می‌خوانیم.
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
     * اول تلاش برای دریافت پروفایل
     */

    let profile =
        await loadProfile(
            user.id
        );


    /*
     * اگر وجود نداشت،
     * تلاش برای ساخت آن
     */

    if (!profile) {

        profile =
            await createProfile(
                user
            );
    }


    /*
     * اگر پروفایل وجود داشت،
     * وضعیت آنلاین را به‌روزرسانی می‌کنیم.
     */

    if (profile) {

        await updateOnlineStatus(
            true,
            false
        );
    }


    return profile;
}


/* ================================================================
   14. UPDATE ONLINE STATUS
================================================================ */

async function updateOnlineStatus(
    online = true,
    showMessage = false
) {

    const client =
        getSupabaseClient();

    if (
        !client ||
        !authState.user
    ) {
        return false;
    }


    try {

        const {
            data,
            error
        } = await client
            .from("profiles")
            .update({

                is_online:
                    Boolean(online),

                last_seen:
                    new Date().toISOString()

            })
            .eq(
                "id",
                authState.user.id
            )
            .select()
            .maybeSingle();


        if (error) {

            console.warn(
                "خطا در به‌روزرسانی وضعیت آنلاین:",
                error
            );

            return false;
        }


        if (data) {

            authState.profile =
                data;
        }


        if (
            showMessage
        ) {

            authToast(
                online
                    ? "آنلاین شدی."
                    : "وضعیت آفلاین شد.",
                online
                    ? "🟢"
                    : "⚪"
            );
        }


        return true;


    } catch (error) {

        console.error(
            "خطای updateOnlineStatus:",
            error
        );

        return false;
    }
}


/* ================================================================
   15. SIGN UP
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


    if (!isValidEmail(email)) {

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
         * username را داخل metadata می‌فرستیم
         * تا Trigger دیتابیس بتواند آن را دریافت کند.
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
         * اگر Session فوراً ساخته شده باشد،
         * پروفایل را می‌گیریم.
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
   16. SIGN IN
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


    if (!isValidEmail(email)) {

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


        authEvents.emit(
            "signin",
            data
        );


        updateAuthUI();


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
   17. SIGN OUT
================================================================ */

async function signOut() {

    const client =
        getSupabaseClient();


    if (!client) {
        return false;
    }


    try {

        /*
         * قبل از خروج وضعیت آنلاین را خاموش می‌کنیم.
         */

        await updateOnlineStatus(
            false,
            false
        );


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


        updateAuthUI();


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
   18. UPDATE PROFILE
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


    /*
     * username
     */

    if (
        updates.username !== undefined
    ) {

        const username =
            String(
                updates.username
            )
                .trim()
                .slice(0, 20);


        if (
            username.length < 2
        ) {

            authToast(
                "نام بازیکن معتبر نیست.",
                "⚠️"
            );

            return null;
        }


        allowedUpdates.username =
            username;
    }


    /*
     * display_name
     *
     * برای سازگاری با فایل‌های قبلی.
     *
     * در دیتابیس به username تبدیل می‌شود.
     */

    if (
        updates.display_name !== undefined
    ) {

        const displayName =
            String(
                updates.display_name
            )
                .trim()
                .slice(0, 20);


        if (
            displayName.length < 2
        ) {

            authToast(
                "نام بازیکن معتبر نیست.",
                "⚠️"
            );

            return null;
        }


        /*
         * اگر username قبلاً مشخص نشده،
         * display_name را به username تبدیل می‌کنیم.
         */

        if (
            allowedUpdates.username === undefined
        ) {

            allowedUpdates.username =
                displayName;
        }
    }


    /*
     * avatar
     */

    if (
        updates.avatar_url !== undefined
    ) {

        allowedUpdates.avatar_url =
            updates.avatar_url;
    }


    /*
     * فقط فیلدهایی که واقعاً مجاز هستند
     * به دیتابیس ارسال می‌شوند.
     *
     * coins و level و آمار بازی از این تابع
     * قابل تغییر مستقیم نیستند تا امنیت حفظ شود.
     */


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
   19. UPDATE DISPLAY NAME
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
   20. UPDATE USERNAME
================================================================ */

async function updateUsername(
    username
) {

    return await updateProfile({

        username

    });
}


/* ================================================================
   21. CHANGE PASSWORD
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
   22. RESET PASSWORD
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
   23. EMAIL VALIDATION
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
   24. AUTH ERROR TRANSLATION
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
            "already registered"
        )
    ) {

        return "این حساب قبلاً ثبت شده است.";
    }


    if (
        message.includes(
            "email address"
        ) &&
        message.includes(
            "invalid"
        )
    ) {

        return "ایمیل واردشده معتبر نیست.";
    }


    return (
        error?.message ||
        "خطایی در احراز هویت رخ داد."
    );
}


/* ================================================================
   25. AUTH STATE LISTENER
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
             * SIGNED_IN
             */

            if (
                authState.user
            ) {

                /*
                 * برای جلوگیری از مشکلات callback داخلی
                 * Supabase، عملیات دیتابیس را کمی بعد انجام می‌دهیم.
                 */

                setTimeout(
                    async () => {

                        await ensureProfile(
                            authState.user
                        );

                        updateAuthUI();

                        authEvents.emit(
                            "profileReady",
                            authState.profile
                        );

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
   26. UPDATE AUTH UI
================================================================ */

function updateAuthUI() {

    const loggedIn =
        isLoggedIn();


    /*
     * عناصر مخصوص کاربران واردشده
     */

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


    /*
     * عناصر مخصوص کاربران خارج‌شده
     */

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


    /*
     * نام کاربر
     */

    const userNameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );


    const name =
        getDisplayName();


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


            if (
                avatar &&
                element.tagName === "IMG"
            ) {

                element.src =
                    avatar;
            }

        }
    );


    /*
     * سکه
     */

    const coinElements =
        document.querySelectorAll(
            "[data-user-coins]"
        );


    coinElements.forEach(
        element => {

            element.textContent =
                Number(
                    authState.profile?.coins ?? 0
                ).toLocaleString("fa-IR");

        }
    );


    /*
     * سطح
     */

    const levelElements =
        document.querySelectorAll(
            "[data-user-level]"
        );


    levelElements.forEach(
        element => {

            element.textContent =
                Number(
                    authState.profile?.level ?? 1
                ).toLocaleString("fa-IR");

        }
    );


    /*
     * تعداد بازی
     */

    const gamesPlayedElements =
        document.querySelectorAll(
            "[data-games-played]"
        );


    gamesPlayedElements.forEach(
        element => {

            element.textContent =
                Number(
                    authState.profile?.games_played ?? 0
                ).toLocaleString("fa-IR");

        }
    );


    /*
     * تعداد برد
     */

    const gamesWonElements =
        document.querySelectorAll(
            "[data-games-won]"
        );


    gamesWonElements.forEach(
        element => {

            element.textContent =
                Number(
                    authState.profile?.games_won ?? 0
                ).toLocaleString("fa-IR");

        }
    );


    /*
     * تجربه
     */

    const experienceElements =
        document.querySelectorAll(
            "[data-user-experience]"
        );


    experienceElements.forEach(
        element => {

            element.textContent =
                Number(
                    authState.profile?.experience ?? 0
                ).toLocaleString("fa-IR");

        }
    );


    /*
     * هماهنگی با game.js
     */

    syncWithGameState();
}


/* ================================================================
   27. SYNC WITH GAME.JS
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
     * Name
     */

    const playerName =
        getDisplayName(
            profile,
            authState.user
        );


    if (
        playerName
    ) {

        window.state.player.name =
            playerName;
    }


    /*
     * Coins
     */

    if (
        profile.coins !== undefined
    ) {

        window.state.player.coins =
            Number(
                profile.coins
            );
    }


    /*
     * Level
     */

    if (
        profile.level !== undefined
    ) {

        window.state.player.level =
            Number(
                profile.level
            );
    }


    /*
     * Games played
     */

    if (
        profile.games_played !== undefined
    ) {

        window.state.player.gamesPlayed =
            Number(
                profile.games_played
            );
    }


    /*
     * Games won
     */

    if (
        profile.games_won !== undefined
    ) {

        window.state.player.gamesWon =
            Number(
                profile.games_won
            );
    }


    /*
     * Total tricks
     */

    if (
        profile.total_tricks !== undefined
    ) {

        window.state.player.totalTricks =
            Number(
                profile.total_tricks
            );
    }


    /*
     * Experience
     */

    if (
        profile.experience !== undefined
    ) {

        window.state.player.experience =
            Number(
                profile.experience
            );
    }


    /*
     * Avatar

     */

    if (
        profile.avatar_url !== undefined
    ) {

        window.state.player.avatar =
            profile.avatar_url;
    }


    /*
     * UI Update
     */

    if (
        typeof window.updatePlayerUI ===
        "function"
    ) {

        window.updatePlayerUI();
    }
}


/* ================================================================
   28. REFRESH PROFILE
================================================================ */

async function refreshProfile() {

    if (
        !authState.user
    ) {
        return null;
    }


    const profile =
        await loadProfile(
            authState.user.id
        );


    if (profile) {

        updateAuthUI();

        authEvents.emit(
            "profileUpdated",
            profile
        );
    }


    return profile;
}


/* ================================================================
   29. INITIALIZE AUTH
================================================================ */

async function initializeAuth() {

    if (
        authState.initialized
    ) {

        return authState;
    }


    const client =
        getSupabaseClient();


    if (!client) {

        console.warn(
            "Auth initialization متوقف شد چون Supabase Client پیدا نشد."
        );

        return authState;
    }


    try {

        authState.loading =
            true;


        /*
         * Session فعلی را دریافت می‌کنیم.
         */

        await loadAuthSession();


        /*
         * اگر کاربر وارد شده باشد،
         * پروفایلش را می‌گیریم.
         */

        if (
            authState.user
        ) {

            await ensureProfile(
                authState.user
            );
        }


        /*
         * Listener
         */

        setupAuthListener();


        /*
         * UI
         */

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


        return authState;


    } catch (error) {

        authState.loading =
            false;


        console.error(
            "خطا در initializeAuth:",
            error
        );


        return authState;
    }
}


/* ================================================================
   30. WAIT FOR AUTH
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
   31. AUTH EVENT HELPERS
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


function onProfileReady(
    callback
) {

    authEvents.on(
        "profileReady",
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


/* ================================================================
   32. PUBLIC API
================================================================ */

window.hokmAuth = {

    /*
     * Authentication
     */

    signUp,

    signIn,

    signOut,

    resetPassword,

    changePassword,


    /*
     * Profile
     */

    updateProfile,

    updateDisplayName,

    updateUsername,

    getCurrentUser,

    getCurrentSession,

    getCurrentProfile,

    getDisplayName,

    loadProfile,

    refreshProfile,

    ensureProfile,


    /*
     * Status
     */

    updateOnlineStatus,

    isLoggedIn,


    /*
     * Initialization
     */

    waitForAuth,

    initializeAuth,


    /*
     * Events
     */

    onAuthChange,

    onSignIn,

    onSignOut,

    onSignUp,

    onProfileUpdated,

    onProfileReady

};


/* ================================================================
   33. GLOBAL SHORTCUTS
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


window.updateUsername =
    updateUsername;


window.getCurrentUser =
    getCurrentUser;


window.getCurrentProfile =
    getCurrentProfile;


window.getCurrentSession =
    getCurrentSession;


window.getDisplayName =
    getDisplayName;


window.isLoggedIn =
    isLoggedIn;


/* ================================================================
   34. PAGE VISIBILITY
================================================================ */

/*
 * وقتی کاربر از صفحه خارج می‌شود،
 * last_seen به‌روزرسانی می‌شود.
 *
 * این بخش فقط برای هماهنگی وضعیت کاربر است
 * و هیچ قابلیت بازی را حذف نمی‌کند.
 */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !authState.user
        ) {
            return;
        }


        if (
            document.visibilityState ===
            "visible"
        ) {

            updateOnlineStatus(
                true,
                false
            );

        } else {

            updateOnlineStatus(
                false,
                false
            );
        }

    }
);


/* ================================================================
   35. BEFORE UNLOAD
================================================================ */

window.addEventListener(
    "beforeunload",
    () => {

        /*
         * این درخواست ممکن است همیشه قبل از بسته‌شدن
         * صفحه کامل نشود؛ بنابراین فقط به‌عنوان
         * تلاش برای ثبت آخرین وضعیت استفاده می‌شود.
         */

        if (
            authState.user
        ) {

            updateOnlineStatus(
                false,
                false
            );
        }

    }
);


/* ================================================================
   36. START
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
