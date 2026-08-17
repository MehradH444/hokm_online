
"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * room.js
 *
 * FILE 2 / 12
 *
 * مسئولیت‌های این فایل:
 *
 * 1. ساخت اتاق
 * 2. ورود به اتاق
 * 3. ورود با کد اتاق
 * 4. نمایش اطلاعات اتاق
 * 5. نمایش بازیکنان
 * 6. مدیریت صندلی‌ها
 * 7. مدیریت تیم‌ها
 * 8. آماده / غیرآماده شدن
 * 9. خروج از اتاق
 * 10. ترک اتاق
 * 11. تعیین میزبان
 * 12. بررسی ظرفیت
 * 13. بررسی موجودی سکه
 * 14. دریافت هزینه بازی
 * 15. هزینه ورود به بازی = 400 سکه مجازی
 * 16. مدیریت وضعیت اتاق
 * 17. شروع بازی توسط میزبان
 * 18. Realtime برای اتاق
 * 19. هماهنگی با Supabase
 * 20. هماهنگی با game.js
 * 21. هماهنگی با ui.js
 * 22. هماهنگی با profile
 * 23. مدیریت خطاها
 * 24. جلوگیری از ورود چندباره
 * 25. جلوگیری از صندلی تکراری
 * 26. تولید کد 6 رقمی
 * 27. به‌روزرسانی UI
 *
 * قوانین فعلی:
 *
 * شروع موجودی اولیه بازیکن:
 * 3000 سکه
 *
 * هزینه هر بازی:
 * 400 سکه
 *
 * نوع سکه:
 * Virtual Coins
 *
 * ================================================================
 */


/* ================================================================
   1. CONSTANTS
================================================================ */

const ROOM_CONFIG = {

    MAX_PLAYERS: 4,

    MIN_PLAYERS_TO_START: 4,

    ENTRY_FEE: 400,

    CODE_LENGTH: 6,

    CODE_MIN: 100000,

    CODE_MAX: 999999,

    WAITING_STATUS: "waiting",

    STARTING_STATUS: "starting",

    PLAYING_STATUS: "playing",

    FINISHED_STATUS: "finished",

    CLOSED_STATUS: "closed",

    TEAM_A: "A",

    TEAM_B: "B",

    SEATS: [0, 1, 2, 3]

};


/* ================================================================
   2. ROOM STATE
================================================================ */

const roomState = {

    initialized: false,

    loading: false,

    currentRoom: null,

    currentRoomId: null,

    currentRoomCode: null,

    currentGameId: null,

    currentPlayer: null,

    players: [],

    isHost: false,

    isReady: false,

    currentSeat: null,

    currentTeam: null,

    status: "none",

    realtimeChannel: null,

    roomChannel: null,

    reconnectTimer: null,

    starting: false,

    leaving: false,

    joining: false,

    creating: false,

    lastError: null

};


/* ================================================================
   3. ROOM EVENTS
================================================================ */

const roomEvents = {

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
                item => item !== callback
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
                        `Room event error: ${eventName}`,
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

function getRoomSupabaseClient() {

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
        "Supabase client برای room.js پیدا نشد."
    );


    return null;
}


/* ================================================================
   5. AUTH HELPERS
================================================================ */

