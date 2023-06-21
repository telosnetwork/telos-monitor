import HTTPService from "../src/HTTPService.js";
import dotenv from 'dotenv/config';

const SERVICES = process.env.TSK_HTTP_SERVICES.split(',');

class TelosHTTPServices extends HTTPService {
    constructor(){
        super(null, "services");
    }
    async run(){
        for(var i = 0;i<SERVICES.length;i++){
            this.task_name = SERVICES[i].replace('https://', '');
            this.clear();
            try {
                let reply = await this.get(SERVICES[i]);
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