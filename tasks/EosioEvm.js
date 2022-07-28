import Task from "../src/Task.js";
import dotenv from 'dotenv/config';
import axios from 'axios';

const MIN_FREE = process.env.TSK_EOSIO_EVM_MIN_FREE;
const ACCOUNT = 'eosio.evm';

class EosioEvm extends Task {
    constructor(){
        super(ACCOUNT, "contracts");
    }
    async run(){
        const response = await axios.get(this.hyperion_endpoint + "/state/get_account?account=" + ACCOUNT);
        if((((response.data.account.ram_quota - response.data.account.ram_usage) / response.data.account.ram_quota) * 100) < MIN_FREE){
            this.errors.push("Less than " + MIN_FREE +"% RAM is free");
        }
        if((((response.data.account.cpu_limit.max - response.data.account.cpu_limit.used) / response.data.account.cpu_limit.max) * 100) < MIN_FREE){
            this.errors.push("Less than " + MIN_FREE +"% CPU is free");
        }
        if(((( response.data.account.net_limit.max - response.data.account.net_limit.used) / response.data.account.net_limit.max) * 100) < MIN_FREE){
            this.errors.push("Less than " + MIN_FREE +"% NET is free");
        }
        await this.save();
        super.end();
    }
}

const test = new EosioEvm();
test.run();