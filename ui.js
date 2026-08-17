حتماً. این فایل شماره ۱ یعنی ui.js است. این نسخه را کامل جایگزین فایل ui.js کن؛ هیچ بخشی را حذف یا خلاصه نکرده‌ام.

"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * ui.js
 *
 * نسخه کامل سیستم رابط کاربری
 *
 * مسئولیت‌ها:
 *
 * - Toast
 * - Loading
 * - Modal
 * - Confirm Dialog
 * - صفحه‌ها و Navigation
 * - مدیریت پنل‌ها
 * - نمایش سکه
 * - نمایش پروفایل
 * - نمایش سطح و XP
 * - نمایش وضعیت اتصال
 * - نمایش وضعیت بازیکنان
 * - مدیریت منوی موبایل
 * - مدیریت Overlay
 * - مدیریت دکمه Back
 * - انیمیشن‌های عمومی UI
 * - پیام‌های سیستم
 * - مدیریت خطاهای UI
 * - فرمت اعداد فارسی
 * - فرمت زمان
 * - هماهنگی با auth.js
 * - هماهنگی با game.js
 * - هماهنگی با shop.js
 * - آماده برای room.js
 * - آماده برای multiplayer.js
 * - آماده برای chat.js
 * - آماده برای profile.js
 * - آماده برای settings.js
 * - آماده برای wallet.js
 * - آماده برای notifications.js
 * - آماده برای friends.js
 * - آماده برای leaderboard.js
 * - آماده برای game-ui.js
 *
 * نکته:
 * این فایل هیچ‌کدام از سیستم‌های بازی را حذف نمی‌کند.
 * فقط لایه رابط کاربری و ابزارهای عمومی UI را مدیریت می‌کند.
 *
 * ================================================================
 */


/* ================================================================
   1. UI STATE
================================================================ */

const uiState = {

    initialized: false,

    currentPage: "home",

    previousPage: null,

    modalOpen: false,

    loading: false,

    mobileMenuOpen: false,

    overlayOpen: false,

    toastQueue: [],

    toastActive: false,

    activeModalId: null,

    currentConfirm: null,

    notificationsCount: 0,

    unreadMessagesCount: 0,

    online: navigator.onLine,

    darkMode:
        document.documentElement.classList.contains("dark"),

    navigationLocked: false

};


/* ================================================================
   2. UI ELEMENT CACHE
================================================================ */

const uiElements = {

    overlay: null,

    toastContainer: null,

    modalContainer: null,

    loadingContainer: null,

    loadingMessage: null,

    mobileMenu: null,

    mobileMenuButton: null,

    pageContainer: null,

    connectionStatus: null

};


/* ================================================================
   3. EVENT SYSTEM
================================================================ */

const uiEvents = {

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


        this.listeners[eventName].push(callback);
    },


    off(eventName, callback) {

        if (
            !this.listeners[eventName]
        ) {
            return;
        }


        this.listeners[eventName] =
            this.listeners[eventName].filter(
                item => item !== callback
            );
    },


    emit(eventName, data) {

        const listeners =
            this.listeners[eventName] || [];


        listeners.forEach(callback => {

            try {

                callback(data);

            } catch (error) {

                console.error(
                    `UI Event Error: ${eventName}`,
                    error
                );

            }

        });
    }

};


/* ================================================================
   4. DOM HELPERS
================================================================ */

function ui$(selector, parent = document) {

    if (
        !selector
    ) {
        return null;
    }


    return parent.querySelector(selector);
}


function ui$$(selector, parent = document) {

    if (
        !selector
    ) {
        return [];
    }


    return Array.from(
        parent.querySelectorAll(selector)
    );
}


function createElement(
    tagName,
    className = "",
    attributes = {}
) {

    const element =
        document.createElement(tagName);


    if (
        className
    ) {

        element.className =
            className;

    }


    Object.entries(attributes).forEach(
        ([key, value]) => {

            if (
                value === null ||
                value === undefined
            ) {
                return;
            }


            if (
                key === "text"
            ) {

                element.textContent =
                    String(value);

                return;
            }


            if (
                key === "html"
            ) {

                element.innerHTML =
                    String(value);

                return;
            }


            element.setAttribute(
                key,
                String(value)
            );

        }
    );


    return element;
}


/* ================================================================
   5. SAFE HTML
================================================================ */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ================================================================
   6. NUMBER FORMAT
================================================================ */

function formatNumber(
    value,
    locale = "fa-IR"
) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return "۰";
    }


    return number.toLocaleString(
        locale
    );
}


function formatCoins(
    value
) {

    return formatNumber(
        value
    );
}


/* ================================================================
   7. TIME FORMAT
================================================================ */

