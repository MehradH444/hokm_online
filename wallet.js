"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * wallet.js
 *
 * FILE 7 / 12
 *
 * سیستم کامل کیف پول و سکه مجازی
 *
 * امکانات:
 *
 * - موجودی سکه بازیکن
 * - موجودی اولیه 3000 سکه
 * - هزینه ورود به بازی = 400 سکه
 * - شارژ سکه
 * - خرید بسته‌های سکه
 * - بسته 200 سکه = 25,000 تومان
 * - بسته 600 سکه = 40,000 تومان
 * - بسته 1200 سکه = 80,000 تومان
 * - تاریخچه تراکنش‌ها
 * - ثبت تراکنش در Supabase
 * - جلوگیری از کسر دوباره هزینه بازی
 * - جلوگیری از ثبت دوباره تراکنش
 * - همگام‌سازی با Profile
 * - همگام‌سازی با game.js
 * - همگام‌سازی با shop.js
 * - بروزرسانی UI
 * - Event System
 * - قفل تراکنش
 * - مدیریت خطا
 * - پشتیبانی Offline در حد رابط کاربری
 *
 * توجه:
 *
 * پرداخت واقعی اینترنتی باید بعداً به درگاه پرداخت متصل شود.
 * این فایل به‌تنهایی پرداخت واقعی انجام نمی‌دهد.
 *
 * ================================================================
 */


/* ================================================================
   1. CONFIGURATION
================================================================ */

const WALLET_CONFIG = {

    INITIAL_COINS: 3000,

    GAME_ENTRY_FEE: 400,

    MIN_BALANCE_FOR_GAME: 400,

    MAX_TRANSACTION_AMOUNT: 1000000000,

    TRANSACTION_HISTORY_LIMIT: 100,

    PACKAGES: {

        SMALL: {

            id: "coins_200",

            coins: 200,

            price: 25000,

            title: "بسته ۲۰۰ سکه",

            description:
                "۲۰۰ سکه مجازی"

        },

        MEDIUM: {

            id: "coins_600",

            coins: 600,

            price: 40000,

            title: "بسته ۶۰۰ سکه",

            description:
                "۶۰۰ سکه مجازی"

        },

        LARGE: {

            id: "coins_1200",

            coins: 1200,

            price: 80000,

            title: "بسته ۱۲۰۰ سکه",

            description:
                "۱۲۰۰ سکه مجازی"

        }

    }

};


/* ================================================================
   2. WALLET STATE
================================================================ */

const walletState = {

    initialized: false,

    loading: false,

    processing: false,

    balance: 0,

    transactions: [],

    lastTransaction: null,

    pendingGamePayment: null,

    userId: null,

    profile: null,

    online: false

};


/* ================================================================
   3. WALLET EVENTS
================================================================ */

const walletEvents = {

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
                        "Wallet Event Error:",
                        eventName,
                        error
                    );

                }

            }
        );

    }

};


/* ================================================================
   4. SUPABASE CLIENT
================================================================ */

