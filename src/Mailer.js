import fs from 'fs';
import dotenv from 'dotenv/config';
import AWS from 'aws-sdk';

const EMAIL_LIST = "../" + process.env.EMAIL_JSON;

export default class Mailer {
    constructor(user, password){
        AWS.config.update({region: 'us-east-1'});
    }
    function getParams(email, task, message){
        return {
            Destination: {
                ToAddresses: emails
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: formatHTMLMessage(task, message)
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: "Task " + task + " encountered an error: " + message
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: "Task " + task + " error"
                }
            },
            Source: 'no-reply@telos.net', /* required */
            ReplyToAddresses: [],
        };
    }
    function formatHTMLMessage(task, message){
        return "<html><body><h1 style='text-align: center'>New alert: "+ task +"</h1><p style='margin-top: 50px'>"+ message +"</p><p style='margin-top: 50px;'><a href='"+ process.env.DASHBOARD_URL +"'>Visit Telos Monitoring</a></p></body></html>"
    }
    async notify(task, message){
        // GET LAST 2 tasks so we can notify only once on down / once on up ?
        if(message == "") return;
        const emails = this.getEmails(task);
        const message = this.formatMessage(task, message);
        this.sendEmail(this.getParams(emails, task, message));
    }
    async function getEmails(task){
        let filtered = [];
        let emails = JSON.parse(fs.readFileSync(EMAIL_LIST));
        emails.forEach(email => {
            if(email.subscriptions.length == 0 || email.subscriptions.include(task)){
                filtered.push(email.email);
            }
        })
        return filtered;
    }
    async function sendEmail(params) {
        var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
        sendPromise.then(function(data) {
            console.log(data.MessageId);
        }).catch(
        function(err) {
            console.error(err, err.stack);
        });
    }
}