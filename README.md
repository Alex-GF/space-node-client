# space-node-client

[![npm version](https://img.shields.io/npm/v/space-node-client.svg)](https://www.npmjs.com/package/space-node-client)

A TypeScript/Node.js client for interacting with the [SPACE pricing-driven self-adaptation solution](https://github.com/Alex-GF/space). This library allows you to connect to a SPACE server, manage contracts and evaluate features.

## Installation

```bash
npm install space-node-client
# or
yarn add space-node-client
# or
pnpm add space-node-client
```

## Features

- Manage user contracts and subscriptions
- Evaluate subscription compliance
- Manage usage levels to limit access of users to features
- TypeScript types included

## Quick Start

### 1. Connect to SPACE

> [!TIP]
> Check the [SPACE Documentation](https://pricing4saas-docs.vercel.app) for more details.

```typescript
import { connect, SpaceClient } from 'space-node-client';

const client: SpaceClient = connect({
  url: 'your_space_instance_url', // 'http://localhost:5403' (default local instance)
  apiKey: 'YOUR_API_KEY', // API key for authenticating SPACE requests
});

client.on('synchronized', () => {
  console.log('Connected and synchronized with SPACE!');
});
```

### 2. Add a Contract

```typescript
const contract = await client.contracts.addContract({
  userContact: {
    userId: 'user-123',
    username: 'testUser',
  },
  billingPeriod: {
    autoRenew: true,
    renewalDays: 30,
  },
  contractedServices: {
    tomatoMeter: '1.0.0',
  },
  subscriptionPlans: {
    tomatoMeter: 'ADVANCED',
  },
  subscriptionAddOns: {
    tomatoMeter: {
      extraTimers: 2,
    },
  },
});
```

### 3. Evaluate a Feature

```typescript
// Assuming you have a user with ID 'user-123' and
// a feature with ID 'tomatometer-pomodoroTimer'
const result = await client.features.evaluate('user-123', 'tomatometer-pomodoroTimer');
console.log(result.eval); // true/false
```

## API Overview

### SpaceClient

- `connect({ url, apiKey })` — Connects to the SPACE server and returns a `SpaceClient` instance.
- `SpaceClient.contracts.addContract(contract)` — Adds a new contract.
- `SpaceClient.contracts.updateContractSubscription(userId, subscription)` — Updates a user's subscription.
- `SpaceClient.features.evaluate(userId, featureId, expectedConsumption?)` — Evaluates a feature for a user.
- `SpaceClient.features.revertEvaluation(userId, featureId)` — Reverts the usage level update performed during a past evaluation. 

  > [!WARNING]
  > This will only take effect if the evaluation was done less that 2 mins ago, so it's expected to be used as rollback in case of an error during request processing in the host app

- `SpaceClient.features.generateUserPricingToken(userId)` — Evaluates all features that affect a user and returns a [Pricing Token](https://pricing4saas-docs.vercel.app/docs/2.0.1/api/understanding/communication).

### Events

SPACE is design to emit certain events every time a significant action occurs. Therefore, the node client provides an event listener interface to handle these events.

These are the events that can be listened:

- `synchronized` — Emitted when the client is connected and synchronized with the SPACE server.
- `pricing_created` — Emitted when a new pricing is added to SPACE.
- `pricing_actived` — Emitted when a pricing's availability has changed from archived to actived.
- `pricing_archived` — Emitted when a pricing's availability has changed from actived to archived.
- `service_disabled` — Emitted when a service is disabled in SPACE.
- `error` - Emitted when an error during the connection with SPACE.

All events, except `synchronized` and `error`, brings a data object with the following structure:

```typescript
{
  serviceName: string; // REQUIRED. The name of the service that has triggered the event.
  pricingVersion: string; // OPTIONAL. If present, indicates the version of the pricing that has triggered the event.
}
```

This is how you declare a listener:

```typescript
client.on('pricing_archived', data => {
  console.log('Pricing archived!');
  console.log('Service Name:', data.serviceName);
  console.log('Pricing Version:', data.pricingVersion);
});
```

## TypeScript Support

This library is fully typed. Types for contracts, features, pricing, and more are included and exported.

## Tech Stack

This project uses the following main tools and technologies:

<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-evenly;">

![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Axios](https://img.shields.io/badge/-Axios-5A29E4?logo=axios&logoColor=white&style=for-the-badge)
![Vitest](https://img.shields.io/badge/-Vitest-6E9F18?logo=vitest&logoColor=white&style=for-the-badge)
![Prettier](https://img.shields.io/badge/-Prettier-F7B93E?logo=prettier&logoColor=white&style=for-the-badge)
![ESLint](https://img.shields.io/badge/-ESLint-4B32C3?logo=eslint&logoColor=white&style=for-the-badge)
![pnpm](https://img.shields.io/badge/-pnpm-F69220?logo=pnpm&logoColor=white&style=for-the-badge)

</div>

## Disclaimer & License

> **LICENSE**  
> This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details

> **DISCLAIMER**
> This tool is part of ongoing research by the [ISA group](https://github.com/isa-group) in pricing-driven development and operation of SaaS. It is in a **very early stage** and is not intended for production use. The ISA group does not accept responsibility for any issues or damages that may arise from its use in real-world environments