function walletGetSupabaseClient() {

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
   5. TOAST
================================================================ */

function walletToast(
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


/* ================================================================
   6. LOADING
================================================================ */

function walletLoading(
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
   7. GET CURRENT USER
================================================================ */

function walletGetCurrentUser() {

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
   8. GET CURRENT PROFILE
================================================================ */

function walletGetCurrentProfile() {

    if (
        typeof window.getCurrentProfile === "function"
    ) {

        return window.getCurrentProfile();
    }


    if (
        window.hokmAuth &&
        typeof window.hokmAuth.getCurrentProfile === "function"
    ) {

        return window.hokmAuth.getCurrentProfile();
    }


    return null;
}


/* ================================================================
   9. NORMALIZE NUMBER
================================================================ */

function walletNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return fallback;
    }


    return number;
}


/* ================================================================
   10. FORMAT COINS
================================================================ */

function formatWalletCoins(
    amount
) {

    return walletNumber(
        amount
    ).toLocaleString(
        "fa-IR"
    );
}


/* ================================================================
   11. FORMAT PRICE
================================================================ */

function formatWalletPrice(
    price
) {

    return walletNumber(
        price
    ).toLocaleString(
        "fa-IR"
    ) + " تومان";
}


/* ================================================================
   12. GENERATE TRANSACTION ID
================================================================ */

function generateWalletTransactionId() {

    return (
        "TX-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 10)
            .toUpperCase()
    );

}


/* ================================================================
   13. GET BALANCE
================================================================ */

function getWalletBalance() {

    return walletNumber(
        walletState.balance
    );

}


/* ================================================================
   14. HAS ENOUGH COINS
================================================================ */

function hasEnoughCoins(
    amount
) {

    const required =
        walletNumber(
            amount
        );


    return (
        getWalletBalance() >= required
    );

}


/* ================================================================
   15. SET BALANCE
================================================================ */

function setWalletBalance(
    amount
) {

    amount =
        Math.max(
            0,
            Math.floor(
                walletNumber(
                    amount
                )
            )
        );


    walletState.balance =
        amount;


    updateWalletUI();

    syncWalletWithGameState();

    return amount;

}


/* ================================================================
   16. LOAD BALANCE FROM PROFILE
================================================================ */

async function loadWalletBalance() {

    const profile =
        walletGetCurrentProfile();


    const user =
        walletGetCurrentUser();


    if (
        profile
    ) {

        walletState.profile =
            profile;

        walletState.userId =
            profile.id ||
            user?.id ||
            null;

        walletState.balance =
            Math.max(
                0,
                walletNumber(
                    profile.coins,
                    WALLET_CONFIG.INITIAL_COINS
                )
            );


        walletState.online =
            !!user;


        updateWalletUI();

        syncWalletWithGameState();

        return walletState.balance;
    }


    /*
     * اگر Profile هنوز وجود نداشته باشد،
     * موجودی اولیه بازی استفاده می‌شود.
     */

    if (
        user
    ) {

        walletState.userId =
            user.id;

        walletState.online =
            true;
    }


    if (
        walletState.balance <= 0
    ) {

        walletState.balance =
            WALLET_CONFIG.INITIAL_COINS;
    }


    updateWalletUI();

    syncWalletWithGameState();


    return walletState.balance;

}


/* ================================================================
   17. ENSURE INITIAL COINS
================================================================ */

async function ensureInitialWalletCoins() {

    const profile =
        walletGetCurrentProfile();


    if (
        profile &&
        profile.coins !== undefined &&
        profile.coins !== null
    ) {

        walletState.balance =
            Math.max(
                0,
                walletNumber(
                    profile.coins
                )
            );


        updateWalletUI();

        syncWalletWithGameState();


        return walletState.balance;
    }


    /*
     * بازیکن جدید:
     *
     * موجودی اولیه = 3000
     */

    if (
        walletState.balance <= 0
    ) {

        walletState.balance =
            WALLET_CONFIG.INITIAL_COINS;
    }


    updateWalletUI();

    syncWalletWithGameState();


    return walletState.balance;

}


/* ================================================================
   18. UPDATE PROFILE COINS
================================================================ */

async function updateProfileCoins(
    newBalance
) {

    const client =
        walletGetSupabaseClient();


    const user =
        walletGetCurrentUser();


    newBalance =
        Math.max(
            0,
            Math.floor(
                walletNumber(
                    newBalance
                )
            )
        );


    /*
     * اگر Supabase یا User آماده نباشد،
     * وضعیت محلی حفظ می‌شود.
     */

    if (
        !client ||
        !user
    ) {

        walletState.balance =
            newBalance;


        updateWalletUI();

        syncWalletWithGameState();


        return {

            success: true,

            balance:
                newBalance,

            offline:
                true

        };

    }


    try {

        const {
            data,
            error
        } = await client
            .from("profiles")
            .update({

                coins:
                    newBalance

            })
            .eq(
                "id",
                user.id
            )
            .select()
            .single();


        if (error) {

            console.error(
                "Wallet profile update error:",
                error
            );


            return {

                success: false,

                error

            };

        }


        walletState.balance =
            walletNumber(
                data?.coins,
                newBalance
            );


        walletState.profile =
            data;


        updateWalletUI();

        syncWalletWithGameState();


        return {

            success: true,

            balance:
                walletState.balance,

            profile:
                data

        };


    } catch (error) {

        console.error(
            "updateProfileCoins error:",
            error
        );


        return {

            success: false,

            error

        };

    }

}


/* ================================================================
   19. ADD COINS
================================================================ */

async function addCoins(
    amount,
    reason = "شارژ سکه",
    metadata = {}
) {

    amount =
        Math.floor(
            walletNumber(
                amount
            )
        );


    if (
        amount <= 0
    ) {

        return {

            success: false,

            error:
                "INVALID_AMOUNT"

        };

    }


    if (
        amount >
        WALLET_CONFIG.MAX_TRANSACTION_AMOUNT
    ) {

        return {

            success: false,

            error:
                "AMOUNT_TOO_LARGE"

        };

    }


    if (
        walletState.processing
    ) {

        walletToast(
            "یک تراکنش دیگر در حال انجام است.",
            "⏳"
        );


        return {

            success: false,

            error:
                "TRANSACTION_IN_PROGRESS"

        };

    }


    walletState.processing =
        true;


    try {

        const oldBalance =
            getWalletBalance();


        const newBalance =
            oldBalance +
            amount;


        const updateResult =
            await updateProfileCoins(
                newBalance
            );


        if (
            !updateResult.success
        ) {

            return updateResult;
        }


        const transaction =
            await createWalletTransaction({

                type:
                    "credit",

                amount,

                balance_before:
                    oldBalance,

                balance_after:
                    newBalance,

                reason,

                metadata

            });


        walletState.lastTransaction =
            transaction;


        walletEvents.emit(
            "coinsAdded",
            {

                amount,

                oldBalance,

                newBalance,

                transaction

            }
        );


        updateWalletUI();

        syncWalletWithGameState();


        return {

            success: true,

            amount,

            balance:
                newBalance,

            transaction

        };


    } finally {

        walletState.processing =
            false;

    }

}


/* ================================================================
   20. REMOVE COINS
================================================================ */

async function removeCoins(
    amount,
    reason = "هزینه",
    metadata = {}
) {

    amount =
        Math.floor(
            walletNumber(
                amount
            )
        );


    if (
        amount <= 0
    ) {

        return {

            success: false,

            error:
                "INVALID_AMOUNT"

        };

    }


    if (
        !hasEnoughCoins(
            amount
        )
    ) {

        walletToast(
            "سکه کافی نداری.",
            "🪙",
            3500
        );


        walletEvents.emit(
            "insufficientCoins",
            {

                required:
                    amount,

                balance:
                    getWalletBalance()

            }
        );


        return {

            success: false,

            error:
                "INSUFFICIENT_COINS",

            required:
                amount,

            balance:
                getWalletBalance()

        };

    }


    if (
        walletState.processing
    ) {

        walletToast(
            "یک تراکنش دیگر در حال انجام است.",
            "⏳"
        );


        return {

            success: false,

            error:
                "TRANSACTION_IN_PROGRESS"

        };

    }


    walletState.processing =
        true;


    try {

        const oldBalance =
            getWalletBalance();


        const newBalance =
            oldBalance -
            amount;


        const updateResult =
            await updateProfileCoins(
                newBalance
            );


        if (
            !updateResult.success
        ) {

            return updateResult;
        }


        const transaction =
            await createWalletTransaction({

                type:
                    "debit",

                amount,

                balance_before:
                    oldBalance,

                balance_after:
                    newBalance,

                reason,

                metadata

            });


        walletState.lastTransaction =
            transaction;


        walletEvents.emit(
            "coinsRemoved",
            {

                amount,

                oldBalance,

                newBalance,

                transaction

            }
        );


        updateWalletUI();

        syncWalletWithGameState();


        return {

            success: true,

            amount,

            balance:
                newBalance,

            transaction

        };


    } finally {

        walletState.processing =
            false;

    }

}


/* ================================================================
   21. PAY GAME ENTRY FEE
================================================================ */

async function payGameEntryFee(
    metadata = {}
) {

    const fee =
        WALLET_CONFIG.GAME_ENTRY_FEE;


    /*
     * جلوگیری از پرداخت دوباره برای یک بازی
     */

    const gameId =
        metadata.gameId ||
        metadata.roomId ||
        null;


    if (
        gameId &&
        walletState.pendingGamePayment === gameId
    ) {

        return {

            success: true,

            alreadyPaid: true,

            balance:
                getWalletBalance()

        };

    }


    if (
        !hasEnoughCoins(
            fee
        )
    ) {

        walletToast(
            `برای بازی حداقل ${formatWalletCoins(fee)} سکه لازم داری.`,
            "🪙",
            4000
        );


        walletEvents.emit(
            "gamePaymentFailed",
            {

                reason:
                    "INSUFFICIENT_COINS",

                required:
                    fee,

                balance:
                    getWalletBalance()

            }
        );


        return {

            success: false,

            error:
                "INSUFFICIENT_COINS",

            required:
                fee,

            balance:
                getWalletBalance()

        };

    }


    const result =
        await removeCoins(

            fee,

            "هزینه ورود به بازی",

            {

                ...metadata,

                gameEntry:
                    true

            }

        );


    if (
        result.success
    ) {

        if (
            gameId
        ) {

            walletState.pendingGamePayment =
                gameId;
        }


        walletEvents.emit(
            "gameEntryPaid",
            {

                fee,

                balance:
                    result.balance,

                gameId,

                transaction:
                    result.transaction

            }
        );


        walletToast(
            `${formatWalletCoins(fee)} سکه بابت ورود به بازی پرداخت شد.`,
            "🎮",
            3000
        );

    }


    return result;

}


/* ================================================================
   22. REFUND GAME ENTRY FEE
================================================================ */

async function refundGameEntryFee(
    metadata = {}
) {

    const fee =
        WALLET_CONFIG.GAME_ENTRY_FEE;


    const result =
        await addCoins(

            fee,

            "بازگشت هزینه ورود به بازی",

            {

                ...metadata,

                refund:
                    true

            }

        );


    if (
        result.success
    ) {

        walletState.pendingGamePayment =
            null;


        walletToast(
            `${formatWalletCoins(fee)} سکه به کیف پول بازگشت داده شد.`,
            "↩️"
        );

    }


    return result;

}


/* ================================================================
   23. CREATE TRANSACTION
================================================================ */

async function createWalletTransaction(
    transactionData = {}
) {

    const client =
        walletGetSupabaseClient();


    const user =
        walletGetCurrentUser();


    const transaction = {

        id:
            generateWalletTransactionId(),

        user_id:
            user?.id || null,

        type:
            transactionData.type ||
            "unknown",

        amount:
            walletNumber(
                transactionData.amount
            ),

        balance_before:
            walletNumber(
                transactionData.balance_before
            ),

        balance_after:
            walletNumber(
                transactionData.balance_after
            ),

        reason:
            transactionData.reason ||
            "",

        metadata:
            transactionData.metadata ||
            {},

        created_at:
            new Date().toISOString()

    };


    /*
     * ذخیره در دیتابیس
     *
     * اگر جدول transactions موجود باشد،
     * تراکنش ذخیره می‌شود.
     *
     * اگر جدول موجود نباشد،
     * عملیات اصلی کیف پول متوقف نمی‌شود.
     */

    if (
        client &&
        user
    ) {

        try {

            const {
                error
            } = await client
                .from("wallet_transactions")
                .insert({

                    id:
                        transaction.id,

                    user_id:
                        user.id,

                    type:
                        transaction.type,

                    amount:
                        transaction.amount,

                    balance_before:
                        transaction.balance_before,

                    balance_after:
                        transaction.balance_after,

                    reason:
                        transaction.reason,

                    metadata:
                        transaction.metadata,

                    created_at:
                        transaction.created_at

                });


            if (error) {

                console.warn(
                    "Wallet transaction database warning:",
                    error
                );

            }

        } catch (error) {

            console.warn(
                "Wallet transaction save warning:",
                error
            );

        }

    }


    walletState.transactions.unshift(
        transaction
    );


    if (
        walletState.transactions.length >
        WALLET_CONFIG.TRANSACTION_HISTORY_LIMIT
    ) {

        walletState.transactions =
            walletState.transactions.slice(
                0,
                WALLET_CONFIG.TRANSACTION_HISTORY_LIMIT
            );

    }


    walletEvents.emit(
        "transactionCreated",
        transaction
    );


    return transaction;

}


/* ================================================================
   24. LOAD TRANSACTIONS
================================================================ */

async function loadWalletTransactions(
    limit =
        WALLET_CONFIG.TRANSACTION_HISTORY_LIMIT
) {

    const client =
        walletGetSupabaseClient();


    const user =
        walletGetCurrentUser();


    if (
        !client ||
        !user
    ) {

        return walletState.transactions;

    }


    try {

        const {
            data,
            error
        } = await client
            .from("wallet_transactions")
            .select("*")
            .eq(
                "user_id",
                user.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(
                limit
            );


        if (error) {

            console.warn(
                "خطا در دریافت تراکنش‌های کیف پول:",
                error
            );


            return walletState.transactions;

        }


        walletState.transactions =
            Array.isArray(data)
                ? data
                : [];


        updateWalletUI();


        return walletState.transactions;


    } catch (error) {

        console.warn(
            "loadWalletTransactions error:",
            error
        );


        return walletState.transactions;

    }

}


/* ================================================================
   25. GET TRANSACTIONS
================================================================ */

function getWalletTransactions() {

    return [
        ...walletState.transactions
    ];

}


/* ================================================================
   26. GET COIN PACKAGES
================================================================ */

function getCoinPackages() {

    return [

        {
            ...WALLET_CONFIG.PACKAGES.SMALL
        },

        {
            ...WALLET_CONFIG.PACKAGES.MEDIUM
        },

        {
            ...WALLET_CONFIG.PACKAGES.LARGE
        }

    ];

}


/* ================================================================
   27. GET PACKAGE
================================================================ */

function getCoinPackage(
    packageId
) {

    const packages =
        getCoinPackages();


    return (
        packages.find(
            item =>
                item.id === packageId
        ) ||
        null
    );

}


/* ================================================================
   28. START COIN PURCHASE
================================================================ */

async function startCoinPurchase(
    packageId
) {

    const packageData =
        getCoinPackage(
            packageId
        );


    if (
        !packageData
    ) {

        walletToast(
            "بسته سکه پیدا نشد.",
            "❌"
        );


        return {

            success: false,

            error:
                "PACKAGE_NOT_FOUND"

        };

    }


    /*
     * این مرحله فقط سفارش خرید را آماده می‌کند.
     *
     * پرداخت واقعی باید توسط Backend و درگاه
     * تأیید شود.
     */

    const order = {

        orderId:
            "ORDER-" +
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 8)
                .toUpperCase(),

        packageId:
            packageData.id,

        coins:
            packageData.coins,

        price:
            packageData.price,

        status:
            "pending",

        createdAt:
            new Date().toISOString()

    };


    walletState.lastTransaction =
        order;


    walletEvents.emit(
        "purchaseStarted",
        order
    );


    return {

        success: true,

        order

    };

}


/* ================================================================
   29. CONFIRM COIN PURCHASE
================================================================ */

/*
 * این تابع فقط زمانی باید از Backend/درگاه
 * بعد از تأیید واقعی پرداخت فراخوانی شود.
 */

async function confirmCoinPurchase(
    order
) {

    if (
        !order ||
        !order.packageId
    ) {

        return {

            success: false,

            error:
                "INVALID_ORDER"

        };

    }


    const packageData =
        getCoinPackage(
            order.packageId
        );


    if (
        !packageData
    ) {

        return {

            success: false,

            error:
                "PACKAGE_NOT_FOUND"

        };

    }


    /*
     * تطبیق مبلغ سفارش
     */

    if (
        walletNumber(order.price) !==
        packageData.price
    ) {

        return {

            success: false,

            error:
                "INVALID_PRICE"

        };

    }


    /*
     * تطبیق تعداد سکه
     */

    if (
        walletNumber(order.coins) !==
        packageData.coins
    ) {

        return {

            success: false,

            error:
                "INVALID_COIN_AMOUNT"

        };

    }


    const result =
        await addCoins(

            packageData.coins,

            `خرید ${packageData.title}`,

            {

                purchase:
                    true,

                packageId:
                    packageData.id,

                orderId:
                    order.orderId ||

                    null,

                price:
                    packageData.price

            }

        );


    if (
        result.success
    ) {

        walletEvents.emit(
            "purchaseCompleted",
            {

                order,

                package:
                    packageData,

                result

            }
        );


        walletToast(
            `${formatWalletCoins(packageData.coins)} سکه به حساب شما اضافه شد.`,
            "🎉",
            4000
        );

    }


    return result;

}


/* ================================================================
   30. CHECK GAME ENTRY
================================================================ */

function canStartGame() {

    return hasEnoughCoins(
        WALLET_CONFIG.GAME_ENTRY_FEE
    );

}


/* ================================================================
   31. GET GAME ENTRY FEE
================================================================ */

function getGameEntryFee() {

    return WALLET_CONFIG.GAME_ENTRY_FEE;

}


/* ================================================================
   32. UPDATE WALLET UI
================================================================ */

function updateWalletUI() {

    const balance =
        getWalletBalance();


    /* ------------------------------------------------------------
       Balance Elements
    ------------------------------------------------------------ */

    const balanceElements =
        document.querySelectorAll(
            "[data-wallet-balance]"
        );


    balanceElements.forEach(
        element => {

            element.textContent =
                formatWalletCoins(
                    balance
                );

        }
    );


    /* ------------------------------------------------------------
       Coin Elements
    ------------------------------------------------------------ */

    const coinElements =
        document.querySelectorAll(
            "[data-user-coins]"
        );


    coinElements.forEach(
        element => {

            element.textContent =
                formatWalletCoins(
                    balance
                );

        }
    );


    /* ------------------------------------------------------------
       Game Entry Fee
    ------------------------------------------------------------ */

    const feeElements =
        document.querySelectorAll(
            "[data-game-entry-fee]"
        );


    feeElements.forEach(
        element => {

            element.textContent =
                formatWalletCoins(
                    WALLET_CONFIG.GAME_ENTRY_FEE
                );

        }
    );


    /* ------------------------------------------------------------
       Remaining Coins
    ------------------------------------------------------------ */

    const remainingElements =
        document.querySelectorAll(
            "[data-wallet-remaining]"
        );


    remainingElements.forEach(
        element => {

            element.textContent =
                formatWalletCoins(
                    balance
                );

        }
    );


    /* ------------------------------------------------------------
       Can Start Game
    ------------------------------------------------------------ */

    const gameButtons =
        document.querySelectorAll(
            "[data-start-game]"
        );


    gameButtons.forEach(
        button => {

            const canPlay =
                canStartGame();


            button.disabled =
                !canPlay;


            button.classList.toggle(
                "disabled",
                !canPlay
            );

        }
    );


    /*
     * Custom wallet event
     */

    walletEvents.emit(
        "balanceUpdated",
        {

            balance

        }
    );

}


/* ================================================================
   33. SYNC WITH GAME.JS
================================================================ */

function syncWalletWithGameState() {

    if (
        !window.state
    ) {

        return;
    }


    if (
        !window.state.player
    ) {

        return;
    }


    window.state.player.coins =
        getWalletBalance();


    /*
     * اگر game.js تابع بروزرسانی داشته باشد،
     * آن را اجرا می‌کنیم.
     */

    if (
        typeof window.updatePlayerUI === "function"
    ) {

        try {

            window.updatePlayerUI();

        } catch (error) {

            console.warn(
                "updatePlayerUI wallet sync warning:",
                error
            );

        }

    }


    /*
     * بعضی نسخه‌های game.js ممکن است
     * از walletBalance استفاده کنند.
     */

    window.state.walletBalance =
        getWalletBalance();

}


/* ================================================================
   34. HANDLE INSUFFICIENT COINS
================================================================ */

function handleInsufficientCoins(
    required =
        WALLET_CONFIG.GAME_ENTRY_FEE
) {

    const balance =
        getWalletBalance();


    walletToast(
        `سکه کافی نیست. ${formatWalletCoins(required)} سکه لازم داری و موجودی تو ${formatWalletCoins(balance)} است.`,
        "🪙",
        4500
    );


    /*
     * اگر Shop موجود باشد،
     * کاربر را به فروشگاه هدایت می‌کنیم.
     */

    if (
        typeof window.openShop === "function"
    ) {

        setTimeout(
            () => {

                try {

                    window.openShop(
                        "coins"
                    );

                } catch (error) {

                    console.warn(
                        "openShop error:",
                        error
                    );

                }

            },
            300
        );

    }


    walletEvents.emit(
        "openCoinShop",
        {

            required,

            balance

        }
    );

}


/* ================================================================
   35. WALLET BUTTON HANDLER
================================================================ */

function setupWalletButtons() {

    /*
     * خرید بسته سکه
     */

    document.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "[data-buy-coins]"
                );


            if (
                !button
            ) {

                return;
            }


            event.preventDefault();


            const packageId =
                button.getAttribute(
                    "data-buy-coins"
                );


            const result =
                await startCoinPurchase(
                    packageId
                );


            if (
                !result.success
            ) {

                return;
            }


            /*
             * اگر سیستم پرداخت خارجی
             * بعداً نصب شود، این Event
             * نقطه اتصال آن خواهد بود.
             */

            walletEvents.emit(
                "paymentRequired",
                result.order
            );


            walletToast(
                "سفارش خرید آماده شد. پرداخت واقعی باید از طریق درگاه تأیید شود.",
                "💳",
                4000
            );

        }
    );


    /*
     * دکمه شروع بازی
     */

    document.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "[data-start-paid-game]"
                );


            if (
                !button
            ) {

                return;
            }


            event.preventDefault();


            const gameId =
                button.getAttribute(
                    "data-game-id"
                ) ||
                null;


            if (
                !canStartGame()
            ) {

                handleInsufficientCoins();

                return;
            }


            const result =
                await payGameEntryFee({

                    gameId

                });


            if (
                !result.success
            ) {

                return;
            }


            /*
             * بعد از پرداخت موفق،
             * اجازه شروع بازی داده می‌شود.
             */

            walletEvents.emit(
                "gameReady",
                {

                    gameId,

                    balance:
                        result.balance

                }
            );


            if (
                typeof window.startGameAfterPayment ===
                "function"
            ) {

                window.startGameAfterPayment(
                    gameId
                );

            }

        }
    );

}


