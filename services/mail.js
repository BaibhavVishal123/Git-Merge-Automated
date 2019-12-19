
const nodemailer = require("nodemailer");


function main(email) {

    // async..await is not allowed in global scope, must use a wrapper
    async function send(email) {
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        let testAccount = await nodemailer.createTestAccount();

        // create reusable transporter object using the default SMTP transport
        //TODO: remove ethereal settings with actual email and domain
        let transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass // generated ethereal password
            }
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Git Merge Bot 👻" <gitBot@stratbeans.com>', // sender address
            to: email, // list of receivers
            subject: "Automated Merge Failed ✔", // Subject line
            text: "Please Merge latest commit manually to develop", // plain text body
            html: "<b>Please Merge latest commit manually to develop</b>" // html body
        });

        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    }

    send(email).catch(console.error);

}

module.exports.send = main;