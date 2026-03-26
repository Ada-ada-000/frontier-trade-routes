module trade_routes::order;

use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::dynamic_field as df;
use sui::event;
use sui::sui::SUI;
use trade_routes::insurance::{Self, InsurancePool};
use trade_routes::profile::{Self, ProfileRegistry};

const E_ORDER_NOT_FOUND: u64 = 0;
const E_ORDER_NOT_OPEN: u64 = 1;
const E_ORDER_ALREADY_ASSIGNED: u64 = 2;
const E_BUYER_ONLY: u64 = 3;
const E_SELLER_ONLY: u64 = 4;
const E_INSUFFICIENT_STAKE: u64 = 5;
const E_REPUTATION_TOO_LOW: u64 = 6;
const E_INVALID_MODE: u64 = 7;
const E_INVALID_STAGE: u64 = 8;
const E_INVALID_STATUS: u64 = 9;
const E_PRICE_ABOVE_BUDGET: u64 = 10;
const E_WINNER_NOT_FOUND: u64 = 11;
const E_DUPLICATE_BID: u64 = 12;
const E_POLICY_MISMATCH: u64 = 13;
const E_DEADLINE_NOT_REACHED: u64 = 14;

const MODE_URGENT: u8 = 0;
const MODE_COMPETITIVE: u8 = 1;

const STATUS_OPEN: u8 = 0;
const STATUS_ASSIGNED: u8 = 1;
const STATUS_IN_TRANSIT: u8 = 2;
const STATUS_COMPLETED: u8 = 3;
const STATUS_DISPUTED: u8 = 4;

const STAGE_HIDDEN: u8 = 0;
const STAGE_PICKUP_REVEALED: u8 = 1;
const STAGE_DESTINATION_REVEALED: u8 = 2;
const STAGE_DELIVERED: u8 = 3;

const COMMISSION_BRONZE_BPS: u64 = 800;
const COMMISSION_SILVER_BPS: u64 = 500;
const COMMISSION_GOLD_BPS: u64 = 300;
const COMMISSION_ELITE_BPS: u64 = 150;

public struct OrderBook has key {
    id: UID,
    next_order_id: u64,
    open_order_count: u64,
}

public struct ProtocolTreasury has key {
    id: UID,
    accrued_fees: Balance<SUI>,
    total_commissions_collected: u64,
}

public struct OrderKey has copy, drop, store {
    id: u64,
}

public struct BidCandidate has store {
    seller: address,
    quoted_price: u64,
    committed_at_ms: u64,
    stake_locked: Balance<SUI>,
}

public struct OrderPublicView has copy, drop {
    order_id: u64,
    buyer: address,
    seller: address,
    order_mode: u8,
    status: u8,
    stage: u8,
    cargo_hint: vector<u8>,
    origin_fuzzy: vector<u8>,
    destination_fuzzy: vector<u8>,
    reward_budget: u64,
    quoted_price: u64,
    min_reputation_score: u64,
    required_stake_amount: u64,
    insured: bool,
    bid_count: u64,
    created_at_ms: u64,
    deadline_ms: u64,
}

public struct Order has store {
    order_id: u64,
    buyer: address,
    seller: address,
    order_mode: u8,
    status: u8,
    stage: u8,
    cargo_hint: vector<u8>,
    origin_fuzzy: vector<u8>,
    destination_fuzzy: vector<u8>,
    origin_exact: vector<u8>,
    destination_exact: vector<u8>,
    reward_escrow: Balance<SUI>,
    reward_budget: u64,
    quoted_price: u64,
    min_reputation_score: u64,
    required_stake_amount: u64,
    insured: bool,
    premium_paid: u64,
    bids: vector<BidCandidate>,
    seller_stake_locked: Balance<SUI>,
    created_at_ms: u64,
    accepted_at_ms: u64,
    pickup_confirmed_at_ms: u64,
    completed_at_ms: u64,
    deadline_ms: u64,
}

public struct OrderCreated has copy, drop {
    order_id: u64,
    buyer: address,
    order_mode: u8,
    reward_budget: u64,
    min_reputation_score: u64,
    required_stake_amount: u64,
    insured: bool,
    origin_fuzzy: vector<u8>,
    destination_fuzzy: vector<u8>,
}

