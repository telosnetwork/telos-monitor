import Task from "../src/Task.js";
import dotenv from 'dotenv/config';
import axios from 'axios';

const SERVICES = [
    {
        "id": "telos.net",
        "url": 'https://www.telos.net',
    }, {
        "id": "app.telos.nets",
        "url": 'https://app.telos.nets',
    }, {
        "id": "wallet.telos.net",
        "url": 'https://wallet.telos.net',
    }, {
        "id": "explorer.telos.net",
        "url": 'https://explorer.telos.net',
    }, {
        "id": "docs.telos.net",
        "url": 'https://docs.telos.net',
    }
]

class TelosHTTPServices extends Task {
    constructor(){
        super(null, "services");
    }
    async run(){
        for(var i = 0;i<SERVICES.length;i++){
            this.task_name = SERVICES[i].id;
            this.errors = [];
            try {
                let reply = await axios.get(SERVICES[i].url);
                if(reply.status != 200){
                    this.errors.push("Replied with HTTP status " + reply.status)
                }
            } catch (e) {
                this.errors.push(e.message);
            }
            await this.save();
        }
        this.end();
    }
}

let test = new TelosHTTPServices();
test.run();