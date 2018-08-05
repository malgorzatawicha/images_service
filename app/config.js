module.exports = {
    aws_table_name: 'db_images',
    aws_local_config: {
        region: 'eu-west-1',
        endpoint: 'http://database:8000'
    },
    aws_remote_config: {
        region: 'eu-west-1'
    }
};