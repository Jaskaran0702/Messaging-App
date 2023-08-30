import express from "express";
import mongoose from "mongoose";
import Cors from "cors";
import Pusher from "pusher";
// import MEssages from dbMessages
// import dbMessages from './dbMessages'
import Messages from "./dbMessages.js";
//App Config
const app = express();
const port = process.env.PORT || 9000;
const connection_url =
  "mongodb://21ucs097:jaskaran123@ac-xrkpjhe-shard-00-00.ibov9rn.mongodb.net:27017,ac-xrkpjhe-shard-00-01.ibov9rn.mongodb.net:27017,ac-xrkpjhe-shard-00-02.ibov9rn.mongodb.net:27017/?ssl=true&replicaSet=atlas-ak9zy2-shard-0&authSource=admin&retryWrites=true&w=majority";

const pusher = new Pusher({
  appId: "1649765",
  key: "ecacade713bb58825117",
  secret: "0cf4ad6f3778a6e28fb7",
  cluster: "ap2",
  useTLS: true,
});

//Middleware
app.use(express.json());
app.use(Cors());
//DB Config
mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  //useCreateIndex: true
});

//API Endpoints
const db = mongoose.connection;
db.once("open", () => {
  console.log("DB Connected");
  const msgCollection = db.collection("messagingmessages");
  const changeStream = msgCollection.watch();
  changeStream.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error trigerring Pusher");
    }
  });
});
app.get("/", (req, res) => res.status(200).send("Hello TheWebDev"));

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage)
    .then((result) => {
      res.status(201).send(result);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
  // Messages.create(dbMessage, (err, data) => {
  //   if (err) res.status(500).send(err);
  //   else res.status(201).send(data);
  // });
});

app.get("/messages/sync", (req, res) => {
  Messages.find()
    .then((result) => {
      res.status(201).send(result);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
  // Messages.find((err, data) => {
  //   if (err) {
  //     res.status(500).send(err);
  //   } else {
  //     res.status(200).send(data);
  //   }
  // });
});
//Listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`));
