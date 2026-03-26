module trade_routes::intel;

use sui::dynamic_field as df;
use sui::event;
use sui::clock::Clock;

const E_REPORT_NOT_FOUND: u64 = 0;
const E_NOT_REPORTER: u64 = 1;
const E_ALREADY_VERIFIED: u64 = 2;
const E_ALREADY_PARTICIPATED: u64 = 3;
const E_REPORT_NOT_PENDING: u64 = 4;
const E_REPORT_STILL_ACTIVE: u64 = 5;

const SIGNAL_ROUTE_BLOCKED: u8 = 3;

const STATUS_PENDING: u8 = 0;
const STATUS_CONFIRMED: u8 = 1;
const STATUS_DISPUTED: u8 = 2;
const STATUS_FALSE: u8 = 3;

public struct IntelBoard has key {
    id: UID,
    next_report_id: u64,
}

public struct IntelKey has copy, drop, store {
    id: u64,
}

public struct IntelReport has store {
    report_id: u64,
    reporter: address,
    order_hint: u64,
    region_fuzzy: vector<u8>,
    signal_kind: u8,
    confidence_bps: u16,
    location_commitment: vector<u8>,
    verifier: address,
    verified: bool,
    truthful: bool,
    status: u8,
    support_count: u64,
    dispute_count: u64,
    linked_order_count: u64,
    validation_score: u64,
    participants: vector<address>,
    created_at_ms: u64,
    expires_at_ms: u64,
    verified_at_ms: u64,
}

public struct IntelSubmitted has copy, drop {
    report_id: u64,
    reporter: address,
    order_hint: u64,
    signal_kind: u8,
    confidence_bps: u16,
    region_fuzzy: vector<u8>,
}

public struct IntelVerified has copy, drop {
    report_id: u64,
    verifier: address,
    truthful: bool,
}

public struct IntelStatusChanged has copy, drop {
    report_id: u64,
    status: u8,
    support_count: u64,
    dispute_count: u64,
    linked_order_count: u64,
    validation_score: u64,
}

public struct IntelPublicView has copy, drop {
    report_id: u64,
    reporter: address,
    order_hint: u64,
    region_fuzzy: vector<u8>,
    signal_kind: u8,
    confidence_bps: u16,
    status: u8,
    support_count: u64,
    dispute_count: u64,
    linked_order_count: u64,
    validation_score: u64,
    verified: bool,
    truthful: bool,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(IntelBoard {
        id: object::new(ctx),
        next_report_id: 1,
    });
}

public fun submit_report(
    board: &mut IntelBoard,
    order_hint: u64,
    region_fuzzy: vector<u8>,
    signal_kind: u8,
    confidence_bps: u16,
    location_commitment: vector<u8>,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(signal_kind <= SIGNAL_ROUTE_BLOCKED, E_REPORT_NOT_FOUND);
    let report_id = board.next_report_id;
    board.next_report_id = report_id + 1;

    let report = IntelReport {
        report_id,
        reporter: tx_context::sender(ctx),
        order_hint,
        region_fuzzy,
        signal_kind,
        confidence_bps,
        location_commitment,
        verifier: @0x0,
        verified: false,
        truthful: false,
        status: STATUS_PENDING,
        support_count: 0,
        dispute_count: 0,
        linked_order_count: 0,
        validation_score: 0,
        participants: vector::empty(),
        created_at_ms: clock.timestamp_ms(),
        expires_at_ms: clock.timestamp_ms() + 86_400_000,
        verified_at_ms: 0,
    };

    event::emit(IntelSubmitted {
        report_id,
        reporter: report.reporter,
        order_hint,
        signal_kind,
        confidence_bps,
        region_fuzzy: report.region_fuzzy,
    });

    df::add(&mut board.id, IntelKey { id: report_id }, report);
}

public fun support_report(
    board: &mut IntelBoard,
    report_id: u64,
    ctx: &TxContext,
) {
    let report = borrow_report_mut(board, report_id);
    assert!(report.status == STATUS_PENDING, E_REPORT_NOT_PENDING);
    let actor = tx_context::sender(ctx);
    assert!(!has_participated(&report.participants, actor), E_ALREADY_PARTICIPATED);
    vector::push_back(&mut report.participants, actor);
    report.support_count = report.support_count + 1;
}

public fun dispute_report(
    board: &mut IntelBoard,
    report_id: u64,
    ctx: &TxContext,
) {
    let report = borrow_report_mut(board, report_id);
    assert!(report.status == STATUS_PENDING, E_REPORT_NOT_PENDING);
    let actor = tx_context::sender(ctx);
    assert!(!has_participated(&report.participants, actor), E_ALREADY_PARTICIPATED);
    vector::push_back(&mut report.participants, actor);
    report.dispute_count = report.dispute_count + 1;
}

