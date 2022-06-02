import express, { Router } from "express";
import { TezosToolkit } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";
import { config } from "dotenv";
import fs from 'fs';
import cors from "cors";

type Config = {
  secretKey: string,
  rpcUrl: string,
  network: string,
}

const knownAddresses: Set<string> = new Set<string>();

// Set's up our environment variables from the file .env
config();

const KEY_FILE = process.env.KEY_FILE || "config.json";
const PORT = process.env.PORT ?? 3000;
// Set the RPC endpoint. If you're building a heavily-used app
// you should run your own, but there's a list of publicly
// available ones at https://tezostaquito.io/docs/rpc_nodes#list-of-community-run-nodes
const createTezosToolkit = (config: Config) => {
  const Tezos = new TezosToolkit(config.rpcUrl);
  const signer = new InMemorySigner(config.secretKey)
  Tezos.setProvider({
    // InMemorySigner is not production-worthy, see Taquito docs
    // but this is just test-net funds. YOLO
    signer: signer,
  });
  return Tezos
}

const contents = fs.readFileSync(KEY_FILE, 'utf-8')
const TEZOS_CONFIG = JSON.parse(contents) as Config[];

const app = express();
app.use((req, res, next) => { next(); }, cors({ maxAge: 84600 }));


const createNetworkEndpoint = (app: express.Express, config: Config, network: string) => {
  // Status Address and Balance
  app.get(`/${network}/status`, async (_, res) => {
    try {
      const tezos = createTezosToolkit(config);
      const address = await tezos.signer.publicKeyHash();
      const result = {
        address: address,
        balance: await tezos.tz.getBalance(address),
      }
      console.log(`Address: ${result.address} - Balance: ${result.balance}`);
      res.send(result);
    } catch (error) {
      console.error((error as any));
      res.status(500).send(JSON.stringify(error, null, 2));
    }
  });

  // Get Money by address endpoint
  app.get(`/${network}/getmoney/:address`, async (req, res) => {
    const tezos = createTezosToolkit(config);
    const { address } = req.params;

    //check if user not in memory list
    if (knownAddresses.has(address)) {
      res.status(500).send("User " + address + " has already claimed 10TZ");
      return;
    }

    // Send an arbitrary amount
    const amount = 10;

    console.log(`Transfering ${amount} ꜩ to ${address}...`);

    try {
      const op = await tezos.contract.transfer({ to: address, amount: amount });
      console.log(`Waiting for ${op.hash} to be confirmed...`);
      await op.confirmation(1);
      knownAddresses.add(address);
      console.log(`Confirmed - ${op.hash}`);
      res.send(
        `Funds transferred. Check url for results: https://${config.network}.tzstats.com/${op.hash}\n`
      );
    } catch (error) {
      console.error((error as any).message);
      res.status(500).send(JSON.stringify(error, null, 2));
    }
  });
}

TEZOS_CONFIG.forEach(config => {
  createNetworkEndpoint(app, config, config.network);
  createNetworkEndpoint(app, config, config.network + "net");
})

// Health Check endpoint
app.get("/health", async (_, res) => {
  res.send("Service is up and running.\n");
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running in http://127.0.0.1:${PORT}`);
});
