resource "aws_vpc" "images_vpc" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags {
    Name = "Images Vpc"
  }
}

resource "aws_default_security_group" "default" {
  vpc_id = "${aws_vpc.images_vpc.id}"

  ingress {
    protocol  = -1
    self      = true
    from_port = 0
    to_port   = 0
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_subnet" "images_public_subnet1" {
  cidr_block = "10.0.1.0/24"
  vpc_id = "${aws_vpc.images_vpc.id}"
  availability_zone = "eu-west-1a"

  tags {
    Name = "Images Public Subnet"
  }
}

resource "aws_subnet" "images_public_subnet2" {
  cidr_block = "10.0.2.0/24"
  vpc_id = "${aws_vpc.images_vpc.id}"
  availability_zone = "eu-west-1b"

  tags {
    Name = "Images Public Subnet"
  }
}
resource "aws_subnet" "images_private_subnet" {
  cidr_block = "10.0.3.0/24"
  vpc_id = "${aws_vpc.images_vpc.id}"
  availability_zone = "eu-west-1c"

  tags {
    Name = "Images Private Subnet"
  }
}

resource "aws_internet_gateway" "internet_gateway" {
  vpc_id = "${aws_vpc.images_vpc.id}"
  tags {
    Name = "Images Internet Gateway"
  }
}

resource "aws_route_table" "images_public_rt" {
  vpc_id = "${aws_vpc.images_vpc.id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${aws_internet_gateway.internet_gateway.id}"
  }

  tags {
    Name = "Images Public Subnet RT"
  }
}

resource "aws_route_table_association" "images_public1_rt" {
  route_table_id = "${aws_route_table.images_public_rt.id}"
  subnet_id = "${aws_subnet.images_public_subnet1.id}"
}

resource "aws_route_table_association" "images_public2_rt" {
  route_table_id = "${aws_route_table.images_public_rt.id}"
  subnet_id = "${aws_subnet.images_public_subnet2.id}"
}