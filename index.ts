import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import * as tls from "tls";
import * as crypto from "crypto";

import fetch from "node-fetch";
import * as express from "express";
import * as aedes from "aedes";
import * as firebaseApp from "firebase-admin/app";
import * as firestore from "firebase-admin/firestore";

export class Firebase {
    static db: firestore.Firestore;

    static {
        firebaseApp.initializeApp({
            credential: firebaseApp.cert("etc/smart-power-adapter-3a443-firebase-adminsdk-4gp49-dee9ce7957.json")
        });
        
        this.db = firestore.getFirestore();
    }
}

export class Server {
    private static readonly port = 8080;
    private static readonly express = express();
    private static readonly server = https.createServer({
        key: fs.readFileSync("etc/server.key"),
        cert: fs.readFileSync("etc/server.crt")
    }, this.express);

    static {
        this.express.route("/update/firmware.bin")
            .get((req, res) => {
                const firmwarePath = path.resolve(__dirname + "/../Smart-Power-Adapter-Firmware/.pio/build/nodemcuv2/firmware.bin");
                const firmwareHash = crypto.createHash("md5").update(fs.readFileSync(firmwarePath)).digest("hex");
                
                if (req.headers["x-esp8266-sketch-md5"] === firmwareHash) {
                    res.sendStatus(304);
                } else {
                    res.sendFile(firmwarePath);
                }
            });

        this.express.use("/", express.static(path.resolve(__dirname + "/frontend")));
    }

    static start() {
        this.server.listen({ port: this.port });

        console.log({
            component: "Server",
            status: true,
            port: this.port,
            cwd: __dirname
        });
    }
}

export class Broker {
    private static readonly port = 1883;
    //@ts-ignore
    private static readonly aedes = aedes();
    private static readonly server = tls.createServer({
        key: fs.readFileSync("etc/server.key"),
        cert: fs.readFileSync("etc/server.crt")
    }, this.aedes.handle);

    static {
        this.aedes.authenticate = (client, username, password, callback) => {
            if (username === "assassino") {
                callback(null, true);
            } else {
                callback(null, false);
            }
        }

        this.aedes.on("client", (client) => {
            console.log(`CLIENT: ${client?.id} CONNECTED`);
        });
        this.aedes.on("clientDisconnect", (client) => {
            console.log(`CLIENT: ${client?.id} DISCONNECTED`);
        });
        this.aedes.on("subscribe", (subscriptions, client) => {
            console.log(`CLIENT: ${client?.id} SUBSCRIBED: ${subscriptions.map(s => s.topic).join(',')}`);
        });
        this.aedes.on("unsubscribe", (subscriptions, client) => {
            console.log(`CLIENT: ${client?.id} UNSUBSCRIBED: ${subscriptions.join(',')}`);
        });
        this.aedes.on("publish", async (packet, client) => {
            console.log(`CLIENT: ${client?.id} PUBLISHED: ${packet.payload} TOPIC: ${packet.topic}`);

            if (packet.topic.endsWith("/readings")) {
                // try {
                //     const message = JSON.parse(packet.payload);
        
                //     const deviceDocRef = Firebase.db.collection("devices").doc(client.id);
                //     deviceDocRef.set({
                //         name: ""
                //     });
        
                //     const readingsColRef = deviceDocRef.collection("readings");
                //     readingsColRef.add(message[0]);
                // } catch (e: any) {
                //     console.log(e);
                // }
            } else if (packet.topic.endsWith("/predict/onoff_send")) {
                fetch("https://wandering-water-6831.fly.dev/predict", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ device_id: client.id, "data_reading": { i: 0.9900436818128375, time: 1676362048419, v: 0.5681495890359043 } })
                })
                .then(res => res.text())
                .then(res => {
                    if (res === "device not registered") {
                        this.aedes.publish({ topic: client.id + "/predict/onoff_receive", payload: JSON.stringify({response: false}) });
                    } else {
                        this.aedes.publish({ topic: client.id + "/predict/onoff_receive", payload: res });
                    }
                });
            }  else if (packet.topic.endsWith("/predict/power_send")) {
                fetch("https://wandering-water-6831.fly.dev/cforcast", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ device_id: client.id })
                })
                .then(res => res.text())
                .then(res => {
                    this.aedes.publish({ topic: client.id + "/predict/power_receive", payload: res });
                });
            }
        });
    }

    static start() {
        this.server.listen(this.port);

        console.log({
            component: "Broker",
            status: true,
            port: this.port
        });
    }
}

Server.start();
Broker.start();