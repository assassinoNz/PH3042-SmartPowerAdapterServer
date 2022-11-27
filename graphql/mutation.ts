import { Server } from "../index";
import { Mutation, MutationSetPowerArgs } from "./type";

export const resolver = {
    SetPower: (parent: Mutation, params: MutationSetPowerArgs, ctx: any, info: any): Mutation["SetPower"] => {
        return Server.emit(params.deviceId, {
            event: "set-power",
            state: params.state
        });
    }
};