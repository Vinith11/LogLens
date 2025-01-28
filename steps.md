1. Initialize the project
go mod init gin-project

2. Install Gin
go get -u github.com/gin-gonic/gin

3. create main.go
4. run the project
go run main.go


For live reload

go install github.com/air-verse/air@latest
air init
air


5. Bind 
Linux
GOOS=linux GOARCH=amd64 go build -o loglens-linux-amd64 main.go
./loglens-linux-amd64

Windows
GOOS=windows GOARCH=amd64 go build -o loglens-windows-amd64.exe main.go
loglens-linux-amd64.exe

Mac
GOOS=darwin GOARCH=amd64 go build -o loglens-darwin-amd64 main.go
./loglens-linux-amd64
