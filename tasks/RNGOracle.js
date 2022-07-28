import Task from "../src/Task.js";
import dotenv from 'dotenv/config';

const MAX = 5;
const MIN = 1;
const RESPONSE_MS = 1500;

class RNGOracle extends Task {
    constructor(){
        super("rng.oracle", 'contracts');
    }
    async run(){
        // REQUEST A RANDOM NUMBER
        const result = await this.sendActions([{
            account: process.env.RNG_ORACLE_CONSUMER,
            name: 'request',
            authorization: [{ actor: process.env.RNG_ORACLE_CONSUMER, permission: 'active' }],
            data: {"seed": "918764242", "min": MIN, "max": MAX},
        }]);

        this.check();
    }
    async check(){
        let ctx = this;
        setTimeout(async function () {
            // GET REQUEST ROW
            const row = await ctx.rpc.get_table_rows({
                code: process.env.RNG_ORACLE_CONSUMER,
                table: 'rngrequests',
                scope: process.env.RNG_ORACLE_CONSUMER,
                limit: 1,
            });
            // CHECK REQUEST WAS SAVED
            if(row.rows.length == 0){
                ctx.errors.push("Request was not saved");
            }
            // CHECK NUMBER WAS SET
            else if(row.rows[0].number == null){
                ctx.errors.push("Oracle didn't answer in < 1500ms");
            }
            // CHECK NUMBER WAS WITHIN RANGE
            else if(row.rows[0].number < MIN || row.rows[0].number > MAX){
                ctx.errors.push("Number returned by oracle is not within range");
            // IF EVERYTHING OK, DELETE REQUEST
            } else {
                const result = await ctx.sendActions([{
                    account: process.env.RNG_ORACLE_CONSUMER,
                    name: 'rmvrequest',
                    authorization: [{ actor: process.env.RNG_ORACLE_CONSUMER, permission: 'active' }],
                    data: {"request_id": 0},
                }]);
            }
            ctx.save();
            ctx.end();
        }, RESPONSE_MS)
    }
}

let test = new RNGOracle();
test.run();