-- ================================================================
-- HOKM ONLINE
-- database.sql
--
-- COMPLETE PRODUCTION-READY DATABASE SCHEMA
-- Version: 2.0.0
--
-- PostgreSQL / Supabase
--
-- این نسخه تمام قابلیت‌های نسخه قبلی را حفظ می‌کند و
-- زیرساخت کامل‌تری برای یک بازی واقعی آنلاین حکم فراهم می‌کند.
--
-- شامل:
--
-- 1. Player Profiles
-- 2. Player Settings
-- 3. Player Statistics
-- 4. XP / Level
-- 5. Coins
-- 6. Coin Transactions
-- 7. Shop
-- 8. Inventory
-- 9. Rooms
-- 10. Room Players
-- 11. Games
-- 12. Game Players
-- 13. Game Hands
-- 14. Game Tricks
-- 15. Trick Cards
-- 16. Chat
-- 17. Game History
-- 18. Notifications
-- 19. Friendships
-- 20. Achievements
-- 21. Player Achievements
-- 22. Daily Rewards
-- 23. Reports
-- 24. Realtime
-- 25. Security / RLS
-- 26. Automatic Profile Creation
-- 27. Automatic Settings Creation
-- 28. Updated At Triggers
--
-- هیچ قابلیت قبلی حذف نشده است.
-- ================================================================


-- ================================================================
-- 1. EXTENSIONS
-- ================================================================

create extension if not exists "pgcrypto";


-- ================================================================
-- 2. PLAYER PROFILES
-- ================================================================

create table if not exists public.profiles (

    id uuid primary key references auth.users(id)
        on delete cascade,

    username text,

    display_name text,

    avatar_url text,

    level integer not null default 1
        check (level >= 1),

    experience bigint not null default 0
        check (experience >= 0),

    coins bigint not null default 1000
        check (coins >= 0),

    games_played integer not null default 0
        check (games_played >= 0),

    games_won integer not null default 0
        check (games_won >= 0),

    games_lost integer not null default 0
        check (games_lost >= 0),

    total_tricks integer not null default 0
        check (total_tricks >= 0),

    tricks_won integer not null default 0
        check (tricks_won >= 0),

    win_streak integer not null default 0
        check (win_streak >= 0),

    best_win_streak integer not null default 0
        check (best_win_streak >= 0),

    is_online boolean not null default false,

    last_seen timestamptz default now(),

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint profiles_games_won_valid
        check (games_won <= games_played),

    constraint profiles_games_lost_valid
        check (games_lost <= games_played),

    constraint profiles_display_name_length
        check (
            display_name is null
            or char_length(display_name) between 2 and 20
        ),

    constraint profiles_username_length
        check (
            username is null
            or char_length(username) between 2 and 30
        )
);


-- سازگاری با نسخه‌های قبلی

alter table public.profiles
add column if not exists username text;

alter table public.profiles
add column if not exists display_name text;

alter table public.profiles
add column if not exists avatar_url text;

alter table public.profiles
add column if not exists level integer not null default 1;

alter table public.profiles
add column if not exists experience bigint not null default 0;

alter table public.profiles
add column if not exists coins bigint not null default 1000;

alter table public.profiles
add column if not exists games_played integer not null default 0;

alter table public.profiles
add column if not exists games_won integer not null default 0;

alter table public.profiles
add column if not exists games_lost integer not null default 0;

alter table public.profiles
add column if not exists total_tricks integer not null default 0;

alter table public.profiles
add column if not exists tricks_won integer not null default 0;

alter table public.profiles
add column if not exists win_streak integer not null default 0;

alter table public.profiles
add column if not exists best_win_streak integer not null default 0;

alter table public.profiles
add column if not exists is_online boolean not null default false;

alter table public.profiles
add column if not exists last_seen timestamptz default now();

alter table public.profiles
add column if not exists created_at timestamptz not null default now();

alter table public.profiles
add column if not exists updated_at timestamptz not null default now();


-- ================================================================
-- 3. PLAYER SETTINGS
-- ================================================================

