const formidable = require('formidable');
const Transform =  require('stream').Transform;
const {Upload} = require("@aws-sdk/lib-storage");
const {S3Client, S3} = require("@aws-sdk/client-s3");

const parseForm = (request) => {  
    return new Promise((resolve, reject) => {
        let options = {
            maxFileSize: 100 * 1024 * 1024,
            allowEmptyFiles: false,
        }

        const form = formidable(options);

        form.parse(request, (err, fields, files) => {   });

        form.on('error', (err) => {
            reject(err.message);
        });

        form.on('data', (data) => {
            if (data.name == 'successUpload') {
                resolve(data.value);
            }
        });

        form.on('fileBegin', (name, file) => {
            file.open = async function () {
                this._writeStream = new Transform({
                    transform(chunk, encoding, callback) {
                        callback(null, chunk);
                    }
                });

                this._writeStream.on('error', e => {
                    form.emit('error', e);
                })
            }
        })
    });
};

module.exports = parseForm;