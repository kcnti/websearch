const axios = require('axios');
const cidrRange = require('cidr-range');
const dns = require('dns');
const fs = require('fs')

const ips = cidrRange(process.argv[2]);
const total_ips = ips.length;
const path = process.argv[3];

console.log(`total: ${total_ips}`)

var success = 0;
var failed = 0;

const sendGetRequest = (ip, path) => {
    var url = 'http://' + ip + path;
    axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36'
        }
    }).then((response) => {
        let content = response.data || 'none';

        let re = /<title\>.+<\/title\>/;
        var title;
        try {
            title = content.match(re)[0].replace("<title>", "").replace("</title>", "");
        } catch (err) {
            title = ip
        }

        // var domain;
        // try {
        //     domain = dns.reverse(ip);
        //     domain = domain.join(',')
        // } catch (e) {
        //     domain = "NotFound"
        // }

        success += 1
        console.log(`[Total: ${success}:${failed}-${success + failed}/${total_ips}] Found: ${url} Title: ${title}`);

        fs.appendFile('./result.txt', url + " | Title: " + title + "\n", err => {
            if (err) {
                console.error(err)
                return
            }
        })
    }).catch((error) => {
        failed += 1
        let content = error.response.data || 'none';

        let re = /<title\>.+<\/title\>/;
        var title;
        try {
            title = content.match(re)[0].replace("<title>", "").replace("</title>", "");
        } catch (err) {
            title = ip
        }
        console.log(`[Total: ${success}:${failed}-${success + failed}/${total_ips}] Found: ${url} Title: ${title} Error ${error.response.status}`);

        fs.appendFile('./result.txt', "Error " + url + " | Title: " + title + "\n", err => {
            if (err) {
                console.error(err)
                return
            }
        })
    });;
};

for (let i = 0; i < ips.length; i++) {
    sendGetRequest(ips[i], path)
    // break
}
