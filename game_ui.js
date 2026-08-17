"use strict";

/*
 * ================================================================
 * HOKM ONLINE
 * game-ui.js
 *
 * FILE 11 / 12
 *
 * رابط کاربری کامل صفحه بازی حکم
 *
 * مسئولیت‌ها:
 *
 * - ساخت و مدیریت میز بازی
 * - نمایش چهار بازیکن
 * - نمایش کارت‌های دست بازیکن
 * - نمایش کارت‌های بازی‌شده
 * - نمایش نوبت
 * - نمایش حکم
 * - نمایش امتیاز
 * - نمایش تعداد دورها
 * - نمایش وضعیت بازی
 * - انتخاب حکم
 * - انتخاب کارت
 * - انیمیشن کارت
 * - نمایش برنده هر دست
 * - نمایش نتیجه بازی
 * - نمایش سکه
 * - نمایش بازیکنان
 * - نمایش وضعیت اتصال
 * - نمایش تایمر نوبت
 * - نمایش چت
 * - پنل تنظیمات بازی
 * - پنل اطلاعات بازیکنان
 * - پنل ترک بازی
 * - پنل پایان بازی
 * - هماهنگی با game.js
 * - هماهنگی با multiplayer.js
 * - هماهنگی با chat.js
 * - هماهنگی با profile.js
 * - هماهنگی با wallet.js
 * - استفاده از Toast
 * - استفاده از Loading
 * - پشتیبانی کامل RTL
 * - پشتیبانی موبایل
 *
 * نکته مهم:
 *
 * این فایل هیچ‌کدام از امکانات بازی را حذف نمی‌کند.
 * در صورت وجود APIهای فایل‌های دیگر، با آنها هماهنگ می‌شود.
 *
 * ================================================================
 */


/* ================================================================
   1. GLOBAL GAME UI STATE
================================================================ */

const gameUIState = {

    initialized: false,

    visible: false,

    gameStarted: false,

    gameEnded: false,

    selectingTrump: false,

    selectedTrump: null,

    selectedCardIndex: null,

    currentTurn: null,

    turnStartedAt: null,

    turnDuration: 30,

    timerInterval: null,

    reconnectInterval: null,

    animationQueue: [],

    renderedCards: [],

    playedCards: [],

    players: [],

    lastState: null,

    lastScore: null,

    lastWinner: null,

    settingsOpen: false,

    chatOpen: false,

    playersPanelOpen: false,

    leavePanelOpen: false,

    resultPanelOpen: false,

    soundEnabled: true,

    vibrationEnabled: true,

    animationsEnabled: true,

    compactMode: false,

    connected: true,

    connectionText: "متصل",

    initializedEvents: false

};


/* ================================================================
   2. CONSTANTS
================================================================ */

const GAME_UI_CONSTANTS = {

    suits: {

        spades: "♠",

        hearts: "♥",

        diamonds: "♦",

        clubs: "♣"

    },

    suitNames: {

        spades: "پیک",

        hearts: "دل",

        diamonds: "خشت",

        clubs: "گشنیز"

    },

    suitClasses: {

        spades: "suit-spades",

        hearts: "suit-hearts",

        diamonds: "suit-diamonds",

        clubs: "suit-clubs"

    },

    cardRanks: {

        A: "A",

        K: "K",

        Q: "Q",

        J: "J",

        10: "10",

        9: "9",

        8: "8",

        7: "7",

        6: "6",

        5: "5",

        4: "4",

        3: "3",

        2: "2"

    },

    defaultTurnDuration: 30

};


/* ================================================================
   3. DOM HELPERS
================================================================ */

function gameUIQuery(selector) {

    try {

        return document.querySelector(selector);

    } catch (error) {

        console.error(
            "gameUIQuery error:",
            error
        );

        return null;
    }
}


function gameUIQueryAll(selector) {

    try {

        return Array.from(
            document.querySelectorAll(selector)
        );

    } catch (error) {

        console.error(
            "gameUIQueryAll error:",
            error
        );

        return [];
    }
}


function createGameUIElement(
    tag,
    className = "",
    text = ""
) {

    const element =
        document.createElement(tag);

    if (className) {

        element.className =
            className;
    }

    if (text !== "") {

        element.textContent =
            text;
    }

    return element;
}