/* ================================================================
   36. WALLET DISPLAY TRANSACTIONS
================================================================ */

function renderWalletTransactions(
    container = null
) {

    const target =
        container ||
        document.querySelector(
            "[data-wallet-transactions]"
        );


    if (
        !target
    ) {

        return;
    }


    target.innerHTML = "";


    if (
        walletState.transactions.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "wallet-empty";


        empty.textContent =
            "هنوز تراکنشی ثبت نشده است.";


        target.appendChild(
            empty
        );


        return;
    }


    walletState.transactions.forEach(
        transaction => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "wallet-transaction";


            const isCredit =
                transaction.type ===
                "credit";


            item.innerHTML = `

                <div class="wallet-transaction-main">

                    <div class="wallet-transaction-title">

                        ${
                            isCredit
                                ? "➕"
                                : "➖"
                        }

                        ${
                            escapeWalletHTML(
                                transaction.reason ||
                                "تراکنش"
                            )
                        }

                    </div>

                    <div class="wallet-transaction-date">

                        ${
                            formatWalletDate(
                                transaction.created_at
                            )
                        }

                    </div>

                </div>

                <div
                    class="wallet-transaction-amount ${
                        isCredit
                            ? "credit"
                            : "debit"
                    }"
                >

                    ${
                        isCredit
                            ? "+"
                            : "-"
                    }

                    ${formatWalletCoins(
                        transaction.amount
                    )}

                    🪙

                </div>

            `;


            target.appendChild(
                item
            );

        }
    );

}


