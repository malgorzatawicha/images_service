const fetch = require('node-fetch');
const sharp = require('sharp');

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const s3 = new AWS.S3();
const database = new AWS.DynamoDB.DocumentClient();


const tableName = process.env.TABLE;
const bucket = process.env.BUCKET;
const region = process.env.REGION;

exports.handler = function(events, context, callback) {
    events.Records.forEach((event) => {
        const dynamodb = event.dynamodb;
        const imageId = dynamodb.Keys.imageId.S;
        const oldImageSizes = dynamodb.OldImage.sizes.L.map((size) => size.S);

        if (event.eventName === 'INSERT') {
            insertRow(dynamodb.NewImage);
        }
        if (event.eventName === 'REMOVE') {
            removeRow(imageId, oldImageSizes);
        }
        if (event.eventName === 'MODIFY') {
            removeRow(imageId, oldImageSizes);
            insertRow(dynamodb.NewImage);
        }
    });
    console.log('Event: ', JSON.stringify(events, null, '\t'));
    console.log('Context: ', JSON.stringify(context, null, '\t'));
    callback(null);
};


const insertRow = function (row) {
    const url = row.imageUrl.S;
    const id = row.imageId.S;
    const sizes = row.sizes.L;

    const images = {};

    return downloadFileFromExternalResource(url)
        .then((buffer) => {

            let sequence = saveToS3Promise(buffer, id + "/original")
                .then(findSizePromise(buffer))
                .then((metadata) => {
                    images.original = {
                        width: metadata.width,
                        height: metadata.height,
                        url: buildS3Url(id, 'original')
                    };
                })
            ;

            return sizes.reduce((sequence, size) => {

                return sequence.then(changeSizePromise(buffer, size.S))
                    .then(({data, info}) => {
                        images['width' + size.S] = {
                            url: buildS3Url(id, 'width' + size.S),
                            width: info.width,
                            height: info.height
                        };
                        return saveToS3Promise(data, id + '/width' + size.S);
                    })
            }, sequence);
        }).then(() => {
            const params = {
                TableName: tableName,
                Key: {
                    "imageId": id
                },
                UpdateExpression: "set images=:images, imageStatus=:status",
                ConditionExpression: "attribute_exists(imageId)",
                ExpressionAttributeValues: {
                    ":images": images,
                    ":status": 'active'
                }
            };

            database.update(params, function (error, data) {
                if (error) {
                    console.log(error);
                }
            });
        });
};

const removeRow = (id, sizes) => {
    s3.deleteObject({Bucket: bucket, Key: id + '/original'}, function(err, data) {});
    sizes.forEach(function (size) {
        s3.deleteObject({Bucket: bucket, Key: id + '/width' + size.S}, function(err, data) {});
    })
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
        ACL: 'public-read'
    }).promise();
};

const changeSizePromise = (buffer, size) => {
  return () => sharp(buffer).resize(parseInt(size), null)
      .toBuffer({ resolveWithObject: true });
};

const findSizePromise = (buffer) => {
    return () => sharp(buffer).metadata()
};

const buildS3Url = (id, key) => {
    return "http://s3-" + region + ".amazonaws.com/" + bucket + "/" + id + "/" + key
};