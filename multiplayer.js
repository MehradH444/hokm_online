/* =========================================================
   HOKM ONLINE
   MULTIPLAYER.JS
   مرحله ۷ — سیستم اتاق و بازیکنان آنلاین
   ========================================================= */

(function () {
    "use strict";


    /* =======================================================
       GLOBAL STATE
    ======================================================== */

    window.Multiplayer = {

        initialized: false,

        connected: false,

        channel: null,

        roomCode: null,

        roomName: "",

        isHost: false,

        playerId: null,

        players: [],

        maxPlayers: 4,

        roomState: {
            status: "waiting",
            hostId: null,
            players: []
        },

        reconnectAttempts: 0,

        maxReconnectAttempts: 5

    };


    /* =======================================================
       HELPERS
    ======================================================== */

    function log(...args) {
        console.log("[MULTIPLAYER]", ...args);
    }


    function warn(...args) {
        console.warn("[MULTIPLAYER]", ...args);
    }


    function error(...args) {
        console.error("[MULTIPLAYER]", ...args);
    }


    function generatePlayerId() {

        let id = localStorage.getItem("hokm_player_id");

        if (!id) {

            id =
                "player_" +
                Date.now().toString(36) +
                "_" +
                Math.random()
                    .toString(36)
                    .substring(2, 10);

            localStorage.setItem(
                "hokm_player_id",
                id
            );
        }

        return id;
    }


    function generateRoomCode() {

        return Math.floor(
            100000 +
            Math.random() * 900000
        ).toString();

    }


    function getPlayerName() {

        const possibleIds = [
            "playerName",
            "profileName"
        ];

        for (const id of possibleIds) {

            const element =
                document.getElementById(id);

            if (
                element &&
                element.textContent.trim()
            ) {

                const name =
                    element.textContent.trim();

                if (
                    name !== "بازیکن مهمان" &&
                    name !== "بازیکن"
                ) {
                    return name;
                }
            }
        }


        const savedName =
            localStorage.getItem(
                "hokm_player_name"
            );

        if (savedName) {
            return savedName;
        }


        return "بازیکن مهمان";
    }


    function getAvatar() {

        const savedAvatar =
            localStorage.getItem(
                "hokm_player_avatar"
            );

        return savedAvatar || "👤";
    }


    function showToast(
        message,
        type = "info"
    ) {

        if (
            typeof window.showToast ===
            "function"
        ) {

            window.showToast(
                message,
                type
            );

            return;
        }


        const toast =
            document.getElementById(
                "toast"
            );

        const toastMessage =
            document.getElementById(
                "toastMessage"
            );

        if (
            toast &&
            toastMessage
        ) {

            toastMessage.textContent =
                message;

            toast.classList.add("show");

            setTimeout(() => {

                toast.classList.remove(
                    "show"
                );

            }, 3000);

        }

    }


    function setLoading(
        visible,
        message = "لطفاً صبر کنید..."
    ) {

        const overlay =
            document.getElementById(
                "loadingOverlay"
            );

        const messageElement =
            document.getElementById(
                "loadingMessage"
            );

        if (messageElement) {

            messageElement.textContent =
                message;

        }

        if (!overlay) {
            return;
        }

        if (visible) {

            overlay.classList.remove(
                "hidden"
            );

        } else {

            overlay.classList.add(
                "hidden"
            );

        }

    }


    /* =======================================================
       SUPABASE ACCESS
    ======================================================== */

    function getSupabaseClient() {

        if (
            window.supabaseClient
        ) {
            return window.supabaseClient;
        }


        if (
            window.SupabaseClient
        ) {
            return window.SupabaseClient;
        }


        if (
            window.db &&
            window.db.supabase
        ) {
            return window.db.supabase;
        }


        return null;

    }


    /* =======================================================
       INITIALIZE
    ======================================================== */

    function initialize() {

        if (
            Multiplayer.initialized
        ) {
            return;
        }


        Multiplayer.playerId =
            generatePlayerId();


        Multiplayer.initialized =
            true;


        log(
            "Multiplayer initialized",
            Multiplayer.playerId
        );

    }


    /* =======================================================
       CREATE ROOM
    ======================================================== */

    async function createRoom(
        options = {}
    ) {

        initialize();


        const client =
            getSupabaseClient();


        const roomName =
            options.roomName ||
            "اتاق حکم";


        const entryFee =
            Number(
                options.entryFee || 0
            );


        const isPrivate =
            options.isPrivate !== false;


        const player = {

            id: Multiplayer.playerId,

            name: getPlayerName(),

            avatar: getAvatar(),

            seat: 0,

            ready: true,

            joinedAt:
                new Date().toISOString()

        };


        setLoading(
            true,
            "در حال ساخت اتاق..."
        );


        try {

            /*
             * اگر Supabase متصل باشد،
             * اتاق واقعی در دیتابیس ساخته می‌شود.
             */

            if (client) {

                const roomCode =
                    generateRoomCode();


                const roomData = {

                    room_code: roomCode,

                    name: roomName,

                    host_id:
                        Multiplayer.playerId,

                    max_players: 4,

                    entry_fee: entryFee,

                    is_private: isPrivate,

                    status: "waiting"

                };


                const result =
                    await client
                        .from("rooms")
                        .insert(
                            roomData
                        )
                        .select()
                        .single();


                if (
                    result.error
                ) {

                    throw result.error;

                }


                Multiplayer.roomCode =
                    roomCode;

                Multiplayer.roomName =
                    roomName;

                Multiplayer.isHost =
                    true;


                Multiplayer.roomState = {

                    status: "waiting",

                    hostId:
                        Multiplayer.playerId,

                    players: [player]

                };


                Multiplayer.players =
                    [player];


                await joinRealtimeRoom(
                    roomCode
                );


                await addPlayerToRoom(
                    roomCode,
                    player
                );


                updateRoomUI();


                showToast(
                    "اتاق با موفقیت ساخته شد",
                    "success"
                );


                return {

                    success: true,

                    roomCode,

                    roomName,

                    isHost: true

                };

            }


            /*
             * حالت محلی برای زمانی که
             * هنوز Supabase تنظیم نشده است.
             */

            const localRoomCode =
                generateRoomCode();


            Multiplayer.roomCode =
                localRoomCode;

            Multiplayer.roomName =
                roomName;

            Multiplayer.isHost =
                true;


            Multiplayer.roomState = {

                status: "waiting",

                hostId:
                    Multiplayer.playerId,

                players: [player]

            };


            Multiplayer.players =
                [player];


            saveLocalRoom();


            updateRoomUI();


            showToast(
                `اتاق ساخته شد — کد: ${localRoomCode}`,
                "success"
            );


            return {

                success: true,

                roomCode:
                    localRoomCode,

                roomName,

                isHost: true,

                local: true

            };

        } catch (err) {

            error(
                "Create room error:",
                err
            );


            showToast(
                "ساخت اتاق با خطا مواجه شد",
                "error"
            );


            return {

                success: false,

                error: err

            };

        } finally {

            setLoading(
                false
            );

        }

    }


    /* =======================================================
       JOIN ROOM
    ======================================================== */

    async function joinRoom(
        roomCode
    ) {

        initialize();


        roomCode =
            String(roomCode || "")
                .replace(
                    /\D/g,
                    ""
                )
                .trim();


        if (
            roomCode.length !== 6
        ) {

            showToast(
                "کد اتاق باید ۶ رقمی باشد",
                "error"
            );

            return {
                success: false
            };

        }


        const client =
            getSupabaseClient();


        setLoading(
            true,
            "در حال ورود به اتاق..."
        );


        try {

            if (client) {

                const roomResult =
                    await client
                        .from("rooms")
                        .select("*")
                        .eq(
                            "room_code",
                            roomCode
                        )
                        .single();


                if (
                    roomResult.error ||
                    !roomResult.data
                ) {

                    throw new Error(
                        "اتاق پیدا نشد"
                    );

                }


                const room =
                    roomResult.data;


                if (
                    room.status !==
                    "waiting"
                ) {

                    throw new Error(
                        "این اتاق دیگر قابل ورود نیست"
                    );

                }


                const players =
                    await getRoomPlayers(
                        roomCode
                    );


                if (
                    players.length >= 4
                ) {

                    throw new Error(
                        "اتاق پر است"
                    );

                }


                const player = {

                    id:
                        Multiplayer.playerId,

                    name:
                        getPlayerName(),

                    avatar:
                        getAvatar(),

                    seat:
                        findFreeSeat(
                            players
                        ),

                    ready: true,

                    joinedAt:
                        new Date()
                            .toISOString()

                };


                Multiplayer.roomCode =
                    roomCode;

                Multiplayer.roomName =
                    room.name || "اتاق حکم";

                Multiplayer.isHost =
                    room.host_id ===
                    Multiplayer.playerId;


                await addPlayerToRoom(
                    roomCode,
                    player
                );


                Multiplayer.players =
                    [
                        ...players,
                        player
                    ];


                Multiplayer.roomState = {

                    status:
                        room.status,

                    hostId:
                        room.host_id,

                    players:
                        Multiplayer.players

                };


                await joinRealtimeRoom(
                    roomCode
                );


                updateRoomUI();


                showToast(
                    "با موفقیت وارد اتاق شدی",
                    "success"
                );


                return {

                    success: true,

                    roomCode,

                    players:
                        Multiplayer.players

                };

            }


            /*
             * حالت Local
             */

            const localRoom =
                loadLocalRoom(
                    roomCode
                );


            if (!localRoom) {

                throw new Error(
                    "اتاق پیدا نشد"
                );

            }


            if (
                localRoom.players
                    .length >= 4
            ) {

                throw new Error(
                    "اتاق پر است"
                );

            }


            const player = {

                id:
                    Multiplayer.playerId,

                name:
                    getPlayerName(),

                avatar:
                    getAvatar(),

                seat:
                    findFreeSeat(
                        localRoom.players
                    ),

                ready: true,

                joinedAt:
                    new Date()
                        .toISOString()

            };


            localRoom.players.push(
                player
            );


            Multiplayer.roomCode =
                roomCode;

            Multiplayer.roomName =
                localRoom.name;

            Multiplayer.isHost =
                localRoom.hostId ===
                Multiplayer.playerId;


            Multiplayer.players =
                localRoom.players;


            Multiplayer.roomState =
                localRoom;


            saveLocalRoom();


            updateRoomUI();


            showToast(
                "با موفقیت وارد اتاق شدی",
                "success"
            );


            return {

                success: true,

                roomCode,

                players:
                    Multiplayer.players,

                local: true

            };

        } catch (err) {

            error(
                "Join room error:",
                err
            );


            showToast(
                err.message ||
                "ورود به اتاق انجام نشد",
                "error"
            );


            return {

                success: false,

                error: err

            };

        } finally {

            setLoading(
                false
            );

        }

    }


    /* =======================================================
       GET ROOM PLAYERS
    ======================================================== */

    async function getRoomPlayers(
        roomCode
    ) {

        const client =
            getSupabaseClient();


        if (!client) {

            const room =
                loadLocalRoom(
                    roomCode
                );

            return room
                ? room.players
                : [];

        }


        const result =
            await client
                .from("room_players")
                .select("*")
                .eq(
                    "room_code",
                    roomCode
                )
                .order(
                    "seat",
                    {
                        ascending: true
                    }
                );


        if (
            result.error
        ) {

            throw result.error;

        }


        return result.data || [];

    }


    /* =======================================================
       ADD PLAYER TO ROOM
    ======================================================== */

    async function addPlayerToRoom(
        roomCode,
        player
    ) {

        const client =
            getSupabaseClient();


        if (!client) {
            return true;
        }


        const result =
            await client
                .from("room_players")
                .upsert(

                    {

                        room_code:
                            roomCode,

                        player_id:
                            player.id,

                        player_name:
                            player.name,

                        avatar:
                            player.avatar,

                        seat:
                            player.seat,

                        ready:
                            player.ready

                    },

                    {

                        onConflict:
                            "room_code,player_id"

                    }

                );


        if (
            result.error
        ) {

            throw result.error;

        }


        return true;

    }


    /* =======================================================
       FIND FREE SEAT
    ======================================================== */

    function findFreeSeat(
        players
    ) {

        const usedSeats =
            players.map(
                player =>
                    Number(player.seat)
            );


        for (
            let seat = 0;
            seat < 4;
            seat++
        ) {

            if (
                !usedSeats.includes(
                    seat
                )
            ) {

                return seat;

            }

        }


        return -1;

    }


    /* =======================================================
       REALTIME CONNECTION
    ======================================================== */

    async function joinRealtimeRoom(
        roomCode
    ) {

        const client =
            getSupabaseClient();


        if (!client) {

            log(
                "Supabase unavailable — local mode"
            );

            return;

        }


        if (
            Multiplayer.channel
        ) {

            try {

                await client
                    .removeChannel(
                        Multiplayer.channel
                    );

            } catch (e) {

                warn(
                    "Previous channel removal failed",
                    e
                );

            }

        }


        const channelName =
            `hokm-room-${roomCode}`;


        const channel =
            client.channel(
                channelName,
                {
                    config: {
                        presence: {
                            key:
                                Multiplayer.playerId
                        }
                    }
                }
            );


        Multiplayer.channel =
            channel;


        channel
            .on(
                "presence",
                {
                    event:
                        "sync"
                },
                () => {

                    handlePresenceSync();

                }
            )
            .on(
                "presence",
                {
                    event:
                        "join"
                },
                payload => {

                    log(
                        "Player joined:",
                        payload
                    );

                    handlePresenceSync();

                }
            )
            .on(
                "presence",
                {
                    event:
                        "leave"
                },
                payload => {

                    log(
                        "Player left:",
                        payload
                    );

                    handlePresenceSync();

                }
            )
            .on(
                "broadcast",
                {
                    event:
                        "room_update"
                },
                payload => {

                    handleRoomUpdate(
                        payload
                    );

                }
            )
            .on(
                "broadcast",
                {
                    event:
                        "game_start"
                },
                payload => {

                    handleGameStart(
                        payload
                    );

                }
            );


        const status =
            await channel.subscribe(
                async status => {

                    if (
                        status ===
                        "SUBSCRIBED"
                    ) {

                        Multiplayer.connected =
                            true;

                        Multiplayer.reconnectAttempts =
                            0;


                        await channel
                            .track({

                                id:
                                    Multiplayer.playerId,

                                name:
                                    getPlayerName(),

                                avatar:
                                    getAvatar(),

                                seat:
                                    getCurrentSeat(),

                                roomCode

                            });


                        log(
                            "Connected to room",
                            roomCode
                        );

                    }


                    if (
                        status ===
                        "CHANNEL_ERROR"
                    ) {

                        Multiplayer.connected =
                            false;

                        warn(
                            "Realtime channel error"
                        );

                        tryReconnect();

                    }


                    if (
                        status ===
                        "TIMED_OUT"
                    ) {

                        Multiplayer.connected =
                            false;

                        warn(
                            "Realtime timeout"
                        );

                        tryReconnect();

                    }

                }
            );


        return status;

    }


    /* =======================================================
       PRESENCE SYNC
    ======================================================== */

    function handlePresenceSync() {

        const channel =
            Multiplayer.channel;


        if (!channel) {
            return;
        }


        const state =
            channel.presenceState();


        const players = [];


        Object.keys(state)
            .forEach(key => {

                const entries =
                    state[key];


                if (
                    !entries ||
                    !entries.length
                ) {
                    return;
                }


                const data =
                    entries[
                        entries.length - 1
                    ];


                players.push({

                    id:
                        data.id || key,

                    name:
                        data.name ||
                        "بازیکن",

                    avatar:
                        data.avatar ||
                        "👤",

                    seat:
                        Number(
                            data.seat || 0
                        ),

                    ready:
                        true

                });

            });


        players.sort(
            (a, b) =>
                a.seat - b.seat
        );


        Multiplayer.players =
            players;


        Multiplayer.roomState.players =
            players;


        updateRoomUI();


        checkRoomReady();

    }


    /* =======================================================
       ROOM UPDATE
    ======================================================== */

    async function broadcastRoomUpdate(
        data = {}
    ) {

        const channel =
            Multiplayer.channel;


        if (!channel) {
            return false;
        }


        await channel.send({

            type: "broadcast",

            event: "room_update",

            payload: {

                sender:
                    Multiplayer.playerId,

                roomCode:
                    Multiplayer.roomCode,

                timestamp:
                    Date.now(),

                ...data

            }

        });


        return true;

    }


    function handleRoomUpdate(
        payload
    ) {

        if (!payload) {
            return;
        }


        const data =
            payload.payload ||
            payload;


        if (
            data.sender ===
            Multiplayer.playerId
        ) {
            return;
        }


        if (
            Array.isArray(
                data.players
            )
        ) {

            Multiplayer.players =
                data.players;

            Multiplayer.roomState.players =
                data.players;

        }


        if (
            data.status
        ) {

            Multiplayer.roomState.status =
                data.status;

        }


        updateRoomUI();

        checkRoomReady();

    }


    /* =======================================================
       ROOM READY CHECK
    ======================================================== */

    function checkRoomReady() {

        const startButton =
            document.getElementById(
                "startGameButton"
            );


        const playerCount =
            Multiplayer.players.length;


        const ready =
            playerCount === 4;


        if (startButton) {

            startButton.disabled =
                !ready ||
                !Multiplayer.isHost;

        }


        /*
         * اگر ۴ بازیکن شدند،
         * لابی آماده شروع است.
         */

        if (
            ready &&
            Multiplayer.isHost
        ) {

            showToast(
                "هر ۴ بازیکن وارد شدند؛ بازی آماده شروع است",
                "success"
            );

        }

    }


    /* =======================================================
       START GAME
    ======================================================== */

    async function startGame() {

        initialize();


        if (
            !Multiplayer.isHost
        ) {

            showToast(
                "فقط میزبان می‌تواند بازی را شروع کند",
                "error"
            );

            return false;

        }


        if (
            Multiplayer.players.length !==
            4
        ) {

            showToast(
                "برای شروع باید ۴ بازیکن در اتاق باشند",
                "error"
            );

            return false;

        }


        Multiplayer.roomState.status =
            "playing";


        const gamePayload = {

            roomCode:
                Multiplayer.roomCode,

            players:
                Multiplayer.players,

            startedAt:
                Date.now(),

            hostId:
                Multiplayer.playerId

        };


        const client =
            getSupabaseClient();


        if (client) {

            try {

                await client
                    .from("rooms")
                    .update({

                        status:
                            "playing"

                    })
                    .eq(
                        "room_code",
                        Multiplayer.roomCode
                    );

            } catch (err) {

                warn(
                    "Could not update room status",
                    err
                );

            }

        }


        await broadcastGameStart(
            gamePayload
        );


        handleGameStart({
            payload:
                gamePayload
        });


        return true;

    }


    /* =======================================================
       BROADCAST GAME START
    ======================================================== */

    async function broadcastGameStart(
        data
    ) {

        const channel =
            Multiplayer.channel;


        if (!channel) {
            return false;
        }


        await channel.send({

            type: "broadcast",

            event: "game_start",

            payload: data

        });


        return true;

    }


    /* =======================================================
       HANDLE GAME START
    ======================================================== */

    function handleGameStart(
        payload
    ) {

        const data =
            payload.payload ||
            payload;


        Multiplayer.roomState.status =
            "playing";


        if (
            Array.isArray(
                data.players
            )
        ) {

            Multiplayer.players =
                data.players;

        }


        log(
            "Game started",
            data
        );


        /*
         * اگر game.js تابع شروع بازی داشته باشد،
         * آن را صدا می‌زنیم.
         */

        if (
            window.Game &&
            typeof window.Game.startOnlineGame ===
            "function"
        ) {

            window.Game.startOnlineGame(
                data
            );

            return;

        }


        if (
            typeof window.startOnlineGame ===
            "function"
        ) {

            window.startOnlineGame(
                data
            );

            return;

        }


        /*
         * اگر game.js هنوز این تابع را ندارد،
         * فعلاً صفحه بازی نمایش داده می‌شود.
         */

        showScreen(
            "gameScreen"
        );


        showToast(
            "بازی شروع شد",
            "success"
        );

    }


    /* =======================================================
       CURRENT SEAT
    ======================================================== */

    function getCurrentSeat() {

        const player =
            Multiplayer.players.find(
                item =>
                    item.id ===
                    Multiplayer.playerId
            );


        if (player) {
            return Number(
                player.seat
            );
        }


        return 0;

    }


    /* =======================================================
       LEAVE ROOM
    ======================================================== */

    async function leaveRoom() {

        const client =
            getSupabaseClient();


        try {

            if (
                Multiplayer.channel &&
                client
            ) {

                try {

                    await Multiplayer.channel
                        .untrack();

                } catch (e) {

                    warn(
                        "Untrack failed",
                        e
                    );

                }


                await client
                    .removeChannel(
                        Multiplayer.channel
                    );

            }


            if (
                client &&
                Multiplayer.roomCode
            ) {

                await client
                    .from("room_players")
                    .delete()
                    .eq(
                        "room_code",
                        Multiplayer.roomCode
                    )
                    .eq(
                        "player_id",
                        Multiplayer.playerId
                    );

            }


        } catch (err) {

            warn(
                "Leave room error:",
                err
            );

        }


        Multiplayer.channel =
            null;

        Multiplayer.connected =
            false;

        Multiplayer.roomCode =
            null;

        Multiplayer.roomName =
            "";

        Multiplayer.isHost =
            false;

        Multiplayer.players =
            [];

        Multiplayer.roomState = {

            status: "waiting",

            hostId: null,

            players: []

        };


        updateRoomUI();


        showScreen(
            "homeScreen"
        );


        showToast(
            "از اتاق خارج شدی",
            "info"
        );

    }


    /* =======================================================
       COPY ROOM CODE
    ======================================================== */

    async function copyRoomCode() {

        if (
            !Multiplayer.roomCode
        ) {

            return;

        }


        try {

            await navigator
                .clipboard
                .writeText(
                    Multiplayer.roomCode
                );


            showToast(
                "کد اتاق کپی شد",
                "success"
            );

        } catch (err) {

            warn(
                "Clipboard error",
                err
            );


            showToast(
                Multiplayer.roomCode
            );

        }

    }


    /* =======================================================
       UPDATE ROOM UI
    ======================================================== */

    function updateRoomUI() {

        const codeElement =
            document.getElementById(
                "currentRoomCode"
            );


        if (codeElement) {

            codeElement.textContent =
                Multiplayer.roomCode ||
                "------";

        }


        const players =
            Multiplayer.players || [];


        for (
            let index = 0;
            index < 4;
            index++
        ) {

            const player =
                players.find(
                    item =>
                        Number(
                            item.seat
                        ) === index
                ) ||
                players[index];


            updateRoomPlayer(
                index + 1,
                player
            );

        }


        checkRoomReady();

    }


    /* =======================================================
       UPDATE ONE PLAYER SLOT
    ======================================================== */

    function updateRoomPlayer(
        slotNumber,
        player
    ) {

        const element =
            document.getElementById(
                `roomPlayer${slotNumber}`
            );


        if (!element) {
            return;
        }


        const avatar =
            element.querySelector(
                ".room-player-avatar"
            );


        const info =
            element.querySelector(
                ".room-player-info"
            );


        if (!player) {

            element.classList.add(
                "empty-player"
            );


            if (avatar) {

                avatar.textContent =
                    "+";

            }


            if (info) {

                const strong =
                    info.querySelector(
                        "strong"
                    );

                const span =
                    info.querySelector(
                        "span"
                    );


                if (strong) {

                    strong.textContent =
                        "جای خالی";

                }


                if (span) {

                    span.textContent =
                        "منتظر بازیکن";

                }

            }


            return;

        }


        element.classList.remove(
            "empty-player"
        );


        if (avatar) {

            avatar.textContent =
                player.avatar ||
                "👤";

        }


        if (info) {

            const strong =
                info.querySelector(
                    "strong"
                );

            const span =
                info.querySelector(
                    "span"
                );


            if (strong) {

                strong.textContent =
                    player.name ||
                    "بازیکن";

            }


            if (span) {

                if (
                    player.id ===
                    Multiplayer.roomState.hostId
                ) {

                    span.textContent =
                        "👑 میزبان";

                } else {

                    span.textContent =
                        "آماده بازی";

                }

            }

        }

    }


    /* =======================================================
       SCREEN NAVIGATION
    ======================================================== */

    function showScreen(
        screenId
    ) {

        const screens =
            document.querySelectorAll(
                ".screen"
            );


        screens.forEach(
            screen => {

                screen.classList.remove(
                    "active-screen"
                );

            }
        );


        const target =
            document.getElementById(
                screenId
            );


        if (target) {

            target.classList.add(
                "active-screen"
            );

        }


        const navItems =
            document.querySelectorAll(
                ".nav-item"
            );


        navItems.forEach(
            item => {

                item.classList.toggle(
                    "active",
                    item.dataset.screen ===
                    screenId
                );

            }
        );

    }


    /* =======================================================
       LOCAL ROOM STORAGE
    ======================================================== */

    function saveLocalRoom() {

        if (
            !Multiplayer.roomCode
        ) {
            return;
        }


        const room = {

            roomCode:
                Multiplayer.roomCode,

            name:
                Multiplayer.roomName,

            hostId:
                Multiplayer.roomState.hostId ||
                Multiplayer.playerId,

            status:
                Multiplayer.roomState.status,

            players:
                Multiplayer.players

        };


        localStorage.setItem(
            "hokm_room",
            JSON.stringify(room)
        );

    }


    function loadLocalRoom(
        roomCode
    ) {

        try {

            const raw =
                localStorage.getItem(
                    "hokm_room"
                );


            if (!raw) {
                return null;
            }


            const room =
                JSON.parse(raw);


            if (
                room.roomCode !==
                roomCode
            ) {

                return null;

            }


            return room;

        } catch (err) {

            error(
                "Local room parse error",
                err
            );

            return null;

        }

    }


    /* =======================================================
       RECONNECT
    ======================================================== */

    function tryReconnect() {

        if (
            !Multiplayer.roomCode
        ) {
            return;
        }


        if (
            Multiplayer.reconnectAttempts >=
            Multiplayer.maxReconnectAttempts
        ) {

            showToast(
                "اتصال به اتاق قطع شد",
                "error"
            );

            return;

        }


        Multiplayer.reconnectAttempts++;


        const delay =
            Math.min(
                1000 *
                Multiplayer.reconnectAttempts,
                5000
            );


        setTimeout(
            async () => {

                try {

                    await joinRealtimeRoom(
                        Multiplayer.roomCode
                    );

                } catch (err) {

                    warn(
                        "Reconnect failed",
                        err
                    );

                    tryReconnect();

                }

            },
            delay
        );

    }


    /* =======================================================
       GAME MESSAGE SYSTEM
       پایه ارتباط برای مراحل بعدی
    ======================================================== */

    async function sendGameMessage(
        event,
        payload = {}
    ) {

        const channel =
            Multiplayer.channel;


        if (!channel) {

            warn(
                "No multiplayer channel"
            );

            return false;

        }


        await channel.send({

            type: "broadcast",

            event,

            payload: {

                sender:
                    Multiplayer.playerId,

                roomCode:
                    Multiplayer.roomCode,

                timestamp:
                    Date.now(),

                ...payload

            }

        });


        return true;

    }


    /* =======================================================
       PUBLIC API
    ======================================================== */

    Multiplayer.initialize =
        initialize;


    Multiplayer.createRoom =
        createRoom;


    Multiplayer.joinRoom =
        joinRoom;


    Multiplayer.leaveRoom =
        leaveRoom;


    Multiplayer.startGame =
        startGame;


    Multiplayer.copyRoomCode =
        copyRoomCode;


    Multiplayer.updateRoomUI =
        updateRoomUI;


    Multiplayer.showScreen =
        showScreen;


    Multiplayer.sendGameMessage =
        sendGameMessage;


    Multiplayer.getCurrentSeat =
        getCurrentSeat;


    Multiplayer.getRoomPlayers =
        getRoomPlayers;


    /* =======================================================
       BUTTON EVENTS
    ======================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initialize();


            /*
             * ساخت اتاق
             */

            const createButton =
                document.getElementById(
                    "confirmCreateRoomButton"
                );


            if (createButton) {

                createButton.addEventListener(
                    "click",
                    async () => {

                        const roomNameInput =
                            document.getElementById(
                                "roomNameInput"
                            );


                        const entryInput =
                            document.getElementById(
                                "roomEntryInput"
                            );


                        const privateSwitch =
                            document.getElementById(
                                "privateRoomSwitch"
                            );


                        const roomName =
                            roomNameInput
                                ? roomNameInput.value.trim()
                                : "اتاق حکم";


                        const entryFee =
                            entryInput
                                ? Number(
                                    entryInput.value
                                )
                                : 0;


                        const isPrivate =
                            privateSwitch
                                ? privateSwitch.checked
                                : true;


                        const result =
                            await createRoom({

                                roomName,

                                entryFee,

                                isPrivate

                            });


                        if (
                            result.success
                        ) {

                            showScreen(
                                "roomScreen"
                            );

                        }

                    }
                );

            }


            /*
             * ورود به اتاق
             */

            const joinButton =
                document.getElementById(
                    "confirmJoinRoomButton"
                );


            if (joinButton) {

                joinButton.addEventListener(
                    "click",
                    async () => {

                        const input =
                            document.getElementById(
                                "roomCodeInput"
                            );


                        const code =
                            input
                                ? input.value
                                : "";


                        const result =
                            await joinRoom(
                                code
                            );


                        if (
                            result.success
                        ) {

                            showScreen(
                                "roomScreen"
                            );

                        }

                    }
                );

            }


            /*
             * شروع بازی
             */

            const startButton =
                document.getElementById(
                    "startGameButton"
                );


            if (startButton) {

                startButton.addEventListener(
                    "click",
                    () => {

                        startGame();

                    }
                );

            }


            /*
             * خروج از اتاق
             */

            const leaveButton =
                document.getElementById(
                    "leaveRoomButton"
                );


            if (leaveButton) {

                leaveButton.addEventListener(
                    "click",
                    () => {

                        leaveRoom();

                    }
                );

            }


            /*
             * کپی کد اتاق
             */

            const copyButton =
                document.getElementById(
                    "copyRoomCodeButton"
                );


            if (copyButton) {

                copyButton.addEventListener(
                    "click",
                    () => {

                        copyRoomCode();

                    }
                );

            }

        }
    );


    /* =======================================================
       AUTO INITIALIZATION
    ======================================================== */

    initialize();


    log(
        "Hokm Multiplayer module loaded successfully."
    );


})();