function escapeGameUIHTML(value) {

    return String(value ?? "")
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
   4. TOAST
================================================================ */

function gameUIToast(
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

function gameUILoading(
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
   6. VIBRATION
=============================================================================== */

function gameUIVibrate(
    pattern = 20
) {

    if (
        !gameUIState.vibrationEnabled
    ) {

        return;
    }

    try {

        if (
            navigator.vibrate
        ) {

            navigator.vibrate(
                pattern
            );
        }

    } catch (error) {

        console.warn(
            "Vibration unavailable:",
            error
        );
    }
}


/* ================================================================
   7. SOUND
=============================================================================== */

function gameUIPlaySound(
    type
) {

    if (
        !gameUIState.soundEnabled
    ) {

        return;
    }

    try {

        if (
            typeof window.playGameSound === "function"
        ) {

            window.playGameSound(
                type
            );

            return;
        }

        if (
            typeof window.playSound === "function"
        ) {

            window.playSound(
                type
            );

            return;
        }

    } catch (error) {

        console.warn(
            "Game sound error:",
            error
        );
    }
}


/* ================================================================
   8. GET GAME STATE
================================================================ */

function getGameUIStateSource() {

    if (
        window.gameState
    ) {

        return window.gameState;
    }

    if (
        window.state
    ) {

        return window.state;
    }

    if (
        window.hokmGameState
    ) {

        return window.hokmGameState;
    }

    return null;
}


/* ================================================================
   9. GET PLAYER
================================================================ */

function getGameUIPlayer() {

    const state =
        getGameUIStateSource();

    if (
        state?.player
    ) {

        return state.player;
    }

    if (
        window.hokmAuth &&
        typeof window.hokmAuth.getCurrentProfile === "function"
    ) {

        return (
            window.hokmAuth.getCurrentProfile()
            || null
        );
    }

    return null;
}


/* ================================================================
   10. GET CURRENT PLAYER ID
================================================================ */

function getGameUICurrentPlayerId() {

    const player =
        getGameUIPlayer();

    return (
        player?.id ||
        player?.user_id ||
        player?.uid ||
        window.hokmAuth?.getCurrentUser?.()?.id ||
        null
    );
}


/* ================================================================
   11. NORMALIZE PLAYER
================================================================ */

function normalizeGameUIPlayer(
    player,
    index = 0
) {

    if (!player) {

        return {

            id:
                `player-${index}`,

            name:
                "بازیکن",

            avatar:
                null,

            seat:
                index,

            team:
                index % 2,

            score:
                0,

            tricks:
                0,

            connected:
                true,

            isBot:
                false

        };
    }

    return {

        id:
            player.id ||
            player.user_id ||
            player.uid ||
            `player-${index}`,

        name:
            player.name ||
            player.username ||
            player.display_name ||
            player.displayName ||
            `بازیکن ${index + 1}`,

        avatar:
            player.avatar_url ||
            player.avatar ||
            player.photoURL ||
            null,

        seat:
            Number(
                player.seat ??
                player.position ??
                index
            ),

        team:
            Number(
                player.team ??
                index % 2
            ),

        score:
            Number(
                player.score ??
                player.points ??
                0
            ),

        tricks:
            Number(
                player.tricks ??
                player.trickCount ??
                0
            ),

        connected:
            player.connected !== false,

        isBot:
            player.isBot === true ||
            player.bot === true,

        isDealer:
            player.isDealer === true,

        isHokm:
            player.isHokm === true,

        isCurrentTurn:
            player.isCurrentTurn === true

    };
}


/* ================================================================
   12. GET PLAYERS
================================================================ */

function getGameUIPlayers(
    state = null
) {

    const source =
        state ||
        getGameUIStateSource();

    let players = [];

    if (
        Array.isArray(
            source?.players
        )
    ) {

        players =
            source.players;

    } else if (
        Array.isArray(
            source?.room?.players
        )
    ) {

        players =
            source.room.players;

    } else if (
        Array.isArray(
            window.roomState?.players
        )
    ) {

        players =
            window.roomState.players;
    }

    return players.map(
        (
            player,
            index
        ) =>
            normalizeGameUIPlayer(
                player,
                index
            )
    );
}


/* ================================================================
   13. GET CURRENT TURN
================================================================ */

function getGameUICurrentTurn(
    state = null
) {

    const source =
        state ||
        getGameUIStateSource();

    return (
        source?.currentTurn ||
        source?.turnPlayerId ||
        source?.currentPlayerId ||
        source?.turn ||
        null
    );
}


/* ================================================================
   14. GET TRUMP
================================================================ */

function getGameUITrump(
    state = null
) {

    const source =
        state ||
        getGameUIStateSource();

    return (
        source?.trump ||
        source?.hokm ||
        source?.trumpSuit ||
        null
    );
}


/* ================================================================
   15. GET HAND
================================================================ */

function getGameUIHand(
    state = null
) {

    const source =
        state ||
        getGameUIStateSource();

    const player =
        getGameUIPlayer();

    if (
        Array.isArray(
            source?.hand
        )
    ) {

        return source.hand;
    }

    if (
        Array.isArray(
            player?.hand
        )
    ) {

        return player.hand;
    }

    if (
        Array.isArray(
            source?.player?.hand
        )
    ) {

        return source.player.hand;
    }

    return [];
}


/* ================================================================
   16. CARD NORMALIZATION
================================================================ */

function normalizeGameUICard(
    card
) {

    if (!card) {

        return null;
    }

    if (
        typeof card === "string"
    ) {

        const parts =
            card.split(
                "-"
            );

        if (
            parts.length >= 2
        ) {

            return {

                suit:
                    normalizeGameUISuit(
                        parts[0]
                    ),

                rank:
                    parts[1],

                id:
                    card

            };
        }

        return {

            suit:
                null,

            rank:
                card,

            id:
                card

        };
    }

    return {

        suit:
            normalizeGameUISuit(
                card.suit ||
                card.color ||
                card.symbol
            ),

        rank:
            String(
                card.rank ||
                card.value ||
                card.number ||
                ""
            ),

        id:
            card.id ||
            `${card.suit}-${card.rank}`,

        playable:
            card.playable !== false,

        disabled:
            card.disabled === true
    };
}


/* ================================================================
   17. NORMALIZE SUIT
================================================================ */

function normalizeGameUISuit(
    suit
) {

    if (!suit) {

        return null;
    }

    const value =
        String(
            suit
        )
            .trim()
            .toLowerCase();

    const map = {

        "♠":
            "spades",

        "spade":
            "spades",

        "spades":
            "spades",

        "پیک":
            "spades",

        "♥":
            "hearts",

        "heart":
            "hearts",

        "hearts":
            "hearts",

        "دل":
            "hearts",

        "♦":
            "diamonds",

        "diamond":
            "diamonds",

        "diamonds":
            "diamonds",

        "خشت":
            "diamonds",

        "♣":
            "clubs",

        "club":
            "clubs",

        "clubs":
            "clubs",

        "گشنیز":
            "clubs"

    };

    return (
        map[value] ||
        value
    );
}


/* ================================================================
   18. SUIT SYMBOL
================================================================ */

function getGameUISuitSymbol(
    suit
) {

    const normalized =
        normalizeGameUISuit(
            suit
        );

    return (
        GAME_UI_CONSTANTS.suits[
            normalized
        ] ||
        ""
    );
}


/* ================================================================
   19. SUIT NAME
================================================================ */

function getGameUISuitName(
    suit
) {

    const normalized =
        normalizeGameUISuit(
            suit
        );

    return (
        GAME_UI_CONSTANTS.suitNames[
            normalized
        ] ||
        "نامشخص"
    );
}


/* ================================================================
   20. CARD COLOR
================================================================ */

function getGameUICardColorClass(
    suit
) {

    const normalized =
        normalizeGameUISuit(
            suit
        );

    if (
        normalized === "hearts" ||
        normalized === "diamonds"
    ) {

        return "card-red";
    }

    return "card-black";
}


/* ================================================================
   21. CREATE CARD
================================================================ */

function createGameUICard(
    card,
    index,
    options = {}
) {

    const normalized =
        normalizeGameUICard(
            card
        );

    if (!normalized) {

        return null;
    }

    const cardElement =
        createGameUIElement(
            "button",
            "game-card"
        );

    cardElement.type =
        "button";

    cardElement.dataset.cardIndex =
        String(index);

    cardElement.dataset.cardId =
        normalized.id || "";

    cardElement.dataset.suit =
        normalized.suit || "";

    cardElement.dataset.rank =
        normalized.rank || "";

    const playable =
        options.playable !== undefined
            ? options.playable
            : normalized.playable !== false &&
              normalized.disabled !== true;

    if (!playable) {

        cardElement.classList.add(
            "card-disabled"
        );

        cardElement.disabled =
            true;
    }

    cardElement.classList.add(
        getGameUICardColorClass(
            normalized.suit
        )
    );

    if (
        normalized.suit
    ) {

        cardElement.classList.add(
            `suit-${normalized.suit}`
        );
    }

    if (
        options.selected
    ) {

        cardElement.classList.add(
            "card-selected"
        );
    }

    const top =
        createGameUIElement(
            "span",
            "card-top"
        );

    const rank =
        createGameUIElement(
            "span",
            "card-rank",
            normalized.rank
        );

    const suit =
        createGameUIElement(
            "span",
            "card-suit",
            getGameUISuitSymbol(
                normalized.suit
            )
        );

    top.appendChild(
        rank
    );

    top.appendChild(
        suit
    );

    const center =
        createGameUIElement(
            "span",
            "card-center"
        );

    center.textContent =
        getGameUISuitSymbol(
            normalized.suit
        );

    const bottom =
        createGameUIElement(
            "span",
            "card-bottom"
        );

    bottom.textContent =
        normalized.rank;

    cardElement.appendChild(
        top
    );

    cardElement.appendChild(
        center
    );

    cardElement.appendChild(
        bottom
    );

    if (
        options.onClick
    ) {

        cardElement.addEventListener(
            "click",
            options.onClick
        );
    } else {

        cardElement.addEventListener(
            "click",
            () => {

                handleGameUICardClick(
                    normalized,
                    index
                );

            }
        );
    }

    return cardElement;
}


/* ================================================================
   22. RENDER PLAYER HAND
================================================================ */

function renderGameUIHand(
    hand = null
) {

    const container =
        gameUIQuery(
            "#player-hand"
        ) ||
        gameUIQuery(
            ".player-hand"
        ) ||
        gameUIQuery(
            "[data-game-player-hand]"
        );

    if (!container) {

        return;
    }

    const cards =
        Array.isArray(hand)
            ? hand
            : getGameUIHand();

    container.innerHTML =
        "";

    gameUIState.renderedCards =
        cards;

    const state =
        getGameUIStateSource();

    const currentTurn =
        getGameUICurrentTurn(
            state
        );

    const currentPlayerId =
        getGameUICurrentPlayerId();

    const isMyTurn =
        currentTurn &&
        currentPlayerId &&
        String(currentTurn) ===
            String(currentPlayerId);

    cards.forEach(
        (
            card,
            index
        ) => {

            const normalized =
                normalizeGameUICard(
                    card
                );

            if (!normalized) {

                return;
            }

            const playable =
                isMyTurn
                    ? isCardPlayableForUI(
                        normalized,
                        state
                    )
                    : false;

            const element =
                createGameUICard(
                    normalized,
                    index,
                    {

                        playable,

                        selected:
                            gameUIState.selectedCardIndex ===
                            index

                    }
                );

            if (element) {

                container.appendChild(
                    element
                );
            }

        }
    );

    container.classList.toggle(
        "my-turn",
        !!isMyTurn
    );
}


/* ================================================================
   23. CARD PLAYABILITY
================================================================ */

function isCardPlayableForUI(
    card,
    state = null
) {

    const source =
        state ||
        getGameUIStateSource();

    if (!card) {

        return false;
    }

    if (
        typeof source?.canPlayCard === "function"
    ) {

        try {

            return !!source.canPlayCard(
                card
            );

        } catch (error) {

            console.warn(
                "canPlayCard error:",
                error
            );
        }
    }

    if (
        typeof window.canPlayCard === "function"
    ) {

        try {

            return !!window.canPlayCard(
                card
            );

        } catch (error) {

            console.warn(
                "global canPlayCard error:",
                error
            );
        }
    }

    const leadSuit =
        source?.leadSuit ||
        source?.currentSuit ||
        null;

    const hand =
        getGameUIHand(
            source
        );

    if (
        leadSuit &&
        Array.isArray(hand)
    ) {

        const hasLeadSuit =
            hand.some(
                item =>
                    normalizeGameUICard(
                        item
                    )?.suit ===
                    normalizeGameUISuit(
                        leadSuit
                    )
            );

        if (
            hasLeadSuit &&
            card.suit !==
                normalizeGameUISuit(
                    leadSuit
                )
        ) {

            return false;
        }
    }

    return true;
}


/* ================================================================
   24. CARD CLICK
================================================================ */

function handleGameUICardClick(
    card,
    index
) {

    if (
        gameUIState.gameEnded
    ) {

        return;
    }

    const state =
        getGameUIStateSource();

    const currentTurn =
        getGameUICurrentTurn(
            state
        );

    const currentPlayerId =
        getGameUICurrentPlayerId();

    if (
        currentTurn &&
        currentPlayerId &&
        String(currentTurn) !==
            String(currentPlayerId)
    ) {

        gameUIToast(
            "الان نوبت شما نیست.",
            "⏳"
        );

        return;
    }

    if (
        !isCardPlayableForUI(
            card,
            state
        )
    ) {

        gameUIToast(
            "این کارت در این لحظه قابل بازی نیست.",
            "⚠️"
        );

        gameUIVibrate(
            [20, 30, 20]
        );

        return;
    }

    gameUIState.selectedCardIndex =
        index;

    highlightSelectedGameUICard(
        index
    );

    gameUIPlaySound(
        "card-select"
    );

    gameUIVibrate(
        15
    );

    playGameUICard(
        card,
        index
    );
}


/* ================================================================
   25. HIGHLIGHT CARD
================================================================ */

function highlightSelectedGameUICard(
    index
) {

    const cards =
        gameUIQueryAll(
            ".game-card"
        );

    cards.forEach(
        (
            card,
            cardIndex
        ) => {

            card.classList.toggle(
                "card-selected",
                cardIndex === index
            );

        }
    );
}


/* ================================================================
   26. PLAY CARD
================================================================ */

async function playGameUICard(
    card,
    index
) {

    const normalized =
        normalizeGameUICard(
            card
        );

    if (!normalized) {

        return false;
    }

    try {

        let result = null;

        if (
            typeof window.playCard === "function"
        ) {

            result =
                await window.playCard(
                    normalized,
                    index
                );

        } else if (
            typeof window.hokmGame?.playCard === "function"
        ) {

            result =
                await window.hokmGame.playCard(
                    normalized,
                    index
                );

        } else if (
            typeof window.multiplayer?.playCard === "function"
        ) {

            result =
                await window.multiplayer.playCard(
                    normalized,
                    index
                );

        } else {

            gameUIToast(
                "سیستم بازی هنوز آماده نیست.",
                "⚠️"
            );

            return false;
        }

        if (
            result === false
        ) {

            return false;
        }

        animatePlayedGameUICard(
            normalized
        );

        gameUIState.selectedCardIndex =
            null;

        return true;

    } catch (error) {

        console.error(
            "playGameUICard error:",
            error
        );

        gameUIToast(
            "بازی کردن کارت انجام نشد.",
            "❌"
        );

        return false;
    }
}


/* ================================================================
   27. PLAYED CARD AREA
================================================================ */

function getGameUIPlayedCardsContainer() {

    return (
        gameUIQuery(
            "#played-cards"
        ) ||
        gameUIQuery(
            ".played-cards"
        ) ||
        gameUIQuery(
            "[data-game-played-cards]"
        )
    );
}


/* ================================================================
   28. RENDER PLAYED CARDS
================================================================ */

function renderGameUIPlayedCards(
    cards = null
) {

    const container =
        getGameUIPlayedCardsContainer();

    if (!container) {

        return;
    }

    let played =
        cards;

    if (!Array.isArray(played)) {

        const state =
            getGameUIStateSource();

        played =
            state?.playedCards ||
            state?.currentTrick ||
            state?.tableCards ||
            [];
    }

    container.innerHTML =
        "";

    gameUIState.playedCards =
        played;

    played.forEach(
        (
            item,
            index
        ) => {

            const card =
                normalizeGameUICard(
                    item?.card ||
                    item
                );

            if (!card) {

                return;
            }

            const wrapper =
                createGameUIElement(
                    "div",
                    "played-card-slot"
                );

            if (
                item?.playerId
            ) {

                wrapper.dataset.playerId =
                    item.playerId;
            }

            const cardElement =
                createGameUICard(
                    card,
                    index,
                    {

                        playable:
                            false

                    }
                );

            if (cardElement) {

                cardElement.classList.add(
                    "played-card"
                );

                wrapper.appendChild(
                    cardElement
                );

                container.appendChild(
                    wrapper
                );
            }

        }
    );
}


/* ================================================================
   29. CARD ANIMATION
================================================================ */

function animatePlayedGameUICard(
    card
) {

    if (
        !gameUIState.animationsEnabled
    ) {

        return;
    }

    const normalized =
        normalizeGameUICard(
            card
        );

    if (!normalized) {

        return;
    }

    const cardElement =
        createGameUICard(
            normalized,
            0,
            {

                playable:
                    false

            }
        );

    if (!cardElement) {

        return;
    }

    cardElement.classList.add(
        "card-flying"
    );

    const container =
        getGameUIPlayedCardsContainer();

    if (container) {

        container.appendChild(
            cardElement
        );

        requestAnimationFrame(
            () => {

                cardElement.classList.add(
                    "card-landed"
                );

            }
        );
    }

    gameUIPlaySound(
        "card-play"
    );
}


/* ================================================================
   30. RENDER PLAYERS
================================================================ */

function renderGameUIPlayers(
    players = null
) {

    const list =
        Array.isArray(players)
            ? players
            : getGameUIPlayers();

    gameUIState.players =
        list;

    const playerElements =
        gameUIQueryAll(
            "[data-game-player]"
        );

    playerElements.forEach(
        element => {

            const seat =
                Number(
                    element.dataset.gamePlayer
                );

            const player =
                list.find(
                    item =>
                        Number(item.seat) ===
                        seat
                ) ||
                list[seat];

            updateGameUIPlayerElement(
                element,
                player
            );
        }
    );

    renderGameUIPlayerFallback(
        list
    );
}


/* ================================================================
   31. UPDATE PLAYER ELEMENT
=============================================================================== */

function updateGameUIPlayerElement(
    element,
    player
) {

    if (!element) {

        return;
    }

    if (!player) {

        element.classList.add(
            "empty-seat"
        );

        return;
    }

    element.classList.remove(
        "empty-seat"
    );

    element.dataset.playerId =
        player.id;

    const name =
        element.querySelector(
            "[data-player-name]"
        );

    if (name) {

        name.textContent =
            player.name;
    }

    const score =
        element.querySelector(
            "[data-player-score]"
        );

    if (score) {

        score.textContent =
            Number(
                player.score || 0
            ).toLocaleString(
                "fa-IR"
            );
    }

    const tricks =
        element.querySelector(
            "[data-player-tricks]"
        );

    if (tricks) {

        tricks.textContent =
            Number(
                player.tricks || 0
            ).toLocaleString(
                "fa-IR"
            );
    }

    const avatar =
        element.querySelector(
            "[data-player-avatar]"
        );

    if (
        avatar &&
        avatar.tagName === "IMG"
    ) {

        if (
            player.avatar
        ) {

            avatar.src =
                player.avatar;

        } else {

            avatar.removeAttribute(
                "src"
            );
        }
    }

    element.classList.toggle(
        "player-current-turn",
        !!player.isCurrentTurn
    );

    element.classList.toggle(
        "player-disconnected",
        player.connected === false
    );

    element.classList.toggle(
        "player-bot",
        player.isBot === true
    );

    element.classList.toggle(
        "player-hokm",
        player.isHokm === true
    );
}


/* ================================================================
   32. PLAYER FALLBACK RENDER
=============================================================================== */

function renderGameUIPlayerFallback(
    players
) {

    const seats = {

        top:
            gameUIQuery(
                "#player-top"
            ),

        left:
            gameUIQuery(
                "#player-left"
            ),

        right:
            gameUIQuery(
                "#player-right"
            ),

        bottom:
            gameUIQuery(
                "#player-bottom"
            )

    };

    const ordered =
        players.slice(
            0,
            4
        );

    ordered.forEach(
        (
            player,
            index
        ) => {

            let element =
                null;

            if (
                index === 0
            ) {

                element =
                    seats.top;

            } else if (
                index === 1
            ) {

                element =
                    seats.right;

            } else if (
                index === 2
            ) {

                element =
                    seats.top;

            } else if (
                index === 3
            ) {

                element =
                    seats.left;
            }

            if (
                element
            ) {

                updateGameUIPlayerElement(
                    element,
                    player
                );
            }

        }
    );
}


/* ================================================================
   33. SCORE
================================================================ */

function getGameUIScore(
    state = null
) {

    const source =
        state ||
        getGameUIStateSource();

    return {

        teamA:
            Number(
                source?.score?.teamA ??
                source?.scores?.teamA ??
                source?.teamScores?.[0] ??
                0
            ),

        teamB:
            Number(
                source?.score?.teamB ??
                source?.scores?.teamB ??
                source?.teamScores?.[1] ??
                0
            )

    };
}


/* ================================================================
   34. RENDER SCORE
================================================================ */

function renderGameUIScore(
    score = null
) {

    const data =
        score ||
        getGameUIScore();

    gameUIState.lastScore =
        data;

    const teamAElements =
        gameUIQueryAll(
            "[data-team-score='A']"
        );

    const teamBElements =
        gameUIQueryAll(
            "[data-team-score='B']"
        );

    teamAElements.forEach(
        element => {

            element.textContent =
                Number(
                    data.teamA || 0
                ).toLocaleString(
                    "fa-IR"
                );
        }
    );

    teamBElements.forEach(
        element => {

            element.textContent =
                Number(
                    data.teamB || 0
                ).toLocaleString(
                    "fa-IR"
                );
        }
    );

    const genericScore =
        gameUIQuery(
            "#game-score"
        );

    if (genericScore) {

        genericScore.textContent =
            `${Number(data.teamA || 0).toLocaleString("fa-IR")} - ${Number(data.teamB || 0).toLocaleString("fa-IR")}`;
    }
}


/* ================================================================
   35. RENDER TRUMP
================================================================ */

function renderGameUITrump(
    trump = null
) {

    const value =
        trump ||
        getGameUITrump();

    const elements =
        gameUIQueryAll(
            "[data-game-trump]"
        );

    elements.forEach(
        element => {

            if (!value) {

                element.textContent =
                    "—";

                element.removeAttribute(
                    "data-suit"
                );

                return;
            }

            const normalized =
                normalizeGameUISuit(
                    value
                );

            element.textContent =
                getGameUISuitSymbol(
                    normalized
                );

            element.dataset.suit =
                normalized;

            element.classList.add(
                `suit-${normalized}`
            );
        }
    );

    const label =
        gameUIQuery(
            "#trump-name"
        );

    if (
        label &&
        value
    ) {

        label.textContent =
            getGameUISuitName(
                value
            );
    }
}


/* ================================================================
   36. TRUMP SELECTOR
=============================================================================== */

function renderGameUITrumpSelector() {

    const container =
        gameUIQuery(
            "#trump-selector"
        ) ||
        gameUIQuery(
            ".trump-selector"
        ) ||
        gameUIQuery(
            "[data-trump-selector]"
        );

    if (!container) {

        return;
    }

    container.innerHTML =
        "";

    const suits =
        [
            "spades",
            "hearts",
            "diamonds",
            "clubs"
        ];

    suits.forEach(
        suit => {

            const button =
                createGameUIElement(
                    "button",
                    "trump-option"
                );

            button.type =
                "button";

            button.dataset.suit =
                suit;

            button.innerHTML =
                `
                    <span class="trump-symbol ${GAME_UI_CONSTANTS.suitClasses[suit]}">
                        ${getGameUISuitSymbol(suit)}
                    </span>
                    <span class="trump-name">
                        ${getGameUISuitName(suit)}
                    </span>
                `;

            button.addEventListener(
                "click",
                () => {

                    selectGameUITrump(
                        suit
                    );

                }
            );

            container.appendChild(
                button
            );
        }
    );
}


/* ================================================================
   37. SELECT TRUMP
=============================================================================== */

async function selectGameUITrump(
    suit
) {

    const normalized =
        normalizeGameUISuit(
            suit
        );

    if (!normalized) {

        return false;
    }

    if (
        !gameUIState.selectingTrump
    ) {

        gameUIToast(
            "در این لحظه انتخاب حکم فعال نیست.",
            "⚠️"
        );

        return false;
    }

    try {

        let result = null;

        if (
            typeof window.selectTrump === "function"
        ) {

            result =
                await window.selectTrump(
                    normalized
                );

        } else if (
            typeof window.chooseTrump === "function"
        ) {

            result =
                await window.chooseTrump(
                    normalized
                );

        } else if (
            typeof window.hokmGame?.selectTrump === "function"
        ) {

            result =
                await window.hokmGame.selectTrump(
                    normalized
                );

        } else {

            gameUIToast(
                "سیستم انتخاب حکم آماده نیست.",
                "⚠️"
            );

            return false;
        }

        if (
            result === false
        ) {

            return false;
        }

        gameUIState.selectedTrump =
            normalized;

        renderGameUITrump(
            normalized
        );

        hideGameUITrumpSelector();

        gameUIPlaySound(
            "trump"

        );

        gameUIVibrate(
            25
        );

        return true;

    } catch (error) {

        console.error(
            "selectGameUITrump error:",
            error
        );

        gameUIToast(
            "انتخاب حکم انجام نشد.",
            "❌"
        );

        return false;
    }
}


/* ================================================================
   38. SHOW TRUMP SELECTOR
================================================================ */

function showGameUITrumpSelector() {

    gameUIState.selectingTrump =
        true;

    const container =
        gameUIQuery(
            "#trump-selector"
        ) ||
        gameUIQuery(
            ".trump-selector"
        ) ||
        gameUIQuery(
            "[data-trump-selector]"
        );

    if (container) {

        container.classList.add(
            "active"
        );

        container.removeAttribute(
            "hidden"
        );
    }

    renderGameUITrumpSelector();

    gameUIToast(
        "حکم را انتخاب کن.",
        "🃏",
        3000
    );
}


/* ================================================================
   39. HIDE TRUMP SELECTOR
================================================================ */

function hideGameUITrumpSelector() {

    gameUIState.selectingTrump =
        false;

    const container =
        gameUIQuery(
            "#trump-selector"
        ) ||
        gameUIQuery(
            ".trump-selector"
        ) ||
        gameUIQuery(
            "[data-trump-selector]"
        );

    if (container) {

        container.classList.remove(
            "active"
        );

        container.setAttribute(
            "hidden",
            "hidden"
        );
    }
}


/* ================================================================
   40. TURN INDICATOR
================================================================ */

function renderGameUITurn(
    playerId = null
) {

    const currentTurn =
        playerId ||
        getGameUICurrentTurn();

    gameUIState.currentTurn =
        currentTurn;

    const players =
        gameUIState.players.length
            ? gameUIState.players
            : getGameUIPlayers();

    players.forEach(
        player => {

            player.isCurrentTurn =
                !!currentTurn &&
                String(player.id) ===
                String(currentTurn);

        }
    );

    const playerElements =
        gameUIQueryAll(
            "[data-game-player]"
        );

    playerElements.forEach(
        element => {

            const id =
                element.dataset.playerId;

            element.classList.toggle(
                "player-current-turn",
                !!currentTurn &&
                !!id &&
                String(id) ===
                    String(currentTurn)
            );
        }
    );

    const turnText =
        gameUIQuery(
            "#turn-indicator"
        ) ||
        gameUIQuery(
            "[data-turn-indicator]"
        );

    if (turnText) {

        const current =
            players.find(
                player =>
                    String(player.id) ===
                    String(currentTurn)
            );

        if (current) {

            const currentPlayerId =
                getGameUICurrentPlayerId();

            if (
                String(current.id) ===
                String(currentPlayerId)
            ) {

                turnText.textContent =
                    "نوبت شماست";

                turnText.classList.add(
                    "my-turn"
                );

            } else {

                turnText.textContent =
                    `نوبت ${current.name}`;

                turnText.classList.remove(
                    "my-turn"
                );
            }

        } else {

            turnText.textContent =
                "در انتظار نوبت...";
        }
    }

    startGameUITurnTimer();
}


/* ================================================================
   41. TURN TIMER
================================================================ */

function startGameUITurnTimer(
    seconds = null
) {

    stopGameUITurnTimer();

    const duration =
        Number(
            seconds ??
            gameUIState.turnDuration ??
            GAME_UI_CONSTANTS.defaultTurnDuration
        );

    let remaining =
        duration;

    gameUIState.turnStartedAt =
        Date.now();

    updateGameUITurnTimer(
        remaining
    );

    gameUIState.timerInterval =
        setInterval(
            () => {

                remaining--;

                updateGameUITurnTimer(
                    remaining
                );

                if (
                    remaining <= 0
                ) {

                    stopGameUITurnTimer();

                    gameUIVibrate(
                        [100, 50, 100]
                    );

                    gameUIPlaySound(
                        "timer-end"
                    );

                }

            },
            1000
        );
}


/* ================================================================
   42. UPDATE TIMER
=============================================================================== */

function updateGameUITurnTimer(
    seconds
) {

    const elements =
        gameUIQueryAll(
            "[data-turn-timer]"
        );

    elements.forEach(
        element => {

            const value =
                Math.max(
                    0,
                    Number(seconds)
                );

            element.textContent =
                Number(
                    value
                ).toLocaleString(
                    "fa-IR"
                );

            element.classList.toggle(
                "timer-warning",
                value <= 10
            );

            element.classList.toggle(
                "timer-danger",
                value <= 5
            );
        }
    );
}


/* ================================================================
   43. STOP TIMER
================================================================ */

function stopGameUITurnTimer() {

    if (
        gameUIState.timerInterval
    ) {

        clearInterval(
            gameUIState.timerInterval
        );

        gameUIState.timerInterval =
            null;
    }
}


/* ================================================================
   44. ROUND INFORMATION
================================================================ */

function renderGameUIRoundInfo(
    state = null
) {

    const source =
        state ||
        getGameUIStateSource();

    const round =
        Number(
            source?.round ??
            source?.currentRound ??
            source?.handNumber ??
            1
        );

    const trick =
        Number(
            source?.trick ??
            source?.currentTrickNumber ??
            source?.trickNumber ??
            0
        );

    const roundElements =
        gameUIQueryAll(
            "[data-game-round]"
        );

    roundElements.forEach(
        element => {

            element.textContent =
                Number(
                    round
                ).toLocaleString(
                    "fa-IR"
                );
        }
    );

    const trickElements =
        gameUIQueryAll(
            "[data-game-trick]"
        );

    trickElements.forEach(
        element => {

            element.textContent =
                Number(
                    trick
                ).toLocaleString(
                    "fa-IR"
                );
        }
    );
}


/* ================================================================
   45. GAME STATUS
================================================================ */

function renderGameUIStatus(
    status = null
) {

    const source =
        getGameUIStateSource();

    const value =
        status ||
        source?.status ||
        source?.gameStatus ||
        "waiting";

    const elements =
        gameUIQueryAll(
            "[data-game-status]"
        );

    const labels = {

        waiting:
            "در انتظار بازیکنان",

        starting:
            "در حال شروع بازی",

        playing:
            "بازی در حال انجام است",

        finished:
            "بازی تمام شد",

        paused:
            "بازی متوقف شده",

        reconnecting:
            "در حال اتصال مجدد",

        disconnected:
            "اتصال قطع است"

    };

    elements.forEach(
        element => {

            element.textContent =
                labels[value] ||
                String(value);

            element.dataset.status =
                value;
        }
    );
}


/* ================================================================
   46. COINS
================================================================ */

function renderGameUICoins(
    coins = null
) {

    let value =
        coins;

    if (
        value === null ||
        value === undefined
    ) {

        const profile =
            window.hokmAuth?.getCurrentProfile?.();

        const player =
            getGameUIPlayer();

        value =
            profile?.coins ??
            player?.coins ??
            0;
    }

    const elements =
        gameUIQueryAll(
            "[data-game-coins]"
        );

    elements.forEach(
        element => {

            element.textContent =
                Number(
                    value
                ).toLocaleString(
                    "fa-IR"
                );

        }
    );
}


/* ================================================================
   47. ENTRY FEE
================================================================ */

function renderGameUIEntryFee() {

    const elements =
        gameUIQueryAll(
            "[data-game-entry-fee]"
        );

    elements.forEach(
        element => {

            element.textContent =
                Number(
                    400
                ).toLocaleString(
                    "fa-IR"
                );
        }
    );
}


/* ================================================================
   48. GAME START CONFIRMATION
================================================================ */

async function confirmGameStartUI() {

    const player =
        getGameUIPlayer();

    const coins =
        Number(
            player?.coins ??
            window.hokmAuth?.getCurrentProfile?.()?.coins ??
            0
        );

    const entryFee =
        400;

    if (
        coins < entryFee
    ) {

        gameUIToast(
            "برای شروع بازی حداقل ۴۰۰ سکه لازم داری.",
            "🪙",
            4000
        );

        return false;
    }

    return true;
}


/* ================================================================
   49. START GAME UI
================================================================ */

async function startGameUI() {

    if (
        !(await confirmGameStartUI())
    ) {

        return false;
    }

    try {

        gameUILoading(
            true,
            "در حال ورود به میز بازی..."
        );

        let result = null;

        if (
            typeof window.startGame === "function"
        ) {

            result =
                await window.startGame();

        } else if (
            typeof window.hokmGame?.start === "function"
        ) {

            result =
                await window.hokmGame.start();

        } else if (
            typeof window.multiplayer?.startGame === "function"
        ) {

            result =
                await window.multiplayer.startGame();
        }

        gameUILoading(
            false
        );

        if (
            result === false
        ) {

            return false;
        }

        gameUIState.gameStarted =
            true;

        gameUIState.gameEnded =
            false;

        gameUIState.visible =
            true;

        renderGameUI();

        return true;

    } catch (error) {

        gameUILoading(
            false
        );

        console.error(
            "startGameUI error:",
            error
        );

        gameUIToast(
            "شروع بازی انجام نشد.",
            "❌"
        );

        return false;
    }
}


/* ================================================================
   50. LEAVE GAME
================================================================ */

async function leaveGameUI(
    confirmed = false
) {

    if (!confirmed) {

        showGameUILeavePanel();

        return false;
    }

    try {

        gameUILoading(
            true,
            "در حال خروج از میز..."
        );

        let result = null;

        if (
            typeof window.leaveGame === "function"
        ) {

            result =
                await window.leaveGame();

        } else if (
            typeof window.hokmGame?.leave === "function"
        ) {

            result =
                await window.hokmGame.leave();

        } else if (
            typeof window.multiplayer?.leaveRoom === "function"
        ) {

            result =
                await window.multiplayer.leaveRoom();
        }

        gameUILoading(
            false
        );

        gameUIState.gameStarted =
            false;

        gameUIState.visible =
            false;

        stopGameUITurnTimer();

        hideGameUILeavePanel();

        if (
            result !== false
        ) {

            navigateAfterGameLeave();
        }

        return result !== false;

    } catch (error) {

        gameUILoading(
            false
        );

        console.error(
            "leaveGameUI error:",
            error
        );

        gameUIToast(
            "خروج از بازی انجام نشد.",
            "❌"
        );

        return false;
    }
}


/* ================================================================
   51. NAVIGATE AFTER LEAVE
=============================================================================== */

function navigateAfterGameLeave() {

    if (
        typeof window.showHomePage === "function"
    ) {

        window.showHomePage();

        return;
    }

    if (
        typeof window.navigateTo === "function"
    ) {

        window.navigateTo(
            "home"
        );

        return;
    }

    const home =
        gameUIQuery(
            "#home-page"
        );

    const game =
        gameUIQuery(
            "#game-page"
        );

    if (home) {

        home.style.display =
            "";

    }

    if (game) {

        game.style.display =
            "none";
    }
}


/* ================================================================
   52. LEAVE PANEL
================================================================ */

function showGameUILeavePanel() {

    gameUIState.leavePanelOpen =
        true;

    const panel =
        gameUIQuery(
            "#leave-game-panel"
        ) ||
        gameUIQuery(
            "[data-leave-game-panel]"
        );

    if (panel) {

        panel.classList.add(
            "active"
        );

        panel.removeAttribute(
            "hidden"
        );
    }
}


function hideGameUILeavePanel() {

    gameUIState.leavePanelOpen =
        false;

    const panel =
        gameUIQuery(
            "#leave-game-panel"
        ) ||
        gameUIQuery(
            "[data-leave-game-panel]"
        );

    if (panel) {

        panel.classList.remove(
            "active"
        );

        panel.setAttribute(
            "hidden",
            "hidden"
        );
    }
}


/* ================================================================
   53. SETTINGS
================================================================ */

function openGameUISettings() {

    gameUIState.settingsOpen =
        true;

    const panel =
        gameUIQuery(
            "#game-settings"
        ) ||
        gameUIQuery(
            "[data-game-settings]"
        );

    if (panel) {

        panel.classList.add(
            "active"
        );

        panel.removeAttribute(
            "hidden"
        );
    }
}


function closeGameUISettings() {

    gameUIState.settingsOpen =
        false;

    const panel =
        gameUIQuery(
            "#game-settings"
        ) ||
        gameUIQuery(
            "[data-game-settings]"
        );

    if (panel) {

        panel.classList.remove(
            "active"
        );

        panel.setAttribute(
            "hidden",
            "hidden"
        );
    }
}


/* ================================================================
   54. CHAT
================================================================ */

function openGameUIChat() {

    gameUIState.chatOpen =
        true;

    const panel =
        gameUIQuery(
            "#game-chat"
        ) ||
        gameUIQuery(
            "[data-game-chat]"
        );

    if (panel) {

        panel.classList.add(
            "active"
        );

        panel.removeAttribute(
            "hidden"
        );
    }

    if (
        typeof window.openChat === "function"
    ) {

        window.openChat();
    }
}


function closeGameUIChat() {

    gameUIState.chatOpen =
        false;

    const panel =
        gameUIQuery(
            "#game-chat"
        ) ||
        gameUIQuery(
            "[data-game-chat]"
        );

    if (panel) {

        panel.classList.remove(
            "active"
        );

        panel.setAttribute(
            "hidden",
            "hidden"
        );
    }
}


/* ================================================================
   55. PLAYERS PANEL
================================================================ */

function openGameUIPlayers() {

    gameUIState.playersPanelOpen =
        true;

    const panel =
        gameUIQuery(
            "#game-players-panel"
        ) ||
        gameUIQuery(
            "[data-game-players-panel]"
        );

    if (panel) {

        panel.classList.add(
            "active"
        );

        panel.removeAttribute(
            "hidden"
        );
    }
}


function closeGameUIPlayers() {

    gameUIState.playersPanelOpen =
        false;

    const panel =
        gameUIQuery(
            "#game-players-panel"
        ) ||
        gameUIQuery(
            "[data-game-players-panel]"
        );

    if (panel) {

        panel.classList.remove(
            "active"
        );

        panel.setAttribute(
            "hidden",
            "hidden"
        );
    }
}


/* ================================================================
   56. RESULT PANEL
=============================================================================== */

function showGameUIResult(
    result = null
) {

    gameUIState.gameEnded =
        true;

    gameUIState.resultPanelOpen =
        true;

    stopGameUITurnTimer();

    const panel =
        gameUIQuery(
            "#game-result"
        ) ||
        gameUIQuery(
            "[data-game-result]"
        );

    if (!panel) {

        return;
    }

    const winner =
        result?.winner ||
        result?.winningTeam ||
        gameUIState.lastWinner;

    const winnerName =
        result?.winnerName ||
        result?.name ||
        winner ||
        "تیم برنده";

    const winnerElements =
        panel.querySelectorAll(
            "[data-result-winner]"
        );

    winnerElements.forEach(
        element => {

            element.textContent =
                winnerName;
        }
    );

    const score =
        result?.score ||
        getGameUIScore();

    const scoreElement =
        panel.querySelector(
            "[data-result-score]"
        );

    if (scoreElement) {

        scoreElement.textContent =
            `${Number(score.teamA || 0).toLocaleString("fa-IR")} - ${Number(score.teamB || 0).toLocaleString("fa-IR")}`;
    }

    panel.classList.add(
        "active"
    );

    panel.removeAttribute(
        "hidden"
    );

    gameUIPlaySound(
        "game-win"
    );

    gameUIVibrate(
        [50, 80, 50]
    );
}


/* ================================================================
   57. HIDE RESULT
=============================================================================== */

function hideGameUIResult() {

    gameUIState.resultPanelOpen =
        false;

    const panel =
        gameUIQuery(
            "#game-result"
        ) ||
        gameUIQuery(
            "[data-game-result]"
        );

    if (panel) {

        panel.classList.remove(
            "active"
        );

        panel.setAttribute(
            "hidden",
            "hidden"
        );
    }
}


/* ================================================================
   58. CONNECTION STATUS
=============================================================================== */

function renderGameUIConnection(
    connected,
    text = null
) {

    gameUIState.connected =
        !!connected;

    gameUIState.connectionText =
        text ||
        (
            connected
                ? "متصل"
                : "اتصال قطع است"
        );

    const elements =
        gameUIQueryAll(
            "[data-game-connection]"
        );

    elements.forEach(
        element => {

            element.textContent =
                gameUIState.connectionText;

            element.classList.toggle(
                "connected",
                !!connected
            );

            element.classList.toggle(
                "disconnected",
                !connected
            );
        }
    );
}


/* ================================================================
   59. RECONNECT
=============================================================================== */

function startGameUIReconnect() {

    if (
        gameUIState.reconnectInterval
    ) {

        return;
    }

    renderGameUIConnection(
        false,
        "در حال اتصال مجدد..."
    );

    gameUIState.reconnectInterval =
        setInterval(
            async () => {

                try {

                    if (
                        typeof window.reconnectGame === "function"
                    ) {

                        const result =
                            await window.reconnectGame();

                        if (
                            result
                        ) {

                            stopGameUIReconnect();

                            renderGameUIConnection(
                                true,
                                "متصل"
                            );
                        }

                    } else if (
                        window.multiplayer &&
                        typeof window.multiplayer.reconnect === "function"
                    ) {

                        const result =
                            await window.multiplayer.reconnect();

                        if (
                            result
                        ) {

                            stopGameUIReconnect();

                            renderGameUIConnection(
                                true,
                                "متصل"
                            );
                        }

                    }

                } catch (error) {

                    console.warn(
                        "Reconnect attempt failed:",
                        error
                    );
                }

            },
            5000
        );
}


function stopGameUIReconnect() {

    if (
        gameUIState.reconnectInterval
    ) {

        clearInterval(
            gameUIState.reconnectInterval
        );

        gameUIState.reconnectInterval =
            null;
    }
}


/* ================================================================
   60. SETTINGS VALUES
================================================================ */

function loadGameUISettings() {

    try {

        const raw =
            localStorage.getItem(
                "hokm_game_settings"
            );

        if (!raw) {

            return;
        }

        const settings =
            JSON.parse(
                raw
            );

        gameUIState.soundEnabled =
            settings.soundEnabled !== false;
