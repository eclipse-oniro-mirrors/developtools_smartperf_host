// Copyright (C) 2022 Huawei Device Co., Ltd.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

//遇到报错请在当前目录下执行这个命令： go mod download golang.org/x/text
import (
	"bufio"
	"bytes"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha512"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"math/big"
	"mime"
	"net"
	"net/http"
	"net/http/cookiejar"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

const HttpPort = 9000

var exPath string
var serveInfo string
var msgPublishData MsgPublishData
var hdcPublicKey string
var hdcPrivateKey *rsa.PrivateKey

// CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build main.go
// CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build main.go
func cors(fs http.Handler, version string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// return if you do not want the FileServer handle a specific request
		r.Header.Add("Cross-Origin-Opener-Policy", "same-origin")
		r.Header.Add("Cross-Origin-Embedder-Policy", "require-corp")
		w.Header().Add("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Add("Cross-Origin-Embedder-Policy", "require-corp")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "x-requested-with, authorization, blade-auth") //*
		w.Header().Set("Access-Control-Allow-Methods", "*")                                           //*
		w.Header().Set("Access-Control-Max-Age", "3600")
		w.Header().Set("data-version", version)
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Pragma", "no-cache")
		fs.ServeHTTP(w, r)
	}
}

func exist(path string) bool {
	_, err := os.Stat(path)
	if err != nil {
		if os.IsExist(err) {
			return true
		}
		return false
	}
	return true
}

func genSSL() {
	if exist("cert/keyFile.key") || exist("cert/certFile.pem") {
		fmt.Println("keyFile.key exists")
		return
	}
	max := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, _ := rand.Int(rand.Reader, max)
	subject := pkix.Name{
		Organization:       []string{"www.smartperf.com"},
		OrganizationalUnit: []string{"ITs"},
		CommonName:         "www.smartperf.com",
	}
	certificate509 := x509.Certificate{
		SerialNumber: serialNumber,
		Subject:      subject,
		NotBefore:    time.Now(),
		NotAfter:     time.Now().AddDate(10, 0, 0),
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		IPAddresses:  []net.IP{net.ParseIP("127.0.0.1")},
	}
	chekDir("cert")
	pk, _ := rsa.GenerateKey(rand.Reader, 1024)
	derBytes, _ := x509.CreateCertificate(rand.Reader, &certificate509, &certificate509, &pk.PublicKey, pk)
	certOut, _ := os.Create("cert/certFile.pem")
	pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes})
	certOut.Close()
	keyOut, _ := os.Create("cert/keyFile.key")
	pem.Encode(keyOut, &pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(pk)})
	keyOut.Close()
}

func genRsa() {
	// generate hdc private key
	privateKey, err := rsa.GenerateKey(rand.Reader, 3072)
	if err != nil {
		fmt.Println("Generate hdc rsa private key failed")
		return
	}
	hdcPrivateKey = privateKey

	// generate hdc public key
	publicKey := &privateKey.PublicKey
	pkixPublicKey, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		fmt.Println(err)
		return
	}
	publicKeyBlock := &pem.Block{
		Type: "PUBLIC KEY",

		Bytes: pkixPublicKey,
	}
	hdcPublicKey = string(pem.EncodeToMemory(publicKeyBlock))
}

