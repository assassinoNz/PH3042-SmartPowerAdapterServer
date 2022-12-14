import * as fs from "fs";
import * as path from "path";

import * as express from "express";
import * as express_ws from "express-ws";
import { WebSocket } from "ws";
import { graphqlHTTP } from "express-graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";

import { OutboundFirmwareEvent, InboundFirmwareEvent } from "./lib/interface";
import { resolver as Query } from "./graphql/query";
import { resolver as Mutation } from "./graphql/mutation";

export class Server {
    private static readonly port = process.env.PORT || 8080;
    private static readonly expressWs = express_ws(express());
    private static readonly schema = fs.readFileSync(path.resolve(__dirname + "/graphql/schema.graphql"), "utf-8")
    static readonly deviceId2socket = new Map<string, WebSocket>();

    static {
        //HTTP GraphQL routes
        this.expressWs.app.use("/graphql", express.json({ limit: "1MB" }), graphqlHTTP((req: any) => ({
            schema: makeExecutableSchema({
                typeDefs: this.schema,
                resolvers: {
                    Query, Mutation
                }
            }),
            context: req.session,
            graphiql: true
        })));

        //WebSocket routes
        this.expressWs.app.ws("/", (ws, req) => {
            console.log("[WS]: New connection");

            ws.on("message", (e: string) => {
                const event = JSON.parse(e) as InboundFirmwareEvent;
                switch (event.event) {
                    case "introduce": {
                        if (Server.deviceId2socket.get(event.deviceId)) {
                            //CASE: There exists a previous websocket
                            const ws = Server.deviceId2socket.get(event.deviceId)!;
                            ws.terminate();
                        }

                        Server.deviceId2socket.set(event.deviceId, ws);
                        break;
                    }
                }

                console.log("[FE_IN]:", event, "STATUS: Ok");
            });
        });

        //HTTP REST routes
        this.expressWs.app.route("/")
            .get((req, res) => {
                res.sendFile(path.resolve(__dirname + "/frontend/index.html"));
            });

        this.expressWs.app.use("/", express.static(path.resolve(__dirname + "/frontend")));
    }

    static start() {
        this.expressWs.app.listen({ port: this.port });

        console.log({
            component: "Server",
            status: true,
            port: this.port,
            cwd: __dirname
        });
    }

    static emit(deviceId: string, event: OutboundFirmwareEvent) {
        if (this.deviceId2socket.has(deviceId)) {
            const ws = this.deviceId2socket.get(deviceId)!;
            ws.send(JSON.stringify(event));
    
            console.log("[FE_OUT]:", event, "TO:", deviceId, "STATUS: Ok");
            return true;
        } else {
            console.error("[FE_OUT]:", event, "TO:", deviceId, "STATUS: Failed due to invalid device id");
            return false;
        }
    }
}

Server.start();