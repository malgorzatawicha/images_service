const fetch = require('node-fetch');

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

    const params = {
        TableName: tableName,
        Item: {
            imageId: id,
            imageUrl: url,
            imageName: row.imageName.S,
            sizes: sizes,
            status: 'active',
            images: {
                original: {
                    width: 1,
                    height: 2,
                    url: "aaa"
                }
            }
        }
    };

    sizes.reduce(function(params, size) {
        params.images["width" + size] = {
            width: size,
            height: size,
            url: size
        }
    }, params);

    return downloadFileFromExternalResource(url)
        .then((buffer) => {

            let sequence = saveToS3Promise(buffer, id + "/original");

            return sizes.reduce((sequence, size) => {
                return sequence.then(
                    () => {
                        return changeSizePromise(buffer, size.S).then((resizedObject) => {
                            params.images['width' + size.S].width = resizedObject.width;
                            params.images['width' + size.S].height = resizedObject.height;
                            return resizedObject;
                        })
                    })
                    .then((miniBuffer) => {
                        saveToS3Promise(miniBuffer, id + '/width' + size.S);
                        params.images['width' + size.S].url = 'url to s3';
                    });
            }, sequence);
        }).then(() => {
            dynamoDbPut(params);
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
  return 'promise';
};