public struct BidPlaced has copy, drop {
    order_id: u64,
    seller: address,
    quoted_price: u64,
    stake_locked: u64,
}

public struct OrderAssigned has copy, drop {
    order_id: u64,
    buyer: address,
    seller: address,
    order_mode: u8,
    stage: u8,
}

public struct PickupConfirmed has copy, drop {
    order_id: u64,
    seller: address,
    stage: u8,
}

public struct DeliveryCompleted has copy, drop {
    order_id: u64,
    buyer: address,
    seller: address,
    payout_amount: u64,
}

public struct CommissionCharged has copy, drop {
    order_id: u64,
    seller: address,
    tier: u8,
    fee_bps: u64,
    fee_amount: u64,
    seller_payout: u64,
}

public struct CommissionQuote has copy, drop {
    seller: address,
    tier: u8,
    fee_bps: u64,
    fee_amount: u64,
    seller_payout: u64,
}

public struct OrderDisputed has copy, drop {
    order_id: u64,
    buyer: address,
    seller: address,
    insured: bool,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(OrderBook {
        id: object::new(ctx),
        next_order_id: 1,
        open_order_count: 0,
    });
    transfer::share_object(ProtocolTreasury {
        id: object::new(ctx),
        accrued_fees: balance::zero(),
        total_commissions_collected: 0,
    });
}

public fun create_order(
    book: &mut OrderBook,
    pool: &mut InsurancePool,
    cargo_hint: vector<u8>,
    origin_fuzzy: vector<u8>,
    destination_fuzzy: vector<u8>,
    origin_exact: vector<u8>,
    destination_exact: vector<u8>,
    order_mode: u8,
    min_reputation_score: u64,
    required_stake_amount: u64,
    deadline_ms: u64,
    insure: bool,
    reward_coin: Coin<SUI>,
    premium_coin: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(order_mode == MODE_URGENT || order_mode == MODE_COMPETITIVE, E_INVALID_MODE);
    let reward_budget = coin::value(&reward_coin);
    assert!(reward_budget > 0, E_PRICE_ABOVE_BUDGET);

    let order_id = book.next_order_id;
    book.next_order_id = order_id + 1;
    book.open_order_count = book.open_order_count + 1;

    let premium_paid = coin::value(&premium_coin);
    if (insure) {
        insurance::collect_premium(pool, order_id, tx_context::sender(ctx), premium_coin);
    } else {
        assert!(premium_paid == 0, E_POLICY_MISMATCH);
        insurance::destroy_zero_premium(premium_coin);
    };

    let order = Order {
        order_id,
        buyer: tx_context::sender(ctx),
        seller: @0x0,
        order_mode,
        status: STATUS_OPEN,
        stage: STAGE_HIDDEN,
        cargo_hint,
        origin_fuzzy,
        destination_fuzzy,
        origin_exact,
        destination_exact,
        reward_escrow: coin::into_balance(reward_coin),
        reward_budget,
        quoted_price: reward_budget,
        min_reputation_score,
        required_stake_amount,
        insured: insure,
        premium_paid,
        bids: vector::empty(),
        seller_stake_locked: balance::zero(),
        created_at_ms: clock.timestamp_ms(),
        accepted_at_ms: 0,
        pickup_confirmed_at_ms: 0,
        completed_at_ms: 0,
        deadline_ms,
    };

    event::emit(OrderCreated {
        order_id,
        buyer: order.buyer,
        order_mode,
        reward_budget,
        min_reputation_score,
        required_stake_amount,
        insured: insure,
        origin_fuzzy: order.origin_fuzzy,
        destination_fuzzy: order.destination_fuzzy,
    });

    df::add(&mut book.id, OrderKey { id: order_id }, order);
}

