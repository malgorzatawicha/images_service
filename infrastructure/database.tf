resource "aws_dynamodb_table" "db_images" {
  name = "db_images"
  read_capacity = 1
  write_capacity = 1
  hash_key = "imageId"

  attribute {
    name = "imageId"
    type = "S"
  }

  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags {
    Name = "db_images"
  }
}
