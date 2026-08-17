"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * chat.js
 *
 * FILE 04 / 12
 *
 * سیستم کامل چت بازی
 *
 * امکانات:
 *
 * 1. چت داخل اتاق بازی
 * 2. ارسال پیام متنی
 * 3. دریافت پیام‌ها از Supabase
 * 4. Realtime برای پیام‌های جدید
 * 5. پیام‌های محلی در صورت نبودن اتصال
 * 6. پاک‌سازی پیام‌های نامعتبر
 * 7. محدودیت طول پیام
 * 8. جلوگیری از ارسال پیام خالی
 * 9. جلوگیری از Spam
 * 10. زمان ارسال پیام
 * 11. نمایش نام بازیکن
 * 12. نمایش پیام خود بازیکن
 * 13. نمایش پیام دیگر بازیکنان
 * 14. نمایش پیام سیستم
 * 15. حذف پیام محلی
 * 16. پاک کردن چت اتاق
 * 17. اسکرول خودکار
 * 18. شمارنده پیام
 * 19. وضعیت آنلاین / آفلاین
 * 20. هماهنگی با room.js
 * 21. هماهنگی با multiplayer.js
 * 22. هماهنگی با profile.js
 * 23. هماهنگی با settings.js
 * 24. هماهنگی با game.js
 * 25. API عمومی window.hokmChat
 * 26. Event System
 * 27. جلوگیری از XSS هنگام نمایش پیام
 * 28. تبدیل لینک‌ها به متن امن
 * 29. پشتیبانی از Enter
 * 30. پشتیبانی از Shift + Enter
 * 31. پشتیبانی از Emoji
 * 32. اعلان پیام جدید
 * 33. امکان mute کردن چت
 * 34. مدیریت وضعیت چت
 * 35. مدیریت چند اتاق
 * 36. cache پیام‌ها
 * 37. بازیابی cache
 * 38. حذف cache
 * 39. اتصال و قطع Realtime
 * 40. سازگاری با ساختارهای مختلف پروژه
 *
 * ================================================================
 */


/* ================================================================
   1. CONFIGURATION
================================================================ */

const HOKM_CHAT_CONFIG = {

    maxMessageLength: 300,

    minMessageLength: 1,

    maxMessagesPerRoom: 200,

    localStoragePrefix: "hokm_chat_",

    roomStorageKey: "current_room",

    playerStorageKey: "hokm_player",

    muteStorageKey: "hokm_chat_muted",

    cooldownMilliseconds: 1200,

    realtimeEnabled: true,

    localFallbackEnabled: true,

    autoScroll: true,

    showSystemMessages: true,

    notificationEnabled: true

};


/* ================================================================
   2. CHAT STATE
================================================================ */

const chatState = {

    initialized: false,

    loading: false,

    connected: false,

    realtimeChannel: null,

    currentRoomId: null,

    currentUserId: null,

    currentPlayerName: "بازیکن",

    messages: [],

    messageCount: 0,

    muted: false,

    lastMessageTime: 0,

    initializedRooms: {},

    listeners: {},

    unreadCount: 0

};


/* ================================================================
   3. SUPABASE CLIENT
================================================================ */

function chatGetSupabaseClient() {

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
   4. CHAT EVENTS
================================================================ */

const chatEvents = {

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
                item => item !== callback
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
                        `خطا در Chat Event: ${eventName}`,
                        error
                    );

                }

            }
        );

    }

};


/* ================================================================
   5. UTILITY
================================================================ */

