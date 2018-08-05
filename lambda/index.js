const fetch = require('node-fetch');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const s3 = new AWS.S3();

exports.handler = function(events, context, callback) {
    for (let index in events.Records) {
        const event = events.Records[index];
        const dynamodb = event.dynamodb;
        if (event.eventName === 'INSERT') {
            const url = dynamodb.NewImage.imageUrl.S;
            console.log(url);
            fetch(url).then((response) => {
                if (response.ok) {
                    return response;
                }
                console.log(
                    `Failed to fetch ${response.url}: ${response.status} ${response.statusText}`);
            })
                .then(response => response.buffer())
                .then(buffer => (
                    s3.putObject({
                        Bucket: process.env.BUCKET,
                        Key: dynamodb.NewImage.imageId.S + '_original',
                        Body: buffer,
                    }).promise()
                ))
                .then(v => {console.log('ok'); return callback(null, v)}, callback);

        }
    }
    console.log('Event: ', JSON.stringify(events, null, '\t'));
    console.log('Context: ', JSON.stringify(context, null, '\t'));
    callback(null);
};