/* ================================================================
   37. ESCAPE HTML
================================================================ */

function escapeWalletHTML(
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
   38. FORMAT DATE
================================================================ */

function formatWalletDate(
    date
) {

    if (
        !date
    ) {

        return "";
    }


    try {

        return new Date(
            date
        ).toLocaleString(
            "fa-IR",
            {

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        );

    } catch (error) {

        return "";

    }

}


/* ================================================================
   39. RENDER COIN PACKAGES
================================================================ */

function renderCoinPackages(
    container = null
) {

    const target =
        container ||
        document.querySelector(
            "[data-coin-packages]"
        );


    if (
        !target
    ) {

        return;
    }


    target.innerHTML = "";


    const packages =
        getCoinPackages();


    packages.forEach(
        packageData => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "coin-package-card";


            card.innerHTML = `

                <div class="coin-package-icon">
                    🪙
                </div>

                <div class="coin-package-title">

                    ${
                        escapeWalletHTML(
                            packageData.title
                        )
                    }

                </div>

                <div class="coin-package-coins">

                    ${formatWalletCoins(
                        packageData.coins
                    )}

                    سکه

                </div>

                <div class="coin-package-price">

                    ${formatWalletPrice(
                        packageData.price
                    )}

                </div>

                <button
                    type="button"
                    class="coin-package-buy"
                    data-buy-coins="${
                        escapeWalletHTML(
                            packageData.id
                        )
                    }"
                >

                    خرید سکه

                </button>

            `;


            target.appendChild(
                card
            );

        }
    );

}


/* ================================================================
   40. INITIALIZE WALLET
================================================================ */

async function initializeWallet() {

    if (
        walletState.initialized
    ) {

        return walletState;
    }


    if (
        walletState.loading
    ) {

        return walletState;
    }


    walletState.loading =
        true;


    try {

        const user =
            walletGetCurrentUser();


        const profile =
            walletGetCurrentProfile();


        walletState.userId =
            user?.id ||
            profile?.id ||
            null;


        walletState.profile =
            profile ||
            null;


        walletState.online =
            !!user;


        await ensureInitialWalletCoins();


        await loadWalletTransactions();


        updateWalletUI();

        renderWalletTransactions();

        renderCoinPackages();

        syncWalletWithGameState();


        walletState.initialized =
            true;


        walletEvents.emit(
            "initialized",
            {

                balance:
                    walletState.balance,

                userId:
                    walletState.userId

            }
        );


        console.log(
            "Hokm Online Wallet initialized successfully."
        );


    } catch (error) {

        console.error(
            "Wallet initialization error:",
            error
        );

    } finally {

        walletState.loading =
            false;

    }


    return walletState;

}


/* ================================================================
   41. RESET WALLET STATE
================================================================ */

function resetWalletState() {

    walletState.initialized =
        false;

    walletState.loading =
        false;

    walletState.processing =
        false;

    walletState.balance =
        0;

    walletState.transactions =
        [];

    walletState.lastTransaction =
        null;

    walletState.pendingGamePayment =
        null;

    walletState.userId =
        null;

    walletState.profile =
        null;

    walletState.online =
        false;


    updateWalletUI();

}


/* ================================================================
   42. AUTH INTEGRATION
================================================================ */

function setupWalletAuthIntegration() {

    /*
     * وقتی کاربر وارد می‌شود،
     * کیف پول دوباره بارگذاری می‌شود.
     */

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.onSignIn ===
        "function"
    ) {

        window.hokmAuth.onSignIn(
            async data => {

                walletState.initialized =
                    false;


                walletState.profile =
                    data?.profile ||
                    null;


                walletState.userId =
                    data?.user?.id ||
                    null;


                await initializeWallet();

            }
        );

    }


    /*
     * ثبت‌نام
     */

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.onSignUp ===
        "function"
    ) {

        window.hokmAuth.onSignUp(
            async data => {

                walletState.initialized =
                    false;


                walletState.profile =
                    data?.profile ||
                    null;


                walletState.userId =
                    data?.user?.id ||
                    null;


                await initializeWallet();

            }
        );

    }


    /*
     * خروج
     */

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.onSignOut ===
        "function"
    ) {

        window.hokmAuth.onSignOut(
            () => {

                resetWalletState();

            }
        );

    }


    /*
     * تغییر Profile
     */

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.onProfileUpdated ===
        "function"
    ) {

        window.hokmAuth.onProfileUpdated(
            async profile => {

                if (
                    !profile
                ) {

                    return;
                }


                walletState.profile =
                    profile;


                walletState.userId =
                    profile.id ||
                    walletState.userId;


                if (
                    profile.coins !== undefined
                ) {

                    walletState.balance =
                        Math.max(
                            0,
                            walletNumber(
                                profile.coins
                            )
                        );

                }


                updateWalletUI();

                syncWalletWithGameState();

            }
        );

    }

}