function chatToast(
    message,
    icon = "💬",
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
   6. GET CURRENT USER
================================================================ */

function chatGetCurrentUser() {

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
   7. GET CURRENT PROFILE
================================================================ */

function chatGetCurrentProfile() {

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
   8. GET PLAYER NAME
================================================================ */

function chatGetPlayerName() {

    const profile =
        chatGetCurrentProfile();


    if (profile) {

        return (
            profile.display_name ||
            profile.username ||
            "بازیکن"
        );

    }


    const user =
        chatGetCurrentUser();


    if (user) {

        return (
            user.user_metadata?.display_name ||
            user.user_metadata?.username ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "بازیکن"
        );

    }


    if (
        window.state &&
        window.state.player
    ) {

        return (
            window.state.player.name ||
            "بازیکن"
        );

    }


    try {

        const stored =
            localStorage.getItem(
                HOKM_CHAT_CONFIG.playerStorageKey
            );


        if (stored) {

            const parsed =
                JSON.parse(stored);


            if (
                parsed &&
                parsed.name
            ) {

                return parsed.name;

            }

        }

    } catch (error) {

        console.warn(
            "خطا در خواندن نام بازیکن:",
            error
        );

    }


    return "بازیکن";

}


/* ================================================================
   9. GET USER ID
================================================================ */

function chatGetUserId() {

    const user =
        chatGetCurrentUser();


    if (
        user &&
        user.id
    ) {

        return user.id;

    }


    if (
        window.state &&
        window.state.player &&
        window.state.player.id
    ) {

        return window.state.player.id;

    }


    return null;

}


/* ================================================================
   10. NORMALIZE ROOM ID
================================================================ */

function normalizeRoomId(
    roomId
) {

    if (
        roomId === null ||
        roomId === undefined
    ) {

        return null;

    }


    const value =
        String(roomId).trim();


    if (!value) {

        return null;

    }


    return value;

}


/* ================================================================
   11. GET CURRENT ROOM ID
================================================================ */

function chatGetCurrentRoomId() {

    if (
        chatState.currentRoomId
    ) {

        return chatState.currentRoomId;

    }


    if (
        window.hokmRoom &&
        typeof window.hokmRoom.getCurrentRoom === "function"
    ) {

        const room =
            window.hokmRoom.getCurrentRoom();


        if (room) {

            return normalizeRoomId(
                room.id ||
                room.room_id ||
                room.code
            );

        }

    }


    if (
        window.state &&
        window.state.room
    ) {

        return normalizeRoomId(
            window.state.room.id ||
            window.state.room.roomId ||
            window.state.room.code
        );

    }


    try {

        const stored =
            localStorage.getItem(
                HOKM_CHAT_CONFIG.roomStorageKey
            );


        if (stored) {

            try {

                const parsed =
                    JSON.parse(stored);


                return normalizeRoomId(
                    parsed.id ||
                    parsed.room_id ||
                    parsed.code
                );

            } catch (error) {

                return normalizeRoomId(
                    stored
                );

            }

        }

    } catch (error) {

        console.warn(
            "خطا در دریافت Room ID:",
            error
        );

    }


    return null;

}


/* ================================================================
   12. SANITIZE TEXT
================================================================ */

function chatSanitizeText(
    text
) {

    if (
        text === null ||
        text === undefined
    ) {

        return "";

    }


    return String(text)

        .replace(
            /\u0000/g,
            ""
        )

        .replace(
            /[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
            ""
        )

        .trim()

        .slice(
            0,
            HOKM_CHAT_CONFIG.maxMessageLength
        );

}


/* ================================================================
   13. ESCAPE HTML
================================================================ */

function chatEscapeHTML(
    text
) {

    const value =
        String(text || "");


    return value
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
   14. FORMAT MESSAGE
================================================================ */

function chatFormatMessage(
    message
) {

    if (
        !message
    ) {

        return null;

    }


    const normalized = {

        id:
            message.id ||
            `local_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}`,

        room_id:
            normalizeRoomId(
                message.room_id ||
                message.roomId ||
                chatState.currentRoomId
            ),

        user_id:
            message.user_id ||
            message.userId ||
            null,

        username:
            chatSanitizeText(
                message.username ||
                message.display_name ||
                message.displayName ||
                "بازیکن"
            ).slice(
                0,
                30
            ),

        message:
            chatSanitizeText(
                message.message ||
                message.text ||
                ""
            ),

        type:
            message.type ||
            "user",

        created_at:
            message.created_at ||
            message.createdAt ||
            new Date().toISOString(),

        local:
            message.local === true,

        pending:
            message.pending === true

    };


    if (
        !normalized.message
    ) {

        return null;

    }


    return normalized;

}


/* ================================================================
   15. FORMAT TIME
================================================================ */

function chatFormatTime(
    date
) {

    const parsedDate =
        date instanceof Date
            ? date
            : new Date(date);


    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {

        return "";

    }


    try {

        return parsedDate.toLocaleTimeString(
            "fa-IR",
            {

                hour: "2-digit",

                minute: "2-digit"

            }
        );

    } catch (error) {

        return parsedDate
            .toLocaleTimeString()
            .slice(
                0,
                5
            );

    }

}


/* ================================================================
   16. LOCAL STORAGE KEY
================================================================ */

function chatStorageKey(
    roomId
) {

    return (
        HOKM_CHAT_CONFIG.localStoragePrefix +
        encodeURIComponent(
            normalizeRoomId(roomId) || "unknown"
        )
    );

}


/* ================================================================
   17. SAVE LOCAL MESSAGES
================================================================ */

function chatSaveLocalMessages(
    roomId,
    messages = chatState.messages
) {

    if (
        !HOKM_CHAT_CONFIG.localFallbackEnabled
    ) {

        return;

    }


    const id =
        normalizeRoomId(roomId);


    if (!id) {

        return;

    }


    try {

        const cleanMessages =
            messages
                .slice(
                    -HOKM_CHAT_CONFIG.maxMessagesPerRoom
                )
                .map(
                    message => ({
                        id:
                            message.id,

                        room_id:
                            message.room_id,

                        user_id:
                            message.user_id,

                        username:
                            message.username,

                        message:
                            message.message,

                        type:
                            message.type,

                        created_at:
                            message.created_at,

                        local:
                            true
                    })
                );


        localStorage.setItem(
            chatStorageKey(id),
            JSON.stringify(
                cleanMessages
            )
        );

    } catch (error) {

        console.warn(
            "ذخیره پیام‌های چت در حافظه محلی انجام نشد:",
            error
        );

    }

}


/* ================================================================
   18. LOAD LOCAL MESSAGES
================================================================ */

function chatLoadLocalMessages(
    roomId
) {

    const id =
        normalizeRoomId(roomId);


    if (!id) {

        return [];

    }


    try {

        const raw =
            localStorage.getItem(
                chatStorageKey(id)
            );


        if (!raw) {

            return [];

        }


        const parsed =
            JSON.parse(raw);


        if (
            !Array.isArray(parsed)
        ) {

            return [];

        }


        return parsed
            .map(
                chatFormatMessage
            )
            .filter(
                Boolean
            );

    } catch (error) {

        console.warn(
            "خطا در بازیابی پیام‌های محلی:",
            error
        );


        return [];

    }

}


/* ================================================================
   19. CLEAR LOCAL CACHE
================================================================ */

function clearChatCache(
    roomId
) {

    const id =
        normalizeRoomId(roomId);


    if (!id) {

        return false;

    }


    try {

        localStorage.removeItem(
            chatStorageKey(id)
        );


        return true;

    } catch (error) {

        console.error(
            "خطا در پاک کردن Cache چت:",
            error
        );


        return false;

    }

}


/* ================================================================
   20. SET ROOM
================================================================ */

async function setChatRoom(
    roomId,
    options = {}
) {

    const id =
        normalizeRoomId(roomId);


    if (!id) {

        return false;

    }


    if (
        chatState.currentRoomId === id &&
        !options.force
    ) {

        return true;

    }


    await disconnectChatRealtime();


    chatState.currentRoomId =
        id;


    try {

        localStorage.setItem(
            HOKM_CHAT_CONFIG.roomStorageKey,
            id
        );

    } catch (error) {

        console.warn(
            "ذخیره Room ID انجام نشد:",
            error
        );

    }


    chatState.messages =
        chatLoadLocalMessages(
            id
        );


    chatState.messageCount =
        chatState.messages.length;


    renderChat();


    await loadRoomMessages(
        id
    );


    if (
        HOKM_CHAT_CONFIG.realtimeEnabled
    ) {

        await connectChatRealtime(
            id
        );

    }


    chatEvents.emit(
        "roomChanged",
        {

            roomId: id

        }
    );


    return true;

}


/* ================================================================
   21. LOAD ROOM MESSAGES
================================================================ */

async function loadRoomMessages(
    roomId
) {

    const id =
        normalizeRoomId(roomId);


    if (!id) {

        return [];

    }


    const client =
        chatGetSupabaseClient();


    if (!client) {

        return chatState.messages;

    }


    chatState.loading =
        true;


    try {

        /*
         * ساختار اصلی مورد انتظار:
         *
         * chat_messages
         *
         * room_id
         * user_id
         * username
         * message
         * type
         * created_at
         *
         * اگر جدول هنوز در دیتابیس وجود نداشته باشد،
         * سیستم از Cache محلی استفاده می‌کند.
         */

        const {
            data,
            error
        } = await client
            .from("chat_messages")
            .select("*")
            .eq(
                "room_id",
                id
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            )
            .limit(
                HOKM_CHAT_CONFIG.maxMessagesPerRoom
            );


        if (error) {

            console.warn(
                "دریافت پیام‌های آنلاین انجام نشد. استفاده از Cache محلی:",
                error
            );


            chatState.loading =
                false;


            return chatState.messages;

        }


        const serverMessages =
            (data || [])
                .map(
                    chatFormatMessage
                )
                .filter(
                    Boolean
                );


        if (
            serverMessages.length > 0
        ) {

            chatState.messages =
                serverMessages;


            chatState.messageCount =
                serverMessages.length;


            chatSaveLocalMessages(
                id,
                serverMessages
            );

        } else {

            /*
             * اگر سرور پیام نداشت،
             * پیام‌های Cache را نگه می‌داریم.
             */

            const localMessages =
                chatLoadLocalMessages(
                    id
                );


            if (
                localMessages.length > 0
            ) {

                chatState.messages =
                    localMessages;


                chatState.messageCount =
                    localMessages.length;

            }

        }


        renderChat();


        chatEvents.emit(
            "messagesLoaded",
            chatState.messages
        );


        chatState.loading =
            false;


        return chatState.messages;


    } catch (error) {

        chatState.loading =
            false;


        console.error(
            "خطا در loadRoomMessages:",
            error
        );


        return chatState.messages;

    }

}


/* ================================================================
   22. ADD MESSAGE TO STATE
================================================================ */

function addMessageToState(
    message,
    options = {}
) {

    const normalized =
        chatFormatMessage(
            message
        );


    if (!normalized) {

        return null;

    }


    /*
     * جلوگیری از پیام تکراری
     */

    const duplicate =
        chatState.messages.some(
            existing => {

                if (
                    existing.id &&
                    normalized.id &&
                    existing.id === normalized.id
                ) {

                    return true;

                }


                return (
                    existing.user_id === normalized.user_id &&
                    existing.message === normalized.message &&
                    existing.created_at === normalized.created_at
                );

            }
        );


    if (duplicate) {

        return null;

    }


    chatState.messages.push(
        normalized
    );


    if (
        chatState.messages.length >
        HOKM_CHAT_CONFIG.maxMessagesPerRoom
    ) {

        chatState.messages =
            chatState.messages.slice(
                -HOKM_CHAT_CONFIG.maxMessagesPerRoom
            );

    }


    chatState.messageCount =
        chatState.messages.length;


    chatSaveLocalMessages(
        chatState.currentRoomId
    );


    if (
        !options.silent
    ) {

        renderChat();

    }


    chatEvents.emit(
        "messageAdded",
        normalized
    );


    return normalized;

}


/* ================================================================
   23. SEND MESSAGE
================================================================ */

async function sendChatMessage(
    text,
    options = {}
) {

    const message =
        chatSanitizeText(
            text
        );


    if (
        !message
    ) {

        return {

            success: false,

            error:
                "EMPTY_MESSAGE"

        };

    }


    if (
        message.length <
        HOKM_CHAT_CONFIG.minMessageLength
    ) {

        return {

            success: false,

            error:
                "MESSAGE_TOO_SHORT"

        };

    }


    if (
        message.length >
        HOKM_CHAT_CONFIG.maxMessageLength
    ) {

        chatToast(
            `پیام نمی‌تواند بیشتر از ${HOKM_CHAT_CONFIG.maxMessageLength} کاراکتر باشد.`,
            "⚠️"
        );


        return {

            success: false,

            error:
                "MESSAGE_TOO_LONG"

        };

    }


    const now =
        Date.now();


    if (
        !options.skipCooldown &&
        now -
            chatState.lastMessageTime <
            HOKM_CHAT_CONFIG.cooldownMilliseconds
    ) {

        return {

            success: false,

            error:
                "COOLDOWN"

        };

    }


    if (
        chatState.muted
    ) {

        chatToast(
            "چت برای شما بی‌صدا شده است.",
            "🔇"
        );


        return {

            success: false,

            error:
                "CHAT_MUTED"

        };

    }


    const roomId =
        normalizeRoomId(
            options.roomId ||
            chatState.currentRoomId ||
            chatGetCurrentRoomId()
        );


    if (!roomId) {

        chatToast(
            "ابتدا وارد یک اتاق بازی شوید.",
            "⚠️"
        );


        return {

            success: false,

            error:
                "ROOM_REQUIRED"

        };

    }


    const userId =
        chatGetUserId();


    const username =
        chatGetPlayerName();


    const type =
        options.type ||
        "user";


    const temporaryMessage = {

        id:
            `pending_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}`,

        room_id:
            roomId,

        user_id:
            userId,

        username:
            username,

        message:
            message,

        type:
            type,

        created_at:
            new Date().toISOString(),

        local:
            true,

        pending:
            true

    };


    /*
     * ابتدا پیام را در UI قرار می‌دهیم
     * تا کاربر تأخیر احساس نکند.
     */

    addMessageToState(
        temporaryMessage
    );


    chatState.lastMessageTime =
        now;


    const client =
        chatGetSupabaseClient();


    /*
     * حالت Local
     */

    if (!client) {

        temporaryMessage.pending =
            false;


        chatEvents.emit(
            "messageSent",
            temporaryMessage
        );


        return {

            success: true,

            local: true,

            message:
                temporaryMessage

        };

    }


    try {

        const {
            data,
            error
        } = await client
            .from("chat_messages")
            .insert({

                room_id:
                    roomId,

                user_id:
                    userId,

                username:
                    username,

                message:
                    message,

                type:
                    type

            })
            .select()
            .single();


        if (error) {

            console.warn(
                "ارسال پیام به سرور انجام نشد. پیام محلی حفظ شد:",
                error
            );


            temporaryMessage.pending =
                false;


            temporaryMessage.local =
                true;


            renderChat();


            chatEvents.emit(
                "messageSent",
                temporaryMessage
            );


            return {

                success: true,

                local: true,

                fallback: true,

                message:
                    temporaryMessage

            };

        }


        /*
         * پیام موقت را حذف می‌کنیم.
         */

        chatState.messages =
            chatState.messages.filter(
                item =>
                    item.id !==
                    temporaryMessage.id
            );


        const serverMessage =
            chatFormatMessage(
                data
            );


        if (serverMessage) {

            addMessageToState(
                serverMessage
            );

        }


        chatEvents.emit(
            "messageSent",
            serverMessage
        );


        return {

            success: true,

            local: false,

            message:
                serverMessage

        };


    } catch (error) {

        console.error(
            "خطا در sendChatMessage:",
            error
        );


        temporaryMessage.pending =
            false;


        temporaryMessage.local =
            true;


        renderChat();


        chatEvents.emit(
            "messageSent",
            temporaryMessage
        );


        return {

            success: true,

            local: true,

            fallback: true,

            message:
                temporaryMessage

        };

    }

}


/* ================================================================
   24. SEND SYSTEM MESSAGE
================================================================ */

async function sendSystemChatMessage(
    text,
    options = {}
) {

    return await sendChatMessage(
        text,
        {

            ...options,

            type:
                "system",

            skipCooldown:
                true

        }
    );

}


/* ================================================================
   25. DELETE MESSAGE FROM LOCAL STATE
================================================================ */

function removeMessage(
    messageId
) {

    if (!messageId) {

        return false;

    }


    const before =
        chatState.messages.length;


    chatState.messages =
        chatState.messages.filter(
            message =>
                message.id !==
                messageId
        );


    if (
        before ===
        chatState.messages.length
    ) {

        return false;

    }


    chatState.messageCount =
        chatState.messages.length;


    chatSaveLocalMessages(
        chatState.currentRoomId
    );


    renderChat();


    chatEvents.emit(
        "messageRemoved",
        messageId
    );


    return true;

}


/* ================================================================
   26. CLEAR ROOM CHAT
================================================================ */

async function clearRoomChat(
    roomId = null
) {

    const id =
        normalizeRoomId(
            roomId ||
            chatState.currentRoomId
        );


    if (!id) {

        return false;

    }


    chatState.messages =
        [];


    chatState.messageCount =
        0;


    clearChatCache(
        id
    );


    renderChat();


    chatEvents.emit(
        "chatCleared",
        {

            roomId:
                id

        }
    );


    return true;

}


/* ================================================================
   27. CONNECT REALTIME
================================================================ */

async function connectChatRealtime(
    roomId
) {

    const id =
        normalizeRoomId(
            roomId
        );


    if (!id) {

        return false;

    }


    const client =
        chatGetSupabaseClient();


    if (!client) {

        chatState.connected =
            false;


        return false;

    }


    if (
        !HOKM_CHAT_CONFIG.realtimeEnabled
    ) {

        return false;

    }


    await disconnectChatRealtime();


    try {

        const channelName =
            `hokm-chat-${id}`;


        const channel =
            client.channel(
                channelName
            );


        channel.on(

            "postgres_changes",

            {

                event:
                    "INSERT",

                schema:
                    "public",

                table:
                    "chat_messages",

                filter:
                    `room_id=eq.${id}`

            },

            payload => {

                if (
                    !payload ||
                    !payload.new
                ) {

                    return;

                }


                const incoming =
                    chatFormatMessage(
                        payload.new
                    );


                if (!incoming) {

                    return;

                }


                addMessageToState(
                    incoming
                );


                const currentUserId =
                    chatGetUserId();


                if (
                    incoming.user_id &&
                    incoming.user_id !== currentUserId
                ) {

                    chatState.unreadCount++;


                    updateChatUnreadUI();


                    if (
                        !chatState.muted &&
                        HOKM_CHAT_CONFIG.notificationEnabled
                    ) {

                        notifyNewChatMessage(
                            incoming
                        );

                    }

                }


                chatEvents.emit(
                    "realtimeMessage",
                    incoming
                );

            }

        );


        const subscription =
            await channel.subscribe(
                status => {

                    console.log(
                        "Chat Realtime:",
                        status
                    );


                    if (
                        status === "SUBSCRIBED"
                    ) {

                        chatState.connected =
                            true;

                        chatEvents.emit(
                            "connected",
                            {

                                roomId:
                                    id

                            }
                        );

                    }


                    if (
                        status === "CHANNEL_ERROR" ||
                        status === "TIMED_OUT"
                    ) {

                        chatState.connected =
                            false;

                    }

                }
            );


        chatState.realtimeChannel =
            channel;


        return subscription;


    } catch (error) {

        console.error(
            "خطا در اتصال Realtime چت:",
            error
        );


        chatState.connected =
            false;


        return false;

    }

}


/* ================================================================
   28. DISCONNECT REALTIME
================================================================ */

async function disconnectChatRealtime() {

    const client =
        chatGetSupabaseClient();


    if (
        !client
    ) {

        chatState.realtimeChannel =
            null;

        chatState.connected =
            false;

        return;

    }


    if (
        !chatState.realtimeChannel
    ) {

        chatState.connected =
            false;

        return;

    }


    try {

        await client.removeChannel(
            chatState.realtimeChannel
        );

    } catch (error) {

        console.warn(
            "قطع اتصال Realtime چت:",
            error
        );

    }


    chatState.realtimeChannel =
        null;


    chatState.connected =
        false;


    chatEvents.emit(
        "disconnected"
    );

}


/* ================================================================
   29. NOTIFICATION
================================================================ */

function notifyNewChatMessage(
    message
) {

    if (
        typeof window.showToast === "function"
    ) {

        window.showToast(
            `${message.username}: ${message.message}`,
            "💬",
            2500
        );

    }


    chatEvents.emit(
        "notification",
        message
    );

}


/* ================================================================
   30. MUTE CHAT
================================================================ */

function setChatMuted(
    muted
) {

    chatState.muted =
        muted === true;


    try {

        localStorage.setItem(
            HOKM_CHAT_CONFIG.muteStorageKey,
            chatState.muted
                ? "1"
                : "0"
        );

    } catch (error) {

        console.warn(
            "ذخیره وضعیت Mute انجام نشد:",
            error
        );

    }


    updateChatMuteUI();


    chatEvents.emit(
        "muteChanged",
        chatState.muted
    );


    return chatState.muted;

}


/* ================================================================
   31. TOGGLE MUTE
================================================================ */

function toggleChatMute() {

    return setChatMuted(
        !chatState.muted
    );

}


/* ================================================================
   32. LOAD MUTE STATE
================================================================ */

function loadChatMuteState() {

    try {

        const muted =
            localStorage.getItem(
                HOKM_CHAT_CONFIG.muteStorageKey
            );


        chatState.muted =
            muted === "1";

    } catch (error) {

        chatState.muted =
            false;

    }


    updateChatMuteUI();

}


/* ================================================================
   33. UPDATE MUTE UI
================================================================ */

function updateChatMuteUI() {

    const buttons =
        document.querySelectorAll(
            "[data-chat-mute]"
        );


    buttons.forEach(
        button => {

            button.setAttribute(
                "aria-pressed",
                chatState.muted
                    ? "true"
                    : "false"
            );


            button.textContent =
                chatState.muted
                    ? "🔇"
                    : "🔊";

            button.title =
                chatState.muted
                    ? "فعال کردن صدای چت"
                    : "بی‌صدا کردن چت";

        }
    );

}


/* ================================================================
   34. UPDATE UNREAD UI
================================================================ */

function updateChatUnreadUI() {

    const elements =
        document.querySelectorAll(
            "[data-chat-unread]"
        );


    elements.forEach(
        element => {

            const count =
                chatState.unreadCount;


            element.textContent =
                count > 99
                    ? "99+"
                    : String(count);


            element.style.display =
                count > 0
                    ? ""
                    : "none";

        }
    );

}


/* ================================================================
   35. MARK CHAT AS READ
================================================================ */

function markChatAsRead() {

    chatState.unreadCount =
        0;


    updateChatUnreadUI();


    chatEvents.emit(
        "read"
    );

}


/* ================================================================
   36. CREATE MESSAGE HTML
================================================================ */

function createMessageHTML(
    message
) {

    const currentUserId =
        chatGetUserId();


    const isMine =
        !!currentUserId &&
        message.user_id ===
            currentUserId;


    const isSystem =
        message.type ===
        "system";


    const classNames = [

        "hokm-chat-message",

        isMine
            ? "is-mine"
            : "is-other",

        isSystem
            ? "is-system"
            : "",

        message.pending
            ? "is-pending"
            : ""

    ]
        .filter(Boolean)
        .join(" ");


    const username =
        chatEscapeHTML(
            message.username ||
            "بازیکن"
        );


    const text =
        chatEscapeHTML(
            message.message
        );


    const time =
        chatFormatTime(
            message.created_at
        );


    return `

        <div
            class="${classNames}"
            data-chat-message-id="${chatEscapeHTML(
                message.id
            )}"
        >

            <div class="hokm-chat-message-header">

                <span class="hokm-chat-message-user">

                    ${username}

                </span>

                <span class="hokm-chat-message-time">

                    ${chatEscapeHTML(
                        time
                    )}

                </span>

            </div>


            <div class="hokm-chat-message-body">

                ${text}

            </div>


            ${
                message.pending
                    ? `
                        <div class="hokm-chat-message-status">
                            در حال ارسال...
                        </div>
                    `
                    : ""
            }

        </div>

    `;

}


/* ================================================================
   37. FIND CHAT CONTAINER
================================================================ */

function findChatContainer() {

    const selectors = [

        "[data-chat-messages]",

        "#chatMessages",

        "#chat-messages",

        ".chat-messages",

        ".hokm-chat-messages"

    ];


    for (
        const selector of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (element) {

            return element;

        }

    }


    return null;

}


/* ================================================================
   38. RENDER CHAT
================================================================ */

function renderChat() {

    const container =
        findChatContainer();


    if (!container) {

        return;

    }


    if (
        chatState.messages.length === 0
    ) {

        container.innerHTML = `

            <div class="hokm-chat-empty">

                <div class="hokm-chat-empty-icon">
                    💬
                </div>

                <div class="hokm-chat-empty-title">
                    هنوز پیامی ارسال نشده
                </div>

                <div class="hokm-chat-empty-text">
                    اولین پیام را شما بفرستید!
                </div>

            </div>

        `;


        return;

    }


    container.innerHTML =
        chatState.messages
            .map(
                createMessageHTML
            )
            .join("");


    if (
        HOKM_CHAT_CONFIG.autoScroll
    ) {

        requestAnimationFrame(
            () => {

                container.scrollTop =
                    container.scrollHeight;

            }
        );

    }

}


/* ================================================================
   39. RENDER CHAT COUNTER
================================================================ */

function updateChatMessageCountUI() {

    const elements =
        document.querySelectorAll(
            "[data-chat-count]"
        );


    elements.forEach(
        element => {

            element.textContent =
                Number(
                    chatState.messageCount
                ).toLocaleString(
                    "fa-IR"
                );

        }
    );

}


/* ================================================================
   40. FIND CHAT INPUT
================================================================ */

function findChatInput() {

    const selectors = [

        "[data-chat-input]",

        "#chatInput",

        "#chat-input",

        ".chat-input",

        ".hokm-chat-input"

    ];


    for (
        const selector of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (element) {

            return element;

        }

    }


    return null;

}


/* ================================================================
   41. FIND CHAT SEND BUTTON
================================================================ */

function findChatSendButton() {

    const selectors = [

        "[data-chat-send]",

        "#chatSend",

        "#chat-send",

        ".chat-send",

        ".hokm-chat-send"

    ];


    for (
        const selector of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (element) {

            return element;

        }

    }


    return null;

}


/* ================================================================
   42. SEND FROM UI
================================================================ */

async function sendMessageFromUI() {

    const input =
        findChatInput();


    if (!input) {

        return;

    }


    const value =
        input.value;


    if (!value.trim()) {

        return;

    }


    const result =
        await sendChatMessage(
            value
        );


    if (
        result.success
    ) {

        input.value =
            "";


        input.focus();

    }

}


/* ================================================================
   43. HANDLE INPUT KEYBOARD
================================================================ */

function handleChatInputKeydown(
    event
) {

    if (
        event.key !== "Enter"
    ) {

        return;

    }


    /*
     * Shift + Enter
     * اجازه خط جدید می‌دهد.
     */

    if (
        event.shiftKey
    ) {

        return;

    }


    event.preventDefault();


    sendMessageFromUI();

}


/* ================================================================
   44. BIND CHAT UI
================================================================ */

function bindChatUI() {

    const input =
        findChatInput();


    if (input) {

        input.removeEventListener(
            "keydown",
            handleChatInputKeydown
        );


        input.addEventListener(
            "keydown",
            handleChatInputKeydown
        );

    }


    const sendButton =
        findChatSendButton();


    if (sendButton) {

        sendButton.onclick =
            sendMessageFromUI;

    }


    const muteButtons =
        document.querySelectorAll(
            "[data-chat-mute]"
        );


    muteButtons.forEach(
        button => {

            button.onclick =
                toggleChatMute;

        }
    );


    const readButtons =
        document.querySelectorAll(
            "[data-chat-read]"
        );


    readButtons.forEach(
        button => {

            button.onclick =
                markChatAsRead;

        }
    );


    updateChatMuteUI();

    updateChatUnreadUI();

    updateChatMessageCountUI();

    renderChat();

}


/* ================================================================
   45. EMOJI SUPPORT
================================================================ */

function insertChatEmoji(
    emoji
) {

    const input =
        findChatInput();


    if (!input) {

        return false;

    }


    const start =
        input.selectionStart ??
        input.value.length;


    const end =
        input.selectionEnd ??
        input.value.length;


    const before =
        input.value.slice(
            0,
            start
        );


    const after =
        input.value.slice(
            end
        );


    input.value =
        before +
        emoji +
        after;


    const cursor =
        start +
        emoji.length;


    input.focus();


    try {

        input.setSelectionRange(
            cursor,
            cursor
        );

    } catch (error) {

        console.warn(
            "تنظیم مکان Cursor انجام نشد:",
            error
        );

    }


    return true;

}


/* ================================================================
   46. OPEN EMOJI PANEL
================================================================ */

function toggleChatEmojiPanel() {

    const panel =
        document.querySelector(
            "[data-chat-emoji-panel]"
        );


    if (!panel) {

        return false;

    }


    const visible =
        panel.style.display !==
        "none";


    panel.style.display =
        visible
            ? "none"
            : "";


    if (!visible) {

        const emojis =
            panel.querySelectorAll(
                "[data-chat-emoji]"
            );


        emojis.forEach(
            button => {

                button.onclick =
                    () => {

                        insertChatEmoji(
                            button.dataset.chatEmoji ||
                            button.textContent ||
                            ""
                        );

                    };

            }
        );

    }


    return !visible;

}


/* ================================================================
   47. INITIALIZE ROOM FROM GAME
================================================================ */

function detectAndSetCurrentRoom() {

    const roomId =
        chatGetCurrentRoomId();


    if (
        roomId
    ) {

        setChatRoom(
            roomId
        );

    }

}


/* ================================================================
   48. AUTH EVENT BINDING
================================================================ */

function bindAuthEvents() {

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.onSignIn === "function"
    ) {

        window.hokmAuth.onSignIn(
            () => {

                chatState.currentUserId =
                    chatGetUserId();


                chatState.currentPlayerName =
                    chatGetPlayerName();


                renderChat();

            }
        );

    }


    if (
        window.hokmAuth &&
        typeof window.hokmAuth.onSignOut === "function"
    ) {

        window.hokmAuth.onSignOut(
            async () => {

                chatState.currentUserId =
                    null;


                chatState.currentPlayerName =
                    "بازیکن";


                await disconnectChatRealtime();

            }
        );

    }


    if (
        window.hokmAuth &&
        typeof window.hokmAuth.onProfileUpdated === "function"
    ) {

        window.hokmAuth.onProfileUpdated(
            () => {

                chatState.currentPlayerName =
                    chatGetPlayerName();

            }
        );

    }

}


/* ================================================================
   49. ROOM EVENT BINDING
================================================================ */

function bindRoomEvents() {

    if (
        window.hokmRoom
    ) {

        if (
            typeof window.hokmRoom.onRoomChanged === "function"
        ) {

            window.hokmRoom.onRoomChanged(
                room => {

                    const roomId =
                        normalizeRoomId(
                            room?.id ||
                            room?.room_id ||
                            room?.code
                        );


                    if (roomId) {

                        setChatRoom(
                            roomId
                        );

                    }

                }
            );

        }


        if (
            typeof window.hokmRoom.onLeaveRoom === "function"
        ) {

            window.hokmRoom.onLeaveRoom(
                async () => {

                    await disconnectChatRealtime();

                    chatState.currentRoomId =
                        null;

                }
            );

        }

    }

}


/* ================================================================
   50. GAME EVENT BINDING
================================================================ */

function bindGameEvents() {

    /*
     * این بخش عمداً بدون وابستگی اجباری
     * به game.js نوشته شده است.
     *
     * بنابراین اگر نام Eventهای game.js
     * تغییر کند، بازی خراب نمی‌شود.
     */

    document.addEventListener(
        "hokm:room-changed",
        event => {

            const roomId =
                normalizeRoomId(
                    event.detail?.roomId ||
                    event.detail?.id ||
                    event.detail?.code
                );


            if (roomId) {

                setChatRoom(
                    roomId
                );

            }

        }
    );


    document.addEventListener(
        "hokm:room-left",
        async () => {

            await disconnectChatRealtime();

            chatState.currentRoomId =
                null;

        }
    );


    document.addEventListener(
        "hokm:game-finished",
        event => {

            if (
                !HOKM_CHAT_CONFIG.showSystemMessages
            ) {

                return;

            }


            const winner =
                event.detail?.winnerName;


            if (winner) {

                sendSystemChatMessage(
                    `🏆 ${winner} برنده بازی شد!`,
                    {

                        skipCooldown: true

                    }
                );

            }

        }
    );

}


/* ================================================================
   51. CREATE CHAT DOM IF NEEDED
================================================================ */

function createChatContainerIfNeeded() {

    const existing =
        findChatContainer();


    if (existing) {

        return existing;

    }


    /*
     * اگر index.html از قبل Container داشته باشد،
     * به آن دست نمی‌زنیم.
     *
     * فقط در صورت نبودن Container،
     * یک Container پایه ساخته می‌شود.
     */

    const possibleParent =
        document.querySelector(
            "[data-chat]"
        );


    if (!possibleParent) {

        return null;

    }


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "hokm-chat-messages";


    container.dataset.chatMessages =
        "";


    possibleParent.appendChild(
        container
    );


    return container;

}


/* ================================================================
   52. CHAT OPEN / CLOSE
================================================================ */

function openChat() {

    const chat =
        document.querySelector(
            "[data-chat]"
        );


    if (!chat) {

        return false;

    }


    chat.classList.add(
        "is-open"
    );


    chat.style.display =
        "";


    markChatAsRead();


    chatEvents.emit(
        "opened"
    );


    return true;

}


function closeChat() {

    const chat =
        document.querySelector(
            "[data-chat]"
        );


    if (!chat) {

        return false;

    }


    chat.classList.remove(
        "is-open"
    );


    chatEvents.emit(
        "closed"
    );


    return true;

}


function toggleChat() {

    const chat =
        document.querySelector(
            "[data-chat]"
        );


    if (!chat) {

        return false;

    }


    if (
        chat.classList.contains(
            "is-open"
        )
    ) {

        return closeChat();

    }


    return openChat();

}


/* ================================================================
   53. GET MESSAGES
================================================================ */

function getChatMessages() {

    return [
        ...chatState.messages
    ];

}


/* ================================================================
   54. GET CURRENT ROOM
================================================================ */

function getChatRoomId() {

    return chatState.currentRoomId;

}


/* ================================================================
   55. GET UNREAD COUNT
================================================================ */

function getChatUnreadCount() {

    return chatState.unreadCount;

}


/* ================================================================
   56. IS CONNECTED
================================================================ */

function isChatConnected() {

    return chatState.connected === true;

}


/* ================================================================
   57. IS MUTED
================================================================ */

function isChatMuted() {

    return chatState.muted === true;

}


/* ================================================================
   58. ADD LOCAL MESSAGE
================================================================ */

function addLocalChatMessage(
    message
) {

    const roomId =
        chatState.currentRoomId;


    const formatted =
        chatFormatMessage({

            ...message,

            room_id:
                message.room_id ||
                roomId,

            local:
                true

        });


    if (!formatted) {

        return null;

    }


    return addMessageToState(
        formatted
    );

}


/* ================================================================
   59. SYSTEM EVENTS
================================================================ */

function emitChatEvent(
    eventName,
    data
) {

    chatEvents.emit(
        eventName,
        data
    );

}


/* ================================================================
   60. INITIALIZE CHAT
================================================================ */

async function initializeChat() {

    if (
        chatState.initialized
    ) {

        return true;

    }


    try {

        chatState.loading =
            true;


        chatState.currentUserId =
            chatGetUserId();


        chatState.currentPlayerName =
            chatGetPlayerName();


        loadChatMuteState();


        createChatContainerIfNeeded();


        bindChatUI();


        bindAuthEvents();


        bindRoomEvents();


        bindGameEvents();


        detectAndSetCurrentRoom();


        chatState.initialized =
            true;


        chatState.loading =
            false;


        chatEvents.emit(
            "initialized",
            {

                roomId:
                    chatState.currentRoomId,

                userId:
                    chatState.currentUserId,

                playerName:
                    chatState.currentPlayerName

            }
        );


        console.log(
            "Hokm Online Chat initialized successfully."
        );


        return true;


    } catch (error) {

        chatState.loading =
            false;


        console.error(
            "خطا در initializeChat:",
            error
        );


        return false;

    }

}


/* ================================================================
   61. WAIT FOR INITIALIZATION
================================================================ */

function waitForChat() {

    return new Promise(
        resolve => {

            if (
                chatState.initialized
            ) {

                resolve(
                    chatState
                );


                return;

            }


            chatEvents.on(
                "initialized",
                () => {

                    resolve(
                        chatState
                    );

                }
            );

        }
    );

}


/* ================================================================
   62. EVENT HELPERS
================================================================ */

function onChatMessage(
    callback
) {

    chatEvents.on(
        "messageAdded",
        callback
    );

}


function onChatMessageSent(
    callback
) {

    chatEvents.on(
        "messageSent",
        callback
    );

}


function onChatRoomChanged(
    callback
) {

    chatEvents.on(
        "roomChanged",
        callback
    );

}


function onChatConnected(
    callback
) {

    chatEvents.on(
        "connected",
        callback
    );

}


function onChatDisconnected(
    callback
) {

    chatEvents.on(
        "disconnected",
        callback
    );

}


function onChatOpened(
    callback
) {

    chatEvents.on(
        "opened",
        callback
    );

}


function onChatClosed(
    callback
) {

    chatEvents.on(
        "closed",
        callback
    );

}


function onChatMuteChanged(
    callback
) {

    chatEvents.on(
        "muteChanged",
        callback
    );

}


/* ================================================================
   63. PUBLIC API
================================================================ */

window.hokmChat = {

    initialize:
        initializeChat,

    waitForChat,

    sendMessage:
        sendChatMessage,

    sendChatMessage,

    sendSystemMessage:
        sendSystemChatMessage,

    sendSystemChatMessage,

    setRoom:
        setChatRoom,

    setChatRoom,

    getRoomId:
        getChatRoomId,

    getMessages:
        getChatMessages,

    getUnreadCount:
        getChatUnreadCount,

    isConnected:
        isChatConnected,

    isMuted:
        isChatMuted,

    mute:
        setChatMuted,

    setMuted:
        setChatMuted,

    toggleMute:
        toggleChatMute,

    markAsRead:
        markChatAsRead,

    clear:
        clearRoomChat,

    clearRoomChat,

    removeMessage,

    addLocalMessage:
        addLocalChatMessage,

    open:
        openChat,

    close:
        closeChat,

    toggle:
        toggleChat,

    insertEmoji:
        insertChatEmoji,

    toggleEmojiPanel:
        toggleChatEmojiPanel,

    connectRealtime:
        connectChatRealtime,

    disconnectRealtime:
        disconnectChatRealtime,

    render:
        renderChat,

    onMessage:
        onChatMessage,

    onMessageSent:
        onChatMessageSent,

    onRoomChanged:
        onChatRoomChanged,

    onConnected:
        onChatConnected,

    onDisconnected:
        onChatDisconnected,

    onOpened:
        onChatOpened,

    onClosed:
        onChatClosed,

    onMuteChanged:
        onChatMuteChanged,

    state:
        chatState,

    config:
        HOKM_CHAT_CONFIG

};


/* ================================================================
   64. GLOBAL SHORTCUTS
================================================================ */

window.sendChatMessage =
    sendChatMessage;


window.sendMessage =
    sendChatMessage;


window.openChat =
    openChat;


window.closeChat =
    closeChat;


window.toggleChat =
    toggleChat;


window.toggleChatMute =
    toggleChatMute;


window.markChatAsRead =
    markChatAsRead;


window.insertChatEmoji =
    insertChatEmoji;


window.getChatMessages =
    getChatMessages;


window.getChatRoomId =
    getChatRoomId;


/* ================================================================
   65. DOM READY
================================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initialize