func main() {
	port := HttpPort
	isOpen := 1
	flag.IntVar(&port, "p", HttpPort, "The port number used")
	flag.IntVar(&isOpen, "o", 1, "Whether to immediately open the website in your browser; 1 is true; 0 is false")
	flag.Parse()
	if isOpen < 0 || isOpen > 1 {
		fmt.Println("Error: -o must be 0 or 1")
		return
	}
	checkPort(port)
	genSSL()
	genRsa()
	exPath = getCurrentAbPath()
	fmt.Println(exPath)
	go func() {
		version := ""
		readVersion, versionErr := os.ReadFile(exPath + "/version.txt")
		if versionErr != nil {
			version = ""
		} else {
			version = string(readVersion)
		}
		readReqServerConfig()
		mux := http.NewServeMux()
		mime.TypeByExtension(".js")
		mime.AddExtensionType(".js", "application/javascript")
		log.Println(mime.TypeByExtension(".js"))
		mux.HandleFunc("/logger", consoleHandler)
		mux.Handle("/application/upload/", http.StripPrefix("/application/upload/", http.FileServer(http.Dir(filepath.FromSlash(exPath+"/upload")))))
		mux.HandleFunc("/application/download-file", downloadHandler)
		mux.HandleFunc("/application/serverInfo", serverInfo)
		mux.HandleFunc("/application/hdcPublicKey", getHdcPublicKey)
		mux.HandleFunc("/application/encryptHdcMsg", encryptHdcMsg)
		mux.HandleFunc("/application/signatureHdcMsg", signatureHdcMsg)
		mux.HandleFunc("/application/messagePublish", getMsgPublish)
		fs := http.FileServer(http.Dir(exPath + "/"))
		mux.Handle("/application/", http.StripPrefix("/application/", cors(fs, version)))
		go func() {
			ser := &http.Server{
				Addr:    fmt.Sprintf(":%d", port),
				Handler: mux,
			}
			log.Println(fmt.Sprintf("HTTPS[%d]服务启动", port))
			err := ser.ListenAndServeTLS("cert/certFile.pem", "cert/keyFile.key")
			CheckErr(err)
		}()
		go func() {
			ser := &http.Server{
				Addr:    fmt.Sprintf(":%d", port+1),
				Handler: mux,
			}
			log.Println(fmt.Sprintf("HTTP[%d]服务启动", port))
			err := ser.ListenAndServe()
			CheckErr(err)
		}()
		if isOpen == 1 {
			open(fmt.Sprintf("https://localhost:%d/application", port))
		}
	}()
	select {}
}

func getPidByPort(portNumber int) int {
	resPid := -1
	var out bytes.Buffer
	cmdRes := exec.Command("cmd", "/c", fmt.Sprintf("netstat -ano -p tcp | findstr %d", portNumber))
	cmdRes.Stdout = &out
	cmdRes.Run()
	cmdResStr := out.String()
	findStr := regexp.MustCompile(`\s\d+\s`).FindAllString(cmdResStr, -1)
	if len(findStr) > 0 {
		pid, err := strconv.Atoi(strings.TrimSpace(findStr[0]))
		if err != nil {
			resPid = -1
		} else {
			resPid = pid
		}
	}
	return resPid
}

type LoggerReq struct {
	FileName string `json:"fileName"`
	FileSize string `json:"fileSize"`
}

func consoleHandler(w http.ResponseWriter, r *http.Request) {
	chekDir(exPath + "/logger")
	var now = time.Now()
	var fileName = fmt.Sprintf("%d-%d-%d", now.Year(), now.Month(), now.Day())
	dst, err := os.OpenFile(exPath+"/logger/"+fileName, os.O_WRONLY|os.O_CREATE|os.O_APPEND|os.O_SYNC, 0666)
	CheckErr(err)
	contentType := r.Header["Content-Type"]
	if len(contentType) > 0 {
		contentTypeName := contentType[0]
		if strings.HasPrefix(contentTypeName, "application/json") {
			decoder := json.NewDecoder(r.Body)
			var req LoggerReq
			decoder.Decode(&req)
			dst.WriteString(fmt.Sprintf("%s %s (%s M)\n", now.Format("2006-01-02 15:04:05"), req.FileName, req.FileSize))
			fmt.Fprintf(w, fmt.Sprintf("日志写入成功%s", exPath))
		}
	}
}

func serverInfo(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("request_info", serveInfo)
	w.WriteHeader(200)
}

func getHdcPublicKey(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "text/json")
	resp(&w)(true, 0, "success", map[string]interface{}{
		"publicKey": hdcPublicKey,
	})
}

func encryptHdcMsg(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "text/json")
	hdcMsg := r.URL.Query().Get("message")
	if len(hdcMsg) == 0 {
		resp(&w)(false, -1, "Invalid message", nil)
		return
	}
	signatures, err := rsa.SignPKCS1v15(nil, hdcPrivateKey, crypto.Hash(0), []byte(hdcMsg))
	if err != nil {
		resp(&w)(false, -1, "sign failed", nil)
	} else {
		resp(&w)(true, 0, "success", map[string]interface{}{
			"signatures": base64.StdEncoding.EncodeToString(signatures),
		})
	}
}

func signatureHdcMsg(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "text/json")
	hdcMsg := r.URL.Query().Get("message")
	if len(hdcMsg) == 0 {
		resp(&w)(false, -1, "Invalid message", nil)
		return
	}
	hashed := sha512.Sum512([]byte(hdcMsg))
	signatures, err := rsa.SignPKCS1v15(nil, hdcPrivateKey, crypto.SHA512, hashed[:])
	if err != nil {
		resp(&w)(false, -1, "sign failed", nil)
	} else {
		resp(&w)(true, 0, "success", map[string]interface{}{
			"signatures": base64.StdEncoding.EncodeToString(signatures),
		})
	}
}

