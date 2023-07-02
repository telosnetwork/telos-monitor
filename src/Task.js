import Notifier from './Notifier.js';
import dotenv from 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
const STATUS_TYPES = {
	SUCCESS: 1,
	INFO: 2,
	ALERT: 3,
	ERROR: 4,
}

export default class Task {
    constructor(task_name, cat_name){
        this.errors = [];
	    this.alerts = [];
	    this.infos = [];
        this.notifier = (parseInt(process.env.NOTIFICATIONS) == true) ? new Notifier() : false;
        this.task_name = task_name;
        this.cat_name = cat_name;
        this.check_interval = 1800;
        this.pool = new Pool({
            user: process.env.DATABASE_USER,
            database: process.env.DATABASE,
            password: process.env.DATABASE_PASSWORD,
            port: process.env.DATABASE_PORT,
            host: process.env.DATABASE_HOST,
        });
    }
    end(){
        let code = (this.errors.length) ? 99 : 0;
        process.exit(this.errors.length);
    }
    clear(){
        this.errors = [];
        this.alerts = [];
        this.infos = [];
    }
    handleFailure(message){
        if(
            message.indexOf('expired transaction') > -1 ||
            message.indexOf('No payouts are due') > -1 ||
            message.indexOf('transaction was executing for too long') > -1
        ) {
            this.alerts.push("Error sending action: " + e.message)
            return;
        }
        this.errors.push("Error sending action: " + e.message)
    }
    async sendActions(actions) {
        if(!this.api) throw "API not set";
        try {
            const result = await this.api.transact({ actions: actions }, { blocksBehind: 3, expireSeconds: 90 });
            if(result.error_code){
                this.errors.push("Error sending action: " + result.error_code);
                await this.save();
                this.end();
                return false;
            }
        } catch (e) {
            this.handleFailure(e.message);
            await this.save();
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
        if(cat.rowCount === 0){
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
        if(res.rowCount === 0){
            res = await this.pool.query(
                "INSERT INTO tasks (name, category) VALUES ($1, $2) RETURNING id",
                [task_name, cat_id]
            );
        }

        return res.rows[0].id;
    }
    async insertTaskStatuses(task_id, errors, type){
        for(var i = 0; i < errors.length; i++){
            let error = errors[i].substring(0, 255);
            try {
                await this.pool.query(
                    "INSERT INTO task_status (task, message, type) VALUES ($1, $2, $3)",
                    [task_id, error, type]
                );
            } catch(e) {
                console.log(e);
            }
        }
    }
    async notify(task_id){
        if(this.notifier === false || process.env.NOTIFICATIONS !== '1') return;
        const errors = this.errors.map((error) => { return error.substr(0, 255)});
        const last_tasks = await this.pool.query(
            "SELECT * FROM task_status WHERE task = $1 AND type = $2 AND checked_at > now() - interval '4 hours' AND checked_at < now() - interval '1 minute' AND message IN ($3) ORDER BY id DESC LIMIT 2",
            [task_id, STATUS_TYPES.ERROR, errors.join(',')]
        );    
        errors.forEach((error, i) => {
            last_tasks.rows.forEach((row) => {
                if(row.message === error){
                    this.errors.splice(i, 1);
                }
            })
        })
        if(this.errors.length > 0){
            console.log('Notification');
            return await this.notifier.notify(this.task_name, this.cat_name, this.errors, this.alerts, this.infos);
        } 
        console.log('Notification would be redundant. Skipping.... Errors:', errors.length + ',', 'Alerts:', this.alerts.length + ',', 'Infos:', this.infos.length);
    }
    async save(){
        console.log('Saving', this.task_name)
        if(this.task_name === null) throw "Task name cannot be null";
        const task_id = await this.getOrCreate(this.task_name, this.cat_name);
        if(this.errors.length === 0 && this.alerts.length === 0){
            await this.pool.query(
                "INSERT INTO task_status (task, message, type) VALUES ($1, $2, $3)",
                [task_id, "", STATUS_TYPES.SUCCESS]
            );
        } else {
            await this.insertTaskStatuses(task_id, this.errors, STATUS_TYPES.ERROR);
            await this.insertTaskStatuses(task_id, this.alerts, STATUS_TYPES.ALERT);
            await this.insertTaskStatuses(task_id, this.infos, STATUS_TYPES.INFO);
            if (this.errors.length > 0){
                await this.notify(task_id);
            }
        }
        return;
    }
}
