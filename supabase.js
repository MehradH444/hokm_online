"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * supabase.js
 *
 * مرحله ۴
 * سیستم مرکزی اتصال به Supabase
 *
 * این فایل مسئول:
 *
 * - ساخت اتصال Supabase
 * - بررسی اتصال
 * - دسترسی مرکزی به Client
 * - مدیریت خطاهای اتصال
 * - تست ارتباط با Database
 *
 * توجه:
 * کلید anon/public برای Frontend قابل استفاده است.
 *
 * هرگز service_role key را داخل این فایل قرار نده.
 * ================================================================
 */


/* ================================================================
   1. SUPABASE CLIENT
================================================================ */

let supabaseClient = null;


/* ================================================================
   2. INITIALIZE SUPABASE
================================================================ */

function initializeSupabase() {

    /*
     * بررسی وجود کتابخانه Supabase
     */

    if (
        typeof window.supabase ===
        "undefined"
    ) {

        console.error(
            "Supabase library پیدا نشد."
        );

        showSupabaseError(
            "کتابخانه Supabase بارگذاری نشده است."
        );

        return false;
    }


    /*
     * بررسی Config
     */

    if (
        typeof SUPABASE_CONFIG ===
        "undefined"
    ) {

        console.error(
            "SUPABASE_CONFIG پیدا نشد."
        );

        showSupabaseError(
            "تنظیمات Supabase پیدا نشد."
        );

        return false;
    }


    /*
     * بررسی URL
     */

    if (
        !SUPABASE_CONFIG.url ||
        SUPABASE_CONFIG.url ===
        "YOUR_SUPABASE_URL"
    ) {

        console.error(
            "Supabase URL تنظیم نشده است."
        );

        showSupabaseError(
            "Supabase URL هنوز تنظیم نشده است."
        );

        return false;
    }


    /*
     * بررسی Anon Key
     */

    if (
        !SUPABASE_CONFIG.anonKey ||
        SUPABASE_CONFIG.anonKey ===
        "YOUR_SUPABASE_ANON_KEY"
    ) {

        console.error(
            "Supabase Anon Key تنظیم نشده است."
        );

        showSupabaseError(
            "Supabase Anon Key هنوز تنظیم نشده است."
        );

        return false;
    }


    /*
     * جلوگیری از ساخت Client تکراری
     */

    if (supabaseClient) {

        return true;
    }


    try {

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                }
            );


        console.log(
            "Supabase Client initialized successfully."
        );


        return true;

    } catch (error) {

        console.error(
            "خطا در ساخت Supabase Client:",
            error
        );

        showSupabaseError(
            "اتصال به Supabase ایجاد نشد."
        );

        return false;
    }
}


/* ================================================================
   3. GET SUPABASE CLIENT
================================================================ */

function getSupabase() {

    if (!supabaseClient) {

        const initialized =
            initializeSupabase();

        if (!initialized) {

            return null;
        }
    }

    return supabaseClient;
}


/* ================================================================
   4. CHECK CONNECTION
================================================================ */

async function checkSupabaseConnection() {

    const client =
        getSupabase();

    if (!client) {

        return {
            success: false,
            error: "Supabase Client در دسترس نیست."
        };
    }


    try {

        /*
         * به جای درخواست سنگین،
         * فقط وضعیت Session را بررسی می‌کنیم.
         */

        const {
            data,
            error
        } =
            await client.auth.getSession();


        if (error) {

            console.error(
                "Supabase connection error:",
                error
            );

            return {
                success: false,
                error
            };
        }


        console.log(
            "Supabase connection successful."
        );


        return {
            success: true,
            session:
                data?.session || null
        };

    } catch (error) {

        console.error(
            "خطا در بررسی Supabase:",
            error
        );

        return {
            success: false,
            error
        };
    }
}


/* ================================================================
   5. DATABASE CONNECTION TEST
================================================================ */

async function testSupabaseDatabase() {

    const client =
        getSupabase();

    if (!client) {

        return {
            success: false,
            error: "Supabase Client در دسترس نیست."
        };
    }


    try {

        /*
         * جدول profiles در مرحله database.sql
         * ساخته شده است.
         *
         * فقط یک رکورد را می‌خوانیم.
         */

        const {
            data,
            error
        } =
            await client
                .from("profiles")
                .select("id")
                .limit(1);


        if (error) {

            console.error(
                "Database test failed:",
                error
            );

            return {
                success: false,
                error
            };
        }


        console.log(
            "Supabase Database is working."
        );


        return {
            success: true,
            data
        };

    } catch (error) {

        console.error(
            "خطای Database:",
            error
        );

        return {
            success: false,
            error
        };
    }
}


/* ================================================================
   6. SUPABASE ERROR UI
================================================================ */

function showSupabaseError(
    message
) {

    /*
     * اگر سیستم Toast بازی وجود داشته باشد،
     * از همان استفاده می‌کنیم.
     */

    if (
        typeof showToast ===
        "function"
    ) {

        showToast(
            message,
            "⚠️",
            4000
        );

        return;
    }


    /*
     * در غیر این صورت Console
     */

    console.warn(
        "Supabase:",
        message
    );
}


/* ================================================================
   7. CONNECTION STATUS
================================================================ */

function setSupabaseStatus(
    connected
) {

    const statusElement =
        document.getElementById(
            "supabaseStatus"
        );

    if (!statusElement) {
        return;
    }


    if (connected) {

        statusElement.textContent =
            "متصل";

        statusElement.classList.remove(
            "offline"
        );

        statusElement.classList.add(
            "online"
        );

    } else {

        statusElement.textContent =
            "قطع";

        statusElement.classList.remove(
            "online"
        );

        statusElement.classList.add(
            "offline"
        );
    }
}


/* ================================================================
   8. INITIAL CONNECTION CHECK
================================================================ */

async function initializeSupabaseSystem() {

    console.log(
        "در حال اتصال به Supabase..."
    );


    const initialized =
        initializeSupabase();


    if (!initialized) {

        setSupabaseStatus(
            false
        );

        return false;
    }


    const connection =
        await checkSupabaseConnection();


    if (!connection.success) {

        setSupabaseStatus(
            false
        );

        console.error(
            "Supabase connection failed:",
            connection.error
        );

        return false;
    }


    setSupabaseStatus(
        true
    );


    console.log(
        "Supabase آماده است."
    );


    return true;
}


/* ================================================================
   9. GLOBAL HELPERS
================================================================ */

window.HokmSupabase = {

    getClient:
        getSupabase,

    initialize:
        initializeSupabase,

    checkConnection:
        checkSupabaseConnection,

    testDatabase:
        testSupabaseDatabase,

    isConnected:
        function () {
            return (
                supabaseClient !== null
            );
        }
};


/* ================================================================
   10. AUTO INITIALIZE
================================================================ */

async function startSupabase() {

    try {

        await initializeSupabaseSystem();

    } catch (error) {

        console.error(
            "خطا در راه‌اندازی Supabase:",
            error
        );

        setSupabaseStatus(
            false
        );
    }
}


/* ================================================================
   11. START AFTER DOM
================================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startSupabase
    );

} else {

    startSupabase();
}


/* ================================================================
   END
================================================================ */
