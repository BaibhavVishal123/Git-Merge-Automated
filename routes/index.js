var express = require('express');
var routes = express.Router();
const git = require('simple-git/promise');
const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra')


const baseRepoFolder = "atum-barium";


const mail = require("../services/mail.js");
const slack = require("../services/slack.js")
routes.post('/webhook', async function (req, res, next) {
  console.log(req.body);


  let gitCommitJSON = req.body.push.changes[0].new;

  // Check if latest commit is on release/chromium
  if (gitCommitJSON.name != "release/chromium") {
    // exit program
    res.status(200).send("Invalid Branch");
  }

  let user = gitCommitJSON.target.author.raw;
  // add new logic, if by chance this field gets deprecated by May,2019
  // by default this is a string "name <email>"

  // author e.g: name <name@domain>
  user = user.split(" <");
  let authorNew = {
    "name": user[0],
    "email": user[1].substr(0, (user[1].length - 1)),
    "commitId": gitCommitJSON.target.hash,
    "message": gitCommitJSON.target.message
  }

  const REPO = 'bitbucket.org/stratbeans/atum-barium';
  const remote = `https://${REPO}`;
  const folder = path.join(__dirname, "routes", baseRepoFolder);

  var doneCloning = false;
  fsExtra.ensureDir(folder)
    .then(async () => {
      console.log('Repo Cloned Previously!');
      doneCloning = true;
      await git().
        outputHandler((command, stdout, stderr) => {
          // stdout.pipe(process.stdout);
          stderr.pipe(process.stderr);
        }).fetch("origin");
    })
  if (!doneCloning) {
    doneCloning = await git().
      outputHandler((command, stdout, stderr) => {
        // stdout.pipe(process.stdout);
        stderr.pipe(process.stderr);
      }).clone(remote);
  }

  //promise
  await git(baseRepoFolder).
    outputHandler((command, stdout, stderr) => {
      // stdout.pipe(process.stdout);
      stderr.pipe(process.stderr);
    }).checkout(["release/chromium"]);

  await git(baseRepoFolder).
    outputHandler((command, stdout, stderr) => {
      // stdout.pipe(process.stdout);
      stderr.pipe(process.stderr);
    }).checkout(["develop"]);

  var merge = await new Promise(async (resolve, reject) => {
    try {
      await git(baseRepoFolder).
        outputHandler((command, stdout, stderr) => {
          // stdout.pipe(process.stdout);
          stderr.pipe(process.stderr);
        }).mergeFromTo("release/chromium develop");

      console.log("merged?");

      // TODO: check push
      await git(baseRepoFolder).
        outputHandler((command, stdout, stderr) => {
          stderr.pipe(process.stderr);
        }).
        push("origin", "develop", () => {
          console.log("Develop pushed");
        });

      // succes slack noti asynchronous call
      triggerSlackEmail(authorNew, false);
      resolve(true);
    }
    catch (err) {

      console.error("aaaaa:", err);
      // delete repo folder no waiting
      deleteFolderRecursive(folder);


      /*       fsExtra.removeSync(folder, err => {
              console.error(err)
            }) */

      // asynchronous fail slack+email
      triggerSlackEmail(authorNew);
      return false;
    }
  })

  console.log(merge);

  res.send({ "merge": merge });
  //res.render('index', {title: 'WebHook'});
})



async function triggerSlackEmail(user, sendEmail = true) {
  if (sendEmail) {
    // send failure email using nodemailer, subject merge error, to latest commits' author
    mail.send(user.email);
    //send failure slack notification
    slack.sendFail(user)
  }
  else {
    //send success slack notification using request
    slack.sendSuccess(user);
  }
}


var deleteFolderRecursive = function (path) {
  console.log("Deleting Conflicted Repo");
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

module.exports = routes;
