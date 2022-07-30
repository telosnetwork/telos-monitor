import Contract from "../src/Contract.js";
import dotenv from 'dotenv/config';
import axios from 'axios';

const ACCOUNT = 'free.tf';
const KEY = 'accounts.tf';
const MIN_RAM = parseInt(process.env.TSK_FREE_TF_MIN_RAM);
const MIN_TF_ACCOUNTS = parseInt(process.env.TSK_FREE_TF_MIN_TF_ACCOUNTS);
const ACCOUNT_WHITELIST = process.env.TSK_FREE_TF_ACCOUNT_WHITELIST.split(',');
const ACCOUNT_CONFLIST = process.env.TSK_FREE_TF_ACCOUNT_CONFLIST.split(',');

class FreeTF extends Contract {
    constructor(){
        super(ACCOUNT);
    }
    async run(){
        await this.checkRam();
        await this.checkAccountList();
        await this.checkAccountsTFList();
        await this.save();
        this.end();
    }
    async checkAccountsTFList(){
        const conflist_response = await this.rpc.get_table_rows({
            code: ACCOUNT,
            table: 'conflstacts',
            lower_bound: KEY,
            upper_bound: KEY,
            scope: ACCOUNT,
            limit: 1,
        });
        if(conflist_response.rows.length == 0){
            this.errors.push("Conflist: Could not get number of accounts");
        } else if(conflist_response.rows[0].max_accounts - conflist_response.rows[0].total_accounts < MIN_TF_ACCOUNTS ) {
            this.errors.push("Conflist: less than "+ MIN_TF_ACCOUNTS +" to maximum accounts for accounts.tf");
        }
        const whitelist_response = await this.rpc.get_table_rows({
            code: ACCOUNT,
            table: 'whitelstacts',
            scope: ACCOUNT,
            lower_bound: KEY,
            upper_bound: KEY,
            limit: 1,
        });
        if(whitelist_response.rows.length == 0){
            this.errors.push("Whitelist: could not get number of accounts");
        } else if(whitelist_response.rows[0].max_accounts - whitelist_response.rows[0].total_accounts < MIN_TF_ACCOUNTS) {
            this.errors.push("Whitelist: less than "+ MIN_TF_ACCOUNTS +" to maximum accounts for accounts.tf");
        }
    }
    async checkAccountList(){
        const conflist_response = await this.rpc.get_table_rows({
            code: ACCOUNT,
            table: 'conflstacts',
            scope: ACCOUNT,
        });
        if(conflist_response.rows.length == 0){
            this.errors.push("Conflist: Could not get number of accounts");
        } else {
            for(var i = 0; i < conflist_response.rows.length; i++){
                if(ACCOUNT_CONFLIST.includes(conflist_response.rows[i].account_name) && conflist_response.rows[i].total_accounts >= conflist_response.rows[i].max_accounts){
                    this.errors.push("Conflist: maximum accounts reached for " + conflist_response.rows[i].account_name);
                }
            }
        }
        const whitelist_response = await this.rpc.get_table_rows({
            code: ACCOUNT,
            table: 'whitelstacts',
            scope: ACCOUNT,
        });

        if(whitelist_response.rows.length == 0){
            this.errors.push("Conflist: Could not get number of accounts");
        } else {
            for(var i = 0; i < whitelist_response.rows.length; i++){
                if(ACCOUNT_WHITELIST.includes(whitelist_response.rows[i].account_name) && whitelist_response.rows[i].total_accounts >= whitelist_response.rows[i].max_accounts){
                    this.errors.push("Whitelist: maximum accounts reached for " + whitelist_response.rows[i].account_name);
                }
            }
        }
    }
    async checkRam(){
        const response = await axios.get(this.hyperion_endpoint + "/state/get_account?account=" + ACCOUNT);
        if(((response.data.account.ram_usage / response.data.account.ram_quota) * 100) < MIN_RAM){
            this.errors.push("Less than "+MIN_RAM+"% RAM is free");
        }
    }
}

const test = new FreeTF();
test.run();