#[allow(lint(self_transfer))]
public fun accept_order(
    book: &mut OrderBook,
    profiles: &mut ProfileRegistry,
    order_id: u64,
    quoted_price: u64,
    stake_coin: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let seller = tx_context::sender(ctx);
    let order = borrow_order_mut(book, order_id);
    assert!(order.status == STATUS_OPEN, E_ORDER_NOT_OPEN);
    assert!(quoted_price <= order.reward_budget, E_PRICE_ABOVE_BUDGET);

    let seller_score = profile::score_of(profiles, seller);
    assert!(seller_score >= order.min_reputation_score, E_REPUTATION_TOO_LOW);
    assert!(
        profile::is_eligible_for_order(
            profiles,
            seller,
            order.min_reputation_score,
            order.required_stake_amount,
            order.reward_budget,
        ),
        E_REPUTATION_TOO_LOW
    );

    assert!(!contains_bidder(&order.bids, seller), E_DUPLICATE_BID);
    let stake_value = coin::value(&stake_coin);
    assert!(stake_value >= order.required_stake_amount, E_INSUFFICIENT_STAKE);

    let mut provided_stake = stake_coin;
    let locked = coin::split(&mut provided_stake, order.required_stake_amount, ctx);
    let refund_value = coin::value(&provided_stake);
    if (refund_value > 0) {
        transfer::public_transfer(provided_stake, seller);
    } else {
        coin::destroy_zero(provided_stake);
    };

    profile::lock_stake(profiles, seller, order.required_stake_amount);

    if (order.order_mode == MODE_URGENT) {
        assert!(order.seller == @0x0, E_ORDER_ALREADY_ASSIGNED);
        order.seller = seller;
        order.status = STATUS_ASSIGNED;
        order.stage = STAGE_PICKUP_REVEALED;
        order.quoted_price = quoted_price;
        order.accepted_at_ms = clock.timestamp_ms();
        balance::join(&mut order.seller_stake_locked, coin::into_balance(locked));
        refund_surplus_reward_if_needed(order, ctx);

        event::emit(OrderAssigned {
            order_id,
            buyer: order.buyer,
            seller,
            order_mode: order.order_mode,
            stage: order.stage,
        });
    } else {
        vector::push_back(&mut order.bids, BidCandidate {
            seller,
            quoted_price,
            committed_at_ms: clock.timestamp_ms(),
            stake_locked: coin::into_balance(locked),
        });
        event::emit(BidPlaced {
            order_id,
            seller,
            quoted_price,
            stake_locked: order.required_stake_amount,
        });
    }
}

public fun select_bid_winner(
    book: &mut OrderBook,
    profiles: &mut ProfileRegistry,
    order_id: u64,
    seller: address,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let order = borrow_order_mut(book, order_id);
    assert!(order.order_mode == MODE_COMPETITIVE, E_INVALID_MODE);
    assert!(order.status == STATUS_OPEN, E_ORDER_NOT_OPEN);
    assert!(tx_context::sender(ctx) == order.buyer, E_BUYER_ONLY);

    let mut winner_found = false;
    let mut remaining = vector::length(&order.bids);
    while (remaining > 0) {
        remaining = remaining - 1;
        let BidCandidate {
            seller: bid_seller,
            quoted_price: bid_quoted_price,
            committed_at_ms: _,
            stake_locked,
        } = vector::remove(&mut order.bids, remaining);
        if (bid_seller == seller) {
            winner_found = true;
            order.seller = bid_seller;
            order.status = STATUS_ASSIGNED;
            order.stage = STAGE_PICKUP_REVEALED;
            order.quoted_price = bid_quoted_price;
            order.accepted_at_ms = clock.timestamp_ms();
            balance::join(&mut order.seller_stake_locked, stake_locked);
        } else {
            let refund_amount = balance::value(&stake_locked);
            profile::release_stake(profiles, bid_seller, refund_amount);
            transfer::public_transfer(coin::from_balance(stake_locked, ctx), bid_seller);
        }
    };

    assert!(winner_found, E_WINNER_NOT_FOUND);
    refund_surplus_reward_if_needed(order, ctx);

    event::emit(OrderAssigned {
        order_id,
        buyer: order.buyer,
        seller,
        order_mode: order.order_mode,
        stage: order.stage,
    });
}

