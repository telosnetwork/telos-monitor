import Task from './Task.js';
import dotenv from 'dotenv/config';
import fetch from 'node-fetch';
import ethers from "ethers";
import eosjs from 'eosjs';
import axios from 'axios';
const JsonRpc = eosjs.JsonRpc;

export default class Endpoints extends Task {
    constructor(){
        super(null, 'endpoints');
    }
    async checkAllEndpointsAvailability() {
        await this.checkHyperionEndpointsAvailability();
        await this.checkRPCEndpointsAvailability();
        await this.checkEVMRPCEndpointsAvailability();
        return;
    }
    async checkHyperionEndpointsAvailability() {
        const endpoints = process.env.HYPERION_ENDPOINTS.split(',');
        for(var i = 0; i < endpoints.length; i++){
            let healthy = true;
            this.errors = [];
            this.task_name = endpoints[i].replace('https://', '');
            try {
                let hyperionHealth = await axios.get(endpoints[i] + "/health");
                if(hyperionHealth.status != 200){
                    healthy = false;
                } else {
                    process.env.HYPERION_ENDPOINT = endpoints[i];
                }
            } catch (e) {
                healthy = false;
            }
            if(!healthy){
                this.errors.push("Could not reach endpoint");
            }
            await this.save();
        }
        return;
    }
    async checkEVMRPCEndpointsAvailability() {
        const endpoints = process.env.RPC_EVM_ENDPOINTS.split(',');
        for(var i = 0; i < endpoints.length; i++){
            let healthy = true;
            this.errors = [];
            this.task_name = endpoints[i].replace('https://', '');
            let provider = new ethers.providers.JsonRpcProvider(endpoints[i]);
            try {
                let network = await provider.getNetwork();
                if(provider == null || provider._isProvider == false || network == null){
                    healthy = false;
                } else {
                    if((provider._lastBlockNumber * -1) > process.env.MAX_RPC_BLOCK_TRAIL){
                        this.errors.push("RPC is", (provider._lastBlockNumber * -1), "blocks behind");
                    } else {
                        process.env.RPC_EVM_ENDPOINT = endpoints[i];
                    }
                    console.log("RPC is", (provider._lastBlockNumber * -1), "blocks behind");
                }
            } catch (e) {
                healthy = false;
            }
            if(!healthy){
                this.errors.push("Could not reach endpoint");
            }
            await this.save();
        }
        return;
    }

    async checkRPCEndpointsAvailability() {
        const endpoints = process.env.RPC_ENDPOINTS.split(',');
        let main_rpc = new JsonRpc(process.env.RPC_ENDPOINT, { fetch });
        let info = await main_rpc.get_info();
        let highest_rpc_block = info.head_block_num;
        for(let i = 0; i < endpoints.length; i++){
            let healthy = true;
            this.errors = [];
            this.task_name = endpoints[i].replace('https://', '');
            let rpc = new JsonRpc(endpoints[i], { fetch });
            try {
                info = await rpc.get_info();
                if(info == null){
                    healthy = false;
                } else {
                    let last_rpc_block = info.head_block_num;
                    highest_rpc_block = (last_rpc_block > highest_rpc_block) ? last_rpc_block : highest_rpc_block;
                    let block_diff = highest_rpc_block - last_rpc_block;
                    if (block_diff > process.env.MAX_RPC_BLOCK_TRAIL) {
                        this.errors.push("RPC is", block_diff, "blocks behind");
                    } else {
                        process.env.RPC_ENDPOINT = endpoints[i];
                    }
                    console.log("RPC is", block_diff, "blocks behind");
                }
            } catch (e) {
                healthy = false;
            }
            if(!healthy){
                this.errors.push("Could not reach endpoint");
            }
            await this.save();
        }
        return;
    }
}