function formatTime(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        value instanceof Date
            ? value
            : new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    return date.toLocaleTimeString(
        "fa-IR",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        value instanceof Date
            ? value
            : new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    return date.toLocaleDateString(
        "fa-IR",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    );
}


function formatDateTime(
    value
) {

    if (!value) {
        return "";
    }


    return `${formatDate(value)} - ${formatTime(value)}`;
}


/* ================================================================
   8. TEXT HELPERS
================================================================ */

function truncateText(
    value,
    maxLength = 40
) {

    const text =
        String(value ?? "");


    if (
        text.length <= maxLength
    ) {

        return text;
    }


    return (
        text.slice(
            0,
            Math.max(
                0,
                maxLength - 3
            )
        ) +
        "..."
    );
}


function normalizeText(
    value
) {

    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");
}


/* ================================================================
   9. CREATE UI ROOTS
================================================================ */

function ensureUIRoots() {

    /*
     * Toast Container
     */

    let toastContainer =
        document.getElementById(
            "hokm-toast-container"
        );


    if (!toastContainer) {

        toastContainer =
            createElement(
                "div",
                "hokm-toast-container",
                {
                    id:
                        "hokm-toast-container",
                    "aria-live":
                        "polite",
                    "aria-atomic":
                        "true"
                }
            );


        document.body.appendChild(
            toastContainer
        );
    }


    uiElements.toastContainer =
        toastContainer;


    /*
     * Overlay
     */

    let overlay =
        document.getElementById(
            "hokm-ui-overlay"
        );


    if (!overlay) {

        overlay =
            createElement(
                "div",
                "hokm-ui-overlay",
                {
                    id:
                        "hokm-ui-overlay",
                    "aria-hidden":
                        "true"
                }
            );


        document.body.appendChild(
            overlay
        );
    }


    uiElements.overlay =
        overlay;


    /*
     * Modal Container
     */

    let modalContainer =
        document.getElementById(
            "hokm-modal-container"
        );


    if (!modalContainer) {

        modalContainer =
            createElement(
                "div",
                "hokm-modal-container",
                {
                    id:
                        "hokm-modal-container"
                }
            );


        document.body.appendChild(
            modalContainer
        );
    }


    uiElements.modalContainer =
        modalContainer;


    /*
     * Loading
     */

    let loadingContainer =
        document.getElementById(
            "hokm-loading-container"
        );


    if (!loadingContainer) {

        loadingContainer =
            createElement(
                "div",
                "hokm-loading-container",
                {
                    id:
                        "hokm-loading-container",
                    "aria-hidden":
                        "true"
                }
            );


        loadingContainer.innerHTML = `

            <div class="hokm-loading-card">

                <div class="hokm-loading-spinner">

                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>

                </div>

                <div
                    class="hokm-loading-message"
                    id="hokm-loading-message"
                >
                    لطفاً صبر کنید...
                </div>

            </div>

        `;


        document.body.appendChild(
            loadingContainer
        );
    }


    uiElements.loadingContainer =
        loadingContainer;


    uiElements.loadingMessage =
        loadingContainer.querySelector(
            "#hokm-loading-message"
        );


    /*
     * Page Container
     */

    uiElements.pageContainer =
        document.querySelector(
            "[data-page-container]"
        ) ||
        document.querySelector(
            "#app"
        ) ||
        document.querySelector(
            "main"
        );


    /*
     * Mobile Menu
     */

    uiElements.mobileMenu =
        document.querySelector(
            "[data-mobile-menu]"
        ) ||
        document.querySelector(
            "#mobile-menu"
        );


    uiElements.mobileMenuButton =
        document.querySelector(
            "[data-mobile-menu-toggle]"
        ) ||
        document.querySelector(
            "#mobile-menu-toggle"
        );


    /*
     * Connection Status
     */

    uiElements.connectionStatus =
        document.querySelector(
            "[data-connection-status]"
        ) ||
        document.querySelector(
            "#connection-status"
        );
}


/* ================================================================
   10. TOAST SYSTEM
================================================================ */

function showToast(
    message,
    icon = "ℹ️",
    duration = 3000,
    type = "info"
) {

    message =
        normalizeText(message);


    if (!message) {
        return;
    }


    uiState.toastQueue.push({

        message,

        icon,

        duration,

        type

    });


    processToastQueue();
}


function processToastQueue() {

    if (
        uiState.toastActive
    ) {
        return;
    }


    if (
        uiState.toastQueue.length === 0
    ) {
        return;
    }


    const toast =
        uiState.toastQueue.shift();


    uiState.toastActive =
        true;


    renderToast(
        toast
    );
}


function renderToast(
    toast
) {

    ensureUIRoots();


    const element =
        createElement(
            "div",
            `hokm-toast hokm-toast-${toast.type}`
        );


    element.innerHTML = `

        <div class="hokm-toast-icon">
            ${escapeHTML(toast.icon)}
        </div>

        <div class="hokm-toast-content">

            <div class="hokm-toast-message">
                ${escapeHTML(toast.message)}
            </div>

        </div>

        <button
            type="button"
            class="hokm-toast-close"
            aria-label="بستن"
        >
            ×
        </button>

    `;


    const closeButton =
        element.querySelector(
            ".hokm-toast-close"
        );


    let timer = null;


    const removeToast = () => {

        if (!element.isConnected) {
            finishToast();
            return;
        }


        element.classList.add(
            "hokm-toast-hide"
        );


        setTimeout(
            () => {

                element.remove();

                finishToast();

            },
            250
        );
    };


    closeButton.addEventListener(
        "click",
        removeToast
    );


    uiElements.toastContainer.appendChild(
        element
    );


    requestAnimationFrame(() => {

        element.classList.add(
            "hokm-toast-show"
        );

    });


    timer =
        setTimeout(
            removeToast,
            Math.max(
                1000,
                Number(toast.duration) || 3000
            )
        );


    element.addEventListener(
        "mouseenter",
        () => {

            clearTimeout(
                timer
            );

        }
    );


    element.addEventListener(
        "mouseleave",
        () => {

            timer =
                setTimeout(
                    removeToast,
                    1500
                );

        }
    );
}


function finishToast() {

    uiState.toastActive =
        false;


    setTimeout(
        processToastQueue,
        50
    );
}


/* ================================================================
   11. TOAST SHORTCUTS
================================================================ */

function showSuccess(
    message,
    duration = 3000
) {

    showToast(
        message,
        "✅",
        duration,
        "success"
    );
}


function showError(
    message,
    duration = 4000
) {

    showToast(
        message,
        "❌",
        duration,
        "error"
    );
}


function showWarning(
    message,
    duration = 3500
) {

    showToast(
        message,
        "⚠️",
        duration,
        "warning"
    );
}


function showInfo(
    message,
    duration = 3000
) {

    showToast(
        message,
        "ℹ️",
        duration,
        "info"
    );
}


function showGameToast(
    message,
    duration = 3000
) {

    showToast(
        message,
        "🎮",
        duration,
        "game"
    );
}


function showCoinToast(
    message,
    duration = 3000
) {

    showToast(
        message,
        "🪙",
        duration,
        "coin"
    );
}


/* ================================================================
   12. LOADING SYSTEM
================================================================ */

function showLoading(
    message = "لطفاً صبر کنید..."
) {

    ensureUIRoots();


    uiState.loading =
        true;


    uiElements.loadingMessage.textContent =
        message;


    uiElements.loadingContainer.classList.add(
        "active"
    );


    uiElements.loadingContainer.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "hokm-ui-loading"
    );


    uiEvents.emit(
        "loading",
        {
            visible: true,
            message
        }
    );
}


function hideLoading() {

    ensureUIRoots();


    uiState.loading =
        false;


    uiElements.loadingContainer.classList.remove(
        "active"
    );


    uiElements.loadingContainer.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "hokm-ui-loading"
    );


    uiEvents.emit(
        "loading",
        {
            visible: false
        }
    );
}


/* ================================================================
   13. OVERLAY
================================================================ */

function showOverlay(
    options = {}
) {

    ensureUIRoots();


    const {
        closeOnClick = true,
        className = ""
    } = options;


    uiState.overlayOpen =
        true;


    uiElements.overlay.classList.add(
        "active"
    );


    if (
        className
    ) {

        uiElements.overlay.classList.add(
            className
        );

    }


    uiElements.overlay.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "hokm-overlay-open"
    );


    if (
        closeOnClick
    ) {

        uiElements.overlay.dataset.closeOnClick =
            "true";

    } else {

        uiElements.overlay.dataset.closeOnClick =
            "false";

    }


    uiEvents.emit(
        "overlay",
        {
            visible: true
        }
    );
}


function hideOverlay() {

    ensureUIRoots();


    uiState.overlayOpen =
        false;


    uiElements.overlay.classList.remove(
        "active"
    );


    uiElements.overlay.setAttribute(
        "aria-hidden",
        "true"
    );


    uiElements.overlay.className =
        "hokm-ui-overlay";


    delete uiElements.overlay.dataset.closeOnClick;


    document.body.classList.remove(
        "hokm-overlay-open"
    );


    uiEvents.emit(
        "overlay",
        {
            visible: false
        }
    );
}


/* ================================================================
   14. MODAL SYSTEM
================================================================ */