func parseMsgPublishFile() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("parseMsgPublishFile happen panic, content is %+v\n", r)
		}
	}()
	msgPublishData.Mux.Lock()
	defer msgPublishData.Mux.Unlock()
	exist, err := PathExists(msgPublishData.FilePath)
	if err != nil || !exist {
		return
	}
	buf, err := os.ReadFile(msgPublishData.FilePath)
	if err != nil {
		fmt.Println("read fail", err)
		return
	}
	msgPublishData.Msg = string(buf)
}

func getMsgPublish(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "text/json")
	msgPublishData.Mux.RLock()
	data := msgPublishData.Msg
	msgPublishData.Mux.RUnlock()
	if len(data) == 0 {
		resp(&w)(false, -1, "msg failed", nil)
	} else {
		resp(&w)(true, 0, "success", map[string]interface{}{
			"data": data,
		})
	}
}

type ServerConfig struct {
	ServeInfo      string `json:"ServeInfo"`
	MsgPublishFile string `json:"MsgPublishFile"`
}

type MsgPublishData struct {
	FilePath string
	Msg      string
	Mux      sync.RWMutex
}

func loopUpdateMsgPublishData() {
	loopTime := 5 * time.Minute
	timer := time.NewTimer(5 * time.Second)
	for {
		select {
		case <-timer.C:
			parseMsgPublishFile()
		}
		timer.Reset(loopTime)
	}
}

func readReqServerConfig() {
	serverConfigBuffer, err := os.ReadFile(exPath + "/server-config.json")
	if err != nil {
		return
	}
	var sc ServerConfig
	err = json.Unmarshal(serverConfigBuffer, &sc)
	if err != nil {
		return
	}
	serveInfo = sc.ServeInfo
	msgPublishData.Mux.Lock()
	msgPublishData.FilePath = sc.MsgPublishFile
	msgPublishData.Mux.Unlock()
	go loopUpdateMsgPublishData()
}

func mapToJson(m map[string]interface{}) (string, error) {
	marshal, err := json.Marshal(m)
	if err != nil {
		return "", err
	}
	var str = string(marshal)
	return str, nil
}
func jsonToMap(str string) (map[string]interface{}, error) {
	var m = make(map[string]interface{})
	err := json.Unmarshal([]byte(str), &m)
	if err != nil {
		return nil, err
	}
	return m, nil
}

// MkDir 创建目录
func MkDir(path string) {
	dir := path[0:strings.LastIndex(path, string(os.PathSeparator))] //从文件路径获取目录
	if _, err := os.Stat(dir); err != nil {                          //如果目录不存在，创建目录
		os.MkdirAll(dir, os.ModePerm)
	}
}

func resp(w *http.ResponseWriter) func(bool, int, string, map[string]interface{}) {
	return func(success bool, code int, msg string, obj map[string]interface{}) {
		toJson, err := mapToJson(map[string]interface{}{
			"success": success,
			"code":    code,
			"msg":     msg,
			"data":    obj,
		})
		if err != nil {
			errRes, _ := mapToJson(map[string]interface{}{
				"success": false,
				"code":    -1,
				"msg":     err.Error(),
			})
			fmt.Fprintf(*w, errRes)
		} else {
			fmt.Fprintf(*w, toJson)
		}
	}
}

func get(url string) (*http.Response, error) {
	jar, _ := cookiejar.New(nil)
	c := &http.Client{
		Transport:     &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}},
		CheckRedirect: nil,
		Jar:           jar,
		Timeout:       time.Duration(3600) * time.Second,
	}
	return c.Get(url)
}

