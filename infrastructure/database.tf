resource "aws_dynamodb_table" "db_images" {
  name = "db_images"
  read_capacity = 1
  write_capacity = 1
  hash_key = "imageId"
  range_key = "imageName"

  attribute {
    name = "imageId"
    type = "S"
  }
  attribute {
    name = "imageName"
    type = "S"
  }

  tags {
    Name = "db_images"
  }
}