function roomGetUser() {

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


function roomGetProfile() {

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
   6. UI HELPERS
================================================================ */

function roomToast(
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


function roomShowLoading(
    message = "لطفاً صبر کنید..."
) {

    if (
        typeof window.showLoading === "function"
    ) {

        window.showLoading(
            message
        );
    }
}


function roomHideLoading() {

    if (
        typeof window.hideLoading === "function"
    ) {

        window.hideLoading();
    }
}


/* ================================================================
   7. SAFE TEXT
================================================================ */

function roomEscapeText(
    value
) {

    const div =
        document.createElement("div");


    div.textContent =
        String(
            value ?? ""
        );


    return div.innerHTML;
}


/* ================================================================
   8. CURRENT ROOM GETTERS
================================================================ */

function getCurrentRoom() {

    return roomState.currentRoom;
}


function getCurrentRoomId() {

    return roomState.currentRoomId;
}


function getCurrentRoomCode() {

    return roomState.currentRoomCode;
}


function getCurrentRoomPlayers() {

    return [
        ...roomState.players
    ];
}


function isRoomHost() {

    return roomState.isHost === true;
}


function isRoomReady() {

    return roomState.isReady === true;
}


/* ================================================================
   9. GENERATE ROOM CODE
================================================================ */

function generateRoomCode() {

    const number =
        Math.floor(
            Math.random() *
            (
                ROOM_CONFIG.CODE_MAX -
                ROOM_CONFIG.CODE_MIN +
                1
            )
        ) +
        ROOM_CONFIG.CODE_MIN;


    return String(
        number
    );
}


/* ================================================================
   10. NORMALIZE ROOM CODE
================================================================ */

function normalizeRoomCode(
    code
) {

    return String(
        code || ""
    )
        .replace(
            /\D/g,
            ""
        )
        .slice(
            0,
            ROOM_CONFIG.CODE_LENGTH
        );
}


/* ================================================================
   11. VALIDATE ROOM CODE
================================================================ */

function isValidRoomCode(
    code
) {

    return (
        /^[0-9]{6}$/.test(
            String(code || "")
        )
    );
}


/* ================================================================
   12. GET PLAYER NAME
================================================================ */

function getRoomPlayerName(
    profile = null,
    user = null
) {

    const p =
        profile ||
        roomGetProfile();


    const u =
        user ||
        roomGetUser();


    return (
        p?.username ||
        p?.display_name ||
        u?.user_metadata?.display_name ||
        u?.user_metadata?.username ||
        "بازیکن"
    );
}


/* ================================================================
   13. GET PLAYER COINS
================================================================ */

function getRoomPlayerCoins() {

    const profile =
        roomGetProfile();


    if (
        profile &&
        profile.coins !== undefined
    ) {

        return Number(
            profile.coins
        );
    }


    if (
        window.state?.player?.coins !== undefined
    ) {

        return Number(
            window.state.player.coins
        );
    }


    return 0;
}


/* ================================================================
   14. CHECK LOGIN
================================================================ */

function roomRequireLogin() {

    const user =
        roomGetUser();


    if (!user) {

        roomToast(
            "برای ورود به اتاق ابتدا وارد حساب کاربری شوید.",
            "🔐",
            4000
        );


        roomEvents.emit(
            "loginRequired"
        );


        return false;
    }


    return true;
}


/* ================================================================
   15. CHECK COINS
================================================================ */

function hasEnoughRoomCoins(
    amount = ROOM_CONFIG.ENTRY_FEE
) {

    const coins =
        getRoomPlayerCoins();


    return (
        Number.isFinite(coins) &&
        coins >= amount
    );
}


/* ================================================================
   16. REFRESH PROFILE
================================================================ */

async function refreshRoomProfile() {

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.loadProfile === "function"
    ) {

        const profile =
            await window.hokmAuth.loadProfile();


        if (
            profile
        ) {

            return profile;
        }
    }


    return roomGetProfile();
}


/* ================================================================
   17. CREATE ROOM
================================================================ */

async function createRoom(
    options = {}
) {

    const client =
        getRoomSupabaseClient();


    if (!client) {

        roomToast(
            "اتصال بازی به سرور آماده نیست.",
            "⚠️"
        );


        return {
            success: false,
            error: "SUPABASE_CLIENT_NOT_FOUND"
        };
    }


    if (!roomRequireLogin()) {

        return {
            success: false,
            error: "LOGIN_REQUIRED"
        };
    }


    if (
        roomState.creating
    ) {

        return {
            success: false,
            error: "ALREADY_CREATING"
        };
    }


    const user =
        roomGetUser();


    const profile =
        await refreshRoomProfile();


    if (!profile) {

        roomToast(
            "پروفایل بازیکن پیدا نشد.",
            "⚠️"
        );


        return {
            success: false,
            error: "PROFILE_NOT_FOUND"
        };
    }


    const roomName =
        String(
            options.name ||
            "اتاق حکم"
        )
            .trim()
            .slice(
                0,
                50
            ) ||
        "اتاق حکم";


    const entryFee =
        Number(
            options.entryFee ??
            ROOM_CONFIG.ENTRY_FEE
        );


    if (
        entryFee !== ROOM_CONFIG.ENTRY_FEE
    ) {

        roomToast(
            "هزینه ورود هر بازی ۴۰۰ سکه است.",
            "🪙"
        );


        return {
            success: false,
            error: "INVALID_ENTRY_FEE"
        };
    }


    roomState.creating =
        true;


    roomShowLoading(
        "در حال ساخت اتاق..."
    );


    try {

        let createdRoom =
            null;


        let lastError =
            null;


        /*
         * چند بار تلاش برای تولید کد یکتا
         */

        for (
            let attempt = 0;
            attempt < 10;
            attempt++
        ) {

            const code =
                generateRoomCode();


            const roomData = {

                code,

                name: roomName,

                host_id:
                    user.id,

                entry_fee:
                    ROOM_CONFIG.ENTRY_FEE,

                is_private:
                    options.isPrivate !== false,

                status:
                    ROOM_CONFIG.WAITING_STATUS,

                max_players:
                    ROOM_CONFIG.MAX_PLAYERS

            };


            const result =
                await client
                    .from("rooms")
                    .insert(
                        roomData
                    )
                    .select()
                    .single();


            if (!result.error) {

                createdRoom =
                    result.data;

                break;
            }


            lastError =
                result.error;


            /*
             * duplicate code
             */

            if (
                result.error.code !== "23505"
            ) {

                break;
            }
        }


        if (!createdRoom) {

            console.error(
                "خطای ساخت اتاق:",
                lastError
            );


            roomToast(
                "ساخت اتاق انجام نشد.",
                "❌"
            );


            return {
                success: false,
                error: lastError
            };
        }


        /*
         * میزبان را وارد اتاق می‌کنیم.
         */

        const hostResult =
            await joinRoomSeat(
                createdRoom.id,
                user.id,
                0,
                "A",
                true
            );


        if (!hostResult.success) {

            /*
             * اگر ورود میزبان شکست خورد،
             * اتاق بدون بازیکن باقی نمی‌ماند.
             */

            await client
                .from("rooms")
                .delete()
                .eq(
                    "id",
                    createdRoom.id
                );


            return hostResult;
        }


        roomState.currentRoom =
            createdRoom;


        roomState.currentRoomId =
            createdRoom.id;


        roomState.currentRoomCode =
            createdRoom.code;


        roomState.status =
            createdRoom.status;


        roomState.isHost =
            true;


        roomState.currentSeat =
            0;


        roomState.currentTeam =
            "A";


        await loadRoom(
            createdRoom.id
        );


        await subscribeToRoom(
            createdRoom.id
        );


        updateRoomUI();


        roomEvents.emit(
            "roomCreated",
            createdRoom
        );


        roomToast(
            `اتاق ساخته شد. کد اتاق: ${createdRoom.code}`,
            "🎮",
            5000
        );


        return {

            success: true,

            room:
                createdRoom,

            code:
                createdRoom.code

        };


    } catch (error) {

        console.error(
            "خطای createRoom:",
            error
        );


        roomToast(
            "خطایی هنگام ساخت اتاق رخ داد.",
            "❌"
        );


        return {
            success: false,
            error
        };


    } finally {

        roomState.creating =
            false;


        roomHideLoading();
    }
}


/* ================================================================
   18. JOIN ROOM
================================================================ */

async function joinRoom(
    roomCode,
    options = {}
) {

    const client =
        getRoomSupabaseClient();


    if (!client) {

        roomToast(
            "اتصال Supabase آماده نیست.",
            "⚠️"
        );


        return {
            success: false,
            error: "SUPABASE_CLIENT_NOT_FOUND"
        };
    }


    if (!roomRequireLogin()) {

        return {
            success: false,
            error: "LOGIN_REQUIRED"
        };
    }


    if (
        roomState.joining
    ) {

        return {
            success: false,
            error: "ALREADY_JOINING"
        };
    }


    const code =
        normalizeRoomCode(
            roomCode
        );


    if (
        !isValidRoomCode(
            code
        )
    ) {

        roomToast(
            "کد اتاق باید ۶ رقم باشد.",
            "⚠️"
        );


        return {
            success: false,
            error: "INVALID_ROOM_CODE"
        };
    }


    const user =
        roomGetUser();


    roomState.joining =
        true;


    roomShowLoading(
        "در حال ورود به اتاق..."
    );


    try {

        /*
         * پیدا کردن اتاق
         */

        const {
            data: room,
            error: roomError
        } = await client
            .from("rooms")
            .select("*")
            .eq(
                "code",
                code
            )
            .maybeSingle();


        if (roomError) {

            console.error(
                "خطای دریافت اتاق:",
                roomError
            );


            roomToast(
                "دریافت اطلاعات اتاق ناموفق بود.",
                "❌"
            );


            return {
                success: false,
                error: roomError
            };
        }


        if (!room) {

            roomToast(
                "اتاقی با این کد پیدا نشد.",
                "❌"
            );


            return {
                success: false,
                error: "ROOM_NOT_FOUND"
            };
        }


        /*
         * اتاق‌های بسته یا تمام‌شده
         */

        if (
            room.status === ROOM_CONFIG.CLOSED_STATUS ||
            room.status === ROOM_CONFIG.FINISHED_STATUS
        ) {

            roomToast(
                "این اتاق دیگر قابل ورود نیست.",
                "⚠️"
            );


            return {
                success: false,
                error: "ROOM_CLOSED"
            };
        }


        /*
         * بررسی اینکه بازیکن قبلاً داخل اتاق است
         */

        const {
            data: existingPlayer,
            error: existingError
        } = await client
            .from("room_players")
            .select("*")
            .eq(
                "room_id",
                room.id
            )
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();


        if (existingError) {

            console.error(
                existingError
            );
        }


        if (existingPlayer) {

            roomState.currentRoom =
                room;


            roomState.currentRoomId =
                room.id;


            roomState.currentRoomCode =
                room.code;


            roomState.currentSeat =
                existingPlayer.seat;


            roomState.currentTeam =
                existingPlayer.team;


            roomState.isReady =
                existingPlayer.is_ready;


            roomState.isHost =
                room.host_id === user.id;


            await loadRoom(
                room.id
            );


            await subscribeToRoom(
                room.id
            );


            updateRoomUI();


            roomToast(
                "به اتاق برگشتی. 🎮",
                "👋"
            );


            return {
                success: true,
                room
            };
        }


        /*
         * بررسی ظرفیت
         */

        const {
            count,
            error: countError
        } = await client
            .from("room_players")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "room_id",
                room.id
            )
            .is(
                "left_at",
                null
            );


        if (countError) {

            console.error(
                countError
            );


            return {
                success: false,
                error: countError
            };
        }


        if (
            Number(count || 0) >=
            ROOM_CONFIG.MAX_PLAYERS
        ) {

            roomToast(
                "ظرفیت این اتاق تکمیل است.",
                "🚫"
            );


            return {
                success: false,
                error: "ROOM_FULL"
            };
        }


        /*
         * پیدا کردن اولین صندلی خالی
         */

        const seat =
            await findAvailableSeat(
                room.id
            );


        if (
            seat === null
        ) {

            roomToast(
                "صندلی خالی در اتاق وجود ندارد.",
                "🚫"
            );


            return {
                success: false,
                error: "NO_SEAT"
            };
        }


        const team =
            getTeamForSeat(
                seat
            );


        const result =
            await joinRoomSeat(
                room.id,
                user.id,
                seat,
                team,
                false
            );


        if (!result.success) {

            return result;
        }


        roomState.currentRoom =
            room;


        roomState.currentRoomId =
            room.id;


        roomState.currentRoomCode =
            room.code;


        roomState.currentSeat =
            seat;


        roomState.currentTeam =
            team;


        roomState.isHost =
            room.host_id === user.id;


        roomState.isReady =
            false;


        await loadRoom(
            room.id
        );


        await subscribeToRoom(
            room.id
        );


        updateRoomUI();


        roomEvents.emit(
            "roomJoined",
            room
        );


        roomToast(
            "با موفقیت وارد اتاق شدی. 🎮",
            "✅"
        );


        return {

            success: true,

            room,

            seat,

            team

        };


    } catch (error) {

        console.error(
            "خطای joinRoom:",
            error
        );


        roomToast(
            "ورود به اتاق انجام نشد.",
            "❌"
        );


        return {
            success: false,
            error
        };


    } finally {

        roomState.joining =
            false;


        roomHideLoading();
    }
}


/* ================================================================
   19. JOIN ROOM SEAT
================================================================ */

async function joinRoomSeat(
    roomId,
    userId,
    seat,
    team,
    isHost = false
) {

    const client =
        getRoomSupabaseClient();


    if (!client) {

        return {
            success: false,
            error: "SUPABASE_CLIENT_NOT_FOUND"
        };
    }


    const {
        data,
        error
    } = await client
        .from("room_players")
        .insert({

            room_id:
                roomId,

            user_id:
                userId,

            seat:
                seat,

            team:
                team,

            is_ready:
                isHost,

            joined_at:
                new Date().toISOString(),

            left_at:
                null

        })
        .select()
        .single();


    if (error) {

        console.error(
            "خطای ورود بازیکن به اتاق:",
            error
        );


        if (
            error.code === "23505"
        ) {

            roomToast(
                "این صندلی یا جایگاه قبلاً گرفته شده است.",
                "⚠️"
            );
        }


        return {
            success: false,
            error
        };
    }


    roomState.currentPlayer =
        data;


    return {

        success: true,

        player:
            data

    };
}


/* ================================================================
   20. FIND AVAILABLE SEAT
================================================================ */

async function findAvailableSeat(
    roomId
) {

    const client =
        getRoomSupabaseClient();


    if (!client) {

        return null;
    }


    const {
        data,
        error
    } = await client
        .from("room_players")
        .select(
            "seat"
        )
        .eq(
            "room_id",
            roomId
        )
        .is(
            "left_at",
            null
        );


    if (error) {

        console.error(
            "خطای دریافت صندلی‌ها:",
            error
        );


        return null;
    }


    const occupied =
        new Set(
            (data || [])
                .map(
                    item =>
                        Number(
                            item.seat
                        )
                )
        );


    for (
        const seat of ROOM_CONFIG.SEATS
    ) {

        if (
            !occupied.has(
                seat
            )
        ) {

            return seat;
        }
    }


    return null;
}


/* ================================================================
   21. GET TEAM FOR SEAT
================================================================ */

function getTeamForSeat(
    seat
) {

    /*
     * صندلی‌های 0 و 2:
     * تیم A
     *
     * صندلی‌های 1 و 3:
     * تیم B
     */

    return (
        Number(seat) % 2 === 0
            ? ROOM_CONFIG.TEAM_A
            : ROOM_CONFIG.TEAM_B
    );
}


/* ================================================================
   22. LOAD ROOM
================================================================ */

async function loadRoom(
    roomId
) {

    const client =
        getRoomSupabaseClient();


    if (!client || !roomId) {

        return null;
    }


    try {

        const {
            data: room,
            error: roomError
        } = await client
            .from("rooms")
            .select("*")
            .eq(
                "id",
                roomId
            )
            .single();


        if (roomError) {

            console.error(
                "خطای دریافت Room:",
                roomError
            );


            return null;
        }


        const {
            data: players,
            error: playersError
        } = await client
            .from("room_players")
            .select(`
                id,
                room_id,
                user_id,
                seat,
                team,
                is_ready,
                joined_at,
                left_at,
                profiles (
                    id,
                    username,
                    avatar_url,
                    level
                )
            `)
            .eq(
                "room_id",
                roomId
            )
            .is(
                "left_at",
                null
            )
            .order(
                "seat",
                {
                    ascending: true
                }
            );


        if (playersError) {

            console.error(
                "خطای دریافت بازیکنان:",
                playersError
            );
        }


        roomState.currentRoom =
            room;


        roomState.currentRoomId =
            room.id;


        roomState.currentRoomCode =
            room.code;


        roomState.status =
            room.status;


        roomState.players =
            players || [];


        const user =
            roomGetUser();


        const me =
            roomState.players.find(
                player =>
                    player.user_id === user?.id
            );


        roomState.currentPlayer =
            me || null;


        roomState.isHost =
            room.host_id === user?.id;


        if (me) {

            roomState.currentSeat =
                Number(
                    me.seat
                );


            roomState.currentTeam =
                me.team;


            roomState.isReady =
                Boolean(
                    me.is_ready
                );

        } else {

            roomState.currentSeat =
                null;


            roomState.currentTeam =
                null;


            roomState.isReady =
                false;
        }


        updateRoomUI();


        roomEvents.emit(
            "roomUpdated",
            {
                room,
                players: players || []
            }
        );


        return {

            room,

            players:
                players || []

        };


    } catch (error) {

        console.error(
            "خطای loadRoom:",
            error
        );


        return null;
    }
}


/* ================================================================
   23. REFRESH CURRENT ROOM
================================================================ */

async function refreshCurrentRoom() {

    if (
        !roomState.currentRoomId
    ) {

        return null;
    }


    return await loadRoom(
        roomState.currentRoomId
    );
}


/* ================================================================
   24. TOGGLE READY
================================================================ */

async function toggleRoomReady() {

    const client =
        getRoomSupabaseClient();


    const user =
        roomGetUser();


    if (
        !client ||
        !user ||
        !roomState.currentRoomId
    ) {

        roomToast(
            "ابتدا وارد یک اتاق شوید.",
            "⚠️"
        );


        return false;
    }


    if (
        roomState.starting
    ) {

        return false;
    }


    const newReady =
        !roomState.isReady;


    const {
        data,
        error
    } = await client
        .from("room_players")
        .update({

            is_ready:
                newReady

        })
        .eq(
            "room_id",
            roomState.currentRoomId
        )
        .eq(
            "user_id",
            user.id
        )
        .select()
        .single();


    if (error) {

        console.error(
            "خطای تغییر Ready:",
            error
        );


        roomToast(
            "وضعیت آماده‌بودن تغییر نکرد.",
            "❌"
        );


        return false;
    }


    roomState.isReady =
        Boolean(
            data.is_ready
        );


    updateRoomUI();


    roomEvents.emit(
        "readyChanged",
        data
    );


    roomToast(
        roomState.isReady
            ? "آماده شدی! ✅"
            : "از حالت آماده خارج شدی.",
        roomState.isReady
            ? "🟢"
            : "⚪"
    );


    return true;
}


/* ================================================================
   25. CHANGE SEAT
================================================================ */

async function changeRoomSeat(
    newSeat
) {

    const client =
        getRoomSupabaseClient();


    const user =
        roomGetUser();


    if (
        !client ||
        !user ||
        !roomState.currentRoomId
    ) {

        return false;
    }


    const seat =
        Number(
            newSeat
        );


    if (
        !ROOM_CONFIG.SEATS.includes(
            seat
        )
    ) {

        roomToast(
            "صندلی انتخاب‌شده معتبر نیست.",
            "⚠️"
        );


        return false;
    }


    /*
     * بررسی صندلی
     */

    const {
        data: occupied,
        error: occupiedError
    } = await client
        .from("room_players")
        .select("id,user_id")
        .eq(
            "room_id",
            roomState.currentRoomId
        )
        .eq(
            "seat",
            seat
        )
        .is(
            "left_at",
            null
        )
        .maybeSingle();


    if (occupiedError) {

        console.error(
            occupiedError
        );


        return false;
    }


    if (
        occupied &&
        occupied.user_id !== user.id
    ) {

        roomToast(
            "این صندلی قبلاً گرفته شده است.",
            "🚫"
        );


        return false;
    }


    const {
        data,
        error
    } = await client
        .from("room_players")
        .update({

            seat,

            team:
                getTeamForSeat(
                    seat
                ),

            is_ready:
                false

        })
        .eq(
            "room_id",
            roomState.currentRoomId
        )
        .eq(
            "user_id",
            user.id
        )
        .select()
        .single();


    if (error) {

        console.error(
            "خطای تغییر صندلی:",
            error
        );


        roomToast(
            "تغییر صندلی انجام نشد.",
            "❌"
        );


        return false;
    }


    roomState.currentSeat =
        seat;


    roomState.currentTeam =
        getTeamForSeat(
            seat
        );


    roomState.isReady =
        false;


    roomState.currentPlayer =
        data;


    await refreshCurrentRoom();


    roomEvents.emit(
        "seatChanged",
        data
    );


    return true;
}


/* ================================================================
   26. LEAVE ROOM
================================================================ */

async function leaveRoom(
    options = {}
) {

    const client =
        getRoomSupabaseClient();


    const user =
        roomGetUser();


    if (
        !client ||
        !user
    ) {

        clearRoomState();


        return true;
    }


    if (
        roomState.leaving
    ) {

        return false;
    }


    roomState.leaving =
        true;


    try {

        const roomId =
            roomState.currentRoomId;


        if (!roomId) {

            clearRoomState();

            return true;
        }


        /*
         * خروج نرم:
         * left_at ثبت می‌شود.
         */

        const {
            error
        } = await client
            .from("room_players")
            .update({

                left_at:
                    new Date().toISOString(),

                is_ready:
                    false

            })
            .eq(
                "room_id",
                roomId
            )
            .eq(
                "user_id",
                user.id
            );


        if (error) {

            console.error(
                "خطای خروج از اتاق:",
                error
            );


            roomToast(
                "خروج از اتاق انجام نشد.",
                "❌"
            );


            return false;
        }


        /*
         * اگر میزبان خارج شود،
         * میزبان جدید تعیین می‌شود.
         */

        if (
            roomState.isHost
        ) {

            await transferHostAfterLeave(
                roomId,
                user.id
            );
        }


        await unsubscribeFromRoom();


        clearRoomState();


        updateRoomUI();


        roomEvents.emit(
            "roomLeft",
            {
                roomId
            }
        );


        if (
            options.silent !== true
        ) {

            roomToast(
                "از اتاق خارج شدی.",
                "🚪"
            );
        }


        return true;


    } catch (error) {

        console.error(
            "خطای leaveRoom:",
            error
        );


        return false;


    } finally {

        roomState.leaving =
            false;
    }
}


/* ================================================================
   27. TRANSFER HOST
================================================================ */

async function transferHostAfterLeave(
    roomId,
    leavingUserId
) {

    const client =
        getRoomSupabaseClient();


    if (!client) {

        return false;
    }


    try {

        const {
            data: players
        } = await client
            .from("room_players")
            .select(`
                user_id,
                seat,
                joined_at
            `)
            .eq(
                "room_id",
                roomId
            )
            .is(
                "left_at",
                null
            )
            .order(
                "joined_at",
                {
                    ascending: true
                }
            );


        const nextHost =
            (players || [])
                .find(
                    player =>
                        player.user_id !==
                        leavingUserId
                );


        if (!nextHost) {

            /*
             * اتاق خالی شده است.
             */

            await client
                .from("rooms")
                .update({

                    status:
                        ROOM_CONFIG.CLOSED_STATUS,

                    closed_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    roomId
                );


            return true;
        }


        await client
            .from("rooms")
            .update({

                host_id:
                    nextHost.user_id

            })
            .eq(
                "id",
                roomId
            );


        return true;


    } catch (error) {

        console.error(
            "خطای انتقال میزبان:",
            error
        );


        return false;
    }
}


/* ================================================================
   28. CLEAR ROOM STATE
================================================================ */

function clearRoomState() {

    roomState.currentRoom =
        null;


    roomState.currentRoomId =
        null;


    roomState.currentRoomCode =
        null;


    roomState.currentGameId =
        null;


    roomState.currentPlayer =
        null;


    roomState.players =
        [];


    roomState.isHost =
        false;


    roomState.isReady =
        false;


    roomState.currentSeat =
        null;


    roomState.currentTeam =
        null;


    roomState.status =
        "none";


    roomState.starting =
        false;


    roomState.lastError =
        null;
}


/* ================================================================
   29. COUNT READY PLAYERS
================================================================ */

function getReadyPlayersCount() {

    return roomState.players.filter(
        player =>
            Boolean(
                player.is_ready
            )
    ).length;
}


/* ================================================================
   30. COUNT ACTIVE PLAYERS
================================================================ */

function getActivePlayersCount() {

    return roomState.players.filter(
        player =>
            !player.left_at
    ).length;
}


/* ================================================================
   31. CHECK CAN START
================================================================ */

function canStartRoom() {

    if (
        !roomState.currentRoom
    ) {

        return {
            allowed: false,
            reason: "NO_ROOM"
        };
    }


    if (
        !roomState.isHost
    ) {

        return {
            allowed: false,
            reason: "NOT_HOST"
        };
    }


    if (
        roomState.status !==
        ROOM_CONFIG.WAITING_STATUS
    ) {

        return {
            allowed: false,
            reason: "ROOM_NOT_WAITING"
        };
    }


    const activePlayers =
        getActivePlayersCount();


    if (
        activePlayers !==
        ROOM_CONFIG.MAX_PLAYERS
    ) {

        return {
            allowed: false,
            reason: "NOT_ENOUGH_PLAYERS",
            count: activePlayers
        };
    }


    const readyPlayers =
        getReadyPlayersCount();


    if (
        readyPlayers !==
        ROOM_CONFIG.MAX_PLAYERS
    ) {

        return {
            allowed: false,
            reason: "NOT_ALL_READY",
            count: readyPlayers
        };
    }


    return {
        allowed: true
    };
}


/* ================================================================
   32. CHARGE ENTRY FEE
================================================================ */

async function chargeEntryFee(
    userId,
    gameId = null
) {

    const client =
        getRoomSupabaseClient();


    if (!client) {

        return {
            success: false,
            error: "SUPABASE_CLIENT_NOT_FOUND"
        };
    }


    const profile =
        await refreshRoomProfile();


    if (!profile) {

        return {
            success: false,
            error: "PROFILE_NOT_FOUND"
        };
    }


    const currentCoins =
        Number(
            profile.coins || 0
        );


    const fee =
        ROOM_CONFIG.ENTRY_FEE;


    if (
        currentCoins < fee
    ) {

        roomToast(
            `برای شروع بازی حداقل ${fee.toLocaleString("fa-IR")} سکه لازم داری.`,
            "🪙",
            4000
        );


        roomEvents.emit(
            "insufficientCoins",
            {
                required: fee,
                current: currentCoins
            }
        );


        return {
            success: false,
            error: "INSUFFICIENT_COINS"
        };
    }


    /*
     * کاهش سکه
     */

    const newBalance =
        currentCoins -
        fee;


    const {
        data: updatedProfile,
        error: updateError
    } = await client
        .from("profiles")
        .update({

            coins:
                newBalance

        })
        .eq(
            "id",
            userId
        )
        .select()
        .single();


    if (updateError) {

        console.error(
            "خطای پرداخت هزینه بازی:",
            updateError
        );


        roomToast(
            "پرداخت هزینه بازی انجام نشد.",
            "❌"
        );


        return {
            success: false,
            error: updateError
        };
    }


    /*
     * ثبت تراکنش
     */

    const {
        error: transactionError
    } = await client
        .from("coin_transactions")
        .insert({

            user_id:
                userId,

            amount:
                -fee,

            balance_after:
                newBalance,

            transaction_type:
                "game_entry",

            description:
                "هزینه ورود به بازی حکم",

            reference_id:
                gameId || null

        });


    if (transactionError) {

        console.warn(
            "ثبت تراکنش سکه ناموفق بود:",
            transactionError
        );
    }


    /*
     * هماهنگ‌سازی Frontend
     */

    if (
        window.state?.player
    ) {

        window.state.player.coins =
            newBalance;
    }


    if (
        window.hokmAuth &&
        window.hokmAuth.loadProfile
    ) {

        await window.hokmAuth.loadProfile();
    }


    if (
        typeof window.updatePlayerUI === "function"
    ) {

        window.updatePlayerUI();
    }


    roomEvents.emit(
        "coinsCharged",
        {

            amount:
                fee,

            balance:
                newBalance,

            gameId:
                gameId

        }
    );


    return {

        success: true,

        amount:
            fee,

        balance:
            newBalance,

        profile:
            updatedProfile

    };
}


/* ================================================================
   33. START GAME
================================================================ */

async function startRoomGame() {

    const client =
        getRoomSupabaseClient();


    const user =
        roomGetUser();


    if (
        !client ||
        !user
    ) {

        roomToast(
            "برای شروع بازی باید وارد حساب باشید.",
            "🔐"
        );


        return {
            success: false,
            error: "LOGIN_REQUIRED"
        };
    }


    if (
        roomState.starting
    ) {

        return {
            success: false,
            error: "ALREADY_STARTING"
        };
    }


    const permission =
        canStartRoom();


    if (
        !permission.allowed
    ) {

        switch (
            permission.reason
        ) {

            case "NOT_HOST":

                roomToast(
                    "فقط میزبان می‌تواند بازی را شروع کند.",
                    "👑"
                );

                break;


            case "NOT_ENOUGH_PLAYERS":

                roomToast(
                    `برای شروع باید ۴ بازیکن داخل اتاق باشند. اکنون ${permission.count} نفر هستند.`,
                    "👥"
                );

                break;


            case "NOT_ALL_READY":

                roomToast(
                    "همه بازیکنان باید آماده باشند.",
                    "⏳"
                );

                break;


            default:

                roomToast(
                    "فعلاً امکان شروع بازی وجود ندارد.",
                    "⚠️"
                );
        }


        return {
            success: false,
            error: permission.reason
        };
    }


    roomState.starting =
        true;


    roomShowLoading(
        "در حال آماده‌سازی بازی..."
    );


    try {

        /*
         * تغییر وضعیت اتاق به starting
         */

        const {
            data: updatedRoom,
            error: roomUpdateError
        } = await client
            .from("rooms")
            .update({

                status:
                    ROOM_CONFIG.STARTING_STATUS

            })
            .eq(
                "id",
                roomState.currentRoomId
            )
            .eq(
                "host_id",
                user.id
            )
            .eq(
                "status",
                ROOM_CONFIG.WAITING_STATUS
            )
            .select()
            .single();


        if (roomUpdateError) {

            console.error(
                "خطای شروع اتاق:",
                roomUpdateError
            );


            roomToast(
                "شروع بازی انجام نشد.",
                "❌"
            );


            return {
                success: false,
                error: roomUpdateError
            };
        }


        roomState.currentRoom =
            updatedRoom;


        roomState.status =
            ROOM_CONFIG.STARTING_STATUS;


        /*
         * ساخت Game
         *
         * موتور کامل بازی در game.js
         * ادامه این فرآیند را مدیریت می‌کند.
         */

        const {
            data: game,
            error: gameError
        } = await client
            .from("games")
            .insert({

                room_id:
                    roomState.currentRoomId,

                status:
                    "waiting",

                phase:
                    "idle",

                leader_seat:
                    0,

                trick_number:
                    0,

                team_a_tricks:
                    0,

                team_b_tricks:
                    0,

                team_a_score:
                    0,

                team_b_score:
                    0,

                round_number:
                    1,

                started_at:
                    new Date().toISOString()

            })
            .select()
            .single();


        if (gameError) {

            console.error(
                "خطای ساخت Game:",
                gameError
            );


            /*
             * بازگرداندن وضعیت اتاق
             */

            await client
                .from("rooms")
                .update({

                    status:
                        ROOM_CONFIG.WAITING_STATUS

                })
                .eq(
                    "id",
                    roomState.currentRoomId
                );


            roomToast(
                "ساخت بازی انجام نشد.",
                "❌"
            );


            return {
                success: false,
                error: gameError
            };
        }


        roomState.currentGameId =
            game.id;


        /*
         * ایجاد Game Players
         */

        const players =
            roomState.players
                .filter(
                    player =>
                        !player.left_at
                );


        const gamePlayers =
            players.map(
                player => ({

                    game_id:
                        game.id,

                    user_id:
                        player.user_id,

                    seat:
                        player.seat,

                    team:
                        player.team,

                    is_host:
                        player.user_id ===
                        roomState.currentRoom.host_id,

                    final_tricks:
                        0,

                    final_coins_change:
                        0

                })
            );


        const {
            error: gamePlayersError
        } = await client
            .from("game_players")
            .insert(
                gamePlayers
            );


        if (gamePlayersError) {

            console.error(
                "خطای ایجاد بازیکنان بازی:",
                gamePlayersError
            );


            await client
                .from("games")
                .delete()
                .eq(
                    "id",
                    game.id
                );


            await client
                .from("rooms")
                .update({

                    status:
                        ROOM_CONFIG.WAITING_STATUS

                })
                .eq(
                    "id",
                    roomState.currentRoomId
                );


            roomToast(
                "آماده‌سازی بازیکنان انجام نشد.",
                "❌"
            );


            return {
                success: false,
                error: gamePlayersError
            };
        }


        /*
         * پرداخت ۴۰۰ سکه
         *
         * هزینه برای هر بازیکن انجام می‌شود.
         */

        const chargedPlayers = [];


        for (
            const player of players
        ) {

            const result =
                await chargeEntryFee(
                    player.user_id,
                    game.id
                );


            if (!result.success) {

                /*
                 * بازی نباید با بازیکنی که
                 * هزینه را ندارد شروع شود.
                 *
                 * بازگرداندن وضعیت اتاق
                 */

                await client
                    .from("rooms")
                    .update({

                        status:
                            ROOM_CONFIG.WAITING_STATUS

                    })
                    .eq(
                        "id",
                        roomState.currentRoomId
                    );


                /*
                 * بازی ایجادشده را حذف می‌کنیم.
                 */

                await client
                    .from("games")
                    .delete()
                    .eq(
                        "id",
                        game.id
                    );


                roomToast(
                    "یکی از بازیکنان سکه کافی برای شروع بازی ندارد.",
                    "🪙",
                    4500
                );


                return {
                    success: false,
                    error: "PLAYER_INSUFFICIENT_COINS",
                    playerId: player.user_id
                };
            }


            chargedPlayers.push({
                userId: player.user_id,
                amount: result.amount
            });
        }


        /*
         * تغییر وضعیت بازی
         */

        const {
            data: activeGame,
            error: activeGameError
        } = await client
            .from("games")
            .update({

                status:
                    "active",

                phase:
                    "dealing",

                started_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                game.id
            )
            .select()
            .single();


        if (activeGameError) {

            console.error(
                "خطای فعال‌سازی بازی:",
                activeGameError
            );


            return {
                success: false,
                error: activeGameError
            };
        }


        /*
         * تغییر اتاق به playing
         */

        const {
            data: playingRoom,
            error: playingRoomError
        } = await client
            .from("rooms")
            .update({

                status:
                    ROOM_CONFIG.PLAYING_STATUS

            })
            .eq(
                "id",
                roomState.currentRoomId
            )
            .select()
            .single();


        if (playingRoomError) {

            console.error(
                "خطای تغییر وضعیت اتاق:",
                playingRoomError
            );
        }


        roomState.currentRoom =
            playingRoom ||
            roomState.currentRoom;


        roomState.status =
            ROOM_CONFIG.PLAYING_STATUS;


        roomState.currentGameId =
            activeGame.id;


        updateRoomUI();


        roomEvents.emit(
            "gameStarted",
            {

                game:
                    activeGame,

                room:
                    roomState.currentRoom,

                players,

                chargedPlayers

            }
        );


        /*
         * اطلاع به game.js
         */

        if (
            typeof window.initializeGameFromRoom ===
            "function"
        ) {

            await window.initializeGameFromRoom(
                activeGame,
                roomState.currentRoom,
                players
            );
        }


        roomToast(
            "بازی شروع شد! 🎮",
            "🔥",
            3500
        );


        return {

            success: true,

            game:
                activeGame,

            room:
                roomState.currentRoom

        };


    } catch (error) {

        console.error(
            "خطای startRoomGame:",
            error
        );


        roomToast(
            "خطایی هنگام شروع بازی رخ داد.",
            "❌"
        );


        return {
            success: false,
            error
        };


    } finally {

        roomState.starting =
            false;


        roomHideLoading();
    }
}


/* ================================================================
   34. SUBSCRIBE TO ROOM
================================================================ */

async function subscribeToRoom(
    roomId
) {

    const client =
        getRoomSupabaseClient();


    if (
        !client ||
        !roomId
    ) {

        return null;
    }


    await unsubscribeFromRoom();


    const channelName =
        `hokm-room-${roomId}`;


    const channel =
        client.channel(
            channelName
        );


    /*
     * Room changes
     */

    channel.on(
        "postgres_changes",
        {

            event: "*",

            schema: "public",

            table: "rooms",

            filter:
                `id=eq.${roomId}`

        },

        payload => {

            console.log(
                "Room Realtime:",
                payload
            );


            if (
                payload.eventType ===
                "UPDATE"
            ) {

                roomState.currentRoom =
                    payload.new;


                roomState.status =
                    payload.new.status;


                updateRoomUI();


                roomEvents.emit(
                    "roomRealtime",
                    payload
                );


                if (
                    payload.new.status ===
                    ROOM_CONFIG.PLAYING_STATUS
                ) {

                    roomEvents.emit(
                        "gameReady",
                        payload.new
                    );
                }
            }
        }
    );


    /*
     * Room Players changes
     */

    channel.on(
        "postgres_changes",
        {

            event: "*",

            schema: "public",

            table: "room_players",

            filter:
                `room_id=eq.${roomId}`

        },

        async payload => {

            console.log(
                "Room Players Realtime:",
                payload
            );


            await refreshCurrentRoom();


            roomEvents.emit(
                "playersRealtime",
                payload
            );
        }
    );


    const status =
        await channel.subscribe();


    if (
        status === "SUBSCRIBED"
    ) {

        roomState.realtimeChannel =
            channel;


        roomState.roomChannel =
            channel;


        console.log(
            "Room Realtime connected:",
            roomId
        );


        roomEvents.emit(
            "realtimeConnected",
            roomId
        );


    } else {

        console.warn(
            "Room Realtime status:",
            status
        );
    }


    return channel;
}


/* ================================================================
   35. UNSUBSCRIBE FROM ROOM
================================================================ */

async function unsubscribeFromRoom() {

    const client =
        getRoomSupabaseClient();


    if (
        roomState.realtimeChannel &&
        client
    ) {

        try {

            await client.removeChannel(
                roomState.realtimeChannel
            );

        } catch (error) {

            console.warn(
                "خطا در حذف Room Channel:",
                error
            );
        }
    }


    roomState.realtimeChannel =
        null;


    roomState.roomChannel =
        null;
}


/* ================================================================
   36. COPY ROOM CODE
================================================================ */

async function copyRoomCode() {

    const code =
        roomState.currentRoomCode;


    if (!code) {

        roomToast(
            "کد اتاقی وجود ندارد.",
            "⚠️"
        );


        return false;
    }


    try {

        if (
            navigator.clipboard
        ) {

            await navigator.clipboard.writeText(
                code
            );

        } else {

            const input =
                document.createElement(
                    "input"
                );


            input.value =
                code;


            document.body.appendChild(
                input
            );


            input.select();


            document.execCommand(
                "copy"
            );


            input.remove();
        }


        roomToast(
            "کد اتاق کپی شد. 📋",
            "✅"
        );


        return true;


    } catch (error) {

        console.error(
            "خطای کپی کد:",
            error
        );


        roomToast(
            `کد اتاق: ${code}`,
            "🎮",
            5000
        );


        return false;
    }
}


/* ================================================================
   37. SHARE ROOM
================================================================ */

async function shareRoom() {

    const code =
        roomState.currentRoomCode;


    if (!code) {

        return false;
    }


    const shareText =
        `بیا در بازی حکم آنلاین با من بازی کن 🎮\nکد اتاق: ${code}`;


    try {

        if (
            navigator.share
        ) {

            await navigator.share({

                title:
                    "Hokm Online",

                text:
                    shareText

            });


            return true;
        }


        await copyRoomCode();


        return true;


    } catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            return false;
        }


        console.error(
            "خطای Share:",
            error
        );


        return false;
    }
}


/* ================================================================
   38. GET PLAYER BY SEAT
================================================================ */

function getPlayerBySeat(
    seat
) {

    return roomState.players.find(
        player =>
            Number(
                player.seat
            ) === Number(
                seat
            )
    ) || null;
}


/* ================================================================
   39. GET TEAM PLAYERS
================================================================ */

function getTeamPlayers(
    team
) {

    return roomState.players.filter(
        player =>
            player.team === team
    );
}


/* ================================================================
   40. GET PLAYER DISPLAY DATA
================================================================ */

function getRoomPlayerDisplayData(
    player
) {

    const profile =
        player?.profiles || {};


    return {

        id:
            player?.user_id || "",

        name:
            profile.username ||
            "بازیکن",

        avatar:
            profile.avatar_url ||
            "",

        level:
            Number(
                profile.level || 1
            ),

        seat:
            Number(
                player?.seat ?? 0
            ),

        team:
            player?.team || "",

        ready:
            Boolean(
                player?.is_ready
            ),

        isCurrentUser:
            player?.user_id ===
            roomGetUser()?.id

    };
}


/* ================================================================
   41. UPDATE ROOM UI
================================================================ */

function updateRoomUI() {

    updateRoomBasicInfo();

    updateRoomPlayers();

    updateRoomSeats();

    updateRoomReadyButton();

    updateRoomStartButton();

    updateRoomHostUI();

    updateRoomCoinUI();

    updateRoomStatusUI();


    roomEvents.emit(
        "uiUpdated",
        roomState
    );
}


/* ================================================================
   42. UPDATE BASIC INFO
================================================================ */

function updateRoomBasicInfo() {

    const codeElements =
        document.querySelectorAll(
            "[data-room-code]"
        );


    codeElements.forEach(
        element => {

            element.textContent =
                roomState.currentRoomCode ||
                "------";

        }
    );


    const nameElements =
        document.querySelectorAll(
            "[data-room-name]"
        );


    nameElements.forEach(
        element => {

            element.textContent =
                roomState.currentRoom?.name ||
                "اتاق حکم";

        }
    );


    const feeElements =
        document.querySelectorAll(
            "[data-room-entry-fee]"
        );


    feeElements.forEach(
        element => {

            element.textContent =
                Number(
                    ROOM_CONFIG.ENTRY_FEE
                ).toLocaleString(
                    "fa-IR"
                );

        }
    );


    const playerCountElements =
        document.querySelectorAll(
            "[data-room-player-count]"
        );


    playerCountElements.forEach(
        element => {

            element.textContent =
                `${getActivePlayersCount()} / ${ROOM_CONFIG.MAX_PLAYERS}`;

        }
    );
}


/* ================================================================
   43. UPDATE ROOM PLAYERS
================================================================ */

function updateRoomPlayers() {

    const container =
        document.querySelector(
            "[data-room-players]"
        );


    if (!container) {

        return;
    }


    container.innerHTML = "";


    ROOM_CONFIG.SEATS.forEach(
        seat => {

            const player =
                getPlayerBySeat(
                    seat
                );


            const display =
                player
                    ? getRoomPlayerDisplayData(
                        player
                    )
                    : null;


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "room-player-card";


            if (
                display
            ) {

                element.innerHTML = `

                    <div class="room-player-avatar">

                        ${
                            display.avatar
                                ? `
                                    <img
                                        src="${roomEscapeText(display.avatar)}"
                                        alt=""
                                    >
                                `
                                : `
                                    <span>👤</span>
                                `
                        }

                    </div>


                    <div class="room-player-info">

                        <div class="room-player-name">

                            ${roomEscapeText(display.name)}

                        </div>


                        <div class="room-player-meta">

                            سطح
                            ${display.level.toLocaleString("fa-IR")}

                            ·

                            تیم
                            ${display.team}

                        </div>

                    </div>


                    <div class="room-player-status">

                        ${
                            display.ready
                                ? "🟢 آماده"
                                : "⏳ منتظر"
                        }

                    </div>

                `;

            } else {

                element.innerHTML = `

                    <div class="room-player-avatar empty">

                        ➕

                    </div>


                    <div class="room-player-info">

                        <div class="room-player-name">

                            صندلی ${Number(seat + 1).toLocaleString("fa-IR")}

                        </div>


                        <div class="room-player-meta">

                            منتظر بازیکن...

                        </div>

                    </div>

                `;
            }


            container.appendChild(
                element
            );
        }
    );
}


/* ================================================================
   44. UPDATE ROOM SEATS
================================================================ */

function updateRoomSeats() {

    ROOM_CONFIG.SEATS.forEach(
        seat => {

            const selector =
                `[data-room-seat="${seat}"]`;


            const element =
                document.querySelector(
                    selector
                );


            if (!element) {

                return;
            }


            const player =
                getPlayerBySeat(
                    seat
                );


            const display =
                player
                    ? getRoomPlayerDisplayData(
                        player
                    )
                    : null;


            element.classList.toggle(
                "occupied",
                Boolean(
                    display
                )
            );


            element.classList.toggle(
                "ready",
                Boolean(
                    display?.ready
                )
            );


            element.classList.toggle(
                "current-player",
                Boolean(
                    display?.isCurrentUser
                )
            );


            const nameElement =
                element.querySelector(
                    "[data-seat-name]"
                );


            if (nameElement) {

                nameElement.textContent =
                    display?.name ||
                    "خالی";
            }


            const statusElement =
                element.querySelector(
                    "[data-seat-status]"
                );


            if (statusElement) {

                statusElement.textContent =
                    display
                        ? (
                            display.ready
                                ? "آماده"
                                : "منتظر"
                        )
                        : "صندلی خالی";
            }


            const teamElement =
                element.querySelector(
                    "[data-seat-team]"
                );


            if (teamElement) {

                teamElement.textContent =
                    `تیم ${getTeamForSeat(seat)}`;
            }
        }
    );
}


/* ================================================================
   45. UPDATE READY BUTTON
================================================================ */

function updateRoomReadyButton() {

    const buttons =
        document.querySelectorAll(
            "[data-room-ready]"
        );


    buttons.forEach(
        button => {

            button.disabled =
                !roomState.currentRoom ||
                roomState.status !==
                ROOM_CONFIG.WAITING_STATUS;


            button.textContent =
                roomState.isReady
                    ? "لغو آمادگی"
                    : "آماده‌ام";


            button.classList.toggle(
                "is-ready",
                roomState.isReady
            );
        }
    );
}


/* ================================================================
   46. UPDATE START BUTTON
================================================================ */

function updateRoomStartButton() {

    const buttons =
        document.querySelectorAll(
            "[data-room-start]"
        );


    const permission =
        canStartRoom();


    buttons.forEach(
        button => {

            button.disabled =
                !permission.allowed ||
                roomState.starting;


            if (
                roomState.starting
            ) {

                button.textContent =
                    "در حال شروع...";

            } else {

                button.textContent =
                    "شروع بازی";
            }
        }
    );
}


/* ================================================================
   47. UPDATE HOST UI
================================================================ */

function updateRoomHostUI() {

    const hostElements =
        document.querySelectorAll(
            "[data-room-host]"
        );


    hostElements.forEach(
        element => {

            element.style.display =
                roomState.isHost
                    ? ""
                    : "none";

        }
    );


    const hostIdElements =
        document.querySelectorAll(
            "[data-room-host-id]"
        );


    hostIdElements.forEach(
        element => {

            element.textContent =
                roomState.currentRoom?.host_id ||
                "";

        }
    );
}


/* ================================================================
   48. UPDATE COIN UI
================================================================ */

function updateRoomCoinUI() {

    const coins =
        getRoomPlayerCoins();


    const elements =
        document.querySelectorAll(
            "[data-room-coins]"
        );


    elements.forEach(
        element => {

            element.textContent =
                Number(
                    coins
                ).toLocaleString(
                    "fa-IR"
                );

        }
    );


    const feeElements =
        document.querySelectorAll(
            "[data-room-fee]"
        );


    feeElements.forEach(
        element => {

            element.textContent =
                Number(
                    ROOM_CONFIG.ENTRY_FEE
                ).toLocaleString(
                    "fa-IR"
                );

        }
    );


    const remaining =
        Math.max(
            0,
            coins -
            ROOM_CONFIG.ENTRY_FEE
        );


    const remainingElements =
        document.querySelectorAll(
            "[data-room-coins-after-fee]"
        );


    remainingElements.forEach(
        element => {

            element.textContent =
                Number(
                    remaining
                ).toLocaleString(
                    "fa-IR"
                );

        }
    );
}


/* ================================================================
   49. UPDATE STATUS UI
================================================================ */

function updateRoomStatusUI() {

    const statusElements =
        document.querySelectorAll(
            "[data-room-status]"
        );


    const statusMap = {

        waiting:
            "در انتظار بازیکنان",

        starting:
            "در حال شروع بازی",

        playing:
            "بازی در حال اجرا",

        finished:
            "بازی تمام شده",

        closed:
            "اتاق بسته شده",

        none:
            "بدون اتاق"

    };


    statusElements.forEach(
        element => {

            element.textContent =
                statusMap[
                    roomState.status
                ] ||
                roomState.status;

        }
    );
}


/* ================================================================
   50. HANDLE ROOM CREATE FORM
================================================================ */

async function handleCreateRoomForm(
    event
) {

    if (event) {

        event.preventDefault();
    }


    const nameInput =
        document.querySelector(
            "[data-create-room-name]"
        );


    const name =
        nameInput?.value ||
        "اتاق حکم";


    return await createRoom({
        name
    });
}


/* ================================================================
   51. HANDLE JOIN FORM
================================================================ */

async function handleJoinRoomForm(
    event
) {

    if (event) {

        event.preventDefault();
    }


    const input =
        document.querySelector(
            "[data-join-room-code]"
        );


    const code =
        input?.value ||
        "";


    return await joinRoom(
        code
    );
}


/* ================================================================
   52. ROOM BUTTON EVENTS
================================================================ */

function setupRoomUIEvents() {

    document.addEventListener(
        "click",
        async event => {

            const createButton =
                event.target.closest(
                    "[data-create-room]"
                );


            if (
                createButton
            ) {

                event.preventDefault();


                await handleCreateRoomForm();


                return;
            }


            const joinButton =
                event.target.closest(
                    "[data-join-room]"
                );


            if (
                joinButton
            ) {

                event.preventDefault();


                await handleJoinRoomForm();


                return;
            }


            const readyButton =
                event.target.closest(
                    "[data-room-ready]"
                );


            if (
                readyButton
            ) {

                event.preventDefault();


                await toggleRoomReady();


                return;
            }


            const startButton =
                event.target.closest(
                    "[data-room-start]"
                );


            if (
                startButton
            ) {

                event.preventDefault();


                await startRoomGame();


                return;
            }


            const leaveButton =
                event.target.closest(
                    "[data-room-leave]"
                );


            if (
                leaveButton
            ) {

                event.preventDefault();


                await leaveRoom();


                return;
            }


            const copyButton =
                event.target.closest(
                    "[data-room-copy]"
                );


            if (
                copyButton
            ) {

                event.preventDefault();


                await copyRoomCode();


                return;
            }


            const shareButton =
                event.target.closest(
                    "[data-room-share]"
                );


            if (
                shareButton
            ) {

                event.preventDefault();


                await shareRoom();


                return;
            }


            const seatButton =
                event.target.closest(
                    "[data-room-seat]"
                );


            if (
                seatButton
            ) {

                event.preventDefault();


                const seat =
                    Number(
                        seatButton.dataset.roomSeat
                    );


                await changeRoomSeat(
                    seat
                );
            }

        }
    );


    /*
     * فرم ساخت اتاق
     */

    const createForm =
        document.querySelector(
            "[data-create-room-form]"
        );


    if (createForm) {

        createForm.addEventListener(
            "submit",
            handleCreateRoomForm
        );
    }


    /*
     * فرم ورود به اتاق
     */

    const joinForm =
        document.querySelector(
            "[data-join-room-form]"
        );


    if (joinForm) {

        joinForm.addEventListener(
            "submit",
            handleJoinRoomForm
        );
    }
}


/* ================================================================
   53. AUTH EVENT CONNECTION
================================================================ */

function setupRoomAuthConnection() {

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.onAuthChange ===
        "function"
    ) {

        window.hokmAuth.onAuthChange(
            async data => {

                if (
                    !data?.user
                ) {

                    if (
                        roomState.currentRoomId
                    ) {

                        await unsubscribeFromRoom();
                    }


                    clearRoomState();


                    updateRoomUI();


                    return;
                }


                /*
                 * اگر کاربر وارد حساب شده،
                 * اطلاعات اتاق قبلی در صورت وجود
                 * بازیابی می‌شود.
                 */

                if (
                    roomState.currentRoomId
                ) {

                    await refreshCurrentRoom();
                }
            }
        );
    }
}


