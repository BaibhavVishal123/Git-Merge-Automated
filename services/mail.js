const nodemailer = require("nodemailer");
const config = require("../config/config");
var AWS = require('aws-sdk');

function main(user, error) {

    // TEST EMAIL with SES
    async function send(user, error) {
        // Generate test SMTP service account from ethereal.email Only needed if you don't have a real mail account for testing
        let testAccount = await nodemailer.createTestAccount();

        // create reusable transporter object using the default SMTP transport
        //TODO: remove ethereal settings with actual email and domain
        let transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.secure, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user or config.smtp.user
                pass: testAccount.pass // generated ethereal password or config.smtp.password
            }
        });

        let info = await transporter.sendMail({
            from: '"Git Merge Bot 👻" <gitBot@stratbeans.com>', // sender address
            to: user.email, // list of receivers
            subject: "Automated GIT Merge Report ✔", // Subject line
            text: `<b>Please Merge latest commit "${user.message},  ${user.commitId}"  
                manually to up(${config.git["repo-fake"].target})/down stream(${config.git["repo-fake"].source}).  
                <br><br><br><b>${error.message}</b><br><br>Error Stack Trace: <br><p><pre>${error.stack}</pre></p>`,// html body
            html: `<b>Please Merge latest commit "${user.message},  ${user.commitId}"  
                manually to up(${config.git["repo-fake"].target})/down stream(${config.git["repo-fake"].source}).
                <br><br><br><b>${error.message}</b><br><br>Error Stack Trace: <br><p><pre>${error.stack}</pre></p>` // html body
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    async function sendSES(user, error) {
        var ses = new AWS.SES({
            "accessKeyId": config["smtp-ses"].auth.user,
            "secretAccessKey": config["smtp-ses"].auth.password,
            "region": config["smtp-ses"].region
        });
        var eparam = {
            Destination: {
                ToAddresses: [user.email]
            },
            Message: {
                Body: {
                    Html: {
                        Data: `<b>Please Merge latest commit "${user.message},  ${user.commitId}"  
                        manually to (${config.git.repo.target}) from (${config.git["repo-fake"].source}).  
                        <br><br><br><b>${error.message}</b><br><br>Error Stack Trace: <br><p><pre>${error.stack}</pre></p>`
                    },
                    Text: {
                        Data: `<b>Please Merge latest commit "${user.message},  ${user.commitId}"  
                        manually to ${config.git.repo.target}  from (${config.git.repo.source}).  
                        <br><br><br><b>${error.message}</b><br><br>Error Stack Trace: <br><p><pre>${error.stack}</pre></p>`
                    }
                },
                Subject: {
                    Data: "Automated GIT Merge Report ✔",
                }
            },
            Source: '"Git Merge Bot 👻" <gitBot@stratbeans.com>',
            ReplyToAddresses: ["baibhav@stratbeans.com"],
            ReturnPath: "baibhav@stratbeans..com"
        };

        ses.sendEmail(eparam, function (err, data) {
            if (err) console.log(err);
            else console.log(data);
        });
    }

    send(user, error).catch(function (err) {
        console.error(err);
    }, null);

    sendSES(user, error).catch(function (err) {
        console.error(err);
    }, null);

}

module.exports.send = main;