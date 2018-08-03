resource "aws_security_group" "images_webserver_sg" {
  name = "images_webserver_sg"
  description = "Allow incoming HTTP connections"

  ingress {
    from_port = 80
    protocol = "tcp"
    to_port = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  vpc_id = "${aws_vpc.images_vpc.id}"

  tags {
    Name = "Images Web Server Security Group"
  }
}

resource "aws_instance" "webserver" {
  ami = "ami-466768ac"
  instance_type = "t1.micro"
  vpc_security_group_ids = ["${aws_security_group.images_webserver_sg.id}"]
  subnet_id = "${aws_subnet.images_public_subnet.id}"
  associate_public_ip_address = true

  tags {
    Name = "Images Web Server"
  }
}