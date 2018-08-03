resource "aws_vpc" "images_vpc" {
  cidr_block = "10.0.0.0/16"
  tags {
    Name = "Images Vpc"
  }
}

resource "aws_subnet" "images_public_subnet" {
  cidr_block = "10.0.1.0/24"
  vpc_id = "${aws_vpc.images_vpc.id}"
  availability_zone = "eu-west-1a"

  tags {
    Name = "Images Public Subnet"
  }
}

resource "aws_subnet" "images_private_subnet" {
  cidr_block = "10.0.2.0/24"
  vpc_id = "${aws_vpc.images_vpc.id}"
  availability_zone = "eu-west-1b"

  tags {
    Name = "Images Private Subnet"
  }
}