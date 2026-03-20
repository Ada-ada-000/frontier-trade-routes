module trade_routes::insurance;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;

const E_POLICY_NOT_ACTIVE: u64 = 0;
const E_INSUFFICIENT_POOL_LIQUIDITY: u64 = 1;

public struct InsurancePool has key {
    id: UID,
    capital: Balance<SUI>,
    total_premiums_collected: u64,
    total_claims_paid: u64,
    total_recoveries: u64,
}

public struct PolicyPurchased has copy, drop {
    order_id: u64,
    buyer: address,
    premium_paid: u64,
}

public struct ClaimPaid has copy, drop {
    order_id: u64,
    buyer: address,
    payout_amount: u64,
}

public struct BountyTriggered has copy, drop {
    order_id: u64,
    offending_seller: address,
    recovered_stake: u64,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(InsurancePool {
        id: object::new(ctx),
        capital: balance::zero(),
        total_premiums_collected: 0,
        total_claims_paid: 0,
        total_recoveries: 0,
    });
}

public fun capital(pool: &InsurancePool): u64 {
    balance::value(&pool.capital)
}

public(package) fun collect_premium(
    pool: &mut InsurancePool,
    order_id: u64,
    buyer: address,
    premium_coin: Coin<SUI>,
) {
    let premium_value = coin::value(&premium_coin);
    let premium_balance = coin::into_balance(premium_coin);
    balance::join(&mut pool.capital, premium_balance);
    pool.total_premiums_collected = pool.total_premiums_collected + premium_value;
    event::emit(PolicyPurchased {
        order_id,
        buyer,
        premium_paid: premium_value,
    });
}

public(package) fun destroy_zero_premium(premium_coin: Coin<SUI>) {
    coin::destroy_zero(premium_coin);
}

public(package) fun payout_claim(
    pool: &mut InsurancePool,
    order_id: u64,
    buyer: address,
    payout_amount: u64,
    ctx: &mut TxContext,
) {
    assert!(payout_amount > 0, E_POLICY_NOT_ACTIVE);
    assert!(balance::value(&pool.capital) >= payout_amount, E_INSUFFICIENT_POOL_LIQUIDITY);
    let payout = balance::split(&mut pool.capital, payout_amount);
    pool.total_claims_paid = pool.total_claims_paid + payout_amount;
    transfer::public_transfer(coin::from_balance(payout, ctx), buyer);
    event::emit(ClaimPaid {
        order_id,
        buyer,
        payout_amount,
    });
}

public(package) fun absorb_recovery(
    pool: &mut InsurancePool,
    order_id: u64,
    offending_seller: address,
    recovered_stake: Balance<SUI>,
) {
    let recovered_value = balance::value(&recovered_stake);
    balance::join(&mut pool.capital, recovered_stake);
    pool.total_recoveries = pool.total_recoveries + recovered_value;
    event::emit(BountyTriggered {
        order_id,
        offending_seller,
        recovered_stake: recovered_value,
    });
}