/* ================================================================
   43. WALLET PUBLIC EVENTS
================================================================ */

function onWalletChange(
    callback
) {

    walletEvents.on(
        "balanceUpdated",
        callback
    );

}


function onCoinsAdded(
    callback
) {

    walletEvents.on(
        "coinsAdded",
        callback
    );

}


function onCoinsRemoved(
    callback
) {

    walletEvents.on(
        "coinsRemoved",
        callback
    );

}


function onGameEntryPaid(
    callback
) {

    walletEvents.on(
        "gameEntryPaid",
        callback
    );

}


function onInsufficientCoins(
    callback
) {

    walletEvents.on(
        "insufficientCoins",
        callback
    );

}


function onPurchaseStarted(
    callback
) {

    walletEvents.on(
        "purchaseStarted",
        callback
    );

}


function onPurchaseCompleted(
    callback
) {

    walletEvents.on(
        "purchaseCompleted",
        callback
    );

}


/* ================================================================
   44. PUBLIC API
================================================================ */

window.hokmWallet = {

    initializeWallet,

    getBalance:
        getWalletBalance,

    getWalletBalance,

    setBalance:
        setWalletBalance,

    addCoins,

    removeCoins,

    hasEnoughCoins,

    canStartGame,

    getGameEntryFee,

    payGameEntryFee,

    refundGameEntryFee,

    getCoinPackages,

    getCoinPackage,

    startCoinPurchase,

    confirmCoinPurchase,

    getTransactions:
        getWalletTransactions,

    loadTransactions:
        loadWalletTransactions,

    updateUI:
        updateWalletUI,

    renderTransactions:
        renderWalletTransactions,

    renderPackages:
        renderCoinPackages,

    onWalletChange,

    onCoinsAdded,

    onCoinsRemoved,

    onGameEntryPaid,

    onInsufficientCoins,

    onPurchaseStarted,

    onPurchaseCompleted,

    formatCoins:
        formatWalletCoins,

    formatPrice:
        formatWalletPrice,

    config:
        WALLET_CONFIG

};


