import Task from './Task.js';
import dotenv from 'dotenv/config';
import axios from 'axios'

export default class HTTPService extends Task {

    constructor(task_name){
        super(task_name, 'HTTP service');
    }

    async get(url){
        return await axios.get(url);
    }
}