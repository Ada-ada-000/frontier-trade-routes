module trade_routes::profile;

use sui::dynamic_field as df;

const E_NOT_OWNER: u64 = 0;
const E_PROFILE_NOT_FOUND: u64 = 1;
const E_INSUFFICIENT_LOCKED_STAKE: u64 = 2;

const TIER_BRONZE: u8 = 0;
const TIER_SILVER: u8 = 1;
const TIER_GOLD: u8 = 2;
const TIER_ELITE: u8 = 3;

const BRONZE_MIN_SCORE: u64 = 0;
const SILVER_MIN_SCORE: u64 = 550;
const GOLD_MIN_SCORE: u64 = 700;
const ELITE_MIN_SCORE: u64 = 850;

const BRONZE_MIN_STAKE: u64 = 20_000_000_000;
const SILVER_MIN_STAKE: u64 = 60_000_000_000;
const GOLD_MIN_STAKE: u64 = 120_000_000_000;
const ELITE_MIN_STAKE: u64 = 250_000_000_000;

const BRONZE_MAX_ORDER_VALUE: u64 = 150_000_000_000;
const SILVER_MAX_ORDER_VALUE: u64 = 350_000_000_000;
const GOLD_MAX_ORDER_VALUE: u64 = 800_000_000_000;
const ELITE_MAX_ORDER_VALUE: u64 = 2_000_000_000_000;

public struct ProfileRegistry has key {
    id: UID,
    profile_count: u64,
}

public struct ReputationProfile has store {
    owner: address,
    score: u64,
    success_count: u64,
    fail_count: u64,
    consecutive_failures: u64,
    tier: u8,
    active_stake: u64,
    total_slashed: u64,
}

public struct ProfileView has copy, drop {
    owner: address,
    score: u64,
    success_count: u64,
    fail_count: u64,
    tier: u8,
    active_stake: u64,
    total_slashed: u64,
}

public struct TierPolicy has copy, drop {
    tier: u8,
    min_score: u64,
    min_stake: u64,
    max_order_value: u64,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(ProfileRegistry {
        id: object::new(ctx),
        profile_count: 0,
    });
}

public fun register_profile(registry: &mut ProfileRegistry, ctx: &TxContext) {
    let owner = tx_context::sender(ctx);
    if (!df::exists_with_type<address, ReputationProfile>(&registry.id, owner)) {
        df::add(&mut registry.id, owner, default_profile(owner));
        registry.profile_count = registry.profile_count + 1;
    };
}

public fun profile_view(registry: &ProfileRegistry, owner: address): ProfileView {
    assert!(df::exists_with_type<address, ReputationProfile>(&registry.id, owner), E_PROFILE_NOT_FOUND);
    let profile = df::borrow<address, ReputationProfile>(&registry.id, owner);
    ProfileView {
        owner: profile.owner,
        score: profile.score,
        success_count: profile.success_count,
        fail_count: profile.fail_count,
        tier: profile.tier,
        active_stake: profile.active_stake,
        total_slashed: profile.total_slashed,
    }
}

public fun has_profile(registry: &ProfileRegistry, owner: address): bool {
    df::exists_with_type<address, ReputationProfile>(&registry.id, owner)
}

public fun tier_label(tier: u8): u8 {
    tier
}

public fun tier_policy(tier: u8): TierPolicy {
    if (tier == TIER_ELITE) {
        TierPolicy {
            tier,
            min_score: ELITE_MIN_SCORE,
            min_stake: ELITE_MIN_STAKE,
            max_order_value: ELITE_MAX_ORDER_VALUE,
        }
    } else if (tier == TIER_GOLD) {
        TierPolicy {
            tier,
            min_score: GOLD_MIN_SCORE,
            min_stake: GOLD_MIN_STAKE,
            max_order_value: GOLD_MAX_ORDER_VALUE,
        }
    } else if (tier == TIER_SILVER) {
        TierPolicy {
            tier,
            min_score: SILVER_MIN_SCORE,
            min_stake: SILVER_MIN_STAKE,
            max_order_value: SILVER_MAX_ORDER_VALUE,
        }
    } else {
        TierPolicy {
            tier: TIER_BRONZE,
            min_score: BRONZE_MIN_SCORE,
            min_stake: BRONZE_MIN_STAKE,
            max_order_value: BRONZE_MAX_ORDER_VALUE,
        }
    }
}

public fun tier_for_score(score: u64, consecutive_failures: u64): u8 {
    derive_tier(score, consecutive_failures)
}

public(package) fun ensure_profile(registry: &mut ProfileRegistry, owner: address) {
    if (!df::exists_with_type<address, ReputationProfile>(&registry.id, owner)) {
        df::add(&mut registry.id, owner, default_profile(owner));
        registry.profile_count = registry.profile_count + 1;
    };
}

public(package) fun score_of(registry: &mut ProfileRegistry, owner: address): u64 {
    ensure_profile(registry, owner);
    df::borrow<address, ReputationProfile>(&registry.id, owner).score
}

