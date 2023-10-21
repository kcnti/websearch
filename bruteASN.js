const axios = require('axios');
const https = require('https');
const { getIPRange } = require('get-ip-range');
const fs = require('fs')
const ip = require('ip')

const agent = new https.Agent({  
  rejectUnauthorized: false
});

const path = process.argv[3];

var success = 0;
var failed = 0;

var total_ips = 0

const sendGetRequest = async (ip, path) => {
    try {
        let url = 'http://' + ip + path;
        let resp = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36'
            },
            httpsAgent: agent
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
        try {
            let url = 'https://' + ip + path;
            let resp = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36'
                },
                httpsAgent: agent
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
            console.log(`[Total: (${success}:${failed}) ${success + failed}/${total_ips}] Url:`, 'https://' + ip + path, `Not Found`);
            failed += 1
        }
    }
};

const getIPSubnetsForASN = async () => {
    try {
      const response = await axios.get(`https://api.bgpview.io/asn/${process.argv[2]}/prefixes`);
      var ipv4Parents = {}
      if (response.status === 200) {
        const data = response.data.data;
        if (data.ipv4_prefixes && data.ipv4_prefixes.length > 0) {
          const ipv4Subnets = data.ipv4_prefixes.map((data) => {
            if (data.parent.prefix !== null) {
              if (ipv4Parents[data.parent.prefix] === undefined) {
                ipv4Parents[data.parent.prefix] = [data.prefix]
              } else {
                ipv4Parents[data.parent.prefix].push(data.prefix)
              }
            }
          });
          return ipv4Parents;
        }
      } else {
        console.error('Failed to retrieve ASN information');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };


const main = async () => {

    const batchSize = 200;
    const delayMs = 1000;
    const filteredRanges = []
  
    const parents = await getIPSubnetsForASN()  

    const findSubnet = (subnets) => {
        const result = [];
        const small = [];
        for (let i = 0; i < subnets.length; i++) {
          const subnetX = subnets[i];
          const rangeX = ip.cidrSubnet(subnetX);
          if (small.includes(subnetX)) continue
      
          for (let j = 0; j < subnets.length; j++) {
            if (i !== j) {
              const subnetY = subnets[j];
              const rangeY = ip.cidrSubnet(subnetY);
      
              if (rangeX.contains(rangeY.firstAddress)) {
                small.push(subnetY)
              }
            }
          }
      
          if (!small.includes(subnetX)) {
            result.push(subnetX);
          }
        }
        return result;
    }

    for (const [k, v] of Object.entries(parents)) {
      const ranges = findSubnet(v)
      ranges.forEach(range => {
        filteredRanges.push(range)
      });
    };

    function calculateTotalIPs(subnets) {
      let totalIPs = 0;
    
      for (const subnet of subnets) {
        const range = ip.cidrSubnet(subnet);
        const start = ip.toLong(range.firstAddress);
        const end = ip.toLong(range.lastAddress);
        totalIPs += end - start + 1;
      }
    
      return totalIPs;
    }
    
    total_ips = calculateTotalIPs(filteredRanges)

    console.log('Filtered ranges:', filteredRanges);
    console.log(`Total IP: ${total_ips}`)

    
    for (let j = 0; j < filteredRanges.length; j += 1) {
      const ips = getIPRange(filteredRanges[j]);
      console.log(`${filteredRanges[j]} (${ips.length})`)
      for (let i = 0; i < ips.length; i += batchSize) {
        const batch = ips.slice(i, i + batchSize);
        const requestPromises = batch.map((ip) => sendGetRequest(ip, path));
    
        await Promise.all(requestPromises);
    
        if (i + batchSize < ips.length) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
  };
  
main()