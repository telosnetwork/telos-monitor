import Task from './Task.js';
import dotenv from 'dotenv/config';
import eosjs from 'eosjs';
import fetch from 'node-fetch';
import { TextEncoder, TextDecoder } from 'util';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js';
const JsonRpc = eosjs.JsonRpc;
const Api = eosjs.Api;
const signatureProvider = new JsSignatureProvider([process.env.PRIVATE_KEY]);

export default class Contract extends Task {
    constructor(task_name){
        super(task_name, 'contracts');
        this.hyperion_endpoint = process.env.HYPERION_ENDPOINT;
        let rpc = new JsonRpc(process.env.RPC_ENDPOINT, { fetch });
        this.api = new Api({
            rpc,
            signatureProvider,
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder()
        });
        this.rpc = rpc;
    }
}