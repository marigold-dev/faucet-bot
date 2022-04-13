import express from "express";
import { TezosToolkit } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";
import { config } from "dotenv";

// Set's up our environment variables from the file .env
config();

const TEZOS_SECRET_KEY = process.env.TEZOS_SECRET_KEY!;
const TEZOS_RPC_URL = process.env.TEZOS_RPC_URL!;
const TEZOS_NETWORK = process.env.TEZOS_NETWORK!;
const PORT = process.env.PORT ?? 3000;
// Set the RPC endpoint. If you're building a heavily-used app
// you should run your own, but there's a list of publicly
// available ones at https://tezostaquito.io/docs/rpc_nodes#list-of-community-run-nodes
const Tezos = new TezosToolkit(TEZOS_RPC_URL);

const signer = new InMemorySigner(TEZOS_SECRET_KEY)

Tezos.setProvider({
  // InMemorySigner is not production-worthy, see Taquito docs
  // but this is just test-net funds. YOLO
  signer: signer,
});

const app = express();


// Health Check endpoint
app.get("/health", async (_, res) => {
  res.send("Service is up and running.\n");
})

// Status Address and Balance
app.get("/status", async (_, res) => {
  try {
    const address = await signer.publicKeyHash();
    const result = {
      address: address,
      balance: await Tezos.tz.getBalance(address),
    }

    const network = await Tezos.rpc.getRpcUrl();
    console.log(network);
    console.log(`Address: ${result.address} - Balance: ${result.balance}`);
    res.send(result);
  } catch (error) {
    console.error((error as any));
    res.status(500).send(JSON.stringify(error, null, 2));
  }
});

// Get Money by address endpoint
app.get("/getmoney/:address", async (req, res) => {
  const { address } = req.params;

  // Send an arbitrary amount
  const amount = 10;

  console.log(`Transfering ${amount} ꜩ to ${address}...`);

  try {
    const op = await Tezos.contract.transfer({ to: address, amount: amount });
    console.log(`Waiting for ${op.hash} to be confirmed...`);
    await op.confirmation(1);
    console.log(`Confirmed - ${op.hash}`);
    res.send(
      `Funds transferred. Check url for results: https://${TEZOS_NETWORK}.tzstats.com/${op.hash}\n`
    );
  } catch (error) {
    console.error((error as any).message);
    res.status(500).send(JSON.stringify(error, null, 2));
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running in http://127.0.0.1:${PORT}`);
});
