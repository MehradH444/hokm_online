-- ================================================================
-- HOKM ONLINE
-- database.sql
--
-- Database schema for Supabase / PostgreSQL
--
-- Version: 1.0.0
--
-- شامل:
-- 1. پروفایل بازیکنان
-- 2. آمار بازی
-- 3. سکه
-- 4. موجودی فروشگاه
-- 5. آیتم‌های فروشگاه
-- 6. اتاق‌ها
-- 7. بازیکنان اتاق
-- 8. بازی‌ها
-- 9. دست‌های بازی
-- 10. کارت‌های بازی
-- 11. حرکات بازیکنان
-- 12. چت
-- 13. تاریخچه بازی
-- 14. اعلان‌ها
-- 15. رتبه‌بندی
-- 16. RLS
--
-- این فایل برای PostgreSQL / Supabase طراحی شده است.
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

    username text not null,

    avatar_url text,

    level integer not null default 1
        check (level >= 1),

    coins bigint not null default 1000
        check (coins >= 0),

    games_played integer not null default 0
        check (games_played >= 0),

    games_won integer not null default 0
        check (games_won >= 0),

    total_tricks integer not null default 0
        check (total_tricks >= 0),

    experience integer not null default 0
        check (experience >= 0),

    is_online boolean not null default false,

    last_seen timestamptz
        default now(),

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint username_length
        check (
            char_length(username)
            between 2 and 20
        ),

    constraint games_won_valid
        check (
            games_won <= games_played
        )
);


-- ================================================================
-- 3. PLAYER SETTINGS
-- ================================================================

create table if not exists public.player_settings (

    user_id uuid primary key
        references public.profiles(id)
        on delete cascade,

    sound_enabled boolean
        not null default true,

    music_enabled boolean
        not null default true,

    notifications_enabled boolean
        not null default true,

    vibration_enabled boolean
        not null default true,

    language text
        not null default 'fa',

    updated_at timestamptz
        not null default now()
);


-- ================================================================
-- 4. SHOP ITEMS
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

    is_active boolean
        not null default true,

    created_at timestamptz
        not null default now()
);


-- ================================================================
-- 5. PLAYER INVENTORY
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

    purchased_at timestamptz
        not null default now(),

    unique(user_id, item_id)
);


-- ================================================================
-- 6. COIN TRANSACTIONS
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

    created_at timestamptz
        not null default now()
);


-- ================================================================
-- 7. GAME ROOMS
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

    is_private boolean
        not null default true,

    status text not null default 'waiting',

    max_players integer
        not null default 4
        check (max_players = 4),

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    closed_at timestamptz,

    constraint room_code_format
        check (
            code ~ '^[0-9]{6}$'
        ),

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
-- 8. ROOM PLAYERS
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

    team text not null,

    is_ready boolean
        not null default false,

    joined_at timestamptz
        not null default now(),

    left_at timestamptz,

    unique(room_id, user_id),

    unique(room_id, seat),

    constraint room_player_team
        check (
            team in ('A', 'B')
        )
);


-- ================================================================
-- 9. GAMES
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

    leader_seat integer
        default 0,

    trick_number integer
        not null default 0,

    team_a_tricks integer
        not null default 0,

    team_b_tricks integer
        not null default 0,

    team_a_score integer
        not null default 0,

    team_b_score integer
        not null default 0,

    round_number integer
        not null default 1,

    winner_team text,

    started_at timestamptz,

    finished_at timestamptz,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

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
        )
);


-- ================================================================
-- 10. GAME PLAYERS
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

    team text not null,

    is_host boolean
        not null default false,

    final_tricks integer
        not null default 0,

    final_coins_change bigint
        not null default 0,

    joined_at timestamptz
        not null default now(),

    unique(game_id, user_id),

    unique(game_id, seat),

    constraint game_player_team
        check (
            team in ('A', 'B')
        )
);


-- ================================================================
-- 11. GAME HANDS
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

    is_played boolean
        not null default false,

    received_at timestamptz
        not null default now(),

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
-- 12. GAME TRICKS
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

    created_at timestamptz
        not null default now(),

    finished_at timestamptz,

    unique(game_id, trick_number)
);


-- ================================================================
-- 13. TRICK CARDS
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

    played_at timestamptz
        not null default now(),

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
-- 14. CHAT MESSAGES
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

    created_at timestamptz
        not null default now(),

    constraint chat_message_length
        check (
            char_length(message)
            between 1 and 100
        )
);


-- ================================================================
-- 15. GAME HISTORY
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

    tricks integer
        not null default 0,

    coins_change bigint
        not null default 0,

    opponent_score integer
        not null default 0,

    player_score integer
        not null default 0,

    played_at timestamptz
        not null default now(),

    constraint history_team_valid
        check (
            team in ('A', 'B')
        ),

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
-- 16. NOTIFICATIONS
-- ================================================================