create table if not exists public.player_settings (

    user_id uuid primary key
        references public.profiles(id)
        on delete cascade,

    sound_enabled boolean not null default true,

    music_enabled boolean not null default true,

    notifications_enabled boolean not null default true,

    vibration_enabled boolean not null default true,

    language text not null default 'fa',

    theme text not null default 'classic',

    card_theme text not null default 'classic',

    table_theme text not null default 'classic',

    updated_at timestamptz not null default now()
);


-- ================================================================
-- 4. PLAYER STATISTICS
-- ================================================================

create table if not exists public.player_statistics (

    user_id uuid primary key
        references public.profiles(id)
        on delete cascade,

    total_games integer not null default 0,

    wins integer not null default 0,

    losses integer not null default 0,

    total_tricks integer not null default 0,

    tricks_won integer not null default 0,

    total_points bigint not null default 0,

    highest_score integer not null default 0,

    current_win_streak integer not null default 0,

    best_win_streak integer not null default 0,

    total_coins_earned bigint not null default 0,

    total_coins_spent bigint not null default 0,

    updated_at timestamptz not null default now()
);


-- ================================================================
-- 5. SHOP ITEMS
-- ================================================================

create table if not exists public.shop_items (

    id uuid primary key
        default gen_random_uuid(),

    item_key text not null unique,

    name text not null,

    description text,

    item_type text not null,

    price bigint not null default 0
        check (price >= 0),

    image_url text,

    metadata jsonb not null default '{}'::jsonb,

    is_active boolean not null default true,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ================================================================
-- 6. PLAYER INVENTORY
-- ================================================================

create table if not exists public.player_inventory (

    id uuid primary key
        default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    item_id uuid not null
        references public.shop_items(id)
        on delete cascade,

    quantity integer not null default 1
        check (quantity >= 1),

    is_equipped boolean not null default false,

    purchased_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    unique(user_id, item_id)
);


-- ================================================================
-- 7. COIN TRANSACTIONS
-- ================================================================

create table if not exists public.coin_transactions (

    id uuid primary key
        default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    amount bigint not null,

    balance_after bigint not null
        check (balance_after >= 0),

    transaction_type text not null,

    description text,

    reference_id uuid,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);


-- ================================================================
-- 8. ROOMS
-- ================================================================

create table if not exists public.rooms (

    id uuid primary key
        default gen_random_uuid(),

    code varchar(6) not null unique,

    name text not null default 'اتاق حکم',

    host_id uuid not null
        references public.profiles(id)
        on delete cascade,

    entry_fee bigint not null default 0
        check (entry_fee >= 0),

    is_private boolean not null default true,

    status text not null default 'waiting',

    max_players integer not null default 4
        check (max_players = 4),

    current_players integer not null default 0
        check (current_players between 0 and 4),

    password_hash text,

    settings jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    closed_at timestamptz,

    constraint room_code_format
        check (code ~ '^[0-9]{6}$'),

    constraint room_status_valid
        check (
            status in (
                'waiting',
                'starting',
                'playing',
                'finished',
                'closed'
            )
        )
);


-- ================================================================
-- 9. ROOM PLAYERS
-- ================================================================

create table if not exists public.room_players (

    id uuid primary key
        default gen_random_uuid(),

    room_id uuid not null
        references public.rooms(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    seat integer not null
        check (seat between 0 and 3),

    team text not null
        check (team in ('A', 'B')),

    is_ready boolean not null default false,

    is_connected boolean not null default true,

    last_ping timestamptz default now(),

    joined_at timestamptz not null default now(),

    left_at timestamptz,

    unique(room_id, user_id),

    unique(room_id, seat)
);


-- ================================================================
-- 10. GAMES
-- ================================================================

create table if not exists public.games (

    id uuid primary key
        default gen_random_uuid(),

    room_id uuid
        references public.rooms(id)
        on delete set null,

    status text not null default 'waiting',

    phase text not null default 'idle',

    trump_suit text,

    lead_suit text,

    current_turn integer,

    leader_seat integer default 0,

    trick_number integer not null default 0,

    team_a_tricks integer not null default 0,

    team_b_tricks integer not null default 0,

    team_a_score integer not null default 0,

    team_b_score integer not null default 0,

    round_number integer not null default 1,

    winner_team text,

    dealer_seat integer,

    hakem_seat integer,

    turn_started_at timestamptz,

    started_at timestamptz,

    finished_at timestamptz,

    game_state jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint game_status_valid
        check (
            status in (
                'waiting',
                'active',
                'finished',
                'cancelled'
            )
        ),

    constraint game_phase_valid
        check (
            phase in (
                'idle',
                'dealing',
                'hakem-selection',
                'trump-selection',
                'playing',
                'trick-finished',
                'round-finished',
                'game-finished'
            )
        ),

    constraint trump_suit_valid
        check (
            trump_suit is null
            or trump_suit in (
                'hearts',
                'diamonds',
                'clubs',
                'spades'
            )
        ),

    constraint lead_suit_valid
        check (
            lead_suit is null
            or lead_suit in (
                'hearts',
                'diamonds',
                'clubs',
                'spades'
            )
        ),

    constraint current_turn_valid
        check (
            current_turn is null
            or current_turn between 0 and 3
        ),

    constraint leader_seat_valid
        check (
            leader_seat between 0 and 3
        ),

    constraint winner_team_valid
        check (
            winner_team is null
            or winner_team in ('A', 'B')
        )
);


-- ================================================================
-- 11. GAME PLAYERS
-- ================================================================

create table if not exists public.game_players (

    id uuid primary key
        default gen_random_uuid(),

    game_id uuid not null
        references public.games(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    seat integer not null
        check (seat between 0 and 3),

    team text not null
        check (team in ('A', 'B')),

    is_host boolean not null default false,

    is_connected boolean not null default true,

    final_tricks integer not null default 0,

    final_coins_change bigint not null default 0,

    joined_at timestamptz not null default now(),

    left_at timestamptz,

    unique(game_id, user_id),

    unique(game_id, seat)
);


-- ================================================================
-- 12. GAME HANDS
-- ================================================================

create table if not exists public.game_hands (

    id uuid primary key
        default gen_random_uuid(),

    game_id uuid not null
        references public.games(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    card_id text not null,

    suit text not null,

    rank integer not null,

    is_played boolean not null default false,

    received_at timestamptz not null default now(),

    played_at timestamptz,

    constraint hand_suit_valid
        check (
            suit in (
                'hearts',
                'diamonds',
                'clubs',
                'spades'
            )
        ),

    constraint hand_rank_valid
        check (
            rank between 2 and 14
        ),

    unique(game_id, user_id, card_id)
);


-- ================================================================
-- 13. GAME TRICKS
-- ================================================================

create table if not exists public.game_tricks (

    id uuid primary key
        default gen_random_uuid(),

    game_id uuid not null
        references public.games(id)
        on delete cascade,

    trick_number integer not null,

    lead_suit text,

    winner_user_id uuid
        references public.profiles(id)
        on delete set null,

    winner_seat integer,

    created_at timestamptz not null default now(),

    finished_at timestamptz,

    unique(game_id, trick_number)
);


-- ================================================================
-- 14. TRICK CARDS
-- ================================================================

create table if not exists public.trick_cards (

    id uuid primary key
        default gen_random_uuid(),

    trick_id uuid not null
        references public.game_tricks(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    seat integer not null
        check (seat between 0 and 3),

    card_id text not null,

    suit text not null,

    rank integer not null,

    play_order integer not null,

    played_at timestamptz not null default now(),

    constraint trick_card_suit_valid
        check (
            suit in (
                'hearts',
                'diamonds',
                'clubs',
                'spades'
            )
        ),

    constraint trick_card_rank_valid
        check (
            rank between 2 and 14
        ),

    unique(trick_id, user_id),

    unique(trick_id, play_order)
);


-- ================================================================
-- 15. GAME EVENTS
-- ================================================================

create table if not exists public.game_events (

    id uuid primary key
        default gen_random_uuid(),

    game_id uuid not null
        references public.games(id)
        on delete cascade,

    user_id uuid
        references public.profiles(id)
        on delete set null,

    event_type text not null,

    event_data jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);


-- ================================================================
-- 16. CHAT MESSAGES
-- ================================================================

create table if not exists public.chat_messages (

    id uuid primary key
        default gen_random_uuid(),

    room_id uuid
        references public.rooms(id)
        on delete cascade,

    game_id uuid
        references public.games(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    message text not null,

    message_type text not null default 'text',

    created_at timestamptz not null default now(),

    constraint chat_message_length
        check (
            char_length(message) between 1 and 100
        )
);


-- ================================================================
-- 17. GAME HISTORY
-- ================================================================

create table if not exists public.game_history (

    id uuid primary key
        default gen_random_uuid(),

    game_id uuid not null
        references public.games(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    team text not null,

    result text not null,

    tricks integer not null default 0,

    coins_change bigint not null default 0,

    opponent_score integer not null default 0,

    player_score integer not null default 0,

    xp_earned integer not null default 0,

    played_at timestamptz not null default now(),

    constraint history_team_valid
        check (team in ('A', 'B')),

    constraint history_result_valid
        check (
            result in (
                'win',
                'loss',
                'draw'
            )
        )
);


-- ================================================================
-- 18. NOTIFICATIONS
-- ================================================================

create table if not exists public.notifications (

    id uuid primary key
        default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    title text not null,

    message text not null,

    notification_type text not null default 'system',

    reference_id uuid,

    is_read boolean not null default false,

    created_at timestamptz not null default now()
);


-- ================================================================
-- 19. FRIENDSHIPS
-- ================================================================

create table if not exists public.friendships (

    id uuid primary key
        default gen_random_uuid(),

    requester_id uuid not null
        references public.profiles(id)
        on delete cascade,

    addressee_id uuid not null
        references public.profiles(id)
        on delete cascade,

    status text not null default 'pending',

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint friendship_status_valid
        check (
            status in (
                'pending',
                'accepted',
                'rejected',
                'blocked'
            )
        ),

    constraint friendship_not_self
        check (
            requester_id <> addressee_id
        ),

    unique(requester_id, addressee_id)
);


-- ================================================================
-- 20. ACHIEVEMENTS
-- ================================================================

create table if not exists public.achievements (

    id uuid primary key
        default gen_random_uuid(),

    achievement_key text not null unique,

    title text not null,

    description text not null,

    icon_url text,

    reward_coins bigint not null default 0,

    reward_xp integer not null default 0,

    requirement_type text not null,

    requirement_value bigint not null default 1,

    is_active boolean not null default true,

    created_at timestamptz not null default now()
);


-- ================================================================
-- 21. PLAYER ACHIEVEMENTS
-- ================================================================

create table if not exists public.player_achievements (

    id uuid primary key
        default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    achievement_id uuid not null
        references public.achievements(id)
        on delete cascade,

    progress bigint not null default 0,

    completed boolean not null default false,

    completed_at timestamptz,

    unique(user_id, achievement_id)
);


-- ================================================================
-- 22. DAILY REWARDS
-- ================================================================

create table if not exists public.daily_rewards (

    id uuid primary key
        default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    reward_date date not null,

    reward_day integer not null default 1,

    coins bigint not null default 0,

    xp integer not null default 0,

    claimed_at timestamptz not null default now(),

    unique(user_id, reward_date)
);


-- ================================================================
-- 23. PLAYER REPORTS
-- ================================================================

create table if not exists public.player_reports (

    id uuid primary key
        default gen_random_uuid(),

    reporter_id uuid not null
        references public.profiles(id)
        on delete cascade,

    reported_user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    room_id uuid
        references public.rooms(id)
        on delete set null,

    game_id uuid
        references public.games(id)
        on delete set null,

    reason text not null,

    description text,

    status text not null default 'pending',

    created_at timestamptz not null default now(),

    reviewed_at timestamptz,

    constraint report_status_valid
        check (
            status in (
                'pending',
                'reviewed',
                'resolved',
                'rejected'
            )
        ),

    constraint report_not_self
        check (
            reporter_id <> reported_user_id
        )
);


-- ================================================================
-- 24. INDEXES
-- ================================================================

create index if not exists idx_profiles_username
on public.profiles(username);

create index if not exists idx_profiles_display_name
on public.profiles(display_name);

create index if not exists idx_profiles_online
on public.profiles(is_online);

create index if not exists idx_profiles_level
on public.profiles(level);

create index if not exists idx_profiles_coins
on public.profiles(coins);

create index if not exists idx_rooms_code
on public.rooms(code);

create index if not exists idx_rooms_status
on public.rooms(status);

create index if not exists idx_rooms_host
on public.rooms(host_id);

create index if not exists idx_room_players_room
on public.room_players(room_id);

create index if not exists idx_room_players_user
on public.room_players(user_id);

create index if not exists idx_games_room
on public.games(room_id);

create index if not exists idx_games_status
on public.games(status);

create index if not exists idx_games_turn
on public.games(current_turn);

create index if not exists idx_game_players_game
on public.game_players(game_id);

create index if not exists idx_game_players_user
on public.game_players(user_id);

create index if not exists idx_game_hands_game
on public.game_hands(game_id);

create index if not exists idx_game_hands_user
on public.game_hands(user_id);

create index if not exists idx_game_tricks_game
on public.game_tricks(game_id);

create index if not exists idx_trick_cards_trick
on public.trick_cards(trick_id);

create index if not exists idx_game_events_game
on public.game_events(game_id);

create index if not exists idx_game_events_created
on public.game_events(created_at);

create index if not exists idx_chat_room
on public.chat_messages(room_id);

create index if not exists idx_chat_game
on public.chat_messages(game_id);

create index if not exists idx_chat_created
on public.chat_messages(created_at);

create index if not exists idx_history_user
on public.game_history(user_id);

create index if not exists idx_history_game
on public.game_history(game_id);

create index if not exists idx_notifications_user
on public.notifications(user_id);

create index if not exists idx_notifications_unread
on public.notifications(user_id, is_read);

create index if not exists idx_friendships_requester
on public.friendships(requester_id);

create index if not exists idx_friendships_addressee
on public.friendships(addressee_id);

create index if not exists idx_inventory_user
on public.player_inventory(user_id);

create index if not exists idx_coin_transactions_user
on public.coin_transactions(user_id);

create index if not exists idx_achievements_active
on public.achievements(is_active);

create index if not exists idx_player_achievements_user
on public.player_achievements(user_id);

create index if not exists idx_daily_rewards_user
on public.daily_rewards(user_id);

create index if not exists idx_reports_status
on public.player_reports(status);


-- ================================================================
-- 25. UPDATED_AT FUNCTION
-- ================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin

    new.updated_at = now();

    return new;

end;
$$;


-- ================================================================
-- 26. UPDATED_AT TRIGGERS
-- ================================================================

drop trigger if exists profiles_updated_at
on public.profiles;

create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();


drop trigger if exists player_settings_updated_at
on public.player_settings;

create trigger player_settings_updated_at
before update on public.player_settings
for each row
execute function public.set_updated_at();


drop trigger if exists player_statistics_updated_at
on public.player_statistics;

create trigger player_statistics_updated_at
before update on public.player_statistics
for each row
execute function public.set_updated_at();


drop trigger if exists shop_items_updated_at
on public.shop_items;

create trigger shop_items_updated_at
before update on public.shop_items
for each row
execute function public.set_updated_at();


drop trigger if exists player_inventory_updated_at
on public.player_inventory;

create trigger player_inventory_updated_at
before update on public.player_inventory
for each row
execute function public.set_updated_at();


drop trigger if exists rooms_updated_at
on public.rooms;

create trigger rooms_updated_at
before update on public.rooms
for each row
execute function public.set_updated_at();


drop trigger if exists games_updated_at
on public.games;

create trigger games_updated_at
before update on public.games
for each row
execute function public.set_updated_at();


drop trigger if exists friendships_updated_at
on public.friendships;

create trigger friendships_updated_at
before update on public.friendships
for each row
execute function public.set_updated_at();


-- ================================================================
-- 27. AUTO CREATE PROFILE
-- ================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    new_name text;
begin

    new_name :=
        coalesce(
            new.raw_user_meta_data ->> 'display_name',
            new.raw_user_meta_data ->> 'username',
            'بازیکن'
        );

    insert into public.profiles (
        id,
        username,
        display_name,
        avatar_url,
        coins,
        level,
        experience,
        games_played,
        games_won,
        games_lost
    )

    values (
        new.id,
        left(new_name, 30),
        left(new_name, 20),
        new.raw_user_meta_data ->> 'avatar_url',
        1000,
        1,
        0,
        0,
        0,
        0
    )

    on conflict (id)
    do update set
        display_name =
            coalesce(
                public.profiles.display_name,
                excluded.display_name
            );

    return new;

end;
$$;


drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- ================================================================
-- 28. AUTO CREATE SETTINGS + STATISTICS
-- ================================================================

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

    insert into public.player_settings (
        user_id
    )

    values (
        new.id
    )

    on conflict (user_id)
    do nothing;


    insert into public.player_statistics (
        user_id
    )

    values (
        new.id
    )

    on conflict (user_id)
    do nothing;


    return new;

end;
$$;


drop trigger if exists on_profile_created
on public.profiles;

create trigger on_profile_created
after insert on public.profiles
for each row
execute function public.handle_new_profile();


-- ================================================================
-- 29. DEFAULT SHOP ITEMS
-- ================================================================

insert into public.shop_items (
    item_key,
    name,
    description,
    item_type,
    price,
    sort_order
)

values

(
    'card-classic',
    'پوسته کلاسیک کارت',
    'پوسته کلاسیک برای کارت‌های بازی',
    'card-theme',
    250,
    1
),

(
    'card-royal',
    'پوسته سلطنتی کارت',
    'پوسته ویژه سلطنتی برای کارت‌های بازی',
    'card-theme',
    500,
    2
),

(
    'avatar-gold',
    'آواتار طلایی',
    'آواتار ویژه طلایی',
    'avatar',
    750,
    3
),

(
    'table-luxury',
    'میز سلطنتی',
    'تم ویژه برای میز بازی',
    'table-theme',
    1000,
    4
)

on conflict (item_key)
do update set
    name = excluded.name,
    description = excluded.description,
    item_type = excluded.item_type,
    price = excluded.price;


-- ================================================================
-- 30. DEFAULT ACHIEVEMENTS
-- ================================================================

insert into public.achievements (
    achievement_key,
    title,
    description,
    reward_coins,
    reward_xp,
    requirement_type,
    requirement_value
)

values

(
    'first-game',
    'اولین بازی',
    'اولین بازی خود را انجام بده',
    100,
    50,
    'games_played',
    1
),

(
    'first-win',
    'اولین پیروزی',
    'اولین بازی خود را ببر',
    250,
    100,
    'games_won',
    1
),

(
    'ten-wins',
    'بازیکن حرفه‌ای',
    '۱۰ بازی را ببر',
    1000,
    500,
    'games_won',
    10
),

(
    'hundred-wins',
    'سلطان حکم',
    '۱۰۰ بازی را ببر',
    5000,
    2500,
    'games_won',
    100
),

(
    'hundred-games',
    'بازیکن باسابقه',
    '۱۰۰ بازی انجام بده',
    2500,
    1500,
    'games_played',
    100
)

on conflict (achievement_key)
do nothing;


-- ================================================================
-- 31. ROW LEVEL SECURITY
-- ================================================================

alter table public.profiles
enable row level security;

alter table public.player_settings
enable row level security;

alter table public.player_statistics
enable row level security;

alter table public.shop_items
enable row level security;

alter table public.player_inventory
enable row level security;

alter table public.coin_transactions
enable row level security;

alter table public.rooms
enable row level security;

alter table public.room_players
enable row level security;

alter table public.games
enable row level security;

alter table public.game_players
enable row level security;

alter table public.game_hands
enable row level security;

alter table public.game_tricks
enable row level security;

alter table public.trick_cards
enable row level security;

alter table public.game_events
enable row level security;

alter table public.chat_messages
enable row level security;

alter table public.game_history
enable row level security;

alter table public.notifications
enable row level security;

alter table public.friendships
enable row level security;

alter table public.achievements
enable row level security;

alter table public.player_achievements
enable row level security;

alter table public.daily_rewards
enable row level security;

alter table public.player_reports
enable row level security;


-- ================================================================
-- 32. PROFILES POLICIES
-- ================================================================

drop policy if exists "profiles_select_authenticated"
on public.profiles;

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);


drop policy if exists "profiles_update_own"
on public.profiles;

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


-- ================================================================
-- 33. SETTINGS POLICIES
-- ================================================================

drop policy if exists "settings_select_own"
on public.player_settings;

create policy "settings_select_own"
on public.player_settings
for select
to authenticated
using (auth.uid() = user_id);


drop policy if exists "settings_insert_own"
on public.player_settings;

create policy "settings_insert_own"
on public.player_settings
for insert
to authenticated
with check (auth.uid() = user_id);


drop policy if exists "settings_update_own"
on public.player_settings;

create policy "settings_update_own"
on public.player_settings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- ================================================================
-- 34. STATISTICS POLICIES
-- ================================================================

drop policy if exists "statistics_read_authenticated"
on public.player_statistics;

create policy "statistics_read_authenticated"
on public.player_statistics
for select
to authenticated
using (true);


-- ================================================================
-- 35. SHOP POLICIES
-- ================================================================

drop policy if exists "shop_items_read"
on public.shop_items;

create policy "shop_items_read"
on public.shop_items
for select
to anon, authenticated
using (is_active = true);


-- ================================================================
-- 36. INVENTORY POLICIES
-- ================================================================

drop policy if exists "inventory_read_own"
on public.player_inventory;

create policy "inventory_read_own"
on public.player_inventory
for select
to authenticated
using (auth.uid() = user_id);


-- ================================================================
-- 37. COIN TRANSACTION POLICIES
-- ================================================================

drop policy if exists "coin_transactions_read_own"
on public.coin_transactions;

create policy "coin_transactions_read_own"
on public.coin_transactions
for select
to authenticated
using (auth.uid() = user_id);


-- ================================================================
-- 38. ROOM POLICIES
-- ================================================================

drop policy if exists "rooms_read_authenticated"
on public.rooms;

create policy "rooms_read_authenticated"
on public.rooms
for select
to authenticated
using (true);


drop policy if exists "rooms_insert_authenticated"
on public.rooms;

create policy "rooms_insert_authenticated"
on public.rooms
for insert
to authenticated
with check (auth.uid() = host_id);


drop policy if exists "rooms_update_host"
on public.rooms;

create policy "rooms_update_host"
on public.rooms
for update
to authenticated
using (auth.uid() = host_id)
with check (auth.uid() = host_id);


-- ================================================================
-- 39. ROOM PLAYERS POLICIES
-- ================================================================

drop policy if exists "room_players_read"
on public.room_players;

create policy "room_players_read"
on public.room_players
for select
to authenticated
using (true);


drop policy if exists "room_players_insert"
on public.room_players;

create policy "room_players_insert"
on public.room_players
for insert
to authenticated
with check (auth.uid() = user_id);


drop policy if exists "room_players_update_own"
on public.room_players;

create policy "room_players_update_own"
on public.room_players
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- ================================================================
-- 40. GAME POLICIES
-- ================================================================

drop policy if exists "games_read_authenticated"
on public.games;

create policy "games_read_authenticated"
on public.games
for select
to authenticated
using (true);


-- ================================================================
-- 41. GAME PLAYERS POLICIES
-- ================================================================

drop policy if exists "game_players_read"
on public.game_players;

create policy "game_players_read"
on public.game_players
for select
to authenticated
using (true);


-- ================================================================
-- 42. GAME HANDS POLICIES
-- ================================================================

drop policy if exists "game_hands_own"
on public.game_hands;

create policy "game_hands_own"
on public.game_hands
for select
to authenticated
using (auth.uid() = user_id);


-- ================================================================
-- 43. TRICK POLICIES
-- ================================================================

drop policy if exists "game_tricks_read"
on public.game_tricks;

create policy "game_tricks_read"
on public.game_tricks
for select
to authenticated
using (true);


drop policy if exists "trick_cards_read"
on public.trick_cards;

create policy "trick_cards_read"
on public.trick_cards
for select
to authenticated
using (true);


-- ================================================================
-- 44. GAME EVENTS
-- ================================================================

drop policy if exists "game_events_read"
on public.game_events;

create policy "game_events_read"
on public.game_events
for select
to authenticated
using (true);


-- ================================================================
-- 45. CHAT POLICIES
-- ================================================================

drop policy if exists "chat_read"
on public.chat_messages;

create policy "chat_read"
on public.chat_messages
for select
to authenticated
using (true);


drop policy if exists "chat_insert"
on public.chat_messages;

create policy "chat_insert"
on public.chat_messages
for insert
to authenticated
with check (auth.uid() = user_id);


-- ================================================================
-- 46. HISTORY POLICIES
-- ================================================================

drop policy if exists "history_read_own"
on public.game_history;

create policy "history_read_own"
on public.game_history
for select
to authenticated
using (auth.uid() = user_id);


-- ================================================================
-- 47. NOTIFICATION POLICIES
-- ================================================================

drop policy if exists "notifications_read_own"
on public.notifications;

create policy "notifications_read_own"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);


drop policy if exists "notifications_update_own"
on public.notifications;

create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- ================================================================
-- 48. FRIENDSHIP POLICIES
-- ================================================================

drop policy if exists "friendships_read_own"
on public.friendships;

create policy "friendships_read_own"
on public.friendships
for select
to authenticated
using (
    auth.uid() = requester_id
    or auth.uid() = addressee_id
);


drop policy if exists "friendships_insert_own"
on public.friendships;

create policy "friendships_insert_own"
on public.friendships
for insert
to authenticated
with check (auth.uid() = requester_id);


drop policy if exists "friendships_update_participant"
on public.friendships;

create policy "friendships_update_participant"
on public.friendships
for update
to authenticated
using (
    auth.uid() = requester_id
    or auth.uid() = addressee_id
)
with check (
    auth.uid() = requester_id
    or auth.uid() = addressee_id
);


-- ================================================================
-- 49. ACHIEVEMENT POLICIES
-- ================================================================

drop policy if exists "achievements_read"
on public.achievements;

create policy "achievements_read"
on public.achievements
for select
to authenticated
using (is_active = true);


drop policy if exists "player_achievements_read_own"
on public.player_achievements;

create policy "player_achievements_read_own"
on public.player_achievements
for select
to authenticated
using (auth.uid() = user_id);


-- ================================================================
-- 50. DAILY REWARD POLICIES
-- ================================================================

drop policy if exists "daily_rewards_read_own"
on public.daily_rewards;

create policy "daily_rewards_read_own"
on public.daily_rewards
for select
to authenticated
using (auth.uid() = user_id);


-- ================================================================
-- 51. REPORT POLICIES
-- ================================================================

drop policy if exists "reports_insert_own"
on public.player_reports;

create policy "reports_insert_own"
on public.player_reports
for insert
to authenticated
with check (auth.uid() = reporter_id);


drop policy if exists "reports_read_own"
on public.player_reports;

create policy "reports_read_own"
on public.player_reports
for select
to authenticated
using (auth.uid() = reporter_id);


-- ================================================================
-- 52. REALTIME PUBLICATION
-- ================================================================

do $$
begin

    begin
        alter publication supabase_realtime
        add table public.rooms;
    exception
        when duplicate_object then null;
    end;

    begin
        alter publication supabase_realtime
        add table public.room_players;
    exception
        when duplicate_object then null;
    end;

    begin
        alter publication supabase_realtime
        add table public.games;
    exception
        when duplicate_object then null;
    end;

    begin
        alter publication supabase_realtime
        add table public.game_players;
    exception
        when duplicate_object then null;
    end;

    begin
        alter publication supabase_realtime
        add table public.game_hands;
    exception
        when duplicate_object then null;
    end;

    begin
        alter publication supabase_realtime
        add table public.game_tricks;
    exception
        when duplicate_object then null;
    end;

    begin
        alter publication supabase_realtime
        add table public.trick_cards;
    exception
        when duplicate_object then null;
    end;

    begin
        alter publication supabase_realtime
        add table public.game_events;
    exception
        when duplicate_object then null;
    end;

    begin
        alter publication supabase_realtime
        add table public.chat_messages;
    exception
        when duplicate_object then null;
    end;

end
$$;


-- ================================================================
-- 53. FINAL STATUS
-- ================================================================

select
    'Hokm Online Complete Database v2.0 installed successfully.'
    as status;
