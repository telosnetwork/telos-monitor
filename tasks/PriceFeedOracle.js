import Contract from "../src/Contract.js";
import dotenv from 'dotenv/config';
import axios from 'axios';

const COINGECKO = 'https://api.coingecko.com/api/v3/simple/price?ids=telos&vs_currencies=EOS,USD,BTC'
const ACCOUNT = 'delphioracle';
const MINUTES = parseInt(process.env.TSK_DELPHI_ORACLE_DATAPOINTS_MN);
const TOKENS = process.env.TSK_DELPHI_ORACLE_TOKENS.split(',');

class PriceFeedOracle extends Contract {
    constructor(){
        super(ACCOUNT);
        this.min_timestamp = new Date();
        this.min_timestamp.setMinutes(this.min_timestamp.getMinutes() - MINUTES);
    }
    async run(){
        for(var i = 0; i < TOKENS.length; i++){
            const oraclePrices = await this.getOraclePrices(TOKENS[i]);
            if(oraclePrices.length == 0){
                this.errors.push("No datapoints found for TLOS"+ TOKENS[i].toUpperCase() +" prices");
            } else {
                let timestamp = new Date(oraclePrices[0].timestamp);
                if(timestamp.getTime() < this.min_timestamp.getTime()) {
                    this.alerts.push("Last TLOS"+ TOKENS[i].toUpperCase() +" datapoint written over "+MINUTES+" minutes ago");
                }
            }
        }
        await this.save();
        this.end();
    }
    async getOraclePrices(token) {
        const response = await this.rpc.get_table_rows({
            json: true,
            code: ACCOUNT,
            scope: 'tlos' + token,
            table: 'datapoints',
            limit: 1,
        });
        return response.rows;
    }
}

const test = new PriceFeedOracle();
test.run();