function showModal(
    options = {}
) {

    ensureUIRoots();


    const {

        id =
            `modal-${Date.now()}`,

        title =
            "",

        message =
            "",

        content =
            "",

        icon =
            "ℹ️",

        buttons =
            [],

        closeOnOverlay =
            true,

        closeOnEscape =
            true,

        className =
            "",

        showClose =
            true,

        width =
            "normal"

    } = options;


    if (
        uiState.modalOpen
    ) {

        closeModal(
            uiState.activeModalId
        );
    }


    const modal =
        createElement(
            "div",
            `hokm-modal ${className} hokm-modal-${width}`,
            {
                id
            }
        );


    const buttonList =
        Array.isArray(buttons)
            ? buttons
            : [];


    let buttonsHTML =
        "";


    buttonList.forEach(
        (button, index) => {

            const type =
                button.type ||
                "secondary";


            buttonsHTML += `

                <button
                    type="button"
                    class="hokm-modal-button hokm-modal-button-${escapeHTML(type)}"
                    data-modal-button="${index}"
                >
                    ${
                        escapeHTML(
                            button.icon || ""
                        )
                    }
                    ${
                        escapeHTML(
                            button.text ||
                            button.label ||
                            "باشه"
                        )
                    }
                </button>

            `;

        }
    );


    modal.innerHTML = `

        <div
            class="hokm-modal-backdrop"
            data-modal-backdrop
        ></div>

        <div
            class="hokm-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="${id}-title"
        >

            <div class="hokm-modal-header">

                <div class="hokm-modal-title-wrapper">

                    <div class="hokm-modal-icon">
                        ${escapeHTML(icon)}
                    </div>

                    <h3
                        class="hokm-modal-title"
                        id="${id}-title"
                    >
                        ${escapeHTML(title)}
                    </h3>

                </div>

                ${
                    showClose
                        ? `
                            <button
                                type="button"
                                class="hokm-modal-close"
                                data-modal-close
                                aria-label="بستن"
                            >
                                ×
                            </button>
                        `
                        : ""
                }

            </div>

            <div class="hokm-modal-body">

                ${
                    message
                        ? `
                            <p class="hokm-modal-message">
                                ${escapeHTML(message)}
                            </p>
                        `
                        : ""
                }

                ${
                    content
                        ? `
                            <div class="hokm-modal-content">
                                ${content}
                            </div>
                        `
                        : ""
                }

            </div>

            ${
                buttonList.length
                    ? `
                        <div class="hokm-modal-footer">
                            ${buttonsHTML}
                        </div>
                    `
                    : ""
            }

        </div>

    `;


    uiElements.modalContainer.appendChild(
        modal
    );


    uiState.modalOpen =
        true;


    uiState.activeModalId =
        id;


    document.body.classList.add(
        "hokm-modal-open"
    );


    if (
        closeOnOverlay
    ) {

        const backdrop =
            modal.querySelector(
                "[data-modal-backdrop]"
            );


        backdrop?.addEventListener(
            "click",
            () => {

                closeModal(id);

            }
        );
    }


    const closeButton =
        modal.querySelector(
            "[data-modal-close]"
        );


    closeButton?.addEventListener(
        "click",
        () => {

            closeModal(id);

        }
    );


    modal
        .querySelectorAll(
            "[data-modal-button]"
        )
        .forEach(
            buttonElement => {

                const index =
                    Number(
                        buttonElement.dataset.modalButton
                    );


                const buttonData =
                    buttonList[index];


                buttonElement.addEventListener(
                    "click",
                    async () => {

                        let shouldClose =
                            buttonData.close !== false;


                        if (
                            typeof buttonData.onClick ===
                            "function"
                        ) {

                            try {

                                const result =
                                    await buttonData.onClick();


                                if (
                                    result === false
                                ) {

                                    shouldClose =
                                        false;
                                }

                            } catch (error) {

                                console.error(
                                    "خطا در دکمه Modal:",
                                    error
                                );

                            }

                        }


                        if (
                            shouldClose
                        ) {

                            closeModal(id);

                        }

                    }
                );

            }
        );


    if (
        closeOnEscape
    ) {

        modal.dataset.closeOnEscape =
            "true";

    } else {

        modal.dataset.closeOnEscape =
            "false";

    }


    requestAnimationFrame(() => {

        modal.classList.add(
            "active"
        );

    });


    uiEvents.emit(
        "modalOpened",
        {
            id,
            modal
        }
    );


    return modal;
}


function closeModal(
    id = null
) {

    const modalId =
        id ||
        uiState.activeModalId;


    if (!modalId) {
        return;
    }


    const modal =
        document.getElementById(
            modalId
        );


    if (!modal) {

        uiState.modalOpen =
            false;

        uiState.activeModalId =
            null;

        document.body.classList.remove(
            "hokm-modal-open"
        );

        return;
    }


    modal.classList.remove(
        "active"
    );


    setTimeout(
        () => {

            modal.remove();


            if (
                uiState.activeModalId ===
                modalId
            ) {

                uiState.activeModalId =
                    null;

                uiState.modalOpen =
                    false;

                document.body.classList.remove(
                    "hokm-modal-open"
                );

            }

        },
        220
    );


    uiEvents.emit(
        "modalClosed",
        {
            id: modalId
        }
    );
}


/* ================================================================
   15. CONFIRM DIALOG
================================================================ */

function showConfirm(
    options = {}
) {

    const {

        title =
            "تأیید عملیات",

        message =
            "آیا مطمئن هستید؟",

        icon =
            "❓",

        confirmText =
            "تأیید",

        cancelText =
            "انصراف",

        confirmType =
            "primary",

        onConfirm =
            null,

        onCancel =
            null

    } = options;


    const modalId =
        `confirm-${Date.now()}`;


    return showModal({

        id:
            modalId,

        title,

        message,

        icon,

        width:
            "small",

        buttons: [

            {

                text:
                    cancelText,

                type:
                    "secondary",

                close:
                    true,

                onClick:
                    async () => {

                        if (
                            typeof onCancel ===
                            "function"
                        ) {

                            await onCancel();

                        }

                    }

            },

            {

                text:
                    confirmText,

                type:
                    confirmType,

                close:
                    true,

                onClick:
                    async () => {

                        if (
                            typeof onConfirm ===
                            "function"
                        ) {

                            await onConfirm();

                        }

                    }

            }

        ]

    });
}


/* ================================================================
   16. ALERT DIALOG
================================================================ */

function showAlert(
    message,
    options = {}
) {

    const {

        title =
            "پیام",

        icon =
            "ℹ️",

        buttonText =
            "باشه",

        type =
            "primary",

        onClose =
            null

    } = options;


    return showModal({

        title,

        message,

        icon,

        width:
            "small",

        buttons: [

            {

                text:
                    buttonText,

                type,

                onClick:
                    async () => {

                        if (
                            typeof onClose ===
                            "function"
                        ) {

                            await onClose();

                        }

                    }

            }

        ]

    });
}


/* ================================================================
   17. NAVIGATION
================================================================ */

function navigateTo(
    page,
    options = {}
) {

    page =
        normalizeText(page);


    if (!page) {
        return;
    }


    if (
        uiState.navigationLocked
    ) {
        return;
    }


    const {

        pushHistory =
            true,

        closeMenu =
            true,

        scrollTop =
            true,

        silent =
            false

    } = options;


    uiState.previousPage =
        uiState.currentPage;


    uiState.currentPage =
        page;


    if (
        pushHistory
    ) {

        try {

            history.pushState(
                {
                    hokmPage:
                        page
                },
                "",
                `#${encodeURIComponent(page)}`
            );

        } catch (error) {

            console.warn(
                "Navigation history error:",
                error
            );

        }

    }


    /*
     * Data-page elements
     */

    const pages =
        ui$$(
            "[data-page]"
        );


    pages.forEach(
        element => {

            const elementPage =
                element.dataset.page;


            const active =
                elementPage === page;


            element.classList.toggle(
                "active",
                active
            );


            element.setAttribute(
                "aria-hidden",
                active
                    ? "false"
                    : "true"
            );


            if (
                active
            ) {

                element.removeAttribute(
                    "hidden"
                );

            } else {

                element.setAttribute(
                    "hidden",
                    ""
                );

            }

        }
    );


    /*
     * Navigation links
     */

    const navigationItems =
        ui$$(
            "[data-navigate]"
        );


    navigationItems.forEach(
        element => {

            const target =
                element.dataset.navigate;


            element.classList.toggle(
                "active",
                target === page
            );

        }
    );


    if (
        closeMenu
    ) {

        closeMobileMenu();

    }


    if (
        scrollTop
    ) {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    if (
        !silent
    ) {

        uiEvents.emit(
            "navigation",
            {
                page,
                previousPage:
                    uiState.previousPage
            }
        );

    }


    return page;
}


function goBack() {

    if (
        uiState.previousPage
    ) {

        const previous =
            uiState.previousPage;


        navigateTo(
            previous
        );


        return;
    }


    if (
        history.length > 1
    ) {

        history.back();

    }

}


/* ================================================================
   18. MOBILE MENU
================================================================ */

function openMobileMenu() {

    const menu =
        uiElements.mobileMenu ||
        document.querySelector(
            "[data-mobile-menu]"
        );


    if (!menu) {
        return;
    }


    uiState.mobileMenuOpen =
        true;


    menu.classList.add(
        "active"
    );


    menu.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "hokm-mobile-menu-open"
    );


    showOverlay({
        closeOnClick:
            true
    });


    uiEvents.emit(
        "mobileMenu",
        {
            open: true
        }
    );
}


