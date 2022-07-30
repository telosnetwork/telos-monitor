import fs from 'fs';
import dotenv from 'dotenv/config';
import childProcess from 'child_process';
import axios from 'axios';
import Endpoints from './src/Endpoints.js';

const TASK_PATH = 'tasks';
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
        if(i < FILES.length){ run(i) } else { console.log('DONE') };
        var err = code === 0 ? null : new Error('exit code ' + code);
        // TODO: MAIL ERROR CODE TO ADMIN EMAILS IF EXISTS
    });
}

async function main(){
    console.log('Checking endpoints...');
    let endpoints = new Endpoints();
    await endpoints.checkAllEndpointsAvailability();
    console.log('Running tasks...');
    fs.readdir(TASK_PATH, async (err, files) => {
        FILES = files;
        run(0);
    });
}

main();