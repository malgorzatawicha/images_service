const fetch = require('node-fetch');
const sharp = require('sharp');

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const s3 = new AWS.S3();

const tableName = 'db_images';
const bucket = 'mwicha-s3-bucket';

exports.handler = function(events, context, callback) {
    events.Records.forEach((event) => {
        const dynamodb = event.dynamodb;
        if (event.eventName === 'INSERT') {
            insertRowListener(dynamodb.NewImage)
                .then(v => {
                    return callback(null, v);
                }, callback);

        }
    });
    console.log('Event: ', JSON.stringify(events, null, '\t'));
    console.log('Context: ', JSON.stringify(context, null, '\t'));
    callback(null);
};

const insertRowListener = function (row) {
    const url = row.imageUrl.S;
    const id = row.imageId.S;
    const sizes = row.sizes.L;

    return downloadFileFromExternalResource(url)
        .then((buffer) => {
            let sequence = saveToS3Promise(buffer, id + "/original");

            return sizes.reduce((sequence, size) => {

                return sequence.then(changeSizePromise(buffer, size.S));
//                return sequence.then(changeSizePromise(buffer, size.S))
  //                  .then((miniBuffer) => saveToS3Promise(miniBuffer, id + '/width' + size.S))

            }, sequence);
        });
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

const saveToS3Promise = (buffer, key) => {
    return s3.putObject({
        Bucket: bucket,
        Key: key,
        Body: buffer,
    }).promise();
};

const changeSizePromise = (buffer, size) => {
  return sharp(buffer).resize(parseInt(size), null).toBuffer();
};