function closeMobileMenu() {

    const menu =
        uiElements.mobileMenu ||
        document.querySelector(
            "[data-mobile-menu]"
        );


    uiState.mobileMenuOpen =
        false;


    if (menu) {

        menu.classList.remove(
            "active"
        );


        menu.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    document.body.classList.remove(
        "hokm-mobile-menu-open"
    );


    if (
        !uiState.modalOpen
    ) {

        hideOverlay();

    }


    uiEvents.emit(
        "mobileMenu",
        {
            open: false
        }
    );
}


function toggleMobileMenu() {

    if (
        uiState.mobileMenuOpen
    ) {

        closeMobileMenu();

    } else {

        openMobileMenu();

    }
}


/* ================================================================
   19. CONNECTION STATUS
================================================================ */

function updateConnectionStatus(
    online =
        navigator.onLine
) {

    uiState.online =
        Boolean(online);


    const elements =
        ui$$(
            "[data-connection-status]"
        );


    elements.forEach(
        element => {

            element.classList.toggle(
                "online",
                uiState.online
            );


            element.classList.toggle(
                "offline",
                !uiState.online
            );


            element.textContent =
                uiState.online
                    ? "متصل"
                    : "آفلاین";

        }
    );


    if (
        !uiState.online
    ) {

        showWarning(
            "اتصال اینترنت قطع شده است.",
            4000
        );

    } else {

        uiEvents.emit(
            "connectionRestored"
        );

    }


    uiEvents.emit(
        "connectionChanged",
        {
            online:
                uiState.online
        }
    );
}


/* ================================================================
   20. UPDATE USER UI
================================================================ */

function updateUserUI(
    profile = null
) {

    let currentProfile =
        profile;


    if (
        !currentProfile &&
        window.hokmAuth &&
        typeof window.hokmAuth.getCurrentProfile ===
            "function"
    ) {

        currentProfile =
            window.hokmAuth.getCurrentProfile();

    }


    const user =
        window.hokmAuth &&
        typeof window.hokmAuth.getCurrentUser ===
            "function"
            ? window.hokmAuth.getCurrentUser()
            : null;


    const name =
        currentProfile?.display_name ||
        currentProfile?.username ||
        user?.user_metadata?.display_name ||
        user?.user_metadata?.username ||
        "بازیکن";


    /*
     * Name
     */

    ui$$(
        "[data-user-name]"
    ).forEach(
        element => {

            element.textContent =
                name;

        }
    );


    /*
     * Email
     */

    ui$$(
        "[data-user-email]"
    ).forEach(
        element => {

            element.textContent =
                user?.email || "";

        }
    );


    /*
     * Coins
     */

    if (
        currentProfile?.coins !== undefined
    ) {

        updateCoinsUI(
            currentProfile.coins
        );

    }


    /*
     * Level
     */

    if (
        currentProfile?.level !== undefined
    ) {

        updateLevelUI(
            currentProfile.level
        );

    }


    /*
     * XP
     */

    if (
        currentProfile?.experience !== undefined
    ) {

        updateXPUI(
            currentProfile.experience,
            currentProfile.level
        );

    }


    /*
     * Avatar
     */

    const avatar =
        currentProfile?.avatar_url ||
        user?.user_metadata?.avatar_url ||
        "";


    if (avatar) {

        ui$$(
            "[data-user-avatar]"
        ).forEach(
            element => {

                if (
                    element.tagName === "IMG"
                ) {

                    element.src =
                        avatar;

                    element.alt =
                        name;

                } else {

                    element.style.backgroundImage =
                        `url("${avatar}")`;

                }

            }
        );

    }


    uiEvents.emit(
        "userUIUpdated",
        {
            profile:
                currentProfile,
            user,
            name
        }
    );
}


/* ================================================================
   21. UPDATE COINS UI
================================================================ */

function updateCoinsUI(
    coins
) {

    const value =
        Number(coins);


    if (
        !Number.isFinite(value)
    ) {
        return;
    }


    ui$$(
        "[data-user-coins]"
    ).forEach(
        element => {

            element.textContent =
                formatCoins(value);

            element.dataset.value =
                String(value);

        }
    );


    ui$$(
        "[data-coins]"
    ).forEach(
        element => {

            element.textContent =
                formatCoins(value);

            element.dataset.value =
                String(value);

        }
    );


    /*
     * Game state synchronization
     */

    if (
        window.state?.player
    ) {

        window.state.player.coins =
            value;

    }


    uiEvents.emit(
        "coinsUpdated",
        {
            coins:
                value
        }
    );
}


/* ================================================================
   22. COIN ANIMATION
================================================================ */

function animateCoins(
    from,
    to,
    duration = 700
) {

    const start =
        Number(from);


    const end =
        Number(to);


    if (
        !Number.isFinite(start) ||
        !Number.isFinite(end)
    ) {
        return;
    }


    const difference =
        end - start;


    const startTime =
        performance.now();


    function frame(
        currentTime
    ) {

        const elapsed =
            currentTime -
            startTime;


        const progress =
            Math.min(
                1,
                elapsed / duration
            );


        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );


        const current =
            Math.round(
                start +
                difference * eased
            );


        updateCoinsUI(
            current
        );


        if (
            progress < 1
        ) {

            requestAnimationFrame(
                frame
            );

        } else {

            updateCoinsUI(
                end
            );

        }

    }


    requestAnimationFrame(
        frame
    );
}


/* ================================================================
   23. UPDATE LEVEL UI
================================================================ */

function updateLevelUI(
    level
) {

    const value =
        Number(level);


    if (
        !Number.isFinite(value)
    ) {
        return;
    }


    ui$$(
        "[data-user-level]"
    ).forEach(
        element => {

            element.textContent =
                formatNumber(value);

        }
    );


    ui$$(
        "[data-level]"
    ).forEach(
        element => {

            element.textContent =
                formatNumber(value);

        }
    );


    uiEvents.emit(
        "levelUpdated",
        {
            level:
                value
        }
    );
}


/* ================================================================
   24. UPDATE XP UI
================================================================ */

function updateXPUI(
    experience,
    level = 1
) {

    const xp =
        Math.max(
            0,
            Number(experience) || 0
        );


    const currentLevel =
        Math.max(
            1,
            Number(level) || 1
        );


    /*
     * سیستم XP پایه:
     * هر سطح 1000 XP
     */

    const xpPerLevel =
        1000;


    const levelBase =
        (currentLevel - 1) *
        xpPerLevel;


    const currentXP =
        Math.max(
            0,
            xp - levelBase
        );


    const percentage =
        Math.min(
            100,
            (
                currentXP /
                xpPerLevel
            ) *
            100
        );


    ui$$(
        "[data-user-xp]"
    ).forEach(
        element => {

            element.textContent =
                formatNumber(xp);

        }
    );


    ui$$(
        "[data-xp]"
    ).forEach(
        element => {

            element.textContent =
                formatNumber(xp);

        }
    );


    ui$$(
        "[data-xp-progress]"
    ).forEach(
        element => {

            element.style.width =
                `${percentage}%`;

            element.setAttribute(
                "aria-valuenow",
                String(
                    Math.round(
                        percentage
                    )
                )
            );

        }
    );


    ui$$(
        "[data-xp-current]"
    ).forEach(
        element => {

            element.textContent =
                formatNumber(
                    currentXP
                );

        }
    );


    ui$$(
        "[data-xp-required]"
    ).forEach(
        element => {

            element.textContent =
                formatNumber(
                    xpPerLevel
                );

        }
    );


    uiEvents.emit(
        "xpUpdated",
        {
            experience:
                xp,

            level:
                currentLevel,

            percentage
        }
    );
}


