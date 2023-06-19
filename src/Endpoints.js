import Task from './Task.js';
import dotenv from 'dotenv/config';
import fetch from 'node-fetch';
import ethers from "ethers";
import eosjs from 'eosjs';
import axios from 'axios';
const JsonRpc = eosjs.JsonRpc;

const HYPERION_INDEXING_MINUTES = parseInt(process.env.TSK_ENDPOINTS_HYPERION_MINUTES);
const HYPERION_QUERY_MAX_MS = parseInt(process.env.TSK_ENDPOINTS_HYPERION_QUERY_MAX_MS);
const HYPERION_INDEX_MAX_BLOCKS_MISSED = parseInt(process.env.TSK_ENDPOINTS_HYPERION_INDEX_MAX_BLOCKS_MISSED);
const HYPERION_INDEX_MAX_BLOCKS_AGO = parseInt(process.env.TSK_ENDPOINTS_HYPERION_INDEX_MAX_BLOCKS_AGO);

export default class Endpoints extends Task {
    constructor(){
        super(null, 'endpoints');
        this.min_hyperion_timestamp = new Date();
        this.min_hyperion_timestamp.setMinutes(this.min_hyperion_timestamp.getMinutes() - HYPERION_INDEXING_MINUTES);
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
            this.errors = [];
            this.task_name = endpoints[i].replace('https://', '');
            try {
                let hyperionHealth = await axios.get(endpoints[i] + "/health");
                if(hyperionHealth.status != 200){
                    this.errors.push("Could not reach endpoint, HTTP status " + hyperionHealth.status);
                } else {
                    let serviceMap = hyperionHealth.data.health.reduce((map, cur) => {map[cur.service] = cur; return map;}, {})
                    if(typeof serviceMap.NodeosRPC.service_data == "undefined"){
                        this.errors.push('Nodeos service data not found');
                    } else if(serviceMap.NodeosRPC.service_data.head_block_time > this.min_hyperion_timestamp){
                        this.errors.push('Nodeos isn\'t synced');
                    } else {
                        let caughtUpToHead = serviceMap.Elasticsearch.service_data.last_indexed_block >= (serviceMap.NodeosRPC.service_data.head_block_num - HYPERION_INDEX_MAX_BLOCKS_AGO);
                        if(caughtUpToHead){
                            if(hyperionHealth.data.health[0].status !== "OK") {
                                this.alerts.push('RabbitMQ status is not OK');
                            }
                            if(hyperionHealth.data.health[1].status !== "OK") {
                                this.alerts.push('Nodeos status is not OK');
                            }
                            if(hyperionHealth.data.health[2].status !== "OK") {
                                this.alerts.push('Elastic Search status is not OK');
                            }
                            if(hyperionHealth.data.query_time_ms > HYPERION_QUERY_MAX_MS) {
                                this.alerts.push('Query time was above ' + HYPERION_QUERY_MAX_MS + 'ms' );
                            }
                            if(hyperionHealth.data.health[1].service_data.chain_id !== process.env.CHAIN_ID_HEX) {
                                this.errors.push('Wrong chain ID for Nodeos: ' + hyperionHealth.data.health[1].service_data.chain_id );
                            }
                        } else {
                            this.errors.push('Indexing has not caught up to head');
                        }
                    }
                }
            } catch (e) {
                console.log(e.message)
                this.errors.push("Could not reach endpoint: " + e.message);
            }
            if(this.errors.length === 0 && endpoints[i] !== "https://telos.caleos.io/v2"){
                try {
                    let EVMTransactionEndpointHealth = await axios.get(endpoints[i] + "/evm/get_transactions?limit=10&skip=0&sort=desc");
                    if (EVMTransactionEndpointHealth.status != 200) {
                        this.errors.push("Call to /evm/get_transactions?limit=10&skip=0&sort=desc ended in HTTP " + EVMTransactionEndpointHealth.status);
                    }
                } catch (e) {
                    console.log(e.message)
                    this.errors.push("Could not reach endpoint: " + e.message);
                }
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