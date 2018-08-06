const fetch = require('node-fetch');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const s3 = new AWS.S3();

exports.handler = function(events, context, callback) {
    events.Records.forEach((event) => {
        const dynamodb = event.dynamodb;
        if (event.eventName === 'INSERT') {
            insertRowListener(dynamodb.NewImage, 'mwicha-s3-bucket')
                .then(v => {
                    return callback(null, v);
                }, callback);

        }
    });
    console.log('Event: ', JSON.stringify(events, null, '\t'));
    console.log('Context: ', JSON.stringify(context, null, '\t'));
    callback(null);
};

const insertRowListener = function (row, bucket) {
    const url = row.imageUrl.S;
    const id = row.imageId.S;

    return downloadFileFromExternalResource(url)
        .then(saveBufferToS3(id, bucket));
};

const downloadFileFromExternalResource = function (url) {
  return fetch(url)
      .then((response) => {
          if (response.ok) {
              return response;
          }
          console.log(
              `Failed to fetch ${response.url}: ${response.status} ${response.statusText}`);
      }).then(response => response.buffer());
};

const saveBufferToS3 = function (id, bucket) {
    return (buffer) => {
        return s3.putObject({
            Bucket: bucket,
            Key: id + '/original',
            Body: buffer,
        }).promise()
    }
};