/* ================================================================
   25. UPDATE AUTH VISIBILITY
================================================================ */

function updateAuthVisibility() {

    let loggedIn =
        false;


    if (
        window.hokmAuth &&
        typeof window.hokmAuth.isLoggedIn ===
            "function"
    ) {

        loggedIn =
            window.hokmAuth.isLoggedIn();

    }


    ui$$(
        "[data-auth='logged-in']"
    ).forEach(
        element => {

            element.style.display =
                loggedIn
                    ? ""
                    : "none";

        }
    );


    ui$$(
        "[data-auth='logged-out']"
    ).forEach(
        element => {

            element.style.display =
                loggedIn
                    ? "none"
                    : "";

        }
    );


    ui$$(
        "[data-auth-required]"
    ).forEach(
        element => {

            element.classList.toggle(
                "authenticated",
                loggedIn
            );

        }
    );


    uiEvents.emit(
        "authVisibilityUpdated",
        {
            loggedIn
        }
    );
}


/* ================================================================
   26. GAME UI HELPERS
================================================================ */

function updateGameStatus(
    message,
    type = "info"
) {

    ui$$(
        "[data-game-status]"
    ).forEach(
        element => {

            element.textContent =
                message;


            element.dataset.status =
                type;

        }
    );


    uiEvents.emit(
        "gameStatusUpdated",
        {
            message,
            type
        }
    );
}


function updateTurnUI(
    seat = null,
    playerName = ""
) {

    ui$$(
        "[data-current-turn]"
    ).forEach(
        element => {

            element.classList.remove(
                "active"
            );


            if (
                seat !== null &&
                Number(
                    element.dataset.currentTurn
                ) === Number(seat)
            ) {

                element.classList.add(
                    "active"
                );

            }

        }
    );


    ui$$(
        "[data-turn-name]"
    ).forEach(
        element => {

            element.textContent =
                playerName ||
                "نوبت بازیکن";

        }
    );


    uiEvents.emit(
        "turnUpdated",
        {
            seat,
            playerName
        }
    );
}


/* ================================================================
   27. SCORE UI
================================================================ */

function updateScoreUI(
    teamA,
    teamB
) {

    const scoreA =
        Number(teamA) || 0;


    const scoreB =
        Number(teamB) || 0;


    ui$$(
        "[data-team-a-score]"
    ).forEach(
        element => {

            element.textContent =
                formatNumber(scoreA);

        }
    );


    ui$$(
        "[data-team-b-score]"
    ).forEach(
        element => {

            element.textContent =
                formatNumber(scoreB);

        }
    );


    uiEvents.emit(
        "scoreUpdated",
        {
            teamA:
                scoreA,

            teamB:
                scoreB
        }
    );
}


/* ================================================================
   28. TRICK UI
================================================================ */

function updateTrickUI(
    teamATricks,
    teamBTricks
) {

    const a =
        Number(teamATricks) || 0;


    const b =
        Number(teamBTricks) || 0;


    ui$$(
        "[data-team-a-tricks]"
    ).forEach(
        element => {

            element.textContent =
                formatNumber(a);

        }
    );


    ui$$(
        "[data-team-b-tricks]"
    ).forEach(
        element => {

            element.textContent =
                formatNumber(b);

        }
    );


    uiEvents.emit(
        "tricksUpdated",
        {
            teamA:
                a,

            teamB:
                b
        }
    );
}


/* ================================================================
   29. CARD UI HELPERS
================================================================ */

function setCardSelected(
    cardElement,
    selected
) {

    if (!cardElement) {
        return;
    }


    cardElement.classList.toggle(
        "selected",
        Boolean(selected)
    );


    cardElement.setAttribute(
        "aria-pressed",
        selected
            ? "true"
            : "false"
    );
}


function clearSelectedCards(
    container = document
) {

    container
        .querySelectorAll(
            ".card.selected, [data-card].selected"
        )
        .forEach(
            element => {

                setCardSelected(
                    element,
                    false
                );

            }
        );
}


/* ================================================================
   30. PLAYER SEAT UI
================================================================ */

function updatePlayerSeat(
    seat,
    data = {}
) {

    const element =
        document.querySelector(
            `[data-seat="${seat}"]`
        );


    if (!element) {
        return;
    }


    const {

        name =
            "بازیکن",

        avatar =
            "",

        online =
            false,

        ready =
            false,

        team =
            ""

    } = data;


    const nameElement =
        element.querySelector(
            "[data-seat-name]"
        );


    if (nameElement) {

        nameElement.textContent =
            name;

    }


    const avatarElement =
        element.querySelector(
            "[data-seat-avatar]"
        );


    if (
        avatarElement &&
        avatar
    ) {

        if (
            avatarElement.tagName === "IMG"
        ) {

            avatarElement.src =
                avatar;

        } else {

            avatarElement.style.backgroundImage =
                `url("${avatar}")`;

        }

    }


    element.classList.toggle(
        "online",
        Boolean(online)
    );


    element.classList.toggle(
        "ready",
        Boolean(ready)
    );


    if (team) {

        element.dataset.team =
            team;

    }

}


/* ================================================================
   31. NOTIFICATION BADGE
================================================================ */

function updateNotificationBadge(
    count
) {

    const value =
        Math.max(
            0,
            Number(count) || 0
        );


    uiState.notificationsCount =
        value;


    ui$$(
        "[data-notification-count]"
    ).forEach(
        element => {

            element.textContent =
                formatNumber(value);


            element.classList.toggle(
                "visible",
                value > 0
            );


            element.hidden =
                value <= 0;

        }
    );


    uiEvents.emit(
        "notificationCountUpdated",
        {
            count:
                value
        }
    );
}


/* ================================================================
   32. CHAT BADGE
================================================================ */

function updateChatBadge(
    count
) {

    const value =
        Math.max(
            0,
            Number(count) || 0
        );


    uiState.unreadMessagesCount =
        value;


    ui$$(
        "[data-chat-count]"
    ).forEach(
        element => {

            element.textContent =
                formatNumber(value);


            element.classList.toggle(
                "visible",
                value > 0
            );


            element.hidden =
                value <= 0;

        }
    );


    uiEvents.emit(
        "chatCountUpdated",
        {
            count:
                value
        }
    );
}


/* ================================================================
   33. SHOP UI HELPERS
================================================================ */

function updateShopBalance(
    coins
) {

    updateCoinsUI(
        coins
    );
}


function showPurchaseResult(
    success,
    message,
    item = null
) {

    if (
        success
    ) {

        showSuccess(
            message ||
            "خرید با موفقیت انجام شد."
        );

    } else {

        showError(
            message ||
            "خرید انجام نشد."
        );

    }


    uiEvents.emit(
        "purchaseResult",
        {
            success,
            message,
            item
        }
    );
}


/* ================================================================
   34. ROOM UI HELPERS
================================================================ */

function updateRoomStatus(
    status,
    message = ""
) {

    ui$$(
        "[data-room-status]"
    ).forEach(
        element => {

            element.dataset.status =
                status;


            if (message) {

                element.textContent =
                    message;

            }

        }
    );


    uiEvents.emit(
        "roomStatusUpdated",
        {
            status,
            message
        }
    );
}


function updateRoomCode(
    code
) {

    ui$$(
        "[data-room-code]"
    ).forEach(
        element => {

            element.textContent =
                code || "---";

        }
    );


    uiEvents.emit(
        "roomCodeUpdated",
        {
            code
        }
    );
}


