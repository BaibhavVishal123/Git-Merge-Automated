var express = require('express');
var routes = express.Router();
const git = require('simple-git/promise');
const fs = require('fs');
const path = require('path');

const config = require("../config/config");

const baseRepoFolder = "atum-barium";
const branches = config.branches.source;
const target = config.branches.target;


const mail = require("../services/mail.js");
const slack = require("../services/slack.js")
routes.post('/webhook', async function (req, res, next) {
  console.log(req.body);


  let gitCommitJSON = req.body.push.changes[0].new;

  // Check if latest commit is on configured source branches
  let execution = false;
  branches.forEach(element => {
    console.log("Checked branch", gitCommitJSON.name, "against branch ", element);
    if (element == gitCommitJSON.name) {
      execution = true;
    }
  });

  if (!execution) {
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
  // check routes?
  const folder = path.join(__dirname, baseRepoFolder);

  var doneCloning = false;
  //doneCloning= true;  
  console.log("cloning will happen", doneCloning);
  if (!doneCloning) {
    doneCloning = await git().
      outputHandler((command, stdout, stderr) => {
        // stdout.pipe(process.stdout);
        stderr.pipe(process.stderr);
      }).clone(remote);
  }

  console.log("Checkout Branches in Progress");
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
    }).checkout([target]);

  var merge = await new Promise(async (resolve, reject) => {
    try {
      await git(baseRepoFolder).
        outputHandler((command, stdout, stderr) => {
          // stdout.pipe(process.stdout);
          stderr.pipe(process.stderr);
        }).mergeFromTo("release/chromium", target, `-m Merging ${branches[0]} to ${target}`);

      console.log("merged!");

      // TODO: check push
      await git(baseRepoFolder).
        outputHandler((command, stdout, stderr) => {
          stderr.pipe(process.stderr);
        }).
        push("origin", target, () => {
          console.log(`${target} pushed`);
        });
      console.log("pushed!");


      deleteFolderRecursive(baseRepoFolder);
      // succes slack noti asynchronous call

      triggerSlackEmail(authorNew, false);
      console.log("Deleting Repo");
      deleteFolderRecursive(folder);
      resolve(true);
    }
    catch (err) {
      // delete repo folder no waiting
      console.log("Deleting Repo due to: ", err);
      deleteFolderRecursive(baseRepoFolder);
      triggerSlackEmail(authorNew, error = err);
      return false;
    }
  })

  console.log(merge);

  res.status(200).send('ok');
  //res.render('index', {title: 'WebHook'});
})



async function triggerSlackEmail(user, sendEmail = true, error = null) {
  if (sendEmail) {
    // send failure email using nodemailer, subject merge error, to latest commits' author
    mail.send(user.email, error);
    //send failure slack notification
    slack.sendFail(user, error)
  }
  else {
    //send success slack notification using request
    slack.sendSuccess(user);
  }
}


var deleteFolderRecursive = function (path) {
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
