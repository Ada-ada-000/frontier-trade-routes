import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

const ROOT = "/Users/dby/Documents/ADA/project_1/EVE frontier✖️Sui/链上/new/map";
const ENV_PATH = path.join(ROOT, "apps/web/.env.local");
const KEYSTORE_PATH = path.join(os.homedir(), ".sui/sui_config/sui.keystore");
const CLOCK_OBJECT_ID = "0x6";

const client = new SuiClient({ url: getFullnodeUrl("testnet") });
const args = new Set(process.argv.slice(2));
const initialOnly = args.has("--initial") || args.has("--reset-initial");

const ORDER_TEMPLATES = [
  {
    cargo: "Cryo fuel capsules",
    originFuzzy: "ULV-77D",
    destinationFuzzy: "O3V-49D",
    originExact: "ULV-77D :: Gate 3",
    destinationExact: "O3V-49D :: Bay 7",
    mode: 0,
    minRep: 420n,
    requiredStakeMist: 30_000_000n,
    rewardMist: 60_000_000n,
    premiumMist: 0n,
    insure: false,
  },
  {
    cargo: "Shield emitters",
    originFuzzy: "EH1-FQC",
    destinationFuzzy: "U1S-HBD",
    originExact: "EH1-FQC :: Relay 2",
    destinationExact: "U1S-HBD :: Hub 4",
    mode: 0,
    minRep: 480n,
    requiredStakeMist: 52_000_000n,
    rewardMist: 120_000_000n,
    premiumMist: 4_000_000n,
    insure: true,
  },
  {
    cargo: "Gate relay cores",
    originFuzzy: "UR7-5FN",
    destinationFuzzy: "O3H-1FN",
    originExact: "UR7-5FN :: Frontier Node",
    destinationExact: "O3H-1FN :: Secure Dock",
    mode: 0,
    minRep: 460n,
    requiredStakeMist: 45_000_000n,
    rewardMist: 90_000_000n,
    premiumMist: 3_000_000n,
    insure: true,
  },
];

function readEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return Object.fromEntries(
    raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1).trim()];
      }),
  );
}

function readKeypair(index) {
  const entries = JSON.parse(fs.readFileSync(KEYSTORE_PATH, "utf8"));
  const raw = Buffer.from(entries[index], "base64");
  return Ed25519Keypair.fromSecretKey(raw.subarray(1));
}

function bytes(value) {
  return Array.from(Buffer.from(value, "utf8"));
}

function asRecord(value) {
  return value && typeof value === "object" ? value : null;
}

function unwrapFields(value) {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  return "fields" in record ? asRecord(record.fields) : record;
}

function asMoveFields(object) {
  const content = object?.data?.content;
  if (!content || content.dataType !== "moveObject") {
    return null;
  }
  return asRecord(content.fields);
}

function stringValue(value) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  return "";
}

function numberValue(value) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "string") {
    return Number(value);
  }
  return 0;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryRpc(label, run, attempts = 5) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) {
        break;
      }
      await wait(300 * (attempt + 1));
    }
  }

  throw lastError;
}

async function signAndWait(label, signer, tx) {
  tx.setSender(signer.toSuiAddress());
  tx.setGasBudget(50_000_000);

  const result = await retryRpc(label, () =>
    client.signAndExecuteTransaction({
      signer,
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    }),
  );

  await retryRpc(`${label}:wait`, () => client.waitForTransaction({ digest: result.digest }));
  console.log(`${label}: ${result.digest}`);
  return result;
}

async function getDynamicFieldObjectIds(parentId) {
  const ids = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = await retryRpc(`dynamic-fields:${parentId}`, () =>
      client.getDynamicFields({
        parentId,
        cursor,
        limit: 50,
      }),
    );
    ids.push(...page.data.map((field) => field.objectId));
    cursor = page.nextCursor;
    hasNextPage = page.hasNextPage;
  }

  return ids;
}

async function loadDynamicFieldObjects(parentId) {
  const ids = await getDynamicFieldObjectIds(parentId);
  if (ids.length === 0) {
    return [];
  }

  const objects = [];
  for (let index = 0; index < ids.length; index += 50) {
    const batch = ids.slice(index, index + 50);
    const response = await retryRpc(`multi-objects:${parentId}:${index}`, () =>
      client.multiGetObjects({
        ids: batch,
        options: { showContent: true },
      }),
    );
    objects.push(...response);
  }

  return objects;
}

function parseOrder(object) {
  const fields = asMoveFields(object);
  const value = unwrapFields(fields?.value);
  if (!value) {
    return null;
  }

  return {
    orderId: BigInt(stringValue(value.order_id)),
    seller: stringValue(value.seller),
    status: numberValue(value.status),
    stage: numberValue(value.stage),
    rewardBudget: BigInt(stringValue(value.reward_budget) || "0"),
    requiredStakeAmount: BigInt(stringValue(value.required_stake_amount) || "0"),
  };
}

