import Mailer from './Mailer.js';
import dotenv from 'dotenv/config';
import eosjs from 'eosjs';
const JsonRpc = eosjs.JsonRpc;
const Api = eosjs.Api;
import fetch from 'node-fetch';
import { TextEncoder, TextDecoder } from 'util';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js';
const signatureProvider = new JsSignatureProvider([process.env.PRIVATE_KEY]);
import pkg from 'pg';
const { Pool } = pkg;

export default class Task {
    constructor(task_name, cat_name){
        this.errors = [];
        this.mailer = (parseInt(process.env.NOTIFICATIONS) == true) ? new Mailer() : null;
        this.task_name = task_name;
        this.cat_name = cat_name;
        this.hyperion_endpoint = process.env.HYPERION_ENDPOINT;
        this.check_interval = 1800;
        let rpc = new JsonRpc(process.env.RPC_ENDPOINT, { fetch });
        this.api = new Api({
            rpc,
            signatureProvider,
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder()
        });
        this.rpc = rpc;
        this.pool = new Pool({
            user: process.env.DATABASE_USER,
            database: process.env.DATABASE,
            password: process.env.DATABASE_PASSWORD,
            port: process.env.DATABASE_PORT,
            host: 'localhost',
        })
    }
    end(){
        let code = (this.errors.length) ? 99 : 0;
        process.exit(this.errors.length);
    }
    async sendActions(actions) {
        try {
            const result = await this.api.transact({ actions: actions }, { blocksBehind: 3, expireSeconds: 30 });
            if(result.error_code != null){
                this.errors.push("Error sending action: " + result.error_code)
                this.save();
                this.end();
                return false;
            }
        } catch (e) {
            this.errors.push("Error sending action: " + e.message)
            this.save();
            this.end();
            return false;
        }
        return true;
    }
    async getOrCreate(task_name, cat_name){
        let cat = await this.pool.query(
            "SELECT * FROM task_categories WHERE name = $1",
            [cat_name]
        );
        if(cat.rowCount == 0){
            cat = await this.pool.query(
                "INSERT INTO task_categories (name) VALUES ($1) RETURNING id",
                [cat_name]
            );
        }
        const cat_id = cat.rows[0].id;
        let res = await this.pool.query(
            "SELECT * FROM tasks WHERE name = $1",
            [task_name]
        );
        if(res.rowCount == 0){
            res = await this.pool.query(
                "INSERT INTO tasks (name, category) VALUES ($1, $2) RETURNING id",
                [task_name, cat_id]
            );
        }

        return res.rows[0].id;
    }
    async save(){
        if(this.task_name == null) throw "Task name cannot be null";
        const task_id = await this.getOrCreate(this.task_name, this.cat_name);

        const last_task = await this.pool.query(
            "SELECT * FROM task_status WHERE task = $1 LIMIT 1 ORDER BY id DESC",
            [task_id]
        );
        if(this.errors.length == 0){
            await this.pool.query(
                "INSERT INTO task_status (task, message) VALUES ($1, $2)",
                [task_id, ""]
            );
        } else {
            let message = '';
            for(var i = 0; i< this.errors.length; i++){
                message += this.errors[i] + ",";
                let error = this.errors[i].substring(0, 255);
                await this.pool.query(
                    "INSERT INTO task_status (task, message) VALUES ($1, $2)",
                    [task_id, error]
                );
            }
            message = message.splice(0, -1);
            if(this.mailer && last_task.rowCount == 0 || this.mailer && last_task.rows[0].message == ""){
                this.mailer.notify(this.task_name, message);
            }
        }
    }
    async notify(error){
        if(error == null) return;
        // TODO: plug email services here
    }
}