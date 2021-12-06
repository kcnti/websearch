const axios = require('axios');
const { getIPRange } = require('get-ip-range');
const dns = require('dns').promises;
const dig = require('node-dig-dns');
const fs = require('fs')

const ips = getIPRange(process.argv[2]);
const total_ips = ips.length;
const path = process.argv[3];

var success = 0;
var failed = 0;

const sendGetRequest = async (ip, path) => {
    var url = 'http://' + ip + path;
    try {
        let resp = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36'
            }
        });

		let content = resp.data || 'none';

        let re = /<title\>.+<\/title\>/;
        var title;
        try {
            title = content.match(re)[0].replace("<title>", "").replace("</title>", "");
        } catch (err) {
            title = ip
        }
        
        var domain;
        try {
            domain = await dns.reverse(ip);
            domain = domain.join(',')
        } catch (e) {
            domain = "NotFound"
        }

        success += 1
        console.log(`[Total: ${success + failed}/${total_ips}] Found: ${url} DNS: ${domain} Title: ${title}`);
        
        fs.appendFile('./result.txt', url+" | DNS: "+domain+" | Title: "+title+"\n", err => {
            if (err) {
                console.error(err)
                return
            }
        })
        
    } catch (err) {
        failed += 1
        // console.log(err)
        // console.log(`[Total: ${success + failed}/${total_ips}] Failed ${url}`);
    }
};

for (let i = 0; i < ips.length; i++) {
    sendGetRequest(ips[i], path)
}