/* ================================================================
   54. BEFORE UNLOAD
================================================================ */

function setupRoomUnloadProtection() {

    window.addEventListener(
        "beforeunload",
        () => {

            /*
             * خروج کامل در beforeunload قابل اتکا نیست.
             *
             * بنابراین فقط Realtime channel را
             * در صورت امکان قطع می‌کنیم.
             */

            if (
                roomState.realtimeChannel
            ) {

                const client =
                    getRoomSupabaseClient();


                if (
                    client
                ) {

                    client.removeChannel(
                        roomState.realtimeChannel
                    );
                }
            }
        }
    );
}


/* ================================================================
   55. AUTO RECONNECT
================================================================ */

function setupRoomReconnect() {

    window.addEventListener(
        "online",
        async () => {

            if (
                roomState.currentRoomId
            ) {

                roomToast(
                    "اتصال اینترنت برقرار شد. 🔄",
                    "🌐"
                );


                await refreshCurrentRoom();


                await subscribeToRoom(
                    roomState.currentRoomId
                );
            }
        }
    );
}


/* ================================================================
   56. INITIALIZE ROOM
================================================================ */

async function initializeRoom() {

    if (
        roomState.initialized
    ) {

        return roomState;
    }


    try {

        setupRoomUIEvents();

        setupRoomAuthConnection();

        setupRoomUnloadProtection();

        setupRoomReconnect();


        roomState.initialized =
            true;


        updateRoomUI();


        roomEvents.emit(
            "initialized",
            roomState
        );


        console.log(
            "Hokm Online Room initialized successfully."
        );


        return roomState;


    } catch (error) {

        console.error(
            "خطای initializeRoom:",
            error
        );


        roomState.lastError =
            error;


        return roomState;
    }
}


