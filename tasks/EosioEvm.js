import Contract from "../src/Contract.js";
import dotenv from 'dotenv/config';
import axios from 'axios';

const MIN_FREE = process.env.TSK_EOSIO_EVM_MIN_FREE;
const ACCOUNT = 'eosio.evm';

class EosioEvm extends Contract {
    constructor(){
        super(ACCOUNT);
    }
    async run(){
        const account = await this.getNativeAccount(ACCOUNT);
        if(account){
            this.checkAccountLimits(account, MIN_FREE);
        }
        await this.save();
        super.end();
    }
}

const test = new EosioEvm();
test.run();