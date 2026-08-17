"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * main.js
 *
 * فایل شماره ۱۲ از ۱۲
 *
 * هسته هماهنگ‌کننده اصلی برنامه
 *
 * مسئولیت‌ها:
 *
 * - راه‌اندازی کامل بازی
 * - اتصال تمام ماژول‌ها
 * - مدیریت Navigation
 * - مدیریت صفحات و پنل‌ها
 * - مدیریت Auth
 * - مدیریت Profile
 * - مدیریت Wallet
 * - مدیریت Shop
 * - مدیریت Room
 * - مدیریت Multiplayer
 * - مدیریت Chat
 * - مدیریت Notifications
 * - مدیریت Friends
 * - مدیریت Leaderboard
 * - مدیریت Game UI
 * - مدیریت دکمه‌های اصلی
 * - مدیریت Quick Game
 * - مدیریت Create Room
 * - مدیریت Join Room
 * - مدیریت Logout
 * - مدیریت Settings
 * - هماهنگی رویدادهای ماژول‌ها
 * - مدیریت وضعیت برنامه
 *
 * فایل‌های مورد استفاده:
 *
 * config.js
 * auth.js
 * game.js
 * shop.js
 * ui.js
 * room.js
 * multiplayer.js
 * chat.js
 * profile.js
 * settings.js
 * wallet.js
 * notifications.js
 * friends.js
 * leaderboard.js
 * game-ui.js
 *
 * ================================================================
 */


/* ================================================================
   1. APPLICATION STATE
================================================================ */

const appState = {

    initialized: false,

    loading: false,

    currentPage: "home",

    previousPage: null,

    currentRoom: null,

    currentGame: null,

    navigationLocked: false,

    mobileMenuOpen: false,

    modalOpen: false,

    lastError: null,

    lastAction: null,

    online: navigator.onLine,

    bootTime: Date.now(),

    eventsBound: false

};


/* ================================================================
   2. APPLICATION EVENTS
================================================================ */

const appEvents = {

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


    emit(eventName, data = null) {

        const listeners =
            this.listeners[eventName] || [];


        listeners.forEach(
            callback => {

                try {

                    callback(data);

                } catch (error) {

                    console.error(
                        `خطا در App Event: ${eventName}`,
                        error
                    );
                }

            }
        );
    }

};


/* ================================================================
   3. SAFE MODULE ACCESS
================================================================ */

function getModule(name) {

    if (
        window[name]
    ) {

        return window[name];
    }


    return null;
}


/* ================================================================
   4. TOAST
================================================================ */

