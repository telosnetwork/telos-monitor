import fs from 'fs';
import Task from "./src/Task.js";
import dotenv from 'dotenv/config';
import childProcess from 'child_process';
import axios from 'axios';
import fetch from 'node-fetch';
import ethers from "ethers";
import eosjs from 'eosjs';
const JsonRpc = eosjs.JsonRpc;
const TASK_PATH = 'tasks';

async function getHyperionEndpoint() {
    const endpoints = process.env.HYPERION_ENDPOINTS.split(',');
    for(var i = 0; i < endpoints.length; i++){
        let healthy = true;
        let task = new Task(endpoints[i], 'endpoints');
        try {
            const hyperionHealth = await axios.get(endpoints[i] + "/health");
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
        task.save();
    }
}

async function getEVMRPCEndpoint() {
    const endpoints = process.env.RPC_EVM_ENDPOINTS.split(',');
    for(var i = 0; i < endpoints.length; i++){
        let healthy = true;
        let task = new Task(endpoints[i], 'endpoints');
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
        task.save();
    }
}

async function getRPCEndpoint() {
    const endpoints = process.env.RPC_ENDPOINTS.split(',');
    for(var i = 0; i < endpoints.length; i++){
        let healthy = true;
        let task = new Task(endpoints[i], 'endpoints');
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
        task.save();
    }
}

var FILES = null;

function run(i){
    console.log('RUNNING TASK: ' + FILES[i].replace('.js', ''))
    var file = TASK_PATH + "/" + FILES[i];
    var invoked = false;
    var process = childProcess.fork(file);
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        // TODO: MAIL SYSTEM ERROR TO ADMIN EMAILS IF EXISTS
    });
    process.on('exit', function (code) {
        if (invoked) return;
        console.log(FILES[i].replace('.js', ''), "done with code", code);
        invoked = true;
        i++;
        if(i < FILES.length) run(i);
        var err = code === 0 ? null : new Error('exit code ' + code);
        // TODO: MAIL ERROR CODE TO ADMIN EMAILS IF EXISTS
    });
}

async function main(){
    console.log('Checking endpoints...');
    // Check endpoints before running tasks
    await getHyperionEndpoint();
    await getRPCEndpoint();
    await getEVMRPCEndpoint();
    console.log('Running tasks...');
    fs.readdir(TASK_PATH, async (err, files) => {
        FILES = files;
        run(0);
    });
}

main();