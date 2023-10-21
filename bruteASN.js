const axios = require('axios');
const https = require('https');
const { getIPRange } = require('get-ip-range');
const fs = require('fs')

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
        // console.log(err)
        // failed += 1
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
            // console.log(`[Total: ${success + failed}/${total_ips}] Url:`, 'https://' + ip + path, `Not Found`);
            // console.log(err)
            failed += 1
        }
    }
};

const getIPSubnetsForASN = async () => {
    try {
      // Make a request to the Bgpview API
      const response = await axios.get(`https://api.bgpview.io/asn/${process.argv[2]}/prefixes`);
    //   console.log(response.data)
      var object = {};
      if (response.status === 200) {
        const data = response.data.data;
        if (data.ipv4_prefixes && data.ipv4_prefixes.length > 0) {
          const ipv4Subnets = data.ipv4_prefixes.map((data) => data.prefix);
          return ipv4Subnets;
        }
      } else {
        console.error('Failed to retrieve ASN information');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };


const main = async () => {
    // const ips = await processRanges();
    // total_ips = ips.length;
    // console.log("IPs", total_ips);
  
    // Specify the batch size and delay between batches
    const batchSize = 200; // Adjust the batch size as needed
    const delayMs = 1000; // Adjust the delay as needed (1000ms = 1 second)
  
    console.log('started')
    const ranges = await getIPSubnetsForASN()

    // console.log(ranges)

    const isContained = (x, y) => {
      const xRange = getIPRange(x);
      const yRange = getIPRange(y);
      if (xRange.length > yRange.length) return false;
      return (
        xRange[0] >= yRange[0] && xRange[1] <= yRange[1]
      );
    };

    const filteredRanges = []
  
    for (let i = 0; i < ranges.length; i += 1) {
      const currentRange = ranges[i];
      for (let j = 0; j < ranges.length; j += 1) {
        if (i !== j && isContained(currentRange, ranges[j])) {
          if (!filteredRanges.includes(ranges[j])) filteredRanges.push(ranges[j])
          break;
        }
      }
    }

    // Filter out subnets contained in other subnets
    console.log('Filtered ranges:', filteredRanges);

    // total_ips = filteredRanges.length;
    
    for (let j = 0; j < filteredRanges.length; j += 1) {
      const ips = getIPRange(filteredRanges[j]);
      console.log(`${filteredRanges[j]} (${ips.length})`)
      total_ips = ips.length
      for (let i = 0; i < ips.length; i += batchSize) {
        // console.log(`${i} / ${i+batchSize}`)
        const batch = ips.slice(i, i + batchSize);
        // Create an array of promises for the current batch
        const requestPromises = batch.map((ip) => sendGetRequest(ip, path));
    
        // Execute the requests in parallel for the current batch
        await Promise.all(requestPromises);
    
        // Introduce a delay before the next batch if there are more IP addresses
        if (i + batchSize < ips.length) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
  };
  
main()