public fun confirm_pickup(
    book: &mut OrderBook,
    order_id: u64,
    clock: &Clock,
    ctx: &TxContext,
) {
    let order = borrow_order_mut(book, order_id);
    assert!(order.seller == tx_context::sender(ctx), E_SELLER_ONLY);
    assert!(order.status == STATUS_ASSIGNED, E_INVALID_STATUS);
    assert!(order.stage == STAGE_PICKUP_REVEALED, E_INVALID_STAGE);

    order.status = STATUS_IN_TRANSIT;
    order.stage = STAGE_DESTINATION_REVEALED;
    order.pickup_confirmed_at_ms = clock.timestamp_ms();

    event::emit(PickupConfirmed {
        order_id,
        seller: order.seller,
        stage: order.stage,
    });
}

public fun complete_delivery(
    book: &mut OrderBook,
    profiles: &mut ProfileRegistry,
    order_id: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let (buyer, seller, payout_amount, stake_amount) = {
        let order = borrow_order_mut(book, order_id);
        assert!(tx_context::sender(ctx) == order.buyer, E_BUYER_ONLY);
        assert!(order.status == STATUS_IN_TRANSIT, E_INVALID_STATUS);
        assert!(order.stage == STAGE_DESTINATION_REVEALED, E_INVALID_STAGE);

        let seller = order.seller;
        let buyer = order.buyer;
        let payout_amount = balance::value(&order.reward_escrow);
        let stake_amount = balance::value(&order.seller_stake_locked);

        order.status = STATUS_COMPLETED;
        order.stage = STAGE_DELIVERED;
        order.completed_at_ms = clock.timestamp_ms();

        profile::record_success(profiles, seller, stake_amount);
        transfer::public_transfer(coin::from_balance(balance::withdraw_all(&mut order.reward_escrow), ctx), seller);
        transfer::public_transfer(coin::from_balance(balance::withdraw_all(&mut order.seller_stake_locked), ctx), seller);

        (buyer, seller, payout_amount, stake_amount)
    };
    let _ = stake_amount;
    book.open_order_count = book.open_order_count - 1;

    event::emit(DeliveryCompleted {
        order_id,
        buyer,
        seller,
        payout_amount,
    });
}

public fun complete_delivery_with_commission(
    book: &mut OrderBook,
    profiles: &mut ProfileRegistry,
    treasury: &mut ProtocolTreasury,
    order_id: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let (buyer, seller, gross_payout, net_payout, seller_tier, fee_bps, fee_amount, stake_amount) = {
        let order = borrow_order_mut(book, order_id);
        assert!(tx_context::sender(ctx) == order.buyer, E_BUYER_ONLY);
        assert!(order.status == STATUS_IN_TRANSIT, E_INVALID_STATUS);
        assert!(order.stage == STAGE_DESTINATION_REVEALED, E_INVALID_STAGE);

        let seller = order.seller;
        let buyer = order.buyer;
        let gross_payout = balance::value(&order.reward_escrow);
        let stake_amount = balance::value(&order.seller_stake_locked);
        let seller_tier = profile::tier_of(profiles, seller);
        let fee_bps = commission_bps_for_tier(seller_tier);
        let fee_amount = gross_payout * fee_bps / 10_000;
        let net_payout = gross_payout - fee_amount;

        order.status = STATUS_COMPLETED;
        order.stage = STAGE_DELIVERED;
        order.completed_at_ms = clock.timestamp_ms();

        profile::record_success(profiles, seller, stake_amount);

        if (fee_amount > 0) {
            let fee_balance = balance::split(&mut order.reward_escrow, fee_amount);
            balance::join(&mut treasury.accrued_fees, fee_balance);
            treasury.total_commissions_collected = treasury.total_commissions_collected + fee_amount;
        };

        transfer::public_transfer(coin::from_balance(balance::withdraw_all(&mut order.reward_escrow), ctx), seller);
        transfer::public_transfer(coin::from_balance(balance::withdraw_all(&mut order.seller_stake_locked), ctx), seller);

        (buyer, seller, gross_payout, net_payout, seller_tier, fee_bps, fee_amount, stake_amount)
    };
    let _ = stake_amount;
    book.open_order_count = book.open_order_count - 1;

    event::emit(CommissionCharged {
        order_id,
        seller,
        tier: seller_tier,
        fee_bps,
        fee_amount,
        seller_payout: net_payout,
    });
    event::emit(DeliveryCompleted {
        order_id,
        buyer,
        seller,
        payout_amount: gross_payout,
    });
}

