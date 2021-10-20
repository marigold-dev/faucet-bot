import express from "express";
import { TezosToolkit } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";
import { config } from "dotenv";

// Set's up our environment variables from the file .env
config();

const TEZOS_SECRET_KEY = process.env.TEZOS_SECRET_KEY!;
const TEZOS_RPC_URL = process.env.TEZOS_RPC_URL!;
const PORT = process.env.PORT ?? 3000;
// Set the RPC endpoint. If you're building a heavily-used app
// you should run your own, but there's a list of publicly
// available ones at https://tezostaquito.io/docs/rpc_nodes#list-of-community-run-nodes
const Tezos = new TezosToolkit(TEZOS_RPC_URL);

Tezos.setProvider({
  // InMemorySigner is not production-worthy, see Taquito docs
  // but this is just test-net funds. YOLO
  signer: new InMemorySigner(TEZOS_SECRET_KEY),
});

const app = express();

app.get("/getmoney/:address", async (req, res) => {
  const { address } = req.params;

  // Send an arbitrary amount
  const amount = 2;

  console.log(`Transfering ${amount} ꜩ to ${address}...`);

  try {
    const op = await Tezos.contract.transfer({ to: address, amount: amount });
    console.log(`Waiting for ${op.hash} to be confirmed...`);
    await op.confirmation(1);
    console.log(`Confirmed - ${op.hash}`);
    res.send(
      `Funds transferred. Check url for results: https://granada.tzstats.com/${op.hash}\n`
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
