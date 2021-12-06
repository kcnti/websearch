const axios = require('axios');
const { getIPRange } = require('get-ip-range');
const fs = require('fs')

var ips = [];

const path = process.argv[2];

var success = 0;
var failed = 0;
var total = 0;

var gotcha = [];

var newline = fs.appendFileSync('./result.txt', '\nnewline\n')

var ranges = fs.readFileSync('./ranges.txt', 'utf-8');
ranges = ranges.split('\n')

ranges.forEach(range => {
    var ip_arr = getIPRange(range);
    ip_arr.forEach(ip => {
        ips.push(ip)
    });
});

const total_ips = ips.length;

const sendGetRequest = async (ip, path) => {
    try {
        let url = 'http://' + ip + path;
        let resp = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36'
            }
        });

        let re = /<title\>.+<\/title\>/;
        let title = resp.data.match(re)[0].replace("<title>", "").replace("</title>", "") || "no title specific";

        success += 1
        console.log(`[Total: ${success + failed}/${total_ips}] Found: ${url} Title: ${title}`);
        
        fs.appendFile('./result.txt', url+" | Title: "+title+"\n", err => {
            if (err) {
                console.error(err)
                return
            }
        })
        
    } catch (err) {
        failed += 1
    }
};

for (let i = 0; i < ips.length; i++) {
    sendGetRequest(ips[i], path)
}
