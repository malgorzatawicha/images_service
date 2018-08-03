resource "aws_security_group" "images_dbserver_sg" {
  name = "images_dbserver_sg"
  description = "Allow incoming connections to default port"

  ingress {
    from_port = 27017
    protocol = "tcp"
    to_port = 27017
    cidr_blocks = ["${aws_subnet.images_public_subnet.cidr_block}"]
  }

  vpc_id = "${aws_vpc.images_vpc.id}"

  tags {
    Name = "Images Database Server Security Group"
  }
}

resource "aws_instance" "dbserver" {
  ami = "ami-466768ac"
  instance_type = "t1.micro"
  vpc_security_group_ids = ["${aws_security_group.images_dbserver_sg.id}"]
  subnet_id = "${aws_subnet.images_private_subnet.id}"

  tags {
    Name = "Images Database Server"
  }
}