/* ================================================================
   35. COPY TO CLIPBOARD
================================================================ */

async function copyToClipboard(
    text,
    successMessage = "کپی شد."
) {

    text =
        String(text ?? "");


    if (!text) {
        return false;
    }


    try {

        if (
            navigator.clipboard &&
            typeof navigator.clipboard.writeText ===
                "function"
        ) {

            await navigator.clipboard.writeText(
                text
            );

        } else {

            const textarea =
                document.createElement(
                    "textarea"
                );


            textarea.value =
                text;


            textarea.style.position =
                "fixed";

            textarea.style.opacity =
                "0";


            document.body.appendChild(
                textarea
            );


            textarea.select();


            document.execCommand(
                "copy"
            );


            textarea.remove();

        }


        showSuccess(
            successMessage
        );


        return true;

    } catch (error) {

        console.error(
            "Clipboard error:",
            error
        );


        showError(
            "کپی کردن انجام نشد."
        );


        return false;
    }
}


/* ================================================================
   36. SHARE
================================================================ */

async function shareContent(
    data = {}
) {

    const {

        title =
            "HOKM ONLINE",

        text =
            "",

        url =
            window.location.href

    } = data;


    try {

        if (
            navigator.share
        ) {

            await navigator.share({

                title,

                text,

                url

            });


            return true;
        }


        return await copyToClipboard(
            url,
            "لینک کپی شد."
        );

    } catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            return false;
        }


        console.error(
            "Share error:",
            error
        );


        return false;
    }
}


/* ================================================================
   37. DISABLE BUTTON
================================================================ */

function setButtonLoading(
    button,
    loading,
    loadingText = "در حال پردازش..."
) {

    if (!button) {
        return;
    }


    if (
        typeof button === "string"
    ) {

        button =
            document.querySelector(
                button
            );

    }


    if (!button) {
        return;
    }


    if (
        loading
    ) {

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent;

        }


        button.disabled =
            true;


        button.classList.add(
            "loading"
        );


        button.textContent =
            loadingText;

    } else {

        button.disabled =
            false;


        button.classList.remove(
            "loading"
        );


        if (
            button.dataset.originalText
        ) {

            button.textContent =
                button.dataset.originalText;

            delete button.dataset.originalText;

        }

    }
}


/* ================================================================
   38. DISABLE UI
================================================================ */

function setUIEnabled(
    enabled
) {

    const disabled =
        !enabled;


    ui$$(
        "[data-ui-control]"
    ).forEach(
        element => {

            element.disabled =
                disabled;

        }
    );


    uiState.navigationLocked =
        disabled;


    document.body.classList.toggle(
        "hokm-ui-disabled",
        disabled
    );
}


/* ================================================================
   39. EMPTY STATE
================================================================ */

function renderEmptyState(
    container,
    options = {}
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


    const {

        icon =
            "📭",

        title =
            "چیزی پیدا نشد",

        message =
            "",

        buttonText =
            "",

        onClick =
            null

    } = options;


    container.innerHTML = `

        <div class="hokm-empty-state">

            <div class="hokm-empty-icon">
                ${escapeHTML(icon)}
            </div>

            <h3 class="hokm-empty-title">
                ${escapeHTML(title)}
            </h3>

            ${
                message
                    ? `
                        <p class="hokm-empty-message">
                            ${escapeHTML(message)}
                        </p>
                    `
                    : ""
            }

            ${
                buttonText
                    ? `
                        <button
                            type="button"
                            class="hokm-empty-button"
                            data-empty-action
                        >
                            ${escapeHTML(buttonText)}
                        </button>
                    `
                    : ""
            }

        </div>

    `;


    if (
        typeof onClick === "function"
    ) {

        const button =
            container.querySelector(
                "[data-empty-action]"
            );


        button?.addEventListener(
            "click",
            onClick
        );

    }
}


/* ================================================================
   40. ERROR STATE
================================================================ */

function renderErrorState(
    container,
    options = {}
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


    const {

        title =
            "خطایی رخ داد",

        message =
            "لطفاً دوباره تلاش کنید.",

        retryText =
            "تلاش مجدد",

        onRetry =
            null

    } = options;


    container.innerHTML = `

        <div class="hokm-error-state">

            <div class="hokm-error-icon">
                ⚠️
            </div>

            <h3 class="hokm-error-title">
                ${escapeHTML(title)}
            </h3>

            <p class="hokm-error-message">
                ${escapeHTML(message)}
            </p>

            ${
                retryText
                    ? `
                        <button
                            type="button"
                            class="hokm-error-button"
                            data-error-retry
                        >
                            ${escapeHTML(retryText)}
                        </button>
                    `
                    : ""
            }

        </div>

    `;


    if (
        typeof onRetry === "function"
    ) {

        container
            .querySelector(
                "[data-error-retry]"
            )
            ?.addEventListener(
                "click",
                onRetry
            );

    }
}


/* ================================================================
   41. CONFIRM START GAME
================================================================ */

function confirmStartGame(
    onConfirm
) {

    return showConfirm({

        title:
            "شروع بازی",

        message:
            "برای شروع این بازی ۴۰۰ سکه از موجودی شما کسر می‌شود. آیا می‌خواهید بازی را شروع کنید؟",

        icon:
            "🎮",

        confirmText:
            "شروع بازی",

        cancelText:
            "انصراف",

        confirmType:
            "primary",

        onConfirm

    });
}


/* ================================================================
   42. CONFIRM EXIT GAME
================================================================ */

function confirmExitGame(
    onConfirm
) {

    return showConfirm({

        title:
            "خروج از بازی",

        message:
            "آیا مطمئن هستید که می‌خواهید از بازی خارج شوید؟",

        icon:
            "🚪",

        confirmText:
            "خروج",

        cancelText:
            "ادامه بازی",

        confirmType:
            "danger",

        onConfirm

    });
}


/* ================================================================
   43. CONFIRM PURCHASE
================================================================ */

function confirmPurchase(
    item,
    onConfirm
) {

    const name =
        item?.name ||
        "این آیتم";


    const price =
        formatCoins(
            item?.price || 0
        );


    return showConfirm({

        title:
            "تأیید خرید",

        message:
            `آیا می‌خواهید «${name}» را با ${price} سکه خریداری کنید؟`,

        icon:
            "🛒",

        confirmText:
            "خرید",

        cancelText:
            "انصراف",

        confirmType:
            "primary",

        onConfirm

    });
}


/* ================================================================
   44. GAME RESULT
================================================================ */

function showGameResult(
    result = {}
) {

    const {

        title =
            "نتیجه بازی",

        winner =
            "",

        scoreA =
            0,

        scoreB =
            0,

        coinsChange =
            0,

        message =
            ""

    } = result;


    const coinsText =
        Number(coinsChange) >= 0
            ? `+${formatCoins(coinsChange)}`
            : `-${formatCoins(Math.abs(coinsChange))}`;


    return showModal({

        title,

        icon:
            winner
                ? "🏆"
                : "🎮",

        width:
            "normal",

        content: `

            <div class="hokm-result">

                ${
                    winner
                        ? `
                            <div class="hokm-result-winner">
                                🏆
                                <strong>
                                    ${escapeHTML(winner)}
                                </strong>
                            </div>
                        `
                        : ""
                }

                <div class="hokm-result-score">

                    <div class="hokm-result-team">

                        <span>
                            تیم A
                        </span>

                        <strong>
                            ${formatNumber(scoreA)}
                        </strong>

                    </div>

                    <div class="hokm-result-divider">
                        :
                    </div>

                    <div class="hokm-result-team">

                        <span>
                            تیم B
                        </span>

                        <strong>
                            ${formatNumber(scoreB)}
                        </strong>

                    </div>

                </div>

                <div class="hokm-result-coins">

                    <span>
                        تغییر سکه
                    </span>

                    <strong>
                        ${coinsText}
                    </strong>

                </div>

                ${
                    message
                        ? `
                            <p class="hokm-result-message">
                                ${escapeHTML(message)}
                            </p>
                        `
                        : ""
                }

            </div>

        `,

        buttons: [

            {

                text:
                    "ادامه",

                type:
                    "primary"

            }

        ]

    });
}


