import dotenv from 'dotenv/config';
import fetch from 'node-fetch';
import Task from "../Task.js";
import ethers from "ethers";
import eosjs from 'eosjs';
import axios from 'axios';
const JsonRpc = eosjs.JsonRpc;

export default async function checkEndpointAvailability() {
    await checkHyperionEndpoints();
    await checkRPCEndpoints();
    await checkEVMRPCEndpoints();
    return;
}
export async function checkHyperionEndpoints() {
    const endpoints = process.env.HYPERION_ENDPOINTS.split(',');
    for(var i = 0; i < endpoints.length; i++){
        let healthy = true;
        let task = new Task(endpoints[i].replace('https://', ''), 'endpoints');
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
            task.errors.push("Could not reach endpoint");
        }
        await task.save();
    }
    return;
}

export async function checkEVMRPCEndpoints() {
    const endpoints = process.env.RPC_EVM_ENDPOINTS.split(',');
    for(var i = 0; i < endpoints.length; i++){
        let healthy = true;
        let task = new Task(endpoints[i].replace('https://', ''), 'endpoints');
        let provider = new ethers.providers.JsonRpcProvider(endpoints[i]);
        try {
            let network = await provider.getNetwork();
            if(provider == null || provider._isProvider == false || network == null){
                healthy = false;
            } else {
                process.env.RPC_EVM_ENDPOINT = endpoints[i];
            }
        } catch (e) {
            healthy = false;
        }
        if(!healthy){
            task.errors.push("Could not reach endpoint");
        }
        await task.save();
        return;
    }
}

export async function checkRPCEndpoints() {
    const endpoints = process.env.RPC_ENDPOINTS.split(',');
    for(var i = 0; i < endpoints.length; i++){
        let healthy = true;
        let task = new Task(endpoints[i].replace('https://', ''), 'endpoints');
        let rpc = new JsonRpc(endpoints[i], { fetch });
        try {
            let info = await rpc.get_info();
            if(info == null){
                healthy = false;
            } else {
                process.env.RPC_ENDPOINT = endpoints[i];
            }
        } catch (e) {
            healthy = false;
        }
        if(!healthy){
            task.errors.push("Could not reach endpoint");
        }
        await task.save();
        return;
    }
}