function appToast(
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
   5. LOADING
================================================================ */

function appLoading(
    show,
    message = "لطفاً صبر کنید..."
) {

    appState.loading =
        !!show;


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
   6. DOM HELPERS
================================================================ */

function $(selector, parent = document) {

    return parent.querySelector(
        selector
    );
}


function $$(selector, parent = document) {

    return Array.from(
        parent.querySelectorAll(
            selector
        )
    );
}


function getElement(
    id
) {

    return document.getElementById(
        id
    );
}


function setText(
    selector,
    value
) {

    $$(selector).forEach(
        element => {

            element.textContent =
                value ?? "";

        }
    );
}


function showElement(
    element
) {

    if (!element) {

        return;
    }


    element.hidden = false;

    element.style.display =
        "";
}


function hideElement(
    element
) {

    if (!element) {

        return;
    }


    element.hidden = true;

    element.style.display =
        "none";
}


/* ================================================================
   7. PAGE ELEMENT DISCOVERY
================================================================ */

function getPageElements() {

    return {

        home:
            $("[data-page='home']") ||
            getElement("homePage"),

        profile:
            $("[data-page='profile']") ||
            getElement("profilePage"),

        shop:
            $("[data-page='shop']") ||
            getElement("shopPage"),

        ranking:
            $("[data-page='ranking']") ||
            getElement("rankingPage"),

        settings:
            $("[data-page='settings']") ||
            getElement("settingsPage"),

        game:
            $("[data-page='game']") ||
            getElement("gamePage"),

        room:
            $("[data-page='room']") ||
            getElement("roomPage"),

        friends:
            $("[data-page='friends']") ||
            getElement("friendsPage"),

        notifications:
            $("[data-page='notifications']") ||
            getElement("notificationsPage")

    };
}


/* ================================================================
   8. HIDE ALL PAGES
================================================================ */

function hideAllPages() {

    const pages =
        getPageElements();


    Object.values(pages).forEach(
        page => {

            if (!page) {

                return;
            }


            page.classList.remove(
                "active"
            );

            page.classList.remove(
                "page-active"
            );

            page.hidden = true;

            page.style.display =
                "none";

        }
    );
}


/* ================================================================
   9. SHOW PAGE
================================================================ */

function showPage(
    pageName
) {

    const pages =
        getPageElements();


    const page =
        pages[pageName];


    if (!page) {

        console.warn(
            `صفحه ${pageName} پیدا نشد.`
        );

        return false;
    }


    hideAllPages();


    page.hidden = false;

    page.style.display =
        "";


    page.classList.add(
        "active"
    );

    page.classList.add(
        "page-active"
    );


    appState.previousPage =
        appState.currentPage;


    appState.currentPage =
        pageName;


    updateNavigationUI(
        pageName
    );


    appEvents.emit(
        "pageChanged",
        {

            page:
                pageName,

            previousPage:
                appState.previousPage

        }
    );


    return true;
}


/* ================================================================
   10. NAVIGATION UI
================================================================ */

function updateNavigationUI(
    pageName
) {

    $$(
        "[data-page-link]"
    ).forEach(
        link => {

            const target =
                link.dataset.pageLink;


            const active =
                target === pageName;


            link.classList.toggle(
                "active",
                active
            );

            link.classList.toggle(
                "selected",
                active
            );

            link.setAttribute(
                "aria-current",
                active
                    ? "page"
                    : "false"
            );

        }
    );


    $$(
        "[data-nav]"
    ).forEach(
        link => {

            const target =
                link.dataset.nav;


            link.classList.toggle(
                "active",
                target === pageName
            );

        }
    );
}


/* ================================================================
   11. NAVIGATE
================================================================ */

async function navigateTo(
    pageName,
    options = {}
) {

    if (
        !pageName
    ) {

        return false;
    }


    if (
        appState.navigationLocked
    ) {

        return false;
    }


    appState.navigationLocked =
        true;


    try {

        /*
         * صفحات نیازمند ورود
         */

        const protectedPages = [

            "profile",
            "friends",
            "notifications",
            "settings",
            "room",
            "game"

        ];


        if (
            protectedPages.includes(
                pageName
            )
        ) {

            const auth =
                getModule(
                    "hokmAuth"
                );


            if (
                auth &&
                typeof auth.isLoggedIn === "function" &&
                !auth.isLoggedIn()
            ) {

                appToast(
                    "برای ورود به این بخش ابتدا وارد حساب شوید.",
                    "🔐",
                    3500
                );


                showAuthScreen();

                return false;
            }

        }


        if (
            pageName === "shop"
        ) {

            await refreshShop();
        }


        if (
            pageName === "profile"
        ) {

            await refreshProfile();
        }


        if (
            pageName === "friends"
        ) {

            await refreshFriends();
        }


        if (
            pageName === "notifications"
        ) {

            await refreshNotifications();
        }


        if (
            pageName === "ranking"
        ) {

            await refreshLeaderboard();
        }


        if (
            pageName === "settings"
        ) {

            await refreshSettings();
        }


        const result =
            showPage(
                pageName
            );


        if (
            options.closeMenu !== false
        ) {

            closeMobileMenu();
        }


        return result;


    } finally {

        setTimeout(
            () => {

                appState.navigationLocked =
                    false;

            },
            50
        );
    }
}


/* ================================================================
   12. AUTH SCREEN
================================================================ */

function showAuthScreen() {

    const login =
        $("[data-auth-screen='login']");


    const register =
        $("[data-auth-screen='register']");


    if (login) {

        showElement(
            login
        );
    }


    if (register) {

        hideElement(
            register
        );
    }


    const authModal =
        $("[data-modal='auth']") ||
        getElement("authModal");


    if (authModal) {

        showModal(
            authModal
        );
    }
}


/* ================================================================
   13. MODAL
================================================================ */

function showModal(
    modal
) {

    if (!modal) {

        return;
    }


    modal.hidden = false;

    modal.style.display =
        "";


    modal.classList.add(
        "active"
    );


    document.body.classList.add(
        "modal-open"
    );


    appState.modalOpen =
        true;
}


function hideModal(
    modal
) {

    if (!modal) {

        return;
    }


    modal.classList.remove(
        "active"
    );


    modal.hidden = true;

    modal.style.display =
        "none";


    document.body.classList.remove(
        "modal-open"
    );


    appState.modalOpen =
        false;
}


function closeAllModals() {

    $$(
        "[data-modal]"
    ).forEach(
        modal => {

            hideModal(
                modal
            );

        }
    );


    appState.modalOpen =
        false;
}


/* ================================================================
   14. MOBILE MENU
================================================================ */

function openMobileMenu() {

    appState.mobileMenuOpen =
        true;


    document.body.classList.add(
        "menu-open"
    );


    const menu =
        $("[data-mobile-menu]") ||
        getElement("mobileMenu");


    if (menu) {

        menu.classList.add(
            "open"
        );

        menu.classList.add(
            "active"
        );
    }
}


function closeMobileMenu() {

    appState.mobileMenuOpen =
        false;


    document.body.classList.remove(
        "menu-open"
    );


    const menu =
        $("[data-mobile-menu]") ||
        getElement("mobileMenu");


    if (menu) {

        menu.classList.remove(
            "open"
        );

        menu.classList.remove(
            "active"
        );
    }
}


function toggleMobileMenu() {

    if (
        appState.mobileMenuOpen
    ) {

        closeMobileMenu();

    } else {

        openMobileMenu();
    }
}


/* ================================================================
   15. AUTH BUTTONS
================================================================ */

async function handleLoginSubmit(
    form
) {

    if (!form) {

        return;
    }


    const email =
        form.querySelector(
            "[name='email']"
        )?.value || "";


    const password =
        form.querySelector(
            "[name='password']"
        )?.value || "";


    const auth =
        getModule(
            "hokmAuth"
        );


    if (
        !auth ||
        typeof auth.signIn !== "function"
    ) {

        appToast(
            "سیستم ورود آماده نیست.",
            "⚠️"
        );

        return;
    }


    const result =
        await auth.signIn(
            email,
            password
        );


    if (
        result?.success
    ) {

        closeAllModals();

        await refreshAllUserData();

        navigateTo(
            "home"
        );
    }
}


async function handleRegisterSubmit(
    form
) {

    if (!form) {

        return;
    }


    const email =
        form.querySelector(
            "[name='email']"
        )?.value || "";


    const password =
        form.querySelector(
            "[name='password']"
        )?.value || "";


    const displayName =
        form.querySelector(
            "[name='display_name']"
        )?.value ||
        form.querySelector(
            "[name='username']"
        )?.value ||
        "";


    const auth =
        getModule(
            "hokmAuth"
        );


    if (
        !auth ||
        typeof auth.signUp !== "function"
    ) {

        appToast(
            "سیستم ثبت‌نام آماده نیست.",
            "⚠️"
        );

        return;
    }


    const result =
        await auth.signUp(
            email,
            password,
            displayName
        );


    if (
        result?.success
    ) {

        closeAllModals();

        await refreshAllUserData();

        navigateTo(
            "home"
        );
    }
}


/* ================================================================
   16. LOGOUT
================================================================ */

async function handleLogout() {

    const auth =
        getModule(
            "hokmAuth"
        );


    if (
        !auth ||
        typeof auth.signOut !== "function"
    ) {

        return;
    }


    const confirmed =
        window.confirm(
            "آیا مطمئن هستید که می‌خواهید از حساب خارج شوید؟"
        );


    if (!confirmed) {

        return;
    }


    appLoading(
        true,
        "در حال خروج..."
    );


    try {

        await auth.signOut();

    } finally {

        appLoading(
            false
        );


        appState.currentRoom =
            null;

        appState.currentGame =
            null;


        navigateTo(
            "home"
        );
    }
}


/* ================================================================
   17. QUICK GAME
================================================================ */

async function startQuickGame() {

    const auth =
        getModule(
            "hokmAuth"
        );


    if (
        auth &&
        typeof auth.isLoggedIn === "function" &&
        !auth.isLoggedIn()
    ) {

        showAuthScreen();

        appToast(
            "برای شروع بازی باید وارد حساب شوید.",
            "🔐"
        );

        return;
    }


    const wallet =
        getModule(
            "hokmWallet"
        );


    /*
     * هزینه هر بازی:
     *
     * ۴۰۰ سکه مجازی
     */

    const GAME_COST =
        400;


    if (
        wallet &&
        typeof wallet.hasEnoughCoins === "function"
    ) {

        const enough =
            await wallet.hasEnoughCoins(
                GAME_COST
            );


        if (!enough) {

            appToast(
                "برای بازی حداقل ۴۰۰ سکه نیاز دارید.",
                "🪙",
                4000
            );


            navigateTo(
                "shop"
            );


            return;
        }
    }


    appLoading(
        true,
        "در حال پیدا کردن میز مناسب..."
    );


    try {

        const room =
            getModule(
                "hokmRoom"
            );


        if (
            room &&
            typeof room.quickMatch === "function"
        ) {

            const result =
                await room.quickMatch();


            if (
                result
            ) {

                appState.currentRoom =
                    result;


                navigateTo(
                    "room"
                );


                return;
            }
        }


        /*
         * اگر ماژول Room تابع quickMatch نداشت،
         * از Multiplayer استفاده می‌کنیم.
         */

        const multiplayer =
            getModule(
                "hokmMultiplayer"
            );


        if (
            multiplayer &&
            typeof multiplayer.quickMatch === "function"
        ) {

            const result =
                await multiplayer.quickMatch();


            if (
                result
            ) {

                appState.currentRoom =
                    result;


                navigateTo(
                    "room"
                );


                return;
            }
        }


        appToast(
            "در حال حاضر میز مناسبی پیدا نشد. دوباره تلاش کنید.",
            "🎮",
            4000
        );


    } catch (error) {

        console.error(
            "Quick Game Error:",
            error
        );


        appState.lastError =
            error;


        appToast(
            "شروع بازی با مشکل مواجه شد.",
            "❌"
        );


    } finally {

        appLoading(
            false
        );
    }
}


/* ================================================================
   18. CREATE ROOM
================================================================ */

async function openCreateRoom() {

    const auth =
        getModule(
            "hokmAuth"
        );


    if (
        auth &&
        typeof auth.isLoggedIn === "function" &&
        !auth.isLoggedIn()
    ) {

        showAuthScreen();

        return;
    }


    const modal =
        $("[data-modal='create-room']") ||
        getElement(
            "createRoomModal"
        );


    if (modal) {

        showModal(
            modal
        );


        return;
    }


    await createRoomFromForm(
        null
    );
}


/* ================================================================
   19. CREATE ROOM FROM FORM
================================================================ */

async function createRoomFromForm(
    form
) {

    const room =
        getModule(
            "hokmRoom"
        );


    if (
        !room ||
        typeof room.createRoom !== "function"
    ) {

        appToast(
            "سیستم اتاق بازی آماده نیست.",
            "⚠️"
        );

        return;
    }


    let settings = {

        players:
            4,

        entryFee:
            400,

        isPrivate:
            false,

        name:
            "میز حکم",

        timeControl:
            "normal"

    };


    if (form) {

        settings.players =
            Number(
                form.querySelector(
                    "[name='players']"
                )?.value ||
                4
            );


        settings.entryFee =
            Number(
                form.querySelector(
                    "[name='entry_fee']"
                )?.value ||
                400
            );


        settings.name =
            form.querySelector(
                "[name='room_name']"
            )?.value ||
            "میز حکم";


        settings.isPrivate =
            !!form.querySelector(
                "[name='private']"
            )?.checked;


        settings.timeControl =
            form.querySelector(
                "[name='time_control']"
            )?.value ||
            "normal";
    }


    appLoading(
        true,
        "در حال ساخت میز..."
    );


    try {

        const result =
            await room.createRoom(
                settings
            );


        if (
            result
        ) {

            appState.currentRoom =
                result;


            closeAllModals();

            navigateTo(
                "room"
            );


            appToast(
                "میز با موفقیت ساخته شد.",
                "🎮"
            );
        }


    } catch (error) {

        console.error(
            "Create Room Error:",
            error
        );


        appToast(
            "ساخت میز انجام نشد.",
            "❌"
        );


    } finally {

        appLoading(
            false
        );
    }
}


/* ================================================================
   20. JOIN ROOM
================================================================ */

async function joinRoom(
    roomId
) {

    if (!roomId) {

        return;
    }


    const room =
        getModule(
            "hokmRoom"
        );


    if (
        !room ||
        typeof room.joinRoom !== "function"
    ) {

        appToast(
            "سیستم ورود به اتاق آماده نیست.",
            "⚠️"
        );

        return;
    }


    appLoading(
        true,
        "در حال ورود به میز..."
    );


    try {

        const result =
            await room.joinRoom(
                roomId
            );


        if (
            result
        ) {

            appState.currentRoom =
                result;


            navigateTo(
                "room"
            );
        }


    } catch (error) {

        console.error(
            "Join Room Error:",
            error
        );


        appToast(
            "ورود به میز انجام نشد.",
            "❌"
        );


    } finally {

        appLoading(
            false
        );
    }
}


/* ================================================================
   21. LEAVE ROOM
================================================================ */

async function leaveCurrentRoom() {

    const room =
        getModule(
            "hokmRoom"
        );


    if (
        room &&
        typeof room.leaveRoom === "function"
    ) {

        try {

            await room.leaveRoom();

        } catch (error) {

            console.error(
                "Leave Room Error:",
                error
            );
        }
    }


    appState.currentRoom =
        null;


    navigateTo(
        "home"
    );
}


/* ================================================================
   22. START ROOM GAME
================================================================ */

async function startRoomGame() {

    const room =
        getModule(
            "hokmRoom"
        );


    if (
        !room
    ) {

        return;
    }


    if (
        typeof room.startGame === "function"
    ) {

        appLoading(
            true,
            "در حال آماده‌سازی بازی..."
        );


        try {

            const result =
                await room.startGame();


            if (
                result
            ) {

                appState.currentGame =
                    result;


                navigateTo(
                    "game"
                );
            }


        } finally {

            appLoading(
                false
            );
        }
    }
}


/* ================================================================
   23. SHOP
================================================================ */

async function refreshShop() {

    const shop =
        getModule(
            "hokmShop"
        );


    if (!shop) {

        return;
    }


    try {

        if (
            typeof shop.render === "function"
        ) {

            await shop.render();
        }


        if (
            typeof shop.load === "function"
        ) {

            await shop.load();
        }

    } catch (error) {

        console.error(
            "Shop refresh error:",
            error
        );
    }
}


/* ================================================================
   24. PROFILE
================================================================ */

async function refreshProfile() {

    const profile =
        getModule(
            "hokmProfile"
        );


    if (!profile) {

        return;
    }


    try {

        if (
            typeof profile.load === "function"
        ) {

            await profile.load();
        }


        if (
            typeof profile.render === "function"
        ) {

            await profile.render();
        }

    } catch (error) {

        console.error(
            "Profile refresh error:",
            error
        );
    }
}


/* ================================================================
   25. WALLET
================================================================ */

async function refreshWallet() {

    const wallet =
        getModule(
            "hokmWallet"
        );


    if (!wallet) {

        return;
    }


    try {

        if (
            typeof wallet.load === "function"
        ) {

            await wallet.load();
        }


        if (
            typeof wallet.render === "function"
        ) {

            await wallet.render();
        }

    } catch (error) {

        console.error(
            "Wallet refresh error:",
            error
        );
    }
}


/* ================================================================
   26. FRIENDS
================================================================ */

async function refreshFriends() {

    const friends =
        getModule(
            "hokmFriends"
        );


    if (!friends) {

        return;
    }


    try {

        if (
            typeof friends.load === "function"
        ) {

            await friends.load();
        }


        if (
            typeof friends.render === "function"
        ) {

            await friends.render();
        }

    } catch (error) {

        console.error(
            "Friends refresh error:",
            error
        );
    }
}


/* ================================================================
   27. NOTIFICATIONS
================================================================ */

async function refreshNotifications() {

    const notifications =
        getModule(
            "hokmNotifications"
        );


    if (!notifications) {

        return;
    }


    try {

        if (
            typeof notifications.load === "function"
        ) {

            await notifications.load();
        }


        if (
            typeof notifications.render === "function"
        ) {

            await notifications.render();
        }

    } catch (error) {

        console.error(
            "Notifications refresh error:",
            error
        );
    }
}


/* ================================================================
   28. LEADERBOARD
================================================================ */

async function refreshLeaderboard() {

    const leaderboard =
        getModule(
            "hokmLeaderboard"
        );


    if (!leaderboard) {

        return;
    }


    try {

        if (
            typeof leaderboard.load === "function"
        ) {

            await leaderboard.load();
        }


        if (
            typeof leaderboard.render === "function"
        ) {

            await leaderboard.render();
        }

    } catch (error) {

        console.error(
            "Leaderboard refresh error:",
            error
        );
    }
}


/* ================================================================
   29. SETTINGS
================================================================ */

async function refreshSettings() {

    const settings =
        getModule(
            "hokmSettings"
        );


    if (!settings) {

        return;
    }


    try {

        if (
            typeof settings.load === "function"
        ) {

            await settings.load();
        }


        if (
            typeof settings.render === "function"
        ) {

            await settings.render();
        }

    } catch (error) {

        console.error(
            "Settings refresh error:",
            error
        );
    }
}


/* ================================================================
   30. GAME UI
================================================================ */

async function refreshGameUI() {

    const gameUI =
        getModule(
            "hokmGameUI"
        );


    if (!gameUI) {

        return;
    }


    try {

        if (
            typeof gameUI.render === "function"
        ) {

            await gameUI.render();
        }


        if (
            typeof gameUI.refresh === "function"
        ) {

            await gameUI.refresh();
        }

    } catch (error) {

        console.error(
            "Game UI refresh error:",
            error
        );
    }
}


/* ================================================================
   31. REFRESH ALL USER DATA
================================================================ */

async function refreshAllUserData() {

    await Promise.allSettled([

        refreshWallet(),

        refreshProfile(),

        refreshFriends(),

        refreshNotifications()

    ]);


    updateGlobalUserUI();
}


/* ================================================================
   32. GLOBAL USER UI
================================================================ */

function updateGlobalUserUI() {

    const auth =
        getModule(
            "hokmAuth"
        );


    if (
        !auth
    ) {

        return;
    }


    const profile =
        typeof auth.getCurrentProfile === "function"
            ? auth.getCurrentProfile()
            : null;


    const user =
        typeof auth.getCurrentUser === "function"
            ? auth.getCurrentUser()
            : null;


    const name =
        typeof auth.getProfileDisplayName === "function"
            ? auth.getProfileDisplayName()
            : (
                profile?.username ||
                "بازیکن"
            );


    setText(
        "[data-user-name]",
        name
    );


    setText(
        "[data-user-email]",
        user?.email || ""
    );


    if (
        profile?.coins !== undefined
    ) {

        setText(
            "[data-user-coins]",
            Number(
                profile.coins
            ).toLocaleString(
                "fa-IR"
            )
        );
    }


    if (
        profile?.level !== undefined
    ) {

        setText(
            "[data-user-level]",
            Number(
                profile.level
            ).toLocaleString(
                "fa-IR"
            )
        );
    }
}


/* ================================================================
   33. ROOM EVENTS
================================================================ */

function setupRoomEvents() {

    const room =
        getModule(
            "hokmRoom"
        );


    if (
        !room
    ) {

        return;
    }


    if (
        typeof room.on === "function"
    ) {

        room.on(
            "roomCreated",
            roomData => {

                appState.currentRoom =
                    roomData;

                navigateTo(
                    "room"
                );

            }
        );


        room.on(
            "roomJoined",
            roomData => {

                appState.currentRoom =
                    roomData;

                navigateTo(
                    "room"
                );

            }
        );


        room.on(
            "gameStarted",
            gameData => {

                appState.currentGame =
                    gameData;

                navigateTo(
                    "game"
                );

                refreshGameUI();

            }
        );


        room.on(
            "roomLeft",
            () => {

                appState.currentRoom =
                    null;

                navigateTo(
                    "home"
                );

            }
        );
    }
}


/* ================================================================
   34. MULTIPLAYER EVENTS
================================================================ */

function setupMultiplayerEvents() {

    const multiplayer =
        getModule(
            "hokmMultiplayer"
        );


    if (
        !multiplayer
    ) {

        return;
    }


    if (
        typeof multiplayer.on === "function"
    ) {

        multiplayer.on(
            "connected",
            () => {

                appEvents.emit(
                    "multiplayerConnected"
                );

            }
        );


        multiplayer.on(
            "disconnected",
            () => {

                appToast(
                    "ارتباط با سرور بازی قطع شد.",
                    "⚠️",
                    4000
                );

                appEvents.emit(
                    "multiplayerDisconnected"
                );

            }
        );


        multiplayer.on(
            "gameStateChanged",
            gameState => {

                appState.currentGame =
                    gameState;


                refreshGameUI();

            }
        );


        multiplayer.on(
            "playerJoined",
            player => {

                appEvents.emit(
                    "playerJoined",
                    player
                );

            }
        );


        multiplayer.on(
            "playerLeft",
            player => {

                appEvents.emit(
                    "playerLeft",
                    player
                );

            }
        );
    }
}


/* ================================================================
   35. CHAT EVENTS
================================================================ */

function setupChatEvents() {

    const chat =
        getModule(
            "hokmChat"
        );


    if (
        !chat
    ) {

        return;
    }


    if (
        typeof chat.on === "function"
    ) {

        chat.on(
            "message",
            message => {

                appEvents.emit(
                    "chatMessage",
                    message
                );

            }
        );


        chat.on(
            "unreadChanged",
            count => {

                updateUnreadCount(
                    "[data-chat-unread]",
                    count
                );

            }
        );
    }
}


/* ================================================================
   36. NOTIFICATION EVENTS
================================================================ */

function setupNotificationEvents() {

    const notifications =
        getModule(
            "hokmNotifications"
        );


    if (
        !notifications
    ) {

        return;
    }


    if (
        typeof notifications.on === "function"
    ) {

        notifications.on(
            "unreadChanged",
            count => {

                updateUnreadCount(
                    "[data-notification-unread]",
                    count
                );

            }
        );


        notifications.on(
            "notification",
            notification => {

                if (
                    notification?.message
                ) {

                    appToast(
                        notification.message,
                        "🔔",
                        4000
                    );
                }

            }
        );
    }
}


/* ================================================================
   37. FRIEND EVENTS
================================================================ */

function setupFriendEvents() {

    const friends =
        getModule(
            "hokmFriends"
        );


    if (
        !friends
    ) {

        return;
    }


    if (
        typeof friends.on === "function"
    ) {

        friends.on(
            "requestReceived",
            request => {

                appToast(
                    "یک درخواست دوستی جدید دریافت کردی.",
                    "👥",
                    4000
                );


                appEvents.emit(
                    "friendRequestReceived",
                    request
                );

            }
        );
    }
}


/* ================================================================
   38. AUTH EVENTS
================================================================ */

function setupAuthEvents() {

    const auth =
        getModule(
            "hokmAuth"
        );


    if (
        !auth
    ) {

        return;
    }


    if (
        typeof auth.onSignIn === "function"
    ) {

        auth.onSignIn(
            async () => {

                await refreshAllUserData();

                updateGlobalUserUI();

            }
        );
    }


    if (
        typeof auth.onSignOut === "function"
    ) {

        auth.onSignOut(
            () => {

                appState.currentRoom =
                    null;

                appState.currentGame =
                    null;

                updateGlobalUserUI();

            }
        );
    }


    if (
        typeof auth.onProfileUpdated === "function"
    ) {

        auth.onProfileUpdated(
            () => {

                updateGlobalUserUI();

            }
        );
    }


    if (
        typeof auth.onAuthChange === "function"
    ) {

        auth.onAuthChange(
            async () => {

                updateGlobalUserUI();

                await refreshWallet();

            }
        );
    }
}


/* ================================================================
   39. UPDATE UNREAD COUNT
================================================================ */

function updateUnreadCount(
    selector,
    count
) {

    $$(selector).forEach(
        element => {

            const value =
                Number(
                    count || 0
                );


            element.textContent =
                value > 99
                    ? "99+"
                    : String(value);


            element.classList.toggle(
                "has-unread",
                value > 0
            );


            if (
                value > 0
            ) {

                showElement(
                    element
                );

            } else {

                hideElement(
                    element
                );
            }

        }
    );
}


/* ================================================================
   40. ONLINE / OFFLINE
================================================================ */

function handleOnline() {

    appState.online =
        true;


    document.body.classList.remove(
        "offline"
    );


    appToast(
        "اتصال اینترنت برقرار شد.",
        "🟢",
        2500
    );


    const multiplayer =
        getModule(
            "hokmMultiplayer"
        );


    if (
        multiplayer &&
        typeof multiplayer.reconnect === "function"
    ) {

        multiplayer.reconnect();
    }


    appEvents.emit(
        "online"
    );
}


function handleOffline() {

    appState.online =
        false;


    document.body.classList.add(
        "offline"
    );


    appToast(
        "اتصال اینترنت قطع شد.",
        "🔴",
        4000
    );


    appEvents.emit(
        "offline"
    );
}


/* ================================================================
   41. NAVIGATION CLICK HANDLER
================================================================ */

async function handleNavigationClick(
    event
) {

    const link =
        event.target.closest(
            "[data-page-link], [data-nav]"
        );


    if (!link) {

        return;
    }


    event.preventDefault();


    const page =
        link.dataset.pageLink ||
        link.dataset.nav;


    if (
        page
    ) {

        await navigateTo(
            page
        );
    }
}


/* ================================================================
   42. GLOBAL CLICK HANDLER
================================================================ */

async function handleGlobalClick(
    event
) {

    const target =
        event.target;


    /*
     * Navigation
     */

    const nav =
        target.closest(
            "[data-page-link], [data-nav]"
        );


    if (
        nav
    ) {

        await handleNavigationClick(
            event
        );

        return;
    }


    /*
     * Mobile menu
     */

    const menuButton =
        target.closest(
            "[data-action='toggle-menu']"
        );


    if (
        menuButton
    ) {

        event.preventDefault();

        toggleMobileMenu();

        return;
    }


    /*
     * Close menu
     */

    const closeMenu =
        target.closest(
            "[data-action='close-menu']"
        );


    if (
        closeMenu
    ) {

        event.preventDefault();

        closeMobileMenu();

        return;
    }


    /*
     * Close modal
     */

    const closeModalButton =
        target.closest(
            "[data-action='close-modal']"
        );


    if (
        closeModalButton
    ) {

        event.preventDefault();

        const modal =
            closeModalButton.closest(
                "[data-modal]"
            );


        hideModal(
            modal
        );

        return;
    }


    /*
     * Login
     */

    const loginButton =
        target.closest(
            "[data-action='login']"
        );


    if (
        loginButton
    ) {

        event.preventDefault();

        showAuthScreen();

        return;
    }


    /*
     * Logout
     */

    const logoutButton =
        target.closest(
            "[data-action='logout']"
        );


    if (
        logoutButton
    ) {

        event.preventDefault();

        await handleLogout();

        return;
    }


    /*
     * Quick Game
     */

    const quickGameButton =
        target.closest(
            "[data-action='quick-game']"
        );


    if (
        quickGameButton
    ) {

        event.preventDefault();

        await startQuickGame();

        return;
    }


    /*
     * Create Room
     */

    const createRoomButton =
        target.closest(
            "[data-action='create-room']"
        );


    if (
        createRoomButton
    ) {

        event.preventDefault();

        await openCreateRoom();

        return;
    }


    /*
     * Leave Room
     */

    const leaveRoomButton =
        target.closest(
            "[data-action='leave-room']"
        );


    if (
        leaveRoomButton
    ) {

        event.preventDefault();

        await leaveCurrentRoom();

        return;
    }


    /*
     * Start Room Game
     */

    const startGameButton =
        target.closest(
            "[data-action='start-room-game']"
        );


    if (
        startGameButton
    ) {

        event.preventDefault();

        await startRoomGame();

        return;
    }


    /*
     * Shop
     */

    const shopButton =
        target.closest(
            "[data-action='shop']"
        );


    if (
        shopButton
    ) {

        event.preventDefault();

        await navigateTo(
            "shop"
        );

        return;
    }


    /*
     * Profile
     */

    const profileButton =
        target.closest(
            "[data-action='profile']"
        );


    if (
        profileButton
    ) {

        event.preventDefault();

        await navigateTo(
            "profile"
        );

        return;
    }


    /*
     * Friends
     */

    const friendsButton =
        target.closest(
            "[data-action='friends']"
        );


    if (
        friendsButton
    ) {

        event.preventDefault();

        await navigateTo(
            "friends"
        );

        return;
    }


    /*
     * Notifications
     */

    const notificationsButton =
        target.closest(
            "[data-action='notifications']"
        );


    if (
        notificationsButton
    ) {

        event.preventDefault();

        await navigateTo(
            "notifications"
        );

        return;
    }


    /*
     * Ranking
     */

    const rankingButton =
        target.closest(
            "[data-action='ranking']"
        );


    if (
        rankingButton
    ) {

        event.preventDefault();

        await navigateTo(
            "ranking"
        );

        return;
    }


    /*
     * Settings
     */

    const settingsButton =
        target.closest(
            "[data-action='settings']"
        );


    if (
        settingsButton
    ) {

        event.preventDefault();

        await navigateTo(
            "settings"
        );

        return;
    }


    /*
     * Join Room
     */

    const joinButton =
        target.closest(
            "[data-action='join-room']"
        );


    if (
        joinButton
    ) {

        event.preventDefault();


        const roomId =
            joinButton.dataset.roomId ||
            joinButton.closest(
                "[data-room-id]"
            )?.dataset.roomId;


        if (
            roomId
        ) {

            await joinRoom(
                roomId
            );
        }


        return;
    }


    /*
     * Back
     */

    const backButton =
        target.closest(
            "[data-action='back']"
        );


    if (
        backButton
    ) {

        event.preventDefault();


        if (
            appState.previousPage
        ) {

            await navigateTo(
                appState.previousPage
            );

        } else {

            await navigateTo(
                "home"
            );
        }


        return;
    }


    /*
     * Buy Shop Item
     */

    const buyButton =
        target.closest(
            "[data-action='buy-item']"
        );


    if (
        buyButton
    ) {

        event.preventDefault();


        const itemId =
            buyButton.dataset.itemId;


        const shop =
            getModule(
                "hokmShop"
            );


        if (
            shop &&
            typeof shop.buyItem === "function"
        ) {

            await shop.buyItem(
                itemId
            );
        }


        return;
    }


    /*
     * Buy Coin Package
     */

    const coinPackageButton =
        target.closest(
            "[data-action='buy-coins']"
        );


    if (
        coinPackageButton
    ) {

        event.preventDefault();


        const packageId =
            coinPackageButton.dataset.packageId;


        const wallet =
            getModule(
                "hokmWallet"
            );


        if (
            wallet &&
            typeof wallet.buyPackage === "function"
        ) {

            await wallet.buyPackage(
                packageId
            );
        }


        return;
    }


    /*
     * Mark notification read
     */

    const notificationButton =
        target.closest(
            "[data-action='notification-read']"
        );


    if (
        notificationButton
    ) {

        const notificationId =
            notificationButton.dataset.notificationId;


        const notifications =
            getModule(
                "hokmNotifications"
            );


        if (
            notifications &&
            typeof notifications.markRead === "function"
        ) {

            await notifications.markRead(
                notificationId
            );
        }


        return;
    }


    /*
     * Add friend
     */

    const addFriendButton =
        target.closest(
            "[data-action='add-friend']"
        );


    if (
        addFriendButton
    ) {

        event.preventDefault();


        const userId =
            addFriendButton.dataset.userId;


        const friends =
            getModule(
                "hokmFriends"
            );


        if (
            friends &&
            typeof friends.addFriend === "function"
        ) {

            await friends.addFriend(
                userId
            );
        }


        return;
    }


    /*
     * Accept friend
     */

    const acceptFriendButton =
        target.closest(
            "[data-action='accept-friend']"
        );


    if (
        acceptFriendButton
    ) {

        event.preventDefault();


        const requestId =
            acceptFriendButton.dataset.requestId;


        const friends =
            getModule(
                "hokmFriends"
            );


        if (
            friends &&
            typeof friends.acceptRequest === "function"
        ) {

            await friends.acceptRequest(
                requestId
            );
        }


        return;
    }


    /*
     * Reject friend
     */

    const rejectFriendButton =
        target.closest(
            "[data-action='reject-friend']"
        );


    if (
        rejectFriendButton
    ) {

        event.preventDefault();


        const requestId =
            rejectFriendButton.dataset.requestId;


        const friends =
            getModule(
                "hokmFriends"
            );


        if (
            friends &&
            typeof friends.rejectRequest === "function"
        ) {

            await friends.rejectRequest(
                requestId
            );
        }


        return;
    }


    /*
     * Send chat
     */

    const sendChatButton =
        target.closest(
            "[data-action='send-chat']"
        );


    if (
        sendChatButton
    ) {

        event.preventDefault();

        await sendChatMessage();

        return;
    }


    /*
     * Sound toggle
     */

    const soundButton =
        target.closest(
            "[data-action='toggle-sound']"
        );


    if (
        soundButton
    ) {

        event.preventDefault();

        await toggleSound();

        return;
    }


    /*
     * Music toggle
     */

    const musicButton =
        target.closest(
            "[data-action='toggle-music']"
        );


    if (
        musicButton
    ) {

        event.preventDefault();

        await toggleMusic();

        return;
    }
}


/* ================================================================
   43. CHAT SEND
================================================================ */

async function sendChatMessage() {

    const input =
        $(
            "[data-chat-input]"
        ) ||
        getElement(
            "chatInput"
        );


    if (!input) {

        return;
    }


    const message =
        input.value.trim();


    if (!message) {

        return;
    }


    const chat =
        getModule(
            "hokmChat"
        );


    if (
        !chat ||
        typeof chat.sendMessage !== "function"
    ) {

        appToast(
            "سیستم چت آماده نیست.",
            "⚠️"
        );

        return;
    }


    try {

        await chat.sendMessage(
            message
        );


        input.value =
            "";


    } catch (error) {

        console.error(
            "Chat send error:",
            error
        );


        appToast(
            "پیام ارسال نشد.",
            "❌"
        );
    }
}


/* ================================================================
   44. SOUND
================================================================ */

async function toggleSound() {

    const settings =
        getModule(
            "hokmSettings"
        );


    if (
        settings &&
        typeof settings.toggleSound === "function"
    ) {

        await settings.toggleSound();

        return;
    }


    document.body.classList.toggle(
        "sound-disabled"
    );
}


/* ================================================================
   45. MUSIC
================================================================ */

async function toggleMusic() {

    const settings =
        getModule(
            "hokmSettings"
        );


    if (
        settings &&
        typeof settings.toggleMusic === "function"
    ) {

        await settings.toggleMusic();

        return;
    }


    document.body.classList.toggle(
        "music-disabled"
    );
}


/* ================================================================
   46. FORM SUBMISSION
================================================================ */

async function handleFormSubmit(
    event
) {

    const form =
        event.target;


    if (
        !form ||
        form.tagName !== "FORM"
    ) {

        return;
    }


    const type =
        form.dataset.form;


    if (
        type === "login"
    ) {

        event.preventDefault();

        await handleLoginSubmit(
            form
        );

        return;
    }


    if (
        type === "register"
    ) {

        event.preventDefault();

        await handleRegisterSubmit(
            form
        );

        return;
    }


    if (
        type === "create-room"
    ) {

        event.preventDefault();

        await createRoomFromForm(
            form
        );

        return;
    }


    if (
        type === "chat"
    ) {

        event.preventDefault();

        await sendChatMessage();

        return;
    }


    if (
        type === "search-friend"
    ) {

        event.preventDefault();

        await searchFriend(
            form
        );

        return;
    }
}


/* ================================================================
   47. SEARCH FRIEND
================================================================ */

async function searchFriend(
    form
) {

    const input =
        form.querySelector(
            "[name='query']"
        );


    const query =
        input?.value.trim() ||
        "";


    if (!query) {

        appToast(
            "نام بازیکن را وارد کنید.",
            "⚠️"
        );

        return;
    }


    const friends =
        getModule(
            "hokmFriends"
        );


    if (
        friends &&
        typeof friends.search === "function"
    ) {

        await friends.search(
            query
        );
    }
}


/* ================================================================
   48. KEYBOARD EVENTS
================================================================ */

function handleKeyboard(
    event
) {

    /*
     * Escape
     */

    if (
        event.key === "Escape"
    ) {

        if (
            appState.modalOpen
        ) {

            closeAllModals();

            return;
        }


        if (
            appState.mobileMenuOpen
        ) {

            closeMobileMenu();

            return;
        }
    }


    /*
     * Enter in chat
     */

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        const target =
            event.target;


        if (
            target?.matches(
                "[data-chat-input]"
            )
        ) {

            event.preventDefault();

            sendChatMessage();
        }
    }
}


/* ================================================================
   49. AUTH UI INITIALIZATION
================================================================ */

function initializeAuthUI() {

    const auth =
        getModule(
            "hokmAuth"
        );


    if (
        !auth
    ) {

        return;
    }


    if (
        typeof auth.isLoggedIn === "function" &&
        auth.isLoggedIn()
    ) {

        $$(
            "[data-auth='logged-in']"
        ).forEach(
            element => {

                showElement(
                    element
                );

            }
        );


        $$(
            "[data-auth='logged-out']"
        ).forEach(
            element => {

                hideElement(
                    element
                );

            }
        );

    } else {

        $$(
            "[data-auth='logged-in']"
        ).forEach(
            element => {

                hideElement(
                    element
                );

            }
        );


        $$(
            "[data-auth='logged-out']"
        ).forEach(
            element => {

                showElement(
                    element
                );

            }
        );
    }


    updateGlobalUserUI();
}


/* ================================================================
   50. DEFAULT HOME
================================================================ */

function initializeDefaultPage() {

    const pages =
        getPageElements();


    const hasActivePage =
        Object.values(
            pages
        ).some(
            page =>
                page &&
                (
                    page.classList.contains(
                        "active"
                    ) ||
                    page.classList.contains(
                        "page-active"
                    )
                )
        );


    if (
        !hasActivePage
    ) {

        showPage(
            "home"
        );
    }
}


/* ================================================================
   51. SETTINGS / UI EVENT BRIDGE
================================================================ */

function setupSettingsEvents() {

    const settings =
        getModule(
            "hokmSettings"
        );


    if (
        !settings
    ) {

        return;
    }


    if (
        typeof settings.on === "function"
    ) {

        settings.on(
            "changed",
            data => {

                appEvents.emit(
                    "settingsChanged",
                    data
                );
            }
        );
    }
}


/* ================================================================
   52. PROFILE EVENT BRIDGE
================================================================ */

function setupProfileEvents() {

    const profile =
        getModule(
            "hokmProfile"
        );


    if (
        !profile
    ) {

        return;
    }


    if (
        typeof profile.on === "function"
    ) {

        profile.on(
            "updated",
            data => {

                updateGlobalUserUI();

                appEvents.emit(
                    "profileUpdated",
                    data
                );
            }
        );
    }
}


/* ================================================================
   53. WALLET EVENT BRIDGE
================================================================ */

function setupWalletEvents() {

    const wallet =
        getModule(
            "hokmWallet"
        );


    if (
        !wallet
    ) {

        return;
    }


    if (
        typeof wallet.on === "function"
    ) {

        wallet.on(
            "balanceChanged",
            balance => {

                updateGlobalUserUI();

                appEvents.emit(
                    "balanceChanged",
                    balance
                );
            }
        );


        wallet.on(
            "transactionCompleted",
            transaction => {

                updateGlobalUserUI();

                appEvents.emit(
                    "transactionCompleted",
                    transaction
                );
            }
        );
    }
}


/* ================================================================
   54. SHOP EVENT BRIDGE
================================================================ */

function setupShopEvents() {

    const shop =
        getModule(
            "hokmShop"
        );


    if (
        !shop
    ) {

        return;
    }


    if (
        typeof shop.on === "function"
    ) {

        shop.on(
            "purchaseCompleted",
            purchase => {

                refreshWallet();

                appEvents.emit(
                    "purchaseCompleted",
                    purchase
                );

            }
        );
    }
}


/* ================================================================
   55. LEADERBOARD EVENT BRIDGE
================================================================ */

function setupLeaderboardEvents() {

    const leaderboard =
        getModule(
            "hokmLeaderboard"
        );


    if (
        !leaderboard
    ) {

        return;
    }


    if (
        typeof leaderboard.on === "function"
    ) {

        leaderboard.on(
            "updated",
            data => {

                appEvents.emit(
                    "leaderboardUpdated",
                    data
                );
            }
        );
    }
}


/* ================================================================
   56. GAME EVENTS
================================================================ */

function setupGameEvents() {

    const game =
        getModule(
            "hokmGame"
        );


    if (
        !game
    ) {

        return;
    }


    if (
        typeof game.on === "function"
    ) {

        game.on(
            "started",
            gameData => {

                appState.currentGame =
                    gameData;


                navigateTo(
                    "game"
                );


                refreshGameUI();

            }
        );


        game.on(
            "finished",
            result => {

                appState.currentGame =
                    null;


                refreshAllUserData();


                appEvents.emit(
                    "gameFinished",
                    result
                );

            }
        );


        game.on(
            "error",
            error => {

                console.error(
                    "Game error:",
                    error
                );


                appToast(
                    "خطایی در بازی رخ داد.",
                    "❌"
                );
            }
        );
    }
}


/* ================================================================
   57. GLOBAL EVENT SETUP
================================================================ */

function setupGlobalEvents() {

    if (
        appState.eventsBound
    ) {

        return;
    }


    document.addEventListener(
        "click",
        handleGlobalClick
    );


    document.addEventListener(
        "submit",
        handleFormSubmit
    );


    document.addEventListener(
        "keydown",
        handleKeyboard
    );


    window.addEventListener(
        "online",
        handleOnline
    );


    window.addEventListener(
        "offline",
        handleOffline
    );


    document.addEventListener(
        "click",
        event => {

            const modal =
                event.target.closest(
                    "[data-modal]"
                );


            if (
                modal &&
                event.target === modal &&
                modal.dataset.closeOnBackdrop === "true"
            ) {

                hideModal(
                    modal
                );
            }
        }
    );


    appState.eventsBound =
        true;
}


/* ================================================================
   58. SETUP MODULE EVENTS
================================================================ */

function setupModuleEvents() {

    setupAuthEvents();

    setupRoomEvents();

    setupMultiplayerEvents();

    setupChatEvents();

    setupNotificationEvents();

    setupFriendEvents();

    setupSettingsEvents();

    setupProfileEvents();

    setupWalletEvents();

    setupShopEvents();

    setupLeaderboardEvents();

    setupGameEvents();
}


/* ================================================================
   59. INITIALIZE CORE MODULES
================================================================ */

async function initializeCoreModules() {

    const modules = [

        "hokmAuth",

        "hokmWallet",

        "hokmShop",

        "hokmProfile",

        "hokmFriends",

        "hokmNotifications",

        "hokmLeaderboard",

        "hokmSettings",

        "hokmRoom",

        "hokmMultiplayer",

        "hokmChat",

        "hokmGameUI"

    ];


    for (
        const moduleName of modules
    ) {

        const module =
            getModule(
                moduleName
            );


        if (
            !module
        ) {

            continue;
        }


        try {

            if (
                typeof module.initialize === "function"
            ) {

                await module.initialize();
            }

        } catch (error) {

            console.error(
                `خطا در initialize ماژول ${moduleName}:`,
                error
            );
        }
    }
}


/* ================================================================
   60. INITIALIZE GAME
================================================================ */

async function initializeGame() {

    const game =
        getModule(
            "hokmGame"
        );


    if (
        !game
    ) {

        return;
    }


    try {

        if (
            typeof game.initialize === "function"
        ) {

            await game.initialize();
        }

    } catch (error) {

        console.error(
            "Game initialization error:",
            error
        );
    }
}


/* ================================================================
   61. INITIALIZE APPLICATION
================================================================ */

async function initializeApplication() {

    if (
        appState.initialized
    ) {

        return;
    }


    appState.loading =
        true;


    appEvents.emit(
        "bootStarted"
    );


    try {

        setupGlobalEvents();


        initializeDefaultPage();


        initializeAuthUI();


        /*
         * صبر برای Auth
         */

        const auth =
            getModule(
                "hokmAuth"
            );


        if (
            auth &&
            typeof auth.initializeAuth === "function"
        ) {

            try {

                await auth.initializeAuth();

            } catch (error) {

                console.error(
                    "Auth initialization error:",
                    error
                );
            }
        }


        /*
         * ماژول‌های اصلی
         */

        await initializeCoreModules();


        /*
         * موتور بازی
         */

        await initializeGame();


        /*
         * Event Bridgeها
         */

        setupModuleEvents();


        /*
         * اطلاعات کاربر
         */

        await refreshAllUserData();


        /*
         * UI بازی
         */

        await refreshGameUI();


        /*
         * صفحه پیش‌فرض
         */

        initializeDefaultPage();


        updateGlobalUserUI();


        appState.initialized =
            true;


        appEvents.emit(
            "ready",
            {

                bootTime:
                    Date.now() -
                    appState.bootTime

            }
        );


        console.log(
            "Hokm Online Application initialized successfully."
        );


    } catch (error) {

        appState.lastError =
            error;


        console.error(
            "خطای اصلی در راه‌اندازی برنامه:",
            error
        );


        appToast(
            "راه‌اندازی بازی با مشکل مواجه شد. صفحه را دوباره باز کنید.",
            "❌",
            5000
        );


        appEvents.emit(
            "bootError",
            error
        );


    } finally {

        appState.loading =
            false;

        appLoading(
            false
        );
    }
}


/* ================================================================
   62. RETRY APPLICATION
================================================================ */

async function retryApplication() {

    appState.initialized =
        false;


    appState.lastError =
        null;


    await initializeApplication();
}


/* ================================================================
   63. PAGE VISIBILITY
================================================================ */

function handleVisibilityChange() {

    if (
        document.hidden
    ) {

        appEvents.emit(
            "appHidden"
        );

        return;
    }


    appEvents.emit(
        "appVisible"
    );


    /*
     * Refresh اطلاعات مهم هنگام برگشت کاربر
     */

    if (
        appState.initialized
    ) {

        refreshAllUserData();

        refreshGameUI();
    }
}


/* ================================================================
   64. BEFORE UNLOAD
================================================================ */

function handleBeforeUnload() {

    appEvents.emit(
        "beforeUnload"
    );


    const multiplayer =
        getModule(
            "hokmMultiplayer"
        );


    /*
     * فقط اجازه می‌دهیم ماژول Multiplayer
     * در صورت نیاز وضعیت خود را مدیریت کند.
     */

    if (
        multiplayer &&
        typeof multiplayer.prepareDisconnect === "function"
    ) {

        try {

            multiplayer.prepareDisconnect();

        } catch (error) {

            console.error(
                "prepareDisconnect error:",
                error
            );
        }
    }
}


/* ================================================================
   65. VISIBILITY EVENTS
================================================================ */

document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
);