/* ================================================================
   45. LEVEL UP
================================================================ */

function showLevelUp(
    level
) {

    const value =
        Number(level) || 1;


    return showModal({

        title:
            "تبریک! 🎉",

        icon:
            "⭐",

        width:
            "small",

        content: `

            <div class="hokm-level-up">

                <div class="hokm-level-up-icon">
                    ⭐
                </div>

                <div class="hokm-level-up-text">
                    سطح شما افزایش یافت!
                </div>

                <div class="hokm-level-up-number">
                    ${formatNumber(value)}
                </div>

            </div>

        `,

        buttons: [

            {

                text:
                    "عالیه!",

                type:
                    "primary"

            }

        ]

    });
}


/* ================================================================
   46. DAILY REWARD
================================================================ */

function showDailyReward(
    reward
) {

    const coins =
        Number(
            reward?.coins || 0
        );


    const xp =
        Number(
            reward?.xp || 0
        );


    return showModal({

        title:
            "پاداش روزانه",

        icon:
            "🎁",

        width:
            "small",

        content: `

            <div class="hokm-daily-reward">

                <div class="hokm-reward-item">

                    <span class="hokm-reward-icon">
                        🪙
                    </span>

                    <strong>
                        ${formatCoins(coins)}
                    </strong>

                    <span>
                        سکه
                    </span>

                </div>

                <div class="hokm-reward-item">

                    <span class="hokm-reward-icon">
                        ⭐
                    </span>

                    <strong>
                        ${formatNumber(xp)}
                    </strong>

                    <span>
                        XP
                    </span>

                </div>

            </div>

        `,

        buttons: [

            {

                text:
                    "دریافت",

                type:
                    "primary"

            }

        ]

    });
}


/* ================================================================
   47. SYSTEM MESSAGE
================================================================ */

function showSystemMessage(
    title,
    message,
    type = "info"
) {

    const icons = {

        info:
            "ℹ️",

        success:
            "✅",

        warning:
            "⚠️",

        error:
            "❌",

        game:
            "🎮",

        friend:
            "👥",

        coin:
            "🪙"

    };


    return showModal({

        title:
            title || "پیام سیستم",

        message:
            message || "",

        icon:
            icons[type] || "ℹ️",

        width:
            "small",

        buttons: [

            {

                text:
                    "باشه",

                type:
                    "primary"

            }

        ]

    });
}


/* ================================================================
   48. GLOBAL CLICK HANDLERS
================================================================ */

function setupGlobalClickHandlers() {

    document.addEventListener(
        "click",
        event => {

            const navigation =
                event.target.closest(
                    "[data-navigate]"
                );


            if (
                navigation
            ) {

                event.preventDefault();


                const page =
                    navigation.dataset.navigate;


                navigateTo(
                    page
                );


                return;
            }


            const toastClose =
                event.target.closest(
                    ".hokm-toast-close"
                );


            if (
                toastClose
            ) {

                const toast =
                    toastClose.closest(
                        ".hokm-toast"
                    );


                toast?.classList.add(
                    "hokm-toast-hide"
                );

            }


            const mobileToggle =
                event.target.closest(
                    "[data-mobile-menu-toggle]"
                );


            if (
                mobileToggle
            ) {

                event.preventDefault();

                toggleMobileMenu();

            }


            const copyButton =
                event.target.closest(
                    "[data-copy]"
                );


            if (
                copyButton
            ) {

                event.preventDefault();


                copyToClipboard(
                    copyButton.dataset.copy
                );

            }


            const shareButton =
                event.target.closest(
                    "[data-share]"
                );


            if (
                shareButton
            ) {

                event.preventDefault();


                shareContent({

                    title:
                        shareButton.dataset.shareTitle ||
                        "HOKM ONLINE",

                    text:
                        shareButton.dataset.shareText ||
                        "",

                    url:
                        shareButton.dataset.shareUrl ||
                        window.location.href

                });

            }

        }
    );
}


/* ================================================================
   49. OVERLAY CLICK
================================================================ */

function setupOverlayHandler() {

    uiElements.overlay?.addEventListener(
        "click",
        () => {

            if (
                uiState.mobileMenuOpen
            ) {

                closeMobileMenu();

                return;
            }


            if (
                uiState.modalOpen &&
                uiState.activeModalId
            ) {

                const modal =
                    document.getElementById(
                        uiState.activeModalId
                    );


                if (
                    modal?.dataset.closeOnOverlay !==
                    "false"
                ) {

                    closeModal();

                }

            }

        }
    );
}


/* ================================================================
   50. KEYBOARD HANDLERS
================================================================ */

function setupKeyboardHandlers() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                if (
                    uiState.mobileMenuOpen
                ) {

                    closeMobileMenu();

                    return;
                }


                if (
                    uiState.modalOpen
                ) {

                    const modal =
                        uiState.activeModalId
                            ? document.getElementById(
                                uiState.activeModalId
                            )
                            : null;


                    if (
                        modal &&
                        modal.dataset.closeOnEscape ===
                            "false"
                    ) {

                        return;
                    }


                    closeModal();

                }

            }

        }
    );
}


/* ================================================================
   51. BROWSER HISTORY
================================================================ */

function setupHistoryHandler() {

    window.addEventListener(
        "popstate",
        event => {

            const page =
                event.state?.hokmPage;


            if (
                page
            ) {

                navigateTo(
                    page,
                    {
                        pushHistory:
                            false
                    }
                );

            }

        }
    );
}


/* ================================================================
   52. ONLINE / OFFLINE
================================================================ */

function setupConnectionHandlers() {

    window.addEventListener(
        "online",
        () => {

            updateConnectionStatus(
                true
            );

        }
    );


    window.addEventListener(
        "offline",
        () => {

            updateConnectionStatus(
                false
            );

        }
    );
}


/* ================================================================
   53. AUTH INTEGRATION
================================================================ */

function setupAuthIntegration() {

    if (
        !window.hokmAuth
    ) {
        return;
    }


    if (
        typeof window.hokmAuth.onSignIn ===
        "function"
    ) {

        window.hokmAuth.onSignIn(
            data => {

                updateAuthVisibility();


                const profile =
                    data?.profile ||
                    window.hokmAuth.getCurrentProfile?.();


                updateUserUI(
                    profile
                );


                uiEvents.emit(
                    "authSignedIn",
                    data
                );

            }
        );

    }


    if (
        typeof window.hokmAuth.onSignOut ===
        "function"
    ) {

        window.hokmAuth.onSignOut(
            () => {

                updateAuthVisibility();


                updateUserUI(
                    null
                );


                uiEvents.emit(
                    "authSignedOut"
                );

            }
        );

    }


    if (
        typeof window.hokmAuth.onProfileUpdated ===
        "function"
    ) {

        window.hokmAuth.onProfileUpdated(
            profile => {

                updateUserUI(
                    profile
                );

            }
        );

    }


    if (
        typeof window.hokmAuth.onAuthChange ===
        "function"
    ) {

        window.hokmAuth.onAuthChange(
            data => {

                updateAuthVisibility();


                if (
                    data?.user
                ) {

                    updateUserUI(
                        window.hokmAuth.getCurrentProfile?.()
                    );

                }

            }
        );

    }

}


