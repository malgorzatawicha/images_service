resource "aws_vpc" "images_vpc" {
  cidr_block = "10.0.0.0/16"
  tags {
    Name = "images_vpc"
  }
}
