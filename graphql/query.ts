import { Query, QueryTestQueryArgs } from "./type";

export const resolver = {
    TestQuery: (parent: Query, params: QueryTestQueryArgs, ctx: any, info: any): Query["TestQuery"] => {
        return params.test
    }
};