/* ================================================================
   54. DATA ATTRIBUTE INITIALIZATION
================================================================ */

function initializeDataAttributes() {

    /*
     * User name
     */

    ui$$(
        "[data-user-name]"
    ).forEach(
        element => {

            if (
                !element.textContent.trim()
            ) {

                element.textContent =
                    "بازیکن";

            }

        }
    );


    /*
     * Connection
     */

    updateConnectionStatus(
        navigator.onLine
    );


    /*
     * Navigation
     */

    ui$$(
        "[data-page]"
    ).forEach(
        element => {

            const page =
                element.dataset.page;


            if (
                page !== uiState.currentPage
            ) {

                element.setAttribute(
                    "hidden",
                    ""
                );

                element.setAttribute(
                    "aria-hidden",
                    "true"
                );

            }

        }
    );


    /*
     * Tooltips
     */

    ui$$(
        "[data-tooltip]"
    ).forEach(
        element => {

            if (
                !element.getAttribute(
                    "title"
                )
            ) {

                element.setAttribute(
                    "title",
                    element.dataset.tooltip
                );

            }

        }
    );
}


/* ================================================================
   55. UI ACCESSIBILITY
================================================================ */

function setupAccessibility() {

    ui$$(
        "button"
    ).forEach(
        button => {

            if (
                !button.getAttribute(
                    "type"
                )
            ) {

                button.setAttribute(
                    "type",
                    "button"
                );

            }

        }
    );


    ui$$(
        "[data-modal]"
    ).forEach(
        element => {

            element.setAttribute(
                "role",
                "dialog"
            );

            element.setAttribute(
                "aria-modal",
                "true"
            );

        }
    );
}


/* ================================================================
   56. INITIAL PAGE
================================================================ */

function detectInitialPage() {

    const hash =
        window.location.hash
            .replace(/^#/, "")
            .trim();


    if (hash) {

        try {

            const page =
                decodeURIComponent(
                    hash
                );


            if (page) {

                uiState.currentPage =
                    page;

            }

        } catch (error) {

            console.warn(
                "Invalid page hash:",
                error
            );

        }

    }


    const activePage =
        document.querySelector(
            "[data-page].active"
        );


    if (
        activePage &&
        activePage.dataset.page
    ) {

        uiState.currentPage =
            activePage.dataset.page;

    }
}


/* ================================================================
   57. UI INITIALIZATION
================================================================ */

function initializeUI() {

    if (
        uiState.initialized
    ) {

        return;
    }


    try {

        ensureUIRoots();


        detectInitialPage();


        initializeDataAttributes();


        setupGlobalClickHandlers();


        setupOverlayHandler();


        setupKeyboardHandlers();


        setupHistoryHandler();


        setupConnectionHandlers();


        setupAccessibility();


        setupAuthIntegration();


        updateAuthVisibility();


        if (
            window.hokmAuth &&
            typeof window.hokmAuth.getCurrentProfile ===
                "function"
        ) {

            updateUserUI(
                window.hokmAuth.getCurrentProfile()
            );

        }


        uiState.initialized =
            true;


        uiEvents.emit(
            "initialized",
            uiState
        );


        console.log(
            "Hokm Online UI initialized successfully."
        );


    } catch (error) {

        console.error(
            "UI initialization error:",
            error
        );

    }
}


/* ================================================================
   58. UI EVENT HELPERS
================================================================ */

function onUI(
    eventName,
    callback
) {

    uiEvents.on(
        eventName,
        callback
    );
}


function offUI(
    eventName,
    callback
) {

    uiEvents.off(
        eventName,
        callback
    );
}


/* ================================================================
   59. GLOBAL API
================================================================ */

window.hokmUI = {

    state:
        uiState,

    events:
        uiEvents,

    showToast,

    showSuccess,

    showError,

    showWarning,

    showInfo,

    showGameToast,

    showCoinToast,

    showLoading,

    hideLoading,

    showOverlay,

    hideOverlay,

    showModal,

    closeModal,

    showConfirm,

    showAlert,

    navigateTo,

    goBack,

    openMobileMenu,

    closeMobileMenu,

    toggleMobileMenu,

    updateConnectionStatus,

    updateUserUI,

    updateAuthVisibility,

    updateCoinsUI,

    animateCoins,

    updateLevelUI,

    updateXPUI,

    updateGameStatus,

    updateTurnUI,

    updateScoreUI,

    updateTrickUI,

    setCardSelected,

    clearSelectedCards,

    updatePlayerSeat,

    updateNotificationBadge,

    updateChatBadge,

    updateShopBalance,

    showPurchaseResult,

    updateRoomStatus,

    updateRoomCode,

    copyToClipboard,

    shareContent,

    setButtonLoading,

    setUIEnabled,

    renderEmptyState,

    renderErrorState,

    confirmStartGame,

    confirmExitGame,

    confirmPurchase,

    showGameResult,

    showLevelUp,

    showDailyReward,

    showSystemMessage,

    formatNumber,

    formatCoins,

    formatTime,

    formatDate,

    formatDateTime,

    truncateText,

    normalizeText,

    escapeHTML,

    onUI,

    offUI,

    initializeUI

};


/* ================================================================
   60. GLOBAL SHORTCUTS
================================================================ */

window.showToast =
    showToast;


window.showSuccess =
    showSuccess;


window.showError =
    showError;


window.showWarning =
    showWarning;


window.showInfo =
    showInfo;


window.showLoading =
    showLoading;


window.hideLoading =
    hideLoading;


window.showModal =
    showModal;


window.closeModal =
    closeModal;


window.showConfirm =
    showConfirm;


window.showAlert =
    showAlert;


window.navigateTo =
    navigateTo;


window.goBack =
    goBack;


window.openMobileMenu =
    openMobileMenu;


window.closeMobileMenu =
    closeMobileMenu;


window.toggleMobileMenu =
    toggleMobileMenu;


window.updateConnectionStatus =
    updateConnectionStatus;


window.updateUserUI =
    updateUserUI;


window.updateAuthVisibility =
    updateAuthVisibility;


window.updateCoinsUI =
    updateCoinsUI;


window.animateCoins =
    animateCoins;


window.updateLevelUI =
    updateLevelUI;


window.updateXPUI =
    updateXPUI;


window.updateGameStatus =
    updateGameStatus;


window.updateTurnUI =
    updateTurnUI;


window.updateScoreUI =
    updateScoreUI;


window.updateTrickUI =
    updateTrickUI;


window.updatePlayerSeat =
    updatePlayerSeat;


window.updateNotificationBadge =
    updateNotificationBadge;


window.updateChatBadge =
    updateChatBadge;


window.updateShopBalance =
    updateShopBalance;


window.updateRoomStatus =
    updateRoomStatus;


window.updateRoomCode =
    updateRoomCode;


window.copyToClipboard =
    copyToClipboard;


window.shareContent =
    shareContent;


window.setButtonLoading =
    setButtonLoading;


window.setUIEnabled =
    setUIEnabled;


window.renderEmptyState =
    renderEmptyState;


window.renderErrorState =
    renderErrorState;


window.confirmStartGame =
    confirmStartGame;


window.confirmExitGame =
    confirmExitGame;


window.confirmPurchase =
    confirmPurchase;


window.showGameResult =
    showGameResult;


window.showLevelUp =
    showLevelUp;


window.showDailyReward =
    showDailyReward;


window.showSystemMessage =
    showSystemMessage;


/* ================================================================
   61. DOM READY
================================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeUI
    );

} else {

    initializeUI();

}


/* ================================================================
   END OF UI.JS
================================================================ */
