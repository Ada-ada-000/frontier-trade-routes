module trade_routes::intel;

use sui::dynamic_field as df;
use sui::event;
use sui::clock::Clock;

const E_REPORT_NOT_FOUND: u64 = 0;
const E_NOT_REPORTER: u64 = 1;
const E_ALREADY_VERIFIED: u64 = 2;

const SIGNAL_ROUTE_BLOCKED: u8 = 3;

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
    created_at_ms: u64,
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
        created_at_ms: clock.timestamp_ms(),
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

    event::emit(IntelVerified {
        report_id,
        verifier: report.verifier,
        truthful,
    });
}

public fun public_report(
    board: &IntelBoard,
    report_id: u64,
): (address, u64, vector<u8>, u8, u16, bool, bool) {
    let report = borrow_report(board, report_id);
    (
        report.reporter,
        report.order_hint,
        report.region_fuzzy,
        report.signal_kind,
        report.confidence_bps,
        report.verified,
        report.truthful,
    )
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
        created_at_ms: _,
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
