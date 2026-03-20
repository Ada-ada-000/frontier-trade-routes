const sellers = [
  { name: "Selene Freight", reputation: 820, stake: 180, tier: "gold" },
  { name: "Orca Relay", reputation: 610, stake: 120, tier: "silver" },
  { name: "Rust Haul", reputation: 430, stake: 75, tier: "bronze" },
];

const buyers = [
  {
    name: "Forge Arbitrage Desk",
    orderId: 101,
    mode: "urgent",
    origin: "The Forge",
    destination: "Lonetrek",
    reward: 185,
    minRep: 520,
    minStake: 70,
    insured: true,
  },
  {
    name: "Citadel Assembly Wing",
    orderId: 102,
    mode: "competitive",
    origin: "Metropolis",
    destination: "The Citadel",
    reward: 240,
    minRep: 680,
    minStake: 120,
    insured: false,
  },
];

const chainState = {
  profiles: Object.fromEntries(
    sellers.map((seller) => [
      seller.name,
      {
        score: seller.reputation,
        successCount: 0,
        failCount: 0,
        tier: seller.tier,
        activeStake: 0,
      },
    ]),
  ),
  orders: buyers.map((buyer) => ({
    ...buyer,
    status: "open",
    stage: "hidden",
    seller: null,
    quotedPrice: buyer.reward,
  })),
  insurancePool: {
    capital: 24,
    totalPremiums: 0,
    totalClaims: 0,
    totalRecoveries: 0,
  },
};

function printState(title) {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(chainState, null, 2));
}

function publishOrders() {
  chainState.orders.forEach((order) => {
    if (order.insured) {
      chainState.insurancePool.capital += 6;
      chainState.insurancePool.totalPremiums += 6;
    }
  });
  printState("Orders published");
}

function acceptUrgentOrder() {
  const order = chainState.orders.find((item) => item.orderId === 101);
  const seller = sellers.find((item) => item.name === "Selene Freight");
  order.seller = seller.name;
  order.status = "assigned";
  order.stage = "pickup_revealed";
  chainState.profiles[seller.name].activeStake += order.minStake;
  printState("Urgent order accepted and pickup revealed");
}

function placeCompetitiveBids() {
  const order = chainState.orders.find((item) => item.orderId === 102);
  order.bids = [
    { seller: "Selene Freight", quote: 218, stake: 120 },
    { seller: "Orca Relay", quote: 205, stake: 120 },
  ];
  chainState.profiles["Selene Freight"].activeStake += 120;
  chainState.profiles["Orca Relay"].activeStake += 120;
  printState("Competitive bids committed");
}

function selectBidWinner() {
  const order = chainState.orders.find((item) => item.orderId === 102);
  order.seller = "Orca Relay";
  order.quotedPrice = 205;
  order.status = "assigned";
  order.stage = "pickup_revealed";
  chainState.profiles["Selene Freight"].activeStake -= 120;
  printState("Buyer selected best reputation/price seller");
}

function confirmPickup() {
  const order = chainState.orders.find((item) => item.orderId === 101);
  order.status = "in_transit";
  order.stage = "destination_revealed";
  printState("Seller confirmed pickup and destination revealed");
}

function completeDelivery() {
  const order = chainState.orders.find((item) => item.orderId === 101);
  order.status = "completed";
  order.stage = "delivered";
  chainState.profiles["Selene Freight"].activeStake -= order.minStake;
  chainState.profiles["Selene Freight"].successCount += 1;
  chainState.profiles["Selene Freight"].score += 15;
  printState("Delivery completed, stake released, reputation updated");
}

publishOrders();
acceptUrgentOrder();
placeCompetitiveBids();
selectBidWinner();
confirmPickup();
completeDelivery();
