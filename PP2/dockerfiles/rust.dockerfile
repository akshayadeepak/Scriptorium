FROM rust:latest

WORKDIR /

CMD ["./target/release/my_app"]
