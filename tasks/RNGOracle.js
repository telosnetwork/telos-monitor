import Contract from "../src/Contract.js";
import dotenv from 'dotenv/config';

const MAX = 99999;
const MIN = 10000;

const RESPONSE_MS = process.env.TSK_RNG_ORACLE_RESPONSE_MS;
const ORACLE_CONSUMER = process.env.TSK_RNG_ORACLE_CONSUMER;
const ACCOUNT = "rng.oracle";
const MIN_RAM = process.env.TSK_RNG_ORACLE_MIN_RAM;

class RNGOracle extends Contract {
    constructor(){
        super(ACCOUNT);
    }
    async run(){
        const account = await this.getNativeAccount(ACCOUNT);
        this.checkRAM(account, MIN_RAM);
        const last_request = await this.rpc.get_table_rows({
            code: ORACLE_CONSUMER,
            table: 'rngrequests',
            scope: ORACLE_CONSUMER,
            limit: 1,
            reverse: true
        });
        let id = (last_request.rows.length == 0) ? 0 : last_request.rows[0].id + 1;
        // REQUEST A RANDOM NUMBER
        const request = await this.sendActions([{
            account: ORACLE_CONSUMER,
            name: 'request',
            authorization: [{ actor: ORACLE_CONSUMER, permission: 'active' }],
            data: {"seed": "918764242", "min": MIN, "max": MAX},
        }]);

        this.check(id);
    }
    async check(id){
        let ctx = this;
        setTimeout(async function () {
            // GET REQUEST ROW
            const response = await ctx.rpc.get_table_rows({
                code: ORACLE_CONSUMER,
                table: 'rngrequests',
                scope: ORACLE_CONSUMER,
                limit: 50,
                reverse: true
            });
            // CHECK REQUEST WAS SAVED
            if(response.rows.length == 0){
                ctx.errors.push("Request was not saved");
            } else {
                let request = false;
                response.rows.forEach(row => {
                    if(row.id == id){
                        request = row;
                    }
                });
                if(request){
                    // CHECK NUMBER WAS SET
                    if(request.number == 0){
                        ctx.errors.push("Oracle didn't answer in < "+RESPONSE_MS+"ms");
                    }
                    // CHECK NUMBER WAS WITHIN RANGE
                    else if(request.number < MIN || request.number > MAX){
                        ctx.errors.push("Number returned by oracle (" + request.number + ") is not within range (" + MIN + "," + MAX + ")");
                    }
                    // DELETE REQUEST
                    const result = await ctx.sendActions([{
                        account: ORACLE_CONSUMER,
                        name: 'rmvrequest',
                        authorization: [{ actor: ORACLE_CONSUMER, permission: 'active' }],
                        data: {"request_id": id},
                    }]);
                } else {
                    ctx.errors.push("Request was not saved");
                }
            }
            await ctx.save();
            ctx.end();
        }, RESPONSE_MS);
    }
}

let test = new RNGOracle();
test.run();