function parseIntel(object) {
  const fields = asMoveFields(object);
  const value = unwrapFields(fields?.value);
  if (!value) {
    return null;
  }

  return {
    reportId: BigInt(stringValue(value.report_id) || "0"),
    status: numberValue(value.status),
  };
}

function buildRegisterProfileTx(config) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::profile::register_profile`,
    arguments: [tx.object(config.profileRegistryId)],
  });
  return tx;
}

function buildCreateOrderTx(config, order, index) {
  const tx = new Transaction();
  const deadlineMs = BigInt(Date.now() + (48 + index) * 60 * 60 * 1000);
  const [rewardCoin, premiumCoin] = tx.splitCoins(tx.gas, [order.rewardMist, order.premiumMist]);

  tx.moveCall({
    target: `${config.packageId}::order::create_order`,
    arguments: [
      tx.object(config.orderBookId),
      tx.object(config.insurancePoolId),
      tx.pure.vector("u8", bytes(order.cargo)),
      tx.pure.vector("u8", bytes(order.originFuzzy)),
      tx.pure.vector("u8", bytes(order.destinationFuzzy)),
      tx.pure.vector("u8", bytes(order.originExact)),
      tx.pure.vector("u8", bytes(order.destinationExact)),
      tx.pure.u8(order.mode),
      tx.pure.u64(order.minRep),
      tx.pure.u64(order.requiredStakeMist),
      tx.pure.u64(deadlineMs),
      tx.pure.bool(order.insure),
      rewardCoin,
      premiumCoin,
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

function buildAcceptOrderTx(config, orderId, quotedPriceMist, requiredStakeAmount) {
  const tx = new Transaction();
  const [stakeCoin] = tx.splitCoins(tx.gas, [requiredStakeAmount]);
  tx.moveCall({
    target: `${config.packageId}::order::accept_order`,
    arguments: [
      tx.object(config.orderBookId),
      tx.object(config.profileRegistryId),
      tx.pure.u64(orderId),
      tx.pure.u64(quotedPriceMist),
      stakeCoin,
      tx.object(CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

function buildConfirmPickupTx(config, orderId) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::order::confirm_pickup`,
    arguments: [tx.object(config.orderBookId), tx.pure.u64(orderId), tx.object(CLOCK_OBJECT_ID)],
  });
  return tx;
}

function buildSubmitIntelTx(config, report) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::intel::submit_report`,
    arguments: [
      tx.object(config.intelBoardId),
      tx.pure.u64(report.orderHint),
      tx.pure.vector("u8", bytes(report.region)),
      tx.pure.u8(report.signalKind),
      tx.pure.u16(report.confidenceBps),
      tx.pure.vector("u8", bytes(report.commitment)),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

function buildIntelActionTx(config, fnName, reportId, extraArgs = []) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::intel::${fnName}`,
    arguments: [tx.object(config.intelBoardId), tx.pure.u64(reportId), ...extraArgs],
  });
  return tx;
}

