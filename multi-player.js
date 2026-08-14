"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * multiplayer.js
 *
 * مرحله ۶
 *
 * مسئولیت‌های این فایل:
 *
 * - مدیریت وضعیت Multiplayer
 * - اتصال بازیکن به اتاق
 * - خروج از اتاق
 * - مدیریت بازیکنان اتاق
 * - مدیریت Seat ها
 * - ارسال Event های بازی
 * - دریافت Event های بازی
 * - آماده‌سازی برای اتصال کامل به Supabase
 *
 * نکته:
 * در این مرحله لایه Multiplayer را می‌سازیم.
 * اتصال واقعی Realtime به Supabase در مرحله ۷ کامل می‌شود.
 * ================================================================
 */


/* ================================================================
   1. MULTIPLAYER CONSTANTS
================================================================ */

const MULTIPLAYER_VERSION = "1.0.0";

const MAX_PLAYERS_PER_ROOM = 4;

const ROOM_SEATS = [0, 1, 2, 3];

const MULTIPLAYER_EVENTS = {

    ROOM_CREATED: "room_created",

    ROOM_JOINED: "room_joined",

    ROOM_LEFT: "room_left",

    PLAYER_JOINED: "player_joined",

    PLAYER_LEFT: "player_left",

    PLAYER_READY: "player_ready",

    GAME_STARTED: "game_started",

    TRUMP_SELECTED: "trump_selected",

    CARD_PLAYED: "card_played",

    TRICK_FINISHED: "trick_finished",

    ROUND_FINISHED: "round_finished",

    GAME_FINISHED: "game_finished",

    CHAT_MESSAGE: "chat_message",

    PLAYER_UPDATE: "player_update",

    ROOM_UPDATE: "room_update"
};


/* ================================================================
   2. MULTIPLAYER STATE
================================================================ */

const multiplayerState = {

    initialized: false,

    connected: false,

    connecting: false,

    mode: "offline",

    roomId: null,

    roomCode: null,

    roomName: null,

    isHost: false,

    localPlayerId: null,

    localSeat: null,

    localReady: false,

    players: [],

    connectionStatus: "offline",

    listeners: {},

    eventHistory: [],

    lastEventId: 0
};


/* ================================================================
   3. INITIALIZE MULTIPLAYER
================================================================ */

function initializeMultiplayer() {

    if (multiplayerState.initialized) {

        return;
    }

    multiplayerState.initialized =
        true;

    multiplayerState.mode =
        "offline";

    multiplayerState.connectionStatus =
        "offline";

    console.log(
        `Multiplayer initialized - v${MULTIPLAYER_VERSION}`
    );
}


/* ================================================================
   4. EVENT SYSTEM
================================================================ */

function multiplayerOn(
    eventName,
    callback
) {

    if (
        typeof callback !==
        "function"
    ) {

        return;
    }

    if (
        !multiplayerState.listeners[
            eventName
        ]
    ) {

        multiplayerState.listeners[
            eventName
        ] = [];
    }

    multiplayerState.listeners[
        eventName
    ].push(
        callback
    );
}


function multiplayerOff(
    eventName,
    callback
) {

    const listeners =
        multiplayerState.listeners[
            eventName
        ];

    if (!listeners) {

        return;
    }

    multiplayerState.listeners[
        eventName
    ] =
        listeners.filter(
            listener =>
                listener !== callback
        );
}


function emitMultiplayerEvent(
    eventName,
    data = {}
) {

    const listeners =
        multiplayerState.listeners[
            eventName
        ] || [];

    listeners.forEach(
        callback => {

            try {

                callback(
                    data
                );

            } catch (error) {

                console.error(
                    "Multiplayer event error:",
                    error
                );
            }
        }
    );
}


/* ================================================================
   5. EVENT ID
================================================================ */

function generateMultiplayerEventId() {

    multiplayerState.lastEventId++;

    return (
        Date.now()
        .toString(36)
        +
        "-"
        +
        multiplayerState.lastEventId
        +
        "-"
        +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );
}


/* ================================================================
   6. RECORD EVENT
================================================================ */

function recordMultiplayerEvent(
    type,
    payload = {}
) {

    const event = {

        id:
            generateMultiplayerEventId(),

        type,

        payload,

        createdAt:
            Date.now()
    };

    multiplayerState.eventHistory.push(
        event
    );

    /*
     * فقط آخرین 100 Event نگه داشته شود.
     */

    if (
        multiplayerState.eventHistory.length >
        100
    ) {

        multiplayerState.eventHistory =
            multiplayerState.eventHistory.slice(
                -100
            );
    }

    return event;
}


