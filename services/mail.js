const nodemailer = require("nodemailer");
const config = require("../config/config")

function main(email, error) {

    // async..await is not allowed in global scope, must use a wrapper
    async function send(email, error) {
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        let testAccount = await nodemailer.createTestAccount();

        // create reusable transporter object using the default SMTP transport
        //TODO: remove ethereal settings with actual email and domain
        let transporter = nodemailer.createTransport({
            host: config.smptp.host,
            port: config.smptp.port,
            secure: config.smptp.secure, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user or config.smtp.user
                pass: testAccount.pass // generated ethereal password or config.smtp.password
            }
        });

        var body = `<b>Please Merge latest commit manually to develop. <br><br><br>Error Stack Trace: </b><br><p>${error}</p>`;
        if (typeof (err) === null) {
            body = `<b>Please Merge latest commit manually to develop.`;
        }

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Git Merge Bot 👻" <gitBot@stratbeans.com>', // sender address
            to: email, // list of receivers
            subject: "Automated Merge Failed ✔", // Subject line
            text: "Please Merge latest commit manually to develop", // plain text body
            html: `<b>Please Merge latest commit manually to develop. <br><br><br><b>${error.message}</b>
            <br>Error Stack Trace: <br><p>${error.stack}</p>` // html body
        });

        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    }

    send(email, error).catch(console.error);

}

module.exports.send = main;