/* ================================================================
   57. ROOM EVENT HELPERS
================================================================ */

function onRoomCreated(
    callback
) {

    roomEvents.on(
        "roomCreated",
        callback
    );
}


function onRoomJoined(
    callback
) {

    roomEvents.on(
        "roomJoined",
        callback
    );
}


function onRoomLeft(
    callback
) {

    roomEvents.on(
        "roomLeft",
        callback
    );
}


function onRoomUpdated(
    callback
) {

    roomEvents.on(
        "roomUpdated",
        callback
    );
}


function onRoomPlayersChanged(
    callback
) {

    roomEvents.on(
        "playersRealtime",
        callback
    );
}


function onRoomGameStarted(
    callback
) {

    roomEvents.on(
        "gameStarted",
        callback
    );
}


function onRoomReadyChanged(
    callback
) {

    roomEvents.on(
        "readyChanged",
        callback
    );
}


function onRoomCoinsCharged(
    callback
) {

    roomEvents.on(
        "coinsCharged",
        callback
    );
}


/* ================================================================
   58. PUBLIC API
================================================================ */

window.hokmRoom = {

    createRoom,

    joinRoom,

    leaveRoom,

    loadRoom,

    refreshCurrentRoom,

    toggleRoomReady,

    changeRoomSeat,

    startRoomGame,

    copyRoomCode,

    shareRoom,

    getCurrentRoom,

    getCurrentRoomId,

    getCurrentRoomCode,

    getCurrentRoomPlayers,

    getPlayerBySeat,

    getTeamPlayers,

    isRoomHost,

    isRoomReady,

    getReadyPlayersCount,

    getActivePlayersCount,

    canStartRoom,

    chargeEntryFee,

    subscribeToRoom,

    unsubscribeFromRoom,

    initializeRoom,

    onRoomCreated,

    onRoomJoined,

    onRoomLeft,

    onRoomUpdated,

    onRoomPlayersChanged,

    onRoomGameStarted,

    onRoomReadyChanged,

    onRoomCoinsCharged

};