/* ================================================================
   7. PLAYER ID
================================================================ */

function getMultiplayerPlayerId() {

    if (
        multiplayerState.localPlayerId
    ) {

        return multiplayerState.localPlayerId;
    }

    const player =
        state &&
        state.player
            ? state.player
            : null;

    if (
        player &&
        player.id
    ) {

        multiplayerState.localPlayerId =
            player.id;

        return player.id;
    }

    multiplayerState.localPlayerId =
        `local-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

    return multiplayerState.localPlayerId;
}


/* ================================================================
   8. CREATE LOCAL PLAYER OBJECT
================================================================ */

function createMultiplayerPlayer(
    options = {}
) {

    const playerId =
        options.id ||
        getMultiplayerPlayerId();

    const playerName =
        options.name ||
        (
            state &&
            state.player
                ? state.player.name
                : "بازیکن"
        );

    return {

        id:
            playerId,

        name:
            playerName,

        seat:
            Number.isInteger(
                options.seat
            )
                ? options.seat
                : null,

        team:
            options.team ||
            null,

        ready:
            Boolean(
                options.ready
            ),

        local:
            Boolean(
                options.local
            ),

        connected:
            options.connected !== false,

        joinedAt:
            options.joinedAt ||
            Date.now()
    };
}


/* ================================================================
   9. FIND EMPTY SEAT
================================================================ */

function findEmptySeat(
    players =
        multiplayerState.players
) {

    for (
        const seat of ROOM_SEATS
    ) {

        const occupied =
            players.some(
                player =>
                    player.seat ===
                    seat
            );

        if (!occupied) {

            return seat;
        }
    }

    return null;
}


/* ================================================================
   10. FIND PLAYER
================================================================ */

function findMultiplayerPlayer(
    playerId
) {

    return multiplayerState.players.find(
        player =>
            player.id ===
            playerId
    ) || null;
}


/* ================================================================
   11. FIND PLAYER BY SEAT
================================================================ */

function findMultiplayerPlayerBySeat(
    seat
) {

    return multiplayerState.players.find(
        player =>
            player.seat ===
            seat
    ) || null;
}


/* ================================================================
   12. SET PLAYERS
================================================================ */

function setMultiplayerPlayers(
    players = []
) {

    multiplayerState.players =
        players
            .slice(
                0,
                MAX_PLAYERS_PER_ROOM
            )
            .map(
                player => ({
                    ...player
                })
            );

    emitMultiplayerEvent(
        MULTIPLAYER_EVENTS.PLAYER_UPDATE,
        {
            players:
                multiplayerState.players
        }
    );

    updateMultiplayerRoomUI();
}


/* ================================================================
   13. ADD PLAYER
================================================================ */

function addMultiplayerPlayer(
    playerData = {}
) {

    if (
        multiplayerState.players.length >=
        MAX_PLAYERS_PER_ROOM
    ) {

        return {
            success: false,
            reason: "room_full"
        };
    }

    const existing =
        findMultiplayerPlayer(
            playerData.id
        );

    if (existing) {

        return {
            success: false,
            reason: "player_exists",
            player: existing
        };
    }

    const seat =
        Number.isInteger(
            playerData.seat
        )
            ? playerData.seat
            : findEmptySeat();

    if (seat === null) {

        return {
            success: false,
            reason: "no_seat"
        };
    }

    const player =
        createMultiplayerPlayer({

            ...playerData,

            seat,

            local:
                Boolean(
                    playerData.local
                ),

            connected: true
        });

    multiplayerState.players.push(
        player
    );

    recordMultiplayerEvent(
        MULTIPLAYER_EVENTS.PLAYER_JOINED,
        {
            player
        }
    );

    emitMultiplayerEvent(
        MULTIPLAYER_EVENTS.PLAYER_JOINED,
        {
            player
        }
    );

    updateMultiplayerRoomUI();

    return {
        success: true,
        player
    };
}


/* ================================================================
   14. REMOVE PLAYER
================================================================ */

function removeMultiplayerPlayer(
    playerId
) {

    const index =
        multiplayerState.players.findIndex(
            player =>
                player.id ===
                playerId
        );

    if (index === -1) {

        return false;
    }

    const player =
        multiplayerState.players[
            index
        ];

    multiplayerState.players.splice(
        index,
        1
    );

    recordMultiplayerEvent(
        MULTIPLAYER_EVENTS.PLAYER_LEFT,
        {
            player
        }
    );

    emitMultiplayerEvent(
        MULTIPLAYER_EVENTS.PLAYER_LEFT,
        {
            player
        }
    );

    updateMultiplayerRoomUI();

    return true;
}


/* ================================================================
   15. CREATE ROOM
================================================================ */

function multiplayerCreateRoom(
    options = {}
) {

    initializeMultiplayer();

    const roomCode =
        options.code ||
        generateRoomCode();

    const roomName =
        options.name ||
        "اتاق حکم";

    const localPlayer =
        createMultiplayerPlayer({

            id:
                getMultiplayerPlayerId(),

            name:
                state.player.name,

            seat: 0,

            team: "A",

            ready: true,

            local: true
        });

    multiplayerState.roomId =
        options.roomId ||
        `room-${roomCode}`;

    multiplayerState.roomCode =
        roomCode;

    multiplayerState.roomName =
        roomName;

    multiplayerState.isHost =
        true;

    multiplayerState.localSeat =
        0;

    multiplayerState.localReady =
        true;

    multiplayerState.connected =
        true;

    multiplayerState.connectionStatus =
        "connected";

    multiplayerState.mode =
        "offline";

    multiplayerState.players = [
        localPlayer
    ];

    recordMultiplayerEvent(
        MULTIPLAYER_EVENTS.ROOM_CREATED,
        {
            roomCode,
            roomName
        }
    );

    emitMultiplayerEvent(
        MULTIPLAYER_EVENTS.ROOM_CREATED,
        {
            roomCode,
            roomName,
            player:
                localPlayer
        }
    );

    updateMultiplayerRoomUI();

    return {

        success: true,

        roomCode,

        roomId:
            multiplayerState.roomId,

        player:
            localPlayer
    };
}


/* ================================================================
   16. JOIN ROOM
================================================================ */

function multiplayerJoinRoom(
    options = {}
) {

    initializeMultiplayer();

    const roomCode =
        String(
            options.code ||
            ""
        )
            .replace(
                /\D/g,
                ""
            )
            .slice(
                0,
                6
            );

    if (
        roomCode.length !== 6
    ) {

        return {

            success: false,

            reason:
                "invalid_room_code"
        };
    }

    multiplayerState.roomId =
        options.roomId ||
        `room-${roomCode}`;

    multiplayerState.roomCode =
        roomCode;

    multiplayerState.roomName =
        options.name ||
        "اتاق حکم";

    multiplayerState.isHost =
        false;

    multiplayerState.connected =
        true;

    multiplayerState.connectionStatus =
        "connected";

    multiplayerState.mode =
        "offline";

    const seat =
        findEmptySeat(
            multiplayerState.players
        );

    if (seat === null) {

        return {

            success: false,

            reason:
                "room_full"
        };
    }

    const localPlayer =
        createMultiplayerPlayer({

            id:
                getMultiplayerPlayerId(),

            name:
                state.player.name,

            seat,

            team:
                seat % 2 === 0
                    ? "A"
                    : "B",

            ready: true,

            local: true
        });

    multiplayerState.localSeat =
        seat;

    multiplayerState.localReady =
        true;

    multiplayerState.players.push(
        localPlayer
    );

    recordMultiplayerEvent(
        MULTIPLAYER_EVENTS.ROOM_JOINED,
        {
            roomCode,
            player:
                localPlayer
        }
    );

    emitMultiplayerEvent(
        MULTIPLAYER_EVENTS.ROOM_JOINED,
        {
            roomCode,
            player:
                localPlayer
        }
    );

    updateMultiplayerRoomUI();

    return {

        success: true,

        roomCode,

        roomId:
            multiplayerState.roomId,

        player:
            localPlayer
    };
}


/* ================================================================
   17. LEAVE ROOM
================================================================ */

function multiplayerLeaveRoom() {

    const localPlayerId =
        multiplayerState.localPlayerId;

    if (localPlayerId) {

        removeMultiplayerPlayer(
            localPlayerId
        );
    }

    const roomCode =
        multiplayerState.roomCode;

    recordMultiplayerEvent(
        MULTIPLAYER_EVENTS.ROOM_LEFT,
        {
            roomCode
        }
    );

    emitMultiplayerEvent(
        MULTIPLAYER_EVENTS.ROOM_LEFT,
        {
            roomCode
        }
    );

    multiplayerState.roomId =
        null;

    multiplayerState.roomCode =
        null;

    multiplayerState.roomName =
        null;

    multiplayerState.isHost =
        false;

    multiplayerState.localSeat =
        null;

    multiplayerState.localReady =
        false;

    multiplayerState.connected =
        false;

    multiplayerState.connectionStatus =
        "offline";

    multiplayerState.players =
        [];

    updateMultiplayerRoomUI();
}


/* ================================================================
   18. READY STATE
================================================================ */

function setMultiplayerReady(
    ready
) {

    const localPlayer =
        findMultiplayerPlayer(
            getMultiplayerPlayerId()
        );

    if (!localPlayer) {

        return false;
    }

    localPlayer.ready =
        Boolean(ready);

    multiplayerState.localReady =
        Boolean(ready);

    recordMultiplayerEvent(
        MULTIPLAYER_EVENTS.PLAYER_READY,
        {
            playerId:
                localPlayer.id,

            ready:
                localPlayer.ready
        }
    );

    emitMultiplayerEvent(
        MULTIPLAYER_EVENTS.PLAYER_READY,
        {
            player:
                localPlayer
        }
    );

    updateMultiplayerRoomUI();

    return true;
}


/* ================================================================
   19. CHECK ROOM READY
================================================================ */

function areAllPlayersReady() {

    if (
        multiplayerState.players.length !==
        MAX_PLAYERS_PER_ROOM
    ) {

        return false;
    }

    return multiplayerState.players.every(
        player =>
            player.ready
    );
}


/* ================================================================
   20. CHECK ROOM FULL
================================================================ */

function isMultiplayerRoomFull() {

    return (
        multiplayerState.players.length >=
        MAX_PLAYERS_PER_ROOM
    );
}


/* ================================================================
   21. GET ROOM PLAYERS
================================================================ */

function getMultiplayerPlayers() {

    return multiplayerState.players.map(
        player => ({
            ...player
        })
    );
}


/* ================================================================
   22. GET LOCAL PLAYER
================================================================ */

function getMultiplayerLocalPlayer() {

    return findMultiplayerPlayer(
        getMultiplayerPlayerId()
    );
}


/* ================================================================
   23. SEND GAME EVENT
================================================================ */

function sendGameEvent(
    eventType,
    payload = {}
) {

    const event =
        recordMultiplayerEvent(
            eventType,
            {
                ...payload,

                roomCode:
                    multiplayerState.roomCode,

                playerId:
                    getMultiplayerPlayerId()
            }
        );

    /*
     * در این مرحله Event فقط
     * داخل سیستم محلی منتشر می‌شود.
     *
     * در مرحله ۷ همین تابع به
     * Supabase Realtime متصل خواهد شد.
     */

    emitMultiplayerEvent(
        eventType,
        event
    );

    return event;
}


/* ================================================================
   24. SEND CARD PLAY
================================================================ */

function multiplayerPlayCard(
    card
) {

    if (!card) {

        return false;
    }

    sendGameEvent(
        MULTIPLAYER_EVENTS.CARD_PLAYED,
        {
            card
        }
    );

    return true;
}


/* ================================================================
   25. SEND TRUMP
================================================================ */

function multiplayerSelectTrump(
    suit
) {

    if (!SUITS[suit]) {

        return false;
    }

    sendGameEvent(
        MULTIPLAYER_EVENTS.TRUMP_SELECTED,
        {
            suit
        }
    );

    return true;
}


/* ================================================================
   26. SEND GAME START
================================================================ */

function multiplayerStartGame() {

    if (
        !multiplayerState.isHost
    ) {

        return false;
    }

    if (
        !isMultiplayerRoomFull()
    ) {

        return false;
    }

    sendGameEvent(
        MULTIPLAYER_EVENTS.GAME_STARTED,
        {
            players:
                getMultiplayerPlayers()
        }
    );

    return true;
}


/* ================================================================
   27. SEND CHAT
================================================================ */

function multiplayerSendChat(
    message
) {

    const cleanMessage =
        String(
            message || ""
        )
            .trim()
            .slice(
                0,
                200
            );

    if (!cleanMessage) {

        return false;
    }

    sendGameEvent(
        MULTIPLAYER_EVENTS.CHAT_MESSAGE,
        {
            message:
                cleanMessage
        }
    );

    return true;
}


/* ================================================================
   28. CONNECTION STATUS
================================================================ */

function setMultiplayerConnectionStatus(
    status
) {

    multiplayerState.connectionStatus =
        status;

    multiplayerState.connected =
        status === "connected";

    emitMultiplayerEvent(
        "connection_status",
        {
            status,

            connected:
                multiplayerState.connected
        }
    );
}


/* ================================================================
   29. GET CONNECTION STATUS
================================================================ */

function getMultiplayerConnectionStatus() {

    return {

        status:
            multiplayerState.connectionStatus,

        connected:
            multiplayerState.connected,

        mode:
            multiplayerState.mode
    };
}


/* ================================================================
   30. UPDATE ROOM UI
================================================================ */

function updateMultiplayerRoomUI() {

    /*
     * اگر state.currentRoom وجود داشته باشد،
     * آن را با Multiplayer State هماهنگ می‌کنیم.
     */

    if (
        typeof state !== "undefined"
    ) {

        if (
            state.currentRoom
        ) {

            state.currentRoom.players =
                multiplayerState.players.map(
                    player => ({
                        id:
                            player.id,

                        name:
                            player.name,

                        seat:
                            player.seat,

                        team:
                            player.team,

                        ready:
                            player.ready,

                        local:
                            player.local
                    })
                );
        }
    }

    /*
     * اگر updateRoomUI در game.js وجود داشته باشد،
     * از آن برای رندر مجدد استفاده می‌کنیم.
     */

    if (
        typeof updateRoomUI ===
        "function"
    ) {

        try {

            updateRoomUI();

        } catch (error) {

            console.error(
                "Room UI update error:",
                error
            );
        }
    }
}


/* ================================================================
   31. SYNCHRONIZE WITH GAME STATE
================================================================ */

function syncMultiplayerWithGame() {

    if (
        typeof state ===
        "undefined"
    ) {

        return;
    }

    if (
        !state.game
    ) {

        return;
    }

    /*
     * بازیکنان بازی را از Multiplayer State
     * دریافت می‌کنیم.
     */

    if (
        multiplayerState.players.length > 0
    ) {

        state.game.players =
            multiplayerState.players.map(
                player => ({
                    id:
                        player.id,

                    name:
                        player.name,

                    seat:
                        player.seat,

                    team:
                        player.team,

                    local:
                        player.local
                })
            );
    }
}


/* ================================================================
   32. RESET MULTIPLAYER
================================================================ */

function resetMultiplayerState() {

    multiplayerState.connected =
        false;

    multiplayerState.connecting =
        false;

    multiplayerState.mode =
        "offline";

    multiplayerState.roomId =
        null;

    multiplayerState.roomCode =
        null;

    multiplayerState.roomName =
        null;

    multiplayerState.isHost =
        false;

    multiplayerState.localSeat =
        null;

    multiplayerState.localReady =
        false;

    multiplayerState.players =
        [];

    multiplayerState.connectionStatus =
        "offline";

    multiplayerState.eventHistory =
        [];

    multiplayerState.lastEventId =
        0;
}


/* ================================================================
   33. DEBUG INFORMATION
================================================================ */

function getMultiplayerDebugInfo() {

    return {

        version:
            MULTIPLAYER_VERSION,

        initialized:
            multiplayerState.initialized,

        connected:
            multiplayerState.connected,

        mode:
            multiplayerState.mode,

        roomId:
            multiplayerState.roomId,

        roomCode:
            multiplayerState.roomCode,

        isHost:
            multiplayerState.isHost,

        localSeat:
            multiplayerState.localSeat,

        players:
            getMultiplayerPlayers(),

        eventCount:
            multiplayerState.eventHistory.length
    };
}


/* ================================================================
   34. EVENT BRIDGE
================================================================ */

function setupMultiplayerEventBridge() {

    /*
     * وقتی یک کارت بازی می‌شود،
     * Event آن در Multiplayer منتشر می‌شود.
     */

    multiplayerOn(
        MULTIPLAYER_EVENTS.CARD_PLAYED,
        event => {

            console.log(
                "Multiplayer CARD_PLAYED:",
                event
            );
        }
    );


    /*
     * حکم
     */

    multiplayerOn(
        MULTIPLAYER_EVENTS.TRUMP_SELECTED,
        event => {

            console.log(
                "Multiplayer TRUMP_SELECTED:",
                event
            );
        }
    );


    /*
     * شروع بازی
     */

    multiplayerOn(
        MULTIPLAYER_EVENTS.GAME_STARTED,
        event => {

            console.log(
                "Multiplayer GAME_STARTED:",
                event
            );
        }
    );


    /*
     * چت
     */

    multiplayerOn(
        MULTIPLAYER_EVENTS.CHAT_MESSAGE,
        event => {

            console.log(
                "Multiplayer CHAT_MESSAGE:",
                event
            );
        }
    );
}


/* ================================================================
   35. INITIALIZE ON LOAD
================================================================ */

function initializeMultiplayerModule() {

    initializeMultiplayer();

    setupMultiplayerEventBridge();

    console.log(
        "Hokm Online Multiplayer module ready."
    );
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeMultiplayerModule
    );

} else {

    initializeMultiplayerModule();
  }