public(package) fun tier_of(registry: &mut ProfileRegistry, owner: address): u8 {
    ensure_profile(registry, owner);
    df::borrow<address, ReputationProfile>(&registry.id, owner).tier
}

public(package) fun active_stake_of(registry: &mut ProfileRegistry, owner: address): u64 {
    ensure_profile(registry, owner);
    df::borrow<address, ReputationProfile>(&registry.id, owner).active_stake
}

public(package) fun is_eligible_for_order(
    registry: &mut ProfileRegistry,
    owner: address,
    min_reputation_score: u64,
    required_stake: u64,
    reward_budget: u64,
): bool {
    ensure_profile(registry, owner);
    let profile = df::borrow<address, ReputationProfile>(&registry.id, owner);
    if (profile.score < min_reputation_score) {
        return false
    };

    let policy = tier_policy(profile.tier);
    // A seller should remain eligible for lower-stake orders; the tier policy is
    // enforced against the stake they will have locked after accepting.
    if (profile.active_stake + required_stake < policy.min_stake) {
        return false
    };

    if (reward_budget > policy.max_order_value) {
        return false
    };

    true
}

public(package) fun lock_stake(registry: &mut ProfileRegistry, owner: address, amount: u64) {
    ensure_profile(registry, owner);
    let profile = df::borrow_mut<address, ReputationProfile>(&mut registry.id, owner);
    profile.active_stake = profile.active_stake + amount;
}

public(package) fun release_stake(registry: &mut ProfileRegistry, owner: address, amount: u64) {
    ensure_profile(registry, owner);
    let profile = df::borrow_mut<address, ReputationProfile>(&mut registry.id, owner);
    assert!(profile.active_stake >= amount, E_INSUFFICIENT_LOCKED_STAKE);
    profile.active_stake = profile.active_stake - amount;
}

public(package) fun record_success(registry: &mut ProfileRegistry, owner: address, amount_unlocked: u64) {
    ensure_profile(registry, owner);
    let profile = df::borrow_mut<address, ReputationProfile>(&mut registry.id, owner);
    assert!(profile.active_stake >= amount_unlocked, E_INSUFFICIENT_LOCKED_STAKE);
    profile.active_stake = profile.active_stake - amount_unlocked;
    profile.success_count = profile.success_count + 1;
    profile.consecutive_failures = 0;
    profile.score = profile.score + 15;
    profile.tier = derive_tier(profile.score, profile.consecutive_failures);
}

public(package) fun record_failure(
    registry: &mut ProfileRegistry,
    owner: address,
    amount_slashed: u64,
    severe_penalty: bool,
) {
    ensure_profile(registry, owner);
    let profile = df::borrow_mut<address, ReputationProfile>(&mut registry.id, owner);
    assert!(profile.active_stake >= amount_slashed, E_INSUFFICIENT_LOCKED_STAKE);
    profile.active_stake = profile.active_stake - amount_slashed;
    profile.fail_count = profile.fail_count + 1;
    profile.consecutive_failures = profile.consecutive_failures + 1;
    profile.total_slashed = profile.total_slashed + amount_slashed;

    let penalty = if (severe_penalty) 120 else 60;
    if (profile.score > penalty) {
        profile.score = profile.score - penalty;
    } else {
        profile.score = 0;
    };
    profile.tier = derive_tier(profile.score, profile.consecutive_failures);
}

public fun unregister_empty_profile(registry: &mut ProfileRegistry, ctx: &TxContext) {
    let owner = tx_context::sender(ctx);
    assert!(df::exists_with_type<address, ReputationProfile>(&registry.id, owner), E_PROFILE_NOT_FOUND);
    let ReputationProfile {
        owner: profile_owner,
        score: _,
        success_count: _,
        fail_count: _,
        consecutive_failures: _,
        tier: _,
        active_stake,
        total_slashed: _,
    } = df::remove<address, ReputationProfile>(&mut registry.id, owner);
    assert!(profile_owner == owner, E_NOT_OWNER);
    assert!(active_stake == 0, E_INSUFFICIENT_LOCKED_STAKE);
    registry.profile_count = registry.profile_count - 1;
}

fun default_profile(owner: address): ReputationProfile {
    ReputationProfile {
        owner,
        score: 500,
        success_count: 0,
        fail_count: 0,
        consecutive_failures: 0,
        tier: TIER_BRONZE,
        active_stake: 0,
        total_slashed: 0,
    }
}

fun derive_tier(score: u64, consecutive_failures: u64): u8 {
    if (consecutive_failures >= 3 || score < SILVER_MIN_SCORE) {
        TIER_BRONZE
    } else if (consecutive_failures >= 2 || score < GOLD_MIN_SCORE) {
        TIER_SILVER
    } else if (consecutive_failures >= 1 || score < ELITE_MIN_SCORE) {
        TIER_GOLD
    } else {
        TIER_ELITE
    }
}