create table if not exists public.notifications (

    id uuid primary key
        default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    title text not null,

    message text not null,

    notification_type text
        not null default 'system',

    is_read boolean
        not null default false,

    created_at timestamptz
        not null default now()
);


-- ================================================================
-- 17. FRIENDS
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

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

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
-- 18. INDEXES
-- ================================================================


create index if not exists idx_profiles_username
on public.profiles(username);


create index if not exists idx_profiles_online
on public.profiles(is_online);


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


-- ================================================================
-- 19. UPDATED_AT FUNCTION
-- ================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin

    new.updated_at = now();

    return new;

end;
$$;


-- ================================================================
-- 20. UPDATED_AT TRIGGERS
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
-- 21. AUTO CREATE PROFILE
-- ================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

    insert into public.profiles (
        id,
        username,
        coins,
        level,
        games_played,
        games_won
    )

    values (

        new.id,

        coalesce(
            new.raw_user_meta_data ->> 'username',
            'بازیکن'
        ),

        1000,

        1,

        0,

        0
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
-- 22. INSERT DEFAULT SHOP ITEMS
-- ================================================================

insert into public.shop_items (
    item_key,
    name,
    description,
    item_type,
    price
)

values

(
    'card-classic',
    'پوسته کلاسیک کارت',
    'پوسته کلاسیک برای کارت‌های بازی',
    'card-theme',
    250
),

(
    'card-royal',
    'پوسته سلطنتی کارت',
    'پوسته ویژه سلطنتی برای کارت‌های بازی',
    'card-theme',
    500
),

(
    'avatar-gold',
    'آواتار طلایی',
    'آواتار ویژه طلایی',
    'avatar',
    750
),

(
    'table-luxury',
    'میز سلطنتی',
    'تم ویژه برای میز بازی',
    'table-theme',
    1000
)

on conflict (item_key)
do nothing;


-- ================================================================
-- 23. ROW LEVEL SECURITY
-- ================================================================


alter table public.profiles
enable row level security;


alter table public.player_settings
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


alter table public.chat_messages
enable row level security;


alter table public.game_history
enable row level security;


alter table public.notifications
enable row level security;


alter table public.friendships
enable row level security;


-- ================================================================
-- 24. PROFILE POLICIES
-- ================================================================

drop policy if exists
"profiles_select_authenticated"
on public.profiles;

create policy
"profiles_select_authenticated"

on public.profiles

for select

to authenticated

using (true);


drop policy if exists
"profiles_update_own"
on public.profiles;

create policy
"profiles_update_own"

on public.profiles

for update

to authenticated

using (
    auth.uid() = id
)

with check (
    auth.uid() = id
);


-- ================================================================
-- 25. PLAYER SETTINGS POLICIES
-- ================================================================

drop policy if exists
"settings_select_own"
on public.player_settings;

create policy
"settings_select_own"

on public.player_settings

for select

to authenticated

using (
    auth.uid() = user_id
);


drop policy if exists
"settings_insert_own"
on public.player_settings;

create policy
"settings_insert_own"

on public.player_settings

for insert

to authenticated

with check (
    auth.uid() = user_id
);


drop policy if exists
"settings_update_own"
on public.player_settings;

create policy
"settings_update_own"

on public.player_settings

for update

to authenticated

using (
    auth.uid() = user_id
)

with check (
    auth.uid() = user_id
);


-- ================================================================
-- 26. SHOP POLICIES
-- ================================================================

drop policy if exists
"shop_items_read"
on public.shop_items;

create policy
"shop_items_read"

on public.shop_items

for select

to anon, authenticated

using (
    is_active = true
);


-- ================================================================
-- 27. INVENTORY POLICIES
-- ================================================================

drop policy if exists
"inventory_read_own"
on public.player_inventory;

create policy
"inventory_read_own"

on public.player_inventory

for select

to authenticated

using (
    auth.uid() = user_id
);


-- ================================================================
-- 28. ROOM POLICIES
-- ================================================================

drop policy if exists
"rooms_read_authenticated"
on public.rooms;

create policy
"rooms_read_authenticated"

on public.rooms

for select

to authenticated

using (true);


drop policy if exists
"rooms_insert_authenticated"
on public.rooms;

create policy
"rooms_insert_authenticated"

on public.rooms

for insert

to authenticated

with check (
    auth.uid() = host_id
);


drop policy if exists
"rooms_update_host"
on public.rooms;

create policy
"rooms_update_host"

on public.rooms

for update

to authenticated

using (
    auth.uid() = host_id
)

with check (
    auth.uid() = host_id
);


-- ================================================================
-- 29. ROOM PLAYERS POLICIES
-- ================================================================

drop policy if exists
"room_players_read"
on public.room_players;

create policy
"room_players_read"

on public.room_players

for select

to authenticated

using (true);


drop policy if exists
"room_players_insert"
on public.room_players;

create policy
"room_players_insert"

on public.room_players

for insert

to authenticated

with check (
    auth.uid() = user_id
);


drop policy if exists
"room_players_update_own"
on public.room_players;

create policy
"room_players_update_own"

on public.room_players

for update

to authenticated

using (
    auth.uid() = user_id
)

with check (
    auth.uid() = user_id
);


-- ================================================================
-- 30. GAME POLICIES
-- ================================================================

drop policy if exists
"games_read_authenticated"
on public.games;

create policy
"games_read_authenticated"

on public.games

for select

to authenticated

using (true);


-- ================================================================
-- 31. GAME PLAYERS POLICIES
-- ================================================================

drop policy if exists
"game_players_read"
on public.game_players;

create policy
"game_players_read"

on public.game_players

for select

to authenticated

using (true);


-- ================================================================
-- 32. GAME HANDS POLICIES
-- ================================================================

drop policy if exists
"game_hands_own"
on public.game_hands;

create policy
"game_hands_own"

on public.game_hands

for select

to authenticated

using (
    auth.uid() = user_id
);


-- ================================================================
-- 33. TRICKS POLICIES
-- ================================================================

drop policy if exists
"game_tricks_read"
on public.game_tricks;

create policy
"game_tricks_read"

on public.game_tricks

for select

to authenticated

using (true);


drop policy if exists
"trick_cards_read"
on public.trick_cards;

create policy
"trick_cards_read"

on public.trick_cards

for select

to authenticated

using (true);


-- ================================================================
-- 34. CHAT POLICIES
-- ================================================================

drop policy if exists
"chat_read"
on public.chat_messages;

create policy
"chat_read"

on public.chat_messages

for select

to authenticated

using (true);


drop policy if exists
"chat_insert"
on public.chat_messages;

create policy
"chat_insert"

on public.chat_messages

for insert

to authenticated

with check (
    auth.uid() = user_id
);


-- ================================================================
-- 35. HISTORY POLICIES
-- ================================================================

drop policy if exists
"history_read_own"
on public.game_history;

create policy
"history_read_own"

on public.game_history

for select

to authenticated

using (
    auth.uid() = user_id
);


-- ================================================================
-- 36. NOTIFICATION POLICIES
-- ================================================================

drop policy if exists
"notifications_read_own"
on public.notifications;

create policy
"notifications_read_own"

on public.notifications

for select

to authenticated

using (
    auth.uid() = user_id
);


drop policy if exists
"notifications_update_own"
on public.notifications;

create policy
"notifications_update_own"

on public.notifications

for update

to authenticated

using (
    auth.uid() = user_id
)

with check (
    auth.uid() = user_id
);


-- ================================================================
-- 37. FRIENDSHIP POLICIES
-- ================================================================

drop policy if exists
"friendships_read_own"
on public.friendships;

create policy
"friendships_read_own"

on public.friendships

for select

to authenticated

using (
    auth.uid() = requester_id
    or
    auth.uid() = addressee_id
);


drop policy if exists
"friendships_insert_own"
on public.friendships;

create policy
"friendships_insert_own"

on public.friendships

for insert

to authenticated

with check (
    auth.uid() = requester_id
);


-- ================================================================
-- 38. REALTIME PUBLICATION
-- ================================================================

/*
 * این جداول بعداً برای Multiplayer واقعی
 * از Realtime استفاده خواهند کرد.
 *
 * اگر جدول قبلاً در publication باشد،
 * افزودن دوباره آن خطا ایجاد می‌کند.
 *
 * بنابراین از DO block استفاده شده است.
 */

do $$

begin

    begin

        alter publication supabase_realtime
        add table public.rooms;

    exception
        when duplicate_object then
            null;

    end;


    begin

        alter publication supabase_realtime
        add table public.room_players;

    exception
        when duplicate_object then
            null;

    end;


    begin

        alter publication supabase_realtime
        add table public.games;

    exception
        when duplicate_object then
            null;

    end;


    begin

        alter publication supabase_realtime
        add table public.game_players;

    exception
        when duplicate_object then
            null;

    end;


    begin

        alter publication supabase_realtime
        add table public.game_tricks;

    exception
        when duplicate_object then
            null;

    end;


    begin

        alter publication supabase_realtime
        add table public.trick_cards;

    exception
        when duplicate_object then
            null;

    end;


    begin

        alter publication supabase_realtime
        add table public.chat_messages;

    exception
        when duplicate_object then
            null;

    end;

end $$;


-- ================================================================
-- 39. FINAL CHECK
-- ================================================================

select
    'Hokm Online database schema installed successfully.'
    as status;
