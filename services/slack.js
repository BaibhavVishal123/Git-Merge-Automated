const config = require("../config/config");
var MY_SLACK_WEBHOOK_URL = config.slack.url;
//'https://myaccountname.slack.com/services/hooks/incoming-webhook?token=myToken';
var slack = require('slack-notify')(MY_SLACK_WEBHOOK_URL);


module.exports.sendFail = function (user, error) {
    console.log("In slack method error:", error);
    var mergeStatus = slack.extend({
        channel: '#mergeIssuesABDevelop',
        icon_emoji: ':computer:',
        username: 'MergeBot'
    });
    mergeStatus({
        text: "Failed Merge: Conflict",
        fields: {
            'Author': user.name,
            'Email': user.email,
            'latestCommitId': user.commitId,
            'commitMessage': user.message,
            'error': error
        }
    }, function (err) {
        if (err) {
            console.log('API error:', err);
        } else {
            console.log('Message received!');
        }
    });
}

module.exports.sendSuccess = function (user) {
    var mergeStatus = slack.extend({
        channel: '#mergeIssuesABDevelop',
        icon_emoji: ':computer:',
        username: 'MergeBot'
    });
    mergeStatus({
        text: "Merge Succeded",
        fields: {
            'Author': user.name,
            'commitMessage': user.message
        }
    }, function (err) {
        if (err) {
            console.log('API error:', err);
        } else {
            console.log('Message received!');
        }
    });
}

// refer this for different slack notification
function examples() {

    slack.bug('Something bad happened!'); // Posts to #bugs by default
    slack.success('Something good happened!'); // Posts to #alerts by default
    slack.alert('Something important happened!'); // Posts to #alerts by default
    slack.note('Here is a note.'); // Posts to #alerts by default

    // Send custom fields which are nicely displayed by the Slack client:
    slack.alert({
        text: 'Current server stats',
        fields: {
            'CPU usage': '7.51%',
            'Memory usage': '254mb'
        }
    });

    // The `fields` object is custom shorthand for the `attachments` array:
    slack.alert({
        text: 'Current server stats',
        attachments: [
            {
                fallback: 'Required Fallback String',
                fields: [
                    { title: 'CPU usage', value: '7.51%', short: true },
                    { title: 'Memory usage', value: '254mb', short: true }
                ]
            }
        ]
    });

    // Everything is overridable:
    slack.send({
        channel: '#myCustomChannelName',
        icon_url: 'http://example.com/my-icon.png',
        text: 'Here is my notification',
        unfurl_links: 1,
        username: 'Jimmy'
    });

    // Roll your own notification type:
    var statLog = slack.extend({
        channel: '#statistics',
        icon_emoji: ':computer:',
        username: 'Statistics'
    });
    statLog({
        text: 'Current server statistics',
        fields: {
            'CPU usage': '7.51%',
            'Memory usage': '254mb'
        }
    });

    // Callbacks and a generic onError function are supported:
    slack.alert('Hello', function (err) {
        if (err) {
            console.log('API error:', err);
        } else {
            console.log('Message received!');
        }
    });
    slack.onError = function (err) {
        console.log('API error:', err);
    };
}