func clearOverdueFile() {
	MkDir(filepath.FromSlash(fmt.Sprintf("./upload/")))
	now := time.Now()
	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		return
	}
	var checkDue = func(fileName string) bool {
		f := getSuffixByUrl(fileName)
		parseTime, err := time.ParseInLocation("20060102150405000", f.fileName, loc)
		if err != nil {
			return false
		}
		sub := now.Sub(parseTime)
		if sub.Minutes() > 60 { //bigger than 60 min flag due
			return true
		}
		return false
	}
	slash := filepath.FromSlash(fmt.Sprintf("./upload/"))
	filepath.WalkDir(slash, func(path string, d fs.DirEntry, err error) error {
		if checkDue(d.Name()) {
			fmt.Println(now, "delete->", path, d.Name(), err)
			os.Remove(path)
		}
		return nil
	})
}
func getSuffixByUrl(u string) struct {
	fileName string
	suffix   string
} {
	lastIndex := strings.LastIndex(u, "/")
	var f string
	if lastIndex != -1 {
		f = u[lastIndex:]
	} else {
		f = u
	}
	index := strings.LastIndex(f, ".")
	if index != -1 {
		return struct {
			fileName string
			suffix   string
		}{
			f[0:index],
			f[index:],
		}
	} else {
		return struct {
			fileName string
			suffix   string
		}{
			f,
			"",
		}
	}
}

func downloadHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text/json")
	clearOverdueFile()
	contentType := r.Header["Content-Type"]
	if len(contentType) > 0 {
		contentTypeName := contentType[0]
		if strings.HasPrefix(contentTypeName, "application/x-www-form-urlencoded") {
			url := r.PostFormValue("url")
			res, err := get(url)
			if err != nil {
				resp(&w)(false, -1, err.Error(), nil)
				return
			}
			pth := filepath.FromSlash(fmt.Sprintf("/upload/%s%s", time.Now().Format("20060102150405000"), getSuffixByUrl(url).suffix))
			MkDir("." + pth)
			create, err := os.Create("." + pth)
			if err != nil {
				resp(&w)(false, -1, err.Error(), nil)
				return
			}
			written, err := io.Copy(create, res.Body)
			if err != nil {
				resp(&w)(false, -1, err.Error(), nil)
				return
			}
			fmt.Println(url, written)
			pth = "/application" + pth
			resp(&w)(true, 0, "success", map[string]interface{}{
				"url":  pth,
				"size": written,
			})
			return
		}
	}
	resp(&w)(false, -1, "请求方式错误", nil)
}

func SplitLines(s string) []string {
	var lines []string
	sc := bufio.NewScanner(strings.NewReader(s))
	for sc.Scan() {
		lines = append(lines, sc.Text())
	}
	return lines
}

func readFileFirstLine(path string) string {
	file, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer file.Close()

	readFile := bufio.NewReader(file)
	line, readErr := readFile.ReadString('\n')
	if readErr != nil || io.EOF == err {
		return ""
	}
	return line
}

func PathExists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

func chekDir(path string) {
	_, err := os.Stat(path)
	if err != nil {
		err := os.Mkdir(path, os.ModePerm)
		if err != nil {
			fmt.Printf("mkdir failed![%v]\n", err)
		} else {
			fmt.Printf("mkdir success!\n")
		}
	}
}
func CheckErr(err error) {
	if err != nil {
		log.Panicln(err)
	}
}

func open(url string) error {
	if isWindows() {
		return openUrlWindows(url)
	} else if isDarwin() {
		return openUrlDarwin(url)
	} else {
		return openUrlOther(url)
	}
}

func openUrlWindows(url string) error {
	cmd := "cmd"
	args := []string{"/c", "start", url}
	return exec.Command(cmd, args...).Start()
}
func openUrlDarwin(url string) error {
	var cmd = "open"
	var args = []string{url}
	return exec.Command(cmd, args...).Start()
}
func openUrlOther(url string) error {
	var cmd = "xdg-open"
	var args = []string{url}
	return exec.Command(cmd, args...).Start()
}

func isWindows() bool {
	return runtime.GOOS == "windows"
}
func isDarwin() bool {
	return runtime.GOOS == "darwin"
}

func getCurrentAbPath() string {
	dir := getExecutePath()
	tmpDir, _ := filepath.EvalSymlinks(os.TempDir())
	if strings.Contains(dir, tmpDir) {
		return getCallerPath()
	}
	return dir
}

func getCallerPath() string {
	var pth string
	_, fName, _, ok := runtime.Caller(0)
	if ok {
		pth = path.Dir(fName)
	}
	return pth
}
func getExecutePath() string {
	pth, err := os.Executable()
	if err != nil {
		log.Fatal(err)
	}
	res, _ := filepath.EvalSymlinks(filepath.Dir(pth))
	return res
}

func checkPort(port int) {
	if isWindows() {
		pid := getPidByPort(port)
		if pid != -1 {
			res := exec.Command("cmd", "/c", fmt.Sprintf("taskkill /F /PID %d /T", pid))
			res.Run()
		}
	}
}
