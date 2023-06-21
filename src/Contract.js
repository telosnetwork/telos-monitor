import Task from './Task.js';
import dotenv from 'dotenv/config';
import eosjs from 'eosjs';
import fetch from 'node-fetch';
import axios from 'axios';
import { TextEncoder, TextDecoder } from 'util';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js';
const JsonRpc = eosjs.JsonRpc;
const Api = eosjs.Api;
const signatureProvider = new JsSignatureProvider([process.env.PRIVATE_KEY]);

export default class Contract extends Task {
    constructor(task_name){
        super(task_name, 'contract');
        this.hyperion_endpoint = process.env.HYPERION_ENDPOINT;
        let rpc = new JsonRpc(process.env.RPC_ENDPOINT, { fetch });
        this.api = new Api({
            rpc,
            signatureProvider,
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder()
        });
        this.clear();
        this.rpc = rpc;
    }
    async getNativeAccount(account){
        try {
            const response = await axios.get(this.hyperion_endpoint + "/state/get_account?account=" + account);
            return response.data.account;
        } catch (e) {
            this.errors.push(e.message);
            return false;
        }
    }
    checkRAM(account, min_ram){
        const ram_free = ((account.ram_quota - account.ram_usage) / account.ram_quota) * 100;
        console.log("RAM FREE:", Math.round(ram_free) + "%")
        if(ram_free < min_ram){
            this.errors.push("Less than "+ min_ram +"% RAM is free");
        }
    }
    checkNET(account, min_net){
        const net_free = ( account.net_limit.available / account.net_limit.max) * 100;
        console.log("NET FREE:", Math.round(net_free) + "%");
        if(net_free < min_net){
            this.errors.push("Less than " + min_net +"% NET is free");
        }
    }
    checkCPU(account, min_cpu){
        const cpu_free = (account.cpu_limit.available / account.cpu_limit.max) * 100;
        console.log("CPU FREE:", Math.round(cpu_free) + "%");
        if(cpu_free < min_cpu){
            this.errors.push("Less than " + min_cpu +"% CPU is free");
        }
    }
    checkAccountLimits(account, min_free){
        if(!account || !account.cpu_limit || !account.ram_quota) {
            this.errors.push("Account not found");
            return;
        };
        this.checkRAM(account, min_free)
        this.checkCPU(account, min_free)
        this.checkNET(account, min_free)
    }
}