public fun seller_timeout_complete_with_commission(
    book: &mut OrderBook,
    profiles: &mut ProfileRegistry,
    treasury: &mut ProtocolTreasury,
    order_id: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let (buyer, seller, gross_payout, net_payout, seller_tier, fee_bps, fee_amount, stake_amount) = {
        let order = borrow_order_mut(book, order_id);
        assert!(tx_context::sender(ctx) == order.seller, E_SELLER_ONLY);
        assert!(order.status == STATUS_IN_TRANSIT, E_INVALID_STATUS);
        assert!(order.stage == STAGE_DESTINATION_REVEALED, E_INVALID_STAGE);
        assert!(clock.timestamp_ms() >= order.deadline_ms, E_DEADLINE_NOT_REACHED);

        let seller = order.seller;
        let buyer = order.buyer;
        let gross_payout = balance::value(&order.reward_escrow);
        let stake_amount = balance::value(&order.seller_stake_locked);
        let seller_tier = profile::tier_of(profiles, seller);
        let fee_bps = commission_bps_for_tier(seller_tier);
        let fee_amount = gross_payout * fee_bps / 10_000;
        let net_payout = gross_payout - fee_amount;

        order.status = STATUS_COMPLETED;
        order.stage = STAGE_DELIVERED;
        order.completed_at_ms = clock.timestamp_ms();

        profile::record_success(profiles, seller, stake_amount);

        if (fee_amount > 0) {
            let fee_balance = balance::split(&mut order.reward_escrow, fee_amount);
            balance::join(&mut treasury.accrued_fees, fee_balance);
            treasury.total_commissions_collected = treasury.total_commissions_collected + fee_amount;
        };

        transfer::public_transfer(coin::from_balance(balance::withdraw_all(&mut order.reward_escrow), ctx), seller);
        transfer::public_transfer(coin::from_balance(balance::withdraw_all(&mut order.seller_stake_locked), ctx), seller);

        (buyer, seller, gross_payout, net_payout, seller_tier, fee_bps, fee_amount, stake_amount)
    };
    let _ = stake_amount;
    book.open_order_count = book.open_order_count - 1;

    event::emit(CommissionCharged {
        order_id,
        seller,
        tier: seller_tier,
        fee_bps,
        fee_amount,
        seller_payout: net_payout,
    });
    event::emit(DeliveryCompleted {
        order_id,
        buyer,
        seller,
        payout_amount: gross_payout,
    });
}

public fun dispute(
    book: &mut OrderBook,
    profiles: &mut ProfileRegistry,
    pool: &mut InsurancePool,
    order_id: u64,
    ctx: &mut TxContext,
) {
    let (buyer, seller, insured) = {
        let order = borrow_order_mut(book, order_id);
        assert!(tx_context::sender(ctx) == order.buyer, E_BUYER_ONLY);
        assert!(order.status == STATUS_ASSIGNED || order.status == STATUS_IN_TRANSIT, E_INVALID_STATUS);

        let buyer = order.buyer;
        let seller = order.seller;
        let insured = order.insured;
        let slashed_amount = balance::value(&order.seller_stake_locked);

        order.status = STATUS_DISPUTED;

        profile::record_failure(profiles, seller, slashed_amount, true);
        transfer::public_transfer(coin::from_balance(balance::withdraw_all(&mut order.reward_escrow), ctx), buyer);

        if (insured) {
            insurance::absorb_recovery(pool, order_id, seller, balance::withdraw_all(&mut order.seller_stake_locked));
        } else {
            transfer::public_transfer(coin::from_balance(balance::withdraw_all(&mut order.seller_stake_locked), ctx), buyer);
        };

        (buyer, seller, insured)
    };
    book.open_order_count = book.open_order_count - 1;

    event::emit(OrderDisputed {
        order_id,
        buyer,
        seller,
        insured,
    });
}