/* ================================================================
   45. GLOBAL SHORTCUTS
================================================================ */

window.getWalletBalance =
    getWalletBalance;


window.addCoins =
    addCoins;


window.removeCoins =
    removeCoins;


window.hasEnoughCoins =
    hasEnoughCoins;


window.canStartGame =
    canStartGame;


window.getGameEntryFee =
    getGameEntryFee;


window.payGameEntryFee =
    payGameEntryFee;


window.refundGameEntryFee =
    refundGameEntryFee;


window.getCoinPackages =
    getCoinPackages;


window.getCoinPackage =
    getCoinPackage;


window.startCoinPurchase =
    startCoinPurchase;


window.confirmCoinPurchase =
    confirmCoinPurchase;


window.loadWalletTransactions =
    loadWalletTransactions;


window.updateWalletUI =
    updateWalletUI;


window.renderWalletTransactions =
    renderWalletTransactions;


window.renderCoinPackages =
    renderCoinPackages;


/* ================================================================
   46. DOM READY
================================================================ */

function startWallet() {

    setupWalletButtons();

    setupWalletAuthIntegration();


    /*
     * اگر Auth قبلاً آماده شده باشد،
     * مستقیماً Wallet را اجرا می‌کنیم.
     */

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.isLoggedIn ===
        "function" &&
        window.hokmAuth.isLoggedIn()
    ) {

        initializeWallet();

        return;
    }


    /*
     * اگر Auth هنوز آماده نیست،
     * کمی بعد دوباره تلاش می‌کنیم.
     */

    let attempts =
        0;


    const maxAttempts =
        20;


    const timer =
        setInterval(
            async () => {

                attempts++;


                if (
                    walletState.initialized
                ) {

                    clearInterval(
                        timer
                    );

                    return;
                }


                if (
                    window.hokmAuth &&
                    typeof window.hokmAuth.isLoggedIn ===
                    "function" &&
                    window.hokmAuth.isLoggedIn()
                ) {

                    clearInterval(
                        timer
                    );


                    await initializeWallet();

                    return;
                }


                /*
                 * اگر Auth وجود نداشته باشد،
                 * کیف پول در حالت اولیه نیز
                 * آماده می‌شود.
                 */

                if (
                    attempts >= maxAttempts
                ) {

                    clearInterval(
                        timer
                    );


                    await initializeWallet();

                }

            },
            500
        );

}


/* ================================================================
   47. DOM EVENT
================================================================ */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startWallet
    );

} else {

    startWallet();

}


/* ================================================================
   END OF WALLET.JS
================================================================ */
