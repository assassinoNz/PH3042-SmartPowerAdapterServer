import { Query, QueryGetLatestReadingsArgs } from "./type";

export const resolver = {
    GetLatestReadings: (parent: Query, params: QueryGetLatestReadingsArgs, ctx: any, info: any): Query["GetLatestReadings"] => {
        const readings = [];
        for (let i = 0; i < params.count; i++) {
            const datum = {
                current: Math.random(),
                voltage: Math.random()*100,
                timestamp: Math.round(Date.now()/1000)
            }

            readings.push(datum);
        }

        return readings;
    }
};