public fun public_order_view(book: &OrderBook, order_id: u64): OrderPublicView {
    let order = borrow_order(book, order_id);
    OrderPublicView {
        order_id: order.order_id,
        buyer: order.buyer,
        seller: order.seller,
        order_mode: order.order_mode,
        status: order.status,
        stage: order.stage,
        cargo_hint: order.cargo_hint,
        origin_fuzzy: order.origin_fuzzy,
        destination_fuzzy: order.destination_fuzzy,
        reward_budget: order.reward_budget,
        quoted_price: order.quoted_price,
        min_reputation_score: order.min_reputation_score,
        required_stake_amount: order.required_stake_amount,
        insured: order.insured,
        bid_count: vector::length(&order.bids),
        created_at_ms: order.created_at_ms,
        deadline_ms: order.deadline_ms,
    }
}

public fun quote_commission(
    profiles: &mut ProfileRegistry,
    seller: address,
    gross_amount: u64,
): CommissionQuote {
    let tier = profile::tier_of(profiles, seller);
    let fee_bps = commission_bps_for_tier(tier);
    let fee_amount = gross_amount * fee_bps / 10_000;
    CommissionQuote {
        seller,
        tier,
        fee_bps,
        fee_amount,
        seller_payout: gross_amount - fee_amount,
    }
}

public fun treasury_total_commissions(treasury: &ProtocolTreasury): u64 {
    treasury.total_commissions_collected
}

public fun view_pickup_route(book: &OrderBook, order_id: u64, ctx: &TxContext): vector<u8> {
    let order = borrow_order(book, order_id);
    assert!(tx_context::sender(ctx) == order.seller, E_SELLER_ONLY);
    assert!(order.stage >= STAGE_PICKUP_REVEALED, E_INVALID_STAGE);
    order.origin_exact
}

public fun view_destination_route(book: &OrderBook, order_id: u64, ctx: &TxContext): vector<u8> {
    let order = borrow_order(book, order_id);
    assert!(tx_context::sender(ctx) == order.seller, E_SELLER_ONLY);
    assert!(order.stage >= STAGE_DESTINATION_REVEALED, E_INVALID_STAGE);
    order.destination_exact
}

fun borrow_order(book: &OrderBook, order_id: u64): &Order {
    assert!(df::exists_with_type<OrderKey, Order>(&book.id, OrderKey { id: order_id }), E_ORDER_NOT_FOUND);
    df::borrow<OrderKey, Order>(&book.id, OrderKey { id: order_id })
}

fun borrow_order_mut(book: &mut OrderBook, order_id: u64): &mut Order {
    assert!(df::exists_with_type<OrderKey, Order>(&book.id, OrderKey { id: order_id }), E_ORDER_NOT_FOUND);
    df::borrow_mut<OrderKey, Order>(&mut book.id, OrderKey { id: order_id })
}

fun refund_surplus_reward_if_needed(order: &mut Order, ctx: &mut TxContext) {
    if (order.quoted_price < order.reward_budget) {
        let refund_amount = order.reward_budget - order.quoted_price;
        order.reward_budget = order.quoted_price;
        transfer::public_transfer(
            coin::from_balance(balance::split(&mut order.reward_escrow, refund_amount), ctx),
            order.buyer,
        );
    };
}

fun commission_bps_for_tier(tier: u8): u64 {
    if (tier >= 3) {
        COMMISSION_ELITE_BPS
    } else if (tier == 2) {
        COMMISSION_GOLD_BPS
    } else if (tier == 1) {
        COMMISSION_SILVER_BPS
    } else {
        COMMISSION_BRONZE_BPS
    }
}

fun contains_bidder(bids: &vector<BidCandidate>, seller: address): bool {
    let mut i = 0;
    let len = vector::length(bids);
    while (i < len) {
        if (vector::borrow(bids, i).seller == seller) {
            return true
        };
        i = i + 1;
    };
    false
}