public fun link_order_evidence(
    board: &mut IntelBoard,
    report_id: u64,
) {
    let report = borrow_report_mut(board, report_id);
    assert!(report.status == STATUS_PENDING, E_REPORT_NOT_PENDING);
    report.linked_order_count = report.linked_order_count + 1;
}

public fun verify_report(
    board: &mut IntelBoard,
    report_id: u64,
    truthful: bool,
    clock: &Clock,
    ctx: &TxContext,
) {
    let report = borrow_report_mut(board, report_id);
    assert!(!report.verified, E_ALREADY_VERIFIED);
    report.verified = true;
    report.truthful = truthful;
    report.verifier = tx_context::sender(ctx);
    report.verified_at_ms = clock.timestamp_ms();
    report.status = if (truthful) STATUS_CONFIRMED else STATUS_FALSE;
    report.validation_score = if (truthful) 100 else 0;

    event::emit(IntelVerified {
        report_id,
        verifier: report.verifier,
        truthful,
    });
    event::emit(IntelStatusChanged {
        report_id,
        status: report.status,
        support_count: report.support_count,
        dispute_count: report.dispute_count,
        linked_order_count: report.linked_order_count,
        validation_score: report.validation_score,
    });
}

public fun resolve_report(
    board: &mut IntelBoard,
    report_id: u64,
    clock: &Clock,
) {
    let report = borrow_report_mut(board, report_id);
    assert!(report.status == STATUS_PENDING, E_REPORT_NOT_PENDING);
    assert!(clock.timestamp_ms() >= report.expires_at_ms, E_REPORT_STILL_ACTIVE);

    let support_component = report.support_count * 15;
    let evidence_component = report.linked_order_count * 20;
    let confidence_component = (report.confidence_bps as u64) / 100;
    let dispute_penalty = report.dispute_count * 18;

    let mut score = support_component + evidence_component + confidence_component;
    if (score > dispute_penalty) {
        score = score - dispute_penalty;
    } else {
        score = 0;
    };

    report.validation_score = score;
    if (score >= 80) {
        report.status = STATUS_CONFIRMED;
        report.truthful = true;
    } else if (score >= 40) {
        report.status = STATUS_DISPUTED;
        report.truthful = false;
    } else {
        report.status = STATUS_FALSE;
        report.truthful = false;
    };
    report.verified = true;
    report.verified_at_ms = clock.timestamp_ms();

    event::emit(IntelStatusChanged {
        report_id,
        status: report.status,
        support_count: report.support_count,
        dispute_count: report.dispute_count,
        linked_order_count: report.linked_order_count,
        validation_score: report.validation_score,
    });
}

public fun public_report(
    board: &IntelBoard,
    report_id: u64,
): IntelPublicView {
    let report = borrow_report(board, report_id);
    IntelPublicView {
        report_id: report.report_id,
        reporter: report.reporter,
        order_hint: report.order_hint,
        region_fuzzy: report.region_fuzzy,
        signal_kind: report.signal_kind,
        confidence_bps: report.confidence_bps,
        status: report.status,
        support_count: report.support_count,
        dispute_count: report.dispute_count,
        linked_order_count: report.linked_order_count,
        validation_score: report.validation_score,
        verified: report.verified,
        truthful: report.truthful,
    }
}

public fun redact_own_report(board: &mut IntelBoard, report_id: u64, ctx: &TxContext) {
    let report = borrow_report(board, report_id);
    assert!(report.reporter == tx_context::sender(ctx), E_NOT_REPORTER);
    let IntelReport {
        report_id: _,
        reporter: _,
        order_hint: _,
        region_fuzzy: _,
        signal_kind: _,
        confidence_bps: _,
        location_commitment: _,
        verifier: _,
        verified: _,
        truthful: _,
        status: _,
        support_count: _,
        dispute_count: _,
        linked_order_count: _,
        validation_score: _,
        participants: _,
        created_at_ms: _,
        expires_at_ms: _,
        verified_at_ms: _,
    } = df::remove<IntelKey, IntelReport>(&mut board.id, IntelKey { id: report_id });
}

fun borrow_report(board: &IntelBoard, report_id: u64): &IntelReport {
    assert!(df::exists_with_type<IntelKey, IntelReport>(&board.id, IntelKey { id: report_id }), E_REPORT_NOT_FOUND);
    df::borrow<IntelKey, IntelReport>(&board.id, IntelKey { id: report_id })
}

fun borrow_report_mut(board: &mut IntelBoard, report_id: u64): &mut IntelReport {
    assert!(df::exists_with_type<IntelKey, IntelReport>(&board.id, IntelKey { id: report_id }), E_REPORT_NOT_FOUND);
    df::borrow_mut<IntelKey, IntelReport>(&mut board.id, IntelKey { id: report_id })
}

fun has_participated(participants: &vector<address>, actor: address): bool {
    let mut i = 0;
    let len = vector::length(participants);
    while (i < len) {
        if (*vector::borrow(participants, i) == actor) {
            return true
        };
        i = i + 1;
    };
    false
}
