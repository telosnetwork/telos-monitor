import fs from 'fs';
import dotenv from 'dotenv/config';
import childProcess from 'child_process';
import axios from 'axios';
import Endpoints from './src/Endpoints.js';

const TASK_PATH = 'tasks';
<<<<<<< HEAD
var FILES = null;
=======
let FILES = null;
>>>>>>> 847b1ae352b66dd522852d19e006b164bf731a16

// Loops on the tasks using the process's exit callback so they are run one by one
function run(i){
    console.log('RUNNING TASK: ' + FILES[i].replace('.js', ''))

    var file = TASK_PATH + "/" + FILES[i];
    var process = childProcess.fork(file); // Launch task as child process

    var invoked = false;

    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
    });
    process.on('exit', function (code) {
        if (invoked) return;
        console.log(FILES[i].replace('.js', ''), "done with code", code);
        invoked = true;
        i++;
        if(i < FILES.length){ run(i) } else { console.log('DONE') };
        var err = code === 0 ? null : new Error('exit code ' + code);
    });
}

async function main(){
<<<<<<< HEAD
    console.log('Checking endpoints...');
=======
    console.log('Checking endpoints availability...');
>>>>>>> 847b1ae352b66dd522852d19e006b164bf731a16
    let endpoints = new Endpoints();
    await endpoints.checkAllEndpointsAvailability();
    console.log('Running tasks...');
    fs.readdir(TASK_PATH, async (err, files) => {
        FILES = files; // Store the task list in our global variable
        run(0); // Initiate our loop to run the tasks
    });
}

main();