function buildVerifyIntelTx(config, reportId, truthful) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::intel::verify_report`,
    arguments: [
      tx.object(config.intelBoardId),
      tx.pure.u64(reportId),
      tx.pure.bool(truthful),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

async function loadOrders(config) {
  const objects = await loadDynamicFieldObjects(config.orderBookId);
  return objects.map(parseOrder).filter(Boolean).sort((left, right) => Number(left.orderId - right.orderId));
}

async function loadIntelReports(config) {
  const objects = await loadDynamicFieldObjects(config.intelBoardId);
  return objects.map(parseIntel).filter(Boolean).sort((left, right) => Number(left.reportId - right.reportId));
}

async function loadInsurancePool(config) {
  return retryRpc(`insurance-pool:${config.insurancePoolId}`, () =>
    client.getObject({
      id: config.insurancePoolId,
      options: { showContent: true },
    }),
  );
}

async function main() {
  const env = readEnvFile(ENV_PATH);
  const config = {
    packageId: env.NEXT_PUBLIC_SUI_PACKAGE_ID,
    orderBookId: env.NEXT_PUBLIC_ORDER_BOOK_ID,
    profileRegistryId: env.NEXT_PUBLIC_PROFILE_REGISTRY_ID,
    insurancePoolId: env.NEXT_PUBLIC_INSURANCE_POOL_ID,
    treasuryId: env.NEXT_PUBLIC_PROTOCOL_TREASURY_ID,
    intelBoardId: env.NEXT_PUBLIC_INTEL_BOARD_ID,
  };

  const buyer = readKeypair(0);
  const seller = readKeypair(1);

  console.log("Seeding Frontier Trade Routes on Sui testnet");
  console.log(`mode: ${initialOnly ? "initial-only" : "full-demo"}`);
  console.log(`buyer:  ${buyer.toSuiAddress()}`);
  console.log(`seller: ${seller.toSuiAddress()}`);
  console.log(`package: ${config.packageId}`);

  await signAndWait("register-profile:buyer", buyer, buildRegisterProfileTx(config));
  await signAndWait("register-profile:seller", seller, buildRegisterProfileTx(config));

  let orders = await loadOrders(config);
  const activeOrders = orders.filter((order) => order.status === 0 || order.status === 1 || order.status === 2);

  if (activeOrders.length < 3) {
    const missingCount = 3 - activeOrders.length;
    for (let index = 0; index < missingCount; index += 1) {
      const template = ORDER_TEMPLATES[index % ORDER_TEMPLATES.length];
      await signAndWait(
        `create-order:${template.cargo}`,
        buyer,
        buildCreateOrderTx(config, template, index),
      );
    }
    orders = await loadOrders(config);
  } else {
    console.log(`Active orders already seeded (${activeOrders.length}), skipping create_order.`);
  }

  if (!initialOnly) {
    const hasAssignedOrTransit = orders.some(
      (order) =>
        (order.status === 1 || order.status === 2) &&
        order.seller.toLowerCase() === seller.toSuiAddress().toLowerCase(),
    );

    if (!hasAssignedOrTransit) {
      const openCandidate = orders.find(
        (order) =>
          order.status === 0 &&
          (order.seller === "0x0" || order.seller === "") &&
          order.requiredStakeAmount <= 45_000_000n,
      );

      if (openCandidate) {
        const quotedPriceMist = openCandidate.rewardBudget > 5_000_000n ? openCandidate.rewardBudget - 5_000_000n : openCandidate.rewardBudget;
        await signAndWait(
          `accept-order:${openCandidate.orderId}`,
          seller,
          buildAcceptOrderTx(
            config,
            openCandidate.orderId,
            quotedPriceMist,
            openCandidate.requiredStakeAmount,
          ),
        );
        orders = await loadOrders(config);
      }
    }

    const pickupCandidate = orders.find(
      (order) =>
        order.status === 1 &&
        order.stage === 1 &&
        order.seller.toLowerCase() === seller.toSuiAddress().toLowerCase(),
    );
    if (pickupCandidate) {
      await signAndWait(
        `confirm-pickup:${pickupCandidate.orderId}`,
        seller,
        buildConfirmPickupTx(config, pickupCandidate.orderId),
      );
      orders = await loadOrders(config);
    }
  } else {
    console.log("Initial-only mode: skip accept/pickup demo actions.");
  }

  let intelReports = await loadIntelReports(config);
  if (!initialOnly) {
    if (intelReports.length === 0) {
      const firstOrderId = orders[0]?.orderId ?? 1n;
      const submitResult = await signAndWait(
        "submit-intel",
        buyer,
        buildSubmitIntelTx(config, {
          orderHint: firstOrderId,
          region: "The Forge",
          signalKind: 1,
          confidenceBps: 8_400,
          commitment: "forge-demand-window-1",
        }),
      );

      const intelSubmittedEvent = submitResult.events?.find((event) => event.type.endsWith("::intel::IntelSubmitted"));
      const reportId = BigInt(stringValue(intelSubmittedEvent?.parsedJson?.report_id) || "0");
      if (reportId > 0n) {
        await signAndWait("support-intel", seller, buildIntelActionTx(config, "support_report", reportId));
        await signAndWait("link-intel-evidence", buyer, buildIntelActionTx(config, "link_order_evidence", reportId));
        await signAndWait("verify-intel", buyer, buildVerifyIntelTx(config, reportId, true));
      }
      intelReports = await loadIntelReports(config);
    } else {
      console.log(`Intel reports already seeded (${intelReports.length}), skipping submit_report.`);
    }
  } else {
    console.log("Initial-only mode: skip intel demo actions.");
  }

  const insurancePoolObject = await loadInsurancePool(config);
  const insuranceFields = asMoveFields(insurancePoolObject) ?? {};

  console.log("");
  console.log("Seed summary");
  console.log(JSON.stringify(
    {
      source: "sui-testnet",
      orderCount: orders.length,
      activeOrders: orders.filter((order) => order.status === 0 || order.status === 1 || order.status === 2).length,
      pickupRevealed: orders.filter((order) => order.status === 1 && order.stage === 1).length,
      destinationRevealed: orders.filter((order) => order.status === 2 && order.stage === 2).length,
      intelReports: intelReports.length,
      confirmedIntel: intelReports.filter((report) => report.status === 1).length,
      insurancePool: {
        capitalMist: stringValue(unwrapFields(insuranceFields.capital)?.value ?? insuranceFields.capital ?? "0"),
        totalPremiumsCollectedMist: stringValue(insuranceFields.total_premiums_collected ?? "0"),
        totalClaimsPaidMist: stringValue(insuranceFields.total_claims_paid ?? "0"),
        totalRecoveriesMist: stringValue(insuranceFields.total_recoveries ?? "0"),
      },
    },
    null,
    2,
  ));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
