import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

const app = express();
app.use(cors());
dotenv.config();

const stripe = new Stripe(process.env.SECRET_KEY);

const port = 3001;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        process.env.END_POINT_SECRET
      );
      //   console.log("type", event);
    } catch (err) {
      //   console.log("type2", err);
      response.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("PaymentIntent was successful!");
        break;
      case "payment_method.attached":
        const paymentMethod = event.data.object;
        console.log("PaymentMethod was attached to a Customer!");
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
  }
);

app.use(express.json());

app.post("/stripe", async (request, response) => {
  const { amount } = request.body;
  // Should calculate server side

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd"
    });

    response.status(200).send({ secret: paymentIntent.client_secret });
  } catch (error) {
    console.log("error", error);
    response.status(500).send("error" + error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