window.addEventListener(
    "beforeunload",
    handleBeforeUnload
);


/* ================================================================
   66. APP API
================================================================ */

window.hokmApp = {

    state:
        appState,

    events:
        appEvents,

    navigate:
        navigateTo,

    showPage,

    showModal,

    hideModal,

    closeAllModals,

    openMobileMenu,

    closeMobileMenu,

    toggleMobileMenu,

    startQuickGame,

    createRoom:
        createRoomFromForm,

    joinRoom,

    leaveRoom:
        leaveCurrentRoom,

    startRoomGame,

    refreshShop,

    refreshProfile,

    refreshWallet,

    refreshFriends,

    refreshNotifications,

    refreshLeaderboard,

    refreshSettings,

    refreshGameUI,

    refreshAllUserData,

    updateGlobalUserUI,

    retry:
        retryApplication,

    isOnline() {

        return appState.online;
    },

    isInitialized() {

        return appState.initialized;
    }

};


/* ================================================================
   67. GLOBAL SHORTCUTS
================================================================ */

window.navigateTo =
    navigateTo;


window.startQuickGame =
    startQuickGame;


window.openCreateRoom =
    openCreateRoom;


window.createRoom =
    createRoomFromForm;


window.joinRoom =
    joinRoom;


window.leaveCurrentRoom =
    leaveCurrentRoom;


window.startRoomGame =
    startRoomGame;


window.refreshShop =
    refreshShop;


window.refreshProfile =
    refreshProfile;


window.refreshWallet =
    refreshWallet;


window.refreshFriends =
    refreshFriends;


window.refreshNotifications =
    refreshNotifications;


window.refreshLeaderboard =
    refreshLeaderboard;


window.refreshSettings =
    refreshSettings;


window.refreshGameUI =
    refreshGameUI;


/* ================================================================
   68. DOM READY
================================================================ */

async function bootApplication() {

    try {

        await initializeApplication();

    } catch (error) {

        console.error(
            "Boot error:",
            error
        );
    }
}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        bootApplication,
        {
            once: true
        }
    );

} else {

    bootApplication();
}


/* ================================================================
   69. FINAL STATUS
================================================================ */

console.log(
    "Hokm Online main.js loaded."
);


/* ================================================================
   END OF main.js
================================================================ */