/* ================================================================
   59. GLOBAL SHORTCUTS
================================================================ */

window.createRoom =
    createRoom;


window.joinRoom =
    joinRoom;


window.leaveRoom =
    leaveRoom;


window.loadRoom =
    loadRoom;


window.toggleRoomReady =
    toggleRoomReady;


window.changeRoomSeat =
    changeRoomSeat;


window.startRoomGame =
    startRoomGame;


window.copyRoomCode =
    copyRoomCode;


window.shareRoom =
    shareRoom;


window.getCurrentRoom =
    getCurrentRoom;


window.getCurrentRoomId =
    getCurrentRoomId;


window.getCurrentRoomCode =
    getCurrentRoomCode;


window.getCurrentRoomPlayers =
    getCurrentRoomPlayers;


window.isRoomHost =
    isRoomHost;


window.isRoomReady =
    isRoomReady;


/* ================================================================
   60. START
================================================================ */

function startRoomInitialization() {

    if (
        getRoomSupabaseClient()
    ) {

        initializeRoom();

        return;
    }


    let attempts =
        0;


    const maxAttempts =
        20;


    const timer =
        setInterval(
            () => {

                attempts++;


                if (
                    roomState.initialized
                ) {

                    clearInterval(
                        timer
                    );


                    return;
                }


                if (
                    getRoomSupabaseClient()
                ) {

                    clearInterval(
                        timer
                    );


                    initializeRoom();


                    return;
                }


                if (
                    attempts >= maxAttempts
                ) {

                    clearInterval(
                        timer
                    );


                    console.warn(
                        "Supabase Client برای room.js پیدا نشد."
                    );
                }

            },
            500
        );
}


/* ================================================================
   61. DOM READY
================================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startRoomInitialization
    );

} else {

    startRoomInitialization();
}


/* ================================================================
   END OF ROOM.JS
================================================================ */
