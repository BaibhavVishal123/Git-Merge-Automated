var express = require('express');
var routes = express.Router();
const git = require('simple-git/promise');
const fs = require('fs');
const path = require('path');

const config = require("../config/config");

const baseRepo = config.git.repo;
const baseRepoFolder = baseRepo["full-name"];
const branches = baseRepo.source;
const target = baseRepo.target;


const mail = require("../services/mail.js");
const slack = require("../services/slack.js")
routes.post('/webhook', async function (req, res, next) {
  // console.log(JSON.stringify(req.body, null, 2));


  let gitCommitJSON = req.body.push.changes[0].new; //req.body is actual payload

  console.log("reeceived payload ----------------------------", gitCommitJSON);

  // Check if latest commit is on configured source branches
  let execution = false;
  let source = "";
  branches.forEach(element => {
    console.log("Checked branch", gitCommitJSON.name, "against branch ", element);
    if (element == gitCommitJSON.name) {
      execution = true;
      source = element;
    }
  });
  console.log("PUSH Source branch: ", source);
  console.log("execution", execution);
  if (!execution) {
    // exit program
    console.log("will exit this request");
    return res.status(422).send("Invalid Branch");
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

  const remote = `https://bitbucket.org/${baseRepo["full-name"]}`;
  var repoName = (baseRepoFolder.split("/"))[1];
  const folder = path.join(__dirname, repoName);
  var doneCloning = false;
  //doneCloning= true;  

  //abc https://bitbucket.org/stratbeans/atum-barium 
  // /home/ubuntu/baibhav/Git-Merge-Automated/routes/stratbeans/atum-barium
  try {
    if (!doneCloning) {
      console.log("Remote: ", remote, "\n Folder: ", folder, "base: ", baseRepoFolder);
      await Promise.all([git().outputHandler((command, stdout, stderr) => {
        // stdout.pipe(process.stdout);
        stderr.pipe(process.stderr);
      }).clone(remote), setTimeout(function () {
        console.log("waited for 5 sec");
        doneCloning = true;
      }, 5000)]);
    }
    console.log("cloning happened", doneCloning);
    console.log("Cloning done:", fs.existsSync(baseRepoFolder));
    console.log("Checkout Branches in Progress");

    console.log("BASE REPO FOLDER:", baseRepoFolder);
    await Promise.resolve(git(repoName).outputHandler((command, stdout, stderr) => {
      // stdout.pipe(process.stdout);
      console.log(command);
      stderr.pipe(process.stderr);
    }).checkout([source]));

    await Promise.resolve(git(repoName).outputHandler((command, stdout, stderr) => {
      // stdout.pipe(process.stdout);
      console.log(command);
      stderr.pipe(process.stderr);
    }).checkout([target]));

  }
  catch (err) {
    console.log("Deleting Repo due to: ", err);
    await Promise.resolve(deleteFolderRecursive(folder));
    triggerSlackEmail(authorNew, true, err);
    res.status(400).send(err);
  }
  var merge = await new Promise(async (resolve, reject) => {
    try {
      await Promise.resolve(git(repoName).outputHandler((command, stdout, stderr) => {
        // stdout.pipe(process.stdout);
        stderr.pipe(process.stderr);
      }).mergeFromTo(source, target, `-m Merging ${branches[0]} to ${target}`));

      console.log("merged!");

      // TODO: check push
      await Promise.resolve(git(repoName).outputHandler((command, stdout, stderr) => {
        stderr.pipe(process.stderr);
      }).push("origin", target, () => {
        console.log(`${target} pushed`);
      }));
      console.log("pushed!");


      // succes slack noti asynchronous call
      triggerSlackEmail(authorNew, false);
      console.log("Deleting Repo");
      await Promise.resolve(deleteFolderRecursive(folder));
      resolve(true);
    }
    catch (err) {
      // delete repo folder no waiting
      console.log("Deleting Repo due to: ", err);
      await Promise.resolve(deleteFolderRecursive(folder));
      triggerSlackEmail(authorNew, true, err);
      res.status(400).send("Bad Merge  Branches");
      return false;
    }
  })

  console.log("Program Gracefully end: ", merge);

  res.status(200).send('ok');
  //res.render('index', {title: 'WebHook'});
})



async function triggerSlackEmail(user, sendEmail = true, error = "none") {
  if (sendEmail) {
    console.log("send email block--------");
    // send failure email using nodemailer, subject merge error, to latest commits' author
    // console.log("before sending mail error:", error);
    mail.send(user, error);
    //send failure slack notification
    // console.log("after sending mail error:", error);
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
